import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomDatePicker from './CustomDatePicker';
import { useTheme } from '@config/useTheme';

const DateFilter = ({
  fromDate,
  toDate,
  onFromDate,
  onToDate,
  onClear,
  onFilter,
  hideFromDate = false,
}) => {
  const { theme } = useTheme();
  const [pickerVisible, setPickerVisible] = useState(null);

  const formatDate = (date, placeholder) => {
    if (!date) return placeholder;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const hasFilter = fromDate || toDate;

  const handleDateSelected = date => {
    if (pickerVisible === 'from') {
      onFromDate(date);
    } else if (pickerVisible === 'to') {
      onToDate(date);
    }
    setPickerVisible(null);
  };

  const s = getStyles(theme);

  return (
    <View style={s.container}>
      <View style={s.row}>
        {!hideFromDate && (
          <>
            <TouchableOpacity
              style={[
                s.dateBox,
                fromDate && { borderColor: theme.colors.primary },
              ]}
              onPress={() => setPickerVisible('from')}
              activeOpacity={0.75}
            >
              {Platform.OS === 'ios' && (
                <Icon
                  name="calendar-outline"
                  size={16}
                  color={
                    fromDate ? theme.colors.primary : theme.colors.textSecondary
                  }
                  style={s.calIcon}
                />
              )}
              <View style={s.dateTextWrapper}>
                <Text
                  style={[
                    s.dateText,
                    {
                      color: fromDate
                        ? theme.colors.text
                        : theme.colors.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {formatDate(fromDate, 'From Date')}
                </Text>
              </View>
            </TouchableOpacity>

            <Icon
              name="arrow-forward"
              size={14}
              color={theme.colors.border}
              style={s.arrow}
            />
          </>
        )}

        <TouchableOpacity
          style={[s.dateBox, toDate && { borderColor: theme.colors.primary }]}
          onPress={() => setPickerVisible('to')}
          activeOpacity={0.75}
        >
          {Platform.OS === 'ios' && (
            <Icon
              name="calendar-outline"
              size={16}
              color={toDate ? theme.colors.primary : theme.colors.textSecondary}
              style={s.calIcon}
            />
          )}
          <View style={s.dateTextWrapper}>
            <Text
              style={[
                s.dateText,
                {
                  color: toDate
                    ? theme.colors.text
                    : theme.colors.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              {formatDate(toDate, 'To Date')}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={s.actionsWrapper}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: theme.colors.primary }]}
            onPress={onFilter}
            activeOpacity={0.8}
          >
            <Icon name="search-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {hasFilter && (
            <TouchableOpacity
              style={[
                s.actionBtn,
                s.clearBtn,
                {
                  borderColor: theme.colors.error,
                  backgroundColor: theme.colors.error,
                },
              ]}
              onPress={onClear}
              activeOpacity={0.8}
            >
              <Icon name="close-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <CustomDatePicker
        visible={pickerVisible !== null}
        onClose={() => setPickerVisible(null)}
        onSelect={handleDateSelected}
        selectedDate={pickerVisible === 'from' ? fromDate : toDate}
        title={pickerVisible === 'from' ? 'From Date' : 'To Date'}
        maximumDate={pickerVisible === 'from' && toDate ? toDate : undefined}
        minimumDate={pickerVisible === 'to' && fromDate ? fromDate : undefined}
      />
    </View>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: {
      marginBottom: 0,
      width: '100%',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      height: 44, // Increased from 38
      paddingHorizontal: 12,
    },
    calIcon: {
      marginRight: 6,
    },
    dateTextWrapper: {
      flex: 1,
    },
    label: {
      fontSize: 9,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    dateText: {
      fontSize: 11,
      fontWeight: '600',
      marginTop: 1,
    },
    arrow: {
      marginHorizontal: 4,
    },
    actionsWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 6,
      gap: 6,
    },
    actionBtn: {
      width: 44, // Matched with dateBox
      height: 44, // Matched with dateBox
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.sm,
    },
    clearBtn: {
      borderWidth: 1,
    },
  });

export default DateFilter;
