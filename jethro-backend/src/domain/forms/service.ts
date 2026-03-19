import { createHmac } from 'node:crypto';

import { env } from '../../config/env.js';
import { getDbPool, hasDatabaseConfig } from '../../lib/db.js';
import { AppError } from '../../lib/errors.js';
import { createId } from '../../lib/id.js';
import type {
  EventInput,
  FormInput,
  FormUpdateInput,
  QuestionInput,
  SubmissionInput,
} from './schemas.js';
import {
  InMemoryFormsRepository,
  PostgresFormsRepository,
  type FormsRepository,
} from './repository.js';
import type {
  BackendCompatibleSubmissionPayload,
  DiagnosticDerivedData,
  DynamicOptionMap,
  FormDefinition,
  FormEvent,
  FormQuestion,
  FormSubmission,
  JsonValue,
  QuestionOption,
  QuestionType,
  SubmissionRespondent,
  WebhookDeliveryResult,
} from './types.js';

const revenueBandsByCountry: DynamicOptionMap = {
  BR: [
    { id: 'rev_br_0', label: 'Ainda nao fatura', value: 'not_revenue', order: 0, metadata: { currency: 'BRL' } },
    { id: 'rev_br_1', label: 'Ate R$5k', value: 'upto_5k', order: 1, metadata: { currency: 'BRL' } },
    { id: 'rev_br_2', label: 'R$5k-R$20k', value: '5k_20k', order: 2, metadata: { currency: 'BRL' } },
    { id: 'rev_br_3', label: 'R$20k-R$50k', value: '20k_50k', order: 3, metadata: { currency: 'BRL' } },
    { id: 'rev_br_4', label: 'Acima de R$50k', value: 'above_50k', order: 4, metadata: { currency: 'BRL' } },
  ],
  PT: [
    { id: 'rev_pt_0', label: 'Ainda nao fatura', value: 'not_revenue', order: 0, metadata: { currency: 'EUR' } },
    { id: 'rev_pt_1', label: 'Ate EUR2k', value: 'upto_2k', order: 1, metadata: { currency: 'EUR' } },
    { id: 'rev_pt_2', label: 'EUR2k-EUR10k', value: '2k_10k', order: 2, metadata: { currency: 'EUR' } },
    { id: 'rev_pt_3', label: 'EUR10k-EUR25k', value: '10k_25k', order: 3, metadata: { currency: 'EUR' } },
    { id: 'rev_pt_4', label: 'Acima de EUR25k', value: 'above_25k', order: 4, metadata: { currency: 'EUR' } },
  ],
  US: [
    { id: 'rev_us_0', label: 'Ainda nao fatura', value: 'not_revenue', order: 0, metadata: { currency: 'USD' } },
    { id: 'rev_us_1', label: 'Ate USD2k', value: 'upto_2k', order: 1, metadata: { currency: 'USD' } },
    { id: 'rev_us_2', label: 'USD2k-USD10k', value: '2k_10k', order: 2, metadata: { currency: 'USD' } },
    { id: 'rev_us_3', label: 'USD10k-USD25k', value: '10k_25k', order: 3, metadata: { currency: 'USD' } },
    { id: 'rev_us_4', label: 'Acima de USD25k', value: 'above_25k', order: 4, metadata: { currency: 'USD' } },
  ],
  DEFAULT: [
    { id: 'rev_default_0', label: 'Ainda nao fatura', value: 'not_revenue', order: 0, metadata: { currency: 'USD' } },
    { id: 'rev_default_1', label: 'Ate USD2k', value: 'upto_2k', order: 1, metadata: { currency: 'USD' } },
    { id: 'rev_default_2', label: 'USD2k-USD10k', value: '2k_10k', order: 2, metadata: { currency: 'USD' } },
    { id: 'rev_default_3', label: 'USD10k-USD25k', value: '10k_25k', order: 3, metadata: { currency: 'USD' } },
    { id: 'rev_default_4', label: 'Acima de USD25k', value: 'above_25k', order: 4, metadata: { currency: 'USD' } },
  ],
};

type PhoneAnswer = {
  numero: string;
  pais_codigo: string;
  pais_iso: string;
};

type RevenueAnswer = {
  faixa: string;
  moeda: string;
  pais: string;
};

function asObjectRecord(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, JsonValue>)
    : undefined;
}

function toMetadataRecord(value: unknown) {
  return value as Record<string, JsonValue> | undefined;
}

function buildQuestion(input: QuestionInput): FormQuestion {
  return {
    ...input,
    id: input.id ?? createId('question'),
    options: input.options.map<QuestionOption>((option) => ({
      ...option,
      id: option.id ?? createId('option'),
      metadata: toMetadataRecord(option.metadata),
    })),
    dynamicOptionsByCountry: input.dynamicOptionsByCountry
      ? Object.fromEntries(
          Object.entries(input.dynamicOptionsByCountry).map(([country, options]) => [
            country,
            options.map((option) => ({
              ...option,
              id: option.id ?? createId('option'),
              metadata: toMetadataRecord(option.metadata),
            })),
          ])
        )
      : undefined,
    metadata: toMetadataRecord(input.metadata),
  };
}

function assertFormIntegrity(form: Pick<FormDefinition, 'steps' | 'questions'>) {
  const stepIds = new Set(form.steps.map((step) => step.id));
  const slugs = new Set<string>();

  for (const question of form.questions) {
    if (!stepIds.has(question.stepId)) {
      throw new AppError(`Pergunta ${question.slug} referencia uma etapa inexistente.`, 400, 'INVALID_FORM_STRUCTURE');
    }

    if (slugs.has(question.slug)) {
      throw new AppError(`Slug de pergunta duplicado: ${question.slug}.`, 400, 'DUPLICATED_QUESTION_SLUG');
    }

    slugs.add(question.slug);
  }
}

function requireString(value: JsonValue, details: Record<string, string>) {
  if (typeof value !== 'string') {
    throw new AppError('Resposta textual invalida.', 400, 'INVALID_ANSWER_TYPE', details);
  }
  return value.trim();
}

function validateWordCount(value: string, minWords: number | undefined, details: Record<string, string>) {
  if (!minWords) {
    return;
  }

  const wordCount = value.split(/\s+/).filter(Boolean).length;
  if (wordCount < minWords) {
    throw new AppError('Quantidade minima de palavras nao atingida.', 400, 'ANSWER_TOO_SHORT', details);
  }
}

function validateTextQuestion(question: FormQuestion, rawValue: JsonValue) {
  const details = { questionId: question.id, slug: question.slug, type: question.type };
  const value = requireString(rawValue, details);

  if (question.required && value.length === 0) {
    throw new AppError('Campo obrigatorio nao preenchido.', 400, 'REQUIRED_ANSWER_MISSING', details);
  }

  if (value.length === 0) {
    return value;
  }

  if (question.validation.minLength !== undefined && value.length < question.validation.minLength) {
    throw new AppError('Texto abaixo do tamanho minimo permitido.', 400, 'ANSWER_TOO_SHORT', details);
  }

  if (question.validation.maxLength !== undefined && value.length > question.validation.maxLength) {
    throw new AppError('Texto acima do tamanho maximo permitido.', 400, 'ANSWER_TOO_LONG', details);
  }

  validateWordCount(value, question.validation.minWords, details);

  if (question.validation.pattern) {
    const regex = new RegExp(question.validation.pattern);
    if (!regex.test(value)) {
      throw new AppError('Texto fora do formato esperado.', 400, 'INVALID_TEXT_PATTERN', details);
    }
  }

  if (question.slug === 'nome_completo') {
    const words = value.split(/\s+/).filter(Boolean);
    if (words.length < 2 || !/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(value)) {
      throw new AppError('Por favor, insira seu nome completo.', 400, 'INVALID_FULL_NAME', details);
    }
  }

  if (question.type === 'email') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      throw new AppError('Email invalido.', 400, 'INVALID_EMAIL', details);
    }
  }

  return value;
}

function validateNumberQuestion(question: FormQuestion, rawValue: JsonValue) {
  const details = { questionId: question.id, slug: question.slug, type: question.type };
  const numericValue =
    typeof rawValue === 'number' ? rawValue : typeof rawValue === 'string' && rawValue.trim() ? Number(rawValue) : NaN;

  if (Number.isNaN(numericValue)) {
    throw new AppError('Resposta numerica invalida.', 400, 'INVALID_ANSWER_TYPE', details);
  }

  if (question.validation.integer && !Number.isInteger(numericValue)) {
    throw new AppError('O valor deve ser um numero inteiro.', 400, 'INVALID_INTEGER', details);
  }

  if (question.validation.min !== undefined && numericValue < question.validation.min) {
    throw new AppError('Numero abaixo do minimo permitido.', 400, 'ANSWER_BELOW_MIN', details);
  }

  if (question.validation.max !== undefined && numericValue > question.validation.max) {
    throw new AppError('Numero acima do maximo permitido.', 400, 'ANSWER_ABOVE_MAX', details);
  }

  return numericValue;
}

function resolveRevenueBands(countryIso: string | undefined) {
  const options = countryIso ? revenueBandsByCountry[countryIso] : undefined;
  return options ?? revenueBandsByCountry.DEFAULT ?? [];
}

function validateSingleSelectQuestion(question: FormQuestion, rawValue: JsonValue) {
  const details = { questionId: question.id, slug: question.slug, type: question.type };
  const value = requireString(rawValue, details);
  const option = question.options.find((item) => item.value === value);

  if (!option) {
    throw new AppError('Opcao invalida.', 400, 'INVALID_OPTION', details);
  }

  return value;
}

function validatePhoneQuestion(question: FormQuestion, rawValue: JsonValue) {
  const details = { questionId: question.id, slug: question.slug, type: question.type };
  const value = asObjectRecord(rawValue);

  if (!value) {
    throw new AppError('Telefone invalido.', 400, 'INVALID_PHONE', details);
  }

  const numero = typeof value.numero === 'string' ? value.numero.trim() : '';
  const paisCodigo = typeof value.pais_codigo === 'string' ? value.pais_codigo.trim() : '';
  const paisIso = typeof value.pais_iso === 'string' ? value.pais_iso.trim().toUpperCase() : '';

  if (!/^\+\d{10,15}$/.test(numero) || !/^\+\d{1,4}$/.test(paisCodigo) || !/^[A-Z]{2}$/.test(paisIso)) {
    throw new AppError('Numero invalido para o pais selecionado.', 400, 'INVALID_PHONE', details);
  }

  if (!numero.startsWith(paisCodigo)) {
    throw new AppError('Numero invalido para o pais selecionado.', 400, 'INVALID_PHONE', details);
  }

  return {
    numero,
    pais_codigo: paisCodigo,
    pais_iso: paisIso,
  } satisfies PhoneAnswer;
}

function validateRevenueQuestion(question: FormQuestion, rawValue: JsonValue, answersBySlug: Record<string, JsonValue>) {
  const details = { questionId: question.id, slug: question.slug, type: question.type };
  const value = asObjectRecord(rawValue);

  if (!value) {
    throw new AppError('Faturamento invalido.', 400, 'INVALID_REVENUE_RANGE', details);
  }

  const faixa = typeof value.faixa === 'string' ? value.faixa.trim() : '';
  const moeda = typeof value.moeda === 'string' ? value.moeda.trim().toUpperCase() : '';
  const pais = typeof value.pais === 'string' ? value.pais.trim().toUpperCase() : '';
  const whatsapp = asObjectRecord(answersBySlug.whatsapp) as PhoneAnswer | undefined;
  const detectedCountry = whatsapp?.pais_iso?.toUpperCase() ?? pais;

  const availableOptions = resolveRevenueBands(detectedCountry);
  const option = availableOptions.find((item) => item.value === faixa);

  if (!option) {
    throw new AppError('Faixa de faturamento invalida para o pais detectado.', 400, 'INVALID_REVENUE_RANGE', details);
  }

  const expectedCurrency = typeof option.metadata?.currency === 'string' ? option.metadata.currency : undefined;

  if (!expectedCurrency || moeda !== expectedCurrency || pais !== detectedCountry) {
    throw new AppError('Faixa de faturamento inconsistente com o pais do WhatsApp.', 400, 'INVALID_REVENUE_RANGE', details);
  }

  return {
    faixa,
    moeda,
    pais,
  } satisfies RevenueAnswer;
}

function validateAnswerByType(
  question: FormQuestion,
  rawValue: JsonValue,
  answersBySlug: Record<string, JsonValue>
) {
  switch (question.type) {
    case 'text':
    case 'textarea':
    case 'email':
      return validateTextQuestion(question, rawValue);
    case 'number':
      return validateNumberQuestion(question, rawValue);
    case 'single_select':
      return validateSingleSelectQuestion(question, rawValue);
    case 'phone':
      return validatePhoneQuestion(question, rawValue);
    case 'money_range':
      return validateRevenueQuestion(question, rawValue, answersBySlug);
    default:
      throw new AppError('Tipo de pergunta nao suportado.', 400, 'UNSUPPORTED_QUESTION_TYPE');
  }
}

async function deliverWebhook(
  form: FormDefinition,
  payload: BackendCompatibleSubmissionPayload
): Promise<WebhookDeliveryResult> {
  if (!form.settings.webhookUrl) {
    return {
      attemptedAt: new Date().toISOString(),
      status: 'skipped',
    };
  }

  try {
    const body = JSON.stringify(payload);
    const signature = form.settings.webhookSecret
      ? createHmac('sha256', form.settings.webhookSecret).update(body).digest('hex')
      : undefined;

    const response = await fetch(form.settings.webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(signature ? { 'x-jethro-signature': signature } : {}),
      },
      body,
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return {
        attemptedAt: new Date().toISOString(),
        status: 'failed',
        targetUrl: form.settings.webhookUrl,
        responseStatus: response.status,
        errorMessage: 'Webhook respondeu com erro.',
      };
    }

    return {
      attemptedAt: new Date().toISOString(),
      status: 'delivered',
      targetUrl: form.settings.webhookUrl,
      responseStatus: response.status,
    };
  } catch (error) {
    return {
      attemptedAt: new Date().toISOString(),
      status: 'failed',
      targetUrl: form.settings.webhookUrl,
      errorMessage: error instanceof Error ? error.message : 'Falha desconhecida ao entregar webhook.',
    };
  }
}

function sanitizePublicForm(form: FormDefinition) {
  return {
    id: form.id,
    slug: form.slug,
    title: form.title,
    description: form.description,
    status: form.status,
    steps: form.steps,
    questions: form.questions.map((question) => ({
      id: question.id,
      stepId: question.stepId,
      slug: question.slug,
      label: question.label,
      helperText: question.helperText,
      placeholder: question.placeholder,
      type: question.type,
      presentation: question.presentation,
      required: question.required,
      internalOnly: question.internalOnly ?? false,
      order: question.order,
      options: question.options,
      validation: question.validation,
      metadata: question.metadata,
      dynamicOptionsByCountry: question.dynamicOptionsByCountry,
    })),
    runtime: {
      revenueBandsByCountry,
    },
    confirmation: {
      title: form.settings.successTitle,
      message: form.settings.successMessage,
    },
    submissionError: {
      message: form.settings.errorMessage,
      allowRetry: form.settings.allowRetry,
    },
  };
}

const scoreMaps = {
  fase_negocio: { ideia: 1, inicio: 2, crescimento: 3, consolidado: 4 },
  conexao_dons: { total: 4, parcial: 2, nao: 1 },
  proposito_negocio: { claro: 4, em_definicao: 2, sem_clareza: 1 },
  estrutura_negocio: { estruturado: 4, desenvolvimento: 2, inexistente: 1 },
  organizacao_financeira: { estruturada: 4, basica: 2, desorganizada: 1 },
  formalizacao: { empresa_media_grande: 4, formalizada: 3, informal: 1, nao_comecei: 0, outro: 1 },
  lucro_crescimento: { crescendo: 4, estavel: 2, regredindo: 1 },
  capacidade_operacional: { mais_10: 4, equipe_6_10: 3, equipe_2_5: 2, sozinho: 1 },
  faturamento_mensal: {
    above_50k: 4,
    above_25k: 4,
    '20k_50k': 3,
    '10k_25k': 3,
    '5k_20k': 2,
    '2k_10k': 2,
    upto_5k: 1,
    upto_2k: 1,
    not_revenue: 0,
  },
} as const;

function calculateHoursScore(hours: number) {
  if (hours >= 60) {
    return 4;
  }
  if (hours >= 40) {
    return 3;
  }
  if (hours >= 20) {
    return 2;
  }
  if (hours >= 10) {
    return 1;
  }
  return 0;
}

function calculateDiagnosticDerivedData(answersBySlug: Record<string, JsonValue>): DiagnosticDerivedData {
  const phone = asObjectRecord(answersBySlug.whatsapp) as PhoneAnswer | undefined;
  const revenue = asObjectRecord(answersBySlug.faturamento_mensal) as RevenueAnswer | undefined;
  const horas = typeof answersBySlug.horas_semana === 'number' ? answersBySlug.horas_semana : 0;

  const scoreParts = [
    scoreMaps.fase_negocio[String(answersBySlug.fase_negocio) as keyof typeof scoreMaps.fase_negocio] ?? 0,
    scoreMaps.conexao_dons[String(answersBySlug.conexao_dons) as keyof typeof scoreMaps.conexao_dons] ?? 0,
    scoreMaps.proposito_negocio[
      String(answersBySlug.proposito_negocio) as keyof typeof scoreMaps.proposito_negocio
    ] ?? 0,
    scoreMaps.estrutura_negocio[
      String(answersBySlug.estrutura_negocio) as keyof typeof scoreMaps.estrutura_negocio
    ] ?? 0,
    scoreMaps.organizacao_financeira[
      String(answersBySlug.organizacao_financeira) as keyof typeof scoreMaps.organizacao_financeira
    ] ?? 0,
    scoreMaps.formalizacao[String(answersBySlug.formalizacao) as keyof typeof scoreMaps.formalizacao] ?? 0,
    scoreMaps.lucro_crescimento[
      String(answersBySlug.lucro_crescimento) as keyof typeof scoreMaps.lucro_crescimento
    ] ?? 0,
    scoreMaps.capacidade_operacional[
      String(answersBySlug.capacidade_operacional) as keyof typeof scoreMaps.capacidade_operacional
    ] ?? 0,
    scoreMaps.faturamento_mensal[revenue?.faixa as keyof typeof scoreMaps.faturamento_mensal] ?? 0,
    calculateHoursScore(horas),
  ];

  const rawScore = (scoreParts.reduce((total, current) => total + current, 0) / (scoreParts.length * 4)) * 100;
  const score = Number(rawScore.toFixed(2));

  return {
    score,
    scoreBand: score >= 70 ? 'alto' : score >= 40 ? 'medio' : 'baixo',
    whatsappCountryIso: phone?.pais_iso,
    revenueCurrency: revenue?.moeda,
    revenueBand: revenue?.faixa,
  };
}

function buildRespondent(answersBySlug: Record<string, JsonValue>): SubmissionRespondent {
  const whatsapp = asObjectRecord(answersBySlug.whatsapp) as PhoneAnswer | undefined;

  return {
    fullName: typeof answersBySlug.nome_completo === 'string' ? answersBySlug.nome_completo : undefined,
    email: typeof answersBySlug.email === 'string' ? answersBySlug.email : undefined,
    whatsappNumber: whatsapp?.numero,
    whatsappCountryIso: whatsapp?.pais_iso,
  };
}

export class FormsService {
  constructor(public readonly repository: FormsRepository) {}

  async listForms() {
    return this.repository.listForms();
  }

  async createForm(input: FormInput) {
    const form = {
      ...input,
      steps: input.steps.map((step) => ({
        ...step,
        id: step.id ?? createId('step'),
      })),
      questions: input.questions.map(buildQuestion),
    };

    assertFormIntegrity(form);

    if (await this.repository.findFormBySlug(form.slug)) {
      throw new AppError('Ja existe um formulario com esse slug.', 409, 'FORM_SLUG_CONFLICT');
    }

    return this.repository.createForm(form);
  }

  async getFormOrThrow(formId: string) {
    const form = await this.repository.findFormById(formId);
    if (!form) {
      throw new AppError('Formulario nao encontrado.', 404, 'FORM_NOT_FOUND');
    }
    return form;
  }

  async getFormBySlugOrThrow(slug: string) {
    const form = await this.repository.findFormBySlug(slug);
    if (!form) {
      throw new AppError('Formulario nao encontrado.', 404, 'FORM_NOT_FOUND');
    }
    return form;
  }

  async updateForm(formId: string, input: FormUpdateInput) {
    const existing = await this.getFormOrThrow(formId);

    if (input.slug && input.slug !== existing.slug) {
      const collision = await this.repository.findFormBySlug(input.slug);
      if (collision && collision.id !== formId) {
        throw new AppError('Ja existe um formulario com esse slug.', 409, 'FORM_SLUG_CONFLICT');
      }
    }

    const next = {
      ...existing,
      ...input,
      steps: input.steps
        ? input.steps.map((step) => ({ ...step, id: step.id ?? createId('step') }))
        : existing.steps,
      questions: input.questions ? input.questions.map(buildQuestion) : existing.questions,
      settings: input.settings ? { ...existing.settings, ...input.settings } : existing.settings,
    };

    assertFormIntegrity(next);

    return this.repository.updateForm(formId, {
      slug: next.slug,
      title: next.title,
      description: next.description,
      status: next.status,
      steps: next.steps,
      questions: next.questions,
      settings: next.settings,
    });
  }

  async deleteForm(formId: string) {
    if (!(await this.repository.deleteForm(formId))) {
      throw new AppError('Formulario nao encontrado.', 404, 'FORM_NOT_FOUND');
    }
  }

  async createQuestion(formId: string, input: QuestionInput) {
    const form = await this.getFormOrThrow(formId);
    const question = buildQuestion(input);

    assertFormIntegrity({
      steps: form.steps,
      questions: [...form.questions, question],
    });

    if (form.questions.some((item) => item.slug === question.slug)) {
      throw new AppError('Slug de pergunta ja existe neste formulario.', 409, 'QUESTION_SLUG_CONFLICT');
    }

    const created = await this.repository.createQuestion(formId, question);
    if (!created) {
      throw new AppError('Formulario nao encontrado.', 404, 'FORM_NOT_FOUND');
    }

    return created;
  }

  async updateQuestion(formId: string, questionId: string, input: Partial<QuestionInput>) {
    const form = await this.getFormOrThrow(formId);
    const current = form.questions.find((question) => question.id === questionId);

    if (!current) {
      throw new AppError('Pergunta nao encontrada.', 404, 'QUESTION_NOT_FOUND');
    }

    const updatedQuestion: FormQuestion = {
      ...current,
      ...input,
      options: input.options
        ? input.options.map((option) => ({
            ...option,
            id: option.id ?? createId('option'),
            metadata: toMetadataRecord(option.metadata),
          }))
        : current.options,
      validation: input.validation ? { ...current.validation, ...input.validation } : current.validation,
      metadata: input.metadata ? { ...(current.metadata ?? {}), ...toMetadataRecord(input.metadata) } : current.metadata,
      dynamicOptionsByCountry: input.dynamicOptionsByCountry
        ? Object.fromEntries(
            Object.entries(input.dynamicOptionsByCountry).map(([country, options]) => [
              country,
              options.map((option) => ({
                ...option,
                id: option.id ?? createId('option'),
                metadata: toMetadataRecord(option.metadata),
              })),
            ])
          )
        : current.dynamicOptionsByCountry,
    };

    assertFormIntegrity({
      steps: form.steps,
      questions: form.questions.map((question) => (question.id === questionId ? updatedQuestion : question)),
    });

    const slugOwner = form.questions.find(
      (question) => question.slug === updatedQuestion.slug && question.id !== questionId
    );
    if (slugOwner) {
      throw new AppError('Slug de pergunta ja existe neste formulario.', 409, 'QUESTION_SLUG_CONFLICT');
    }

    const updated = await this.repository.updateQuestion(formId, questionId, updatedQuestion);
    if (!updated) {
      throw new AppError('Pergunta nao encontrada.', 404, 'QUESTION_NOT_FOUND');
    }
    return updated;
  }

  async deleteQuestion(formId: string, questionId: string) {
    if (!(await this.repository.deleteQuestion(formId, questionId))) {
      throw new AppError('Pergunta nao encontrada.', 404, 'QUESTION_NOT_FOUND');
    }
  }

  async getPublicForm(slug: string) {
    const form = await this.getFormBySlugOrThrow(slug);
    if (form.status !== 'published') {
      throw new AppError('Formulario indisponivel para resposta.', 404, 'FORM_NOT_PUBLISHED');
    }
    return sanitizePublicForm(form);
  }

  async submitForm(slug: string, input: SubmissionInput) {
    const form = await this.getFormBySlugOrThrow(slug);
    if (form.status !== 'published') {
      throw new AppError('Formulario indisponivel para resposta.', 404, 'FORM_NOT_PUBLISHED');
    }

    const questionMap = new Map(form.questions.map((question) => [question.id, question]));
    const rawAnswersBySlug: Record<string, JsonValue> = {};

    for (const answer of input.answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) {
        throw new AppError('Pergunta informada nao existe neste formulario.', 400, 'UNKNOWN_QUESTION');
      }
      rawAnswersBySlug[question.slug] = answer.value as JsonValue;
    }

    for (const question of form.questions) {
      if (question.internalOnly) {
        continue;
      }
      if (question.required && !(question.slug in rawAnswersBySlug)) {
        throw new AppError('Ha perguntas obrigatorias sem resposta.', 400, 'MISSING_REQUIRED_ANSWERS', {
          questionId: question.id,
          slug: question.slug,
        });
      }
    }

    const normalizedAnswers = input.answers.map((answer) => {
      const question = questionMap.get(answer.questionId);
      if (!question) {
        throw new AppError('Pergunta informada nao existe neste formulario.', 400, 'UNKNOWN_QUESTION');
      }
      const value = validateAnswerByType(question, answer.value as JsonValue, rawAnswersBySlug);
      rawAnswersBySlug[question.slug] = value;
      return {
        question,
        value,
      };
    });

    const derived = calculateDiagnosticDerivedData(rawAnswersBySlug);
    const respondent = buildRespondent(rawAnswersBySlug);
    const whatsapp = asObjectRecord(rawAnswersBySlug.whatsapp) as PhoneAnswer | undefined;

    const payload: BackendCompatibleSubmissionPayload = {
      event: 'diagnostic.form.submitted',
      submittedAt: new Date().toISOString(),
      form: {
        id: form.id,
        slug: form.slug,
        title: form.title,
      },
      respondent: {
        fullName: respondent.fullName,
        email: respondent.email,
        ...(whatsapp ? { whatsapp } : {}),
      },
      answers: normalizedAnswers.map((item) => ({
        questionId: item.question.id,
        slug: item.question.slug,
        label: item.question.label,
        type: item.question.type as QuestionType,
        value: item.value,
      })),
      answersBySlug: rawAnswersBySlug,
      derived,
    };

    const delivery = await deliverWebhook(form, payload);
    const submissionStatus = delivery.status === 'failed' ? 'delivery_failed' : 'accepted';

    const submission: FormSubmission = {
      id: createId('submission'),
      formId: form.id,
      formSlug: form.slug,
      createdAt: payload.submittedAt,
      answers: normalizedAnswers.map((item) => ({ questionId: item.question.id, value: item.value })),
      answersBySlug: rawAnswersBySlug,
      payload,
      status: submissionStatus,
      respondent,
      derived,
      delivery,
    };

    await this.repository.saveSubmission(submission);

    if (delivery.status === 'failed') {
      throw new AppError(
        form.settings.errorMessage,
        502,
        'SUBMISSION_DELIVERY_FAILED',
        { submissionId: submission.id, delivery },
        form.settings.allowRetry
      );
    }

    return {
      submissionId: submission.id,
      confirmation: {
        title: form.settings.successTitle,
        message: form.settings.successMessage,
      },
      payload,
      derived,
      delivery,
    };
  }

  async trackEvent(slug: string, input: EventInput) {
    const form = await this.getFormBySlugOrThrow(slug);

    if (input.stepId && !form.steps.some((step) => step.id === input.stepId)) {
      throw new AppError('Etapa informada nao existe neste formulario.', 400, 'UNKNOWN_STEP');
    }

    const event: FormEvent = {
      id: createId('event'),
      formId: form.id,
      formSlug: form.slug,
      type: input.type,
      sessionId: input.sessionId,
      stepId: input.stepId,
      createdAt: new Date().toISOString(),
    };

    return this.repository.saveEvent(event);
  }

  async getFormResults(formId: string) {
    const form = await this.getFormOrThrow(formId);
    const submissions = await this.repository.listSubmissions(form.id);

    return submissions
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((submission) => ({
        id: submission.id,
        formId: submission.formId,
        formSlug: submission.formSlug,
        createdAt: submission.createdAt,
        status: submission.status,
        respondent: submission.respondent,
        derived: submission.derived,
        delivery: submission.delivery,
      }));
  }

  async getFormResultById(formId: string, submissionId: string) {
    const form = await this.getFormOrThrow(formId);
    const submission = await this.repository.findSubmissionById(form.id, submissionId);

    if (!submission) {
      throw new AppError('Resultado nao encontrado.', 404, 'SUBMISSION_NOT_FOUND');
    }

    return submission;
  }

  async getAnalyticsSummary(formId: string) {
    const form = await this.getFormOrThrow(formId);
    const events = await this.repository.listEvents(form.id);
    const submissions = await this.repository.listSubmissions(form.id);

    const startedSessions = new Set(events.filter((event) => event.type === 'form_started').map((event) => event.sessionId));
    const abandonedSessions = new Set(events.filter((event) => event.type === 'form_abandoned').map((event) => event.sessionId));

    const averageScore =
      submissions.length === 0
        ? 0
        : Number(
            (
              submissions.reduce((total, submission) => total + submission.derived.score, 0) /
              submissions.length
            ).toFixed(2)
          );

    return {
      formId: form.id,
      formSlug: form.slug,
      startedSessions: startedSessions.size,
      abandonedSessions: abandonedSessions.size,
      completedSubmissions: submissions.filter((item) => item.status === 'accepted').length,
      deliveryFailures: submissions.filter((item) => item.status === 'delivery_failed').length,
      averageScore,
      countries: [...new Set(submissions.map((item) => item.respondent.whatsappCountryIso).filter(Boolean))],
      initialAbandonmentRate:
        startedSessions.size === 0 ? 0 : Number((abandonedSessions.size / startedSessions.size).toFixed(4)),
    };
  }
}

async function ensureSeedData(service: FormsService) {
  const seedInput: Omit<FormDefinition, 'id' | 'createdAt' | 'updatedAt'> = {
    slug: 'diagnostico-inicial',
    title: 'Diagnostico Inicial Jethro',
    description: 'Formulario tecnico de diagnostico conforme especificacao do Jethro.',
    status: 'published' as const,
    steps: [
      { id: 'step_identificacao', title: 'Identificacao', description: 'Dados basicos do empreendedor.', order: 0 },
      { id: 'step_negocio', title: 'Negocio', description: 'Contexto e maturidade do negocio.', order: 1 },
      { id: 'step_operacao', title: 'Operacao', description: 'Operacao, receita e crescimento.', order: 2 },
      { id: 'step_objetivos', title: 'Objetivos', description: 'Visao de futuro e desafios.', order: 3 },
    ],
    questions: [
      {
        id: 'question_nome_completo',
        stepId: 'step_identificacao',
        slug: 'nome_completo',
        label: 'Qual e o seu nome e sobrenome?',
        helperText: 'Informe nome completo com pelo menos duas palavras.',
        type: 'text',
        presentation: 'input',
        required: true,
        order: 0,
        options: [],
        validation: { minLength: 3, minWords: 2, pattern: "^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$" },
      },
      {
        id: 'question_area_atuacao',
        stepId: 'step_identificacao',
        slug: 'area_atuacao',
        label: 'Qual e a area de atuacao do seu negocio?',
        type: 'text',
        presentation: 'input',
        required: true,
        order: 1,
        options: [],
        validation: { minLength: 3, maxLength: 100 },
      },
      {
        id: 'question_whatsapp',
        stepId: 'step_identificacao',
        slug: 'whatsapp',
        label: 'Qual e o seu numero de WhatsApp?',
        helperText: 'O backend espera numero, codigo do pais e ISO do pais.',
        type: 'phone',
        presentation: 'phone',
        required: true,
        order: 2,
        options: [],
        validation: {},
      },
      {
        id: 'question_email',
        stepId: 'step_identificacao',
        slug: 'email',
        label: 'Qual e o seu endereco de email?',
        type: 'email',
        presentation: 'input',
        required: true,
        order: 3,
        options: [],
        validation: { maxLength: 150 },
      },
      {
        id: 'question_fase_negocio',
        stepId: 'step_negocio',
        slug: 'fase_negocio',
        label: 'Qual e a fase do seu negocio?',
        type: 'single_select',
        presentation: 'radio',
        required: true,
        order: 4,
        options: [
          { id: 'fase_ideia', label: 'Ideia', value: 'ideia', order: 0 },
          { id: 'fase_inicio', label: 'Inicio (0-1 ano)', value: 'inicio', order: 1 },
          { id: 'fase_crescimento', label: 'Em crescimento (1-3 anos)', value: 'crescimento', order: 2 },
          { id: 'fase_consolidado', label: 'Consolidado (3+ anos)', value: 'consolidado', order: 3 },
        ],
        validation: {},
      },
      {
        id: 'question_conexao_dons',
        stepId: 'step_negocio',
        slug: 'conexao_dons',
        label: 'Voce sente que seu negocio esta conectado com seus dons e talentos?',
        type: 'single_select',
        presentation: 'scale',
        required: true,
        order: 5,
        options: [
          { id: 'dons_total', label: 'Sim, totalmente', value: 'total', order: 0 },
          { id: 'dons_parcial', label: 'Parcialmente', value: 'parcial', order: 1 },
          { id: 'dons_nao', label: 'Nao, ainda nao', value: 'nao', order: 2 },
        ],
        validation: {},
      },
      {
        id: 'question_proposito_negocio',
        stepId: 'step_negocio',
        slug: 'proposito_negocio',
        label: 'Voce sabe exatamente qual e o proposito do seu negocio e como ele entrega valor?',
        type: 'single_select',
        presentation: 'radio',
        required: true,
        order: 6,
        options: [
          { id: 'prop_claro', label: 'Sim, muito claro', value: 'claro', order: 0 },
          { id: 'prop_ideia', label: 'Tenho ideia, mas nao esta definido', value: 'em_definicao', order: 1 },
          { id: 'prop_nao', label: 'Nao tenho clareza', value: 'sem_clareza', order: 2 },
        ],
        validation: {},
      },
      {
        id: 'question_estrutura_negocio',
        stepId: 'step_negocio',
        slug: 'estrutura_negocio',
        label: 'Seu negocio tem estrutura solida, visao de futuro e planejamento estrategico?',
        type: 'single_select',
        presentation: 'radio',
        required: true,
        order: 7,
        options: [
          { id: 'est_bem', label: 'Sim, bem estruturado', value: 'estruturado', order: 0 },
          { id: 'est_dev', label: 'Em desenvolvimento', value: 'desenvolvimento', order: 1 },
          { id: 'est_nao', label: 'Ainda nao', value: 'inexistente', order: 2 },
        ],
        validation: {},
      },
      {
        id: 'question_organizacao_financeira',
        stepId: 'step_operacao',
        slug: 'organizacao_financeira',
        label: 'Como voce enxerga a organizacao financeira do seu negocio?',
        type: 'single_select',
        presentation: 'select',
        required: true,
        order: 8,
        options: [
          { id: 'fin_estr', label: 'Estruturada', value: 'estruturada', order: 0 },
          { id: 'fin_bas', label: 'Basica', value: 'basica', order: 1 },
          { id: 'fin_conf', label: 'Desorganizada / Confusa', value: 'desorganizada', order: 2 },
        ],
        validation: {},
      },
      {
        id: 'question_formalizacao',
        stepId: 'step_operacao',
        slug: 'formalizacao',
        label: 'Qual e a classificacao da formalizacao do seu negocio?',
        type: 'single_select',
        presentation: 'select',
        required: true,
        order: 9,
        options: [
          { id: 'for_informal', label: 'Informal', value: 'informal', order: 0 },
          { id: 'for_formalizada', label: 'Formalizada / Empresa registrada', value: 'formalizada', order: 1 },
          { id: 'for_media', label: 'Empresa de medio/grande porte', value: 'empresa_media_grande', order: 2 },
          { id: 'for_nao', label: 'Ainda nao comecei', value: 'nao_comecei', order: 3 },
          { id: 'for_outro', label: 'Outro', value: 'outro', order: 4 },
        ],
        validation: {},
      },
      {
        id: 'question_faturamento_mensal',
        stepId: 'step_operacao',
        slug: 'faturamento_mensal',
        label: 'Qual e o faturamento medio mensal do seu negocio?',
        helperText: 'As opcoes mudam conforme o pais detectado no WhatsApp.',
        type: 'money_range',
        presentation: 'select',
        required: true,
        order: 10,
        options: [],
        validation: {},
        dynamicOptionsByCountry: revenueBandsByCountry,
        metadata: {
          dependsOnQuestionSlug: 'whatsapp',
          dependsOnCountryField: 'pais_iso',
        },
      },
      {
        id: 'question_lucro_crescimento',
        stepId: 'step_operacao',
        slug: 'lucro_crescimento',
        label: 'Voce sente que o seu negocio esta gerando lucro e crescendo?',
        type: 'single_select',
        presentation: 'scale',
        required: true,
        order: 11,
        options: [
          { id: 'luc_cresce', label: 'Sim, crescendo', value: 'crescendo', order: 0 },
          { id: 'luc_estavel', label: 'Estavel, sem crescimento', value: 'estavel', order: 1 },
          { id: 'luc_regredindo', label: 'Nao, estamos regredindo', value: 'regredindo', order: 2 },
        ],
        validation: {},
      },
      {
        id: 'question_objetivo_futuro',
        stepId: 'step_objetivos',
        slug: 'objetivo_futuro',
        label: 'Onde voce deseja estar com seu negocio nos proximos 6 a 12 meses?',
        type: 'textarea',
        presentation: 'textarea',
        required: true,
        order: 12,
        options: [],
        validation: { minLength: 20, maxLength: 500 },
      },
      {
        id: 'question_desafios',
        stepId: 'step_objetivos',
        slug: 'desafios',
        label: 'Quais sao os 3 maiores desafios que voce esta enfrentando hoje?',
        type: 'textarea',
        presentation: 'textarea',
        required: true,
        order: 13,
        options: [],
        validation: { minLength: 20, maxLength: 600 },
      },
      {
        id: 'question_canal_aquisicao',
        stepId: 'step_objetivos',
        slug: 'canal_aquisicao',
        label: 'Como a maioria dos seus clientes chega ate voce hoje?',
        type: 'single_select',
        presentation: 'select',
        required: false,
        internalOnly: true,
        order: 14,
        options: [
          { id: 'can_instagram', label: 'Instagram', value: 'instagram', order: 0 },
          { id: 'can_indicacao', label: 'Indicacao', value: 'indicacao', order: 1 },
          { id: 'can_pago', label: 'Trafego pago', value: 'trafego_pago', order: 2 },
          { id: 'can_linkedin', label: 'LinkedIn', value: 'linkedin', order: 3 },
          { id: 'can_ativo', label: 'Eu vou atras ativamente', value: 'ativo', order: 4 },
          { id: 'can_varios', label: 'Uso varios canais', value: 'varios', order: 5 },
          { id: 'can_outro', label: 'Outro', value: 'outro', order: 6 },
        ],
        validation: {},
        metadata: { internalField: true },
      },
      {
        id: 'question_capacidade_operacional',
        stepId: 'step_operacao',
        slug: 'capacidade_operacional',
        label: 'Se o numero de clientes dobrasse amanha, o que aconteceria?',
        type: 'single_select',
        presentation: 'radio',
        required: true,
        order: 15,
        options: [
          { id: 'cap_sozinho', label: 'Sozinho(a)', value: 'sozinho', order: 0 },
          { id: 'cap_2_5', label: '2-5 pessoas', value: 'equipe_2_5', order: 1 },
          { id: 'cap_6_10', label: '6-10 pessoas', value: 'equipe_6_10', order: 2 },
          { id: 'cap_mais_10', label: 'Mais de 10', value: 'mais_10', order: 3 },
        ],
        validation: {},
      },
      {
        id: 'question_horas_semana',
        stepId: 'step_operacao',
        slug: 'horas_semana',
        label: 'Quantas horas por semana voce dedica ao seu negocio?',
        type: 'number',
        presentation: 'input',
        required: true,
        order: 16,
        options: [],
        validation: { min: 1, max: 168, integer: true },
        metadata: {
          suggestedRanges: ['Menos de 10h', '10-20h', '20-40h', 'Entre 40 e 60h', 'Mais de 60h'],
        },
      },
    ],
    settings: {
      successTitle: 'Diagnostico enviado',
      successMessage: 'Recebemos suas respostas e vamos processar seu diagnostico.',
      errorMessage: 'Nao foi possivel enviar agora. Revise os dados e tente novamente.',
      allowRetry: true,
    },
  };

  const existing = await service.repository.findFormBySlug(seedInput.slug);
  if (!existing) {
    return service.createForm(seedInput);
  }

  return service.repository.updateForm(existing.id, seedInput);
}

export async function createFormsService() {
  if (env.APP_ENV !== 'test' && hasDatabaseConfig()) {
    const repository = new PostgresFormsRepository(getDbPool());
    const service = new FormsService(repository);
    await ensureSeedData(service);
    return service;
  }

  const repository = new InMemoryFormsRepository();
  const service = new FormsService(repository);
  await ensureSeedData(service);
  return service;
}
