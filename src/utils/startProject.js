const axios = require('axios')
const inquirer = require('inquirer')
const fs = require('fs')
const ora = require('ora')
const validUrl = require('valid-url')
const path = require('path')
const SearchPrompt = require('inquirer-search-list')

const { exec } = require('child_process')
const { isKebabCase } = require('./strings')

inquirer.registerPrompt('search-list', SearchPrompt)
const API_ROOT = 'http://localhost:5000'

function setupProject(config) {
    return new Promise((resolve, reject) => {
        fs.mkdirSync(
            path.join(config.moduleName, 'src/nodes'),
            { recursive: true }
        )
        let packageJson = require('../templates/project/package-temp.json')
        const repoUrl = config.repositoryUrl
        const repository = {
            type: 'git',
            url: `git+${repoUrl}${repoUrl.indexOf('.git') > 0 ? '' : '.git'}`
        }
    
        packageJson = {
            ...packageJson,
            name: config.pName,
            version: config.version,
            description: config.description,
            author: config.author,
            mayaDetails: {
                name: config.moduleName,
                version: config.version,
                description: config.description,
                author: config.author,

                type: config.type,
                needsUserProfile: config.needsUserProfile,
                configType: config.configType,
                thumbnail: config.thumbnail,
                repository: repository
            },
            repository: repository,
            homepage: `${repoUrl}#readme`,
            nodeRedModuleName: config.moduleName
        }
    
        fs.writeFileSync(
            path.join('.', config.moduleName, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        )
    
        exec('npm install', {
            cwd: path.resolve(path.join('.', config.moduleName))
        }, (err, stdout, stderr) => {
            if (!err) {
                resolve()
            } else {
                reject(err)
            }
        })
    })

}

async function getConfigTypes() {
    try {
        const response = await axios.get(`${API_ROOT}/api/v2/configurationTypes/summarized`)
        const configTypesList = response.data.results.map(ct => ({
            name: ct.name,
            value: {
                name: ct.name,
                oid: ct._id
            }
        }))
        const configTypes = [{
            name: '<SELECT_LATER>',
            value: { name: '', oid: '<SELECT_LATER>' }
        }].concat(configTypesList)
        return configTypes
    } catch (e) {
        console.log('Error:', e)
        return [{
            name: '<SELECT_LATER>',
            value: { name: '', oid: '<SELECT_LATER>' }
        }]
    }
}

// getConfigTypes()

const setupCli = () => {
    inquirer.prompt([
        {
            name: 'moduleName',
            type: 'input',
            message: 'Module name:',
            validate: function(input) {
                if (isKebabCase(input)) {
                    return true
                } else {
                    return 'Module name must be in kebab-case :)'
                }
            }
        },
        {
            name: 'pName',
            type: 'input',
            message: 'Package name (must be unique):'
        },
        {
            name: 'description',
            type: 'input',
            message: 'Description:',
            default: 'Maya module'
        },
        {
            name: 'version',
            type: 'input',
            message: 'version',
            default: '1.0.0'
        },
        {
            name: 'repositoryUrl',
            type: 'input',
            message: 'Repository URL:',
            default: '',
            validate: function(input) {
                if (input === '' || validUrl.isUri(input)) {
                    return true
                } else {
                    return 'Enter a valid url pls'
                }
            }
        },
        {
            name: 'author',
            type: 'input',
            message: 'Author:',
            default: ''
        },
        {
            name: 'type',
            type: 'list',
            message: 'How would you like to host your module?',
            choices: [{ name: 'git', value: 'git' }, { name: 'npm', value: 'npm' }],
            default: 0
        },
        {
            name: 'needsUserProfile',
            type: 'confirm',
            message: 'Will your module use a config profile?',
            default: false,
        },
        {
            name: 'configType',
            type: 'search-list',
            message: 'Which config profile do you want to use? You can search:',
            when: function(answers) {
                return answers.needsUserProfile
            },
            choices: async function() {
                return await getConfigTypes()
            }
        },
        {
            name: 'thumbnail',
            type: 'input',
            message: "Thumbnail URL for your module's icon on the Maya store:",
            default: '',
            validate: function(input) {
                if (input === '' || validUrl.isUri(input)) {
                    return true
                } else {
                    return 'Enter a valid url pls'
                }
            }
        }
    ]).then((answers) => {
        const spinner = ora('Setting up the project').start()
        setupProject(answers)
            .then(() => spinner.succeed('Done!'))
            .catch((e) => console.log('Bruh', e))
    })
}

module.exports = setupCli