import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useCalendarData } from '../../features/calendar/useCalendarData';
import CalendarMonthGrid from '../../components/calendar/CalendarMonthGrid';
import CalendarEventCard from '../../components/calendar/CalendarEventCard';
import { colors, spacing, typography, radius, shadows } from '../../design';
import { SafeAreaView } from 'react-native-safe-area-context';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import type { CalendarEvent } from '../../types/calendar';


export default function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const isEn = (i18n.language || 'vi').startsWith('en');
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const [selectedDate, setSelectedDate] = useState<number>(currentDate.getDate());

  const { events, loading, error } = useCalendarData(month, year);

  const selectedDateEvents = useMemo(() => {
    return events.filter((e: CalendarEvent) => new Date(e.start_time).getDate() === selectedDate);
  }, [events, selectedDate]);


  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
    setSelectedDate(1);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
    setSelectedDate(1);
  };

  const monthLabel = isEn
    ? new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' })
    : `${t('calendar.month')} ${month}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <Text style={styles.headerTitle}>{t('calendar.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('calendar.subtitle')}</Text>
        </View>

        <LanguageSwitcher />
      </View>

      {/* Month Navigator */}
      <View style={[styles.monthSelector, { marginHorizontal: spacing.lg, marginBottom: spacing.md, alignSelf: 'stretch', justifyContent: 'space-between' }]}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.arrowBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.monthLabelBox}>
          <Text style={styles.monthText}>{monthLabel}</Text>
          <Text style={styles.yearText}>{year}</Text>
        </View>
        <TouchableOpacity onPress={goToNextMonth} style={styles.arrowBtn}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>


      {/* Month Grid */}

      <CalendarMonthGrid
        year={year}
        month={month}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        events={events}
      />

      {/* Event Count Banner */}
      {!loading && !error && (
        <View style={styles.eventCountBanner}>
          <Ionicons name="calendar" size={14} color={colors.primary} />
          <Text style={styles.eventCountText}>
            {selectedDateEvents.length > 0
              ? `${selectedDateEvents.length} sự kiện vào ngày ${selectedDate}/${month}`
              : `Ngày ${selectedDate}/${month} không có sự kiện`}
          </Text>
        </View>
      )}

      {/* Event List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải lịch...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
            </View>
            <Text style={styles.emptyTitle}>Không thể tải dữ liệu</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
          </View>
        ) : selectedDateEvents.length === 0 ? (
          <View style={styles.centerContent}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="calendar-clear-outline" size={32} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyText}>Không có sự kiện trong ngày này</Text>
          </View>
        ) : (
          <FlatList
            data={selectedDateEvents}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <CalendarEventCard event={item} />}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.extrabold,
    color: colors.primary,
    letterSpacing: typography.letterSpacing.tight,
  },
  headerSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  arrowBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabelBox: {
    alignItems: 'center',
    minWidth: 70,
  },
  monthText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  yearText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  eventCountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventCountText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.primary,
  },
  listContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flatListContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.massive,
    paddingHorizontal: spacing.lg,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyIconBox: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: typography.weight.medium,
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
});