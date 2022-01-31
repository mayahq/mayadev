const semver = require('semver')
const ora = require('ora')

const { findPackagePath } = require('../findPackagePath')
const GitManager = require('./git')

async function pushToVersion({ version, message }) {
    const tagName = `v${semver.clean(version)}`
    const gm = new GitManager({
        baseDir: findPackagePath()
    })

    // Don't let user do anything unless on master branch of the module repo
    const branchSpinner = ora('Checking your branch').start()
    const branch = await gm.getBranch()
    if (branch.current !== 'master') {
        branchSpinner.fail('You are not on master branch. Aborting.')
        return
    }
    branchSpinner.succeed(`You're on master branch`)

    const commitSpinner = ora('Saving your work to repository').start()
    await gm.commit(message)
    commitSpinner.succeed('Successfully saved your work to repository')

    const tagSpinner = ora(`Regenerating tag ${tagName}`)
    await gm.deleteTag(tagName)
    await gm.addTag(tagName)
    tagSpinner.succeed(`Tag ${tagName} regenerated. Push successful!`)
}

module.exports = pushToVersion