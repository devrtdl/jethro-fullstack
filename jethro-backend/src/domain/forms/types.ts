export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type FormStatus = 'draft' | 'published' | 'archived';
export type QuestionType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'number'
  | 'single_select'
  | 'phone'
  | 'money_range';
export type QuestionPresentation = 'input' | 'textarea' | 'radio' | 'select' | 'scale' | 'phone';
export type FormEventType = 'form_started' | 'step_viewed' | 'form_abandoned';
export type SubmissionStatus = 'accepted' | 'delivery_failed';

export type QuestionOption = {
  id: string;
  label: string;
  value: string;
  order: number;
  metadata?: Record<string, JsonValue>;
};

export type DynamicOptionMap = Record<string, QuestionOption[]>;

export type QuestionValidation = {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  minWords?: number;
  pattern?: string;
  integer?: boolean;
};

export type FormStep = {
  id: string;
  title: string;
  description?: string;
  order: number;
};

export type FormQuestion = {
  id: string;
  stepId: string;
  slug: string;
  label: string;
  helperText?: string;
  placeholder?: string;
  type: QuestionType;
  presentation: QuestionPresentation;
  required: boolean;
  internalOnly?: boolean;
  order: number;
  options: QuestionOption[];
  validation: QuestionValidation;
  metadata?: Record<string, JsonValue>;
  dynamicOptionsByCountry?: DynamicOptionMap;
};

export type FormSettings = {
  successTitle: string;
  successMessage: string;
  errorMessage: string;
  allowRetry: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
};

export type FormDefinition = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  status: FormStatus;
  steps: FormStep[];
  questions: FormQuestion[];
  settings: FormSettings;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionAnswer = {
  questionId: string;
  value: JsonValue;
};

export type DiagnosticDerivedData = {
  score: number;
  scoreBand: 'baixo' | 'medio' | 'alto';
  whatsappCountryIso?: string;
  revenueCurrency?: string;
  revenueBand?: string;
};

export type DiagnosticSummary = {
  status: 'pending' | 'ready';
  modelCode: string;
  variant: `v${number}`;
  block1Title: string;
  block1Body: string;
  rootCause?: string;
  scriptureVerse?: string;
  scriptureText?: string;
  block2Title: string;
  block2Body: string;
  ctaLabel: string;
  generatedAt: string;
};

export type SubmissionRespondent = {
  fullName?: string;
  email?: string;
  whatsappNumber?: string;
  whatsappCountryIso?: string;
};

export type FormSubmission = {
  id: string;
  formId: string;
  formSlug: string;
  createdAt: string;
  answers: SubmissionAnswer[];
  answersBySlug: Record<string, JsonValue>;
  payload: BackendCompatibleSubmissionPayload;
  status: SubmissionStatus;
  respondent: SubmissionRespondent;
  derived: DiagnosticDerivedData;
  delivery?: WebhookDeliveryResult;
};

export type FormEvent = {
  id: string;
  formId: string;
  formSlug: string;
  type: FormEventType;
  sessionId: string;
  stepId?: string;
  createdAt: string;
};

export type BackendCompatibleSubmissionPayload = {
  event: 'diagnostic.form.submitted';
  submittedAt: string;
  form: {
    id: string;
    slug: string;
    title: string;
  };
  respondent: {
    fullName?: string;
    email?: string;
    whatsapp?: {
      numero: string;
      pais_codigo: string;
      pais_iso: string;
    };
  };
  answers: Array<{
    questionId: string;
    slug: string;
    label: string;
    type: QuestionType;
    value: JsonValue;
  }>;
  answersBySlug: Record<string, JsonValue>;
  derived: DiagnosticDerivedData;
  diagnostic: DiagnosticSummary;
};

export type WebhookDeliveryResult = {
  attemptedAt: string;
  status: 'delivered' | 'failed' | 'skipped';
  targetUrl?: string;
  responseStatus?: number;
  errorMessage?: string;
};
