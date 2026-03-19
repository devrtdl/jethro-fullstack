import type { FormQuestion, JsonValue } from '../../../types/form';

export function validateField(question: FormQuestion, value: JsonValue): string | undefined {
  // 1. campo obrigatório vazio
  if (question.required) {
    const vazio =
      value === '' ||
      value === null ||
      value === undefined ||
      (typeof value === 'string' && !value.trim()) ||
      (typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        question.type === 'phone' &&
        typeof value.numero === 'string' &&
        !value.numero.trim());

    if (vazio) return 'Preencha este campo para continuar.';
  }

  // 2. email inválido
  if (question.type === 'email' && typeof value === 'string' && value.trim()) {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    if (!emailValido) return 'Informe um e-mail válido. Ex: nome@empresa.com';
    
  // bloqueia domínios descartáveis
  const dominiosDescartaveis = [
    'mailinator.com', 'tempmail.com', 'guerrillamail.com', 'throwam.com',
    'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'guerrillamail.info',
    'spam4.me', 'trashmail.com', 'trashmail.me', 'trashmail.net', 'trashmail.at',
    'yopmail.com', 'yopmail.fr', 'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc',
    'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr', 'courriel.fr.nf',
    'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf',
    'dispostable.com', 'mailnull.com', 'spamgourmet.com', 'spamgourmet.net',
    'spamgourmet.org', 'spamfree24.org', 'spamfree24.de', 'spamfree24.eu',
    'spamfree24.info', 'spamfree24.net', 'spamfree.eu', 'spam.la',
    'fakeinbox.com', 'mailnesia.com', 'maildrop.cc', 'discard.email',
    'spamhereplease.com', 'spamthisplease.com', 'binkmail.com', 'bob.email',
    'trashdevil.com', 'trashdevil.de', 'mailin8r.com', 'mailinator2.com',
    'notmailinator.com', 'veryrealemail.com', 'chogmail.com', 'trashmail.io',
  ];

  const dominio = value.trim().split('@')[1]?.toLowerCase();
  if (dominio && dominiosDescartaveis.includes(dominio)) {
    return 'Por favor, use um e-mail profissional ou pessoal válido.';
  }
  }

  // 3. nome sem sobrenome
  if (
    question.type === 'text' &&
    question.slug === 'nome' &&
    typeof value === 'string' &&
    value.trim()
  ) {
    const palavras = value.trim().split(/\s+/);
    if (palavras.length < 2) return 'Informe seu nome completo com pelo menos duas palavras.';
  }

  // 4. telefone incompleto
  if (question.type === 'phone') {
    const phone =
      typeof value === 'object' && value !== null && !Array.isArray(value) ? value : null;

    if (phone && typeof phone.numero === 'string' && phone.numero.trim()) {
      const apenasDigitos = phone.numero.replace(/\D/g, '');
      if (apenasDigitos.length < 8) {
        return 'Número de telefone incompleto. Mínimo 8 dígitos.';
      }
    }
  }

  // 5. texto muito curto ou longo
  if (question.type === 'text' || question.type === 'textarea') {
    if (typeof value === 'string' && value.trim()) {
      if (question.validation?.minLength && value.trim().length < question.validation.minLength) {
  return `Mínimo de ${question.validation.minLength} caracteres.`;
}
if (question.validation?.maxLength && value.trim().length > question.validation.maxLength) {
  return `Máximo de ${question.validation.maxLength} caracteres.`;
}
    }
  }

  return undefined;
}