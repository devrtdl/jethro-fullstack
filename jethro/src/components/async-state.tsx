import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type AsyncStateProps = {
  isLoading: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
};

export function AsyncState({ isLoading, errorMessage, onRetry }: AsyncStateProps) {
  if (isLoading) {
    return (
      <View style={styles.stateBlock}>
        <ActivityIndicator size="small" color="#1d6b57" />
        <Text style={styles.supportingText}>Consultando a API...</Text>
      </View>
    );
  }

  if (!errorMessage) {
    return null;
  }

  return (
    <View style={styles.stateBlock}>
      <Text style={styles.errorTitle}>Falha ao carregar</Text>
      <Text style={styles.supportingText}>{errorMessage}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryLabel}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stateBlock: {
    gap: 10,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9f2d20',
  },
  supportingText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4d5c48',
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1f4d3c',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
