const fs = require('fs')
const HTMLParser = require('node-html-parser')

function getNodeDescriptionFromPath(path) {
    try {
        const htmlContent = fs.readFileSync(path).toString()
        const dom = HTMLParser.parse(htmlContent)
        
        const docNodeHTML = dom.querySelector('script[data-help-name]').innerHTML
        const docNode = HTMLParser.parse(`<html>${docNodeHTML}</html>`)
    
        const description = docNode.querySelector('p[data-type="description-summary"]').innerText
        return description
    } catch (e) {
        return null
    }
}

module.exports = {
    getNodeDescriptionFromPath
}