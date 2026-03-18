import Constants from 'expo-constants';

type AppEnvironment = 'development' | 'production';

type ExpoHostConfig = {
  debuggerHost?: string;
  hostUri?: string;
};

function sanitizeBaseUrl(value?: string) {
  return value?.trim().replace(/\/+$/, '');
}

function getExpoHost() {
  const expoConfig = Constants.expoConfig as ExpoHostConfig | null;
  const expoGoConfig = Constants.expoGoConfig as ExpoHostConfig | null;
  const hostCandidate = expoGoConfig?.debuggerHost ?? expoConfig?.hostUri;

  if (!hostCandidate) {
    return undefined;
  }

  return hostCandidate.split('/')[0]?.split(':')[0];
}

function getDerivedDevApiUrl() {
  const host = getExpoHost();
  const port = process.env.EXPO_PUBLIC_API_PORT ?? '3000';

  if (!host) {
    return undefined;
  }

  return `http://${host}:${port}`;
}

const explicitApiUrl = sanitizeBaseUrl(process.env.EXPO_PUBLIC_API_URL);
const appEnv = (process.env.EXPO_PUBLIC_APP_ENV ?? (__DEV__ ? 'development' : 'production')) as AppEnvironment;

export const env = {
  appEnv,
  apiBaseUrl: explicitApiUrl ?? sanitizeBaseUrl(getDerivedDevApiUrl()) ?? 'http://localhost:3000',
  apiTimeoutMs: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? '10000'),
};
