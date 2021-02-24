const { tag } = require('./config');

module.exports = {
    TAG: tag,
    Runner: require('./bin/WrappedRunner'),
    Builder: require('./bin/Builder'),
};