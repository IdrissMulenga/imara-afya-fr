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

  // Google Sign-In on iOS needs the reversed iOS client id as a URL scheme; it is added once
  // that client exists.
  const iosClient = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (iosClient) {
    const scheme = `com.googleusercontent.apps.${iosClient.replace('.apps.googleusercontent.com', '')}`;
    expo.plugins = [
      ...expo.plugins,
      ['@react-native-google-signin/google-signin', { iosUrlScheme: scheme }],
    ];
  }

  return { ...base, expo };
};
