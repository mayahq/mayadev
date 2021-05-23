const fs = require('fs')
const Ejs = require('ejs')
const path = require('path')
const beautify = require('js-beautify').js
const { getPackageDetails, findPackagePath } = require('./findPackagePath')
const { getNameVariations } = require('./strings')


function generateCode(templatePath, data) {
    return new Promise((resolve, reject) => {
        Ejs.renderFile(templatePath, data, {}, (err, data) => {
            if (err) {
                reject(err)
            } else {
                const prettyJs = beautify(data, {
                    indent_size: 4, space_in_empty_paren: true
                })
                resolve(prettyJs)
            }
        })
    })
}

async function nodeCodegen({ name, moduleName, isConfig, label }, dirpath) {
    const schemaTemplatePath = path.join(__dirname, '../templates/node/schema.ejs')
    const nodeTemplatePath = path.join(__dirname, '../templates/node/node.ejs')
    const docTemplatePath = path.join(__dirname, '../templates/node/docs.html')

    const names = getNameVariations(name)
    const data = {
        nodeNamePascalCase: names.pascalCase,
        nodeNameKebabCase: names.kebabCase,
        nodeNameCamelCase: names.camelCase,
        moduleName,
        isConfig,
        label
    }
    
    const schemaCode = await generateCode(schemaTemplatePath, data)
    const nodeCode = await generateCode(nodeTemplatePath, data)

    fs.writeFileSync(
        path.join(dirpath, `${data.nodeNameCamelCase}.schema.js`),
        schemaCode
    )

    fs.writeFileSync(
        path.join(dirpath, `${data.nodeNameCamelCase}.node.js`),
        nodeCode
    )

    const docsTemplate = fs.readFileSync(docTemplatePath)
    fs.writeFileSync(
        path.join(dirpath, `${data.nodeNameCamelCase}.docs.html`),
        docsTemplate
    )
}

function addNode({ name }) {
    const packageJson = getPackageDetails()
    const packagePath =findPackagePath()
    const { camelCase } = getNameVariations(name)


    if (!packageJson['node-red']) {
        packageJson['node-red'] = { nodes: {} }
    }

    packageJson['node-red'].nodes[name] = path.join(
        packageJson.nodepath, camelCase, `${camelCase}.node.js`
    )

    fs.writeFileSync(
        path.join(packagePath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    )
}

async function createNode({ name, isConfig= false, label }) {
    if (!label) {
        label = name
    }
    const packageJson = getPackageDetails()
    const packagePath = findPackagePath()

    if (!packageJson.nodepath) {
        throw new Error('Missing key "nodepath" in package.json')
    }
    if (!packageJson.nodeRedModuleName) {
        throw new Error('Missing key "node-red-module-name" in package.json')
    }
    const moduleName = packageJson.nodeRedModuleName
    const nodepath = path.join(packagePath, packageJson.nodepath)
    const { camelCase } = getNameVariations(name)

    const targetDir = path.join(nodepath, camelCase)
    fs.mkdirSync(targetDir, { recursive: true })

    await nodeCodegen({
        name,
        label,
        moduleName,
        isConfig
    }, targetDir)

    addNode({ name })
}

function removeNode({ name, deleteSource }) {
    const packageJson = getPackageDetails()
    const packagePath = findPackagePath()
    const { camelCase } = getNameVariations(name)

    if (!packageJson['node-red'] || !packageJson['node-red'].nodes[name]) {
        return
    }

    const nodes = packageJson['node-red'].nodes
    delete nodes[name]

    if (deleteSource) {
        const targetPath = path.join(packagePath, packageJson.nodepath, camelCase)
        fs.rmSync(targetPath, { recursive: true })
    }

    fs.writeFileSync(
        path.join(packagePath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    )
}

// createNode({
//     name: 'test-maya'
// })

module.exports = {
    createNode,
    nodeCodegen,
    addNode,
    removeNode
}