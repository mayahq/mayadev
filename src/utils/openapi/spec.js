const path = require('path')
const _ = require('lodash')

/**
 * 
 * @param {any} openApiSpec The OpenAPI spec of the API to generate the module for
 * @returns {import('./types').NodeApiSpec[]}
 */
function generateModuleSdkSpec(openApiSpec, ignoredPaths = []) {
    const groups = {}

    Object.keys(openApiSpec.paths).forEach((path) => {
        if (ignoredPaths.includes(path)) {
            return
        }

        const endpointSpec = openApiSpec.paths[path]
        Object.keys(endpointSpec).forEach((method) => {
            const methodSpec = endpointSpec[method]
            if (!methodSpec.tags) {
                console.log(`No tags found for ${method} ${path}. Skipping.`)
            }
            const tag = methodSpec.tags[0]
            // console.log(methodSpec)
            if (!groups[tag]) {
                groups[tag] = []
            }
            groups[tag].push({
                path,
                method,
                methodSpec
            })
        })
        // generateNodeForEndpoint(path, endpointSpec)
    })

    /**
     * @type {import('./types').ModuleSpec[]}
     */
    const spec = {
        baseUrl: '',
        endpoints: []
    }

    Object.keys(groups).forEach((nodeName) => {
        actions = groups[nodeName]

        /**
         * @type {import('./types').NodeApiSpec}
         */
        const nodeApiSpec = {
            name: nodeName,
            actions: []
        }

        actions.forEach((action, idx) => {
            /**
             * @type {import('./types').NodeApiActionSpec}
             */
            const nodeApiActionSpec = {
                path: action.path,
                method: action.method,
                summary: action.methodSpec.summary,
                id: idx,
                requiresAuth: !!action.methodSpec.security
            }

            const openApiRequestBody = action.methodSpec.requestBody

            let body = null

            if (openApiRequestBody && openApiRequestBody.content) {
                const openApiReqBodyData = 
                    openApiRequestBody.content['application/json'] || 
                    openApiRequestBody.content['multipart/form-data']

                if (openApiReqBodyData?.schema.$ref) {
                    const schemaPath = openApiReqBodyData.schema.$ref.replace('#/', '').replaceAll('/', '.')
                    const requestBodySpec = _.get(openApiSpec, schemaPath)
                    body = requestBodySpec
                } else {
                    body = openApiReqBodyData
                }

                nodeApiActionSpec.requestBody = body.properties
                
                // Cleanup for fastapi backend. Smh.
                if (openApiRequestBody.content['multipart/form-data']) {
                    if (nodeApiActionSpec.requestBody.file) {
                        delete nodeApiActionSpec.requestBody.file
                    }

                    if (nodeApiActionSpec.requestBody.files) {
                        delete nodeApiActionSpec.requestBody.files
                    }
                }
            }

            const openApiUrlParams = action.methodSpec.parameters
            
            if (Array.isArray(openApiUrlParams)) {
                const params = {}
                const queryParams = {}
                const headers = {}
                openApiUrlParams.forEach(param => {
                    const schema = param.schema
                    let paramSchema = param.schema
                    if (schema.$ref) {
                        const schemaPath = schema.$ref.replace('#/', '').replaceAll('/', '.')
                        paramSchema = _.get(openApiSpec, schemaPath)
                    }

                    if (param.in === 'path') {
                        params[param.name] = paramSchema
                    } else if (param.in === 'query') {
                        queryParams[param.name] = paramSchema
                    } else if (param.in === 'header') {
                        headers[param.name] = paramSchema
                    }
                })

                nodeApiActionSpec.params = params
                nodeApiActionSpec.queryParams = queryParams
                nodeApiActionSpec.headers = headers

                if (headers.user) {
                    nodeApiActionSpec.requiresAuth = true
                }
            }


            nodeApiSpec.actions.push(nodeApiActionSpec)
        })

        spec.endpoints.push(nodeApiSpec)
    })


    const servers = openApiSpec.servers
    if (servers) {
        let url = 'http://localhost:8000'
        const productionServer = servers.find(server => server.description.includes('production'))
        if (!productionServer && servers.length > 0) {
            url = servers[0].url
        } else {
            url = productionServer.url
        }

        spec.baseUrl = url
    }


    return spec
}

// const openApiSpec = require(path.join(__dirname, 'spec.json'))
// const ignoredPaths = require(path.join(__dirname, 'ignore.json'))
// const specs = generateModuleSdkSpec(openApiSpec, ignoredPaths)
// console.log(JSON.stringify(specs, null, 2))

module.exports = generateModuleSdkSpec