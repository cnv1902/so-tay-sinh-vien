import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import type { Location } from '../../types/location';

import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '../../design';

type LocationBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onNavigate: () => void;
  location?: Location | null;
};

export default function LocationBottomSheet({
  visible,
  onClose,
  onNavigate,
  location,
}: LocationBottomSheetProps) {
  if (!visible) {
    return null;
  }

  const title = location?.name ?? 'Tòa nhà Điều hành';
  const categoryLabel = getCategoryLabel(location?.category);
  const address = location?.address ?? 'Cơ sở 1 — Đại học Vinh';
  const floor = location?.floor ?? 'Tầng 1';
  const room = location?.room ?? 'Phòng Đào tạo';
  const description =
    location?.description ??
    'Nơi thực hiện các thủ tục hành chính và hỗ trợ đào tạo cho sinh viên.';

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <View style={styles.sheetWrapper}>
        <BlurView intensity={90} tint="light" style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="business"
                size={26}
                color={colors.primaryDark}
              />
            </View>

            <View style={styles.headerContent}>
              <Text style={styles.title}>
                {title}
              </Text>

              <Text style={styles.category}>
                {categoryLabel}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons
                name="close"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.infoList}>
            <InfoRow
              icon="location-outline"
              text={address}
            />

            <InfoRow
              icon="layers-outline"
              text={floor}
            />

            <InfoRow
              icon="information-circle-outline"
              text={room}
            />
          </View>

          <Text style={styles.description}>
            {description}
          </Text>

          <TouchableOpacity
            style={styles.navigateButton}
            onPress={onNavigate}
            activeOpacity={0.8}
          >
            <Ionicons
              name="navigate"
              size={21}
              color={colors.white}
            />

            <Text style={styles.navigateText}>
              Chỉ đường tới đây
            </Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons
        name={icon}
        size={19}
        color={colors.textSecondary}
      />
      <Text style={styles.infoText}>
        {text}
      </Text>
    </View>
  );
}

function getCategoryLabel(category?: Location['category']) {
  switch (category) {
    case 'administration':
      return 'Khu hành chính';
    case 'building':
      return 'Tòa nhà';
    case 'classroom':
      return 'Phòng học';
    case 'food':
      return 'Ăn uống';
    case 'transport':
      return 'Giao thông';
    case 'healthcare':
      return 'Y tế';
    case 'security':
      return 'An ninh';
    default:
      return 'Địa điểm';
  }
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  sheetWrapper: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    overflow: 'hidden',
    ...shadows.large,
  },
  sheet: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl + spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    marginBottom: spacing.lg,
    borderRadius: radius.round,
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },
  headerContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  category: {
    marginTop: 4,
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
  },
  infoList: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: spacing.md,
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  description: {
    marginTop: spacing.lg,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  navigateButton: {
    height: 54,
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    ...shadows.medium,
  },
  navigateText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});