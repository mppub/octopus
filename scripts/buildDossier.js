const DEFAULT_PSK_BUNDLES_PATH = "./../privatesky/psknode/bundles";
const DEFAULT_BUILD_CONF_PATH = './bin/build.json';

let args = process.argv;
args.splice(0,2);

const octopus = require("./index.js");
if (args.length > 1) {
    octopus.handleError("Expected to receive 1 optional param <configFile> path the the config file. defaults to './bin/build.json'");
}

let conf_file = args[0] || DEFAULT_BUILD_CONF_PATH;

const fs = require("fs");

fs.access(conf_file, fs.F_OK, err => {
    if (err){
        octopus.handleError("Configuration file not found", err);
        return;
    }
    fs.readFile(conf_file, (err, data) => {
        if (err){
            octopus.handleError("Could not read configuration file");
            return;
        }
        const path = require("path");
        let conf;

        try {
            conf = JSON.parse(data.toString());
        } catch (e) {
            octopus.handleError("Could not parse configuration file. Is it a proper JSON?");
            return;
        }

        let bundles_path = conf.bundles_path || DEFAULT_PSK_BUNDLES_PATH;
        
        require(path.join(bundles_path, "openDSU.js"));
        let dossier_builder = require('opendsu').loadApi('dt').getDossierBuilder();
        
        dossier_builder.build(conf, (err, result) => {
            let projectName = path.basename(path.join(__dirname, "../"));
            
            if (err) {
                console.log(`Build process of <${projectName}> failed.`);
                console.log(err);
                process.exit(1);
            }

            console.log(`Build process of <${projectName}> finished. Dossier's KeySSI:`, result);
        });
    });

});


