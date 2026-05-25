import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Generate year range
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_RANGE_START = CURRENT_YEAR - 50;
const YEAR_RANGE_END = CURRENT_YEAR + 1; // Limited to max 1 future year
const YEARS = [];
for (let y = YEAR_RANGE_END; y >= YEAR_RANGE_START; y--) {
  YEARS.push(y);
}

const CustomDatePicker = ({
  visible,
  onClose,
  onSelect,
  selectedDate,
  minimumDate,
  maximumDate,
  title,
}) => {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const activeWidth = isLandscape ? Math.min(width, 340) : width;
  const today = new Date();
  const initial = selectedDate || today;

  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  // 'calendar' | 'month' | 'year'
  const [viewMode, setViewMode] = useState('calendar');

  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ key: `empty-${i}`, day: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ key: `day-${d}`, day: d });
    }
    return days;
  }, [daysInMonth, firstDayOfWeek]);

  const isDateDisabled = day => {
    if (!day) return true;
    const date = new Date(viewYear, viewMonth, day);
    if (
      minimumDate &&
      date <
        new Date(
          minimumDate.getFullYear(),
          minimumDate.getMonth(),
          minimumDate.getDate(),
        )
    ) {
      return true;
    }
    if (
      maximumDate &&
      date >
        new Date(
          maximumDate.getFullYear(),
          maximumDate.getMonth(),
          maximumDate.getDate(),
        )
    ) {
      return true;
    }
    return false;
  };

  const isSelected = day => {
    if (!day || !selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getFullYear() === viewYear
    );
  };

  const isToday = day => {
    if (!day) return false;
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayPress = day => {
    if (isDateDisabled(day)) return;
    const selected = new Date(viewYear, viewMonth, day);
    onSelect(selected);
  };

  const handleMonthSelect = monthIndex => {
    setViewMonth(monthIndex);
    setViewMode('calendar');
  };

  const handleYearSelect = year => {
    setViewYear(year);
    setViewMode('month');
  };

  const handleClose = () => {
    setViewMode('calendar');
    onClose();
  };

  const cellSize = (activeWidth - 80) / 7;
  const cellHeight = isLandscape ? cellSize * 0.8 : cellSize;
  const styles = getPickerStyles(theme, cellSize, activeWidth, isLandscape);

  // ============ YEAR PICKER VIEW ============
  const renderYearPicker = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>Select Year</Text>
      <ScrollView
        style={styles.scrollList}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        {YEARS.map(year => {
          const isActive = year === viewYear;
          return (
            <TouchableOpacity
              key={year}
              style={[
                styles.selectorItem,
                isActive && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => handleYearSelect(year)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.selectorItemText,
                  isActive && { color: '#FFFFFF', fontWeight: '700' },
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // ============ MONTH PICKER VIEW ============
  const renderMonthPicker = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>Select Month — {viewYear}</Text>
      <View style={styles.monthGrid}>
        {MONTHS_SHORT.map((month, index) => {
          const isActive = index === viewMonth && viewYear === viewYear;
          return (
            <TouchableOpacity
              key={month}
              style={[
                styles.monthItem,
                isActive && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => handleMonthSelect(index)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.monthItemText,
                  isActive && { color: '#FFFFFF', fontWeight: '700' },
                ]}
              >
                {month}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // ============ CALENDAR VIEW ============
  const renderCalendar = () => (
    <>
      {/* Month/Year Navigation - tappable */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
          <Icon name="chevron-back" size={22} color={theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <TouchableOpacity
            onPress={() => setViewMode('month')}
            style={styles.headerTap}
          >
            <Text style={styles.monthText}>{MONTHS_SHORT[viewMonth]}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('year')}
            style={styles.headerTap}
          >
            <Text style={styles.yearText}>{viewYear}</Text>
          </TouchableOpacity>
          <Icon
            name="chevron-down"
            size={14}
            color={theme.colors.textSecondary}
            style={{ marginLeft: 2 }}
          />
        </View>

        <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
          <Icon name="chevron-forward" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Day Names */}
      <View style={styles.weekRow}>
        {DAYS.map(d => (
          <View key={d} style={[styles.cell, { width: cellSize }]}>
            <Text style={styles.dayName}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {calendarDays.map(item => {
          const disabled = isDateDisabled(item.day);
          const selected = isSelected(item.day);
          const todayMark = isToday(item.day);

          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.cell,
                { width: cellSize, height: cellHeight },
                selected && {
                  backgroundColor: theme.colors.primary,
                  borderRadius: cellHeight / 2,
                },
                todayMark &&
                  !selected && {
                    borderWidth: 1.5,
                    borderColor: theme.colors.primary,
                    borderRadius: cellHeight / 2,
                  },
              ]}
              onPress={() => item.day && handleDayPress(item.day)}
              disabled={disabled || !item.day}
              activeOpacity={0.6}
            >
              {item.day && (
                <Text
                  style={[
                    styles.dayText,
                    selected && { color: '#FFFFFF', fontWeight: '700' },
                    disabled && { color: theme.colors.border },
                  ]}
                >
                  {item.day}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          {/* Title */}
          <Text style={styles.title}>{title || 'Select Date'}</Text>

          {viewMode === 'year' && renderYearPicker()}
          {viewMode === 'month' && renderMonthPicker()}
          {viewMode === 'calendar' && renderCalendar()}

          {/* Bottom Buttons */}
          <View style={styles.bottomRow}>
            {viewMode !== 'calendar' && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() =>
                  setViewMode(viewMode === 'year' ? 'calendar' : 'calendar')
                }
              >
                <Icon
                  name="arrow-back"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.backBtnText, { color: theme.colors.primary }]}
                >
                  Back
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={[styles.cancelText, { color: theme.colors.error }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const getPickerStyles = (theme, cellSize, activeWidth, isLandscape) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: activeWidth - 40,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      paddingVertical: isLandscape ? 10 : 20,
      paddingHorizontal: 20,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: isLandscape ? 6 : 12,
    },
    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: isLandscape ? 4 : 12,
    },
    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTap: {
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    monthText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
      marginRight: 4,
    },
    yearText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    navBtn: {
      padding: 8,
    },
    // Week row
    weekRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: isLandscape ? 0 : 4,
    },
    cell: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    dayName: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
    },
    dayText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    // Bottom buttons
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: isLandscape ? 8 : 16,
      gap: 16,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      gap: 4,
    },
    backBtnText: {
      fontSize: 14,
      fontWeight: '600',
    },
    cancelBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    cancelText: {
      fontSize: 15,
      fontWeight: '600',
    },
    // Year/Month Selectors
    selectorContainer: {
      alignItems: 'center',
    },
    selectorTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    scrollList: {
      maxHeight: 280,
      width: '100%',
    },
    scrollContent: {
      alignItems: 'center',
      paddingVertical: 4,
    },
    selectorItem: {
      width: '60%',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
      marginVertical: 2,
      alignItems: 'center',
    },
    selectorItemText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    // Month Grid
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    monthItem: {
      width: '28%',
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    monthItemText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
  });

export default CustomDatePicker;
