const fs = require("fs");
const path = require("path");
const os = require("os");
const Table = require("cli-table");
const getModuleById = require("./publish/getModule");
const { execSync } = require("child_process");
// const { Table } = require('cli-table')

function listRuntimes() {
    const json = fs.readFileSync(path.join(os.homedir(), ".mayadev/db.json"));

    const db = JSON.parse(json.toString());
    const table = new Table({
        head: ["Name", "ID", "Status"],
        colWidths: [42, 28, 12],
    });
    const brains = db.brains;
    brains.forEach((brain) => {
        table.push([brain.name, brain._id, brain.status]);
    });

    console.log(table.toString());
}

async function updateAllModulesToSdkVersion(version, baseDir) {
    /**
     * Iterate through all directories in a directory
     */
    const dir = baseDir;
    const dirs = fs.readdirSync(dir);

    for (i in dirs) {
        const dirName = dirs[i];
        const dirPath = path.join(baseDir, dirName);
        const stat = fs.statSync(dirPath);
        if (stat.isDirectory()) {
            const packageJsonPath = path.join(dirPath, "package.json");
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(
                    fs.readFileSync(packageJsonPath).toString()
                );
                const moduleId = packageJson?.mayaDetails?.origin?.moduleId;
                if (moduleId) {
                    console.log(packageJsonPath);
                    packageJson.version = "2.3.0";
                    // fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
                    const module = await getModuleById(moduleId);
                    // console.log('module', module)
                    const moduleVersion = module?.currentVersion.replace('v', '')
                    const moduleName = module?.name;
                    console.log(moduleName, moduleVersion);

                    execSync('npm uninstall @mayahq/module-sdk', { cwd: dirPath })
                    execSync(`npm install @mayahq/module-sdk`, { cwd: dirPath })
                }
            }
        }
    }
}

async function pushAllModulesToStore() {
    /**
     * Iterate through all directories in a directory
     */
    const dir = process.cwd();
    const dirs = fs.readdirSync(dir);

    for (i in dirs) {
        const dirName = dirs[i];
        const dirPath = path.join(dir, dirName);
        const stat = fs.statSync(dirPath);
        if (stat.isDirectory()) {
            const packageJsonPath = path.join(dirPath, "package.json");
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(
                    fs.readFileSync(packageJsonPath).toString()
                );
                const moduleId = packageJson?.mayaDetails?.origin?.moduleId;
                if (moduleId) {
                    packageJson.version = "2.3.0";
                    const module = await getModuleById(moduleId);
                    const moduleVersion = module?.currentVersion.replace('v', '')
                    const moduleName = module?.name;
                    console.log(moduleName, moduleVersion);
                    execSync(`mayadev push ${moduleVersion}`, { cwd: dirPath })
                }
            }
        }
    }
}

// updateAllModulesToSdkVersion("abc", "/Users/dushyant/Maya/modules");
// pushAllModulesToStore("/Users/dushyant/Maya/modules")
module.exports = {
    listRuntimes,
    pushAllModulesToStore
}