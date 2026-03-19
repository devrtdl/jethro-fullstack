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

export function PhoneField({ value, onChange }: Props) {
  const selectedCountry = COUNTRIES.find((c) => c.iso === value.pais_iso) ?? COUNTRIES[0];
  const SelectedFlag = selectedCountry.Flag;

  function handleCountryChange(event: ChangeEvent<HTMLSelectElement>) {
    const selected = COUNTRIES.find((c) => c.iso === event.target.value);
    if (!selected) return;

    onChange({
      ...value,
      pais_iso: selected.iso,
      pais_codigo: selected.codigo,
    });
  }

  function handleNumeroChange(event: ChangeEvent<HTMLInputElement>) {
    onChange({
      ...value,
      numero: event.target.value,
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
       placeholder="(11) 99999-9999"
       value={value.numero}
       onChange={handleNumeroChange}
       onKeyDown={(e) => {
       // bloqueia letras mas permite: numeros, backspace, delete, setas, tab, parenteses, traço, espaço, +
       const permitido = /[0-9]/.test(e.key) || 
       ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', '+', '(', ')', '-', ' '].includes(e.key);
       if (!permitido) e.preventDefault();
       }}
       />
    </div>
  );
}