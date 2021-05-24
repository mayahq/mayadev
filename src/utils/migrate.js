const path = require('path')
const fs = require('fs')
const Ejs = require('ejs')
const beautify = require('js-beautify').js
const { getPackageDetails, findPackagePath } = require('./findPackagePath')

function migrate() {
    const packageJson = getPackageDetails()
    const packagePath = findPackagePath()
    if (!packageJson.nodepath) {
        throw new Error('Missing key "nodepath" in package.json')
    }

    const nodepath = path.join(packagePath, packageJson.nodepath)
    fs.readdirSync(nodepath).forEach((file) => {
        const targetPath = path.join(nodepath, file, file)
        const nodeTemplatePath = path.join(__dirname, '../templates/node/node.ejs')

        Ejs.renderFile(nodeTemplatePath, { nodeNameCamelCase: file }, {}, (err, data) => {
            if (err) {
                throw err
            } else {
                const prettyJs = beautify(data, {
                    indent_size: 4, space_in_empty_paren: true
                })
                fs.writeFileSync(
                    `${targetPath}.node.js`,
                    prettyJs
                )
            }
        })
    })
}

module.exports = migrate