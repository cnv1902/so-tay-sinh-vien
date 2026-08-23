import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '../../design';
import EmergencyModal from '../../components/emergency/EmergencyModal';

export default function HomeScreen() {
  const router = useRouter();
  const [sosVisible, setSosVisible] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>VinhUni Book</Text>

            <Text style={styles.subtitle}>
              Sổ tay Sinh viên Đại học Vinh
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/(tabs)/news')}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TouchableOpacity 
          style={styles.searchContainer}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/services')}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textSecondary}
          />

          <TextInput
            placeholder="Tìm kiếm quy chế, đề án, lịch trình..."
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            editable={false}
          />
        </TouchableOpacity>

        {/* Map Banner */}
        <TouchableOpacity 
          style={styles.mapCard}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/map')}
        >
          <View style={styles.mapIcon}>
            <Ionicons
              name="map"
              size={28}
              color={colors.primary}
            />
          </View>

          <Text style={styles.mapTitle}>
            Bản đồ VinhUni
          </Text>

          <Text style={styles.mapDescription}>
            Tìm phòng học, tòa nhà và chỉ đường trong khuôn viên Đại học Vinh.
          </Text>

          <View style={styles.mapButton}>
            <Text style={styles.mapButtonText}>
              Mở bản đồ
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.white}
            />
          </View>
        </TouchableOpacity>

        {/* Quick Access */}
        <Text style={styles.sectionTitle}>
          Truy cập nhanh
        </Text>

        <View style={styles.quickGrid}>
          <QuickAction
            icon="calendar-outline"
            title="Lịch biểu"
            onPress={() => router.push('/(tabs)/calendar')}
          />

          <QuickAction
            icon="newspaper-outline"
            title="Tin tức"
            onPress={() => router.push('/(tabs)/news')}
          />

          <QuickAction
            icon="book-outline"
            title="Sổ tay SV"
            onPress={() => router.push('/(tabs)/services')}
          />

          <QuickAction
            icon="alert-circle"
            title="SOS"
            danger
            onPress={() => setSosVisible(true)}
          />
        </View>

        {/* Services / Cẩm nang */}
        <Text style={styles.sectionTitle}>
          Cẩm nang sinh viên
        </Text>

        <View style={styles.serviceCard}>
          <ServiceItem
            icon="document-text-outline"
            title="Đề án & Quy chế tuyển sinh"
            onPress={() => router.push('/(tabs)/services')}
          />

          <ServiceItem
            icon="cash-outline"
            title="Học phí & Học bổng"
            onPress={() => router.push('/(tabs)/services')}
          />

          <ServiceItem
            icon="business-outline"
            title="Cơ sở vật chất & Ký túc xá"
            onPress={() => router.push('/(tabs)/services')}
          />

          <ServiceItem
            icon="sparkles-outline"
            title="Hỏi đáp cùng Trợ lý AI"
            onPress={() => router.push('/(tabs)/chat')}
          />
        </View>
      </ScrollView>

      {/* Modal SOS Khẩn Cấp 1 chạm */}
      <EmergencyModal
        visible={sosVisible}
        onClose={() => setSosVisible(false)}
      />
    </View>
  );
}

function QuickAction({
  icon,
  title,
  danger = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity 
      style={styles.quickItem}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View
        style={[
          styles.quickIcon,
          danger && styles.quickIconDanger,
        ]}
      >
        <Ionicons
          name={icon}
          size={24}
          color={danger ? colors.danger : colors.primary}
        />
      </View>

      <Text style={[styles.quickTitle, danger && { color: colors.danger, fontWeight: '700' }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function ServiceItem({
  icon,
  title,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity 
      style={styles.serviceItem}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.serviceIcon}>
        <Ionicons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <Text style={styles.serviceTitle}>
        {title}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.textTertiary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },

  appName: {
    fontSize: typography.size.xxl,
    lineHeight: typography.lineHeight.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...shadows.small,
  },

  searchContainer: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    marginBottom: spacing.lg,
    ...shadows.small,
  },

  searchInput: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },

  mapCard: {
    padding: spacing.xl,
    borderRadius: radius.xxl,
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.xxl,
  },

  mapIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },

  mapTitle: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  mapDescription: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.md,
    color: colors.textSecondary,
  },

  mapButton: {
    marginTop: spacing.lg,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.round,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
  },

  mapButtonText: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: '600',
  },

  sectionTitle: {
    marginBottom: spacing.md,
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  quickGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },

  quickItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.small,
  },

  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.sm,
  },

  quickIconDanger: {
    backgroundColor: '#FEECEC',
  },

  quickTitle: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.small,
  },

  serviceItem: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },

  serviceTitle: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: typography.size.md,
    color: colors.textPrimary,
  },
});