const config = require('../config')
const paths = config.paths
const maraConf = require(paths.marauder);
const entry = require('../libs/entry').entry;
module.exports = function(command, webpackConfig) {
  if (maraConf.webpackPluginsHandler) {
    webpackConfig.plugins = maraConf.webpackPluginsHandler(command, webpackConfig.plugins, config, entry);
  }
  return webpackConfig;
};
