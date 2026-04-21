import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JethroColors } from '@/constants/theme';
import { onboardingService } from '@/src/services/onboarding/onboarding-service';

type Question = {
  code: string;
  order_index: number;
  label: string;
  helper_text: string | null;
  question_type: string;
  is_required: boolean;
  options: Array<{ value: string; label: string }>;
  metadata: Record<string, unknown>;
};

type Answers = Record<string, string>;

// Simple step grouping: 5 questions per step
function groupIntoSteps(questions: Question[]): Question[][] {
  const steps: Question[][] = [];
  const perStep = 4;
  for (let i = 0; i < questions.length; i += perStep) {
    steps.push(questions.slice(i, i + perStep));
  }
  return steps;
}

function QuestionBlock({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
}) {
  const { question_type, label, helper_text, options, is_required } = question;

  return (
    <View style={styles.qBlock}>
      <Text style={styles.qLabel}>
        {label}
        {is_required ? <Text style={styles.qRequired}> *</Text> : null}
      </Text>
      {helper_text ? <Text style={styles.qHelper}>{helper_text}</Text> : null}

      {question_type === 'single_select' && (
        <View style={styles.optionsWrap}>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.optionPill, value === opt.value && styles.optionPillActive]}
              onPress={() => onChange(opt.value)}
            >
              <Text style={[styles.optionLabel, value === opt.value && styles.optionLabelActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {(question_type === 'text' || question_type === 'email' || question_type === 'number') && (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder="Escreve aqui..."
          placeholderTextColor={JethroColors.muted}
          keyboardType={question_type === 'number' ? 'number-pad' : question_type === 'email' ? 'email-address' : 'default'}
          autoCapitalize={question_type === 'email' ? 'none' : 'words'}
        />
      )}

      {question_type === 'textarea' && (
        <TextInput
          style={[styles.input, styles.textarea]}
          value={value}
          onChangeText={onChange}
          placeholder="Escreve com detalhe..."
          placeholderTextColor={JethroColors.muted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      )}
    </View>
  );
}

export function OnboardingScreen() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [steps, setSteps] = useState<Question[][]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await onboardingService.getQuestions();
        const qs = (data as unknown as { questions: Question[] }).questions ?? (data as unknown as Question[]);
        setQuestions(qs);
        setSteps(groupIntoSteps(qs));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Não foi possível carregar as perguntas.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setAnswer = useCallback((code: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [code]: value }));
  }, []);

  const currentStepQuestions = steps[stepIndex] ?? [];
  const totalSteps = steps.length;
  const isLast = stepIndex === totalSteps - 1;

  function validateStep(): boolean {
    for (const q of currentStepQuestions) {
      if (q.is_required && !answers[q.code]?.trim()) {
        Alert.alert('Resposta necessária', `"${q.label}" é obrigatória.`);
        return false;
      }
    }
    return true;
  }

  function handleNext() {
    if (!validateStep()) return;
    setStepIndex((i) => i + 1);
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      await onboardingService.submit(answers);
      router.replace('/onboarding-result');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao submeter. Tenta novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color={JethroColors.gold} />
        <Text style={styles.loadingText}>A preparar o teu onboarding...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={() => router.replace('/onboarding')}>
          <Text style={styles.retryBtnText}>Tentar novamente</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <Text style={styles.errorText}>Sem perguntas disponíveis.</Text>
        <Pressable style={styles.retryBtn} onPress={() => router.replace('/onboarding-result')}>
          <Text style={styles.retryBtnText}>Continuar sem onboarding</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>✦ Personalização</Text>
          <Text style={styles.title}>Conta-nos mais sobre o teu negócio</Text>
          <Text style={styles.subtitle}>
            Estas respostas permitem ao Jethro criar um plano verdadeiramente personalizado.
          </Text>
        </View>

        {/* Progress */}
        <View style={styles.progressRow}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[styles.progressSeg, i <= stepIndex ? styles.progressSegActive : null]}
            />
          ))}
        </View>
        <Text style={styles.progressLabel}>
          Parte {stepIndex + 1} de {totalSteps}
        </Text>

        {/* Questions */}
        <View style={styles.questionsWrap}>
          {currentStepQuestions.map((q) => (
            <QuestionBlock
              key={q.code}
              question={q}
              value={answers[q.code] ?? ''}
              onChange={(v) => setAnswer(q.code, v)}
            />
          ))}
        </View>

        {/* Navigation */}
        <View style={styles.navRow}>
          {stepIndex > 0 && (
            <Pressable style={styles.backBtn} onPress={() => setStepIndex((i) => i - 1)}>
              <Text style={styles.backBtnText}>← Voltar</Text>
            </Pressable>
          )}
          {isLast ? (
            <Pressable
              style={[styles.nextBtn, submitting && styles.nextBtnDisabled]}
              onPress={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={JethroColors.navy} />
              ) : (
                <Text style={styles.nextBtnText}>Concluir onboarding →</Text>
              )}
            </Pressable>
          ) : (
            <Pressable style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Continuar →</Text>
            </Pressable>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: JethroColors.navy },
  center: { justifyContent: 'center', alignItems: 'center', gap: 16, paddingHorizontal: 24 },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 20 },
  header: { marginBottom: 20, gap: 8 },
  eyebrow: { fontSize: 12, fontWeight: '700', color: JethroColors.gold, letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: '800', color: JethroColors.creme, lineHeight: 34 },
  subtitle: { fontSize: 14, color: JethroColors.muted, lineHeight: 21 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: JethroColors.navyDeep },
  progressSegActive: { backgroundColor: JethroColors.gold },
  progressLabel: { fontSize: 12, color: JethroColors.muted, marginBottom: 20 },
  questionsWrap: { gap: 20, marginBottom: 24 },
  qBlock: { gap: 10 },
  qLabel: { fontSize: 16, fontWeight: '600', color: JethroColors.creme, lineHeight: 23 },
  qRequired: { color: JethroColors.gold },
  qHelper: { fontSize: 13, color: JethroColors.muted, lineHeight: 19 },
  optionsWrap: { gap: 10 },
  optionPill: {
    minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: JethroColors.navySurface,
    backgroundColor: JethroColors.navyDeep, paddingHorizontal: 16, paddingVertical: 14,
    justifyContent: 'center',
  },
  optionPillActive: { borderColor: JethroColors.gold, backgroundColor: JethroColors.goldMuted },
  optionLabel: { fontSize: 15, color: JethroColors.cremeMuted, fontWeight: '500' },
  optionLabelActive: { color: JethroColors.creme, fontWeight: '700' },
  input: {
    backgroundColor: JethroColors.navySurface, borderWidth: 1, borderColor: JethroColors.navyDeep,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: JethroColors.creme,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  navRow: { flexDirection: 'row', gap: 12 },
  backBtn: {
    flex: 1, borderWidth: 1, borderColor: JethroColors.navySurface, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
  },
  backBtnText: { fontSize: 15, fontWeight: '600', color: JethroColors.muted },
  nextBtn: {
    flex: 2, backgroundColor: JethroColors.gold, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.7 },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: JethroColors.navy },
  loadingText: { fontSize: 15, color: JethroColors.muted, marginTop: 12 },
  errorText: { fontSize: 14, color: JethroColors.danger, textAlign: 'center' },
  retryBtn: { backgroundColor: JethroColors.gold, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 24 },
  retryBtnText: { fontSize: 15, fontWeight: '700', color: JethroColors.navy },
});
