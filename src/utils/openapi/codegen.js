const _ = require('lodash')
const prettier = require('prettier')

/**
 * @param {string} name name of field
 * @param {import('./types').RequestBodyField} fieldsSpec 
 */
 function generateTypedFieldCode(name, fieldsSpec) {
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
        case 'boolean':
        case 'bool': {
            nodeRedTypes.push('bool')
            defaultType = 'bool'
            break
        }
        case 'array': {
            nodeRedTypes.push('json')
            defaultType = 'json'
            break
        }
    }

    return `
        ${name}: new fields.Typed({
            type: "${defaultType}",
            allowedTypes: ${JSON.stringify(nodeRedTypes)},
            defaultVal: ${
                JSON.stringify(fieldsSpec.default !== undefined 
                    ? fieldsSpec.default : defaultType === 'json' ? [] : 'abc')
            },
            displayName: "${fieldsSpec.title || _.startCase(name)}",
        }),
    `
}


/**
 * 
 * @param {import('./types').NodeApiActionSpec} nodeApiActionSpec 
 */
function generateSchemaFileCodeForEndpoint(category, nodeApiActionSpec, packageName) {
    const authNodeCamelCase = `${_.camelCase(packageName)}Auth`
    const authNodePascalCase = `${_.startCase(packageName).replace(/ /g, '')}Auth`

    const useAuth = nodeApiActionSpec.requiresAuth

    let url = nodeApiActionSpec.path
    if (nodeApiActionSpec.params && Object.keys(nodeApiActionSpec.params).length > 0) {
        Object.keys(nodeApiActionSpec.params).forEach((paramName) => {
            url = url.replace(`{${paramName}}`, `\${vals.${paramName}}`)
        })
    }

    // console.log(nodeApiActionSpec.path, nodeApiActionSpec.queryParams)
    if (nodeApiActionSpec.queryParams && Object.keys(nodeApiActionSpec.queryParams).length > 0) {
        console.log('got queryParams', _.camelCase(nodeApiActionSpec.summary), nodeApiActionSpec.path, nodeApiActionSpec.queryParams)
        const paramObj = {}
        Object.keys(nodeApiActionSpec.queryParams).forEach((paramName) => {
            paramObj[paramName] = `\${vals.${paramName}}`
        })
        let queryString = ''
        // const queryString = new URLSearchParams(paramObj).toString()
        Object.keys(paramObj).forEach(paramName => {
            if (queryString.length === 0) {
                queryString += `${paramName}=\${vals.${paramName}}`
            } else {
                queryString += `&${paramName}=\${vals${paramName}}`
            }
        })
        url += `?${queryString}`
    } 

    const nodeCode = `
        const { Node, Schema, fields } = require("@mayahq/module-sdk");
        const axios = require('../../util/axios')
        ${
            useAuth ? `
                const ${authNodePascalCase} = require('../${authNodeCamelCase}/${authNodeCamelCase}.schema')
            ` : ''
        }

        class ${_.startCase(nodeApiActionSpec.summary).replace(/ /g, '')} extends Node {
            constructor(node, RED, opts) {
                super(node, RED, {
                    ...opts,
                    masterKey: 'eda344e1ab8b9e122aab3350eec33e95802c7fe68aac8ad85c5c64d97e45ef1a'
                })
            }

            static schema = new Schema({
                name: '${_.kebabCase(nodeApiActionSpec.summary)}',
                label: '${_.startCase(nodeApiActionSpec.summary)}',
                category: '${category}',
                isConfig: false,
                fields: {
                    ${useAuth ? `
                        auth: new fields.ConfigNode({ type: ${authNodePascalCase}, displayName: 'Auth' }),
                    ` : ''}
                    ${nodeApiActionSpec.requestBody === undefined ? '' : Object.keys(nodeApiActionSpec.requestBody).map((fieldName) => (
                        generateTypedFieldCode(fieldName, nodeApiActionSpec.requestBody[fieldName])
                    )).join('\n')}
                    ${nodeApiActionSpec.params === undefined ? '' : Object.keys(nodeApiActionSpec.params).map((fieldName) => (
                        generateTypedFieldCode(fieldName, nodeApiActionSpec.params[fieldName])
                    )).join('\n')}
                    ${nodeApiActionSpec.queryParams === undefined ? '' : Object.keys(nodeApiActionSpec.queryParams).map((fieldName) => (
                        generateTypedFieldCode(fieldName, nodeApiActionSpec.queryParams[fieldName])
                    )).join('\n')}
                },
                color: '#37B954'
            })

            async onMessage(msg, vals) {
                this.setStatus('PROGRESS', 'Processing...')

                const request = {
                    url: \`${url}\`,
                    method: '${nodeApiActionSpec.method}',
                    data: {
                        ${nodeApiActionSpec.requestBody === undefined ? '' : Object.keys(nodeApiActionSpec.requestBody).map((fieldName) => (
                            `${fieldName}: vals.${fieldName},`
                        )).join('\n')}
                    },
                    ${
                        useAuth ? `
                        headers: {
                            Authorization: \`apikey \${this.credentials.auth.key}\`
                        }` : ''
                    }
                }

                try {
                    const response = await axios(request)
                    msg.payload = response.data
                    this.setStatus('SUCCESS', 'Done')
                } catch (e) {
                    this.setStatus('ERROR', 'Error:' + e.toString())
                    msg.__isError = true
                    msg.__error = e
                }

                return msg
            }
        }

        module.exports = ${_.startCase(nodeApiActionSpec.summary).replace(/ /g, '')}
    `

    return prettier.format(nodeCode, { 
        parser: 'babel',
        tabWidth: 4
    })
}

function generateNodeFileCodeForEndpoint(packageName, nodeApiActionSpec) {
    const code = `
        const NodeClass = require('./${_.camelCase(nodeApiActionSpec.summary)}.schema')
        const {
            nodefn
        } = require('@mayahq/module-sdk')

        module.exports = nodefn(NodeClass, "${packageName}")
    `

    return prettier.format(code, {
        parser: 'babel',
        tabWidth: 4
    })
}

function createAxiosInstanceFile(baseUrl) {
    const code = `
        const axios = require('axios')

        module.exports = axios.create({
            baseURL: '${baseUrl}'
        })
    `

    return prettier.format(code, {
        parser: 'babel',
        tabWidth: 4
    })
}

function generateAuthConfigNodeCodeForEndpoint(moduleName) {
    const code = `
        const {
            Node,
            Schema,
            fields
        } = require('@mayahq/module-sdk')

        class ${_.startCase(moduleName).replaceAll(' ', '')}Auth extends Node {
            constructor(node, RED, opts) {
                super(node, RED, {
                    ...opts,
                })
            }
        
            static schema = new Schema({
                name: '${_.kebabCase(moduleName)}-auth',
                label: '${_.startCase(moduleName)} :: Auth',
                category: 'config',
                isConfig: true,
                fields: {},
                redOpts: {
                    credentials: {
                        key: new fields.Credential({ type: "str", password: true }),
                    }
                }
        
            })
        
            async onMessage(msg, vals) {}
        }
        
        module.exports = ${_.startCase(moduleName).replaceAll(' ', '')}Auth`

    return prettier.format(code, {
        parser: 'babel',
        tabWidth: 4
    })
}

// const openApiSpec = require(path.join(__dirname, 'test.json'))
// const spec = generateModuleSdkSpec(openApiSpec)
// const nodeCode = generateNode(`Maya :: ${spec[0].name}`, spec[0].actions[4])
// fs.writeFileSync(path.join(__dirname, 'test.js'), nodeCode)

module.exports = {
    generateSchemaFileCodeForEndpoint,
    generateNodeFileCodeForEndpoint,
    createAxiosInstanceFile,
    generateAuthConfigNodeCodeForEndpoint
}