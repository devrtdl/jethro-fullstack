import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

export default function AuthCallbackRoute() {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      router.replace('/(tabs)');
    }, 800);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#D7B86E" />
      <Text style={styles.label}>Conectando sua conta...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#07111D',
    gap: 14,
  },
  label: {
    color: '#F6F1E8',
    fontSize: 16,
  },
});
