const path = require('path')
const fs = require('fs')

function findPackagePath() {
    let packagePath = process.cwd()
    
    while (packagePath !== '/') {
        const exists = fs.readdirSync(packagePath).some((file) => file === 'package.json')
        if (exists) {
            return path.resolve(packagePath)
        }
        packagePath = path.join(packagePath, '..')
    }

    throw new Error(`You don't seem to be in a node project`)
}

function getPackageDetails() {
    const packagePath = findPackagePath()
    return require(path.join(packagePath, 'package.json'))
}

module.exports = {
    findPackagePath,
    getPackageDetails
}