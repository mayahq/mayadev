const axios = require('axios')
const { API_ROOT } = require('../../constants')

async function getModuleById(id) {
    const request = {
        method: 'GET',
        url: `${API_ROOT}/modules?id=${id}`
    }

    try {
        const response = await axios(request)
        const data = response.data[0]
        // console.log(data)
        return data
    } catch (e) {
        return null
    }
}

module.exports = getModuleById

// getModuleById('618dda9bcae9c724d9eb448c')