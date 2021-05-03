const path = require('path')
const fs = require('fs')

const { codegen } = require('@mayahq/module-sdk')
const { getPackageDetails, findPackagePath } = require('./findPackagePath')
const { getNameVariations } = require('./strings')

function generateHtml(name) {
    if (name.indexOf('-') >= 0) {
        name = getNameVariations(name).camelCase
    }

    const packageJson = getPackageDetails()
    const packagePath = findPackagePath()
    if (!packageJson.nodepath) {
        throw new Error('Missing key "nodepath" in package.json')
    }
    const targetPath = path.join(packagePath, packageJson.nodepath, `${name}/${name}`)
    const nodeClass = require(`${targetPath}.schema.js`)
    return codegen(nodeClass, `${targetPath}.node.html`)
}

function generateAllHtml() {
    const packageJson = getPackageDetails()
    const packagePath = findPackagePath()
    if (!packageJson.nodepath) {
        throw new Error('Missing key "nodepath" in package.json')
    }

    const nodepath = path.join(packagePath, packageJson.nodepath)
    fs.readdirSync(nodepath).forEach((file) => {
        const targetPath = path.join(nodepath, file, file)
        const nodeClass = require(`${targetPath}.schema.js`)
        codegen(nodeClass, `${targetPath}.node.html`)
    })
}

// generateHtml('test-maya')
// generateAllHtml()

module.exports = {
    generateHtml,
    generateAllHtml
}