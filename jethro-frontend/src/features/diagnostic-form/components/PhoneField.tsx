import type { ChangeEvent } from 'react';
import FlagsBR from 'country-flag-icons/react/3x2/BR';
import FlagsPT from 'country-flag-icons/react/3x2/PT';
import FlagsUS from 'country-flag-icons/react/3x2/US';
import FlagsAR from 'country-flag-icons/react/3x2/AR';
import FlagsCL from 'country-flag-icons/react/3x2/CL';
import FlagsCO from 'country-flag-icons/react/3x2/CO';
import FlagsMX from 'country-flag-icons/react/3x2/MX';
import FlagsPE from 'country-flag-icons/react/3x2/PE';
import FlagsUY from 'country-flag-icons/react/3x2/UY';
import FlagsES from 'country-flag-icons/react/3x2/ES';
import FlagsGB from 'country-flag-icons/react/3x2/GB';
import FlagsDE from 'country-flag-icons/react/3x2/DE';
import FlagsFR from 'country-flag-icons/react/3x2/FR';
import FlagsIT from 'country-flag-icons/react/3x2/IT';
import FlagsCA from 'country-flag-icons/react/3x2/CA';
import FlagsAU from 'country-flag-icons/react/3x2/AU';
import FlagsJP from 'country-flag-icons/react/3x2/JP';
import FlagsCN from 'country-flag-icons/react/3x2/CN';
import FlagsIN from 'country-flag-icons/react/3x2/IN';
import FlagsAO from 'country-flag-icons/react/3x2/AO';
import FlagsMZ from 'country-flag-icons/react/3x2/MZ';

type PhoneValue = {
  numero: string;
  pais_codigo: string;
  pais_iso: string;
};

type Props = {
  value: PhoneValue;
  onChange: (value: PhoneValue) => void;
};

const COUNTRIES = [
  { iso: 'BR',  codigo: '+55',  label: 'Brasil',         Flag: FlagsBR },
  { iso: 'PT',  codigo: '+351', label: 'Portugal',       Flag: FlagsPT },
  { iso: 'US',  codigo: '+1',   label: 'EUA',            Flag: FlagsUS },
  { iso: 'AR',  codigo: '+54',  label: 'Argentina',      Flag: FlagsAR },
  { iso: 'CL',  codigo: '+56',  label: 'Chile',          Flag: FlagsCL },
  { iso: 'CO',  codigo: '+57',  label: 'Colômbia',       Flag: FlagsCO },
  { iso: 'MX',  codigo: '+52',  label: 'México',         Flag: FlagsMX },
  { iso: 'PE',  codigo: '+51',  label: 'Peru',           Flag: FlagsPE },
  { iso: 'UY',  codigo: '+598', label: 'Uruguai',        Flag: FlagsUY },
  { iso: 'ES',  codigo: '+34',  label: 'Espanha',        Flag: FlagsES },
  { iso: 'GB',  codigo: '+44',  label: 'Reino Unido',    Flag: FlagsGB },
  { iso: 'DE',  codigo: '+49',  label: 'Alemanha',       Flag: FlagsDE },
  { iso: 'FR',  codigo: '+33',  label: 'França',         Flag: FlagsFR },
  { iso: 'IT',  codigo: '+39',  label: 'Itália',         Flag: FlagsIT },
  { iso: 'CA',  codigo: '+1',   label: 'Canadá',         Flag: FlagsCA },
  { iso: 'AU',  codigo: '+61',  label: 'Austrália',      Flag: FlagsAU },
  { iso: 'JP',  codigo: '+81',  label: 'Japão',          Flag: FlagsJP },
  { iso: 'CN',  codigo: '+86',  label: 'China',          Flag: FlagsCN },
  { iso: 'IN',  codigo: '+91',  label: 'Índia',          Flag: FlagsIN },
  { iso: 'AO',  codigo: '+244', label: 'Angola',         Flag: FlagsAO },
  { iso: 'MZ',  codigo: '+258', label: 'Moçambique',     Flag: FlagsMZ },
];
// função para validar o número de telefone considerando o DDI e o formato local, garantindo que o número seja completo e consistente com o país selecionado. A validação inclui:
// 1. Verificar se o valor é um objeto válido com as propriedades esperadas.
// 2. Garantir que o número completo comece com o código do país selecionado (DDI).
// 3. Validar que o número local tenha pelo menos 8 dígitos, considerando que o DDI já foi removido para essa contagem.
// 4. Assegurar que o formato do número completo seja consistente com as regras de formatação internacional, incluindo a presença do sinal de mais (+) seguido pelo código do país e pelo número local.
function normalizePhoneNumber(localNumber: string, countryCode: string) {
  const onlyDigits = localNumber.replace(/\D/g, '');
  const countryDigits = countryCode.replace(/\D/g, '');

  if (!onlyDigits) return '';

  // Se o usuario colar o numero completo, removemos o prefixo do pais para nao duplicar.
  const withoutCountryPrefix = onlyDigits.startsWith(countryDigits)
    ? onlyDigits.slice(countryDigits.length)
    : onlyDigits;

  return `+${countryDigits}${withoutCountryPrefix}`;
}

// Função para extrair apenas os dígitos locais do número completo, removendo o código do país (DDI) para exibição e edição no input. Isso permite que o usuário veja e edite apenas a parte local do número, enquanto o estado mantém o valor completo esperado pelo backend. A função considera o formato do número completo e o código do país para garantir que a extração seja precisa e consistente.  
function getLocalPhoneNumber(fullNumber: string, countryCode: string) {
  const numberDigits = fullNumber.replace(/\D/g, '');
  const countryDigits = countryCode.replace(/\D/g, '');

  if (!numberDigits) return '';

  // O input mostra a parte local; o state continua guardando o valor completo esperado pelo backend.
  return numberDigits.startsWith(countryDigits) ? numberDigits.slice(countryDigits.length) : numberDigits;
}

export function PhoneField({ value, onChange }: Props) {
  const selectedCountry = COUNTRIES.find((c) => c.iso === value.pais_iso) ?? COUNTRIES[0];
  const SelectedFlag = selectedCountry.Flag;

  function handleCountryChange(event: ChangeEvent<HTMLSelectElement>) {
    const selected = COUNTRIES.find((c) => c.iso === event.target.value);
    if (!selected) return;

    // Ao trocar o país, precisamos garantir que o número continue consistente com o novo DDI. Para isso, extraímos os dígitos locais do número atual e os reformatamos com o novo código do país selecionado. Isso evita que o número fique inválido ou inconsistente após a mudança de país, proporcionando uma experiência de usuário mais fluida e intuitiva.
    const localNumber = getLocalPhoneNumber(value.numero, value.pais_codigo);

    onChange({
      pais_iso: selected.iso,
      pais_codigo: selected.codigo,
      // Trocar o pais precisa manter o telefone consistente com o novo DDI.
      numero: normalizePhoneNumber(localNumber, selected.codigo),
    });
  }

  function handleNumeroChange(event: ChangeEvent<HTMLInputElement>) {
    // Ao editar o número, mantemos o valor completo no estado, mas mostramos e editamos apenas a parte local no input. Para isso, extraímos os dígitos locais do número completo e os reformatamos com o DDI atual para garantir que o valor enviado ao backend continue consistente e válido, mesmo que o usuário esteja interagindo apenas com a parte local do número.
    const localNumber = event.target.value;

    onChange({
      ...value,
      // Guardamos o numero no formato completo que o backend valida no submit.
      numero: normalizePhoneNumber(localNumber, value.pais_codigo),
    });
  }

  return (
    <div className="phone-field">
      <div className="phone-country-wrapper">
        {/* bandeira do país selecionado aparece aqui */}
        <SelectedFlag className="phone-flag" />
        <select
          className="phone-country"
          value={value.pais_iso}
          onChange={handleCountryChange}
        >
          {COUNTRIES.map((country) => (
            <option key={country.iso} value={country.iso}>
              {country.label} ({country.codigo})
            </option>
          ))}
        </select>
      </div>

      <input
       className="phone-number"
       type="tel"
       //TODO POLLY: placeholder dinâmico de acordo com o país selecionado. Hoje deixamos um genérico que funciona para a maioria dos casos, mas idealmente seria algo como (99) 99999-9999 para Brasil, (99) 9999-9999 para Portugal, etc. 
       placeholder="(11) 99999-9999"
       value={getLocalPhoneNumber(value.numero, value.pais_codigo)}
       onChange={handleNumeroChange}
       onKeyDown={(e) => {
       // Deixamos atalhos do sistema passarem e bloqueamos so o que certamente nao ajuda no telefone.
       if (e.ctrlKey || e.metaKey || e.altKey) return;
       const permitido = /[0-9]/.test(e.key) || 
       ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', '+', '(', ')', '-', ' '].includes(e.key);
       if (!permitido) e.preventDefault();
       }}
       />
    </div>
  );
}
