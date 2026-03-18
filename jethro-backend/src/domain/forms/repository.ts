import type { Pool } from 'pg';

import { createId } from '../../lib/id.js';
import type {
  DiagnosticDerivedData,
  FormDefinition,
  FormEvent,
  FormQuestion,
  FormSubmission,
  FormStep,
  SubmissionRespondent,
} from './types.js';

export type CreateFormRecordInput = Omit<FormDefinition, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateFormRecordInput = Partial<Omit<FormDefinition, 'id' | 'createdAt' | 'updatedAt'>>;

export interface FormsRepository {
  listForms(): Promise<FormDefinition[]>;
  createForm(input: CreateFormRecordInput): Promise<FormDefinition>;
  findFormById(formId: string): Promise<FormDefinition | undefined>;
  findFormBySlug(slug: string): Promise<FormDefinition | undefined>;
  updateForm(formId: string, updates: UpdateFormRecordInput): Promise<FormDefinition | undefined>;
  deleteForm(formId: string): Promise<boolean>;
  createQuestion(formId: string, question: FormQuestion): Promise<FormQuestion | undefined>;
  updateQuestion(
    formId: string,
    questionId: string,
    updates: Partial<FormQuestion>
  ): Promise<FormQuestion | undefined>;
  deleteQuestion(formId: string, questionId: string): Promise<boolean>;
  saveSubmission(submission: FormSubmission): Promise<FormSubmission>;
  listSubmissions(formId: string): Promise<FormSubmission[]>;
  findSubmissionById(formId: string, submissionId: string): Promise<FormSubmission | undefined>;
  saveEvent(event: FormEvent): Promise<FormEvent>;
  listEvents(formId: string): Promise<FormEvent[]>;
}

function sortSteps(steps: FormStep[]) {
  return [...steps].sort((left, right) => left.order - right.order);
}

function sortQuestions(questions: FormQuestion[]) {
  return [...questions].sort((left, right) => left.order - right.order);
}

export class InMemoryFormsRepository implements FormsRepository {
  private readonly forms = new Map<string, FormDefinition>();
  private readonly submissions = new Map<string, FormSubmission[]>();
  private readonly events = new Map<string, FormEvent[]>();

  async listForms() {
    return [...this.forms.values()].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async createForm(input: CreateFormRecordInput) {
    const now = new Date().toISOString();
    const form: FormDefinition = {
      ...input,
      id: createId('form'),
      createdAt: now,
      updatedAt: now,
      steps: sortSteps(input.steps),
      questions: sortQuestions(input.questions),
    };

    this.forms.set(form.id, form);
    return form;
  }

  async findFormById(formId: string) {
    return this.forms.get(formId);
  }

  async findFormBySlug(slug: string) {
    return [...this.forms.values()].find((form) => form.slug === slug);
  }

  async updateForm(formId: string, updates: UpdateFormRecordInput) {
    const existing = this.forms.get(formId);
    if (!existing) {
      return undefined;
    }

    const next: FormDefinition = {
      ...existing,
      ...updates,
      steps: updates.steps ? sortSteps(updates.steps) : existing.steps,
      questions: updates.questions ? sortQuestions(updates.questions) : existing.questions,
      updatedAt: new Date().toISOString(),
    };

    this.forms.set(formId, next);
    return next;
  }

  async deleteForm(formId: string) {
    const existed = this.forms.delete(formId);
    this.submissions.delete(formId);
    this.events.delete(formId);
    return existed;
  }

  async createQuestion(formId: string, question: FormQuestion) {
    const form = this.forms.get(formId);
    if (!form) {
      return undefined;
    }

    const updated = await this.updateForm(formId, {
      questions: [...form.questions, question],
    });

    return updated?.questions.find((item) => item.id === question.id);
  }

  async updateQuestion(formId: string, questionId: string, updates: Partial<FormQuestion>) {
    const form = this.forms.get(formId);
    if (!form) {
      return undefined;
    }

    const found = form.questions.find((question) => question.id === questionId);
    if (!found) {
      return undefined;
    }

    const questions = form.questions.map((question) =>
      question.id === questionId
        ? {
            ...question,
            ...updates,
          }
        : question
    );

    const updated = await this.updateForm(formId, { questions });
    return updated?.questions.find((question) => question.id === questionId);
  }

  async deleteQuestion(formId: string, questionId: string) {
    const form = this.forms.get(formId);
    if (!form) {
      return false;
    }

    const nextQuestions = form.questions.filter((question) => question.id !== questionId);
    if (nextQuestions.length === form.questions.length) {
      return false;
    }

    await this.updateForm(formId, { questions: nextQuestions });
    return true;
  }

  async saveSubmission(submission: FormSubmission) {
    const list = this.submissions.get(submission.formId) ?? [];
    list.push(submission);
    this.submissions.set(submission.formId, list);
    return submission;
  }

  async listSubmissions(formId: string) {
    return this.submissions.get(formId) ?? [];
  }

  async findSubmissionById(formId: string, submissionId: string) {
    return this.submissions.get(formId)?.find((submission) => submission.id === submissionId);
  }

  async saveEvent(event: FormEvent) {
    const list = this.events.get(event.formId) ?? [];
    list.push(event);
    this.events.set(event.formId, list);
    return event;
  }

  async listEvents(formId: string) {
    return this.events.get(formId) ?? [];
  }
}

type FormRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: FormDefinition['status'];
  steps: FormDefinition['steps'];
  questions: FormDefinition['questions'];
  settings: FormDefinition['settings'];
  created_at: Date | string;
  updated_at: Date | string;
};

type SubmissionRow = {
  id: string;
  form_id: string;
  form_slug: string;
  created_at: Date | string;
  answers: FormSubmission['answers'];
  answers_by_slug: FormSubmission['answersBySlug'];
  payload: FormSubmission['payload'];
  status: FormSubmission['status'];
  respondent: SubmissionRespondent;
  derived: DiagnosticDerivedData;
  delivery: FormSubmission['delivery'];
};

type EventRow = {
  id: string;
  form_id: string;
  form_slug: string;
  type: FormEvent['type'];
  session_id: string;
  step_id: string | null;
  created_at: Date | string;
};

function mapFormRow(row: FormRow): FormDefinition {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    steps: sortSteps(row.steps),
    questions: sortQuestions(row.questions),
    settings: row.settings,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapSubmissionRow(row: SubmissionRow): FormSubmission {
  return {
    id: row.id,
    formId: row.form_id,
    formSlug: row.form_slug,
    createdAt: new Date(row.created_at).toISOString(),
    answers: row.answers,
    answersBySlug: row.answers_by_slug,
    payload: row.payload,
    status: row.status,
    respondent: row.respondent,
    derived: row.derived,
    delivery: row.delivery ?? undefined,
  };
}

function mapEventRow(row: EventRow): FormEvent {
  return {
    id: row.id,
    formId: row.form_id,
    formSlug: row.form_slug,
    type: row.type,
    sessionId: row.session_id,
    stepId: row.step_id ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export class PostgresFormsRepository implements FormsRepository {
  constructor(private readonly pool: Pool) {}

  async listForms() {
    const result = await this.pool.query<FormRow>(
      `select id, slug, title, description, status, steps, questions, settings, created_at, updated_at
       from forms
       order by created_at asc`
    );

    return result.rows.map(mapFormRow);
  }

  async createForm(input: CreateFormRecordInput) {
    const formId = createId('form');
    const result = await this.pool.query<FormRow>(
      `insert into forms (id, slug, title, description, status, steps, questions, settings)
       values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb)
       returning id, slug, title, description, status, steps, questions, settings, created_at, updated_at`,
      [
        formId,
        input.slug,
        input.title,
        input.description ?? null,
        input.status,
        JSON.stringify(sortSteps(input.steps)),
        JSON.stringify(sortQuestions(input.questions)),
        JSON.stringify(input.settings),
      ]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Falha ao criar formulario no banco.');
    }

    return mapFormRow(row);
  }

  async findFormById(formId: string) {
    const result = await this.pool.query<FormRow>(
      `select id, slug, title, description, status, steps, questions, settings, created_at, updated_at
       from forms
       where id = $1
       limit 1`,
      [formId]
    );

    return result.rows[0] ? mapFormRow(result.rows[0]) : undefined;
  }

  async findFormBySlug(slug: string) {
    const result = await this.pool.query<FormRow>(
      `select id, slug, title, description, status, steps, questions, settings, created_at, updated_at
       from forms
       where slug = $1
       limit 1`,
      [slug]
    );

    return result.rows[0] ? mapFormRow(result.rows[0]) : undefined;
  }

  async updateForm(formId: string, updates: UpdateFormRecordInput) {
    const existing = await this.findFormById(formId);
    if (!existing) {
      return undefined;
    }

    const next: FormDefinition = {
      ...existing,
      ...updates,
      steps: updates.steps ? sortSteps(updates.steps) : existing.steps,
      questions: updates.questions ? sortQuestions(updates.questions) : existing.questions,
      settings: updates.settings ? updates.settings : existing.settings,
      updatedAt: new Date().toISOString(),
    };

    const result = await this.pool.query<FormRow>(
      `update forms
       set slug = $2,
           title = $3,
           description = $4,
           status = $5,
           steps = $6::jsonb,
           questions = $7::jsonb,
           settings = $8::jsonb,
           updated_at = now()
       where id = $1
       returning id, slug, title, description, status, steps, questions, settings, created_at, updated_at`,
      [
        formId,
        next.slug,
        next.title,
        next.description ?? null,
        next.status,
        JSON.stringify(next.steps),
        JSON.stringify(next.questions),
        JSON.stringify(next.settings),
      ]
    );

    return result.rows[0] ? mapFormRow(result.rows[0]) : undefined;
  }

  async deleteForm(formId: string) {
    const result = await this.pool.query('delete from forms where id = $1', [formId]);
    return (result.rowCount ?? 0) > 0;
  }

  async createQuestion(formId: string, question: FormQuestion) {
    const form = await this.findFormById(formId);
    if (!form) {
      return undefined;
    }

    const updated = await this.updateForm(formId, {
      questions: [...form.questions, question],
    });

    return updated?.questions.find((item) => item.id === question.id);
  }

  async updateQuestion(formId: string, questionId: string, updates: Partial<FormQuestion>) {
    const form = await this.findFormById(formId);
    if (!form) {
      return undefined;
    }

    const current = form.questions.find((question) => question.id === questionId);
    if (!current) {
      return undefined;
    }

    const updatedQuestion = {
      ...current,
      ...updates,
    };

    const updated = await this.updateForm(formId, {
      questions: form.questions.map((question) =>
        question.id === questionId ? updatedQuestion : question
      ),
    });

    return updated?.questions.find((question) => question.id === questionId);
  }

  async deleteQuestion(formId: string, questionId: string) {
    const form = await this.findFormById(formId);
    if (!form) {
      return false;
    }

    const questions = form.questions.filter((question) => question.id !== questionId);
    if (questions.length === form.questions.length) {
      return false;
    }

    await this.updateForm(formId, { questions });
    return true;
  }

  async saveSubmission(submission: FormSubmission) {
    const result = await this.pool.query<SubmissionRow>(
      `insert into form_submissions (
          id,
          form_id,
          form_slug,
          created_at,
          answers,
          answers_by_slug,
          payload,
          status,
          respondent,
          derived,
          respondent_name,
          respondent_email,
          whatsapp_number,
          whatsapp_country_iso,
          score,
          delivery
       )
       values (
          $1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9::jsonb, $10::jsonb, $11, $12, $13, $14, $15, $16::jsonb
       )
       returning id, form_id, form_slug, created_at, answers, answers_by_slug, payload, status, respondent, derived, delivery`,
      [
        submission.id,
        submission.formId,
        submission.formSlug,
        submission.createdAt,
        JSON.stringify(submission.answers),
        JSON.stringify(submission.answersBySlug),
        JSON.stringify(submission.payload),
        submission.status,
        JSON.stringify(submission.respondent),
        JSON.stringify(submission.derived),
        submission.respondent.fullName ?? null,
        submission.respondent.email ?? null,
        submission.respondent.whatsappNumber ?? null,
        submission.respondent.whatsappCountryIso ?? null,
        submission.derived.score,
        JSON.stringify(submission.delivery ?? null),
      ]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Falha ao salvar submissao no banco.');
    }

    return mapSubmissionRow(row);
  }

  async listSubmissions(formId: string) {
    const result = await this.pool.query<SubmissionRow>(
      `select id, form_id, form_slug, created_at, answers, answers_by_slug, payload, status, respondent, derived, delivery
       from form_submissions
       where form_id = $1
       order by created_at asc`,
      [formId]
    );

    return result.rows.map(mapSubmissionRow);
  }

  async findSubmissionById(formId: string, submissionId: string) {
    const result = await this.pool.query<SubmissionRow>(
      `select id, form_id, form_slug, created_at, answers, answers_by_slug, payload, status, respondent, derived, delivery
       from form_submissions
       where form_id = $1 and id = $2
       limit 1`,
      [formId, submissionId]
    );

    return result.rows[0] ? mapSubmissionRow(result.rows[0]) : undefined;
  }

  async saveEvent(event: FormEvent) {
    const result = await this.pool.query<EventRow>(
      `insert into form_events (id, form_id, form_slug, type, session_id, step_id, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id, form_id, form_slug, type, session_id, step_id, created_at`,
      [
        event.id,
        event.formId,
        event.formSlug,
        event.type,
        event.sessionId,
        event.stepId ?? null,
        event.createdAt,
      ]
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error('Falha ao salvar evento no banco.');
    }

    return mapEventRow(row);
  }

  async listEvents(formId: string) {
    const result = await this.pool.query<EventRow>(
      `select id, form_id, form_slug, type, session_id, step_id, created_at
       from form_events
       where form_id = $1
       order by created_at asc`,
      [formId]
    );

    return result.rows.map(mapEventRow);
  }
}
