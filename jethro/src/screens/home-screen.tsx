import { StyleSheet, Text, View } from 'react-native';

import { AsyncState } from '@/src/components/async-state';
import { ScreenContainer } from '@/src/components/screen-container';
import { SectionCard } from '@/src/components/section-card';
import { StatusBadge } from '@/src/components/status-badge';
import { env } from '@/src/config/env';
import { useHealthCheck } from '@/src/hooks/use-health-check';

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

export function HomeScreen() {
  const { data, error, isLoading, refetch } = useHealthCheck();
  const healthStatus = data?.status?.toLowerCase() === 'ok' ? 'success' : data ? 'neutral' : 'error';

  return (
    <ScreenContainer>
      <SectionCard style={styles.heroCard}>
        <Text style={styles.eyebrow}>Jethro Mobile</Text>
        <Text style={styles.title}>Base estavel para React Native com API pronta para evoluir.</Text>
        <Text style={styles.description}>
          A tela inicial usa a camada `service`, aplica timeout e exibe estados padronizados de loading e erro.
        </Text>
      </SectionCard>

      <SectionCard>
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Health check da API</Text>
          <StatusBadge
            label={isLoading ? 'carregando' : error ? 'erro' : data?.status ?? 'sem resposta'}
            tone={isLoading ? 'neutral' : healthStatus}
          />
        </View>

        <AsyncState isLoading={isLoading} errorMessage={error?.message} onRetry={refetch} />

        {!isLoading && !error && data ? (
          <View style={styles.dataGrid}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Status</Text>
              <Text style={styles.dataValue}>{formatValue(data.status)}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Mensagem</Text>
              <Text style={styles.dataValue}>{formatValue(data.message)}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Ambiente</Text>
              <Text style={styles.dataValue}>{formatValue(data.environment)}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Timestamp</Text>
              <Text style={styles.dataValue}>{formatValue(data.timestamp)}</Text>
            </View>
          </View>
        ) : null}
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Configuracao ativa</Text>
        <View style={styles.dataGrid}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>App env</Text>
            <Text style={styles.dataValue}>{env.appEnv}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>API base URL</Text>
            <Text style={styles.dataValue}>{env.apiBaseUrl}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Timeout</Text>
            <Text style={styles.dataValue}>{env.apiTimeoutMs} ms</Text>
          </View>
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#1f4d3c',
    borderColor: '#1f4d3c',
  },
  eyebrow: {
    color: '#b8d8b2',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  description: {
    color: '#dbeade',
    fontSize: 16,
    lineHeight: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2a1d',
  },
  dataGrid: {
    gap: 12,
  },
  dataRow: {
    gap: 4,
  },
  dataLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5f6d59',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dataValue: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1f2a1d',
  },
});
