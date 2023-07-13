const config = require('../../.eslintrc.js');

config.extends.push("plugin:jsdoc/recommended");
config.plugins.push("jsdoc");

module.exports = config;
