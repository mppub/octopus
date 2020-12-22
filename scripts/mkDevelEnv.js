const argIdentifier = "--file=";
const errorMessage = `Misuse of script. Syntax node path_to_script ${argIdentifier}'path_to_env_file' \"[npm cmd] [node cmd]\"`;
const args = process.argv;
args.splice(0, 2);

const octopus = require("./index");
if(args.length <2){
    octopus.handleError(errorMessage);
}

let fileArg = args.shift();
if(fileArg.indexOf(argIdentifier) === -1){
    octopus.handleError(errorMessage);
}
fileArg = fileArg.replace(argIdentifier, "");

let envJson;

let fileArgDevel = fileArg + ".devel";
let fs = require("fs");
fs.writeFile(fileArgDevel, "This file indicates that octopus is using octopus.json and not octopus-dev.json file to install dependencies", function(err){
if(err){
	console.error(err);
   }
});
