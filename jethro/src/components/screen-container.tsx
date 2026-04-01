import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenContainerProps = PropsWithChildren<{
  padded?: boolean;
  backgroundColor?: string;
  contentStyle?: ViewStyle;
}>;

export function ScreenContainer({ children, padded = true, backgroundColor, contentStyle }: ScreenContainerProps) {
  return (
    <SafeAreaView style={[styles.safeArea, backgroundColor ? { backgroundColor } : null]}>
      <ScrollView contentContainerStyle={[styles.content, padded && styles.padded]}>
        <View style={[styles.stack, contentStyle]}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1F3B',
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
