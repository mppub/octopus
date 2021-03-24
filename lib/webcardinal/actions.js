const WebCardinal = require('./index');

/**
 * buildComponents
 * @description Builds and merges all @webcardinal/<component>s and @cardinal/<component>s.
 *
 * @param {Object} action
 * @param {Object} dependency
 * @param {Function} callback
 */
function buildComponents(action, dependency, callback) {
    let src = action.src || dependency.src;
    let target = action.target;
    // WebCardinal.Builder has default values for src and target

    let options = action.options || { DEV: false, devComponents: null };

    const runner = require('../../Runner');
    const tasks = [...runner.tasks];
    const { Builder, TAG } = WebCardinal;

    const build = async () => {
        try {
            const builder = new Builder(runner, src, target, options);
            if (!options.devComponents) {
                // build all and merge (default)
                await builder.build();
                await builder.copy();
                await builder.merge();
            } else {
                // targeted build (development use only)
                await builder.build(options.devComponents);
                await builder.copy(options.devComponents);
            }
            console.log(TAG, 'buildWebCardinalComponents command finished.');
        } catch (error) {
            console.error(TAG, error);
        }
    }

    build()
        .then(() => callback(null, '', { tasks }))
        .catch(callback);
}

module.exports = {
    buildComponents
}