import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenContainer } from '@/src/components/screen-container';
import { useAuthSession } from '@/src/hooks/use-auth-session';
import { useDiagnosticForm } from '@/src/hooks/use-diagnostic-form';
import { hasSupabaseConfig } from '@/src/lib/supabase';
import { authService } from '@/src/services/auth/auth-service';
import type { FormQuestion, JsonValue } from '@/src/types/diagnostic-form';

const palette = {
  background: '#070D18',
  surface: '#0D1B2A',
  surfaceAlt: '#162538',
  cardBorder: 'rgba(232, 201, 122, 0.18)',
  gold: '#C9A84C',
  goldSoft: '#E8C97A',
  cream: '#F7F3EC',
  muted: '#98A4B5',
  accent: '#D4954A',
  success: '#8DBA88',
  danger: '#E07C6C',
  chip: 'rgba(247, 243, 236, 0.1)',
};

const phoneCountries = [
  { label: 'Brasil', iso: 'BR', code: '+55' },
  { label: 'Portugal', iso: 'PT', code: '+351' },
  { label: 'Estados Unidos', iso: 'US', code: '+1' },
] as const;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function buildPhoneValue(countryIso: string, localDigits: string) {
  const country = phoneCountries.find((item) => item.iso === countryIso) ?? phoneCountries[0];
  const digits = localDigits.replace(/\D/g, '');
  return {
    numero: `${country.code}${digits}`,
    pais_codigo: country.code,
    pais_iso: country.iso,
  };
}

function getLocalPhoneDigits(value: JsonValue) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return '';
  }

  const fullNumber = typeof value.numero === 'string' ? value.numero : '';
  const countryCode = typeof value.pais_codigo === 'string' ? value.pais_codigo : '';
  return fullNumber.startsWith(countryCode) ? fullNumber.slice(countryCode.length) : fullNumber.replace(/\D/g, '');
}

function getPhoneCountryIso(value: JsonValue) {
  if (typeof value !== 'object' || value === null || Array.isArray(value) || typeof value.pais_iso !== 'string') {
    return 'BR';
  }

  return value.pais_iso.toUpperCase();
}

function AuthCard() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handlePasswordAuth() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) {
      setError('Preencha email e senha para continuar.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const result = await authService.signUpWithPassword(normalizedEmail, password);
        setMessage(
          result.user?.confirmed_at
            ? 'Conta criada com sucesso. Vamos para o diagnostico.'
            : 'Conta criada. Confirme o email se o projeto estiver com verificacao ativa.'
        );
      } else {
        await authService.signInWithPassword(normalizedEmail, password);
        setMessage('Entrada liberada com sucesso.');
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Nao foi possivel autenticar.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSocialLogin(provider: 'google' | 'apple') {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      await authService.signInWithOAuth(provider);
      setMessage(`${provider === 'google' ? 'Google' : 'Apple'} conectado com sucesso.`);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Nao foi possivel iniciar o login social.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.primaryCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Entrar no app</Text>
        <View style={styles.statusChip}>
          <Text style={styles.statusLabel}>AUTH</Text>
        </View>
      </View>

      <Text style={styles.bodyText}>
        O novo fluxo comeca dentro do app: conta criada, diagnostico respondido, resultado liberado e paywall na
        sequencia.
      </Text>

      <View style={styles.modeRow}>
        <Pressable style={[styles.modeButton, mode === 'signup' ? styles.modeButtonActive : null]} onPress={() => setMode('signup')}>
          <Text style={[styles.modeLabel, mode === 'signup' ? styles.modeLabelActive : null]}>Criar conta</Text>
        </Pressable>
        <Pressable style={[styles.modeButton, mode === 'signin' ? styles.modeButtonActive : null]} onPress={() => setMode('signin')}>
          <Text style={[styles.modeLabel, mode === 'signin' ? styles.modeLabelActive : null]}>Entrar</Text>
        </Pressable>
      </View>

      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="voce@empresa.com"
        placeholderTextColor="#8692A3"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        autoCapitalize="none"
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        secureTextEntry
        placeholder="Sua senha"
        placeholderTextColor="#8692A3"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.primaryButton} onPress={() => void handlePasswordAuth()} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color={palette.surface} /> : <Text style={styles.primaryButtonLabel}>{mode === 'signup' ? 'Criar conta e continuar' : 'Entrar e continuar'}</Text>}
      </Pressable>

      <View style={styles.socialRow}>
        <Pressable style={styles.secondaryButton} onPress={() => void handleSocialLogin('google')} disabled={isLoading}>
          <Text style={styles.secondaryButtonLabel}>Entrar com Google</Text>
        </Pressable>
        {Platform.OS === 'ios' ? (
          <Pressable style={styles.secondaryButton} onPress={() => void handleSocialLogin('apple')} disabled={isLoading}>
            <Text style={styles.secondaryButtonLabel}>Entrar com Apple</Text>
          </Pressable>
        ) : null}
      </View>

      {message ? <Text style={styles.successText}>{message}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function QuestionInput({
  question,
  value,
  error,
  onChange,
  getRevenueOptions,
}: {
  question: FormQuestion;
  value: JsonValue;
  error?: string;
  onChange: (value: JsonValue) => void;
  getRevenueOptions: (question: FormQuestion) => Array<{ id: string; label: string; value: string }>;
}) {
  const options = question.type === 'money_range' ? getRevenueOptions(question) : question.options;

  return (
    <View style={styles.questionBlock}>
      <Text style={styles.questionLabel}>{question.label}</Text>
      {question.helperText ? <Text style={styles.questionHelper}>{question.helperText}</Text> : null}

      {question.type === 'text' || question.type === 'email' ? (
        <TextInput
          autoCapitalize={question.type === 'email' ? 'none' : 'words'}
          autoComplete={question.type === 'email' ? 'email' : 'name'}
          keyboardType={question.type === 'email' ? 'email-address' : 'default'}
          placeholder={question.placeholder ?? 'Digite sua resposta'}
          placeholderTextColor="#8692A3"
          style={styles.input}
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
        />
      ) : null}

      {question.type === 'textarea' ? (
        <TextInput
          multiline
          numberOfLines={5}
          placeholder={question.placeholder ?? 'Escreva com detalhes'}
          placeholderTextColor="#8692A3"
          style={[styles.input, styles.textarea]}
          textAlignVertical="top"
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
        />
      ) : null}

      {question.type === 'phone' ? (
        <View style={styles.stack}>
          <View style={styles.optionWrap}>
            {phoneCountries.map((country) => {
              const active = getPhoneCountryIso(value) === country.iso;
              return (
                <Pressable
                  key={country.iso}
                  style={[styles.optionPill, active ? styles.optionPillActive : null]}
                  onPress={() => onChange(buildPhoneValue(country.iso, getLocalPhoneDigits(value)))}>
                  <Text style={[styles.optionLabel, active ? styles.optionLabelActive : null]}>{country.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            keyboardType="phone-pad"
            placeholder="Numero com DDD"
            placeholderTextColor="#8692A3"
            style={styles.input}
            value={getLocalPhoneDigits(value)}
            onChangeText={(text) => onChange(buildPhoneValue(getPhoneCountryIso(value), text))}
          />
        </View>
      ) : null}

      {question.type === 'single_select' || question.type === 'money_range' ? (
        <View style={styles.optionWrap}>
          {options.map((option) => {
            const active = value === option.value;
            return (
              <Pressable
                key={option.id}
                style={[styles.optionPill, active ? styles.optionPillActive : null]}
                onPress={() => onChange(option.value)}>
                <Text style={[styles.optionLabel, active ? styles.optionLabelActive : null]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function HomeScreen() {
  const { session, isReady, errorMessage } = useAuthSession();
  const [showPaywall, setShowPaywall] = useState(false);
  const diagnostic = useDiagnosticForm({
    enabled: Boolean(session?.user?.email),
    prefillEmail: session?.user?.email,
    prefillName: session?.user?.user_metadata?.full_name,
  });

  if (!hasSupabaseConfig()) {
    return (
      <ScreenContainer backgroundColor={palette.background} contentStyle={styles.container} padded={false}>
        <View style={styles.primaryCard}>
          <Text style={styles.sectionTitle}>Configurar auth</Text>
          <Text style={styles.errorText}>Defina `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` para liberar a autenticacao.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer backgroundColor={palette.background} contentStyle={styles.container} padded={false}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Jethro App</Text>
          <Text style={styles.heroTitle}>Conta, diagnostico, resultado e paywall no mesmo fluxo.</Text>
          <Text style={styles.heroText}>
            Este e o corte da nova estrategia: o usuario entra pelo app, responde o diagnostico dentro dele e segue para monetizacao.
          </Text>
        </View>

        {!isReady ? (
          <View style={styles.loaderBlock}>
            <ActivityIndicator color={palette.goldSoft} />
            <Text style={styles.bodyText}>Carregando a sessao atual...</Text>
          </View>
        ) : !session?.user?.email ? (
          <AuthCard />
        ) : diagnostic.submitResult ? (
          <View style={styles.primaryCard}>
            <Text style={styles.sectionTitle}>Resultado do diagnostico</Text>
            <Text style={styles.valueHighlight}>{diagnostic.submitResult.diagnostic.title}</Text>
            <Text style={styles.bodyText}>{diagnostic.submitResult.diagnostic.message}</Text>

            <View style={styles.metricRow}>
              <View style={styles.metricTile}>
                <Text style={styles.metricLabel}>Score</Text>
                <Text style={styles.metricValue}>{diagnostic.submitResult.derived.score}</Text>
              </View>
              <View style={styles.metricTile}>
                <Text style={styles.metricLabel}>Faixa</Text>
                <Text style={styles.metricValue}>{diagnostic.submitResult.derived.scoreBand}</Text>
              </View>
            </View>

            <Text style={styles.bodyText}>Gerado em {formatDate(diagnostic.submitResult.diagnostic.generatedAt)}.</Text>

            <Pressable style={styles.primaryButton} onPress={() => setShowPaywall(true)}>
              <Text style={styles.primaryButtonLabel}>Continuar para o paywall</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => { setShowPaywall(false); diagnostic.reset(); }}>
              <Text style={styles.secondaryButtonLabel}>Refazer diagnostico</Text>
            </Pressable>

            {showPaywall ? (
              <View style={styles.paywallCard}>
                <Text style={styles.sectionTitle}>Paywall mock</Text>
                <Text style={styles.valueHighlight}>Plano Pro Jethro</Text>
                <Text style={styles.bodyText}>
                  Mock navegavel para a apresentacao. Aqui entram a oferta, comparativo Light/Pro, garantias e o CTA de assinatura real.
                </Text>
                <View style={styles.stack}>
                  <Text style={styles.bodyText}>• Diagnostico completo associado a conta</Text>
                  <Text style={styles.bodyText}>• Plano semanal guiado</Text>
                  <Text style={styles.bodyText}>• Check-ins e gates</Text>
                  <Text style={styles.bodyText}>• Devocionais e biblioteca de acoes</Text>
                </View>
                <Pressable style={[styles.primaryButton, styles.primaryButtonDisabled]}>
                  <Text style={styles.primaryButtonLabel}>Assinar em breve</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.primaryCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Diagnostico nativo</Text>
              <View style={styles.statusChip}>
                <Text style={styles.statusLabel}>APP</Text>
              </View>
            </View>

            <Text style={styles.bodyText}>
              Sessao ativa para {session.user.email}. O diagnostico agora acontece dentro do app, sem depender do frontend web.
            </Text>

            {diagnostic.isLoading ? (
              <View style={styles.loaderBlock}>
                <ActivityIndicator color={palette.goldSoft} />
                <Text style={styles.bodyText}>Carregando formulario do backend...</Text>
              </View>
            ) : diagnostic.loadError ? (
              <View style={styles.stack}>
                <Text style={styles.errorText}>{diagnostic.loadError}</Text>
                <Text style={styles.bodyText}>
                  Verifique se o backend esta rodando e se o celular consegue acessar a URL configurada da API.
                </Text>
              </View>
            ) : diagnostic.form && diagnostic.currentStep ? (
              <>
                <View style={styles.progressTrack}>
                  {diagnostic.steps.map((step, index) => (
                    <View
                      key={step.id}
                      style={[styles.progressSegment, index <= diagnostic.currentStepIndex ? styles.progressSegmentActive : null]}
                    />
                  ))}
                </View>

                <Text style={styles.valueHighlight}>{diagnostic.currentStep.title}</Text>
                {diagnostic.currentStep.description ? <Text style={styles.bodyText}>{diagnostic.currentStep.description}</Text> : null}

                <View style={styles.stack}>
                  {diagnostic.currentQuestions.map((question) => (
                    <QuestionInput
                      key={question.id}
                      question={question}
                      value={diagnostic.getQuestionValue(diagnostic.values, question)}
                      error={diagnostic.errors[question.slug]}
                      onChange={(value) => diagnostic.setFieldValue(question, value)}
                      getRevenueOptions={diagnostic.getRevenueOptions}
                    />
                  ))}
                </View>

                {diagnostic.errors._global ? <Text style={styles.errorText}>{diagnostic.errors._global}</Text> : null}

                <View style={styles.footerActions}>
                  <Pressable style={styles.secondaryButton} onPress={diagnostic.previousStep} disabled={diagnostic.currentStepIndex === 0}>
                    <Text style={styles.secondaryButtonLabel}>Voltar</Text>
                  </Pressable>

                  {diagnostic.currentStepIndex === diagnostic.steps.length - 1 ? (
                    <Pressable style={styles.primaryButton} onPress={() => void diagnostic.submit()} disabled={diagnostic.isSubmitting}>
                      {diagnostic.isSubmitting ? (
                        <ActivityIndicator color={palette.surface} />
                      ) : (
                        <Text style={styles.primaryButtonLabel}>Enviar diagnostico</Text>
                      )}
                    </Pressable>
                  ) : (
                    <Pressable style={styles.primaryButton} onPress={diagnostic.nextStep}>
                      <Text style={styles.primaryButtonLabel}>Continuar</Text>
                    </Pressable>
                  )}
                </View>
              </>
            ) : (
              <Text style={styles.errorText}>Nao foi possivel carregar o formulario do diagnostico.</Text>
            )}
          </View>
        )}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 40,
    gap: 18,
  },
  heroCard: {
    borderRadius: 30,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 22,
    gap: 14,
  },
  primaryCard: {
    borderRadius: 28,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 20,
    gap: 14,
  },
  paywallCard: {
    marginTop: 8,
    borderRadius: 24,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.3)',
    padding: 18,
    gap: 12,
  },
  eyebrownSpacer: {},
  eyebrow: {
    color: palette.goldSoft,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: palette.cream,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '400',
  },
  heroText: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: palette.goldSoft,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  statusChip: {
    borderRadius: 999,
    backgroundColor: palette.chip,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusLabel: {
    color: palette.cream,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  bodyText: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 24,
  },
  valueHighlight: {
    color: palette.cream,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '500',
  },
  input: {
    borderRadius: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: 'rgba(232, 201, 122, 0.14)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: palette.cream,
    fontSize: 15,
  },
  textarea: {
    minHeight: 120,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: palette.goldSoft,
    minHeight: 54,
    paddingHorizontal: 18,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonLabel: {
    color: palette.surface,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(232, 201, 122, 0.18)',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  secondaryButtonLabel: {
    color: palette.cream,
    fontSize: 15,
    fontWeight: '700',
  },
  socialRow: {
    gap: 12,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(232, 201, 122, 0.14)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(201, 168, 76, 0.18)',
    borderColor: 'rgba(201, 168, 76, 0.35)',
  },
  modeLabel: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  modeLabelActive: {
    color: palette.cream,
  },
  successText: {
    color: palette.success,
    fontSize: 14,
    lineHeight: 22,
  },
  errorText: {
    color: palette.danger,
    fontSize: 14,
    lineHeight: 22,
  },
  loaderBlock: {
    alignItems: 'flex-start',
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricTile: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: palette.surface,
    padding: 16,
    gap: 6,
  },
  metricLabel: {
    color: palette.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  metricValue: {
    color: palette.cream,
    fontSize: 20,
    fontWeight: '700',
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 8,
  },
  progressSegment: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(247, 243, 236, 0.08)',
  },
  progressSegmentActive: {
    backgroundColor: palette.goldSoft,
  },
  stack: {
    gap: 12,
  },
  questionBlock: {
    gap: 10,
  },
  questionLabel: {
    color: palette.cream,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  questionHelper: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(232, 201, 122, 0.14)',
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionPillActive: {
    backgroundColor: 'rgba(201, 168, 76, 0.2)',
    borderColor: 'rgba(201, 168, 76, 0.35)',
  },
  optionLabel: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  optionLabelActive: {
    color: palette.cream,
    fontWeight: '700',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
});
