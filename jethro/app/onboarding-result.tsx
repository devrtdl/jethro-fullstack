import { Stack } from 'expo-router';
import { OnboardingResultScreen } from '@/src/screens/onboarding-result-screen';

export default function OnboardingResultRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingResultScreen />
    </>
  );
}
