const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const { findPackagePath, getPackageDetails } = require('../findPackagePath')
const generateModuleSdkSpec = require('./spec')
const { 
    generateSchemaFileCodeForEndpoint, 
    generateNodeFileCodeForEndpoint, 
    createAxiosInstanceFile, 
    generateAuthConfigNodeCodeForEndpoint
} = require('./codegen')

function generateNodesFromSpec({
    specPath = null,
    specType = 'openapi',
    outputPath = null,
    category = null,
    ignore = null
} = {}) {
    if (specType !== 'openapi') {
        console.log('Only OpenAPI specs are supported at the moment. Aborting.')
        return
    }

    const packagePath = findPackagePath()
    const packageDetails = getPackageDetails()

    let spec = null
    try {
        if (specPath) {
            spec = require(path.join(process.cwd(), specPath))
        } else {
            spec = require(path.join(packagePath, 'openapi/spec.json'))
        }
    } catch (e) {
        return console.log('Spec file not found in module directory and not specified either. Aborting.')
    }

    if (!outputPath) {
        outputPath = path.join(packagePath, 'src', 'nodes')
    }

    let ignorePathFile = ''
    if (ignore) {
        ignorePathFile = path.join(process.cwd(), ignore)
    } else {
        ignorePathFile = path.join(packagePath, 'openapi/ignore.json')
    }


    if (!packageDetails['node-red']) {
        packageDetails['node-red'] = { nodes: {} }
    }

    let ignoredPaths = []
    if (fs.existsSync(ignorePathFile)) {
        ignoredPaths = require(ignorePathFile)
    }

    const { endpoints: nodeSpecs, baseUrl } = generateModuleSdkSpec(spec, ignoredPaths)
    const nodeCategory = category || _.startCase(packageDetails.name)

    const authConfigNodeRequired = nodeSpecs.some((nodeSpec) => {
        return Object.values(nodeSpec.actions).some((action) => {
            return action.requiresAuth
        })
    })

    if (authConfigNodeRequired) {
        const configNodeCamelCaseName = `${_.camelCase(packageDetails.name)}Auth`
        const configNodeDir = path.join(outputPath, configNodeCamelCaseName)
        if (!fs.existsSync(configNodeDir)) {
            fs.mkdirSync(configNodeDir)
        }

        fs.writeFileSync(
            path.join(configNodeDir, `${configNodeCamelCaseName}.node.js`),
            generateNodeFileCodeForEndpoint(packageDetails.name, { summary: configNodeCamelCaseName })
        )

        fs.writeFileSync(
            path.join(configNodeDir, `${configNodeCamelCaseName}.schema.js`),
            generateAuthConfigNodeCodeForEndpoint(packageDetails.name)
        )

        fs.copyFileSync(
            path.join(__dirname, '../../templates/node/docs.html'), 
            path.join(configNodeDir, `${configNodeCamelCaseName}.docs.html`
        ))

        packageDetails['node-red'].nodes[configNodeCamelCaseName] = path.join('src/nodes', configNodeCamelCaseName, `${configNodeCamelCaseName}.node.js`)
    }

    nodeSpecs.forEach((nodeSpec) => {

        Object.entries(nodeSpec.actions).forEach(([actionName, action]) => {
            const nodeDir = path.join(outputPath, _.camelCase(action.summary))
            if (!fs.existsSync(nodeDir)) {
                fs.mkdirSync(nodeDir)
            }
            const nodeFileCode = generateNodeFileCodeForEndpoint(packageDetails.name, action)
            const schemaFileCode = generateSchemaFileCodeForEndpoint(
                `${nodeCategory} :: ${_.startCase(nodeSpec.name)}`, 
                action,
                packageDetails.name
            )

            fs.writeFileSync(path.join(nodeDir, `${_.camelCase(action.summary)}.node.js`), nodeFileCode)
            fs.writeFileSync(path.join(nodeDir, `${_.camelCase(action.summary)}.schema.js`), schemaFileCode)
            fs.copyFileSync(path.join(
                __dirname, '../../templates/node/docs.html'), 
                path.join(nodeDir, `${_.camelCase(action.summary)}.docs.html`
            ))

            packageDetails['node-red'].nodes[_.kebabCase(action.summary)] = path.join(
                'src/nodes/',
                _.camelCase(action.summary), 
                `${_.camelCase(action.summary)}.node.js`)
        })
    })


    fs.writeFileSync(path.join(packagePath, 'src/util/axios.js'), createAxiosInstanceFile(baseUrl))
    fs.writeFileSync(path.join(packagePath, 'package.json'), JSON.stringify(packageDetails, null, 4))
}

module.exports = generateNodesFromSpec