import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
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
import { diagnosticService } from '@/src/services/diagnostic/diagnostic-service';
import type { FormQuestion, JsonValue, QuestionOption } from '@/src/types/diagnostic-form';

const palette = {
  background: '#0B1F3B',
  surface: '#112440',
  surfaceAlt: '#163050',
  cardBorder: 'rgba(212, 175, 55, 0.20)',
  gold: '#D4AF37',
  goldSoft: '#E8C97A',
  cream: '#F8F9FA',
  text: '#F8F9FA',
  muted: '#8A9BB0',
  accent: '#D4AF37',
  accentSoft: 'rgba(212, 175, 55, 0.15)',
  success: '#4CAF7D',
  danger: '#E05C5C',
  chip: 'rgba(255, 255, 255, 0.08)',
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

function getSelectedOptionValue(value: JsonValue) {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value) && typeof value.faixa === 'string') {
    return value.faixa;
  }

  return '';
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
      setError('Preencha e-mail e senha para continuar.');
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
            ? 'Conta criada com sucesso. Vamos para o diagnóstico.'
            : 'Conta criada. Confirme o e-mail se o projeto estiver com verificação ativa.'
        );
      } else {
        await authService.signInWithPassword(normalizedEmail, password);
        setMessage('Entrada liberada com sucesso.');
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Não foi possível autenticar.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSocialLogin(provider: 'google') {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      await authService.signInWithOAuth(provider);
      setMessage(`${provider === 'google' ? 'Google' : 'Apple'} conectado com sucesso.`);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Não foi possível iniciar o login social.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.primaryCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Entrar no Jethro</Text>
        <View style={styles.statusChip}>
          <Text style={styles.statusLabel}>Acesso</Text>
        </View>
      </View>

      <Text style={styles.bodyText}>
        O novo fluxo começa aqui: conta criada, diagnóstico respondido, resultado liberado e oferta na sequência.
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
  selectedCountryIso,
}: {
  question: FormQuestion;
  value: JsonValue;
  error?: string;
  onChange: (value: JsonValue) => void;
  getRevenueOptions: (question: FormQuestion) => QuestionOption[];
  selectedCountryIso: string;
}) {
  const questionCode = `q${question.order + 1}`;
  const options = question.type === 'money_range' ? getRevenueOptions(question) : question.options;

  return (
    <View style={styles.questionBlock}>
      <Text style={styles.questionLabel}>
        <Text style={styles.questionNumber}>{questionCode} </Text>
        {question.label}
      </Text>
      {question.helperText ? <Text style={styles.questionHelper}>{question.helperText}</Text> : null}

      {question.type === 'text' || question.type === 'email' ? (
        <TextInput
          autoCapitalize={question.type === 'email' ? 'none' : 'words'}
          autoComplete={question.type === 'email' ? 'email' : 'name'}
          style={[styles.input, error ? styles.inputError : null]}
          keyboardType={question.type === 'email' ? 'email-address' : 'default'}
          placeholder={question.placeholder ?? 'Digite sua resposta'}
          placeholderTextColor="#8692A3"
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
          style={[styles.input, styles.textarea, error ? styles.inputError : null]}
          textAlignVertical="top"
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
        />
      ) : null}

      {question.type === 'number' ? (
        <TextInput
          keyboardType="number-pad"
          placeholder={question.placeholder ?? 'Digite um número'}
          placeholderTextColor="#8692A3"
          style={[styles.input, error ? styles.inputError : null]}
          value={typeof value === 'number' ? String(value) : typeof value === 'string' ? value : ''}
          onChangeText={(text) => onChange(text.replace(/[^\d]/g, ''))}
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
            placeholder="Número com DDD"
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
            const active = getSelectedOptionValue(value) === option.value;
            return (
              <Pressable
                key={option.id}
                style={[styles.optionPill, active ? styles.optionPillActive : null]}
                onPress={() =>
                  onChange(
                    question.type === 'money_range'
                      ? {
                          faixa: option.value,
                          moeda:
                            typeof option.metadata?.currency === 'string' ? option.metadata.currency : 'USD',
                          pais: selectedCountryIso,
                        }
                      : option.value
                  )
                }>
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

function AppTopBar({ onSignOut, isSigningOut }: { onSignOut: () => void; isSigningOut: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View>
      <View style={styles.topBar}>
        <View style={styles.iconButton} />
        <Text style={styles.topBarTitle}>JETHRO</Text>
        <Pressable style={styles.iconButton} onPress={() => setMenuOpen((v) => !v)}>
          <Text style={styles.iconButtonLabel}>≡</Text>
        </Pressable>
      </View>
      {menuOpen ? (
        <View style={styles.menuDropdown}>
          <Pressable
            style={styles.menuItem}
            onPress={() => { setMenuOpen(false); onSignOut(); }}
            disabled={isSigningOut}>
            {isSigningOut ? (
              <ActivityIndicator color={palette.cream} size="small" />
            ) : (
              <Text style={styles.menuItemLabel}>Sair deste dispositivo</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ProgressList() {
  return (
    <View style={styles.progressList}>
      <View style={styles.progressRowStatic}>
        <Text style={styles.progressItemLabel}>Diagnóstico concluído</Text>
        <Text style={styles.progressItemCheck}>✓</Text>
      </View>
      <View style={styles.progressRowStatic}>
        <Text style={styles.progressItemLabel}>Áreas de crescimento mapeadas</Text>
        <Text style={styles.progressItemCheck}>✓</Text>
      </View>
      <View style={styles.progressRowActive}>
        <View style={styles.progressRowCopy}>
          <Text style={styles.progressItemLabel}>Preparando seu plano Jethro</Text>
          <Text style={styles.progressItemPercent}>82%</Text>
        </View>
        <View style={styles.inlineProgressTrack}>
          <View style={styles.inlineProgressFill} />
        </View>
      </View>
    </View>
  );
}

function TestimonialCard() {
  return (
    <View style={styles.testimonialCard}>
      <Text style={styles.testimonialRating}>★★★★★</Text>
      <Text style={styles.testimonialTitle}>Clareza com direção prática</Text>
      <Text style={styles.testimonialBody}>
        “O Jethro transformou um diagnóstico confuso em uma rota clara de ação. Eu saí com convicção do
        que precisava fazer primeiro.”
      </Text>
      <Text style={styles.testimonialAuthor}>Cliente piloto</Text>
    </View>
  );
}

function GrowthChartCard() {
  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeaderBadge}>
        <Text style={styles.chartHeaderBadgeLabel}>Seu avanço nas próximas semanas</Text>
      </View>
      <Text style={styles.chartTitle}>
        Veja seu negócio sair do <Text style={styles.chartTitleAccent}>caos para a direção</Text>
      </Text>

      <View style={styles.chartArea}>
        <View style={styles.chartGridLine} />
        <View style={[styles.chartGridLine, styles.chartGridLineMiddle]} />
        <View style={[styles.chartGridLine, styles.chartGridLineTop]} />

        <View style={styles.chartCurveSegmentOne} />
        <View style={styles.chartCurveSegmentTwo} />
        <View style={styles.chartCurveSegmentThree} />

        <View style={[styles.chartPoint, styles.chartPointStart]} />
        <View style={[styles.chartPoint, styles.chartPointEnd]} />

        <View style={styles.chartLabelStart}>
          <Text style={styles.chartLabelText}>Agora</Text>
        </View>
        <View style={styles.chartLabelEnd}>
          <Text style={styles.chartLabelText}>Mais clareza</Text>
        </View>

        <View style={styles.chartWeekRow}>
          <Text style={styles.chartWeekLabel}>Semana 1</Text>
          <Text style={styles.chartWeekLabel}>Semana 2</Text>
          <Text style={styles.chartWeekLabel}>Semana 3</Text>
          <Text style={styles.chartWeekLabel}>Semana 4</Text>
        </View>
      </View>

      <Text style={styles.chartFootnote}>Ilustração conceitual do progresso esperado com o plano.</Text>
    </View>
  );
}

export function HomeScreen() {
  const { session, isReady, errorMessage } = useAuthSession();
  const [resultStep, setResultStep] = useState<'block1' | 'block2' | 'paywall'>('block1');
  const [diagnosticRating, setDiagnosticRating] = useState<number>(0);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const diagnostic = useDiagnosticForm({
    enabled: Boolean(session?.user?.email),
    prefillEmail: session?.user?.email,
    prefillName: session?.user?.user_metadata?.full_name,
  });

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
    return () => task.cancel();
  }, [diagnostic.currentStepIndex]);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await authService.signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  if (!hasSupabaseConfig()) {
    return (
      <ScreenContainer backgroundColor={palette.background} contentStyle={styles.container} padded={false}>
        <View style={styles.primaryCard}>
          <Text style={styles.sectionTitle}>Configurar auth</Text>
          <Text style={styles.errorText}>Defina `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` para liberar a autenticação.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer backgroundColor={palette.background} contentStyle={styles.container} padded={false}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AppTopBar onSignOut={handleSignOut} isSigningOut={isSigningOut} />
        {!isReady ? (
          <View style={styles.loaderBlock}>
            <ActivityIndicator color={palette.goldSoft} />
            <Text style={styles.bodyText}>Carregando a sessão atual...</Text>
          </View>
        ) : !session?.user?.email ? (
          <AuthCard />
        ) : diagnostic.submitResult ? (
          <View style={styles.primaryCard}>
            <Text style={styles.sectionTitle}>Resultado do diagnóstico</Text>
            {diagnostic.isViewingSavedResult ? <Text style={styles.savedResultLabel}>Último diagnóstico salvo</Text> : null}

            {resultStep === 'block1' ? (
              <>
                <Text style={styles.resultSectionLabel}>Realidade Direta</Text>
                <Text style={styles.valueHighlight}>{diagnostic.submitResult.diagnostic.block1Title}</Text>
                <Text style={styles.bodyText}>{diagnostic.submitResult.diagnostic.block1Body}</Text>

                <View style={styles.causeCard}>
                  <Text style={styles.causeLabel}>Causa raiz</Text>
                  <Text style={styles.causeText}>
                    {diagnostic.submitResult.diagnostic.rootCause ??
                      'Seu diagnóstico anterior foi restaurado para você retomar a jornada.'}
                  </Text>
                </View>

                {diagnostic.submitResult.diagnostic.scriptureText || diagnostic.submitResult.diagnostic.scriptureVerse ? (
                  <View style={styles.scriptureCard}>
                    <Text style={styles.scriptureEyebrow}>Palavra Para Este Momento</Text>
                    {diagnostic.submitResult.diagnostic.palavraIntro ? (
                      <Text style={styles.scriptureIntro}>{diagnostic.submitResult.diagnostic.palavraIntro}</Text>
                    ) : null}
                    {diagnostic.submitResult.diagnostic.scriptureText ? (
                      <Text style={styles.scriptureText}>{diagnostic.submitResult.diagnostic.scriptureText}</Text>
                    ) : null}
                    {diagnostic.submitResult.diagnostic.scriptureVerse ? (
                      <Text style={styles.scriptureVerse}>{diagnostic.submitResult.diagnostic.scriptureVerse}</Text>
                    ) : null}
                  </View>
                ) : null}

                <Text style={styles.bodyText}>Gerado em {formatDate(diagnostic.submitResult.diagnostic.generatedAt)}.</Text>

                <Pressable style={styles.primaryButton} onPress={() => setResultStep('block2')}>
                  <Text style={styles.primaryButtonLabel}>Ir para a parte final do diagnóstico</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => {
                    setResultStep('block1');
                    diagnostic.reset();
                  }}>
                  <Text style={styles.secondaryButtonLabel}>Responder novamente</Text>
                </Pressable>
              </>
            ) : resultStep === 'block2' ? (
              <>
                <Text style={styles.resultSectionLabel}>Precipício</Text>
                <Text style={styles.valueHighlight}>{diagnostic.submitResult.diagnostic.block2Title}</Text>
                <Text style={styles.bodyText}>{diagnostic.submitResult.diagnostic.block2Body}</Text>

                <Text style={styles.bodyText}>Gerado em {formatDate(diagnostic.submitResult.diagnostic.generatedAt)}.</Text>

                <Pressable style={styles.primaryButton} onPress={() => setResultStep('paywall')}>
                  <Text style={styles.primaryButtonLabel}>{diagnostic.submitResult.diagnostic.ctaLabel}</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => setResultStep('block1')}>
                  <Text style={styles.secondaryButtonLabel}>Voltar para o diagnóstico</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => {
                    setResultStep('block1');
                    diagnostic.reset();
                  }}>
                  <Text style={styles.secondaryButtonLabel}>Responder novamente</Text>
                </Pressable>

                <View style={styles.ratingCard}>
                  <Text style={styles.ratingQuestion}>Esse diagnóstico fez sentido pra você?</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Pressable
                        key={star}
                        style={styles.starButton}
                        onPress={() => {
                          setDiagnosticRating(star);
                          const submissionId = diagnostic.submitResult?.submissionId;
                          const email = session?.user?.email;
                          if (submissionId && email) {
                            void diagnosticService.submitRating({ submissionId, email, stars: star });
                          }
                        }}>
                        <Text style={[styles.starIcon, star <= diagnosticRating ? styles.starFilled : styles.starEmpty]}>
                          ★
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {diagnosticRating > 0 ? (
                    <Text style={styles.ratingThanks}>
                      {diagnosticRating >= 4 ? 'Fico feliz que tenha feito sentido.' : 'Obrigado pelo feedback.'}
                    </Text>
                  ) : null}
                </View>
              </>
            ) : (
              <View style={styles.paywallCard}>
                <ProgressList />
                <TestimonialCard />
                <GrowthChartCard />
                <Pressable
                  style={[styles.primaryButton, styles.primaryButtonDisabled]}
                  onPress={() =>
                    Alert.alert(
                      'Assinatura em breve',
                      'O billing real ainda não foi conectado. Para a apresentação, este botão representa a entrada no checkout.'
                    )
                  }>
                  <Text style={styles.primaryButtonLabel}>Assinar em breve</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => setResultStep('block2')}>
                  <Text style={styles.secondaryButtonLabel}>Voltar para o diagnóstico</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.formStage}>
            {diagnostic.isLoading ? (
              <View style={styles.loaderBlock}>
                <ActivityIndicator color={palette.goldSoft} />
                <Text style={styles.bodyText}>Carregando formulário do diagnóstico...</Text>
              </View>
            ) : diagnostic.loadError ? (
              <View style={styles.stack}>
                <Text style={styles.errorText}>{diagnostic.loadError}</Text>
                <Text style={styles.bodyText}>
                  Verifique se a API está disponível e se o celular consegue acessar a URL configurada.
                </Text>
              </View>
            ) : diagnostic.form && diagnostic.currentStep ? (
              <>
                <View style={styles.progressHeader}>
                  <View style={styles.progressTrack}>
                    {diagnostic.steps.map((step, index) => (
                      <View
                        key={step.id}
                        style={[styles.progressSegment, index <= diagnostic.currentStepIndex ? styles.progressSegmentActive : null]}
                      />
                    ))}
                  </View>
                  <Text style={styles.progressCounter}>
                    {diagnostic.currentStepIndex + 1}/{diagnostic.steps.length}
                  </Text>
                </View>

                <View style={styles.formQuestionStack}>
                  {diagnostic.currentQuestions.map((question) => (
                    <QuestionInput
                      key={question.id}
                      question={question}
                      value={diagnostic.getQuestionValue(diagnostic.values, question)}
                      error={diagnostic.errors[question.slug]}
                      onChange={(value) => diagnostic.setFieldValue(question, value)}
                      getRevenueOptions={diagnostic.getRevenueOptions}
                      selectedCountryIso={diagnostic.selectedCountryIso}
                    />
                  ))}
                </View>

                {diagnostic.errors._global ? <Text style={styles.formErrorText}>{diagnostic.errors._global}</Text> : null}

                <View style={styles.footerActions}>
                  {diagnostic.currentStepIndex > 0 ? (
                    <Pressable style={styles.secondaryButton} onPress={diagnostic.previousStep}>
                      <Text style={styles.secondaryButtonLabel}>Voltar</Text>
                    </Pressable>
                  ) : null}

                  {diagnostic.currentStepIndex === diagnostic.steps.length - 1 ? (
                    <Pressable style={styles.primaryButton} onPress={() => void diagnostic.submit()} disabled={diagnostic.isSubmitting}>
                      {diagnostic.isSubmitting ? (
                        <ActivityIndicator color={palette.surface} />
                      ) : (
                          <Text style={styles.primaryButtonLabel}>Enviar diagnóstico</Text>
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
              <Text style={styles.errorText}>Não foi possível carregar o formulário do diagnóstico.</Text>
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
    paddingTop: 10,
    paddingBottom: 40,
    gap: 18,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonLabel: {
    color: palette.text,
    fontSize: 24,
    lineHeight: 24,
  },
  topBarTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  formStage: {
    gap: 18,
    paddingBottom: 22,
  },
  menuDropdown: {
    alignSelf: 'flex-end',
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    overflow: 'hidden',
    minWidth: 200,
  },
  menuItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'flex-start',
  },
  menuItemLabel: {
    color: palette.cream,
    fontSize: 14,
    fontWeight: '600',
  },
  heroCard: {
    borderRadius: 30,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: 22,
    gap: 14,
  },
  causeCard: {
    borderRadius: 22,
    backgroundColor: 'rgba(247, 243, 236, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(247, 243, 236, 0.08)',
    padding: 18,
    gap: 8,
  },
  causeLabel: {
    color: palette.goldSoft,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  causeText: {
    color: palette.cream,
    fontSize: 16,
    lineHeight: 25,
  },
  primaryCard: {
    gap: 14,
    paddingBottom: 22,
  },
  paywallCard: {
    gap: 18,
    paddingBottom: 22,
  },
  scriptureCard: {
    borderRadius: 22,
    backgroundColor: 'rgba(201, 168, 76, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.25)',
    padding: 18,
    gap: 8,
  },
  savedResultLabel: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(141, 186, 136, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(141, 186, 136, 0.28)',
    color: palette.success,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingHorizontal: 12,
    paddingVertical: 7,
    textTransform: 'uppercase',
  },
  scriptureEyebrow: {
    color: palette.gold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  scriptureIntro: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  scriptureText: {
    color: palette.text,
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '600',
  },
  scriptureVerse: {
    color: palette.goldSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
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
  resultSectionLabel: {
    color: palette.goldSoft,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
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
    color: palette.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '600',
  },
  input: {
    borderRadius: 16,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: 'rgba(232, 201, 122, 0.28)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: palette.text,
    fontSize: 15,
  },
  textarea: {
    minHeight: 120,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: palette.accent,
    minHeight: 54,
    paddingHorizontal: 18,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    minHeight: 54,
    paddingHorizontal: 18,
    backgroundColor: palette.surfaceAlt,
  },
  secondaryButtonLabel: {
    color: palette.text,
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
  inputError: {
    borderColor: palette.danger,
  },
  loaderBlock: {
    alignItems: 'flex-start',
    gap: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressCounter: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.9,
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
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(247, 243, 236, 0.16)',
  },
  progressSegmentActive: {
    backgroundColor: palette.goldSoft,
  },
  formTitle: {
    color: palette.text,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  formHelper: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  formQuestionStack: {
    gap: 16,
    marginTop: 8,
  },
  formErrorText: {
    color: palette.danger,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  stack: {
    gap: 12,
  },
  questionBlock: {
    gap: 12,
  },
  questionLabel: {
    color: palette.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  questionNumber: {
    color: palette.gold,
    fontWeight: '700',
  },
  questionHelper: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  optionWrap: {
    gap: 12,
  },
  optionPill: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.surfaceAlt,
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  optionPillActive: {
    backgroundColor: palette.chip,
    borderColor: palette.accent,
  },
  optionLabel: {
    color: palette.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  optionLabelActive: {
    color: palette.text,
    fontWeight: '800',
  },
  footerActions: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 10,
  },
  progressList: {
    gap: 12,
  },
  progressRowStatic: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(247, 243, 236, 0.1)',
    paddingBottom: 10,
  },
  progressRowActive: {
    gap: 8,
    paddingBottom: 4,
  },
  progressRowCopy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  progressItemLabel: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '500',
  },
  progressItemCheck: {
    color: palette.success,
    fontSize: 18,
    fontWeight: '800',
  },
  progressItemPercent: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600',
  },
  inlineProgressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(247, 243, 236, 0.08)',
    overflow: 'hidden',
  },
  inlineProgressFill: {
    width: '82%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.accent,
  },
  testimonialCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.surfaceAlt,
    padding: 16,
    gap: 8,
  },
  testimonialRating: {
    color: palette.success,
    fontSize: 16,
    letterSpacing: 1.2,
  },
  testimonialTitle: {
    color: palette.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  },
  testimonialBody: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  testimonialAuthor: {
    color: palette.text,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
  },
  chartCard: {
    gap: 14,
  },
  chartHeaderBadge: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(232, 201, 122, 0.22)',
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  chartHeaderBadgeLabel: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '500',
  },
  chartTitle: {
    color: palette.text,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    textAlign: 'center',
  },
  chartTitleAccent: {
    color: palette.gold,
  },
  chartArea: {
    height: 220,
    borderRadius: 18,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 28,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartGridLine: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 48,
    height: 1,
    backgroundColor: 'rgba(247, 243, 236, 0.08)',
  },
  chartGridLineMiddle: {
    bottom: 95,
  },
  chartGridLineTop: {
    bottom: 142,
  },
  chartCurveSegmentOne: {
    position: 'absolute',
    left: 28,
    bottom: 55,
    width: 88,
    height: 52,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    borderTopWidth: 4,
    borderColor: '#F08A00',
    transform: [{ rotate: '-10deg' }],
  },
  chartCurveSegmentTwo: {
    position: 'absolute',
    left: 102,
    bottom: 86,
    width: 92,
    height: 44,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopWidth: 4,
    borderColor: '#E6BE54',
    transform: [{ rotate: '5deg' }],
  },
  chartCurveSegmentThree: {
    position: 'absolute',
    left: 176,
    bottom: 104,
    width: 104,
    height: 72,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    borderTopWidth: 4,
    borderColor: '#36C56F',
    transform: [{ rotate: '6deg' }],
  },
  chartPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 3,
  },
  chartPointStart: {
    left: 20,
    bottom: 48,
    borderColor: '#F08A00',
  },
  chartPointEnd: {
    right: 18,
    bottom: 160,
    borderColor: '#36C56F',
  },
  chartLabelStart: {
    position: 'absolute',
    left: 10,
    bottom: 72,
    borderRadius: 12,
    backgroundColor: palette.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chartLabelEnd: {
    position: 'absolute',
    right: 8,
    bottom: 182,
    borderRadius: 12,
    backgroundColor: palette.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chartLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  chartWeekRow: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartWeekLabel: {
    color: palette.muted,
    fontSize: 11,
  },
  chartFootnote: {
    color: palette.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  ratingCard: {
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(232, 201, 122, 0.15)',
    alignItems: 'center',
    gap: 12,
  },
  ratingQuestion: {
    color: palette.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  starButton: {
    padding: 4,
  },
  starIcon: {
    fontSize: 32,
  },
  starFilled: {
    color: palette.goldSoft,
  },
  starEmpty: {
    color: 'rgba(232, 201, 122, 0.25)',
  },
  ratingThanks: {
    color: palette.muted,
    fontSize: 13,
    textAlign: 'center',
  },
});
