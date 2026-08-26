import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadows, spacing, typography } from '../../design';
import { API_CHATBOT_URL } from '../../services/api';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';


type Message = {
  id: string;
  text: string;
  isUser: boolean;
  sources?: string[];
  coordinate?: { lat: number; lng: number };
  phoneNumber?: string;
};

/** Typing indicator — 3 chấm nhảy */
function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: -6, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(480 - i * 160),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={typingStyles.wrapper}>
      <View style={typingStyles.avatar}>
        <Ionicons name="sparkles" size={14} color={colors.accent} />
      </View>
      <View style={typingStyles.bubble}>
        <View style={typingStyles.dotsRow}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[typingStyles.dot, { transform: [{ translateY: dot }] }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const typingStyles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  bubble: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderBottomLeftRadius: radius.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dotsRow: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: colors.primaryMid,
  },
});

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const setDestination = useNavigationStore((state) => state.setDestination);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: t('chat.initialGreeting'),
      isUser: false,
    },
  ]);

  // Cập nhật lại tin nhắn chào mừng ngay khi người dùng chuyển đổi ngôn ngữ
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{
          id: 'welcome',
          text: t('chat.initialGreeting'),
          isUser: false,
        }];
      }
      return prev;
    });
  }, [i18n.language, t]);


  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const sessionId = 'mobile-device-123';

  const parseActionTokens = (text: string) => {
    let cleanText = text;
    let coordinate: { lat: number; lng: number } | undefined;
    const coordRegex = /\[Tọa độ:\s*([\d.]+),\s*([\d.]+)\]/i;
    const match = cleanText.match(coordRegex);
    if (match) {
      coordinate = { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      cleanText = cleanText.replace(coordRegex, '').trim();
    }
    let phoneNumber: string | undefined;
    const phoneRegex = /(0[3|5|7|8|9])+([0-9]{8})\b/;
    const phoneMatch = cleanText.match(phoneRegex);
    if (phoneMatch) phoneNumber = phoneMatch[0];
    return { cleanText, coordinate, phoneNumber };
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), text: inputText.trim(), isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch(`${API_CHATBOT_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: userMessage.text }),
      });
      if (res.ok) {
        const data = await res.json();
        const { cleanText, coordinate, phoneNumber } = parseActionTokens(data.answer);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), text: cleanText, isUser: false,
          sources: data.sources, coordinate, phoneNumber,
        }]);
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Lỗi từ server: ${res.status}`);
      }
    } catch (e: any) {
      const isNetworkError = e?.message?.includes('Network request failed') || e?.message?.includes('fetch');
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: isNetworkError
          ? 'Không thể kết nối đến AI Chatbot. Vui lòng kiểm tra Docker đang chạy (port 8001) và thử lại.'
          : `Xin lỗi, tôi gặp sự cố: ${e?.message || 'Lỗi không xác định'}`,
        isUser: false,
      }]);
    } finally {
      setLoading(false);

    }
  };

  const handleNavigate = (coord: { lat: number; lng: number }) => {
    setDestination({ name: 'Điểm đến từ Chat', latitude: coord.lat, longitude: coord.lng });
    router.push('/(tabs)/map');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = !item.isUser;
    return (
      <View style={[styles.messageWrapper, item.isUser ? styles.messageWrapperUser : styles.messageWrapperBot]}>
        {isBot && (
          <View style={styles.botAvatar}>
            <Ionicons name="sparkles" size={14} color={colors.accent} />
          </View>
        )}
        <View style={[styles.messageBubble, item.isUser ? styles.messageUser : styles.messageBot]}>
          <Markdown style={{
            body: {
              color: item.isUser ? colors.white : colors.textPrimary,
              fontSize: typography.size.md,
              lineHeight: typography.lineHeight.md,
            },
            paragraph: { marginTop: 0, marginBottom: 4 },
            strong: { fontWeight: typography.weight.bold },
            code_inline: {
              backgroundColor: item.isUser ? 'rgba(255,255,255,0.15)' : colors.primaryLight,
              borderRadius: 4,
              paddingHorizontal: 4,
              fontSize: typography.size.sm,
            },
          }}>
            {item.text}
          </Markdown>

          {item.coordinate && (
            <TouchableOpacity style={styles.actionButton} onPress={() => handleNavigate(item.coordinate!)}>
              <Ionicons name="navigate" size={15} color={colors.white} />
              <Text style={styles.actionText}>Chỉ đường đến đây</Text>
            </TouchableOpacity>
          )}
          {item.phoneNumber && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={() => Linking.openURL(`tel:${item.phoneNumber}`)}
            >
              <Ionicons name="call" size={15} color={colors.white} />
              <Text style={styles.actionText}>Gọi: {item.phoneNumber}</Text>
            </TouchableOpacity>
          )}
          {item.sources && item.sources.length > 0 && (
            <View style={styles.sourcesContainer}>
              <Text style={styles.sourcesTitle}>Nguồn tham khảo</Text>
              {item.sources.map((src, idx) => (
                <Text key={idx} style={styles.sourceItem}>• {src}</Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerAvatarRow}>
          <View style={styles.headerAvatar}>
            <Ionicons name="sparkles" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1, marginRight: spacing.xs }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{t('chat.title')}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{t('chat.subtitle')}</Text>
          </View>
        </View>
        <LanguageSwitcher />
      </View>


      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={loading ? <TypingIndicator /> : null}
      />

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}

            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons name="arrow-up" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.small,
  },
  headerAvatarRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginRight: spacing.sm,
  },

  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    letterSpacing: typography.letterSpacing.tight,
  },
  headerSubtitle: {
    fontSize: typography.size.xs,
    color: colors.success,
    fontWeight: typography.weight.medium,
  },
  chatList: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  messageWrapperUser: { justifyContent: 'flex-end' },
  messageWrapperBot: { justifyContent: 'flex-start' },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  messageUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.xs,
    ...shadows.small,
  },
  messageBot: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMid,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.round,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    gap: 5,
  },
  actionText: {
    color: colors.white,
    fontWeight: typography.weight.semibold,
    fontSize: typography.size.sm,
  },
  sourcesContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  sourcesTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    marginBottom: 4,
    letterSpacing: typography.letterSpacing.wide,
  },
  sourceItem: {
    fontSize: typography.size.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: typography.size.md,
    color: colors.textPrimary,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    lineHeight: typography.lineHeight.md,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    ...shadows.small,
  },
  sendButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
});