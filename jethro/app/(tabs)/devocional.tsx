import { useTheme } from '@/src/theme/ThemeContext';
import { FontFamily } from '@/src/theme/typography';
import { Spacing } from '@/src/theme/spacing';
import { palette } from '@/src/theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

export default function DevocionalTab() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={s.container}>
        <Text style={[s.icon, { color: palette.gold500 }]}>✦</Text>
        <Text style={[s.title, { color: colors.ink }]}>Devocional</Text>
        <Text style={[s.sub, { color: colors.inkMute }]}>
          Esta secção será lançada em breve.{'\n'}Aqui encontrará os seus 192 devocionais do programa PBN.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.screenH },
  icon:      { fontSize: 36, marginBottom: 16 },
  title:     { fontFamily: FontFamily.serifMedium, fontSize: 24, marginBottom: 10 },
  sub:       { fontFamily: FontFamily.sansRegular, fontSize: 14, lineHeight: 22, textAlign: 'center', color: '#8A7F72' },
});
