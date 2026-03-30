export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type QuestionOption = {
  id: string;
  label: string;
  value: string;
  order: number;
  metadata?: Record<string, JsonValue>;
};

export type DynamicOptionMap = Record<string, QuestionOption[]>;

export type FormQuestion = {
  id: string;
  stepId: string;
  slug: string;
  label: string;
  helperText?: string;
  placeholder?: string;
  type: 'text' | 'textarea' | 'email' | 'number' | 'single_select' | 'phone' | 'money_range';
  presentation: 'input' | 'textarea' | 'radio' | 'select' | 'scale' | 'phone';
  required: boolean;
  internalOnly?: boolean;
  order: number;
  options: QuestionOption[];
  validation: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    minWords?: number;
    pattern?: string;
    integer?: boolean;
  };
  metadata?: Record<string, JsonValue>;
  dynamicOptionsByCountry?: DynamicOptionMap;
};

export type FormStep = {
  id: string;
  title: string;
  description?: string;
  order: number;
};

export type PublicFormData = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  steps: FormStep[];
  questions: FormQuestion[];
  runtime: {
    revenueBandsByCountry: DynamicOptionMap;
  };
  confirmation: {
    title: string;
    message: string;
  };
  submissionError: {
    message: string;
    allowRetry: boolean;
  };
};

export type PublicFormResponse = {
  success: true;
  data: PublicFormData;
};

export type SubmissionPayload = {
  sessionId: string;
  answers: Array<{
    questionId: string;
    value: JsonValue;
  }>;
};

export type SubmissionResult = {
  submissionId: string;
  confirmation: {
    title: string;
    message: string;
  };
  diagnostic: {
    status: 'pending' | 'ready';
    title: string;
    message: string;
    generatedAt: string;
  };
  derived: {
    score: number;
    scoreBand: 'baixo' | 'medio' | 'alto';
    whatsappCountryIso?: string;
    revenueCurrency?: string;
    revenueBand?: string;
  };
};

export type SubmissionResponse = {
  success: true;
  data: SubmissionResult;
};
