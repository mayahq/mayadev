const fs = require('fs')
const path = require('path')
const os = require('os')
const Table = require('cli-table')

function listRuntimes() {
    const json = fs.readFileSync(
        path.join(os.homedir(), '.mayadev/db.json')
    )

    const db = JSON.parse(json.toString())
    const table = new Table({
        head: ['Name', 'ID', 'Status'],
        colWidths: [42, 28, 12]
    })
    const brains = db.brains
    brains.forEach(brain => {
        table.push([brain.name, brain._id, brain.status])
    })

    console.log(table.toString())
}

module.exports = {
    listRuntimes
}