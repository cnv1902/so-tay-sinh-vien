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
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { useRouter } from 'expo-router';

import { colors, radius, shadows, spacing, typography } from '../../design';
import { API_BASE_URL } from '../../services/api';
import { useNavigationStore } from '../../stores/useNavigationStore';

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  sources?: string[];
  coordinate?: { lat: number; lng: number };
  phoneNumber?: string;
};

export default function ChatScreen() {
  const router = useRouter();
  const setDestination = useNavigationStore((state) => state.setDestination);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Xin chào! Mình là Trợ lý AI Sổ tay Sinh viên Đại học Vinh. Bạn cần tìm địa điểm nào hay có thắc mắc gì về quy chế, thủ tục không?',
      isUser: false,
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  // Dummy device ID cho session
  const sessionId = 'mobile-device-123'; 

  const parseActionTokens = (text: string) => {
    let cleanText = text;
    let coordinate: { lat: number; lng: number } | undefined;
    
    // Parse tọa độ: [Tọa độ: 18.66, 105.69]
    const coordRegex = /\[Tọa độ:\s*([\d.]+),\s*([\d.]+)\]/i;
    const match = cleanText.match(coordRegex);
    if (match) {
      coordinate = { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      cleanText = cleanText.replace(coordRegex, '').trim();
    }
    
    // Tìm số điện thoại (tạm thời regex đơn giản 10-11 số)
    let phoneNumber: string | undefined;
    const phoneRegex = /(0[3|5|7|8|9])+([0-9]{8})\b/;
    const phoneMatch = cleanText.match(phoneRegex);
    if (phoneMatch) {
      phoneNumber = phoneMatch[0];
    }
    
    return { cleanText, coordinate, phoneNumber };
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage.text
        })
      });

      if (res.ok) {
        const data = await res.json();
        const { cleanText, coordinate, phoneNumber } = parseActionTokens(data.answer);
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: cleanText,
          isUser: false,
          sources: data.sources,
          coordinate,
          phoneNumber
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Lỗi từ server');
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau!',
        isUser: false
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (coord: { lat: number; lng: number }) => {
    setDestination({
      name: 'Điểm đến từ Chat',
      latitude: coord.lat,
      longitude: coord.lng
    });
    router.push('/(tabs)/map');
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = !item.isUser;
    
    return (
      <View style={[styles.messageWrapper, item.isUser ? styles.messageWrapperUser : styles.messageWrapperBot]}>
        {isBot && (
          <View style={styles.botAvatar}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
          </View>
        )}
        <View style={[styles.messageBubble, item.isUser ? styles.messageUser : styles.messageBot]}>
          <Markdown style={{
            body: { color: item.isUser ? colors.white : colors.textPrimary, fontSize: 15 },
            paragraph: { marginTop: 0, marginBottom: 0 }
          }}>
            {item.text}
          </Markdown>
          
          {/* Nút hành động */}
          {item.coordinate && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleNavigate(item.coordinate!)}
            >
              <Ionicons name="navigate" size={16} color={colors.white} />
              <Text style={styles.actionText}>Chỉ đường đến đây</Text>
            </TouchableOpacity>
          )}

          {item.phoneNumber && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#10B981', marginTop: 8 }]}
              onPress={() => handleCall(item.phoneNumber!)}
            >
              <Ionicons name="call" size={16} color={colors.white} />
              <Text style={styles.actionText}>Gọi điện: {item.phoneNumber}</Text>
            </TouchableOpacity>
          )}

          {/* Trích dẫn nguồn */}
          {item.sources && item.sources.length > 0 && (
            <View style={styles.sourcesContainer}>
              <Text style={styles.sourcesTitle}>Nguồn tham khảo:</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trợ lý AI VinhUni</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Hỏi tôi bất cứ điều gì..."
          placeholderTextColor={colors.textTertiary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Ionicons name="send" size={20} color={colors.white} />
          )}
        </TouchableOpacity>
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
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.small
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  chatList: {
    padding: spacing.md,
    gap: spacing.md,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperBot: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  messageUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBot: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    ...shadows.small,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'flex-start',
    gap: 6
  },
  actionText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  sourcesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sourcesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  sourceItem: {
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 16,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  }
});