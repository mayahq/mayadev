#!/usr/bin/env node
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const { createNode, addNode, removeNode } = require('./src/utils/nodeGen')
const { generateHtml, generateAllHtml } = require('./src/utils/htmlGen')
const setupCli = require('./src/utils/startProject')
const migrate = require('./src/utils/migrate')
const { setTokens, getTokens } = require('./src/utils/tokens')
const generateMdDocs = require('./src/utils/docgen')
const addVersion = require('./src/utils/publish/addVersion')
const setOrigin = require('./src/utils/publish/setOrigin')
const pushToVersion = require('./src/utils/publish/pushToVersion')
const setCurrentVersion = require('./src/utils/publish/setCurrentVersion')
const { listRuntimes, pushAllModulesToStore } = require('./src/utils/moduledev')
const generateNodesFromSpec = require('./src/utils/openapi')

yargs(hideBin(process.argv))
    .command('add-node [name]', 'Add a new node', (yargs) => {
        return yargs
            .positional('name', {
                describe: 'Name of the node, in kebab-case'
            })
            .option('label', {
                alias: 'l',
                description: 'The default pallette label of the node'
            })
            .option('config', {
                alias: 'c',
                type: 'boolean',
                description: 'Create a config node'
            })
            .option('no-generate', {
                alias: 'n',
                type: 'boolean',
                description: 'Add node entry to package.json without generating new code'
            })
    }, (argv) => {
        if (argv['no-generate']) {
            addNode({ name: argv.name })
        } else {
            createNode({ name: argv.name, isConfig: argv.config, label: argv.label })
        }
    })
    .command('remove-node [name]', 'Remove a node', (yargs) => {
        return yargs
            .positional('name', {
                describe: 'Name of the node to remove, in kebab-case'
            })
            .option('hard', {
                alias: 'h',
                type: 'boolean',
                description: "Also remove the node's source code"
            })
    }, (argv) => {
        removeNode({ name: argv.name, deleteSource: argv.hard })
    })
    .command('gen-html [name]', 'Generate HTML for a node', (yargs) => {
        return yargs
            .positional('name', {
                description: 'Name of the node to generate HTML for. Will generate for all nodes in nodepath if empty.'
            })
    }, (argv) => {
        if (argv.name) {
            generateHtml(argv.name)
        } else {
            generateAllHtml()
        }
    })
    .command('init', 'Create a new Maya module', (yargs) => yargs, (argv) => {
        setupCli()
    })
    .command('migrate', 'Migrate to new fix', (yargs) => yargs, (argv) => {
        migrate()
    })
    .command('set-tokens', 'Set tokens for module as defined in manifest', (yargs) => {
        return yargs
            .positional('runtime', {
                description: 'Runtime ID of the runtime in which to insert tokens'
            })
    }, (argv) => {
        setTokens()
    })
    .command('get-tokens', 'Get tokens currently set for module', (yargs) => {
        return yargs
            .positional('runtime', {
                description: 'Runtime ID of the runtime in which the module is present'
            })
            .option('module', {
                description: 'The module for which you want to view tokens'
            })
    }, (argv) => {
        getTokens()
    })
    .command('gen-docs [target-dir]', 'Generate markdown docs from HTML docs of nodes', (yargs) => {
        return yargs
            .positional('target-dir', {
                alias: 't',
                type: 'string',
                description: 'Path to directory where the new docs directory will be created'
            })
            .option('ignore-errors', {
                alias: 'i',
                type: 'boolean',
                description: 'If true, files with invalid doc specs will be ignored'
            })
    }, (argv) => {
        generateMdDocs(argv['target-dir'], argv['ignore-errors'])
    })
    .command('add-version [vers]', 'Set which module record in Maya database this module corresponds to', (yargs) => {
        return yargs
            .positional('vers', {
                type: 'string',
                description: 'New version to be added'
            })
    }, (argv) => {
        addVersion({ version: argv.vers })
    })
    .command('push [vers]', 'Push new module changes to current version', (yargs) => {
        return yargs
            .positional('vers', {
                type: 'string',
                description: 'New version to be added'
            })
    }, (argv) => {
        pushToVersion({ version: argv.vers })
    })
    .command('push-all', 'Push all modules in a directory to current version', (yargs) => {
        return yargs
    }, (argv) => {
        pushAllModulesToStore()
    })
    .command('set-current-version [vers]', 'Push new module changes to current version', (yargs) => {
        return yargs
            .positional('vers', {
                type: 'string',
                description: 'New version to be added'
            })
    }, (argv) => {
        setCurrentVersion({ version: argv.vers })
    })
    .command('set-origin [id]', 'Set which module record in Maya database this module corresponds to', (yargs) => {
        return yargs
            .positional('id', {
                type: 'string',
                description: 'ID of module record in Maya database'
            })
    }, (argv) => {
        // console.log('argv:', argv)
        setOrigin(argv.id)
    })
    .command('list runtimes', 'List runtimes with their IDs', (yargs) => yargs, (argv) => {
        listRuntimes()
    })
    .command('gen-nodes', 'Generate module-sdk code from another spec', (yargs) => {
        return yargs
            .option('spec-type', {
                alias: 's',
                type: 'string',
                description: 'Specification type'
            })
            .option('spec-path', {
                alias: 'p',
                type: 'string',
                description: 'Path to spec file'
            })
            .option('output-path', {
                alias: 'o',
                type: 'string',
                description: 'Path to output directory'
            })
            .option('category', {
                alias: 'c',
                type: 'string',
                description: 'Base category of the all generated nodes'
            })
    }, (argv) => {
        generateNodesFromSpec({
            specType: argv['spec-type'],
            specPath: argv['spec-path'],
            outputPath: argv['output-path'],
            category: argv['category'],
        })
    })
    .argv