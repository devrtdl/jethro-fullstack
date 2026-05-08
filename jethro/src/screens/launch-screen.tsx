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
const LOGO_SIZE = 152;
const RING_SIZE = 240;

function resolveRoute(status: FlowStatus): string {
  if (!status.hasDiagnostic) return '/diagnostico';
  if (!status.hasSubscription) return '/paywall';
  if (!status.hasOnboarding) return '/onboarding';
  if (!status.hasPlan) return '/onboarding-result';
  return '/(tabs)';
}

// ─── Decorative circuit lines ─────────────────────────────────────────────────

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

const RADIUS    = 14;
const FULL_CIRC = 2 * Math.PI * RADIUS;
const ARC_LEN   = FULL_CIRC * 0.35;
const GAP_LEN   = FULL_CIRC * 0.65;

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

  // ─── Animated values ────────────────────────────────────────────────────────
  const spinAnim   = useRef(new Animated.Value(0)).current;
  const floatAnim  = useRef(new Animated.Value(0)).current;
  const breatheAnim= useRef(new Animated.Value(1)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const ring1Anim  = useRef(new Animated.Value(0)).current;
  const ring2Anim  = useRef(new Animated.Value(0)).current;
  const ring3Anim  = useRef(new Animated.Value(0)).current;
  const scanAnim   = useRef(new Animated.Value(0)).current;

  // ─── Start all animations ───────────────────────────────────────────────────
  useEffect(() => {
    // Spinner rotation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true,
      })
    ).start();

    // Logo float (translateY 0 → -10 → 0, 4 s)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim,  { toValue: -10, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim,  { toValue:   0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Logo breathe (scale 1.0 → 1.03 → 1.0, 4 s)
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.03, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1.00, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Glow pulse (0 → 1 → 0, 3 s)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Radar rings — each loops independently with a one-time initial delay
    function ringLoop(anim: Animated.Value, initialDelay: number) {
      anim.setValue(0);
      Animated.sequence([
        Animated.delay(initialDelay),
        Animated.timing(anim, { toValue: 1, duration: 3500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) ringLoop(anim, 0);
      });
    }
    ringLoop(ring1Anim, 0);
    ringLoop(ring2Anim, 1100);
    ringLoop(ring3Anim, 2200);

    // Scan line sweep (0 → 1, 2.8 s, loops with short pause)
    Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(scanAnim, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.delay(400),
        Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [spinAnim, floatAnim, breatheAnim, glowAnim, ring1Anim, ring2Anim, ring3Anim, scanAnim]);

  // ─── Routing logic ──────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => setIsAnimationDone(true), SPLASH_DURATION);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!session?.user?.email) { setFlowChecked(true); return; }
    subscriptionService
      .getFlowStatus()
      .then((s) => setFlowStatus(s))
      .catch(() => setFlowStatus(null))
      .finally(() => setFlowChecked(true));
  }, [isReady, session?.user?.email]);

  useEffect(() => {
    if (!isReady || !isAnimationDone || !flowChecked) return;
    if (!session?.user?.email) { router.replace('/auth/welcome'); return; }
    if (!flowStatus)           { router.replace('/(tabs)');       return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace(resolveRoute(flowStatus) as any);
  }, [isAnimationDone, isReady, flowChecked, session?.user?.email, flowStatus]);

  // ─── Interpolated values ────────────────────────────────────────────────────
  const rotate   = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.80] });
  const glowScale   = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] });

  const ring1Scale   = ring1Anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.5] });
  const ring1Opacity = ring1Anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });
  const ring2Scale   = ring2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.5] });
  const ring2Opacity = ring2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });
  const ring3Scale   = ring3Anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.5] });
  const ring3Opacity = ring3Anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });

  const scanTranslateY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, LOGO_SIZE] });

  return (
    <View style={styles.container}>
      <CircuitLines width={width} height={height} />

      <View style={styles.center}>
        {/* ── Logo section: rings + glow + logo + scan ── */}
        <View style={styles.logoSection}>
          {/* Radar rings */}
          <Animated.View style={[styles.ring, { opacity: ring1Opacity, transform: [{ scale: ring1Scale }] }]} />
          <Animated.View style={[styles.ring, { opacity: ring2Opacity, transform: [{ scale: ring2Scale }] }]} />
          <Animated.View style={[styles.ring, { opacity: ring3Opacity, transform: [{ scale: ring3Scale }] }]} />

          {/* Glow */}
          <Animated.View style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />

          {/* Logo with float + breathe */}
          <Animated.View style={{ transform: [{ translateY: floatAnim }, { scale: breatheAnim }] }}>
            {/* Scan line overlay on logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/jethro-symbol.png')}
                style={styles.logo}
                contentFit="contain"
              />
              <Animated.View
                style={[styles.scanLine, { transform: [{ translateY: scanTranslateY }] }]}
                pointerEvents="none"
              />
            </View>
          </Animated.View>
        </View>

        {/* Wordmark */}
        <View style={styles.wordmarkBlock}>
          <Ornament width={70} />
          <Text style={styles.wordmark}>JETHRO</Text>
          <Text style={styles.tagline}>MENTOR DO EMPREENDEDOR CRISTÃO</Text>
          <Ornament width={70} />
        </View>
      </View>

      {/* Spinner */}
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

    // ── Logo section (rings, glow, logo) ───────────────────────────────────────
    logoSection: {
      width:          RING_SIZE,
      height:         RING_SIZE,
      alignItems:     'center',
      justifyContent: 'center',
    },
    ring: {
      position:    'absolute',
      width:       RING_SIZE,
      height:      RING_SIZE,
      borderRadius: RING_SIZE / 2,
      borderWidth:  1,
      borderColor:  'rgba(212,175,55,0.30)',
    },
    glow: {
      position:        'absolute',
      width:           200,
      height:          200,
      borderRadius:    100,
      backgroundColor: 'rgba(212,175,55,0.15)',
    },
    logoContainer: {
      width:    LOGO_SIZE,
      height:   LOGO_SIZE,
      overflow: 'hidden',
    },
    logo: {
      width:  LOGO_SIZE,
      height: LOGO_SIZE,
      ...getShadow(2),
    },
    scanLine: {
      position:        'absolute',
      top:             0,
      left:            0,
      right:           0,
      height:          2,
      borderRadius:    1,
      backgroundColor: 'rgba(212,175,55,0.65)',
    },

    // ── Wordmark ───────────────────────────────────────────────────────────────
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

    // ── Spinner ────────────────────────────────────────────────────────────────
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
