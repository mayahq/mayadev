const inquirer = require('inquirer')
const fs = require('fs')
const ora = require('ora')
const validUrl = require('valid-url')
const path = require('path')

const { exec } = require('child_process')
const { isKebabCase } = require('./strings')


function setupProject(config) {
    return new Promise((resolve, reject) => {
        fs.mkdirSync(
            path.join(config.moduleName, 'src/nodes'),
            { recursive: true }
        )
        let packageJson = require('../templates/project/package-temp.json')
        const repoUrl = config.repositoryUrl
    
        packageJson = {
            ...packageJson,
            name: config.moduleName,
            version: config.version,
            description: config.description,
            author: config.author,
            repository: {
                type: 'git',
                url: `git+${repoUrl}${repoUrl.indexOf('.git') > 0 ? '' : '.git'}`
            },
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
        }
    ]).then((answers) => {
        const spinner = ora('Setting up the project').start()
        setupProject(answers)
            .then(() => spinner.succeed('Done!'))
            .catch((e) => console.log('Bruh', e))
    })
}

module.exports = setupCli