import { useCallback, useRef, useState } from 'react';
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

import { JethroColors } from '@/constants/theme';
import { mentorService, type MentorMessage } from '@/src/services/mentor/mentor-service';

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
    'Olá! Sou o Jethro, o teu mentor PBN.\n\nEstou aqui para te ajudar a construir um negócio com propósito, estrutura e fé. O que está no coração hoje?',
};

const SUGESTOES = [
  'O que é o Método PBN?',
  'Como funciona o diagnóstico?',
  'O que é o Gate de Avanço?',
  'Qual material técnico é mais urgente para mim?',
];

function MessageBubble({ message }: { message: MentorMessage }) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant]}>
      {!isUser && (
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>J</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

export function MentorScreen() {
  const [messages, setMessages] = useState<MentorMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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
        {
          role: 'assistant',
          content: 'Tive dificuldade em responder agora. Tenta novamente em instantes.',
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, loading, sessionId]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>J</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Jethro</Text>
            <Text style={styles.headerSub}>Mentor PBN · sempre disponível</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <>
              {loading && (
                <View style={styles.typingRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>J</Text>
                  </View>
                  <View style={styles.typingBubble}>
                    <ActivityIndicator size="small" color={JethroColors.gold} />
                  </View>
                </View>
              )}
              {messages.length === 1 && !loading && (
                <View style={styles.sugestoesContainer}>
                  <Text style={styles.sugestoesLabel}>Toca numa pergunta para começar</Text>
                  <ScrollView
                    horizontal={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.sugestoesList}
                  >
                    {SUGESTOES.map((s) => (
                      <Pressable
                        key={s}
                        style={({ pressed }) => [styles.sugestaoChip, pressed && { opacity: 0.7 }]}
                        onPress={() => sendSugestao(s)}
                      >
                        <Text style={styles.sugestaoText}>{s}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          }
        />

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Escreve a tua pergunta..."
            placeholderTextColor={JethroColors.muted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: JethroColors.navy,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: JethroColors.navySurface,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: JethroColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: JethroColors.navy,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: JethroColors.creme,
  },
  headerSub: {
    fontSize: 12,
    color: JethroColors.muted,
    marginTop: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowAssistant: {
    justifyContent: 'flex-start',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: JethroColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: JethroColors.navy,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  bubbleUser: {
    backgroundColor: JethroColors.gold,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: JethroColors.navySurface,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: JethroColors.navy,
    fontWeight: '500',
  },
  bubbleTextAssistant: {
    color: JethroColors.creme,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  typingBubble: {
    backgroundColor: JethroColors.navySurface,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: JethroColors.navySurface,
    backgroundColor: JethroColors.navy,
  },
  textInput: {
    flex: 1,
    backgroundColor: JethroColors.navySurface,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: JethroColors.creme,
    maxHeight: 120,
    lineHeight: 22,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: JethroColors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: JethroColors.navySurface,
  },
  sendIcon: {
    fontSize: 20,
    color: JethroColors.navy,
    fontWeight: '700',
    lineHeight: 24,
  },
  sugestoesContainer: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  sugestoesLabel: {
    fontSize: 12,
    color: JethroColors.muted,
    marginBottom: 10,
    textAlign: 'center',
  },
  sugestoesList: {
    gap: 8,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  sugestaoChip: {
    backgroundColor: JethroColors.gold,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    maxWidth: '85%',
  },
  sugestaoText: {
    fontSize: 14,
    fontWeight: '600',
    color: JethroColors.navy,
    lineHeight: 20,
  },
});
