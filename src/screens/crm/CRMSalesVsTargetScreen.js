import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@config/useTheme';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@store/slices/authSlice';
import Icon from 'react-native-vector-icons/Ionicons';
import { Dropdown } from 'react-native-element-dropdown';
import {
  useGetSalesTargetMutation,
  useGetSalesmanDropdownMutation,
} from '@api/portalApi';

const CRMSalesVsTargetScreen = ({ navigation }) => {
  const { theme } = themeHook();
  const user = useSelector(selectCurrentUser);

  const [getSalesTarget, { isLoading }] = useGetSalesTargetMutation();
  const [getSalesmanDropdown, { isLoading: isSalesmanLoading }] =
    useGetSalesmanDropdownMutation();

  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const currentMonthVal = (new Date().getMonth() + 1).toString();
  const currentYearStr = new Date().getFullYear().toString();

  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthVal);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [salesmen, setSalesmen] = useState([]);
  const [selectedSalesman, setSelectedSalesman] = useState('');

  const showSalesmanDropdown =
    String(user?.role_id) === '2' || String(user?.role_id) === '12';

  const fetchTargetData = async (
    y = selectedYear,
    m = selectedMonth,
    q = selectedQuarter,
    s = selectedSalesman,
  ) => {
    try {
      const params = {
        user_id: user?.id || '',
        company: user?.company_user_code || '',
        sub_user_id: user?.company_user_id || '',
      };
      params.years = y !== undefined && y !== null ? y : '';
      params.month = m !== undefined && m !== null ? m : '';
      params.quater = q !== undefined && q !== null ? q : '';
      if (showSalesmanDropdown) {
        params.salesman_name = s || '';
      }

      console.log('CRMSalesVsTarget [API Request Params]:', params);
      const response = await getSalesTarget(params).unwrap();
      console.log('CRMSalesVsTarget [API Response]:', response);

      if (response && String(response.status) === 'true') {
        setData(response.data || []);
      } else {
        setData([]);
      }
    } catch (e) {
      console.log('Error fetching sales vs target:', e);
      setData([]);
    }
  };

  useEffect(() => {
    if (user?.company_user_code && user?.id) {
      fetchTargetData('', currentMonthVal, '', '');
    }
  }, [user?.company_user_code, user?.id]);

  useEffect(() => {
    if (
      showSalesmanDropdown &&
      user?.company_user_code &&
      user?.company_user_id
    ) {
      const fetchSalesmen = async () => {
        try {
          const res = await getSalesmanDropdown({
            user_id: user.company_user_id,
            company: user.company_user_code,
            role_id: user.role_id || '',
          }).unwrap();
          console.log('CRMSalesVsTarget [Salesmen Dropdown Response]:', res);
          if (res && String(res.status) === 'true') {
            setSalesmen(res.data || []);
          } else {
            setSalesmen([]);
          }
        } catch (err) {
          console.log('Error fetching salesman dropdown:', err);
          setSalesmen([]);
        }
      };
      fetchSalesmen();
    }
  }, [
    showSalesmanDropdown,
    user?.company_user_code,
    user?.company_user_id,
    user?.role_id,
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTargetData(
      selectedYear,
      selectedMonth,
      selectedQuarter,
      selectedSalesman,
    );
    setRefreshing(false);
  };

  const handleCurrentYearToggle = () => {
    const newVal = selectedYear === currentYearStr ? '' : currentYearStr;
    setSelectedYear(newVal);
    setSelectedMonth('');
    setSelectedQuarter('');
    fetchTargetData(newVal, '', '', selectedSalesman);
  };

  const handleQuarterToggle = qVal => {
    const newVal = selectedQuarter === qVal ? '' : qVal;
    setSelectedQuarter(newVal);
    setSelectedYear('');
    setSelectedMonth('');
    fetchTargetData('', '', newVal, selectedSalesman);
  };

  const handleCurrentMonthToggle = () => {
    const newVal = selectedMonth === currentMonthVal ? '' : currentMonthVal;
    setSelectedMonth(newVal);
    setSelectedYear('');
    setSelectedQuarter('');
    fetchTargetData('', newVal, '', selectedSalesman);
  };

  const handleSalesmanChange = salesmanCode => {
    setSelectedSalesman(salesmanCode);
    fetchTargetData(selectedYear, selectedMonth, selectedQuarter, salesmanCode);
  };

  const handleClearFilters = () => {
    setSelectedYear('');
    setSelectedMonth('');
    setSelectedQuarter('');
    setSelectedSalesman('');
    fetchTargetData('', '', '', '');
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Dropdown Filters */}
      <View style={styles.filtersWrapper}>
        {showSalesmanDropdown && (
          <View style={styles.salesmanDropdownContainer}>
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.colors.textSecondary, marginBottom: 6 },
              ]}
            >
              Salesman
            </Text>
            {isSalesmanLoading ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={{ alignSelf: 'flex-start', marginVertical: 8 }}
              />
            ) : (
              <Dropdown
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                data={salesmen}
                search
                labelField="salesman_name"
                valueField="salesman_code"
                placeholder="Select Salesman"
                placeholderStyle={{
                  color: theme.colors.textSecondary,
                  fontSize: 13,
                }}
                searchPlaceholder="Search salesman..."
                value={selectedSalesman}
                onChange={item => handleSalesmanChange(item.salesman_code)}
                selectedTextStyle={{ color: theme.colors.text, fontSize: 13 }}
                itemTextStyle={{ color: theme.colors.text, fontSize: 13 }}
                containerStyle={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: 8,
                }}
                activeColor={theme.colors.border}
              />
            )}
          </View>
        )}

        <View style={styles.filterRow}>
          {/* Current Year Toggle Button */}
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              selectedYear === currentYearStr
                ? {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  }
                : {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
            ]}
            onPress={handleCurrentYearToggle}
          >
            <Icon
              name="calendar-outline"
              size={14}
              color={
                selectedYear === currentYearStr ? '#FFFFFF' : theme.colors.text
              }
            />
            <Text
              style={[
                styles.toggleBtnText,
                {
                  color:
                    selectedYear === currentYearStr
                      ? '#FFFFFF'
                      : theme.colors.text,
                },
              ]}
            >
              {currentYearStr}
            </Text>
          </TouchableOpacity>

          {/* Current Month Toggle Button */}
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              selectedMonth === currentMonthVal
                ? {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  }
                : {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
            ]}
            onPress={handleCurrentMonthToggle}
          >
            <Icon
              name="time-outline"
              size={14}
              color={
                selectedMonth === currentMonthVal
                  ? '#FFFFFF'
                  : theme.colors.text
              }
            />
            <Text
              style={[
                styles.toggleBtnText,
                {
                  color:
                    selectedMonth === currentMonthVal
                      ? '#FFFFFF'
                      : theme.colors.text,
                },
              ]}
              numberOfLines={1}
            >
              Current Month
            </Text>
          </TouchableOpacity>

          {/* Clear Button */}
          <TouchableOpacity
            style={[styles.clearBtn, { borderColor: theme.colors.primary }]}
            onPress={handleClearFilters}
          >
            <Icon
              name="close-circle-outline"
              size={14}
              color={theme.colors.primary}
            />
            <Text
              style={[styles.clearBtnText, { color: theme.colors.primary }]}
            >
              Clear
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quarter Selector Row */}
        <View style={styles.quarterSection}>
          <Text
            style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}
          >
            Quarter
          </Text>
          <View style={styles.quarterRowContainer}>
            {['1', '2', '3', '4'].map(qNum => {
              const isActive = selectedQuarter === qNum;
              return (
                <TouchableOpacity
                  key={qNum}
                  style={[
                    styles.quarterBtn,
                    isActive
                      ? {
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary,
                        }
                      : {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                        },
                  ]}
                  onPress={() => handleQuarterToggle(qNum)}
                >
                  <Text
                    style={[
                      styles.quarterBtnText,
                      { color: isActive ? '#FFFFFF' : theme.colors.text },
                    ]}
                  >
                    {qNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Sales vs Target Table */}
      {isLoading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : data.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.center}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        >
          <Icon
            name="bar-chart-outline"
            size={60}
            color={theme.colors.textSecondary + '40'}
          />
          <Text
            style={[styles.noDataText, { color: theme.colors.textSecondary }]}
          >
            No target details found
          </Text>
        </ScrollView>
      ) : (
        <View style={styles.tableWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={{ minWidth: 435 }}>
              {/* Table Header */}
              <View
                style={[
                  styles.tableHeader,
                  {
                    backgroundColor: theme.colors.primary + '15',
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.columnHeader,
                    styles.colDescription,
                    {
                      color: theme.colors.primary,
                      borderRightColor: theme.colors.border,
                    },
                  ]}
                >
                  Category
                </Text>
                <Text
                  style={[
                    styles.columnHeader,
                    styles.colCell,
                    {
                      color: theme.colors.primary,
                      borderRightColor: theme.colors.border,
                    },
                  ]}
                >
                  Sale
                </Text>
                <Text
                  style={[
                    styles.columnHeader,
                    styles.colCell,
                    {
                      color: theme.colors.primary,
                      borderRightColor: theme.colors.border,
                    },
                  ]}
                >
                  Target
                </Text>

                <Text
                  style={[
                    styles.columnHeader,
                    styles.colCell,
                    {
                      color: theme.colors.primary,
                      borderRightColor: theme.colors.border,
                    },
                  ]}
                >
                  Diff
                </Text>
                <Text
                  style={[
                    styles.columnHeader,
                    styles.colCell,
                    {
                      color: theme.colors.primary,
                      borderRightColor: theme.colors.border,
                    },
                  ]}
                >
                  Ach (%)
                </Text>
                <Text
                  style={[
                    styles.columnHeader,
                    styles.colCellLast,
                    { color: theme.colors.primary },
                  ]}
                >
                  Incentive
                </Text>
              </View>

              {/* Table Body */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[theme.colors.primary]}
                  />
                }
              >
                {data.map((item, index) => {
                  const achvVal = parseFloat(item.achv || 0);
                  const diffVal = parseFloat(item.diff || 0);
                  const saleVal = parseFloat(item.sale || 0);
                  const targetVal = parseFloat(item.target || 0);
                  const incentiveVal = parseFloat(item.total_incentive || 0);
                  return (
                    <View
                      key={`${item.category_id || 'cat'}-${index}`}
                      style={[
                        styles.tableRow,
                        {
                          backgroundColor: theme.colors.surface,
                          borderBottomColor: theme.colors.border,
                        },
                      ]}
                    >
                      {/* Category Title (no category_id) */}
                      <Text
                        style={[
                          styles.categoryTitle,
                          styles.colDescription,
                          {
                            color: theme.colors.text,
                            borderRightColor: theme.colors.border,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {item.description || 'N/A'}
                      </Text>

                      {/* Sale */}
                      <Text
                        style={[
                          styles.cellText,
                          styles.colCell,
                          {
                            color: theme.colors.text,
                            borderRightColor: theme.colors.border,
                          },
                        ]}
                      >
                        {saleVal.toLocaleString(undefined, {
                          maximumFractionDigits: 1,
                        })}
                      </Text>

                      {/* Target */}
                      <Text
                        style={[
                          styles.cellText,
                          styles.colCell,
                          {
                            color: theme.colors.text,
                            borderRightColor: theme.colors.border,
                          },
                        ]}
                      >
                        {targetVal.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </Text>

                      {/* Diff */}
                      <Text
                        style={[
                          styles.cellText,
                          styles.colCell,
                          {
                            color: diffVal >= 0 ? '#10B981' : '#EF4444',
                            fontWeight: '700',
                            borderRightColor: theme.colors.border,
                          },
                        ]}
                      >
                        {diffVal >= 0
                          ? `+${diffVal.toLocaleString(undefined, {
                              maximumFractionDigits: 1,
                            })}`
                          : diffVal.toLocaleString(undefined, {
                              maximumFractionDigits: 1,
                            })}
                      </Text>

                      {/* Ach (%) */}
                      <Text
                        style={[
                          styles.cellText,
                          styles.colCell,
                          {
                            color: achvVal >= 90 ? '#10B981' : '#EF4444',
                            fontWeight: '700',
                            borderRightColor: theme.colors.border,
                          },
                        ]}
                      >
                        {achvVal.toFixed(0)}%
                      </Text>

                      {/* Incentive */}
                      <Text
                        style={[
                          styles.cellText,
                          styles.colCellLast,
                          {
                            color: '#EAB308',
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {incentiveVal.toLocaleString(undefined, {
                          maximumFractionDigits: 1,
                        })}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// Hook utility to safely call useTheme
const themeHook = () => {
  try {
    return useTheme();
  } catch (e) {
    return {
      theme: {
        colors: {
          background: '#F9FAFB',
          surface: '#FFFFFF',
          border: '#E5E7EB',
          text: '#111827',
          textSecondary: '#6B7280',
          primary: '#3B82F6',
        },
      },
    };
  }
};

export default CRMSalesVsTargetScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  salesmanDropdownContainer: {
    marginBottom: 4,
  },
  dropdown: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  dummyCol: {
    flex: 1,
  },
  clearBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  incentiveText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  achvDiffText: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  quarterSection: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  quarterRowContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  quarterBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quarterBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tableWrapper: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  colDescription: {
    width: 120,
    paddingRight: 8,
    borderRightWidth: 1,
  },
  colCell: {
    width: 60,
    textAlign: 'center',
    borderRightWidth: 1,
  },
  colCellLast: {
    width: 75,
    textAlign: 'center',
  },
  cellText: {
    fontSize: 12,
    fontWeight: '500',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noDataText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
  },
});
