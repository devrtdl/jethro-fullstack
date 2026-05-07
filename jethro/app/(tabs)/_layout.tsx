import { BlurView } from 'expo-blur';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useAuthSession } from '@/src/hooks/use-auth-session';
import { useTheme } from '@/src/theme/ThemeContext';
import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color, size }: { name: IoniconsName; color: string; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabLayout() {
  const { session, isReady } = useAuthSession();
  const { colorScheme } = useTheme();

  if (!isReady) return null;
  if (!session?.user?.email) return <Redirect href="/auth/login" />;

  const isDark = colorScheme === 'dark';

  const activeColor   = isDark ? palette.gold500              : palette.navy800;
  const inactiveColor = isDark ? 'rgba(239,239,234,0.45)'     : palette.inkMute;
  const bgColor       = isDark ? 'rgba(11,31,59,0.92)'        : 'rgba(239,239,234,0.92)';
  const borderColor   = isDark ? 'rgba(239,239,234,0.10)'     : palette.hairline;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: bgColor,
          borderTopColor:  borderColor,
          borderTopWidth:  StyleSheet.hairlineWidth,
          paddingTop:      10,
          paddingBottom:   Platform.OS === 'ios' ? 28 : 8,
          height:          Platform.OS === 'ios' ? 88 : 68,
          position:        'absolute',
        },
        // Translucent blur background (falls back to solid bgColor on Android)
        tabBarBackground: () => (
          <BlurView
            intensity={60}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ),
        // Custom label: text + gold dot under active tab
        tabBarLabel: ({ focused, color, children }) => (
          <View style={styles.labelWrap}>
            <Text style={[styles.labelText, { color }]}>{children as string}</Text>
            {focused ? <View style={styles.activeDot} /> : <View style={styles.dotPlaceholder} />}
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="mentor"
        options={{
          title: 'Mentor',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="biblioteca"
        options={{
          title: 'Biblioteca',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'library' : 'library-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="account" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  labelWrap: {
    alignItems: 'center',
    gap: 2,
  },
  labelText: {
    fontFamily: FontFamily.sansMedium,
    fontSize:   10.5,
    lineHeight: 14,
  },
  activeDot: {
    width:           4,
    height:          4,
    borderRadius:    2,
    backgroundColor: palette.gold500,
  },
  dotPlaceholder: {
    width:  4,
    height: 4,
  },
});
