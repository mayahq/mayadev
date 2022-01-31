const fs = require('fs')
const path = require('path')

const { getPackageDetails, findPackagePath } = require('../findPackagePath')
const getModuleById = require('./getModule')

async function setOrigin(id) {
    const packagePath = findPackagePath()
    const packageJson = getPackageDetails()

    const mayaModule = await getModuleById(id)
    if (!mayaModule) {
        throw new Error(`Module with id ${id} does not exist`)
    }

    packageJson.mayaDetails.origin = { moduleId: id }
    
    fs.writeFileSync(
        path.join(packagePath, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    )

    console.log('Origin added:', mayaModule.packageName)
}

module.exports = setOrigin