// app.config.js — dynamic layer on top of app.json.
//
// app.json stays exactly as it is and is passed in here as `config`. This file
// only fills in the values that must NOT be committed, which today is the
// Google Maps keys.
//
// WHY THE KEYS AREN'T JUST WRITTEN INTO app.json:
// they would be in git history forever, and rotating one later would mean a new
// build. Note that a mobile Maps key is always extractable from the shipped
// binary by anyone who wants it — keeping it out of git is tidiness, not
// security. The actual protection is restricting each key in Google Cloud
// Console to this app. See PLAY_STORE.md.
//
// ANDROID AND iOS NEED SEPARATE KEYS.
// They are different Google products ("Maps SDK for Android" and "Maps SDK for
// iOS"), restricted differently — Android by package name + signing SHA-1, iOS
// by bundle identifier — so one key cannot serve both. BOTH are required: the
// app uses Google Maps on both platforms so the two behave identically.
module.exports = ({ config }) => {
  const androidKey = process.env.GOOGLE_MAPS_API_KEY?.trim() ?? '';
  const iosKey = process.env.GOOGLE_MAPS_IOS_API_KEY?.trim() ?? '';

  // A missing key doesn't fail the build — it produces a grey rectangle where
  // the map should be, which is easy to misread as a bug in the app. Say so
  // loudly at build time instead, while it is still cheap to fix.
  if (!androidKey) {
    console.warn(
      '[imara-afya] GOOGLE_MAPS_API_KEY is not set — the Find care map will render blank on Android.',
    );
  }

  if (!iosKey) {
    console.warn(
      '[imara-afya] GOOGLE_MAPS_IOS_API_KEY is not set — iOS will fall back to Apple Maps.',
    );
  }

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: { apiKey: androidKey },
      },
    },
    ios: {
      ...config.ios,
      config: {
        ...config.ios?.config,
        // Only set when we actually have one. An empty string here would make
        // react-native-maps try to start the Google SDK on iOS with no key,
        // which fails silently — a blank map instead of the Apple Maps that
        // would otherwise have worked perfectly well.
        ...(iosKey ? { googleMapsApiKey: iosKey } : {}),
      },
    },
  };
};
