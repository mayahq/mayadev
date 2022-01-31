const fs = require('fs')
const path = require('fs')
const axios = require('axios')
const semver = require('semver')
const GitUrlParse = require('git-url-parse')

const { getPackageDetails, findPackagePath } = require('../findPackagePath')
const getModuleById = require('./getModule')
const { API_ROOT } = require('../../constants')

async function createModuleRecord({ version }) {
    const packageJson = getPackageDetails()
    const moduleDetails = packageJson.mayaDetails

    const payload = {...moduleDetails}
    
}