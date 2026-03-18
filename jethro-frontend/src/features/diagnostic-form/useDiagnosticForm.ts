import { useEffect, useMemo, useState } from 'react';

import { getPublicForm, submitForm } from '../../lib/api';
import type { FormQuestion, JsonValue, PublicFormResponse, QuestionOption } from '../../types/form';

type FormState = {
  values: Record<string, JsonValue>;
  errors: Record<string, string>;
};

const formSlug = 'diagnostico-inicial';

function initialPhoneValue() {
  // deixei um valor inicial simples para o fluxo funcionar sem biblioteca externa.
  // se a gente plugar um componente de telefone depois, a ideia e continuar retornando esse shape.
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

  // fallback para nao travar o select de faturamento quando o telefone ainda nao foi preenchido.
  return 'DEFAULT';
}

function getQuestionValue(values: Record<string, JsonValue>, question: FormQuestion) {
  return values[question.slug] ?? (question.type === 'phone' ? initialPhoneValue() : '');
}

export function useDiagnosticForm() {
  const [form, setForm] = useState<PublicFormResponse['data'] | null>(null);
  const [state, setState] = useState<FormState>({
    values: {
      whatsapp: initialPhoneValue(),
    },
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
    // por enquanto estou buscando o formulario uma vez e usando o backend como fonte da verdade.
    // se a gente precisar cachear isso depois, da para subir esse fetch para um provider ou react-query.
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
        .filter((question) => question.stepId === currentStep?.id && !question.internalOnly)
        .sort((left, right) => left.order - right.order),
    [currentStep?.id, questions]
  );

  function setFieldValue(question: FormQuestion, value: JsonValue) {
    // sempre que o usuario mexe no campo eu ja limpo o erro local dele.
    // isso deixa a navegacao mais fluida sem precisar resetar o form inteiro.
    setState((current) => ({
      ...current,
      values: {
        ...current.values,
        [question.slug]: value,
      },
      errors: {
        ...current.errors,
        [question.slug]: '',
      },
    }));
  }

  function getRevenueOptions(question: FormQuestion): QuestionOption[] {
    // faturamento depende do pais_iso do whatsapp.
    // preferi resolver isso aqui no hook para o componente de campo continuar burro.
    const countryIso = getCountryIsoFromState(state.values);
    const source = question.dynamicOptionsByCountry ?? form?.runtime.revenueBandsByCountry ?? {};
    return source[countryIso] ?? source.DEFAULT ?? [];
  }

  function validateCurrentStep() {
    const errors: Record<string, string> = {};

    // TODO Pollynerd: aqui ainda esta bem basico.
    // a ideia e depois validar melhor cada tipo de campo sem duplicar a regra do backend.
    for (const question of currentQuestions) {
      const value = getQuestionValue(state.values, question);

      // a validacao forte continua no backend.
      // aqui eu deixei so o basico para guiar o fluxo e evitar submit/navegacao vazia.
      if (
        question.required &&
        ((typeof value === 'string' && !value.trim()) ||
          (typeof value === 'number' && Number.isNaN(value)) ||
          (typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            question.type === 'phone' &&
            typeof value.numero === 'string' &&
            !value.numero.trim()))
      ) {
        errors[question.slug] = 'Preencha este campo para continuar.';
      }
    }

    setState((current) => ({
      ...current,
      errors: {
        ...current.errors,
        ...errors,
      },
    }));

    return Object.keys(errors).length === 0;
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

  async function handleSubmit() {
    if (!form) {
      return;
    }

    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // o payload segue a estrutura do backend.
      // deixei assim porque o junior vai precisar mapear menos coisa quando for evoluir a tela.
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
      // mais para frente da para guardar esse retorno em analytics, dashboard ou tela de resumo.
    } finally {
      setIsSubmitting(false);
    }
  }

  // TODO Pollynerd: se o form crescer muito, separar estado de values/errors em reducer.
  // por enquanto em useState ficou mais rapido de ler e mexer.

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
