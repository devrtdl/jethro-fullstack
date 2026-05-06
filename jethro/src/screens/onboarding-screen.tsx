import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { appStorage } from '@/src/lib/app-storage';
import { onboardingService } from '@/src/services/onboarding/onboarding-service';

const DRAFT_KEY = 'onboarding_draft';

type ShowIfAnswer = {
  code: string;
  op: 'eq' | 'neq' | 'in' | 'gt';
  value?: string | number;
  values?: string[];
};

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

// Avalia se uma pergunta deve ser visível com base nas respostas actuais do onboarding
function isVisible(q: Question, answers: Answers): boolean {
  const showIfAnswer = q.metadata?.showIfAnswer as ShowIfAnswer | undefined;
  if (!showIfAnswer) return true;
  const current = answers[showIfAnswer.code] ?? '';
  if (!current) return false;
  switch (showIfAnswer.op) {
    case 'eq':  return current === String(showIfAnswer.value ?? '');
    case 'neq': return current !== String(showIfAnswer.value ?? '');
    case 'in':  return (showIfAnswer.values ?? []).includes(current);
    case 'gt':  return Number(current) > Number(showIfAnswer.value ?? 0);
    default:    return true;
  }
}

// Agrupa perguntas por fase (metadata.phase)
function groupByPhase(questions: Question[]): Question[][] {
  const order = ['1', '3a', '3b', '3c', 'ob', '4', '6'];
  const map = new Map<string, Question[]>();
  for (const q of questions) {
    const phase = String(q.metadata?.phase ?? 'other');
    if (!map.has(phase)) map.set(phase, []);
    map.get(phase)!.push(q);
  }
  const result: Question[][] = [];
  for (const key of order) {
    const group = map.get(key);
    if (group && group.length > 0) result.push(group);
  }
  // Adiciona fases não mapeadas
  for (const [key, group] of map.entries()) {
    if (!order.includes(key) && group.length > 0) result.push(group);
  }
  return result;
}

// ─── Componente de pergunta individual ───────────────────────────────────────

function RangeWithOptional({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
}) {
  // value format: "A" or "A|7500"
  const [rangeCode, optVal] = value.split('|');
  const optionalText = optVal ?? '';

  function selectRange(code: string) {
    // Mantém valor opcional se já existia
    onChange(optionalText ? `${code}|${optionalText}` : code);
  }

  function setOptional(text: string) {
    const code = rangeCode ?? '';
    onChange(text ? `${code}|${text}` : code);
  }

  return (
    <View style={styles.rangeWrap}>
      {question.options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[styles.optionPill, rangeCode === opt.value && styles.optionPillActive]}
          onPress={() => selectRange(opt.value)}
        >
          <Text style={[styles.optionLabel, rangeCode === opt.value && styles.optionLabelActive]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
      {rangeCode && rangeCode !== 'G' && (
        <View style={styles.optionalInputWrap}>
          <Text style={styles.optionalLabel}>Valor exacto (opcional):</Text>
          <TextInput
            style={styles.optionalInput}
            value={optionalText}
            onChangeText={setOptional}
            placeholder="Ex: 8500"
            placeholderTextColor={JethroColors.muted}
            keyboardType="number-pad"
          />
        </View>
      )}
    </View>
  );
}

function MultiSelect({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
}) {
  // value format: "A,B,C"
  const selected = value ? value.split(',').filter(Boolean) : [];

  function toggle(code: string) {
    const next = selected.includes(code)
      ? selected.filter((c) => c !== code)
      : [...selected, code];
    onChange(next.join(','));
  }

  return (
    <View style={styles.optionsWrap}>
      {question.options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <Pressable
            key={opt.value}
            style={[styles.optionPill, active && styles.optionPillActive]}
            onPress={() => toggle(opt.value)}
          >
            <View style={styles.multiRow}>
              <View style={[styles.checkbox, active && styles.checkboxActive]}>
                {active && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                {opt.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

type TeamSlot = { nome: string; funcao: string };

function TeamSlots({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
}) {
  const maxSlots = (question.metadata?.maxSlots as number) ?? 5;

  let slots: TeamSlot[] = [];
  try {
    if (value) slots = JSON.parse(value) as TeamSlot[];
  } catch {}
  if (slots.length === 0) slots = [{ nome: '', funcao: '' }];

  function update(index: number, field: 'nome' | 'funcao', val: string) {
    const next = slots.map((s, i) => (i === index ? { ...s, [field]: val } : s));
    onChange(JSON.stringify(next));
  }

  function addSlot() {
    if (slots.length >= maxSlots) return;
    onChange(JSON.stringify([...slots, { nome: '', funcao: '' }]));
  }

  function removeSlot(index: number) {
    const next = slots.filter((_, i) => i !== index);
    onChange(next.length > 0 ? JSON.stringify(next) : '');
  }

  return (
    <View style={styles.slotsWrap}>
      {slots.map((slot, i) => (
        <View key={i} style={styles.slotCard}>
          <View style={styles.slotHeader}>
            <TextInput
              style={styles.slotNomeInput}
              value={slot.nome}
              onChangeText={(v) => update(i, 'nome', v)}
              placeholder="Nome (opcional)"
              placeholderTextColor={JethroColors.muted}
              autoCapitalize="words"
            />
            {slots.length > 1 && (
              <Pressable style={styles.slotRemoveBtn} onPress={() => removeSlot(i)}>
                <Text style={styles.slotRemoveText}>×</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.funcaoWrap}>
            {question.options.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.funcaoChip, slot.funcao === opt.value && styles.funcaoChipActive]}
                onPress={() => update(i, 'funcao', slot.funcao === opt.value ? '' : opt.value)}
              >
                <Text style={[styles.funcaoChipLabel, slot.funcao === opt.value && styles.funcaoChipLabelActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      {slots.length < maxSlots && (
        <Pressable style={styles.addSlotBtn} onPress={addSlot}>
          <Text style={styles.addSlotText}>+ Adicionar pessoa</Text>
        </Pressable>
      )}
    </View>
  );
}

function QuestionBlock({
  question,
  value,
  onChange,
  answers,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  answers: Answers;
}) {
  if (!isVisible(question, answers)) return null;

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

      {question_type === 'range_with_optional' && (
        <RangeWithOptional question={question} value={value} onChange={onChange} />
      )}

      {question_type === 'multi_select' && (
        <MultiSelect question={question} value={value} onChange={onChange} />
      )}

      {question_type === 'team_slots' && (
        <TeamSlots question={question} value={value} onChange={onChange} />
      )}

      {(question_type === 'text' || question_type === 'email' || question_type === 'number') && (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder="Escreve aqui..."
          placeholderTextColor={JethroColors.muted}
          keyboardType={
            question_type === 'number' ? 'number-pad'
            : question_type === 'email' ? 'email-address'
            : 'default'
          }
          autoCapitalize={question_type === 'email' ? 'none' : 'sentences'}
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

// ─── Ecrã principal ───────────────────────────────────────────────────────────

export function OnboardingScreen() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [steps, setSteps] = useState<Question[][]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draftLoaded = useRef(false);

  useEffect(() => {
    void (async () => {
      try {
        const [data, draftRaw] = await Promise.all([
          onboardingService.getQuestions(),
          appStorage.getItem(DRAFT_KEY),
        ]);
        const qs = (data as unknown as { questions: Question[] }).questions ?? (data as unknown as Question[]);
        setQuestions(qs);
        setSteps(groupByPhase(qs));

        if (draftRaw && draftRaw.length > 2) {
          const draft = JSON.parse(draftRaw) as { answers: Answers; stepIndex: number };
          setAnswers(draft.answers ?? {});
          setStepIndex(draft.stepIndex ?? 0);
        }
        draftLoaded.current = true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Não foi possível carregar as perguntas.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Guarda draft sempre que respostas ou passo mudam
  useEffect(() => {
    if (!draftLoaded.current) return;
    void appStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, stepIndex }));
  }, [answers, stepIndex]);

  const setAnswer = useCallback((code: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [code]: value }));
  }, []);

  const currentStepQuestions = steps[stepIndex] ?? [];
  const totalSteps = steps.length;
  const isLast = stepIndex === totalSteps - 1;

  // Perguntas visíveis no passo actual (filtra condicionais baseadas em respostas)
  const visibleQuestions = currentStepQuestions.filter((q) => isVisible(q, answers));

  function validateStep(): boolean {
    for (const q of visibleQuestions) {
      if (!q.is_required) continue;
      const val = answers[q.code] ?? '';
      const rangeCode = val.split('|')[0] ?? '';
      if (!rangeCode.trim()) {
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
      await appStorage.setItem(DRAFT_KEY, '');
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

  const phaseLabels: Record<string, string> = {
    '1': 'Contexto', '3a': 'Financeiro', '3b': 'Comercial',
    '3c': 'Diagnóstico', 'ob': 'Contexto expandido', '4': 'Aprofundamento', '6': 'Fechamento',
  };
  const currentPhase = String(currentStepQuestions[0]?.metadata?.phase ?? '');
  const phaseLabel = phaseLabels[currentPhase] ?? '';

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
          {phaseLabel ? `${phaseLabel} · ` : ''}Parte {stepIndex + 1} de {totalSteps}
        </Text>

        {/* Questions */}
        <View style={styles.questionsWrap}>
          {currentStepQuestions.map((q) => (
            <QuestionBlock
              key={q.code}
              question={q}
              value={answers[q.code] ?? ''}
              onChange={(v) => setAnswer(q.code, v)}
              answers={answers}
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
  questionsWrap: { gap: 24, marginBottom: 24 },
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
  // Range with optional
  rangeWrap: { gap: 10 },
  optionalInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4,
    backgroundColor: JethroColors.navySurface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: JethroColors.gold,
  },
  optionalLabel: { fontSize: 13, color: JethroColors.gold, flex: 1 },
  optionalInput: {
    fontSize: 15, color: JethroColors.creme, fontWeight: '700',
    minWidth: 80, textAlign: 'right',
  },
  // Multi-select
  multiRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: JethroColors.muted, justifyContent: 'center', alignItems: 'center',
  },
  checkboxActive: { borderColor: JethroColors.gold, backgroundColor: JethroColors.gold },
  checkmark: { fontSize: 13, color: JethroColors.navy, fontWeight: '800' },
  // Text inputs
  input: {
    backgroundColor: JethroColors.navySurface, borderWidth: 1, borderColor: JethroColors.navyDeep,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: JethroColors.creme,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  // Team slots
  slotsWrap:       { gap: 10 },
  slotCard:        {
    backgroundColor: JethroColors.navyDeep, borderRadius: 12, padding: 12, gap: 10,
    borderWidth: 1, borderColor: JethroColors.navySurface,
  },
  slotHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotNomeInput:   {
    flex: 1, height: 40, backgroundColor: JethroColors.navySurface,
    borderRadius: 8, paddingHorizontal: 12, fontSize: 14, color: JethroColors.creme,
    borderWidth: 1, borderColor: JethroColors.navyDeep,
  },
  slotRemoveBtn:   {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: JethroColors.navySurface, alignItems: 'center', justifyContent: 'center',
  },
  slotRemoveText:  { fontSize: 18, color: JethroColors.muted, fontWeight: '700', lineHeight: 22 },
  funcaoWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  funcaoChip:      {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: JethroColors.navySurface, backgroundColor: JethroColors.navySurface,
  },
  funcaoChipActive:      { borderColor: JethroColors.gold, backgroundColor: JethroColors.goldMuted },
  funcaoChipLabel:       { fontSize: 12, color: JethroColors.cremeMuted, fontWeight: '500' },
  funcaoChipLabelActive: { color: JethroColors.creme, fontWeight: '700' },
  addSlotBtn:      {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: JethroColors.navySurface,
  },
  addSlotText:     { fontSize: 14, color: JethroColors.gold, fontWeight: '600' },
  // Navigation
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
