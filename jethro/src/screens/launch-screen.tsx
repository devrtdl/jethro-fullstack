import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';

import { useAuthSession } from '@/src/hooks/use-auth-session';
import { appStorage } from '@/src/lib/app-storage';

const APP_OPENED_KEY = 'jethro.has-opened-app';

const palette = {
  background: '#07111D',
  surface: '#0D1B2A',
  gold: '#D7B86E',
  cream: '#F6F1E8',
  muted: '#A5B1BF',
};

export function LaunchScreen() {
  const { session, isReady } = useAuthSession();
  const [isAnimationDone, setIsAnimationDone] = useState(false);
  const [hasOpenedApp, setHasOpenedApp] = useState<boolean | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsAnimationDone(true);
    }, 1400);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void appStorage.getItem(APP_OPENED_KEY).then((value) => {
      if (!isMounted) {
        return;
      }

      setHasOpenedApp(value === 'true');
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !isAnimationDone || hasOpenedApp === null) {
      return;
    }

    if (session?.user?.email) {
      router.replace('/(tabs)');
      return;
    }

    if (!hasOpenedApp) {
      void appStorage.setItem(APP_OPENED_KEY, 'true').then(() => {
        router.replace('/auth/register');
      });
      return;
    }

    router.replace('/auth/login');
  }, [hasOpenedApp, isAnimationDone, isReady, session?.user?.email]);

  return (
    <View style={styles.container}>
      <View style={styles.glowLarge} />
      <View style={styles.glowSmall} />

      <View style={styles.brandBlock}>
        <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} contentFit="contain" />
        <Text style={styles.brandName}>Jethro</Text>
        <Text style={styles.brandTagline}>Metodo PBN no ritmo do app.</Text>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator color={palette.gold} />
        <Text style={styles.footerText}>Preparando a sua jornada...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.background,
    paddingHorizontal: 28,
    paddingTop: 120,
    paddingBottom: 72,
  },
  glowLarge: {
    position: 'absolute',
    top: 40,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: 'rgba(215, 184, 110, 0.08)',
  },
  glowSmall: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(125, 171, 225, 0.08)',
  },
  brandBlock: {
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 132,
    height: 132,
  },
  brandName: {
    color: palette.cream,
    fontSize: 42,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  brandTagline: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    color: palette.gold,
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
