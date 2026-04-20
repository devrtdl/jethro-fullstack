import { Stack } from 'expo-router';
import { OnboardingScreen } from '@/src/screens/onboarding-screen';

export default function OnboardingRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingScreen />
    </>
  );
}
