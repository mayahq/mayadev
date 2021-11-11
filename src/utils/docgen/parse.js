const HTMLParser = require('node-html-parser')
const { NodeHtmlMarkdown } = require('node-html-markdown')

/**
 * 
 * @param {HTMLParser.HTMLElement} propNode 
 */
function getPropertyInfoFromNode(propNode) {
    // console.log('PROPNODE 2', propNode.tagName, propNode)
    const propNameNode = propNode.querySelector('span[class="property-name"]')
    if (!propNameNode) {
        throw new Error('Missing property name in one of the properties!')
    }
    const propName = propNameNode.innerText

    let propType = 'Any'
    const propTypeNode = propNode.querySelector('span[class="property-type"]')
    if (propTypeNode) {
        propType = propTypeNode.innerText
    }

    let propDescription = ''
    const nextSibling = propNode.nextElementSibling
    if (nextSibling && nextSibling.tagName.toLowerCase() === 'dd') {
        propDescriptionHTML = nextSibling.innerHTML
        if (propDescriptionHTML) {
            propDescription = NodeHtmlMarkdown.translate(propDescriptionHTML)
        }
    }

    return {
        name: propName,
        type: propType,
        description: propDescription
    }
}

/**
 * 
 * @param {HTMLParser.HTMLElement} docNode 
 */
function getDescriptionSummaryNode(docNode) {
    const descSummaryNode = docNode.querySelector('p[data-type="description-summary"]')
    if (!descSummaryNode) {
        throw new Error('Missing node description summary!')
    }
    return descSummaryNode
}

/**
 * 
 * @param {HTMLParser.HTMLElement} docNode 
 */
function generateDescriptionMarkdown(docNode) {
    const descSummaryNode = getDescriptionSummaryNode(docNode)
    const descSummary = descSummaryNode.innerText
    
    if (descSummary.length > 200) {
        throw new Error('Description summary cannot be more than 200 characters')
    }

    return `---\ndescription: >-\n  ${descSummary}\n---`
}

/**
 * 
 * @param {HTMLParser.HTMLElement} pnode 
 */
function handleP(pnode) {
    const markdownContent = NodeHtmlMarkdown.translate(pnode.innerHTML)
    return `\n${markdownContent}`
}

/**
 * 
 * @param {HTMLParser.HTMLElement} h2node 
 */
function handleH2(h2node) {
    return `\n## ${h2node.innerText}`
}

/**
 * 
 * @param {HTMLParser.HTMLElement} h3node 
 * @returns 
 */
function handleH3(h3node) {
    return `\n### ${h3node.innerText}`
}

function handleList(listNode) {
    const mdList = NodeHtmlMarkdown.translate(listNode.innerHTML)
    return `\n${mdList}`
}

/**
 * 
 * @param {HTMLParser.HTMLElement} dlNode 
 */
function handleDl(dlNode) {
    const children = dlNode.childNodes.filter(n => n.nodeType === 1)
    const total = children.length
    let content = '\n'

    for (let i = 0; i < total; i++) {
        const propNode = children[i]
        if (propNode.tagName.toLowerCase() !== 'dt') {
            throw new Error('Only <dt> and <dd> tags are allowed inside <dl> tags')
        }
        const property = getPropertyInfoFromNode(propNode)
        content += `* ${'`'+ property.name + '`'} (${property.type}) : ${property.description}\n`

        while (i < total-1 && children[i+1].tagName.toLowerCase() !== 'dt') {
            i++
        }
    }

    return content
}

/**
 * 
 * @param {HTMLParser.HTMLElement} node 
 */
function handleNode(node) {
    if (node.nodeType === 3) return
    switch (node.tagName.toUpperCase()) {
        case 'P': return handleP(node)
        case 'H2': return handleH2(node)
        case 'H3': return handleH3(node)
        case 'DL': return handleDl(node)
        case 'UL': return handleList(node)
        case 'OL': return handleList(node)
        default: return ''
    }
}

/**
 * 
 * @param {String} nodeName 
 * @param {String} htmlContent 
 */
function getMarkdownDocs(nodeName, htmlContent) {
    const dom = HTMLParser.parse(htmlContent)
    const docNodeHTML = dom.querySelector('script[data-help-name]').innerHTML

    const docNode = HTMLParser.parse(`<html>${docNodeHTML}</html>`)
    let currentNode = getDescriptionSummaryNode(docNode)

    let markdownContent = ''
    markdownContent += generateDescriptionMarkdown(docNode)
    markdownContent += `\n# ${nodeName}`

    while (currentNode.nextElementSibling) {
        const node = currentNode.nextElementSibling
        // console.log(node)
        markdownContent += handleNode(node)
        currentNode = node
    }

    return markdownContent
}

module.exports = getMarkdownDocs

