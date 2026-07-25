// lib/config.ts — backend connection config.
//
// The GraphQL endpoint is resolved automatically from the Metro/Expo host so the
// app reaches your dev machine over LAN without hardcoding an IP. Override it any
// time with the EXPO_PUBLIC_GRAPHQL_URL env var (e.g. for a staging server).
//
//   • Physical phone (Expo Go): uses the same host that serves the JS bundle.
//   • Android emulator:         falls back to 10.0.2.2.
//   • iOS simulator:            falls back to localhost.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const LOCAL_GRAPHQL_PORT = 4004;
const GRAPHQL_PATH = '/graphql';

const getHostFromUri = (uri?: string | null) => {
  if (!uri) return null;
  return uri.replace(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//, '').split(/[/:]/)[0];
};

const getDevApiHost = () => {
  const host = getHostFromUri(Constants.expoConfig?.hostUri ?? Constants.platform?.hostUri);

  if (!host || host === '0.0.0.0') {
    return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  }
  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
    return '10.0.2.2';
  }
  return host;
};

export const API_URL =
  process.env.EXPO_PUBLIC_GRAPHQL_URL?.trim() ||
  `http://${getDevApiHost()}:${LOCAL_GRAPHQL_PORT}${GRAPHQL_PATH}`;
