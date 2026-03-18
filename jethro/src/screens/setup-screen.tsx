import { StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '@/src/components/screen-container';
import { SectionCard } from '@/src/components/section-card';

const structureItems = [
  'app/: rotas do Expo Router',
  'src/screens/: composicao das telas',
  'src/components/: componentes reutilizaveis',
  'src/services/: cliente HTTP e services',
  'src/hooks/: hooks de integracao e estado',
];

const qualityItems = ['npm run lint', 'npm run typecheck', 'README com setup local e ambiente'];

export function SetupScreen() {
  return (
    <ScreenContainer>
      <SectionCard style={styles.banner}>
        <Text style={styles.bannerTitle}>Setup inicial pronto para desenvolvimento</Text>
        <Text style={styles.bannerText}>
          Esta base separa UI de acesso a dados e deixa a integracao com API preparada para crescer com seguranca.
        </Text>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Estrutura padrao</Text>
        {structureItems.map((item) => (
          <Text key={item} style={styles.listItem}>
            - {item}
          </Text>
        ))}
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Base de qualidade</Text>
        {qualityItems.map((item) => (
          <Text key={item} style={styles.listItem}>
            - {item}
          </Text>
        ))}
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#f7eadf',
    borderColor: '#e9d3bf',
  },
  bannerTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#4a2c16',
  },
  bannerText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6d4a31',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2a1d',
  },
  listItem: {
    fontSize: 15,
    lineHeight: 22,
    color: '#42503d',
  },
});
