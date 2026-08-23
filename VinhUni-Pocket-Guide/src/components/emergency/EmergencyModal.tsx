import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocationExpo from 'expo-location';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography, shadows } from '../../design';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const EMERGENCY_HOTLINES = [
  {
    id: 'security',
    title: 'An ninh / Bảo vệ ĐH Vinh',
    subtitle: 'Hỗ trợ trật tự, sự cố an ninh 24/7',
    phone: '02383855452',
    displayPhone: '0238.3855.452',
    icon: 'shield-checkmark',
    color: '#EF4444',
    bg: '#FEE2E2',
  },
  {
    id: 'medical_vinhuni',
    title: 'Trạm Y tế ĐH Vinh',
    subtitle: 'Sơ cấp cứu & chăm sóc y tế sinh viên',
    phone: '02383855451',
    displayPhone: '0238.3855.451',
    icon: 'medkit',
    color: '#10B981',
    bg: '#D1FAE5',
  },
  {
    id: 'ambulance',
    title: 'Cấp cứu Y tế Quốc gia',
    subtitle: 'Xe cứu thương & hồi sức cấp cứu',
    phone: '115',
    displayPhone: '115',
    icon: 'heart-circle',
    color: '#E11D48',
    bg: '#FFE4E6',
  },
  {
    id: 'fire',
    title: 'Cứu nạn & Cứu hỏa',
    subtitle: 'Báo cháy nổ, mắc kẹt, cứu hộ',
    phone: '114',
    displayPhone: '114',
    icon: 'flame',
    color: '#F97316',
    bg: '#FFEDD5',
  },
  {
    id: 'police',
    title: 'Công an TP. Vinh',
    subtitle: 'Phòng chống tội phạm & trật tự an ninh',
    phone: '113',
    displayPhone: '113',
    icon: 'call',
    color: '#2563EB',
    bg: '#DBEAFE',
  },
];

export default function EmergencyModal({ visible, onClose }: Props) {
  const router = useRouter();
  const [sendingLocation, setSendingLocation] = useState(false);

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Lỗi', 'Không thể khởi chạy cuộc gọi trên thiết bị này.');
    });
  };

  const handleSendGPS = async () => {
    try {
      setSendingLocation(true);
      const { status } = await LocationExpo.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền vị trí', 'Ứng dụng cần quyền định vị để gửi tọa độ cứu hộ.');
        setSendingLocation(false);
        return;
      }

      const location = await LocationExpo.getCurrentPositionAsync({
        accuracy: LocationExpo.Accuracy.High,
      });

      const coords = `${location.coords.latitude},${location.coords.longitude}`;
      const mapsUrl = `https://maps.google.com/?q=${coords}`;
      const messageBody = `[SOS KHẨN CẤP] Tôi đang cần hỗ trợ khẩn cấp tại ĐH Vinh. Tọa độ vị trí của tôi: ${mapsUrl}`;

      const smsUrl = `sms:?body=${encodeURIComponent(messageBody)}`;
      Linking.openURL(smsUrl);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể lấy tọa độ hiện tại. Vui lòng bật GPS.');
    } finally {
      setSendingLocation(false);
    }
  };

  const handleOpenFullEmergency = () => {
    onClose();
    router.push('/emergency' as any);
  };

  return (
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
              <Text style={styles.title}>Cứu Hộ & SOS Khẩn Cấp</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.headerDesc}>
            Chạm vào số điện thoại để gọi ngay hoặc gửi tin nhắn định vị GPS tới người thân & bảo vệ.
          </Text>

          {/* GPS Quick Action Button */}
          <TouchableOpacity
            style={styles.gpsButton}
            activeOpacity={0.8}
            onPress={handleSendGPS}
            disabled={sendingLocation}
          >
            {sendingLocation ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="location" size={20} color="#ffffff" />
                <Text style={styles.gpsButtonText}>
                  Gửi Tin Nhắn SOS Kèm Vị Trí GPS Hiện Tại
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Hotline List */}
          <ScrollView 
            style={styles.hotlineList}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>ĐƯỜNG DÂY NÓNG TRƯỜNG & QUỐC GIA</Text>

            {EMERGENCY_HOTLINES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.hotlineItem}
                activeOpacity={0.7}
                onPress={() => handleCall(item.phone)}
              >
                <View style={[styles.itemIconBox, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                </View>

                <View style={styles.callBadge}>
                  <Ionicons name="call" size={14} color="#ffffff" />
                  <Text style={styles.callBadgeText}>{item.displayPhone}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Bottom More Link */}
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={handleOpenFullEmergency}
            >
              <Text style={styles.moreButtonText}>Xem mẫu tin nhắn SOS & Danh bạ chi tiết</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingVertical: 12,
    borderRadius: radius.md,
    gap: 8,
    marginBottom: spacing.lg,
    ...shadows.small,
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
