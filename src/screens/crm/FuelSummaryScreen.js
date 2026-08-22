import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { Dropdown } from 'react-native-element-dropdown';
import { useTheme } from '@config/useTheme';
import { selectCurrentUser } from '@store/slices/authSlice';
import {
  useGetMonthDropdownMutation,
  useGetSalesmanFuelSummaryMutation,
} from '@api/portalApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_MONTHS = [
  { label: 'January', value: '1' },
  { label: 'February', value: '2' },
  { label: 'March', value: '3' },
  { label: 'April', value: '4' },
  { label: 'May', value: '5' },
  { label: 'June', value: '6' },
  { label: 'July', value: '7' },
  { label: 'August', value: '8' },
  { label: 'September', value: '9' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];

const FuelSummaryScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const user = useSelector(selectCurrentUser);

  const [getMonthDropdown, { isLoading: isFetchingMonths }] =
    useGetMonthDropdownMutation();
  const [getSalesmanFuelSummary, { isLoading: isFetchingSummary }] =
    useGetSalesmanFuelSummaryMutation();

  // Current Date Initializers
  const currentDate = new Date();
  const currentYearStr = String(currentDate.getFullYear());
  const currentMonthStr = String(currentDate.getMonth() + 1);

  // Filter States
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [monthsList, setMonthsList] = useState(DEFAULT_MONTHS);
  const [yearsList, setYearsList] = useState([]);

  // Data States
  const [fuelSummary, setFuelSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Generate 10 Years List starting from current year (e.g. 2026 to 2035, no previous years)
  useEffect(() => {
    const years = [];
    const curY = new Date().getFullYear();
    for (let y = curY; y < curY + 10; y++) {
      years.push({ label: String(y), value: String(y) });
    }
    setYearsList(years);
  }, []);

  // Fetch Month Dropdown API
  useEffect(() => {
    fetchMonthsDropdown();
  }, []);

  const fetchMonthsDropdown = async () => {
    try {
      const res = await getMonthDropdown({
        company: 'CRM',
      }).unwrap();

      let rawArr = [];
      if (Array.isArray(res)) {
        rawArr = res;
      } else if (res && Array.isArray(res.data)) {
        rawArr = res.data;
      }

      if (rawArr.length > 0) {
        const list = rawArr.map(m => ({
          label: m.description || m.month_name || m.name || m.title || `Month ${m.id || m.month_id}`,
          value: String(m.id || m.month_id || m.value),
        }));
        setMonthsList(list);
      }
    } catch (error) {
      console.log('Error fetching months dropdown:', error);
    }
  };

  // Fetch Fuel Summary Data
  const fetchFuelSummary = useCallback(
    async (yearVal = selectedYear, monthVal = selectedMonth) => {
      if (!yearVal || !monthVal) return;
      try {
        const response = await getSalesmanFuelSummary({
          company: 'CRM',
          emp_code: user?.emp_code || '',
          user_id: user?.id || user?.user_id || '',
          role_id: user?.role_id,
          year: String(yearVal),
          month: String(monthVal),
        }).unwrap();

        if (response?.status === 'true') {
          setFuelSummary(response);
        } else {
          setFuelSummary(response || null);
        }
      } catch (error) {
        console.log('Error fetching salesman fuel summary:', error);
      }
    },
    [getSalesmanFuelSummary, user?.emp_code, user?.id, user?.user_id, user?.role_id, selectedYear, selectedMonth],
  );

  useEffect(() => {
    fetchFuelSummary(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, fetchFuelSummary]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFuelSummary(selectedYear, selectedMonth);
    setRefreshing(false);
  };

  const handleMonthChange = item => {
    setSelectedMonth(item.value);
  };

  const handleYearChange = item => {
    setSelectedYear(item.value);
  };

  const styles = getStyles(theme);

  const rules = fuelSummary?.rules || {};
  const summary = fuelSummary?.summary || {};
  const monthData = fuelSummary?.month || {};
  const dailyList = fuelSummary?.data || [];

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Month & Year Dropdown Filters in 1 Row */}
        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>Filter Period</Text>
          <View style={styles.filterRow}>
            {/* Month Dropdown */}
            <View style={styles.dropdownCol}>
              <Text style={styles.filterLabel}>Month</Text>
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

            {/* Year Dropdown */}
            <View style={styles.dropdownCol}>
              <Text style={styles.filterLabel}>Year</Text>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelectedText}
                iconStyle={styles.dropdownIcon}
                data={yearsList}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select Year"
                value={selectedYear}
                onChange={handleYearChange}
              />
            </View>
          </View>
        </View>

        {isFetchingSummary ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loaderText}>Fetching fuel summary...</Text>
          </View>
        ) : (
          <>
            {/* Rules Banner Card */}
            {rules && (
              <View style={styles.rulesCard}>
                <View style={styles.rulesHeader}>
                  <Icon name="information-circle" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.rulesTitle}>Fuel Rules & Criteria</Text>
                </View>
                <View style={styles.rulesRow}>
                  <View style={styles.ruleBadge}>
                    <Text style={styles.ruleBadgeLabel}>Attendance</Text>
                    <Text style={styles.ruleBadgeVal}>≤ {rules.attendance_before_or_at || '09:05:00'}</Text>
                  </View>
                  <View style={styles.ruleBadge}>
                    <Text style={styles.ruleBadgeLabel}>Progress Update</Text>
                    <Text style={styles.ruleBadgeVal}>≤ {rules.progress_before || '12:00:00'}</Text>
                  </View>
                  <View style={styles.ruleBadgePrimary}>
                    <Text style={styles.ruleBadgeLabelPrimary}>Allowance</Text>
                    <Text style={styles.ruleBadgeValPrimary}>{rules.fuel_if_both_valid || '3L'}/day</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Summary Overview Grid */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIconWrap, { backgroundColor: theme.colors.primary + '18' }]}>
                  <Icon name="calendar-outline" size={20} color={theme.colors.primary} />
                </View>
                <Text style={styles.summaryVal}>{summary.attendance_days || 0}</Text>
                <Text style={styles.summaryLabel}>Attendance Days</Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={[styles.summaryIconWrap, { backgroundColor: '#3B82F618' }]}>
                  <Icon name="trending-up-outline" size={20} color="#3B82F6" />
                </View>
                <Text style={styles.summaryVal}>{summary.progress_days || 0}</Text>
                <Text style={styles.summaryLabel}>Progress Days</Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={[styles.summaryIconWrap, { backgroundColor: '#10B98118' }]}>
                  <Icon name="checkmark-done-circle-outline" size={20} color="#10B981" />
                </View>
                <Text style={styles.summaryVal}>{summary.fuel_days || 0}</Text>
                <Text style={styles.summaryLabel}>Fuel Days</Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={[styles.summaryIconWrap, { backgroundColor: '#F59E0B18' }]}>
                  <Icon name="color-fill-outline" size={20} color="#F59E0B" />
                </View>
                <Text style={[styles.summaryVal, { color: '#F59E0B' }]}>{summary.total_fuel || '0L'}</Text>
                <Text style={styles.summaryLabel}>Total Fuel</Text>
              </View>
            </View>

            {/* Table Section */}
            <View style={styles.tableTitleWrap}>
              <View style={styles.accentBar} />
              <Text style={styles.tableTitleText}>
                {monthData.name ? `${monthData.name.toUpperCase()} BREAKDOWN` : 'DAILY FUEL BREAKDOWN'}
              </Text>
            </View>

            {dailyList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Icon name="file-tray-outline" size={40} color={theme.colors.textSecondary} />
                <Text style={styles.emptyText}>No fuel record found for selected period.</Text>
              </View>
            ) : (
              <View style={styles.tableCard}>
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View>
                    {/* Table Header */}
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.thCell, { width: 95 }]}>Date</Text>
                      <Text style={[styles.thCell, { width: 55 }]}>Day</Text>
                      <Text style={[styles.thCell, { width: 125 }]}>Attendance</Text>
                      <Text style={[styles.thCell, { width: 125 }]}>Progress</Text>
                      <Text style={[styles.thCell, { width: 85, textAlign: 'right' }]}>Fuel Allowed</Text>
                    </View>

                    {/* Table Body */}
                    {dailyList.map((row, index) => {
                      const isAttYes = row.attendance === 'Yes';
                      const isProgYes = row.progress_update === 'Yes';
                      const hasFuel = row.fuel_allowed && row.fuel_allowed !== '0L';

                      return (
                        <View
                          key={index}
                          style={[
                            styles.tableBodyRow,
                            index % 2 === 1 && { backgroundColor: theme.colors.background + '60' },
                          ]}
                        >
                          <Text style={[styles.tdCell, styles.dateText, { width: 95 }]}>
                            {row.date}
                          </Text>

                          <Text style={[styles.tdCell, { width: 55 }]}>
                            {row.day}
                          </Text>

                          <View style={{ width: 125, justifyContent: 'center' }}>
                            <View
                              style={[
                                styles.badge,
                                { backgroundColor: isAttYes ? '#10B98118' : '#EF444418' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.badgeText,
                                  { color: isAttYes ? '#10B981' : '#EF4444' },
                                ]}
                              >
                                {isAttYes ? `Yes (${row.attendance_time})` : 'No'}
                              </Text>
                            </View>
                          </View>

                          <View style={{ width: 125, justifyContent: 'center' }}>
                            <View
                              style={[
                                styles.badge,
                                { backgroundColor: isProgYes ? '#10B98118' : '#EF444418' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.badgeText,
                                  { color: isProgYes ? '#10B981' : '#EF4444' },
                                ]}
                              >
                                {isProgYes ? `Yes (${row.progress_time || 'Done'})` : 'No'}
                              </Text>
                            </View>
                          </View>

                          <Text
                            style={[
                              styles.tdCell,
                              styles.fuelValText,
                              {
                                width: 85,
                                textAlign: 'right',
                                color: hasFuel ? theme.colors.primary : theme.colors.textSecondary,
                              },
                            ]}
                          >
                            {row.fuel_allowed || '0L'}
                          </Text>
                        </View>
                      );
                    })}

                    {/* Table Footer */}
                    <View style={styles.tableFooterRow}>
                      <Text style={[styles.tfCell, { width: 400 }]}>Total Fuel Allowance</Text>
                      <Text style={[styles.tfCell, { width: 85, textAlign: 'right', color: theme.colors.primary }]}>
                        {summary.total_fuel || '0L'}
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              </View>
            )}
          </>
        )}
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
    filterTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.text,
      marginBottom: 12,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdownCol: {
      flex: 1,
      marginHorizontal: 4,
    },
    filterLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    dropdown: {
      height: 44,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 10,
      backgroundColor: theme.colors.background,
    },
    dropdownPlaceholder: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    dropdownSelectedText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.text,
    },
    dropdownIcon: {
      width: 18,
      height: 18,
    },
    loaderWrap: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    loaderText: {
      marginTop: 12,
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    rulesCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
      marginBottom: 16,
    },
    rulesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    rulesTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.text,
    },
    rulesRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 6,
    },
    ruleBadge: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 10,
      padding: 8,
      alignItems: 'center',
    },
    ruleBadgeLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    ruleBadgeVal: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.text,
    },
    ruleBadgePrimary: {
      flex: 1,
      backgroundColor: theme.colors.primary + '15',
      borderColor: theme.colors.primary + '30',
      borderWidth: 1,
      borderRadius: 10,
      padding: 8,
      alignItems: 'center',
    },
    ruleBadgeLabelPrimary: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.colors.primary,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    ruleBadgeValPrimary: {
      fontSize: 12,
      fontWeight: '900',
      color: theme.colors.primary,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 16,
      rowGap: 10,
    },
    summaryCard: {
      width: (SCREEN_WIDTH - 42) / 2,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
    },
    summaryIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
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
    emptyCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      marginTop: 10,
      fontSize: 13,
      color: theme.colors.textSecondary,
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
      fontSize: 11,
      fontWeight: '900',
      color: theme.colors.primary,
      textTransform: 'uppercase',
    },
    tableBodyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
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
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 8,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '800',
    },
    fuelValText: {
      fontWeight: '900',
    },
    tableFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '10',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderTopWidth: 1.5,
      borderTopColor: theme.colors.primary + '30',
    },
    tfCell: {
      fontSize: 12,
      fontWeight: '900',
      color: theme.colors.text,
    },
  });

export default FuelSummaryScreen;
