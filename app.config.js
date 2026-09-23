// Extends app.json: allows plain http on Android in development only,
// so a dev build can reach the backend on the LAN. Production stays https-only.
const base = require('./app.json');

const isDev = process.env.NODE_ENV !== 'production' && !process.env.EAS_BUILD_PROFILE;

module.exports = () => {
  const expo = { ...base.expo };

  expo.plugins = expo.plugins.map((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== 'expo-build-properties') return plugin;

    const [name, options] = plugin;
    return [
      name,
      {
        ...options,
        android: { ...options.android, usesCleartextTraffic: isDev },
      },
    ];
  });

  return { ...base, expo };
};
