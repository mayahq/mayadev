const simpleGit = require('simple-git')
const { getPackageDetails, findPackagePath } = require('../findPackagePath')

class GitManager {
    constructor({ baseDir }) {
        this.git = simpleGit({
            baseDir: baseDir,
            binary: 'git',
            maxConcurrentProcesses: 4
        })
    }

    getTags() {
        return new Promise((resolve, reject) => {
            const tags = this.git.tags((err, tags) => {
                if (err) reject(err)
                else resolve(tags)
            })
        })
    }

    _addTagLocal(tagName) {
        return new Promise((resolve, reject) => {
            this.git.addTag(tagName, (err, res) => {
                if (err) reject(err)
                else resolve(res)
            })
        })
    }

    _deleteTagLocal(tagName) {
        return new Promise((resolve, reject) => {
            this.git.tag(['-d', tagName], (err, res) => {
                if (err) reject(err)
                else resolve(res)
            })
        })
    }

    getBranch() {
        return new Promise((resolve, reject) => {
            const data = this.git.branch()
            resolve(data)
        })
    }

    async addTag(tagName) {
        await this._addTagLocal(tagName)
        // await this.git.push('--set-upstream', 'origin', 'master', '--follow-tags', '--tags')
        await this.git.pushTags('origin')
    }

    async deleteTag(tagName) {
        await this.git.push(['--delete', 'origin', tagName])
        await this._deleteTagLocal(tagName)
    }

    async commit(message) {
        await this.git
            .add('.')
            .commit(message || 'Changes made')
            .push('--set-upstream', 'origin', 'master')
    }
}

const gm = new GitManager({
    baseDir: '/Users/dushyant/maya/testmod-one'
})

// gm.getTags()
//     .then(t => console.log(t))

// gm.addTag('testTag6')
//     .then((a) => console.log(a))
//     .catch(e => console.log(e))

// gm.commit()

// gm.branch().then(res => console.log(res.current))

// gm.deleteTag('testTag2')
//     .then(res => console.log(res))
//     .catch(err => console.log(err))

module.exports = GitManager