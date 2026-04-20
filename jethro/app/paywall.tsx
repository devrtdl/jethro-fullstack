import { Stack } from 'expo-router';
import { PaywallScreen } from '@/src/screens/paywall-screen';

export default function PaywallRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PaywallScreen />
    </>
  );
}
