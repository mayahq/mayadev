const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const { findPackagePath, getPackageDetails } = require('../findPackagePath')
const generateModuleSdkSpec = require('./spec')
const { generateSchemaFileCodeForEndpoint, generateNodeFileCodeForEndpoint } = require('./codegen')

function generateNodesFromSpec({
    specPath,
    specType = 'openapi',
    outputPath = null
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

    const spec = require(path.join(process.cwd(), specPath))
    const moduleSdkSpec = generateModuleSdkSpec(spec)

    moduleSdkSpec.forEach((nodeSpec) => {
        console.log(nodeSpec.name)
        const nodeDir = path.join(outputPath, _.camelCase(nodeSpec.name))
        if (!fs.existsSync(nodeDir)) {
            fs.mkdirSync(nodeDir)
        }

        const schemaFilePath = path.join(nodeDir, `${_.camelCase(nodeSpec.name)}.schema.js`)
        const nodeFilePath = path.join(nodeDir, `${_.camelCase(nodeSpec.name)}.node.js`)

        console.log('schema', schemaFilePath)
        console.log('node', nodeFilePath)

        fs.writeFileSync(
            schemaFilePath,
            generateSchemaFileCodeForEndpoint(nodeSpec)
        )

        fs.writeFileSync(
            nodeFilePath,
            generateNodeFileCodeForEndpoint(packageDetails.name, nodeSpec)
        )

        fs.copyFileSync(path.join(__dirname, '../../templates/node/docs.html'), path.join(nodeDir, `${_.camelCase(nodeSpec.name)}.docs.html`))
        
        packageDetails['node-red']['nodes'][_.kebabCase(nodeSpec.name)] = `src/nodes/${_.camelCase(nodeSpec.name)}/${_.camelCase(nodeSpec.name)}.node.js`
    })

    fs.writeFileSync(path.join(packagePath, 'package.json'), JSON.stringify(packageDetails, null, 4))
}

module.exports = generateNodesFromSpec