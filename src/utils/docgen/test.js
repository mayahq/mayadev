const fs = require('fs')
const getMarkdownDocs = require('./parse')

function test() {
    const content = fs.readFileSync(
        '/Users/dushyant/maya/skills/maya-red-spotify/src/nodes/getPlaybackState/getPlaybackState.node.html'
    ).toString()
    
    const result = getMarkdownDocs('Get Playback State', content)
    console.log(result)
}

test()