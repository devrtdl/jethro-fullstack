import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

import { authService } from '@/src/services/auth/auth-service';

export default function AuthCallbackRoute() {
  const [message, setMessage] = useState('Conectando sua conta...');
  const url = Linking.useURL();

  useEffect(() => {
    let isMounted = true;

    async function finishOAuth() {
      if (!url) {
        return;
      }

      try {
        await authService.completeOAuthSession(url);
        if (isMounted) {
          router.replace('/(tabs)');
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : 'Nao foi possivel concluir o login social.');
          setTimeout(() => {
            router.replace('/auth/login');
          }, 1200);
        }
      }
    }

    void finishOAuth();

    return () => {
      isMounted = false;
    };
  }, [url]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#D7B86E" />
      <Text style={styles.label}>{message}</Text>
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
