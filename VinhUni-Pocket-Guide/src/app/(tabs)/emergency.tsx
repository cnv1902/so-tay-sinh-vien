import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as LocationExpo from 'expo-location';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, typography } from '../../design';
import { API_BASE_URL } from '../../services/api';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

import { usePersonalEmergencyStore } from '../../stores/usePersonalEmergencyStore';
import PersonalContactModal from '../../components/emergency/PersonalContactModal';

export interface EmergencyContactItem {
  id: number | string;
  name: string;
  phone_number: string;
  description?: string;
  category?: string;
  ward?: string;
  latitude?: number;
  longitude?: number;
  isPersonal?: boolean;
}

const getCategoryStyle = (category?: string, name?: string, isPersonal?: boolean) => {
  if (isPersonal) {
    return { icon: 'heart', color: '#10B981', bg: '#D1FAE5' };
  }
  const cat = (category || '').toUpperCase();
  const lowerName = (name || '').toLowerCase();

  if (cat.includes('MED') || cat.includes('Y_TE') || lowerName.includes('y tế') || lowerName.includes('cấp cứu')) {
    return { icon: 'medkit', color: '#10B981', bg: '#D1FAE5' };
  }
  if (cat.includes('FIRE') || lowerName.includes('chữa cháy') || lowerName.includes('cứu hỏa')) {
    return { icon: 'flame', color: '#F97316', bg: '#FFEDD5' };
  }
  if (cat.includes('SEC') || cat.includes('POLICE') || lowerName.includes('bảo vệ') || lowerName.includes('an ninh') || lowerName.includes('công an')) {
    return { icon: 'shield-checkmark', color: '#EF4444', bg: '#FEE2E2' };
  }
  return { icon: 'call', color: '#2563EB', bg: '#DBEAFE' };
};

export default function EmergencyScreen() {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'vi').substring(0, 2);
  const { contact } = usePersonalEmergencyStore();
  const [personalModalVisible, setPersonalModalVisible] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [currentLang]);

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/emergency/contacts?lang=${currentLang}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (e) {
      console.warn('Lỗi tải danh bạ khẩn cấp:', e);
    } finally {
      setLoading(false);
    }
  };


  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert(t('common.error'), t('common.cannotMakeCall'));
    });
  };

  const sendSOSMessage = async () => {
    if (!contact) {
      setPersonalModalVisible(true);
      return;
    }

    try {
      setSending(true);
      let { status } = await LocationExpo.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('map.locationPermissionDeniedTitle'), t('map.locationPermissionDeniedMsg'));
        setSending(false);
        return;
      }

      let location = await LocationExpo.getCurrentPositionAsync({
        accuracy: LocationExpo.Accuracy.High,
      });
      const coords = `${location.coords.latitude}, ${location.coords.longitude}`;
      const googleMapsLink = `https://maps.google.com/?q=${coords}`;
      
      const messageBody = t('emergency.sosSmsBody', { url: googleMapsLink });
      
      const targetPhone = contact.phone.replace(/[^0-9+]/g, '');
      const smsUrl = Platform.OS === 'ios'
        ? `sms:${targetPhone}&body=${encodeURIComponent(messageBody)}`
        : `sms:${targetPhone}?body=${encodeURIComponent(messageBody)}`;

      Linking.openURL(smsUrl);
    } catch (error) {
      Alert.alert(t('common.error'), t('common.locationError'));
    } finally {
      setSending(false);
    }
  };

  const displayContacts: EmergencyContactItem[] = [
    ...(contact
      ? [
          {
            id: 'personal-sos',
            name: contact.name,
            phone_number: contact.phone,
            description: t('emergency.personalBadge'),
            category: 'PERSONAL',
            isPersonal: true,
          },
        ]
      : []),
    ...contacts,
  ];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={styles.title}>{t('emergency.title')}</Text>
            <Text style={styles.subtitle}>
              {contact ? t('emergency.subtitle') : t('emergency.setupPersonalDesc')}
            </Text>
          </View>
          <LanguageSwitcher />
        </View>

        {/* Dynamic Hero SOS Button */}
        <View style={styles.sosContainer}>
          <TouchableOpacity 
            style={[styles.sosButton, !contact && styles.sosButtonGreen]}
            onPress={contact ? sendSOSMessage : () => setPersonalModalVisible(true)}
            disabled={sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator color={colors.white} size="large" />
            ) : contact ? (
              <>
                <Ionicons name="location" size={42} color={colors.white} />
                <Text style={styles.sosText} numberOfLines={2}>
                  {t('emergency.sendGpsTo', { name: contact.name })}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="person-add" size={42} color={colors.white} />
                <Text style={styles.sosText} numberOfLines={2}>
                  {t('emergency.setupPersonalContact')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {contact && (
            <TouchableOpacity 
              style={styles.changeContactBtn} 
              onPress={() => setPersonalModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={15} color={colors.primary} />
              <Text style={styles.changeContactText}>{t('emergency.editPersonal')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t('emergency.title')}</Text>
        
        <View style={styles.list}>
          {displayContacts.length === 0 ? (
            <Text style={{ textAlign: 'center', color: colors.textSecondary, padding: spacing.lg }}>
              {t('common.emptyData')}
            </Text>
          ) : (
            displayContacts.map((item) => {
              const styleMeta = getCategoryStyle(item.category, item.name, item.isPersonal);
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.card, item.isPersonal && styles.cardPersonal]}
                  onPress={() => handleCall(item.phone_number)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: styleMeta.bg }]}>
                    <Ionicons name={styleMeta.icon as any} size={22} color={styleMeta.color} />
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      {item.isPersonal && (
                        <View style={styles.personalBadge}>
                          <Text style={styles.personalBadgeText}>{t('common.personal')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardSubtitle}>
                      {item.description || item.ward || t('emergency.support247')}
                    </Text>
                  </View>
                  <View style={[styles.callBadge, item.isPersonal && { backgroundColor: '#10B981' }]}>
                    <Ionicons name="call" size={14} color={colors.white} />
                    <Text style={styles.callBadgeText}>{item.phone_number}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <PersonalContactModal
        visible={personalModalVisible}
        onClose={() => setPersonalModalVisible(false)}
      />
    </>
  );
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  sosButtonGreen: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  changeContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.round,
    marginTop: spacing.md,
    gap: 4,
  },
  changeContactText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  sosText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.small,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPersonal: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  personalBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  personalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
  },
  callBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.round,
    gap: 4,
  },
  callBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});