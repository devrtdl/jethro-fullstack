import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';

import { useAuthSession } from '@/src/hooks/use-auth-session';

const SPLASH_DURATION = 1800;

const palette = {
  background: '#0B1F3B',
  gold: '#D4AF37',
  goldGlow: 'rgba(212, 175, 55, 0.08)',
  goldTrack: 'rgba(212, 175, 55, 0.15)',
};

export function LaunchScreen() {
  const { session, isReady } = useAuthSession();
  const [isAnimationDone, setIsAnimationDone] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: SPLASH_DURATION,
      useNativeDriver: false,
    }).start();

    const timeoutId = setTimeout(() => {
      setIsAnimationDone(true);
    }, SPLASH_DURATION);

    return () => clearTimeout(timeoutId);
  }, [progress]);

  useEffect(() => {
    if (!isReady || !isAnimationDone) return;

    if (session?.user?.email) {
      router.replace('/(tabs)');
      return;
    }

    router.replace('/auth/welcome');
  }, [isAnimationDone, isReady, session?.user?.email]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>

      <Image
        source={require('@/assets/logo.png')}
        style={styles.logo}
        contentFit="contain"
      />

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressBar, { width: barWidth }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
    paddingHorizontal: 48,
    gap: 64,
  },
  glowTop: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: palette.goldGlow,
  },
  logo: {
    width: 160,
    height: 160,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 64,
    left: 48,
    right: 48,
    height: 2,
    borderRadius: 999,
    backgroundColor: palette.goldTrack,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.gold,
  },
});
