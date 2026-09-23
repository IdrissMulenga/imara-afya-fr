// Metro config: Expo defaults plus one tslib fix.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Resolve bare `tslib` to its CommonJS build. Its ESM shim fails under Metro
// ("Cannot destructure property '__extends' of 'tslib.default'") when bundling for web.
const TSLIB_CJS = path.resolve(__dirname, 'node_modules/tslib/tslib.js');

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib') {
    return { type: 'sourceFile', filePath: TSLIB_CJS };
  }

  // Fall back to Metro's own resolver.
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
