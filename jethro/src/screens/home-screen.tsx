import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';
import { palette } from '@/src/theme/colors';
import type { FormQuestion, JsonValue, QuestionOption } from '@/src/types/diagnostic-form';

const phoneCountries = [
  { label: 'Brasil',        iso: 'BR', code: '+55'  },
  { label: 'Portugal',      iso: 'PT', code: '+351' },
  { label: 'Estados Unidos',iso: 'US', code: '+1'   },
] as const;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function buildPhoneValue(countryIso: string, localDigits: string) {
  const country = phoneCountries.find((item) => item.iso === countryIso) ?? phoneCountries[0];
  const digits = localDigits.replace(/\D/g, '');
  return { numero: `${country.code}${digits}`, pais_codigo: country.code, pais_iso: country.iso };
}

function getLocalPhoneDigits(value: JsonValue) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return '';
  const fullNumber  = typeof value.numero      === 'string' ? value.numero      : '';
  const countryCode = typeof value.pais_codigo === 'string' ? value.pais_codigo : '';
  return fullNumber.startsWith(countryCode) ? fullNumber.slice(countryCode.length) : fullNumber.replace(/\D/g, '');
}

function getPhoneCountryIso(value: JsonValue) {
  if (typeof value !== 'object' || value === null || Array.isArray(value) || typeof value.pais_iso !== 'string') return 'BR';
  return value.pais_iso.toUpperCase();
}

function getSelectedOptionValue(value: JsonValue) {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && typeof value.faixa === 'string') return value.faixa;
  return '';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AuthCard() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [message,  setMessage]  = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [isLoading,setIsLoading]= useState(false);

  async function handlePasswordAuth() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) { setError('Preencha e-mail e senha para continuar.'); return; }
    setIsLoading(true); setError(null); setMessage(null);
    try {
      if (mode === 'signup') {
        const result = await authService.signUpWithPassword(normalizedEmail, password);
        setMessage(result.user?.confirmed_at
          ? 'Conta criada com sucesso. Vamos para o diagnóstico.'
          : 'Conta criada. Confirme o e-mail se o projeto estiver com verificação ativa.');
      } else {
        await authService.signInWithPassword(normalizedEmail, password);
        setMessage('Entrada liberada com sucesso.');
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Não foi possível autenticar.');
    } finally { setIsLoading(false); }
  }

  async function handleSocialLogin(provider: 'google') {
    setIsLoading(true); setError(null); setMessage(null);
    try {
      await authService.signInWithOAuth(provider);
      setMessage('Google conectado com sucesso.');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Não foi possível iniciar o login social.');
    } finally { setIsLoading(false); }
  }

  return (
    <View style={s.primaryCard}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Entrar no Jethro</Text>
        <View style={s.statusChip}><Text style={s.statusLabel}>Acesso</Text></View>
      </View>
      <Text style={s.bodyText}>
        O novo fluxo começa aqui: conta criada, diagnóstico respondido, resultado liberado e oferta na sequência.
      </Text>
      <View style={s.modeRow}>
        <Pressable style={[s.modeButton, mode === 'signup' && s.modeButtonActive]} onPress={() => setMode('signup')}>
          <Text style={[s.modeLabel, mode === 'signup' && s.modeLabelActive]}>Criar conta</Text>
        </Pressable>
        <Pressable style={[s.modeButton, mode === 'signin' && s.modeButtonActive]} onPress={() => setMode('signin')}>
          <Text style={[s.modeLabel, mode === 'signin' && s.modeLabelActive]}>Entrar</Text>
        </Pressable>
      </View>
      <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="voce@empresa.com" placeholderTextColor={colors.inkMute} style={s.input} value={email} onChangeText={setEmail} />
      <TextInput autoCapitalize="none" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} secureTextEntry placeholder="Sua senha" placeholderTextColor={colors.inkMute} style={s.input} value={password} onChangeText={setPassword} />
      <Pressable style={s.primaryButton} onPress={() => void handlePasswordAuth()} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color={colors.background} /> : <Text style={s.primaryButtonLabel}>{mode === 'signup' ? 'Criar conta e continuar' : 'Entrar e continuar'}</Text>}
      </Pressable>
      <View style={s.socialRow}>
        <Pressable style={s.secondaryButton} onPress={() => void handleSocialLogin('google')} disabled={isLoading}>
          <Text style={s.secondaryButtonLabel}>Entrar com Google</Text>
        </Pressable>
      </View>
      {message ? <Text style={s.successText}>{message}</Text> : null}
      {error   ? <Text style={s.errorText}>{error}</Text>     : null}
    </View>
  );
}

function QuestionInput({
  question, value, error, onChange, getRevenueOptions, selectedCountryIso,
}: {
  question: FormQuestion; value: JsonValue; error?: string;
  onChange: (value: JsonValue) => void;
  getRevenueOptions: (question: FormQuestion) => QuestionOption[];
  selectedCountryIso: string;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const options = question.type === 'money_range' ? getRevenueOptions(question) : question.options;

  return (
    <View style={s.questionBlock}>
      <Text style={s.questionLabel}>{question.label}</Text>
      {question.helperText ? <Text style={s.questionHelper}>{question.helperText}</Text> : null}

      {(question.type === 'text' || question.type === 'email') ? (
        <TextInput
          autoCapitalize={question.type === 'email' ? 'none' : 'words'}
          autoComplete={question.type === 'email' ? 'email' : 'name'}
          style={[s.input, error ? s.inputError : null]}
          keyboardType={question.type === 'email' ? 'email-address' : 'default'}
          placeholder={question.placeholder ?? 'Digite sua resposta'}
          placeholderTextColor={colors.inkMute}
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
        />
      ) : null}

      {question.type === 'textarea' ? (
        <TextInput
          multiline numberOfLines={5}
          placeholder={question.placeholder ?? 'Escreva com detalhes'}
          placeholderTextColor={colors.inkMute}
          style={[s.input, s.textarea, error ? s.inputError : null]}
          textAlignVertical="top"
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
        />
      ) : null}

      {question.type === 'number' ? (
        <TextInput
          keyboardType="number-pad"
          placeholder={question.placeholder ?? 'Digite um número'}
          placeholderTextColor={colors.inkMute}
          style={[s.input, error ? s.inputError : null]}
          value={typeof value === 'number' ? String(value) : typeof value === 'string' ? value : ''}
          onChangeText={(text) => onChange(text.replace(/[^\d]/g, ''))}
        />
      ) : null}

      {question.type === 'phone' ? (
        <View style={s.stack}>
          <View style={s.optionWrap}>
            {phoneCountries.map((country) => {
              const active = getPhoneCountryIso(value) === country.iso;
              return (
                <Pressable key={country.iso} style={[s.optionPill, active && s.optionPillActive]} onPress={() => onChange(buildPhoneValue(country.iso, getLocalPhoneDigits(value)))}>
                  <Text style={[s.optionLabel, active && s.optionLabelActive]}>{country.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput keyboardType="phone-pad" placeholder="Número com DDD" placeholderTextColor={colors.inkMute} style={s.input} value={getLocalPhoneDigits(value)} onChangeText={(text) => onChange(buildPhoneValue(getPhoneCountryIso(value), text))} />
        </View>
      ) : null}

      {(question.type === 'single_select' || question.type === 'money_range') ? (
        <View style={s.optionWrap}>
          {options.map((option) => {
            const active = getSelectedOptionValue(value) === option.value;
            return (
              <Pressable key={option.id} style={[s.optionPill, active && s.optionPillActive]}
                onPress={() => onChange(question.type === 'money_range' ? { faixa: option.value, moeda: typeof option.metadata?.currency === 'string' ? option.metadata.currency : 'USD', pais: selectedCountryIso } : option.value)}>
                <Text style={[s.optionLabel, active && s.optionLabelActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
}

function AppTopBar({ onSignOut, isSigningOut }: { onSignOut: () => void; isSigningOut: boolean }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View>
      <View style={s.topBar}>
        <View style={s.iconButton} />
        <Text style={s.topBarTitle}>JETHRO</Text>
        <Pressable style={s.iconButton} onPress={() => setMenuOpen((v) => !v)}>
          <Text style={s.iconButtonLabel}>≡</Text>
        </Pressable>
      </View>
      {menuOpen ? (
        <View style={s.menuDropdown}>
          <Pressable style={s.menuItem} onPress={() => { setMenuOpen(false); onSignOut(); }} disabled={isSigningOut}>
            {isSigningOut ? <ActivityIndicator color={colors.ink} size="small" /> : <Text style={s.menuItemLabel}>Sair deste dispositivo</Text>}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ProgressList() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.progressList}>
      <View style={s.progressRowStatic}>
        <Text style={s.progressItemLabel}>Diagnóstico concluído</Text>
        <Text style={s.progressItemCheck}>✓</Text>
      </View>
      <View style={s.progressRowStatic}>
        <Text style={s.progressItemLabel}>Áreas de crescimento mapeadas</Text>
        <Text style={s.progressItemCheck}>✓</Text>
      </View>
      <View style={s.progressRowActive}>
        <View style={s.progressRowCopy}>
          <Text style={s.progressItemLabel}>Preparando seu plano Jethro</Text>
          <Text style={s.progressItemPercent}>82%</Text>
        </View>
        <View style={s.inlineProgressTrack}>
          <View style={s.inlineProgressFill} />
        </View>
      </View>
    </View>
  );
}

function TestimonialCard() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.testimonialCard}>
      <Text style={s.testimonialRating}>★★★★★</Text>
      <Text style={s.testimonialTitle}>Clareza com direção prática</Text>
      <Text style={s.testimonialBody}>
        "O Jethro transformou um diagnóstico confuso em uma rota clara de ação. Eu saí com convicção do que precisava fazer primeiro."
      </Text>
      <Text style={s.testimonialAuthor}>Cliente piloto</Text>
    </View>
  );
}

function GrowthChartCard() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={s.chartCard}>
      <View style={s.chartHeaderBadge}>
        <Text style={s.chartHeaderBadgeLabel}>Seu avanço nas próximas semanas</Text>
      </View>
      <Text style={s.chartTitle}>
        Veja seu negócio sair do <Text style={s.chartTitleAccent}>caos para a direção</Text>
      </Text>
      <View style={s.chartArea}>
        <View style={s.chartGridLine} />
        <View style={[s.chartGridLine, s.chartGridLineMiddle]} />
        <View style={[s.chartGridLine, s.chartGridLineTop]} />
        <View style={s.chartCurveSegmentOne} />
        <View style={s.chartCurveSegmentTwo} />
        <View style={s.chartCurveSegmentThree} />
        <View style={[s.chartPoint, s.chartPointStart]} />
        <View style={[s.chartPoint, s.chartPointEnd]} />
        <View style={s.chartLabelStart}><Text style={s.chartLabelText}>Agora</Text></View>
        <View style={s.chartLabelEnd}><Text style={s.chartLabelText}>Mais clareza</Text></View>
        <View style={s.chartWeekRow}>
          <Text style={s.chartWeekLabel}>Semana 1</Text>
          <Text style={s.chartWeekLabel}>Semana 2</Text>
          <Text style={s.chartWeekLabel}>Semana 3</Text>
          <Text style={s.chartWeekLabel}>Semana 4</Text>
        </View>
      </View>
      <Text style={s.chartFootnote}>Ilustração conceitual do progresso esperado com o plano.</Text>
    </View>
  );
}

// ─── Phase names (4 diagnostic phases matching PO spec) ──────────────────────

const DIAG_PHASE_NAMES = ['Quem você é', 'Onde você está', 'Como funciona', 'Para onde vai'];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function HomeScreen() {
  const { session, isReady, errorMessage } = useAuthSession();
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const homeRouter = useRouter();
  const [resultStep,       setResultStep]       = useState<'block1' | 'block2' | 'paywall'>('block1');
  const [diagnosticRating, setDiagnosticRating] = useState<number>(0);
  const [isSigningOut,     setIsSigningOut]      = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const diagnostic = useDiagnosticForm({
    enabled:     Boolean(session?.user?.email),
    prefillEmail: session?.user?.email,
    prefillName:  session?.user?.user_metadata?.full_name,
  });

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
    return () => task.cancel();
  }, [diagnostic.currentStepIndex]);

  async function handleSignOut() {
    setIsSigningOut(true);
    try { await authService.signOut(); } finally { setIsSigningOut(false); }
  }

  if (!hasSupabaseConfig()) {
    return (
      <ScreenContainer backgroundColor={colors.background} contentStyle={s.container} padded={false}>
        <View style={s.primaryCard}>
          <Text style={s.sectionTitle}>Configurar auth</Text>
          <Text style={s.errorText}>Defina `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` para liberar a autenticação.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer backgroundColor={colors.background} contentStyle={s.container} padded={false}>
      <ScrollView ref={scrollRef} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <AppTopBar onSignOut={handleSignOut} isSigningOut={isSigningOut} />

        {!isReady ? (
          <View style={s.loaderBlock}>
            <ActivityIndicator color={colors.accentSoft} />
            <Text style={s.bodyText}>Carregando a sessão atual...</Text>
          </View>
        ) : !session?.user?.email ? (
          <AuthCard />
        ) : diagnostic.submitResult ? (
          <View style={s.primaryCard}>
            <Text style={s.sectionTitle}>Resultado do diagnóstico</Text>
            {diagnostic.isViewingSavedResult ? <Text style={s.savedResultLabel}>Último diagnóstico salvo</Text> : null}

            {resultStep === 'block1' ? (
              <>
                <Text style={s.resultSectionLabel}>Realidade Direta</Text>
                <Text style={s.valueHighlight}>{diagnostic.submitResult.diagnostic.block1Title}</Text>
                <Text style={s.bodyText}>{diagnostic.submitResult.diagnostic.block1Body}</Text>

                <View style={s.causeCard}>
                  <Text style={s.causeLabel}>Causa raiz</Text>
                  <Text style={s.causeText}>{diagnostic.submitResult.diagnostic.rootCause ?? 'Seu diagnóstico anterior foi restaurado para você retomar a jornada.'}</Text>
                </View>

                {(diagnostic.submitResult.diagnostic.scriptureText || diagnostic.submitResult.diagnostic.scriptureVerse) ? (
                  <View style={s.scriptureCard}>
                    <Text style={s.scriptureEyebrow}>Palavra Para Este Momento</Text>
                    {diagnostic.submitResult.diagnostic.palavraIntro ? <Text style={s.scriptureIntro}>{diagnostic.submitResult.diagnostic.palavraIntro}</Text> : null}
                    {diagnostic.submitResult.diagnostic.scriptureText  ? <Text style={s.scriptureText}>{diagnostic.submitResult.diagnostic.scriptureText}</Text>   : null}
                    {diagnostic.submitResult.diagnostic.scriptureVerse ? <Text style={s.scriptureVerse}>{diagnostic.submitResult.diagnostic.scriptureVerse}</Text>  : null}
                  </View>
                ) : null}

                <Text style={s.bodyText}>Gerado em {formatDate(diagnostic.submitResult.diagnostic.generatedAt)}.</Text>
                <Pressable style={s.primaryButton} onPress={() => setResultStep('block2')}>
                  <Text style={s.primaryButtonLabel}>Ir para a parte final do diagnóstico</Text>
                </Pressable>
                <Pressable style={s.secondaryButton} onPress={() => { setResultStep('block1'); diagnostic.reset(); }}>
                  <Text style={s.secondaryButtonLabel}>Responder novamente</Text>
                </Pressable>
              </>
            ) : resultStep === 'block2' ? (
              <>
                <Text style={s.resultSectionLabel}>Precipício</Text>
                <Text style={s.valueHighlight}>{diagnostic.submitResult.diagnostic.block2Title}</Text>
                <Text style={s.bodyText}>{diagnostic.submitResult.diagnostic.block2Body}</Text>
                <Text style={s.bodyText}>Gerado em {formatDate(diagnostic.submitResult.diagnostic.generatedAt)}.</Text>
                <Pressable style={s.primaryButton} onPress={() => homeRouter.replace('/paywall' as never)}>
                  <Text style={s.primaryButtonLabel}>{diagnostic.submitResult.diagnostic.ctaLabel}</Text>
                </Pressable>
                <Pressable style={s.secondaryButton} onPress={() => setResultStep('block1')}>
                  <Text style={s.secondaryButtonLabel}>Voltar para o diagnóstico</Text>
                </Pressable>
                <Pressable style={s.secondaryButton} onPress={() => { setResultStep('block1'); diagnostic.reset(); }}>
                  <Text style={s.secondaryButtonLabel}>Responder novamente</Text>
                </Pressable>

                <View style={s.ratingCard}>
                  <Text style={s.ratingQuestion}>Esse diagnóstico fez sentido pra você?</Text>
                  <View style={s.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Pressable key={star} style={s.starButton} onPress={() => {
                        setDiagnosticRating(star);
                        const submissionId = diagnostic.submitResult?.submissionId;
                        const email = session?.user?.email;
                        if (submissionId && email) void diagnosticService.submitRating({ submissionId, email, stars: star });
                      }}>
                        <Text style={[s.starIcon, star <= diagnosticRating ? s.starFilled : s.starEmpty]}>★</Text>
                      </Pressable>
                    ))}
                  </View>
                  {diagnosticRating > 0 ? (
                    <Text style={s.ratingThanks}>{diagnosticRating >= 4 ? 'Fico feliz que tenha feito sentido.' : 'Obrigado pelo feedback.'}</Text>
                  ) : null}
                </View>
              </>
            ) : (
              <View style={s.paywallCard}>
                <ProgressList />
                <TestimonialCard />
                <GrowthChartCard />
                <Pressable style={[s.primaryButton, s.primaryButtonDisabled]} onPress={() => Alert.alert('Assinatura em breve', 'O billing real ainda não foi conectado.')}>
                  <Text style={s.primaryButtonLabel}>Assinar em breve</Text>
                </Pressable>
                <Pressable style={s.secondaryButton} onPress={() => setResultStep('block2')}>
                  <Text style={s.secondaryButtonLabel}>Voltar para o diagnóstico</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : (
          <View style={s.formStage}>
            {diagnostic.isLoading ? (
              <View style={s.loaderBlock}>
                <ActivityIndicator color={colors.accentSoft} />
                <Text style={s.bodyText}>Carregando formulário do diagnóstico...</Text>
              </View>
            ) : diagnostic.loadError ? (
              <View style={s.stack}>
                <Text style={s.errorText}>{diagnostic.loadError}</Text>
                <Text style={s.bodyText}>Verifique se a API está disponível e se o celular consegue acessar a URL configurada.</Text>
              </View>
            ) : diagnostic.form && diagnostic.currentStep ? (
              <>
                <View style={s.progressHeader}>
                  <View style={s.progressTrack}>
                    {diagnostic.steps.map((step, index) => (
                      <View key={step.id} style={[s.progressSegment, index <= diagnostic.currentStepIndex && s.progressSegmentActive]} />
                    ))}
                  </View>
                  <Text style={s.progressLabel}>
                    {diagnostic.currentStepIndex + 1}/{diagnostic.steps.length} · {DIAG_PHASE_NAMES[Math.min(diagnostic.currentStepIndex, DIAG_PHASE_NAMES.length - 1)]}
                  </Text>
                </View>

                <View style={s.formQuestionStack}>
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

                {diagnostic.errors._global ? <Text style={s.formErrorText}>{diagnostic.errors._global}</Text> : null}

                <View style={s.footerActions}>
                  {diagnostic.currentStepIndex > 0 ? (
                    <Pressable style={s.secondaryButton} onPress={diagnostic.previousStep}>
                      <Text style={s.secondaryButtonLabel}>Voltar</Text>
                    </Pressable>
                  ) : null}
                  {diagnostic.currentStepIndex === diagnostic.steps.length - 1 ? (
                    <Pressable style={s.primaryButton} onPress={() => void diagnostic.submit()} disabled={diagnostic.isSubmitting}>
                      {diagnostic.isSubmitting ? <ActivityIndicator color={colors.background} /> : <Text style={s.primaryButtonLabel}>Quero meu diagnóstico</Text>}
                    </Pressable>
                  ) : (
                    <Pressable style={s.primaryButton} onPress={diagnostic.nextStep}>
                      <Text style={s.primaryButtonLabel}>Continuar</Text>
                    </Pressable>
                  )}
                </View>
              </>
            ) : (
              <Text style={s.errorText}>Não foi possível carregar o formulário do diagnóstico.</Text>
            )}
          </View>
        )}

        {errorMessage ? <Text style={s.errorText}>{errorMessage}</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container:    { flex: 1 },
    scrollContent:{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 40, gap: 18 },

    topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
    iconButton:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    iconButtonLabel:{ color: c.ink, fontSize: 24, lineHeight: 24 },
    topBarTitle:    { color: c.ink, fontSize: 18, fontWeight: '800', letterSpacing: 1.4 },

    formStage: { gap: 18, paddingBottom: 22 },

    menuDropdown: { alignSelf: 'flex-end', marginTop: 4, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.accentMuted, overflow: 'hidden', minWidth: 200 },
    menuItem:     { paddingHorizontal: 18, paddingVertical: 14, alignItems: 'flex-start' },
    menuItemLabel:{ color: c.ink, fontSize: 14, fontWeight: '600' },

    causeCard: { borderRadius: 22, backgroundColor: c.surface, borderWidth: 1, borderColor: c.hairline, padding: 18, gap: 8 },
    causeLabel:{ color: c.accentSoft, fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
    causeText: { color: c.ink, fontSize: 16, lineHeight: 25 },

    primaryCard: { gap: 14, paddingBottom: 22 },
    paywallCard: { gap: 18, paddingBottom: 22 },

    scriptureCard:   { borderRadius: 22, backgroundColor: c.accentMuted, borderWidth: 1, borderColor: c.accentMuted, padding: 18, gap: 8 },
    savedResultLabel:{ alignSelf: 'flex-start', borderRadius: 999, backgroundColor: 'rgba(76,175,125,0.16)', borderWidth: 1, borderColor: 'rgba(76,175,125,0.28)', color: c.success, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, paddingHorizontal: 12, paddingVertical: 7, textTransform: 'uppercase' },
    scriptureEyebrow:{ color: c.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
    scriptureIntro:  { color: c.inkMute, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
    scriptureText:   { color: c.ink, fontSize: 17, lineHeight: 26, fontWeight: '600' },
    scriptureVerse:  { color: c.accentSoft, fontSize: 14, lineHeight: 22, fontWeight: '700' },

    sectionHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    sectionTitle:      { color: c.accentSoft, fontSize: 14, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
    resultSectionLabel:{ color: c.accentSoft, fontSize: 12, fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase' },
    statusChip:        { borderRadius: 999, backgroundColor: c.hairline, paddingHorizontal: 12, paddingVertical: 8 },
    statusLabel:       { color: c.ink, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },

    bodyText:      { color: c.inkMute, fontSize: 15, lineHeight: 24 },
    valueHighlight:{ color: c.ink, fontSize: 26, lineHeight: 32, fontWeight: '600' },

    input: {
      borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.accentMuted,
      paddingHorizontal: 16, paddingVertical: 14, color: c.ink, fontSize: 15,
    },
    textarea:   { minHeight: 120 },
    inputError: { borderColor: c.liveRed },

    primaryButton:         { alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: c.accent, minHeight: 54, paddingHorizontal: 18 },
    primaryButtonDisabled: { opacity: 0.7 },
    primaryButtonLabel:    { color: palette.navy800, fontSize: 15, fontWeight: '800' },

    secondaryButton:      { alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: c.accentMuted, minHeight: 54, paddingHorizontal: 18, backgroundColor: c.surface },
    secondaryButtonLabel: { color: c.ink, fontSize: 15, fontWeight: '700' },

    socialRow:      { gap: 12 },
    modeRow:        { flexDirection: 'row', gap: 12 },
    modeButton:     { flex: 1, borderRadius: 999, borderWidth: 1, borderColor: c.hairline, paddingVertical: 10, alignItems: 'center' },
    modeButtonActive:{ backgroundColor: c.accentMuted, borderColor: c.accent },
    modeLabel:       { color: c.inkMute, fontSize: 14, fontWeight: '700' },
    modeLabelActive: { color: c.ink },

    successText:  { color: c.success,  fontSize: 14, lineHeight: 22 },
    errorText:    { color: c.liveRed,  fontSize: 14, lineHeight: 22 },
    formErrorText:{ color: c.liveRed,  fontSize: 14, lineHeight: 22, textAlign: 'center' },

    loaderBlock: { alignItems: 'flex-start', gap: 12 },

    progressHeader:  { gap: 6 },
    progressTrack:   { flexDirection: 'row', gap: 6 },
    progressSegment:      { flex: 1, height: 3, borderRadius: 2, backgroundColor: c.hairline },
    progressSegmentActive:{ backgroundColor: c.accent },
    progressLabel:        { fontFamily: 'Inter_500Medium', fontSize: 11, color: c.accent, letterSpacing: 0.5 },

    formQuestionStack: { gap: 16, marginTop: 8 },

    stack:         { gap: 12 },
    questionBlock: { gap: 12 },
    questionLabel: { fontFamily: 'CormorantGaramond_500Medium', color: c.ink, fontSize: 19, lineHeight: 26, fontWeight: '500' },
    questionHelper:{ color: c.inkMute, fontSize: 13, lineHeight: 20 },

    optionWrap: { gap: 10 },
    optionPill: { minHeight: 52, borderRadius: 12, borderWidth: 1.5, borderColor: c.hairline, backgroundColor: c.surface, paddingHorizontal: 16, paddingVertical: 13, justifyContent: 'center' },
    optionPillActive:  { backgroundColor: palette.navy800, borderColor: palette.navy800 },
    optionLabel:       { color: c.ink,       fontSize: 14, lineHeight: 21 },
    optionLabelActive: { color: palette.paper, fontWeight: '600' },

    footerActions: { flexDirection: 'column', gap: 12, marginTop: 10 },

    progressList:     { gap: 12 },
    progressRowStatic:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: c.hairline, paddingBottom: 10 },
    progressRowActive:{ gap: 8, paddingBottom: 4 },
    progressRowCopy:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    progressItemLabel:  { color: c.ink,     fontSize: 15, fontWeight: '500' },
    progressItemCheck:  { color: c.success, fontSize: 18, fontWeight: '800' },
    progressItemPercent:{ color: c.ink,     fontSize: 15, fontWeight: '600' },
    inlineProgressTrack:{ height: 4, borderRadius: 999, backgroundColor: c.hairline, overflow: 'hidden' },
    inlineProgressFill: { width: '82%', height: '100%', borderRadius: 999, backgroundColor: c.accent },

    testimonialCard:   { borderRadius: 18, borderWidth: 1, borderColor: c.accentMuted, backgroundColor: c.surface, padding: 16, gap: 8 },
    testimonialRating: { color: c.success, fontSize: 16, letterSpacing: 1.2 },
    testimonialTitle:  { color: c.ink, fontSize: 20, lineHeight: 26, fontWeight: '600' },
    testimonialBody:   { color: c.inkMute, fontSize: 15, lineHeight: 22 },
    testimonialAuthor: { color: c.ink, fontSize: 14, lineHeight: 20, textAlign: 'right' },

    chartCard:            { gap: 14 },
    chartHeaderBadge:     { minHeight: 42, borderRadius: 14, borderWidth: 1, borderColor: c.accentMuted, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
    chartHeaderBadgeLabel:{ color: c.ink, fontSize: 14, fontWeight: '500' },
    chartTitle:           { color: c.ink, fontSize: 18, lineHeight: 26, fontWeight: '600', textAlign: 'center' },
    chartTitleAccent:     { color: c.accent },
    chartArea:            { height: 220, borderRadius: 18, backgroundColor: c.surface, borderWidth: 1, borderColor: c.accentMuted, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 28, justifyContent: 'flex-end', overflow: 'hidden' },
    chartGridLine:        { position: 'absolute', left: 18, right: 18, bottom: 48, height: 1, backgroundColor: c.hairline },
    chartGridLineMiddle:  { bottom: 95 },
    chartGridLineTop:     { bottom: 142 },
    chartCurveSegmentOne:  { position: 'absolute', left: 28,  bottom: 55,  width: 88,  height: 52, borderTopLeftRadius: 44, borderTopRightRadius: 44, borderTopWidth: 4, borderColor: '#F08A00', transform: [{ rotate: '-10deg' }] },
    chartCurveSegmentTwo:  { position: 'absolute', left: 102, bottom: 86,  width: 92,  height: 44, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderTopWidth: 4, borderColor: '#E6BE54', transform: [{ rotate: '5deg'  }] },
    chartCurveSegmentThree:{ position: 'absolute', left: 176, bottom: 104, width: 104, height: 72, borderTopLeftRadius: 48, borderTopRightRadius: 48, borderTopWidth: 4, borderColor: '#36C56F', transform: [{ rotate: '6deg'  }] },
    chartPoint:      { position: 'absolute', width: 12, height: 12, borderRadius: 999, backgroundColor: c.surface, borderWidth: 3 },
    chartPointStart: { left: 20,  bottom: 48,  borderColor: '#F08A00' },
    chartPointEnd:   { right: 18, bottom: 160, borderColor: '#36C56F' },
    chartLabelStart: { position: 'absolute', left: 10,  bottom: 72,  borderRadius: 12, backgroundColor: c.background, paddingHorizontal: 10, paddingVertical: 6 },
    chartLabelEnd:   { position: 'absolute', right: 8,  bottom: 182, borderRadius: 12, backgroundColor: c.background, paddingHorizontal: 10, paddingVertical: 6 },
    chartLabelText:  { color: c.ink, fontSize: 12, fontWeight: '600' },
    chartWeekRow:    { position: 'absolute', left: 18, right: 18, bottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
    chartWeekLabel:  { color: c.inkMute, fontSize: 11 },
    chartFootnote:   { color: c.inkMute, fontSize: 12, textAlign: 'center' },

    ratingCard:     { marginTop: 8, paddingTop: 20, borderTopWidth: 1, borderTopColor: c.accentMuted, alignItems: 'center', gap: 12 },
    ratingQuestion: { color: c.inkMute, fontSize: 14, textAlign: 'center' },
    starsRow:   { flexDirection: 'row', gap: 6 },
    starButton: { padding: 4 },
    starIcon:   { fontSize: 32 },
    starFilled: { color: c.accentSoft },
    starEmpty:  { color: c.accentMuted },
    ratingThanks: { color: c.inkMute, fontSize: 13, textAlign: 'center' },
  });
}
