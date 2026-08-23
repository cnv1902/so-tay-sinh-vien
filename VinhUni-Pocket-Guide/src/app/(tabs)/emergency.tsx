import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocationExpo from 'expo-location';

import { colors, radius, shadows, spacing, typography } from '../../design';
import { API_BASE_URL } from '../../services/api';

type EmergencyTemplate = {
  id: string;
  category: string;
  message_template: string;
};

const FALLBACK_TEMPLATES: EmergencyTemplate[] = [
  { id: '1', category: 'SOS', message_template: 'Cứu tôi với! Tôi đang gặp nguy hiểm tại địa chỉ: {location}' },
  { id: '2', category: 'MEDICAL', message_template: 'Tôi cần cấp cứu y tế khẩn cấp. Vị trí của tôi: {location}' },
  { id: '3', category: 'POLICE', message_template: 'Xin chào, tôi cần báo cáo một sự cố an ninh. Vị trí hiện tại: {location}' }
];

export default function EmergencyScreen() {
  const [templates, setTemplates] = useState<EmergencyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/emergency/templates`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.length > 0 ? data : FALLBACK_TEMPLATES);
      } else {
        setTemplates(FALLBACK_TEMPLATES);
      }
    } catch (e) {
      setTemplates(FALLBACK_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  const sendSOSMessage = async (templateText: string) => {
    try {
      setSending(true);
      let { status } = await LocationExpo.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Ứng dụng cần quyền truy cập vị trí để đính kèm vào tin nhắn khẩn cấp.');
        setSending(false);
        return;
      }

      let location = await LocationExpo.getCurrentPositionAsync({});
      const coords = `${location.coords.latitude}, ${location.coords.longitude}`;
      const googleMapsLink = `https://maps.google.com/?q=${coords}`;
      
      const messageBody = templateText.replace('{location}', googleMapsLink);
      
      const smsUrl = `sms:?body=${encodeURIComponent(messageBody)}`;
      Linking.openURL(smsUrl);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Khẩn cấp & SOS</Text>
        <Text style={styles.subtitle}>Bấm vào mẫu để gửi tin nhắn kèm vị trí hiện tại của bạn.</Text>
      </View>

      <View style={styles.sosContainer}>
        <TouchableOpacity 
          style={styles.sosButton}
          onPress={() => sendSOSMessage('Cứu tôi với! Tôi đang gặp nguy hiểm. Vị trí của tôi: {location}')}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color={colors.white} size="large" />
          ) : (
            <>
              <Ionicons name="alert" size={48} color={colors.white} />
              <Text style={styles.sosText}>SOS KHẨN CẤP</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Các mẫu tin nhắn khác</Text>
      
      <View style={styles.grid}>
        {templates.map((tpl) => (
          <TouchableOpacity 
            key={tpl.id} 
            style={styles.card}
            onPress={() => sendSOSMessage(tpl.message_template)}
          >
            <View style={styles.cardIcon}>
              <Ionicons 
                name={getIconForCategory(tpl.category)} 
                size={24} 
                color={colors.primary} 
              />
            </View>
            <Text style={styles.cardCategory}>{tpl.category}</Text>
            <Text style={styles.cardTemplate} numberOfLines={2}>
              {tpl.message_template}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function getIconForCategory(category: string): keyof typeof Ionicons.glyphMap {
  const cat = category.toUpperCase();
  if (cat.includes('SOS')) return 'alert-circle';
  if (cat.includes('MEDICAL')) return 'medkit';
  if (cat.includes('POLICE')) return 'shield-checkmark';
  if (cat.includes('FIRE')) return 'flame';
  if (cat.includes('LOST')) return 'search';
  return 'document-text';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  sosContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
    elevation: 10,
    shadowColor: colors.danger,
  },
  sosText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 18,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  grid: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    flexDirection: 'column',
    ...shadows.small,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardCategory: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardTemplate: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  }
});