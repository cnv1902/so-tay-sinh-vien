import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../design';
import type { CalendarEvent } from '../../types/calendar';

interface Props {
  year: number;
  month: number;
  selectedDate: number | null;
  onSelectDate: (date: number) => void;
  events: CalendarEvent[];
}

const DAYS_OF_WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// Hàm phụ trợ xác định icon cho sự kiện trong ngày
const getDayEventIndicator = (dayEvents: CalendarEvent[]) => {
  if (dayEvents.length === 0) return null;

  // Kiểm tra xem có ngày nghỉ lễ không
  const laNghiLe = dayEvents.some(e => e.category?.toLowerCase().includes('nghỉ'));
  if (laNghiLe) {
    return { icon: 'star', color: '#EF4444' }; // Dấu sao đỏ
  }

  // Kiểm tra lịch thi
  const laLichThi = dayEvents.some(e => e.category?.toLowerCase().includes('thi'));
  if (laLichThi) {
    return { icon: 'document-text', color: '#F59E0B' }; // Tài liệu vàng
  }

  // Kiểm tra lịch hành chính/công tác
  const laHanhChinh = dayEvents.some(e => e.category?.toLowerCase().includes('hành chính'));
  if (laHanhChinh) {
    return { icon: 'briefcase', color: '#8B5CF6' }; // Cặp táp tím
  }

  // Mặc định là chấm tròn màu chủ đạo
  return { icon: 'ellipse', color: colors.primary };
};

export default function CalendarMonthGrid({ year, month, selectedDate, onSelectDate, events }: Props) {
  // Tổng số ngày trong tháng
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // Xác định ngày mùng 1 của tháng rơi vào thứ mấy (0 = CN, 1 = T2, ..., 6 = T7)
  const firstDay = new Date(year, month - 1, 1).getDay();
  
  // Điều chỉnh để Thứ 2 = 0, Chủ Nhật = 6
  const startingEmptyCells = (firstDay + 6) % 7;
  
  // Tổng số ô trong lưới lịch (ô trống + ô có ngày), làm tròn lên cho chia hết 7
  const totalCells = Math.ceil((startingEmptyCells + daysInMonth) / 7) * 7;

  // Gom nhóm các sự kiện theo ngày để dễ dàng tìm kiếm
  const eventsByDate: Record<number, CalendarEvent[]> = {};
  events.forEach(event => {
    const date = new Date(event.start_time).getDate();
    if (!eventsByDate[date]) eventsByDate[date] = [];
    eventsByDate[date].push(event);
  });

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const date = i - startingEmptyCells + 1;
    const isCurrentMonth = date > 0 && date <= daysInMonth;
    
    if (!isCurrentMonth) {
      // Ô trống (những ngày của tháng trước/sau)
      cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
      continue;
    }

    const isSelected = date === selectedDate;
    const dayEvents = eventsByDate[date] || [];
    const indicator = getDayEventIndicator(dayEvents);
    
    // Kiểm tra xem có phải cuối tuần không (cột 5 hoặc 6 là T7, CN)
    const colIndex = i % 7;
    const isWeekend = colIndex === 5 || colIndex === 6;

    cells.push(
      <TouchableOpacity 
        key={`date-${date}`} 
        style={[styles.dayCell, isSelected && styles.selectedDayCell]}
        onPress={() => onSelectDate(date)}
      >
        <Text style={[
          styles.dateText,
          isSelected ? styles.selectedDateText : (isWeekend ? styles.weekendText : styles.normalText)
        ]}>
          {date}
        </Text>
        
        {indicator && (
          <View style={styles.indicatorContainer}>
            <Ionicons 
              name={indicator.icon as any} 
              size={indicator.icon === 'ellipse' ? 6 : 10} 
              color={isSelected ? '#ffffff' : indicator.color} 
            />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Chia danh sách các ô thành từng tuần (mỗi tuần 7 ngày)
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(
      <View key={`week-${i}`} style={styles.weekRow}>
        {cells.slice(i, i + 7)}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        {DAYS_OF_WEEK.map((day, idx) => (
          <View key={day} style={styles.headerCell}>
            <Text style={[
              styles.headerText, 
              (idx === 5 || idx === 6) ? styles.weekendHeaderText : null
            ]}>
              {day}
            </Text>
          </View>
        ))}
      </View>
      
      {/* Lưới lịch */}
      <View style={styles.grid}>
        {weeks}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  headerText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  weekendHeaderText: {
    color: '#EF4444',
  },
  grid: {
    flexDirection: 'column',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round, // Chuyển thành hình tròn giống lịch truyền thống
    marginHorizontal: 2,
  },
  selectedDayCell: {
    backgroundColor: colors.primary,
  },
  dateText: {
    fontSize: typography.size.md,
    fontWeight: '500',
  },
  normalText: {
    color: colors.textPrimary,
  },
  weekendText: {
    color: '#EF4444', // Red for weekend text
  },
  selectedDateText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  indicatorContainer: {
    marginTop: 2,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
