const path = require('path')
const { localDb } = require('@mayahq/maya-db')
const { getPackageDetails, findPackagePath } = require('./findPackagePath')
const { Tokens } = require('@mayahq/module-sdk')


function setTokens() {
    const packageJson = getPackageDetails()
    const packagePath = findPackagePath()

    const ssvFilePath = path.join(packagePath, packageJson.secureStorageVals)
    const vals = require(ssvFilePath)

    const directory = vals.directory || '.maya'
    const db = localDb({
        encryptionKey: vals.encryptionKey,
        root: path.join(process.env.HOME, directory, 'db')
    })
    db.ensureHierarchy({
        tokens: [{
            modules: [{
                [packageJson.name]: 'ENCRYPTED_BLOCK'
            }],
            runtimeMappings: [{
                [vals.runtime]: 'ENCRYPTED_BLOCK'
            }]
        }]
    })

    db.block(`tokens/runtimeMappings/${vals.runtime}`).set({
        [packageJson.name]: '__mayadev__'
    })

    const tokens = new Tokens({
        mayaRoot: path.join(process.env.HOME, directory),
        masterKey: vals.encryptionKey, 
        _mayaRuntimeId: vals.runtime, 
        modulePackageName: packageJson.name
    })

    tokens.set(vals.values)
        .then(() => console.log('Successfully set tokens'))
}

function getTokens() {
    const packageJson = getPackageDetails()
    const packagePath = findPackagePath()

    const ssvFilePath = path.join(packagePath, packageJson.secureStorageVals)
    const vals = require(ssvFilePath)

    const directory = vals.directory || '.maya'
    const tokens = new Tokens({
        mayaRoot: path.join(process.env.HOME, directory),
        masterKey: vals.encryptionKey, 
        _mayaRuntimeId: vals.runtime, 
        modulePackageName: packageJson.name
    })

    tokens.get()
        .then((tok) => console.log('Got tokens:', tok))
}

module.exports = {
    setTokens,
    getTokens
}