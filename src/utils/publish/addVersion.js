const fs = require('fs')
const path = require('path')
const axios = require('axios')
const semver = require('semver')
const GitUrlParse = require('git-url-parse')
const ora = require('ora')

const { getPackageDetails, findPackagePath } = require('../findPackagePath')
const getModuleById = require('./getModule')
const { API_ROOT } = require('../../constants')
const { getNodeDescriptionFromPath } = require('../docgen/utils')
const GitManager = require('./git')

const ORIGIN_NOT_FOUND_MESSAGE = `
Origin ID not found in config. Aborting.
Run: "mayadev set-origin [module-id]" to set an origin first
`

function getDownloadDetailsFromGitUrl(repoUrl) {
    const details = GitUrlParse(repoUrl)
    return {
        site: details.resource,
        user: details.owner,
        repo: details.name
    }
}



async function getAddVersionPayload({ version }) {
    const cleanVersion = `v${semver.clean(version)}`
    // console.log('version:', version)
    // console.log('VERSION:', semver.clean(version))

    // const authToken = process.env.MAYA_CMS_TOKEN
    const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOGQyYjk2OWQ1ODYxZTNiZjI3ODE0OSIsImlhdCI6MTY0MzM1ODY0NCwiZXhwIjoxNjQ1OTUwNjQ0fQ.t5lDV7nejeMPSZUILHmVQexG92a84rYyfNrHqfBWWGw'
    if (!authToken) {
        console.log('Access token not found. Please set it in your environment. Aborting')
        return
    }

    const packagePath = findPackagePath()
    const packageJson = getPackageDetails()

    const originId = packageJson?.mayaDetails?.origin?.moduleId
    if (!originId) {
        console.log(ORIGIN_NOT_FOUND_MESSAGE)
        return
    }

    const moduleAtOrigin = await getModuleById(originId)
    if (!moduleAtOrigin) {
        console.log(`Module with id ${originId} does not exist. Aborting.`)
        return
    }

    const versionExists = moduleAtOrigin.versions.some(v => semver.clean(v.version) === semver.clean(version))
    if (versionExists) {
        console.log(`Version ${version} already exists at origin. Aborting.`)
        return
    }

    const pname = moduleAtOrigin.packageName
    if (pname !== packageJson.name) {
        console.log('Name mismatch: local package name and package name at origin are not the same. Aborting')
        return
    }


    const payload = {
        moduleId: packageJson.mayaDetails.origin.moduleId,
    }

    const data = { 
        version: cleanVersion, 
        configNodes: [], 
        nodes: [] 
    }
    const nodes = packageJson['node-red'].nodes

    Object.entries(nodes).forEach(([name, npath]) => {
        try {
            const schemaPath = path.join(packagePath, npath.replace('node.js', 'schema.js'))
            const htmlPath = path.join(packagePath, npath.replace('node.js', 'node.html'))
            const schema = require(schemaPath).schema

            let description = ''
            try {
                description = getNodeDescriptionFromPath(htmlPath)
            } catch (e) {
                console.log(`Unable to get description for node ${name}. Check its docs.`)
            }

            data.nodes.push({
                name: schema.label,
                slug: schema.name,
                description: description
            })
        } catch (e) {
            console.log(e)
            console.log(`Skipping node ${name} because it is not defined as per module-sdk standards`)
        }
    })

    if (packageJson?.mayaDetails?.type === 'git') {
        const repo = packageJson.mayaDetails.repository
        if (!repo?.url) {
            console.log('Module type is set to git but repository information not found. Aborting')
        }
        data.downloadDetails = getDownloadDetailsFromGitUrl(repo.url)
    }

    payload.data = data

    const request = {
        method: 'PUT',
        url: `${API_ROOT}/modules/addVersion`,
        data: payload,
        headers: {
            Authorization: `Bearer ${authToken}`
        }
    }

    try {
        return request
        // axios(request)
    } catch (e) {
        console.log('Unable to add version:', e)
        return null
    }
}

async function addVersion({ version, message }) {
    const gm = new GitManager({
        baseDir: findPackagePath()
    })

    // Don't let user do anything unless on master branch of the module repo
    const branchSpinner = ora('Checking your branch').start()
    const branch = await gm.getBranch()
    if (branch.current !== 'master') {
        branchSpinner.fail('You are not on master branch. Aborting.')
        return
    }
    branchSpinner.succeed(`You're on master branch`)


    const tagName = `v${semver.clean(version)}`
    const spinner1 = ora(`Adding tag ${tagName} to repository.`).start()

    try {
        await gm.commit(message)
        await gm.addTag(tagName)
        spinner1.succeed(`Added tag ${tagName} to repository.`)
    } catch (e) {
        spinner.fail('Error creating new tag')
        console.log(e)
        return
    }

    const request = await getAddVersionPayload({ version })
    const spinner2 = ora(`Adding version ${tagName} to database`).start()
    try {
        const data = await axios(request)
        spinner2.succeed(`Version ${tagName} added!`)
        return data
    } catch (e) {
        spinner2.fail('Error adding new version to database.')
        console.log(e)
        return null
    }
}


module.exports = addVersion