import { useEffect, useState } from 'react';

import { authService } from '@/src/services/auth/auth-service';
import { diagnosticService } from '@/src/services/diagnostic/diagnostic-service';
import type {
  FormQuestion,
  JsonValue,
  PublicFormData,
  QuestionOption,
  SubmissionResult,
} from '@/src/types/diagnostic-form';
import { ApiError } from '@/src/types/api';

type UseDiagnosticFormOptions = {
  enabled: boolean;
  prefillEmail?: string;
  prefillName?: string;
};

type FormState = {
  values: Record<string, JsonValue>;
  errors: Record<string, string>;
};

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

function validateField(question: FormQuestion, value: JsonValue): string | undefined {
  if (question.required) {
    const empty =
      value === '' ||
      value === null ||
      value === undefined ||
      (typeof value === 'string' && !value.trim()) ||
      (typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        question.type === 'money_range' &&
        typeof value.faixa === 'string' &&
        !value.faixa.trim()) ||
      (typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        question.type === 'phone' &&
        typeof value.numero === 'string' &&
        !value.numero.trim());

    if (empty) {
      return 'Preencha este campo para continuar.';
    }
  }

  if (question.type === 'email' && typeof value === 'string' && value.trim()) {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    if (!isValidEmail) {
      return 'Informe um e-mail valido.';
    }
  }

  if (question.slug === 'nome_completo' && typeof value === 'string' && value.trim()) {
    const words = value.trim().split(/\s+/);
    if (words.length < 2) {
      return 'Informe nome e sobrenome.';
    }
  }

  if (question.type === 'phone') {
    const phone = typeof value === 'object' && value && !Array.isArray(value) ? value : null;
    if (!phone) {
      return question.required ? 'Preencha este campo para continuar.' : undefined;
    }

    const number = typeof phone.numero === 'string' ? phone.numero.trim() : '';
    const countryCode = typeof phone.pais_codigo === 'string' ? phone.pais_codigo.trim() : '';
    const countryIso = typeof phone.pais_iso === 'string' ? phone.pais_iso.trim().toUpperCase() : '';

    if (!number) {
      return question.required ? 'Preencha este campo para continuar.' : undefined;
    }

    if (!/^\+\d{10,15}$/.test(number) || !/^\+\d{1,4}$/.test(countryCode) || !/^[A-Z]{2}$/.test(countryIso)) {
      return 'Numero invalido para o pais selecionado.';
    }
  }

  if (question.type === 'money_range') {
    const revenue = typeof value === 'object' && value && !Array.isArray(value) ? value : null;
    if (!revenue) {
      return question.required ? 'Preencha este campo para continuar.' : undefined;
    }

    const faixa = typeof revenue.faixa === 'string' ? revenue.faixa.trim() : '';
    const moeda = typeof revenue.moeda === 'string' ? revenue.moeda.trim() : '';
    const pais = typeof revenue.pais === 'string' ? revenue.pais.trim() : '';

    if (!faixa || !moeda || !pais) {
      return 'Selecione uma faixa de faturamento valida.';
    }
  }

  if (question.type === 'number' && value !== '' && value !== null && value !== undefined) {
    const numericValue =
      typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;

    if (Number.isNaN(numericValue)) {
      return 'Informe um numero valido.';
    }

    if (question.validation.min !== undefined && numericValue < question.validation.min) {
      return `Minimo de ${question.validation.min}.`;
    }

    if (question.validation.max !== undefined && numericValue > question.validation.max) {
      return `Maximo de ${question.validation.max}.`;
    }
  }

  if ((question.type === 'text' || question.type === 'textarea') && typeof value === 'string' && value.trim()) {
    if (question.validation.minLength !== undefined && value.trim().length < question.validation.minLength) {
      return `Minimo de ${question.validation.minLength} caracteres.`;
    }

    if (question.validation.maxLength !== undefined && value.trim().length > question.validation.maxLength) {
      return `Maximo de ${question.validation.maxLength} caracteres.`;
    }
  }

  return undefined;
}

function parseSubmissionError(error: unknown) {
  const fallback = {
    fieldErrors: {} as Record<string, string>,
    globalError: 'Não foi possível enviar o diagnóstico. Tente novamente.',
  };

  if (!(error instanceof Error)) {
    return fallback;
  }

  const details = error as Error & { details?: { fields?: Record<string, string> } };
  return {
    fieldErrors: details.details?.fields ?? {},
    globalError: error.message || fallback.globalError,
  };
}

export function useDiagnosticForm({ enabled, prefillEmail, prefillName }: UseDiagnosticFormOptions) {
  const [form, setForm] = useState<PublicFormData | null>(null);
  const [state, setState] = useState<FormState>({
    values: { whatsapp: initialPhoneValue() },
    errors: {},
  });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmissionResult | null>(null);
  const [isViewingSavedResult, setIsViewingSavedResult] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    void Promise.allSettled([
      diagnosticService.getPublicForm(),
      prefillEmail ? authService.getLatestDiagnostic(prefillEmail) : Promise.resolve(null),
    ])
      .then(([formResult, latestDiagnosticResult]) => {
        if (formResult.status !== 'fulfilled') {
          throw formResult.reason;
        }

        const nextForm = formResult.value;
        setForm(nextForm);
        setState((current) => ({
          ...current,
          values: {
            ...current.values,
            whatsapp: current.values.whatsapp ?? initialPhoneValue(),
            ...(prefillEmail ? { email: prefillEmail } : {}),
            ...(prefillName ? { nome_completo: prefillName } : {}),
          },
        }));

        if (latestDiagnosticResult?.status === 'fulfilled' && latestDiagnosticResult.value) {
          setSubmitResult(latestDiagnosticResult.value);
          setIsViewingSavedResult(true);
        }

        if (
          latestDiagnosticResult?.status === 'rejected' &&
          !(latestDiagnosticResult.reason instanceof ApiError && latestDiagnosticResult.reason.status === 404)
        ) {
          throw latestDiagnosticResult.reason;
        }
      })
      .catch((error) => {
        setForm(null);
        setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar o formulário do diagnóstico.');
      })
      .finally(() => setIsLoading(false));
  }, [enabled, prefillEmail, prefillName]);

  const steps = form?.steps ?? [];
  const questions = form?.questions ?? [];
  const currentStep = steps[currentStepIndex];
  const currentQuestions = questions
    .filter((question) => question.stepId === currentStep?.id && !question.internalOnly)
    .sort((left, right) => left.order - right.order);
  const selectedCountryIso = getCountryIsoFromState(state.values);

  function setFieldValue(question: FormQuestion, value: JsonValue) {
    const nextError = validateField(question, value);
    setState((current) => ({
      ...current,
      values: { ...current.values, [question.slug]: value },
      errors: { ...current.errors, [question.slug]: nextError ?? '' },
    }));
  }

  function getRevenueOptions(question: FormQuestion): QuestionOption[] {
    const countryIso = getCountryIsoFromState(state.values);
    const source = question.dynamicOptionsByCountry ?? form?.runtime.revenueBandsByCountry ?? {};
    return source[countryIso] ?? source.DEFAULT ?? [];
  }

  function validateCurrentStep() {
    const nextErrors: Record<string, string> = {};
    for (const question of currentQuestions) {
      const value = getQuestionValue(state.values, question);
      const nextError = validateField(question, value);
      if (nextError) {
        nextErrors[question.slug] = nextError;
      }
    }

    setState((current) => ({
      ...current,
      errors: { ...current.errors, ...nextErrors },
    }));

    return Object.keys(nextErrors).length === 0;
  }

  function nextStep() {
    if (!validateCurrentStep()) {
      return;
    }

    setCurrentStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep() {
    setCurrentStepIndex((current) => Math.max(current - 1, 0));
  }

  async function submit() {
    if (!form || !validateCurrentStep()) {
      return;
    }

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

      const result = await diagnosticService.submitForm({
        sessionId: `mobile-${Date.now()}`,
        answers,
      });

      setSubmitResult(result);
      setIsViewingSavedResult(false);
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

  function reset() {
    setCurrentStepIndex(0);
    setSubmitResult(null);
    setIsViewingSavedResult(false);
    setState({
      values: {
        whatsapp: initialPhoneValue(),
        ...(prefillEmail ? { email: prefillEmail } : {}),
        ...(prefillName ? { nome_completo: prefillName } : {}),
      },
      errors: {},
    });
  }

  return {
    form,
    steps,
    currentStep,
    currentStepIndex,
    currentQuestions,
    selectedCountryIso,
    values: state.values,
    errors: state.errors,
    isLoading,
    loadError,
    isSubmitting,
    submitResult,
    isViewingSavedResult,
    setFieldValue,
    getQuestionValue,
    getRevenueOptions,
    nextStep,
    previousStep,
    submit,
    reset,
  };
}
