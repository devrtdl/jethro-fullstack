import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { palette } from '@/src/theme/colors';
import { getShadow, Radius, Spacing } from '@/src/theme/spacing';
import { FontFamily } from '@/src/theme/typography';

export type LessonState = 'default' | 'done' | 'current';

type Props = {
  index: number;
  title: string;
  duration: string;
  state?: LessonState;
  onPress?: () => void;
  style?: ViewStyle;
};

export function LessonRow({ index, title, duration, state = 'default', onPress, style }: Props) {
  if (state === 'current') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Aula ${index}: ${title}. Em andamento.`}
      >
        <LinearGradient
          colors={[palette.navy800, palette.navy700]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.row, styles.rowCurrent, style]}
        >
          <View style={styles.indexCircleCurrent}>
            <Ionicons name="play" size={14} color={palette.navy800} />
          </View>
          <View style={styles.body}>
            <Text style={styles.titleCurrent} numberOfLines={2}>{title}</Text>
            <Text style={styles.subCurrent}>Em andamento · {duration}</Text>
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  if (state === 'done') {
    return (
      <Pressable
        style={[styles.row, styles.rowDefault, style]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Aula ${index}: ${title}. Concluída.`}
      >
        <View style={[styles.indexCircle, styles.indexCircleDone]}>
          <Ionicons name="checkmark" size={14} color={palette.gold500} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, styles.titleDone]} numberOfLines={2}>{title}</Text>
          <Text style={styles.sub}>Aula {index} · {duration}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.row, styles.rowDefault, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Aula ${index}: ${title}. Duração ${duration}.`}
    >
      <View style={styles.indexCircle}>
        <Text style={styles.indexText}>{index}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.sub}>Aula {index} · {duration}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={palette.inkMute} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.sm,
  },
  rowDefault: {
    backgroundColor: palette.paperCard,
    borderWidth: 1,
    borderColor: palette.hairline,
    ...getShadow(1),
  },
  rowCurrent: {
    ...getShadow(2),
  },
  indexCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.hairline,
    backgroundColor: palette.paperCard,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  indexCircleDone: {
    backgroundColor: palette.goldMuted,
    borderColor: 'transparent',
  },
  indexCircleCurrent: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.gold500,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  indexText: {
    fontFamily: FontFamily.serifMedium,
    fontSize: 15,
    color: palette.navy800,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: FontFamily.serifMedium,
    fontSize: 14.5,
    color: palette.navy800,
    lineHeight: 20,
  },
  titleDone: {
    color: palette.inkSoft,
  },
  titleCurrent: {
    fontFamily: FontFamily.serifMedium,
    fontSize: 14.5,
    color: palette.paperCard,
    lineHeight: 20,
  },
  sub: {
    fontFamily: FontFamily.sansRegular,
    fontSize: 11,
    color: palette.inkMute,
  },
  subCurrent: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 11,
    color: palette.gold400,
  },
});
