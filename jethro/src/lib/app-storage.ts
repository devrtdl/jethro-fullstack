import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const memoryStorage = new Map<string, string>();

async function getWebValue(key: string) {
  if (
    typeof globalThis.localStorage !== 'undefined' &&
    typeof globalThis.localStorage.getItem === 'function'
  ) {
    return globalThis.localStorage.getItem(key);
  }

  return memoryStorage.get(key) ?? null;
}

async function setWebValue(key: string, value: string) {
  if (
    typeof globalThis.localStorage !== 'undefined' &&
    typeof globalThis.localStorage.setItem === 'function'
  ) {
    globalThis.localStorage.setItem(key, value);
    return;
  }

  memoryStorage.set(key, value);
}

export const appStorage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      return getWebValue(key);
    }

    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  },

  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      await setWebValue(key, value);
      return;
    }

    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      memoryStorage.set(key, value);
    }
  },
};
