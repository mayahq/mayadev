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
    specPath,
    specType = 'openapi',
    outputPath = null,
    category = null
} = {}) {
    if (specType !== 'openapi') {
        console.log('Only OpenAPI specs are supported at the moment. Aborting.')
        return
    }

    if (!specPath) {
        console.log('No spec path provided. Aborting.')
        return
    }

    const packagePath = findPackagePath()
    const packageDetails = getPackageDetails()

    if (!outputPath) {
        outputPath = path.join(packagePath, 'src', 'nodes')
    }

    if (!packageDetails['node-red']) {
        packageDetails['node-red'] = { nodes: {} }
    }

    const spec = require(path.join(process.cwd(), specPath))
    const { endpoints: nodeSpecs, baseUrl } = generateModuleSdkSpec(spec)
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