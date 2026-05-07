import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import Svg, { Circle, Line } from 'react-native-svg';

import { useAuthSession } from '@/src/hooks/use-auth-session';
import { subscriptionService, type FlowStatus } from '@/src/services/subscription/subscription-service';
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';
import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { getShadow } from '@/src/theme/spacing';
import { Ornament } from '@/src/components/ui/Ornament';

const SPLASH_DURATION = 1800;

function resolveRoute(status: FlowStatus): string {
  if (!status.hasDiagnostic) return '/diagnostico';
  if (!status.hasSubscription) return '/paywall';
  if (!status.hasOnboarding) return '/onboarding';
  if (!status.hasPlan) return '/onboarding-result';
  return '/(tabs)';
}

// ─── Decorative circuit lines (position: absolute, full screen) ───────────────

function CircuitLines({ width, height }: { width: number; height: number }) {
  const c  = palette.gold500;
  const op = 0.35;
  const sw = 0.8;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} accessible={false}>
      {/* top-right */}
      <Line x1={width * 0.60} y1={0}             x2={width * 0.60} y2={height * 0.14} stroke={c} strokeWidth={sw} opacity={op} />
      <Line x1={width * 0.60} y1={height * 0.14} x2={width}        y2={height * 0.14} stroke={c} strokeWidth={sw} opacity={op} />
      <Line x1={width * 0.75} y1={0}             x2={width * 0.75} y2={height * 0.07} stroke={c} strokeWidth={sw} opacity={op} />
      <Line x1={width * 0.86} y1={0}             x2={width * 0.86} y2={height * 0.22} stroke={c} strokeWidth={sw} opacity={op} />
      <Line x1={width * 0.86} y1={height * 0.22} x2={width}        y2={height * 0.22} stroke={c} strokeWidth={sw} opacity={op} />
      <Circle cx={width * 0.60} cy={height * 0.14} r={1.8} fill={c} opacity={op} />
      <Circle cx={width * 0.86} cy={height * 0.22} r={1.8} fill={c} opacity={op} />
      {/* bottom-left */}
      <Line x1={0}            y1={height * 0.78} x2={width * 0.24} y2={height * 0.78} stroke={c} strokeWidth={sw} opacity={op} />
      <Line x1={width * 0.24} y1={height * 0.78} x2={width * 0.24} y2={height}        stroke={c} strokeWidth={sw} opacity={op} />
      <Line x1={0}            y1={height * 0.68} x2={width * 0.14} y2={height * 0.68} stroke={c} strokeWidth={sw} opacity={op} />
      <Line x1={width * 0.14} y1={height * 0.68} x2={width * 0.14} y2={height}        stroke={c} strokeWidth={sw} opacity={op} />
      <Line x1={0}            y1={height * 0.88} x2={width * 0.40} y2={height * 0.88} stroke={c} strokeWidth={sw} opacity={op} />
      <Line x1={width * 0.40} y1={height * 0.88} x2={width * 0.40} y2={height}        stroke={c} strokeWidth={sw} opacity={op} />
      <Circle cx={width * 0.24} cy={height * 0.78} r={1.8} fill={c} opacity={op} />
      <Circle cx={width * 0.14} cy={height * 0.68} r={1.8} fill={c} opacity={op} />
      <Circle cx={width * 0.40} cy={height * 0.88} r={1.8} fill={c} opacity={op} />
    </Svg>
  );
}

// ─── Spinner arc ──────────────────────────────────────────────────────────────

const RADIUS     = 14;
const FULL_CIRC  = 2 * Math.PI * RADIUS;
const ARC_LEN    = FULL_CIRC * 0.35;
const GAP_LEN    = FULL_CIRC * 0.65;

function SpinnerArc() {
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36" accessible={false}>
      <Circle cx={18} cy={18} r={RADIUS} stroke={palette.goldMuted} strokeWidth={2.5} fill="none" />
      <Circle
        cx={18} cy={18} r={RADIUS}
        stroke={palette.gold500}
        strokeWidth={2.5}
        fill="none"
        strokeDasharray={`${ARC_LEN} ${GAP_LEN}`}
        strokeLinecap="round"
        rotation={-90}
        originX={18}
        originY={18}
      />
    </Svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function LaunchScreen() {
  const { session, isReady } = useAuthSession();
  const { width, height }    = useWindowDimensions();
  const { colors }           = useTheme();
  const styles               = useMemo(() => makeStyles(colors), [colors]);

  const [isAnimationDone, setIsAnimationDone] = useState(false);
  const [flowStatus, setFlowStatus]           = useState<FlowStatus | null>(null);
  const [flowChecked, setFlowChecked]         = useState(false);

  const spinAnim = useRef(new Animated.Value(0)).current;

  // Spinner loop
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue:         1,
        duration:        1400,
        easing:          Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  // Mark splash done after duration
  useEffect(() => {
    const id = setTimeout(() => setIsAnimationDone(true), SPLASH_DURATION);
    return () => clearTimeout(id);
  }, []);

  // Fetch flow status once session is ready
  useEffect(() => {
    if (!isReady) return;
    if (!session?.user?.email) {
      setFlowChecked(true);
      return;
    }
    subscriptionService
      .getFlowStatus()
      .then((s) => setFlowStatus(s))
      .catch(() => setFlowStatus(null))
      .finally(() => setFlowChecked(true));
  }, [isReady, session?.user?.email]);

  // Navigate when both are ready
  useEffect(() => {
    if (!isReady || !isAnimationDone || !flowChecked) return;
    if (!session?.user?.email) {
      router.replace('/auth/welcome');
      return;
    }
    if (!flowStatus) {
      router.replace('/(tabs)');
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace(resolveRoute(flowStatus) as any);
  }, [isAnimationDone, isReady, flowChecked, session?.user?.email, flowStatus]);

  const rotate = spinAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <CircuitLines width={width} height={height} />

      <View style={styles.center}>
        <Image
          source={require('@/assets/images/jethro-symbol.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <View style={styles.wordmarkBlock}>
          <Ornament width={70} />
          <Text style={styles.wordmark}>JETHRO</Text>
          <Text style={styles.tagline}>MENTOR DO EMPREENDEDOR CRISTÃO</Text>
          <Ornament width={70} />
        </View>
      </View>

      <View style={styles.spinnerBlock}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <SpinnerArc />
        </Animated.View>
        <Text style={styles.spinnerLabel}>PREPARANDO SUA JORNADA</Text>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex:            1,
      backgroundColor: c.background,
      alignItems:      'center',
      justifyContent:  'center',
    },
    center: {
      alignItems: 'center',
      gap:        32,
    },
    logo: {
      width:  152,
      height: 152,
      ...getShadow(2),
    },
    wordmarkBlock: {
      alignItems: 'center',
      gap:        6,
    },
    wordmark: {
      fontFamily:    FontFamily.serifSemiBold,
      fontSize:      38,
      lineHeight:    42,
      letterSpacing: 4,
      color:         c.ink,
      textTransform: 'uppercase',
    },
    tagline: {
      fontFamily:    FontFamily.sansMedium,
      fontSize:      11,
      lineHeight:    15,
      letterSpacing: 3,
      color:         c.accent,
      textTransform: 'uppercase',
    },
    spinnerBlock: {
      position:   'absolute',
      bottom:     60,
      alignItems: 'center',
      gap:        10,
    },
    spinnerLabel: {
      fontFamily:    FontFamily.sansRegular,
      fontSize:      11,
      lineHeight:    15,
      letterSpacing: 2,
      color:         c.inkMute,
      textTransform: 'uppercase',
    },
  });
}
