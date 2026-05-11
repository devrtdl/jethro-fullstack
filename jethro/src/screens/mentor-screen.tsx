import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { mentorService, type MentorMessage } from '@/src/services/mentor/mentor-service';
import { mentorContext } from '@/src/lib/mentor-context';
import { useTheme } from '@/src/theme/ThemeContext';
import type { ThemeColors } from '@/src/theme/colors';
import { palette } from '@/src/theme/colors';
import { FontFamily } from '@/src/theme/typography';
import { Radius, Spacing } from '@/src/theme/spacing';

function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const INITIAL_MESSAGE: MentorMessage = {
  role: 'assistant',
  content:
    'Olá! Sou o Jethro, o seu mentor PBN.\n\nEstou aqui para ajudá-lo a construir um negócio com propósito, estrutura e fé. O que está no coração hoje?',
};

const SUGESTOES = [
  'O que é o Método PBN?',
  'Como funciona o diagnóstico?',
  'O que é o Gate de Avanço?',
  'Qual material técnico é mais urgente para mim?',
];

function MessageBubble({ message }: { message: MentorMessage }) {
  const isUser = message.role === 'user';
  const { colors } = useTheme();
  const s = useMemo(() => makeBubbleStyles(colors), [colors]);

  return (
    <View style={[s.bubbleRow, isUser ? s.bubbleRowUser : s.bubbleRowAssistant]}>
      {!isUser && (
        <View style={s.avatarCircle}>
          <Text style={s.avatarText}>J</Text>
        </View>
      )}
      <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAssistant]}>
        <Text style={[s.bubbleText, isUser ? s.bubbleTextUser : s.bubbleTextAssistant]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

function makeBubbleStyles(c: ThemeColors) {
  return StyleSheet.create({
    bubbleRow:           { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
    bubbleRowUser:       { justifyContent: 'flex-end' },
    bubbleRowAssistant:  { justifyContent: 'flex-start' },
    avatarCircle:        { width: 32, height: 32, borderRadius: 16, backgroundColor: palette.gold500, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    avatarText:          { fontFamily: FontFamily.serifSemiBold, fontSize: 13, color: palette.navy800 },
    bubble:              { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 11 },
    bubbleUser:          { backgroundColor: palette.navy800, borderBottomRightRadius: 4 },
    bubbleAssistant:     { backgroundColor: c.surface, borderBottomLeftRadius: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline },
    bubbleText:          { fontSize: 15, lineHeight: 22 },
    bubbleTextUser:      { fontFamily: FontFamily.sansMedium, color: palette.paper },
    bubbleTextAssistant: { fontFamily: FontFamily.sansRegular, color: c.ink },
  });
}

export function MentorScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [messages, setMessages] = useState<MentorMessage[]>([INITIAL_MESSAGE]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [sessionId] = useState(generateSessionId);
  const listRef = useRef<FlatList>(null);

  const sendSugestao = useCallback(
    async (text: string) => {
      if (loading) return;
      const userMsg: MentorMessage = { role: 'user', content: text };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      try {
        const { reply } = await mentorService.chat(sessionId, text);
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Tive dificuldade em responder agora. Tenta novamente em instantes.' },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [loading, sessionId]
  );

  // Ref para evitar stale closure no useFocusEffect
  const sendSugestaoRef = useRef(sendSugestao);
  useEffect(() => { sendSugestaoRef.current = sendSugestao; }, [sendSugestao]);

  // Ao receber foco, verifica se há uma mensagem pré-preenchida (ex: "Jethro, me ajuda")
  useFocusEffect(useCallback(() => {
    const pending = mentorContext.consume();
    if (pending) void sendSugestaoRef.current(pending);
  }, []));

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: MentorMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const { reply } = await mentorService.chat(sessionId, text);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Tive dificuldade em responder agora. Tenta novamente em instantes.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, loading, sessionId]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerAvatar}>
            <Text style={s.headerAvatarText}>J</Text>
          </View>
          <View>
            <Text style={s.headerTitle}>Jethro</Text>
            <Text style={s.headerSub}>Mentor PBN · sempre disponível</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={s.messagesList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <>
              {loading && (
                <View style={s.typingRow}>
                  <View style={s.avatarCircle}>
                    <Text style={s.avatarText}>J</Text>
                  </View>
                  <View style={s.typingBubble}>
                    <ActivityIndicator size="small" color={colors.accent} />
                  </View>
                </View>
              )}
              {messages.length === 1 && !loading && (
                <View style={s.sugestoesContainer}>
                  <Text style={s.sugestoesLabel}>Toca numa pergunta para começar</Text>
                  <ScrollView horizontal={false} showsVerticalScrollIndicator={false} contentContainerStyle={s.sugestoesList}>
                    {SUGESTOES.map((sg) => (
                      <Pressable
                        key={sg}
                        style={({ pressed }) => [s.sugestaoChip, pressed && s.sugestaoChipPressed]}
                        onPress={() => void sendSugestao(sg)}
                        accessibilityRole="button"
                        accessibilityLabel={sg}
                      >
                        <Text style={s.sugestaoText}>{sg}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          }
        />

        {/* Input bar */}
        <View style={s.inputBar}>
          <TextInput
            style={s.textInput}
            placeholder="Escreva sua pergunta..."
            placeholderTextColor={colors.inkMute}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <Pressable
            style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
            onPress={() => void sendMessage()}
            disabled={!input.trim() || loading}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem"
          >
            <Text style={[s.sendIcon, (!input.trim() || loading) && s.sendIconDisabled]}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },

    header: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: Spacing.screenH, paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.hairline,
      backgroundColor: c.background,
    },
    headerAvatar:     { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.gold500, justifyContent: 'center', alignItems: 'center' },
    headerAvatarText: { fontFamily: FontFamily.serifSemiBold, fontSize: 18, color: palette.navy800 },
    headerTitle:      { fontFamily: FontFamily.sansSemiBold, fontSize: 17, color: c.ink },
    headerSub:        { fontFamily: FontFamily.sansRegular,  fontSize: 12, color: c.inkMute, marginTop: 1 },

    messagesList: { paddingHorizontal: Spacing.screenH, paddingVertical: 16, gap: 12 },

    avatarCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: palette.gold500, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    avatarText:   { fontFamily: FontFamily.serifSemiBold, fontSize: 13, color: palette.navy800 },

    typingRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 4 },
    typingBubble: { backgroundColor: c.surface, borderRadius: 18, borderBottomLeftRadius: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, paddingHorizontal: 20, paddingVertical: 14 },

    sugestoesContainer: { marginTop: 16, paddingHorizontal: 4 },
    sugestoesLabel:     { fontFamily: FontFamily.sansRegular, fontSize: 12, color: c.inkMute, marginBottom: 10, textAlign: 'center' },
    sugestoesList:      { gap: 8, alignItems: 'flex-end', paddingRight: 4 },
    sugestaoChip:       { backgroundColor: c.surface, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline, paddingHorizontal: 18, paddingVertical: 10, maxWidth: '85%' },
    sugestaoChipPressed:{ backgroundColor: c.accentMuted, borderColor: c.accent },
    sugestaoText:       { fontFamily: FontFamily.sansMedium, fontSize: 14, color: c.ink, lineHeight: 20 },

    inputBar: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 10,
      paddingHorizontal: Spacing.screenH, paddingVertical: 12,
      paddingBottom: Platform.OS === 'ios' ? 24 : 12,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline,
      backgroundColor: c.background,
    },
    textInput: {
      flex: 1, backgroundColor: c.surface, borderRadius: Radius.pill,
      borderWidth: StyleSheet.hairlineWidth, borderColor: c.hairline,
      paddingHorizontal: 16, paddingVertical: 10,
      fontFamily: FontFamily.sansRegular, fontSize: 15, color: c.ink,
      maxHeight: 120, lineHeight: 22,
    },
    sendBtn:         { width: 42, height: 42, borderRadius: 21, backgroundColor: c.ink, justifyContent: 'center', alignItems: 'center' },
    sendBtnDisabled: { backgroundColor: c.hairline },
    sendIcon:        { fontFamily: FontFamily.sansBold, fontSize: 20, color: c.background, lineHeight: 24 },
    sendIconDisabled:{ color: c.inkMute },
  });
}
