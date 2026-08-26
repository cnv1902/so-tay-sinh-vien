import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, typography } from '../../design';
import { TurnIcon, formatDuration, formatDistance } from '../../features/map/useLiveNavigation';

interface TurnBannerProps {
  instruction: string | null;
  icon: TurnIcon | null;
  distanceToNextTurn: number | null;
  remainingMeters: number;
  estimatedSeconds: number;
  isOffRoute: boolean;
  arrived: boolean;
  onExit: () => void;
}

export default function TurnBanner({
  instruction,
  icon,
  distanceToNextTurn,
  remainingMeters,
  estimatedSeconds,
  isOffRoute,
  arrived,
  onExit,
}: TurnBannerProps) {
  const { t } = useTranslation();

  // Chọn icon phù hợp theo TurnIcon
  const renderTurnIcon = () => {
    const size = 32;
    const color = '#FFFFFF';

    switch (icon) {
      case 'left':
        return <MaterialCommunityIcons name="arrow-left-top" size={size} color={color} />;
      case 'right':
        return <MaterialCommunityIcons name="arrow-right-top" size={size} color={color} />;
      case 'slight-left':
        return <MaterialCommunityIcons name="arrow-top-left" size={size} color={color} />;
      case 'slight-right':
        return <MaterialCommunityIcons name="arrow-top-right" size={size} color={color} />;
      case 'sharp-left':
        return <MaterialCommunityIcons name="arrow-u-left-top" size={size} color={color} />;
      case 'sharp-right':
        return <MaterialCommunityIcons name="arrow-u-right-top" size={size} color={color} />;
      case 'uturn':
        return <MaterialCommunityIcons name="arrow-u-down-left" size={size} color={color} />;
      case 'arrive':
        return <Ionicons name="flag" size={size} color="#10B981" />;
      case 'straight':
      default:
        return <Ionicons name="arrow-up" size={size} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Off-Route Alert Badge */}
      {isOffRoute && (
        <View style={styles.offRouteBanner}>
          <Ionicons name="warning" size={16} color="#FFFFFF" />
          <Text style={styles.offRouteText}>{t('map.offRouteAlert')}</Text>
        </View>
      )}

      {/* Main Navigation Card */}
      <View style={[styles.card, arrived && styles.arrivedCard]}>
        {/* Left: Maneuver Icon Circle */}
        <View style={[styles.iconContainer, arrived && styles.arrivedIconContainer]}>
          {renderTurnIcon()}
        </View>

        {/* Center: Instruction text & Sub-info */}
        <View style={styles.textContainer}>
          <Text style={styles.instructionText} numberOfLines={2}>
            {instruction || t('map.headingTo')}
          </Text>

          <View style={styles.subInfoRow}>
            <Text style={styles.subInfoText}>
              {t('map.remaining')} {formatDistance(remainingMeters)} • {formatDuration(estimatedSeconds)}
            </Text>
          </View>
        </View>

        {/* Right: Exit / Stop Navigation Button */}
        <TouchableOpacity style={styles.exitButton} onPress={onExit} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 44,
    left: spacing.md,
    right: spacing.md,
    zIndex: 999,
  },
  offRouteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: 6,
    marginBottom: -4,
  },
  offRouteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 58, 95, 0.94)', // Indigo Navy Glassmorphism
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadows.large,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  arrivedCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.94)', // Emerald Green on Arrival
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  arrivedIconContainer: {
    backgroundColor: '#FFFFFF',
  },
  textContainer: {
    flex: 1,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  subInfoText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  exitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
