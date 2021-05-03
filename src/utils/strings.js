function isKebabCase(str) {
    return /^([a-z][a-z0-9]*)(-[a-z0-9]+)*$/.test(str)
}

function capitalizeFirstLetter(str) {
    return `${str[0].toUpperCase()}${str.substring(1)}`
}

function getNameVariations(name) {
    if (!isKebabCase(name)) {
        throw new Error('Name is not in kebab case')
    }
    const pascalCase = name.split('-').map((x) => capitalizeFirstLetter(x)).join('')
    const kebabCase = name
    const camelCase = `${pascalCase[0].toLowerCase()}${pascalCase.substring(1)}`
    return { pascalCase, kebabCase, camelCase }
}

module.exports = { capitalizeFirstLetter, getNameVariations, isKebabCase }