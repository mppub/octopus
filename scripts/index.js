const fs = require("fs");
const path = require("path");

let CONFIG_FILE_PATH;
let CONFIG_FILE = {
	DEV: {
		JSON: "./octopus.json",
		OCTOPUS: "./.octopus"
	},
	FREEZE: {
		JSON: "./octopus-freeze.json",
		OCTOPUS: "./.octopus-freeze"
	}
};

function createBasicConfig(...configParts) {
	return {"workDir": ".", "dependencies": [...configParts]};
}

function readConfig() {
	let config;
	let configFileName = getConfigFile();
	try {
		console.log("Looking for configuration file at path", configFileName);
		if (configFileName.endsWith('json')) {
			config = require(configFileName);
		} else {
			const toJSON = require('../lib/config-converter/toJSON');
			config = toJSON(fs.readFileSync(configFileName, 'utf8')).config;
		}
	} catch (err) {
		if (err.code === "MODULE_NOT_FOUND") {
			console.log("Configuration file " + configFileName + " not found. Creating a new config object.");
			config = createBasicConfig();
			let privateSkyRepo;
			console.log("Looking for PRIVATESKY_REPO_NAME as env variable. It can be used to change what PrivateSky repo will be user: psk-release or privatesky.");
			if(typeof process.env.PRIVATESKY_REPO_NAME !== "undefined"){
				privateSkyRepo = process.env.PRIVATESKY_REPO_NAME;
			}else{
				privateSkyRepo = "privatesky";
			}
		} else {
			throw err;
		}
	}
	return config;
}

function updateConfig(config, callback) {
	if (CONFIG_FILE_PATH.endsWith('json')) {
		config = JSON.stringify(config, null, 4)
	} else {
		const toOctopus = require('../lib/config-converter/toOctopus');
		config = toOctopus(config).config;
	}

	try {
		fs.writeFile(CONFIG_FILE_PATH, config, callback);
	} catch (e) {
		callback(e);
	}
}

function runConfig(config, tasksListSelector, callback) {
	if(typeof config === "function"){
		callback = config;
		tasksListSelector = undefined;
		config = readConfig();
	}

	if(typeof tasksListSelector === "function"){
		callback = tasksListSelector;
		tasksListSelector = undefined;
	}

	if(typeof config === "undefined"){
		config = readConfig();
	}

	if(typeof tasksListSelector === "undefined"){
		tasksListSelector = "dependencies";
	}

	const runner = require("../Runner");

	runner.run(config, tasksListSelector, callback);
}

function handleError(...args){
	const exitCode = 1;
	console.log(...args);
	console.log("Exit code:", exitCode);
	process.exit(exitCode);
}

function changeConfigFile(configFilePath){
	CONFIG_FILE_PATH = path.resolve(configFilePath);
}

function setConfigFileToMode(development){
	const config = development ? CONFIG_FILE.DEV : CONFIG_FILE.FREEZE;

	if (fs.existsSync(path.resolve(CONFIG_FILE.DEV.OCTOPUS)) ||
		fs.existsSync(path.resolve(CONFIG_FILE.FREEZE.OCTOPUS))) {
		CONFIG_FILE_PATH = path.resolve(config.OCTOPUS);
	} else {
		CONFIG_FILE_PATH = path.resolve(config.JSON);
	}
}

/**Returns current configuration file*/
function getConfigFile(){
	if(typeof CONFIG_FILE_PATH === "undefined"){
		setConfigFileToMode(isDevelopment());
	}
	return CONFIG_FILE_PATH;
}

//DEV flag is set inside the env.json file by [script]/setEnv.js file
function isDevelopment(){
	return process.env.DEV === "true";
}

module.exports = {
	createBasicConfig,
	readConfig,
	updateConfig,
	runConfig,
	handleError,
	changeConfigFile,
	setConfigFileToMode,
	getConfigFile,
	isDevelopment,
	CONFIG_FILE
};
