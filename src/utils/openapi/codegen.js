const path = require('path')
const _ = require('lodash')
const fs = require('fs')
const dedent = require('dedent-js')
const beautify = require('js-beautify')
const prettier = require('prettier')
const generateModuleSdkSpec = require('./spec')

/**
 * 1. The first tag of an endpoint will be used to group the node
 */

/**
 * @param {string} name name of field
 * @param {import('./types').RequestBodyField} fieldsSpec 
 */
function generateTypedFieldCode(id, name, fieldsSpec) {
    const nodeRedTypes = ['msg', 'flow', 'global']
    let defaultType = 'str'

    switch (fieldsSpec.type) {
        case 'string': {
            nodeRedTypes.push('str')
            defaultType = 'str'
            break
        }
        case 'integer': {
            nodeRedTypes.push('num')
            defaultType = 'num'
            break
        }
        case 'bool': {
            nodeRedTypes.push('bool')
            defaultType = 'bool'
            break
        }
    }

    return `
        ${name}_${id}: new fields.Typed({
            type: "${defaultType}",
            allowedTypes: ${JSON.stringify(nodeRedTypes)},
            defaultVal: "abc",
            displayName: "${fieldsSpec.title}",
        }),
    `
}

/**
 * 
 * @param {import('./types').NodeApiActionSpec} action 
 */
function generateCodeSnippetsForAction(action) {
    const fieldsCode = `
        ${action.requestBody === undefined ? '' : Object.keys(action.requestBody).map((fieldName) => (
            generateTypedFieldCode(action.id, fieldName, action.requestBody[fieldName])
        )).join('\n')}
        ${action.params === undefined ? '' : Object.keys(action.params).map((fieldName) => (
            generateTypedFieldCode(action.id, fieldName, action.params[fieldName])
        )).join('\n')}
    `

    let url = action.path
    action.params && Object.keys(action.params).forEach((paramName) => {
        url.replace(`{${paramName}}`, `\${vals.action.childValues${paramName}_${action.id}}`)
    })

    const actionCode = `
        if (vals.action.selected = "${_.snakeCase(action.summary)}") {
            requestConfig = {
                url: "${url}",
                method: "${action.method}",
                data: {
                    ${action.requestBody === undefined ? '' : Object.keys(action.requestBody).map((fieldName) => (
                        `${fieldName}: vals.action.childValues.${fieldName}_${action.id},`
                    )).join('\n')}
                }
            }
        }
    `

    return { fieldsCode, actionCode }
}

/**
 * 
 * @param {import('./types').NodeApiSpec} nodeApiSpec 
 */
function generateFields(nodeApiSpec) {
    const optionNameMap = {}
    nodeApiSpec.actions.forEach((action) => {
        optionNameMap[_.snakeCase(action.summary)] = action.summary
    })

    const fields = `
        action: new fields.SelectFieldSet({
            optionNameMap: ${JSON.stringify(optionNameMap)},
            fieldSets: {\
                ${nodeApiSpec.actions.map((action) => {
                    return `${_.snakeCase(action.summary)}: {
                        ${generateCodeSnippetsForAction(action).fieldsCode}
                    }`
                })}
            }
        }),
    `

    return fields
}

function generateOnMessageCode(nodeApiSpec) {
    return `
        this.setStatus('PROGRESS', 'Making request...')
        let requestConfig = {}

        ${nodeApiSpec.actions.map((action) => {
            return generateCodeSnippetsForAction(action).actionCode
        }).join('\n')}

        try {
            const response = await axios(requestConfig)
            msg.payload = response.data
            this.setStatus('SUCCESS', 'Done')
        } catch (e) {
            console.log('There was an error making the request:', e)
            this.setStatus('ERROR', 'There was an error making the request:' + e.toString())
        }
        return msg
    `
}

/**
 * 
 * @param {string} path Path where the folder containing node code will be saved 
 * @param {import('./types').NodeApiSpec} nodeApiSpec Spec for the node
 */
 function generateNodeCodeForEndpoint(nodeApiSpec) {
    const code = `
        const {
            Node,
            Schema,
            fields
        } = require('@mayahq/module-sdk')

        class ${_.startCase(nodeApiSpec.name).replace(/ /g, '')} extends Node {
            constructor(node, RED, opts) {
                super(node, RED, {
                    ...opts,
                    masterKey: 'eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a'
                })
            }

            static schema = new Schema({
                name: '${_.kebabCase(nodeApiSpec.name)}',
                label: '${_.startCase(nodeApiSpec.name)}',
                category: 'Maya',
                isConfig: false,
                fields: {
                    ${generateFields(nodeApiSpec)}
                },
                color: '#37B954'
            })

            async onMessage(msg, vals) {
                ${generateOnMessageCode(nodeApiSpec)}
            }
        }
    `

    // return beautify(dedent(code), {
    //     indent_size: 4, space_in_empty_paren: true
    // })

    return prettier.format(code, { 
        parser: 'babel',
        tabWidth: 4
    })

    // return dedent(code)
}

const openApiSpec = require(path.join(__dirname, 'test.json'))
const spec = generateModuleSdkSpec(openApiSpec)
// const fields = generateFields(spec[0])

const code = generateNodeCodeForEndpoint(spec[0])

fs.writeFileSync(path.join(__dirname, 'test.js'), code)