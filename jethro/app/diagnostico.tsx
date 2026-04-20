import { Stack } from 'expo-router';

import { HomeScreen } from '@/src/screens/home-screen';

export default function DiagnosticoRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <HomeScreen />
    </>
  );
}
