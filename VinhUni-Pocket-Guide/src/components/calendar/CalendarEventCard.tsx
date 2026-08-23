import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import type { CalendarEvent } from '../../types/calendar';
import { colors, radius, spacing, shadows, typography } from '../../design';

interface Props {
  event: CalendarEvent;
}

const getCategoryColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'đào tạo':
      return '#3B82F6'; // Blue
    case 'hoạt động':
      return '#10B981'; // Green
    case 'hành chính':
      return '#F59E0B'; // Orange
    case 'nghỉ lễ':
      return '#EF4444'; // Red
    default:
      return colors.primary;
  }
};

export default function CalendarEventCard({ event }: Props) {
  const categoryColor = getCategoryColor(event.category);
  
  // Parse time
  const startDate = new Date(event.start_time);
  const timeString = event.is_all_day 
    ? 'Cả ngày' 
    : startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="light" style={styles.card}>
        <View style={[styles.indicator, { backgroundColor: categoryColor }]} />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            {event.is_annual && (
              <View style={styles.annualBadge}>
                <Ionicons name="repeat" size={12} color="#ffffff" />
              </View>
            )}
          </View>

          {!!event.description && (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {event.description}
            </Text>
          )}

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>{timeString}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="bookmark-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: categoryColor, fontWeight: '600' }]}>
                {event.category || 'Sự kiện'}
              </Text>
            </View>
          </View>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.small,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  indicator: {
    width: 6,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  annualBadge: {
    backgroundColor: colors.primary,
    padding: 4,
    borderRadius: radius.round,
  },
  descriptionText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 6,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
});
