import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenContainerProps = PropsWithChildren<{
  padded?: boolean;
}>;

export function ScreenContainer({ children, padded = true }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, padded && styles.padded]}>
        <View style={styles.stack}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7f1',
  },
  content: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stack: {
    gap: 16,
  },
});
