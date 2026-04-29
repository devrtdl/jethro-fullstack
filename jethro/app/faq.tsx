import { Stack } from 'expo-router';

import { FaqScreen } from '@/src/screens/faq-screen';

export default function FaqRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <FaqScreen />
    </>
  );
}
