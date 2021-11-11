const fs = require('fs')
const path = require('path')
const { findPackagePath, getPackageDetails } = require("../findPackagePath")
const getMarkdownDocs = require('./parse')

function headingCase(kebabCaseString) {
    return kebabCaseString
        .split('-')
        .map(part => `${part[0].toUpperCase()}${part.substring(1).toLowerCase()}`)
        .join(' ')
}

function generateMdDocs(targetFolder, ignoreErrors = false) {
    const packagePath = findPackagePath()
    const packageJson = getPackageDetails()

    if (!packageJson['node-red'] || !packageJson['node-red'].nodes) {
        throw new Error('There are no node-red nodes defined in this module')
    }

    const mdocs = {}
    const nodes = packageJson['node-red'].nodes
    Object.entries(nodes).forEach(([name, npath]) => {
        const nodeHtmlPath = path.join(packagePath, npath.replace('.js', '.html'))
        const finalFileName = name

        const nodeHtmlContent = fs.readFileSync(nodeHtmlPath).toString()

        try {
            const markdownDocs = getMarkdownDocs(
                headingCase(name),
                nodeHtmlContent
            )
    
            mdocs[finalFileName] = markdownDocs
        } catch (e) {
            if (ignoreErrors) {
                console.log('Failed to generate docs for', name)
            } else {
                throw new Error(`Doc generation failed for ${name}\nUnderlying error: ${e.toString()}`)
            }
        }
    })

    const docsFolder = path.join(targetFolder, packageJson.name)
    fs.mkdirSync(docsFolder, { recursive: true })
    Object.entries(mdocs).forEach(([filename, mdDocs]) => {
        fs.writeFileSync(path.join(docsFolder, `${filename}.md`), mdDocs)
        console.log('Generated docs for', filename)
    })

    if (Object.keys(mdocs).length !== Object.keys(nodes).length) {
        console.log('Doc generation for some nodes failed. Run this command without the "-i" flag for more details')
    }

    console.log('Done!')
}

module.exports = generateMdDocs