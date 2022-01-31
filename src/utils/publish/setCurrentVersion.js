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

async function setCurrentVersion({ version }) {
    const tokenSpinner = ora('Verifying auth token presence').start()
    const authToken = process.env.MAYA_CMS_TOKEN
    if (!authToken) {
        tokenSpinner.fail('Auth token not found. Please set MAYA_CMS_TOKEN in your environment variables')
        return
    }
    tokenSpinner.succeed('Auth token present')

    version = `v${semver.clean(version)}`
    const moduleSpinner = ora(`Verifying version: ${version}`).start()

    const packageJson = getPackageDetails()
    const mayaDetails = packageJson.mayaDetails
    const moduleId = mayaDetails?.origin?.moduleId
    if (!moduleId) {
        moduleSpinner.fail('Origin is not set for this module. Run "mayadev set-origin" first')
        return
    }

    try {
        const module = await getModuleById(moduleId)
        const availableVersionList = module.versions.map(v => v.version)
        const versionIsValid = availableVersionList.includes(version)
        if (!versionIsValid) {
            moduleSpinner.fail(
                `Version ${version} does not exist for this module. Available versions are: \n${availableVersionList.join('\n')}`
            )
            return
        }
    } catch (e) {
        moduleSpinner.fail(`Module with id ${moduleId} does not exist. Please check your origin.`)
        return
    }

    moduleSpinner.succeed('Version verified')

    const requestSpinner = ora(`Updating version to ${version} in database`).start()
    const request = {
        url: `${API_ROOT}/modules/${moduleId}`,
        method: 'PUT',
        data: {
            currentVersion: version
        },
        headers: {
            Authorization: `Bearer ${authToken}`
        }
    }

    try {
        await axios(request)
        requestSpinner.succeed(`Updated version to ${version} in database`)
    } catch (e) {
        requestSpinner.fail('Failed to update version')
        console.log(e)
    }

}

module.exports = setCurrentVersion