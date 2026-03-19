import { useEffect, useMemo, useState } from 'react';
import { parseSubmissionError } from './components/parseSubmissionError';
import { validateField } from './components/validateField';
import { getPublicForm, submitForm } from '../../lib/api';
import type { FormQuestion, JsonValue, PublicFormResponse, QuestionOption } from '../../types/form';

type FormState = {
  values: Record<string, JsonValue>;
  errors: Record<string, string>;
};

const formSlug = 'diagnostico-inicial';

function initialPhoneValue() {
  return {
    numero: '',
    pais_codigo: '+55',
    pais_iso: 'BR',
  };
}

function getCountryIsoFromState(values: Record<string, JsonValue>) {
  const whatsapp = values.whatsapp;
  if (typeof whatsapp === 'object' && whatsapp && !Array.isArray(whatsapp) && typeof whatsapp.pais_iso === 'string') {
    return whatsapp.pais_iso.toUpperCase();
  }
  return 'DEFAULT';
}

function getQuestionValue(values: Record<string, JsonValue>, question: FormQuestion) {
  return values[question.slug] ?? (question.type === 'phone' ? initialPhoneValue() : '');
}

export function useDiagnosticForm() {
  const [form, setForm] = useState<PublicFormResponse['data'] | null>(null);
  const [state, setState] = useState<FormState>({
    values: { whatsapp: initialPhoneValue() },
    errors: {},
  });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitResult, setSubmitResult] = useState<{
    confirmation: { title: string; message: string };
    score: number;
    scoreBand: string;
  } | null>(null);

  useEffect(() => {
    void getPublicForm(formSlug)
      .then(setForm)
      .finally(() => setIsLoading(false));
  }, []);

  const steps = form?.steps ?? [];
  const questions = form?.questions ?? [];
  const currentStep = steps[currentStepIndex];
  const currentQuestions = useMemo(
    () =>
      questions
        .filter((q) => q.stepId === currentStep?.id && !q.internalOnly)
        .sort((a, b) => a.order - b.order),
    [currentStep?.id, questions]
  );

  function setFieldValue(question: FormQuestion, value: JsonValue) {
    // Validamos na mudança para o usuário ver o problema no próprio step, antes do submit final.
    const nextError = validateField(question, value);

    setState((current) => ({
      ...current,
      values: { ...current.values, [question.slug]: value },
      // Validamos na mudanca para o usuario ver o problema no proprio step, antes do submit final.
      errors: { ...current.errors, [question.slug]: nextError ?? '' },
    }));
  }

  function getRevenueOptions(question: FormQuestion): QuestionOption[] {
    const countryIso = getCountryIsoFromState(state.values);
    const source = question.dynamicOptionsByCountry ?? form?.runtime.revenueBandsByCountry ?? {};
    return source[countryIso] ?? source.DEFAULT ?? [];
  }

  function validateCurrentStep() {
    const errors: Record<string, string> = {};

    for (const question of currentQuestions) {
      const value = getQuestionValue(state.values, question);
      const erro = validateField(question, value);
      if (erro) errors[question.slug] = erro;
    }

    setState((current) => ({
      ...current,
      errors: { ...current.errors, ...errors },
    }));

    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    if (!validateCurrentStep()) return;
    setCurrentStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep() {
    setCurrentStepIndex((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit() {
    if (!form) return;
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);

    setState((current) => ({
      ...current,
      errors: { ...current.errors, _global: '' },
    }));

    try {
      const answers = questions
        .filter((question) => !question.internalOnly)
        .map((question) => ({
          questionId: question.id,
          value: getQuestionValue(state.values, question),
        }));

      const result = await submitForm(form.slug, {
        sessionId: `frontend-${Date.now()}`,
        answers,
      });

      setSubmitResult({
        confirmation: result.confirmation,
        score: result.derived.score,
        scoreBand: result.derived.scoreBand,
      });

    } catch (error) {
      const { fieldErrors, globalError } = parseSubmissionError(error);

      setState((current) => ({
        ...current,
        errors: { ...current.errors, ...fieldErrors, _global: globalError },
      }));

    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    form,
    steps,
    currentStep,
    currentStepIndex,
    currentQuestions,
    values: state.values,
    errors: state.errors,
    isLoading,
    isSubmitting,
    submitResult,
    setFieldValue,
    getQuestionValue,
    getRevenueOptions,
    nextStep,
    previousStep,
    handleSubmit,
  };
}
