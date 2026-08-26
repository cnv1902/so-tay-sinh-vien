import React, { useState, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '../../design';
import EmergencyModal from '../../components/emergency/EmergencyModal';
import { useHandbookStore } from '../../stores/useHandbookStore';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

/** Micro-interaction: scale on press */
function PressableScale({
  style,
  onPress,
  children,
  activeScale = 0.96,
}: {
  style?: any;
  onPress?: () => void;
  children: React.ReactNode;
  activeScale?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: activeScale, useNativeDriver: true, speed: 30 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [sosVisible, setSosVisible] = useState(false);
  const setPendingCategory = useHandbookStore((s) => s.setPendingCategory);

  const goToHandbook = (category: string) => {
    setPendingCategory(category);
    router.push('/(tabs)/services');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>{t('home.greeting')}</Text>
            <Text style={styles.subtitle}>{t('home.subGreeting')}</Text>
          </View>

          <View style={styles.headerActions}>
            <LanguageSwitcher style={{ marginRight: spacing.sm }} />
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push('/(tabs)/news')}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Search ── */}
        <TouchableOpacity
          style={styles.searchContainer}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/services')}
        >
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            placeholder={t('handbook.searchPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            editable={false}
          />
          <View style={styles.searchHint}>
            <Text style={styles.searchHintText}>{t('common.search')}</Text>
          </View>
        </TouchableOpacity>

        {/* ── Map Hero Banner (Flagship Feature) ── */}
        <PressableScale
          style={styles.mapCard}
          onPress={() => router.push('/(tabs)/map')}
        >
          {/* Background pattern dots */}
          <View style={styles.mapCardBg} pointerEvents="none">
            <View style={styles.mapDotLg} />
            <View style={styles.mapDotSm} />
          </View>

          <View style={styles.mapCardContent}>
            <View style={styles.mapBadge}>
              <Text style={styles.mapBadgeText}>3D CAMPUS</Text>
            </View>

            <View style={styles.mapIcon}>
              <Ionicons name="map" size={30} color={colors.accent} />
            </View>

            <Text style={styles.mapTitle}>{t('home.mapHeroTitle')}</Text>
            <Text style={styles.mapDescription}>
              {t('home.mapHeroDesc')}
            </Text>

            <View style={styles.mapButton}>
              <Text style={styles.mapButtonText}>{t('home.exploreMap')}</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </View>
          </View>
        </PressableScale>

        {/* ── Quick Access ── */}
        <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>

        <View style={styles.quickGrid}>
          <QuickAction
            icon="calendar"
            title={t('tabs.calendar')}
            color={colors.primary}
            bg={colors.primaryLight}
            onPress={() => router.push('/(tabs)/calendar')}
          />
          <QuickAction
            icon="newspaper"
            title={t('tabs.news')}
            color="#2E6B3E"
            bg="#E8F5EC"
            onPress={() => router.push('/(tabs)/news')}
          />
          <QuickAction
            icon="book"
            title={t('tabs.services')}
            color="#7B3FA0"
            bg="#F2E8FA"
            onPress={() => router.push('/(tabs)/services')}
          />
          {/* SOS — điểm nhấn riêng: nút pulse khẩn cấp */}
          <SosQuickAction onPress={() => setSosVisible(true)} />
        </View>

        {/* ── Services / Cẩm nang ── */}
        <Text style={styles.sectionTitle}>{t('home.categoriesTitle')}</Text>

        <View style={styles.serviceCard}>
          <ServiceItem
            icon="document-text-outline"
            title={t('handbook.categories.quy_che_dao_tao')}
            onPress={() => goToHandbook('quy_che_dao_tao')}
          />
          <ServiceItem
            icon="cash-outline"
            title={t('handbook.categories.hoc_phi_hoc_bong')}
            onPress={() => goToHandbook('hoc_phi_hoc_bong')}
          />
          <ServiceItem
            icon="business-outline"
            title={t('handbook.categories.co_so_vat_chat')}
            onPress={() => goToHandbook('co_so_vat_chat')}
          />
          <ServiceItem
            icon="sparkles-outline"
            title={t('chat.title')}
            onPress={() => router.push('/(tabs)/chat')}
            accent
          />
        </View>
      </ScrollView>

      {/* Modal SOS Khẩn Cấp */}
      <EmergencyModal visible={sosVisible} onClose={() => setSosVisible(false)} />
    </View>
  );
}


// ── Quick Action Normal ──
function QuickAction({
  icon,
  title,
  color,
  bg,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  color: string;
  bg: string;
  onPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 30 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={styles.quickItem}>
      <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
        <View style={[styles.quickIcon, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.quickTitle}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ── SOS Quick Action — Pulse animation riêng ──
function SosQuickAction({ onPress }: { onPress?: () => void }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, speed: 30 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={styles.quickItem}>
      <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
        {/* Pulse ring */}
        <View style={{ position: 'relative', width: 50, height: 50, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={[
              styles.sosPulseRing,
              { transform: [{ scale: pulse }], opacity: pulse.interpolate({ inputRange: [1, 1.18], outputRange: [0.45, 0] }) },
            ]}
          />
          <View style={styles.sosIconBox}>
            <Ionicons name="alert-circle" size={24} color={colors.danger} />
          </View>
        </View>
        <Text style={[styles.quickTitle, styles.sosTitleText]}>SOS</Text>
      </Animated.View>
    </Pressable>
  );
}

// ── Service Item ──
function ServiceItem({
  icon,
  title,
  onPress,
  accent = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress?: () => void;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.serviceItem} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.serviceIcon, accent && styles.serviceIconAccent]}>
        <Ionicons name={icon} size={20} color={accent ? colors.accent : colors.primary} />
      </View>
      <Text style={[styles.serviceTitle, accent && { color: colors.accent, fontWeight: '700' }]}>
        {title}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={accent ? colors.accentDark : colors.textTertiary}
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl + spacing.massive,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },


  appName: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.extrabold,
    color: colors.primary,
    letterSpacing: typography.letterSpacing.tight,
  },

  subtitle: {
    marginTop: 2,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wide,
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // ── Search ──
  searchContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },

  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
  },

  searchHint: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
  },

  searchHintText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },

  // ── Map Hero Card ──
  mapCard: {
    borderRadius: radius.xxl,
    backgroundColor: colors.primary,
    marginBottom: spacing.xxl,
    overflow: 'hidden',
    ...shadows.large,
  },

  mapCardBg: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  mapDotLg: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  mapDotSm: {
    position: 'absolute',
    right: 20,
    bottom: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(200, 148, 58, 0.15)',
  },

  mapCardContent: {
    padding: spacing.xl,
  },

  mapBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(200, 148, 58, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(200, 148, 58, 0.40)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.round,
    marginBottom: spacing.md,
  },

  mapBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.accent,
    letterSpacing: typography.letterSpacing.wider,
  },

  mapIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  mapTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.extrabold,
    color: colors.white,
    letterSpacing: typography.letterSpacing.tight,
  },

  mapDescription: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.md,
    color: 'rgba(255,255,255,0.72)',
  },

  mapButton: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.round,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    ...shadows.accent,
  },

  mapButtonText: {
    color: colors.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },

  // ── Section Title ──
  sectionTitle: {
    marginBottom: spacing.md,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.tight,
  },

  // ── Quick Grid ──
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },

  quickItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },

  quickIcon: {
    width: 50,
    height: 50,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },

  quickTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // SOS
  sosPulseRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.danger,
  },

  sosIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerLight,
    borderWidth: 1.5,
    borderColor: 'rgba(192, 57, 43, 0.3)',
  },

  sosTitleText: {
    color: colors.danger,
    fontWeight: typography.weight.bold,
  },

  // ── Service Card ──
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
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

  serviceIconAccent: {
    backgroundColor: colors.accentLight,
  },

  serviceTitle: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
});