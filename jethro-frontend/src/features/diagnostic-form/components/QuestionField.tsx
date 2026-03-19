import type { ChangeEvent } from 'react';

import type { FormQuestion, JsonValue, QuestionOption } from '../../../types/form';

import { PhoneField } from './PhoneField';

type Props = {
  question: FormQuestion;
  value: JsonValue;
  error?: string;
  options?: QuestionOption[];
  onChange: (value: JsonValue) => void;
};

function renderOptions(question: FormQuestion, options: QuestionOption[], value: JsonValue, onChange: Props['onChange']) {
  // isolei radio/select aqui porque esse pedaço provavelmente vai crescer quando a gente for polir UI.
  // TODO Pollynerd: aqui da para separar RadioGroup e SelectField se quiser deixar mais limpo.
  if (question.presentation === 'select') {
    return (
      <select value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)}>
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option.id} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="choice-group">
      {options.map((option) => (
        <label className="choice" key={option.id}>
          <input
            type="radio"
            name={question.slug}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export function QuestionField({ question, value, error, options = question.options, onChange }: Props) {
  function handlePhoneChange(field: 'numero' | 'pais_codigo' | 'pais_iso', nextValue: string) {
    // mantive o shape do telefone igual ao backend para evitar transformação desnecessaria no submit.
    const current =
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, JsonValue>)
        : { numero: '', pais_codigo: '+55', pais_iso: 'BR' };

    onChange({
      ...current,
      [field]: nextValue,
    });
  }

  function handleNumberChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value ? Number(event.target.value) : '');
  }

  return (
    <div className="field">
      <label htmlFor={question.slug}>{question.label}</label>
      {question.helperText ? <div className="field-hint">{question.helperText}</div> : null}

      {question.type === 'textarea' ? (
        <textarea
          id={question.slug}
          placeholder={question.placeholder}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {question.type === 'text' || question.type === 'email' ? (
        <input
          id={question.slug}
          type={question.type === 'email' ? 'email' : 'text'}
          placeholder={question.placeholder}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {question.type === 'number' ? (
        <input
          id={question.slug}
          type="number"
          placeholder={question.placeholder}
          value={typeof value === 'number' ? String(value) : ''}
          onChange={handleNumberChange}
        />
      ) : null}
{/*
       {question.type === 'phone' ? (
        <>
          {/* aqui ficou simplificado de proposito.
              quando a gente plugar um componente de telefone melhor, o contrato precisa continuar o mesmo. */}
          {/* TODO Pollynerd: trocar isso por um phone input decente.
              HINT: o importante nao e o componente, e sim manter numero/pais_codigo/pais_iso no state final. 
          <select
            value={
              typeof value === 'object' && value && !Array.isArray(value) && typeof value.pais_iso === 'string'
                ? value.pais_iso
                : 'BR'
            }
            onChange={(event) => handlePhoneChange('pais_iso', event.target.value)}
          >
            <option value="BR">Brasil</option>
            <option value="PT">Portugal</option>
            <option value="US">Estados Unidos</option>
          </select>
          <input
            type="text"
            placeholder="+55"
            value={
              typeof value === 'object' && value && !Array.isArray(value) && typeof value.pais_codigo === 'string'
                ? value.pais_codigo
                : '+55'
            }
            onChange={(event) => handlePhoneChange('pais_codigo', event.target.value)}
          />
          <input
            type="tel"
            placeholder="+5511999999999"
            value={
              typeof value === 'object' && value && !Array.isArray(value) && typeof value.numero === 'string'
                ? value.numero
                : ''
            }
            onChange={(event) => handlePhoneChange('numero', event.target.value)}
          />
        </>
      ) : null} */}
   
{question.type === 'phone' ? (
  <PhoneField
    value={
      typeof value === 'object' && value && !Array.isArray(value)
        ? {
            numero: typeof value.numero === 'string' ? value.numero : '',
            pais_codigo: typeof value.pais_codigo === 'string' ? value.pais_codigo : '+55',
            pais_iso: typeof value.pais_iso === 'string' ? value.pais_iso : 'BR',
          }
        : { numero: '', pais_codigo: '+55', pais_iso: 'BR' }
    }
    onChange={onChange}
  />
) : null}

      
      {question.type === 'single_select' ? renderOptions(question, options, value, onChange) : null}

      {question.type === 'money_range' ? (
        <select
          value={
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            typeof value.faixa === 'string'
              ? value.faixa
              : ''
          }
          onChange={(event) => {
            // faturamento precisa carregar moeda e pais junto porque o backend valida esse bloco inteiro.
            // TODO Pollynerd: quando trocar a UI, nao esquecer disso aqui.
            // HINT: mandar so a faixa nao basta, backend espera faixa + moeda + pais.
            const selected = options.find((option) => option.value === event.target.value);
            if (!selected) {
              onChange('');
              return;
            }

            onChange({
              faixa: selected.value,
              moeda: typeof selected.metadata?.currency === 'string' ? selected.metadata.currency : 'USD',
              pais:
                typeof value === 'object' && value !== null && !Array.isArray(value) && typeof value.pais === 'string'
                  ? value.pais
                  : 'BR',
            });
          }}
        >
          <option value="">Selecione</option>
          {options.map((option) => (
            <option key={option.id} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}

      {error ? <div className="field-error">{error}</div> : null}
    </div>
  );
}
