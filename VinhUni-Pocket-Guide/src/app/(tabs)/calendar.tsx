import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCalendarData } from '../../features/calendar/useCalendarData';
import CalendarMonthGrid from '../../components/calendar/CalendarMonthGrid';
import CalendarEventCard from '../../components/calendar/CalendarEventCard';
import { colors, spacing, typography } from '../../design';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const [selectedDate, setSelectedDate] = useState<number>(currentDate.getDate());

  // Fetch events for current month/year
  const { events, loading, error } = useCalendarData(month, year);

  // Filter events for the selected day
  const selectedDateEvents = useMemo(() => {
    return events.filter(e => new Date(e.start_time).getDate() === selectedDate);
  }, [events, selectedDate]);

  // Month navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
    setSelectedDate(1);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
    setSelectedDate(1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header: Month Selector */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch Sự Kiện</Text>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.arrowBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <Text style={styles.monthText}>
            Tháng {month}, {year}
          </Text>

          <TouchableOpacity onPress={goToNextMonth} style={styles.arrowBtn}>
            <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Month Grid */}
      <CalendarMonthGrid
        year={year}
        month={month}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        events={events}
      />

      {/* Event List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải lịch...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={styles.errorText}>Không thể tải dữ liệu</Text>
            <Text style={styles.errorSubText}>{error}</Text>
          </View>
        ) : selectedDateEvents.length === 0 ? (
          <View style={styles.centerContent}>
            <Ionicons name="calendar-clear-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyText}>Không có sự kiện</Text>
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
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: typography.size.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  arrowBtn: {
    padding: spacing.xs,
  },
  monthText: {
    fontSize: typography.size.lg,
    fontWeight: '600',
    color: colors.primary,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flatListContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.size.md,
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.error,
    fontSize: typography.size.md,
    fontWeight: '600',
  },
  errorSubText: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: spacing.md,
    color: colors.textTertiary,
    fontSize: typography.size.md,
    fontWeight: '500',
  },
});