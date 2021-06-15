/**
 * Called by npm (using the package.json configuration) from
 *  "freeze" hook
 * npm -> package.json -> [scripts]/freeze.js
 * */

const args = process.argv;
args.splice(0, 2);

const octopus = require("./index");
let targets = ["dependencies"];

if(args.length > 0){
    targets = args;
}

const path = require("path");
const fs = require("fs");
const child_process = require('child_process');

// Ensure that we are switched to DEV configuration
//Switch to stable octopus
octopus.setConfigFileToMode(true);

let notFoundFolders = [];

/**Performs a freeze on current configuration loaded from file (octopus.json or octopus-dev.json) */
function freezeConfig(config){

    function updateSmartCloneAction(task, action){
        /**
         * If the action has the commit no - ignore it
         * Else take current commit no (current head) from git
         */
        // if(typeof action.commit == "undefined"){
            const name = action.name || task.name;
            let targetFolder = path.resolve(path.join(config.workDir, name));
            if (action.target) {
                targetFolder = path.resolve(path.join(action.target, name));
            }
            console.log(`Trying to locate target ${targetFolder} in order to save it's state.`);
            basicProcOptions = {cwd: targetFolder};

            if (fs.existsSync(targetFolder) && fs.readdirSync(targetFolder).length > 0 ) {
                //Get commit number
                try {
                    let out = child_process.execSync("git rev-parse HEAD", basicProcOptions).toString().trim();
                    if(out.length == 40){
                        action.commit = out;
                    }
                    console.log(`Saving the state of ${targetFolder} at revision ${out}`);
                } catch (err) {
                    octopus.handleError(`Not able to perform the saving state process for target ${targetFolder}. Reason:`, err);
                }
                
                //validation of the commit number
                try{
                    //confirming that the module has the freeze mechanism enabled
                    child_process.execSync("git cat-file -e HEAD:octopus-freeze.json", {cwd: targetFolder, stdio: ['pipe', 'pipe', 'ignore']});
                    //test if the repo is in a shallow clone form
                    let isShallow = child_process.execSync("git rev-parse --is-shallow-repository", basicProcOptions).toString().trim();
                    if(isShallow !== "false"){
                        //convert the shallow clone to a full one in order to be able to search the last commit number for the freeze mechanism
                        child_process.execSync("git fetch --unshallow", {cwd: targetFolder, stdio: ['pipe', 'pipe', 'ignore']});
                    }
                    //this variable will have the reference of the last commit when the octopus-freeze file was modified
                    let freezeCommitNumber = child_process.execSync("git log -n 1 --format=\"%H\" -- octopus-freeze.json", basicProcOptions).toString().trim();
                    if(action.commit !== freezeCommitNumber){
                        let initialCommit = action.commit;
                        action.commit = freezeCommitNumber;
                        console.log(`\t * Warning: Commit number was replace for the module ${targetFolder} to ${action.commit} which represents a freezed version.`);
                        console.log(`\t If the replacement of the commit number isn't desired set manualy the commit number ${initialCommit}`)
                    }else{
                        console.log(`\t* Module <${targetFolder}> has a freeze mechanism enabled and the commit number checked. All good here!`);
                    }
                }catch(err){
                    //we ignore any error caught here because this validation does not affect the freeze mechanism
                }
            }
            else{
                notFoundFolders.push(targetFolder);
            }
        // }
    }

    console.log(`The scanning process will be performed for the following task lists `, targets);
    targets.forEach(target=>{
        let tasks = config[target];
        if(typeof tasks === "undefined"){
            return octopus.handleError(`Unable to find the task list called <${target}> in current config.`);
        }
        for (let i=0; i<tasks.length; i++){
            let task = tasks[i];
            if(!task.actions || !Array.isArray(task.actions) || task.actions.length === 0){
                require("./../lib/utils/ConfigurationDefaults").setDefaultActions(task);
            }
            for(let j=0; j<task.actions.length; j++){
                let action = task.actions[j];
                if(action.type == 'smartClone'){
                    updateSmartCloneAction(task, action);
                }
            }
        }
    });
}

let config =  octopus.readConfig();
freezeConfig(config);

if(notFoundFolders.length > 0){
    console.log(`\n===============\nOctopus was not able to locate the following paths:\n`);
    notFoundFolders.forEach( folder => console.log(folder));
    console.log(`\nIf neccessary, check the situations and run again the script.\n===============`);
}

//Switch to stable octopus
octopus.setConfigFileToMode(false);

//Save it
octopus.updateConfig(config, (err) => {
    if(err){
        throw err;
    }

    console.log("Configuration file  " + octopus.getConfigFile() +  " updated.");
});
