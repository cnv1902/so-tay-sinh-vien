import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as LocationExpo from 'expo-location';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography, shadows } from '../../design';
import { API_BASE_URL } from '../../services/api';
import { usePersonalEmergencyStore } from '../../stores/usePersonalEmergencyStore';
import PersonalContactModal from './PersonalContactModal';

interface Props {
  visible: boolean;
  onClose: () => void;
}

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

export default function EmergencyModal({ visible, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'vi').substring(0, 2);
  const { contact } = usePersonalEmergencyStore();
  const [personalModalVisible, setPersonalModalVisible] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContactItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingLocation, setSendingLocation] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
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

  useEffect(() => {
    if (visible) {
      fetchContacts();
    }
  }, [visible, currentLang]);


  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert(t('common.error'), 'Không thể khởi chạy cuộc gọi trên thiết bị này.');
    });
  };

  const handleSendGPS = async () => {
    if (!contact) {
      setPersonalModalVisible(true);
      return;
    }

    try {
      setSendingLocation(true);
      const { status } = await LocationExpo.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('map.locationPermissionDeniedTitle'), t('map.locationPermissionDeniedMsg'));
        setSendingLocation(false);
        return;
      }

      const location = await LocationExpo.getCurrentPositionAsync({
        accuracy: LocationExpo.Accuracy.High,
      });

      const coords = `${location.coords.latitude},${location.coords.longitude}`;
      const mapsUrl = `https://maps.google.com/?q=${coords}`;
      const messageBody = `[SOS KHẨN CẤP] Mình đang cần hỗ trợ khẩn cấp tại ĐH Vinh! Vị trí hiện tại của mình: ${mapsUrl}`;

      // Gửi SMS trực tiếp tới số người thân đã lưu
      const targetPhone = contact.phone.replace(/[^0-9+]/g, '');
      const smsUrl = Platform.OS === 'ios'
        ? `sms:${targetPhone}&body=${encodeURIComponent(messageBody)}`
        : `sms:${targetPhone}?body=${encodeURIComponent(messageBody)}`;

      Linking.openURL(smsUrl);
    } catch (err) {
      Alert.alert(t('common.error'), 'Không thể lấy tọa độ hiện tại. Vui lòng bật GPS.');
    } finally {
      setSendingLocation(false);
    }
  };

  // Danh sách hiển thị: Luôn chèn liên hệ người thân lên đầu nếu đã có
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

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={onClose} 
          />

          <View style={styles.sheetContainer}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={styles.sosBadge}>
                  <Ionicons name="alert" size={18} color="#ffffff" />
                </View>
                <Text style={styles.title}>{t('emergency.title')}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.headerDesc}>
              {contact ? t('emergency.subtitle') : t('emergency.setupPersonalDesc')}
            </Text>

            {/* Dynamic Main SOS Button */}
            {contact ? (
              <View style={styles.sosButtonWrapper}>
                <TouchableOpacity
                  style={styles.gpsButtonRed}
                  activeOpacity={0.8}
                  onPress={handleSendGPS}
                  disabled={sendingLocation}
                >
                  {sendingLocation ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="location" size={20} color="#ffffff" />
                      <Text style={styles.gpsButtonText} numberOfLines={1}>
                        {t('emergency.sendGpsTo', { name: contact.name })}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.editPersonalBtn}
                  onPress={() => setPersonalModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.setupButtonGreen}
                activeOpacity={0.8}
                onPress={() => setPersonalModalVisible(true)}
              >
                <Ionicons name="person-add" size={20} color="#ffffff" />
                <Text style={styles.gpsButtonText}>
                  {t('emergency.setupPersonalContact')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Hotline List */}
            <ScrollView 
              style={styles.hotlineList}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionLabel}>{t('emergency.title').toUpperCase()}</Text>

              {loading && contacts.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 13 }}>
                    {t('common.loading')}
                  </Text>
                </View>
              ) : displayContacts.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                    {t('common.emptyData')}
                  </Text>
                </View>
              ) : (
                displayContacts.map((item) => {
                  const styleMeta = getCategoryStyle(item.category, item.name, item.isPersonal);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.hotlineItem, item.isPersonal && styles.hotlineItemPersonal]}
                      activeOpacity={0.7}
                      onPress={() => handleCall(item.phone_number)}
                    >
                      <View style={[styles.itemIconBox, { backgroundColor: styleMeta.bg }]}>
                        <Ionicons name={styleMeta.icon as any} size={22} color={styleMeta.color} />
                      </View>

                      <View style={styles.itemInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.itemTitle}>{item.name}</Text>
                          {item.isPersonal && (
                            <View style={styles.personalBadge}>
                              <Text style={styles.personalBadgeText}>Cá nhân</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.itemSubtitle}>
                          {item.description || item.ward || 'Liên hệ trực tiếp 24/7'}
                        </Text>
                      </View>

                      <View style={[styles.callBadge, item.isPersonal && { backgroundColor: '#10B981' }]}>
                        <Ionicons name="call" size={14} color="#ffffff" />
                        <Text style={styles.callBadgeText}>{item.phone_number}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal nhập/sửa liên hệ người thân */}
      <PersonalContactModal
        visible={personalModalVisible}
        onClose={() => setPersonalModalVisible(false)}
      />
    </>
  );
}



const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '85%',
    ...shadows.large,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sosBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDesc: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  sosButtonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  setupButtonGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 13,
    borderRadius: radius.md,
    gap: 8,
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  gpsButtonRed: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: 8,
    ...shadows.small,
  },
  editPersonalBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  gpsButtonText: {
    color: '#ffffff',
    fontSize: typography.size.sm,
    fontWeight: '700',
  },
  hotlineList: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  hotlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hotlineItemPersonal: {
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

  itemIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  callBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.round,
    gap: 4,
  },
  callBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 4,
  },
  moreButtonText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.primary,
  },
});
