import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { appStorage } from '@/src/lib/app-storage';
import { onboardingService } from '@/src/services/onboarding/onboarding-service';
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';
import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { getShadow, Radius, Spacing } from '@/src/theme/spacing';
import { EyebrowLabel } from '@/src/components/ui/EyebrowLabel';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { GhostButton } from '@/src/components/ui/GhostButton';

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
  for (const [key, group] of map.entries()) {
    if (!order.includes(key) && group.length > 0) result.push(group);
  }
  return result;
}

// ─── Question sub-components ─────────────────────────────────────────────────

function RangeWithOptional({
  question, value, onChange,
}: {
  question: Question; value: string; onChange: (v: string) => void;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeQuestionStyles(colors), [colors]);
  const [rangeCode, optVal] = value.split('|');
  const optionalText = optVal ?? '';

  function selectRange(code: string) {
    if (rangeCode === code) {
      onChange('');
      return;
    }
    // troca de opção: descarta o valor exato anterior
    onChange(code);
  }
  function setOptional(text: string) {
    const code = rangeCode ?? '';
    onChange(text ? `${code}|${text}` : code);
  }

  return (
    <View style={s.rangeWrap}>
      {question.options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[s.optionPill, rangeCode === opt.value && s.optionPillActive]}
          onPress={() => selectRange(opt.value)}
        >
          <Text style={[s.optionLabel, rangeCode === opt.value && s.optionLabelActive]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
      {rangeCode && rangeCode !== 'G' && (
        <View style={s.optionalInputWrap}>
          <Text style={s.optionalLabel}>Valor exato (opcional):</Text>
          <TextInput
            style={s.optionalInput}
            value={optionalText}
            onChangeText={setOptional}
            placeholder="Ex: 8500"
            placeholderTextColor={colors.inkMute}
            keyboardType="number-pad"
          />
        </View>
      )}
    </View>
  );
}

function MultiSelect({
  question, value, onChange,
}: {
  question: Question; value: string; onChange: (v: string) => void;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeQuestionStyles(colors), [colors]);
  const selected = value ? value.split(',').filter(Boolean) : [];

  function toggle(code: string) {
    const next = selected.includes(code)
      ? selected.filter((c) => c !== code)
      : [...selected, code];
    onChange(next.join(','));
  }

  return (
    <View style={s.optionsWrap}>
      {question.options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <Pressable
            key={opt.value}
            style={[s.optionPill, active && s.optionPillActive]}
            onPress={() => toggle(opt.value)}
          >
            <View style={s.multiRow}>
              <View style={[s.checkbox, active && s.checkboxActive]}>
                {active && <Text style={s.checkmark}>✓</Text>}
              </View>
              <Text style={[s.optionLabel, active && s.optionLabelActive]}>{opt.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

type TeamSlot = { nome: string; funcao: string };

function TeamSlots({
  question, value, onChange,
}: {
  question: Question; value: string; onChange: (v: string) => void;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeQuestionStyles(colors), [colors]);
  const maxSlots = (question.metadata?.maxSlots as number) ?? 5;
  let slots: TeamSlot[] = [];
  try { if (value) slots = JSON.parse(value) as TeamSlot[]; } catch {}
  if (slots.length === 0) slots = [{ nome: '', funcao: '' }];

  function update(index: number, field: 'nome' | 'funcao', val: string) {
    const next = slots.map((sl, i) => (i === index ? { ...sl, [field]: val } : sl));
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
    <View style={s.slotsWrap}>
      {slots.map((slot, i) => (
        <View key={i} style={s.slotCard}>
          <View style={s.slotHeader}>
            <TextInput
              style={s.slotNomeInput}
              value={slot.nome}
              onChangeText={(v) => update(i, 'nome', v)}
              placeholder="Nome (opcional)"
              placeholderTextColor={colors.inkMute}
              autoCapitalize="words"
            />
            {slots.length > 1 && (
              <Pressable style={s.slotRemoveBtn} onPress={() => removeSlot(i)}>
                <Text style={s.slotRemoveText}>×</Text>
              </Pressable>
            )}
          </View>
          <View style={s.funcaoWrap}>
            {question.options.map((opt) => (
              <Pressable
                key={opt.value}
                style={[s.funcaoChip, slot.funcao === opt.value && s.funcaoChipActive]}
                onPress={() => update(i, 'funcao', slot.funcao === opt.value ? '' : opt.value)}
              >
                <Text style={[s.funcaoChipLabel, slot.funcao === opt.value && s.funcaoChipLabelActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      {slots.length < maxSlots && (
        <Pressable style={s.addSlotBtn} onPress={addSlot}>
          <Text style={s.addSlotText}>+ Adicionar pessoa</Text>
        </Pressable>
      )}
    </View>
  );
}

function QuestionBlock({
  question, value, onChange, answers,
}: {
  question: Question; value: string; onChange: (v: string) => void; answers: Answers;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeQuestionStyles(colors), [colors]);

  if (!isVisible(question, answers)) return null;

  const { question_type, label, helper_text, options, is_required } = question;

  return (
    <View style={s.qBlock}>
      <Text style={s.qLabel}>
        {label}
        {is_required ? <Text style={s.qRequired}> *</Text> : null}
      </Text>
      {helper_text ? <Text style={s.qHelper}>{helper_text}</Text> : null}

      {question_type === 'single_select' && (
        <View style={s.optionsWrap}>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              style={[s.optionPill, value === opt.value && s.optionPillActive]}
              onPress={() => onChange(value === opt.value ? '' : opt.value)}
            >
              <Text style={[s.optionLabel, value === opt.value && s.optionLabelActive]}>
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
          style={s.input}
          value={value}
          onChangeText={onChange}
          placeholder="Escreva aqui..."
          placeholderTextColor={colors.inkMute}
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
          style={[s.input, s.textarea]}
          value={value}
          onChangeText={onChange}
          placeholder="Escreva com detalhes..."
          placeholderTextColor={colors.inkMute}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      )}
    </View>
  );
}

function makeQuestionStyles(c: ThemeColors) {
  return StyleSheet.create({
    qBlock:    { gap: 10 },
    qLabel:    { fontFamily: FontFamily.serifMedium, fontSize: 19, color: c.ink, lineHeight: 26 },
    qRequired: { color: c.accent },
    qHelper:   { fontFamily: FontFamily.sansRegular, fontSize: 13, color: c.inkMute, lineHeight: 19 },

    optionsWrap: { gap: 10 },
    optionPill: {
      minHeight: 52, borderRadius: 12, borderWidth: 1.5,
      borderColor: c.hairline, backgroundColor: c.surface,
      paddingHorizontal: 16, paddingVertical: 13, justifyContent: 'center',
      ...getShadow(1),
    },
    optionPillActive:  { borderColor: palette.navy800, backgroundColor: palette.navy800 },
    optionLabel:       { fontFamily: FontFamily.sansMedium,   fontSize: 14, color: c.inkSoft },
    optionLabelActive: { fontFamily: FontFamily.sansSemiBold, fontSize: 14, color: palette.paper },

    rangeWrap: { gap: 10 },
    optionalInputWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4,
      backgroundColor: c.surface, borderRadius: Radius.button, padding: 12,
      borderWidth: 1, borderColor: c.accent,
    },
    optionalLabel: { fontFamily: FontFamily.sansRegular,  fontSize: 13, color: c.accent, flex: 1 },
    optionalInput: { fontFamily: FontFamily.sansSemiBold, fontSize: 15, color: c.ink,   minWidth: 80, textAlign: 'right' },

    multiRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkbox:      { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: c.hairline, justifyContent: 'center', alignItems: 'center', backgroundColor: c.surface },
    checkboxActive:{ borderColor: palette.navy800, backgroundColor: palette.navy800 },
    checkmark:     { fontFamily: FontFamily.sansBold, fontSize: 13, color: palette.paper },

    input: {
      fontFamily: FontFamily.sansRegular, fontSize: 15, color: c.ink,
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.hairline,
      borderRadius: Radius.button, paddingHorizontal: 14, paddingVertical: 13,
      ...getShadow(1),
    },
    textarea: { minHeight: 100, textAlignVertical: 'top' },

    slotsWrap: { gap: 10 },
    slotCard: {
      backgroundColor: c.surface, borderRadius: Radius.button, padding: 12, gap: 10,
      borderWidth: 1, borderColor: c.hairline, ...getShadow(1),
    },
    slotHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
    slotNomeInput: {
      flex: 1, height: 40, backgroundColor: c.background,
      borderRadius: Radius.icon, paddingHorizontal: 12,
      fontFamily: FontFamily.sansRegular, fontSize: 14, color: c.ink,
      borderWidth: 1, borderColor: c.hairline,
    },
    slotRemoveBtn:  { width: 32, height: 32, borderRadius: 16, backgroundColor: c.hairline, alignItems: 'center', justifyContent: 'center' },
    slotRemoveText: { fontFamily: FontFamily.sansBold, fontSize: 18, color: c.inkMute, lineHeight: 22 },
    funcaoWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    funcaoChip:           { paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.icon, borderWidth: 1, borderColor: c.hairline, backgroundColor: c.surface },
    funcaoChipActive:     { borderColor: c.accent, backgroundColor: c.accentMuted },
    funcaoChipLabel:      { fontFamily: FontFamily.sansMedium,   fontSize: 12, color: c.inkSoft },
    funcaoChipLabelActive:{ fontFamily: FontFamily.sansSemiBold, fontSize: 12, color: c.ink },
    addSlotBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: Radius.button, borderWidth: 1, borderColor: c.hairline },
    addSlotText: { fontFamily: FontFamily.sansSemiBold, fontSize: 14, color: c.accent },
  });
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [steps,     setSteps]     = useState<Question[][]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers,   setAnswers]   = useState<Answers>({});
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);
  const [error,     setError]     = useState<string | null>(null);
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

  useEffect(() => {
    if (!draftLoaded.current) return;
    void appStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, stepIndex }));
  }, [answers, stepIndex]);

  const setAnswer = useCallback((code: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [code]: value }));
  }, []);

  const currentStepQuestions = steps[stepIndex] ?? [];
  const totalSteps            = steps.length;
  const isLast                = stepIndex === totalSteps - 1;
  const visibleQuestions      = currentStepQuestions.filter((q) => isVisible(q, answers));

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
      <SafeAreaView style={[s.safe, s.center]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={s.loadingText}>Preparando o seu onboarding...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[s.safe, s.center]} edges={['top']}>
        <Text style={s.errorText}>{error}</Text>
        <Pressable style={s.retryBtn} onPress={() => router.replace('/onboarding')}>
          <Text style={s.retryBtnText}>Tentar novamente</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={[s.safe, s.center]} edges={['top']}>
        <Text style={s.errorText}>Sem perguntas disponíveis.</Text>
        <Pressable style={s.retryBtn} onPress={() => router.replace('/onboarding-result')}>
          <Text style={s.retryBtnText}>Continuar sem onboarding</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const phaseLabels: Record<string, string> = {
    '1':  'Seu contexto',
    '3a': 'Seus números',
    '3b': 'Como você vende',
    '3c': 'Seu histórico',
    'ob': 'Sua estrutura',
    '4':  'Seu potencial',
    '6':  'Para finalizar',
  };
  const currentPhase = String(currentStepQuestions[0]?.metadata?.phase ?? '');
  const phaseLabel   = phaseLabels[currentPhase] ?? '';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.header}>
          <EyebrowLabel>✦ Personalização</EyebrowLabel>
          <Text style={s.title}>Conte-nos mais sobre o seu negócio</Text>
          <Text style={s.subtitle}>
            Suas respostas permitem ao Jethro criar um plano verdadeiramente personalizado.
          </Text>
        </View>

        {/* Progress */}
        <View style={s.progressRow}>
          {steps.map((_, i) => (
            <View key={i} style={[s.progressSeg, i <= stepIndex && s.progressSegActive]} />
          ))}
        </View>
        <Text style={s.progressLabel}>
          {stepIndex + 1}/{totalSteps}{phaseLabel ? ` · ${phaseLabel}` : ''}
        </Text>

        {/* Questions */}
        <View style={s.questionsWrap}>
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
        <View style={s.navRow}>
          {stepIndex > 0 && (
            <GhostButton
              label="← Voltar"
              onPress={() => setStepIndex((i) => i - 1)}
              style={s.backBtn}
            />
          )}
          {isLast ? (
            <PrimaryButton
              label="Concluir onboarding →"
              onPress={() => void handleSubmit()}
              loading={submitting}
              style={s.nextBtn}
            />
          ) : (
            <PrimaryButton
              label="Continuar →"
              onPress={handleNext}
              style={s.nextBtn}
            />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe:   { flex: 1, backgroundColor: c.background },
    center: { justifyContent: 'center', alignItems: 'center', gap: 16, paddingHorizontal: 24 },
    scroll: { flex: 1 },
    container: { paddingHorizontal: Spacing.screenH, paddingTop: 20 },

    header:   { marginBottom: 20, gap: 8 },
    title:    { fontFamily: FontFamily.serifSemiBold, fontSize: 26, color: c.ink,    lineHeight: 32 },
    subtitle: { fontFamily: FontFamily.sansRegular,   fontSize: 14, color: c.inkSoft, lineHeight: 21 },

    progressRow:       { flexDirection: 'row', gap: 4, marginBottom: 6 },
    progressSeg:       { flex: 1, height: 3, borderRadius: 2, backgroundColor: c.hairline },
    progressSegActive: { backgroundColor: c.accent },
    progressLabel:     { fontFamily: FontFamily.sansMedium, fontSize: 11, color: c.accent, letterSpacing: 0.4, marginBottom: 20 },

    questionsWrap: { gap: 24, marginBottom: 24 },

    navRow:  { flexDirection: 'row', gap: 12 },
    backBtn: { flex: 1 },
    nextBtn: { flex: 2 },

    loadingText:  { fontFamily: FontFamily.sansRegular,  fontSize: 15, color: c.inkMute, marginTop: 12 },
    errorText:    { fontFamily: FontFamily.sansRegular,  fontSize: 14, color: c.liveRed, textAlign: 'center' },
    retryBtn:     { backgroundColor: c.accent, borderRadius: Radius.button, paddingVertical: 13, paddingHorizontal: 24 },
    retryBtnText: { fontFamily: FontFamily.sansSemiBold, fontSize: 15, color: palette.navy800 },
  });
}
