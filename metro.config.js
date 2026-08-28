// metro.config.js — bundler configuration.
//
// This file exists for exactly one reason, described below. Everything else is
// Expo's defaults, so keep it that way: a bundler config that has grown options
// nobody remembers the reason for is a bundler config nobody dares to touch.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// TSLIB MUST RESOLVE TO ITS COMMONJS BUILD.
//
// THE FAILURE: bundling for web died with
//
//   Cannot destructure property '__extends' of 'tslib.default' as it is
//   undefined
//     at tslib/modules/index.js
//     at @apollo/client/utilities/policies/pagination.js
//
// WHY: tslib ships three builds and picks between them with an `exports` map:
//
//   "module"  -> ./tslib.es6.mjs
//   "import"  -> { "node": "./modules/index.js", ... }
//   "default" -> ./tslib.js          <- the CommonJS one, which works
//
// Metro has `unstable_enablePackageExports` on by default from SDK 53, and the
// web/SSR pass runs under the `node` condition — so Apollo's `import ... from
// "tslib"` matches `import` -> `node` and lands on `modules/index.js`.
//
// That file is a thin ESM shim: it does `import tslib from '../tslib.js'` and
// destructures the helpers off the default export. But `tslib.js` is a UMD
// bundle that assigns its helpers directly onto `exports` and never sets
// `exports.default` — verified: `require('tslib/tslib.js').default` is
// `undefined`. Under Node's own interop that is papered over; under Metro's it
// is not, so the destructure throws and the whole bundle fails.
//
// THE FIX: send bare `tslib` imports straight to the CommonJS build, which has
// every helper as a real named export. Scoped to the exact specifier so no
// other package's resolution changes — `tslib/...` subpath imports are left
// alone, and so is everything else.
//
// This can be removed once tslib's ESM shim and Metro's interop agree. Test by
// deleting it and running `npx expo start --web`; if the bundle completes, it
// has been fixed upstream.
const TSLIB_CJS = path.resolve(__dirname, 'node_modules/tslib/tslib.js');

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib') {
    return { type: 'sourceFile', filePath: TSLIB_CJS };
  }

  // Chain rather than replace: Metro sets its own resolveRequest for some
  // platforms, and dropping it here would break resolution in ways that look
  // nothing like this bug.
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
