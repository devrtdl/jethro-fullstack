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
      <View style={styles.gridLineVertical} />
      <View style={styles.gridLineHorizontal} />
      <View style={styles.glowHalo} />
      <View style={styles.glowBase} />

      <View style={styles.brandBlock}>
        <View style={styles.logoShell}>
          <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} contentFit="contain" />
        </View>
        <Text style={styles.brandName}>Jethro</Text>
        <Text style={styles.brandTagline}>Diagnóstico, verdade e plano no ritmo certo.</Text>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator color={palette.gold} />
        <Text style={styles.footerText}>Preparando sua jornada</Text>
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
    paddingTop: 112,
    paddingBottom: 56,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    right: 54,
    backgroundColor: 'rgba(247, 243, 236, 0.05)',
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 148,
    height: 1,
    backgroundColor: 'rgba(247, 243, 236, 0.04)',
  },
  glowHalo: {
    position: 'absolute',
    top: 108,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(215, 184, 110, 0.10)',
  },
  glowBase: {
    position: 'absolute',
    bottom: -30,
    width: 340,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(125, 171, 225, 0.08)',
  },
  brandBlock: {
    alignItems: 'center',
    gap: 14,
  },
  logoShell: {
    width: 136,
    height: 136,
    borderRadius: 40,
    backgroundColor: 'rgba(247, 243, 236, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(215, 184, 110, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 92,
    height: 92,
  },
  brandName: {
    color: palette.cream,
    fontSize: 44,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  brandTagline: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 260,
  },
  footer: {
    alignItems: 'center',
    gap: 10,
  },
  footerText: {
    color: palette.gold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
