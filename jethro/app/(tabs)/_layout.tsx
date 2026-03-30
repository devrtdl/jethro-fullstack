import { Redirect } from 'expo-router';
import { Stack } from 'expo-router';
import React from 'react';

import { useAuthSession } from '@/src/hooks/use-auth-session';

export default function TabLayout() {
  const { session, isReady } = useAuthSession();

  if (!isReady) {
    return null;
  }

  if (!session?.user?.email) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen
        name="index"
      />
      <Stack.Screen
        name="account"
      />
      <Stack.Screen
        name="explore"
        options={{
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
