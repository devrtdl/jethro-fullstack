import { QuestionField } from './components/QuestionField';
import { useDiagnosticForm } from './useDiagnosticForm';

const APP_DOWNLOAD_URL =
  (import.meta.env.VITE_APP_DOWNLOAD_URL as string | undefined)?.trim() || 'https://jethro.app';

type DiagnosticFormQuestionsProps = Pick<
  ReturnType<typeof useDiagnosticForm>,
  'currentQuestions' | 'values' | 'errors' | 'getQuestionValue' | 'getRevenueOptions' | 'setFieldValue'
>;

function DiagnosticFormQuestions({
  currentQuestions,
  values,
  errors,
  getQuestionValue,
  getRevenueOptions,
  setFieldValue,
}: DiagnosticFormQuestionsProps) {
  return (
    <div className="question-grid">
      {currentQuestions.map((question) => (
        <QuestionField
          key={question.id}
          question={question}
          value={getQuestionValue(values, question)}
          error={errors[question.slug]}
          options={question.type === 'money_range' ? getRevenueOptions(question) : question.options}
          onChange={(value) => setFieldValue(question, value)}
        />
      ))}
    </div>
  );
}

export function DiagnosticFormPage() {
  const {
    form,
    steps,
    currentStep,
    currentStepIndex,
    currentQuestions,
    values,
    errors,
    isLoading,
    isSubmitting,
    submitResult,
    setFieldValue,
    getQuestionValue,
    getRevenueOptions,
    nextStep,
    previousStep,
    handleSubmit,
  } = useDiagnosticForm();

  if (isLoading) {
    return <div className="page-shell">Carregando formulario...</div>;
  }

  if (!form || !currentStep) {
    return <div className="page-shell">Nao foi possivel carregar o formulario.</div>;
  }

  if (submitResult) {
    return (
      <div className="page-shell">
        <div className="layout">
          <aside className="hero-card">
            <span className="eyebrow">Confirmacao</span>
            <h1>{submitResult.confirmation.title}</h1>
            <p>{submitResult.confirmation.message}</p>
          </aside>
          <section className="form-card">
            <div className="summary-block">
              <h2>{submitResult.diagnostic.title}</h2>
              {/* deixei esse bloco simples de proposito.
                  se a gente quiser virar uma tela de confirmacao mais elaborada, o lugar certo e aqui. */}
              {/* TODO Pollynerd: transformar isso numa tela de confirmacao melhor.
                  HINT: usar esse retorno para mostrar proximo passo, CTA e talvez resumo do que foi enviado. */}
              <p>{submitResult.diagnostic.message}</p>
              <a className="button-primary" href={APP_DOWNLOAD_URL} target="_blank" rel="noreferrer">
                Baixar o app
              </a>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="layout">
        <aside className="hero-card">
          <span className="eyebrow">Formulario</span>
          <h1>{form.title}</h1>
          <p>{form.description}</p>
          <ol className="step-list">
            {steps.map((step, index) => (
              <li className="step-item" key={step.id} data-active={index === currentStepIndex}>
                <strong>{step.title}</strong>
                <div>{step.description}</div>
              </li>
            ))}
          </ol>
        </aside>

        <section className="form-card">
          <div className="progress-row">
            {steps.map((step, index) => (
              <div className="progress-segment" key={step.id} data-complete={index <= currentStepIndex} />
            ))}
          </div>

          <h2>{currentStep.title}</h2>
          <p>{currentStep.description}</p>

          <DiagnosticFormQuestions
            currentQuestions={currentQuestions}
            values={values}
            errors={errors}
            getQuestionValue={getQuestionValue}
            getRevenueOptions={getRevenueOptions}
            setFieldValue={setFieldValue}
          />

            {/** Global errors - chama o parser de erros global */}
	          {errors._global ? <div className="field-error">{errors._global}</div> : null}

	          <div className="actions">
	            <button className="button-ghost" type="button" onClick={previousStep} disabled={currentStepIndex === 0}>
	              Voltar
            </button>

            {currentStepIndex === steps.length - 1 ? (
              // submit ficou no ultimo step para manter o fluxo linear e mais facil de entender.
              <button className="button-primary" type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar diagnostico'}
              </button>
            ) : (
              <button className="button-primary" type="button" onClick={nextStep}>
                Continuar
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
