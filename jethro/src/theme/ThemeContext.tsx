import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { dark, light, type ThemeColors } from './colors';

type ColorScheme = 'light' | 'dark';

type ThemeContextValue = {
  colorScheme: ColorScheme;
  colors: ThemeColors;
  toggleColorScheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
};

const STORAGE_KEY = 'jethro_color_scheme';

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: 'light',
  colors: light,
  toggleColorScheme: () => {},
  setColorScheme: () => {},
});

export function JethroThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemScheme ?? 'dark');

  // Restore persisted preference on mount
  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark') {
          setColorSchemeState(stored);
        }
      })
      .catch(() => {
        // Storage unavailable — keep system default
      });
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    SecureStore.setItemAsync(STORAGE_KEY, scheme).catch(() => {});
  }, []);

  const toggleColorScheme = useCallback(() => {
    setColorScheme(colorScheme === 'light' ? 'dark' : 'light');
  }, [colorScheme, setColorScheme]);

  const colors = colorScheme === 'light' ? light : dark;

  return (
    <ThemeContext.Provider value={{ colorScheme, colors, toggleColorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
