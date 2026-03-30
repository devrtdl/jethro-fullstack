import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

import { env } from '@/src/config/env';

const memoryStorage = new Map<string, string>();

const localStorageAdapter = {
  getItem(key: string) {
    return Promise.resolve(globalThis.localStorage?.getItem(key) ?? null);
  },
  setItem(key: string, value: string) {
    globalThis.localStorage?.setItem(key, value);
    return Promise.resolve();
  },
  removeItem(key: string) {
    globalThis.localStorage?.removeItem(key);
    return Promise.resolve();
  },
};

const secureStoreAdapter = {
  async getItem(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return memoryStorageAdapter.getItem(key);
    }
  },
  async setItem(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      await memoryStorageAdapter.setItem(key, value);
    }
  },
  async removeItem(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      await memoryStorageAdapter.removeItem(key);
    }
  },
};

const memoryStorageAdapter = {
  getItem(key: string) {
    return Promise.resolve(memoryStorage.get(key) ?? null);
  },
  setItem(key: string, value: string) {
    memoryStorage.set(key, value);
    return Promise.resolve();
  },
  removeItem(key: string) {
    memoryStorage.delete(key);
    return Promise.resolve();
  },
};

function resolveStorageAdapter() {
  if (
    Platform.OS === 'web' &&
    typeof globalThis.localStorage !== 'undefined' &&
    typeof globalThis.localStorage.getItem === 'function' &&
    typeof globalThis.localStorage.setItem === 'function' &&
    typeof globalThis.localStorage.removeItem === 'function'
  ) {
    return localStorageAdapter;
  }

  if (
    typeof SecureStore.getItemAsync === 'function' &&
    typeof SecureStore.setItemAsync === 'function' &&
    typeof SecureStore.deleteItemAsync === 'function'
  ) {
    return secureStoreAdapter;
  }

  return memoryStorageAdapter;
}

export function hasSupabaseConfig() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export const supabase = hasSupabaseConfig()
  ? createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
      auth: {
        storage: resolveStorageAdapter(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
