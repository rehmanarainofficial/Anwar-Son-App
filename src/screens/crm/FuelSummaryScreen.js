import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { Dropdown } from 'react-native-element-dropdown';
import { useTheme } from '@config/useTheme';
import { selectCurrentUser } from '@store/slices/authSlice';
import { useGetMonthDropdownMutation } from '@api/portalApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FuelSummaryScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const user = useSelector(selectCurrentUser);
  const [getMonthDropdown, { isLoading: isFetchingMonths }] =
    useGetMonthDropdownMutation();

  const [monthsList, setMonthsList] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    fetchMonths();
  }, []);

  const fetchMonths = async () => {
    try {
      const res = await getMonthDropdown({
        company: 'CRM',
        user_id: user?.id || user?.user_id || '',
      }).unwrap();

      let list = [];
      if (Array.isArray(res)) {
        list = res.map(m => ({
          label: m.month_name || m.name || m.title || `Month ${m.month_id}`,
          value: String(m.month_id || m.id || m.value),
        }));
      } else if (res && Array.isArray(res.data)) {
        list = res.data.map(m => ({
          label: m.month_name || m.name || m.title || `Month ${m.month_id}`,
          value: String(m.month_id || m.id || m.value),
        }));
      }

      // Fallback default months if API response is empty
      if (list.length === 0) {
        list = [
          { label: 'August 2026', value: '8' },
          { label: 'July 2026', value: '7' },
          { label: 'June 2026', value: '6' },
          { label: 'May 2026', value: '5' },
          { label: 'April 2026', value: '4' },
        ];
      }

      setMonthsList(list);
      if (list.length > 0) {
        setSelectedMonth(list[0].value);
        generateMockTableData(list[0].value);
      }
    } catch (error) {
      console.log('Error fetching months dropdown:', error);
      const fallbackList = [
        { label: 'August 2026', value: '8' },
        { label: 'July 2026', value: '7' },
        { label: 'June 2026', value: '6' },
        { label: 'May 2026', value: '5' },
      ];
      setMonthsList(fallbackList);
      setSelectedMonth('8');
      generateMockTableData('8');
    }
  };

  const handleMonthChange = item => {
    setSelectedMonth(item.value);
    generateMockTableData(item.value);
  };

  const generateMockTableData = monthVal => {
    const daysInMonth = 30;
    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const data = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(2026, parseInt(monthVal || '8', 10) - 1, day);
      const dayName = daysOfWeek[dateObj.getDay()];
      const isSunday = dayName === 'Sunday';

      let attendance = 'Present';
      let progressUpdate = '5 Visits Completed';
      let fuelAllow = 1200;

      if (isSunday) {
        attendance = 'Off Day';
        progressUpdate = 'Weekly Off';
        fuelAllow = 0;
      } else if (day % 7 === 3) {
        attendance = 'Half Day';
        progressUpdate = '2 Visits Done';
        fuelAllow = 600;
      } else if (day % 11 === 0) {
        attendance = 'Absent';
        progressUpdate = 'No Activity';
        fuelAllow = 0;
      } else {
        fuelAllow = 1000 + (day % 5) * 150;
        progressUpdate = `${3 + (day % 4)} Tasks Completed`;
      }

      const formattedDay = String(day).padStart(2, '0');
      const formattedMonth = String(monthVal || '08').padStart(2, '0');

      data.push({
        id: String(day),
        date: `2026-${formattedMonth}-${formattedDay}`,
        dayName,
        attendance,
        progressUpdate,
        fuelAllow,
      });
    }

    setTableData(data);
  };

  const totalFuelAllow = tableData.reduce((acc, curr) => acc + curr.fuelAllow, 0);
  const totalPresent = tableData.filter(
    d => d.attendance === 'Present' || d.attendance === 'Half Day',
  ).length;

  const getAttendanceBadgeStyle = att => {
    if (att === 'Present') {
      return { bg: theme.colors.success + '20', text: theme.colors.success };
    }
    if (att === 'Half Day') {
      return { bg: theme.colors.warning + '20', text: theme.colors.warning };
    }
    if (att === 'Absent') {
      return { bg: theme.colors.error + '20', text: theme.colors.error };
    }
    return { bg: theme.colors.border, text: theme.colors.textSecondary };
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
        translucent={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.headerNav}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Fuel Summary</Text>
            <View style={{ width: 32 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Filter Section */}
        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>Select Month</Text>
          {isFetchingMonths ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              iconStyle={styles.dropdownIcon}
              data={monthsList}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select Month"
              value={selectedMonth}
              onChange={handleMonthChange}
            />
          )}
        </View>

        {/* Summary Overview Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <View style={[styles.summaryIconWrap, { backgroundColor: theme.colors.primary + '18' }]}>
              <Icon name="color-fill-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.summaryVal}>Rs. {totalFuelAllow.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Fuel Allowed</Text>
          </View>

          <View style={styles.summaryBox}>
            <View style={[styles.summaryIconWrap, { backgroundColor: theme.colors.success + '18' }]}>
              <Icon name="checkmark-done-circle-outline" size={20} color={theme.colors.success} />
            </View>
            <Text style={styles.summaryVal}>{totalPresent} Days</Text>
            <Text style={styles.summaryLabel}>Attendance Count</Text>
          </View>
        </View>

        {/* Table Title */}
        <View style={styles.tableTitleWrap}>
          <View style={styles.accentBar} />
          <Text style={styles.tableTitleText}>DAILY FUEL ALLOWANCE BREAKDOWN</Text>
        </View>

        {/* Horizontal Scrollable Table */}
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* Table Header Row */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thCell, { width: 100 }]}>Date</Text>
                <Text style={[styles.thCell, { width: 100 }]}>Day Name</Text>
                <Text style={[styles.thCell, { width: 110 }]}>Attendance</Text>
                <Text style={[styles.thCell, { width: 170 }]}>Progress Update</Text>
                <Text style={[styles.thCell, { width: 120, textAlign: 'right' }]}>Fuel Allow</Text>
              </View>

              {/* Table Body Rows */}
              {tableData.map((row, index) => {
                const badge = getAttendanceBadgeStyle(row.attendance);
                return (
                  <View
                    key={row.id}
                    style={[
                      styles.tableBodyRow,
                      index % 2 === 1 && { backgroundColor: theme.colors.background + '80' },
                    ]}
                  >
                    <Text style={[styles.tdCell, styles.dateText, { width: 100 }]}>
                      {row.date}
                    </Text>

                    <Text style={[styles.tdCell, { width: 100 }]}>
                      {row.dayName}
                    </Text>

                    <View style={{ width: 110, justifyContent: 'center' }}>
                      <View style={[styles.attBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.attBadgeText, { color: badge.text }]}>
                          {row.attendance}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.tdCell, { width: 170 }]} numberOfLines={1}>
                      {row.progressUpdate}
                    </Text>

                    <Text
                      style={[
                        styles.tdCell,
                        styles.fuelValText,
                        { width: 120, textAlign: 'right' },
                      ]}
                    >
                      {row.fuelAllow > 0 ? `Rs. ${row.fuelAllow.toLocaleString()}` : '-'}
                    </Text>
                  </View>
                );
              })}

              {/* Table Total Summary Row */}
              <View style={styles.tableFooterRow}>
                <Text style={[styles.tfCell, { width: 480 }]}>Total Allowance</Text>
                <Text style={[styles.tfCell, { width: 120, textAlign: 'right', color: theme.colors.primary }]}>
                  Rs. {totalFuelAllow.toLocaleString()}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.primary,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    headerSafeArea: {
      paddingHorizontal: 16,
      paddingBottom: 14,
    },
    headerNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    backBtn: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    filterCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    filterLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.text,
      marginBottom: 8,
    },
    dropdown: {
      height: 48,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.background,
    },
    dropdownPlaceholder: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    dropdownSelectedText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.text,
    },
    dropdownIcon: {
      width: 20,
      height: 20,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 12,
    },
    summaryBox: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    summaryIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    summaryVal: {
      fontSize: 16,
      fontWeight: '900',
      color: theme.colors.text,
      marginBottom: 2,
    },
    summaryLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    tableTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    accentBar: {
      width: 4,
      height: 16,
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
      marginRight: 8,
    },
    tableTitleText: {
      fontSize: 13,
      fontWeight: '900',
      color: theme.colors.primary,
      letterSpacing: 0.5,
    },
    tableCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '18',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    thCell: {
      fontSize: 12,
      fontWeight: '900',
      color: theme.colors.primary,
      textTransform: 'uppercase',
    },
    tableBodyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '50',
    },
    tdCell: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
    },
    dateText: {
      fontWeight: '700',
    },
    attBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    attBadgeText: {
      fontSize: 10,
      fontWeight: '800',
    },
    fuelValText: {
      fontWeight: '800',
      color: theme.colors.text,
    },
    tableFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '10',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderTopWidth: 1.5,
      borderTopColor: theme.colors.primary + '30',
    },
    tfCell: {
      fontSize: 13,
      fontWeight: '900',
      color: theme.colors.text,
    },
  });

export default FuelSummaryScreen;
