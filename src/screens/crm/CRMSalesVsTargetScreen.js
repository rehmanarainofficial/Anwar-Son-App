import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TextInput,
} from 'react-native';
import { useTheme } from '@config/useTheme';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@store/slices/authSlice';
import Icon from 'react-native-vector-icons/Ionicons';
import { Dropdown } from 'react-native-element-dropdown';
import {
  useGetSalesTargetMutation,
  useGetQuarterDropdownMutation,
  useGetYearsDropdownMutation,
  useGetMonthDropdownMutation,
} from '@api/portalApi';

const { width } = Dimensions.get('window');

const CRMSalesVsTargetScreen = ({ navigation }) => {
  const { theme } = themeHook();
  const user = useSelector(selectCurrentUser);
  const [getSalesTarget, { isLoading }] = useGetSalesTargetMutation();
  const [getQuarterDropdown] = useGetQuarterDropdownMutation();
  const [getYearsDropdown] = useGetYearsDropdownMutation();
  const [getMonthDropdown] = useGetMonthDropdownMutation();

  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown list states
  const [yearsList, setYearsList] = useState([]);
  const [monthsList, setMonthsList] = useState([]);
  const [quartersList, setQuartersList] = useState([]);

  // Selected filter states
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [isDropdownsLoading, setIsDropdownsLoading] = useState(false);

  const fetchDropdowns = async () => {
    try {
      setIsDropdownsLoading(true);
      const companyCode = user?.company_user_code || '';
      const userId = user?.id || '';

      console.log('fetchDropdowns: Started fetching with company: CRM and user_id:', userId);

      let defaultYearId = null;
      let defaultMonthId = null;

      // 1. Fetch Years Dropdown
      try {
        console.log('getYearsDropdown: Sending request...');
        const yearsRes = await getYearsDropdown({ company: 'CRM', user_id: userId }).unwrap();
        console.log('getYearsDropdown: Received response:', JSON.stringify(yearsRes));
        if (yearsRes && String(yearsRes.status) === 'true') {
          const yearsData = yearsRes.data || [];
          setYearsList(yearsData);
          
          const currentYearStr = new Date().getFullYear().toString();
          const foundYear = yearsData.find(item => String(item.year) === currentYearStr);
          if (foundYear) {
            defaultYearId = foundYear.id;
            setSelectedYear(defaultYearId);
            console.log('getYearsDropdown: Default selected year set to id:', defaultYearId, '(', currentYearStr, ')');
          } else {
            console.log('getYearsDropdown: Current year', currentYearStr, 'not found in response data.');
          }
        } else {
          console.log('getYearsDropdown: Response status is not true:', yearsRes?.status);
        }
      } catch (err) {
        console.log('getYearsDropdown: Fetch failed with error:', err);
      }

      // 2. Fetch Months Dropdown
      try {
        console.log('getMonthDropdown: Sending request...');
        const monthsRes = await getMonthDropdown({ company: 'CRM', user_id: userId }).unwrap();
        console.log('getMonthDropdown: Received response:', JSON.stringify(monthsRes));
        if (monthsRes && String(monthsRes.status) === 'true') {
          const monthsData = monthsRes.data || [];
          setMonthsList(monthsData);
          
          const currentMonthVal = (new Date().getMonth() + 1).toString();
          const foundMonth = monthsData.find(item => String(item.id) === currentMonthVal);
          if (foundMonth) {
            defaultMonthId = foundMonth.id;
            setSelectedMonth(defaultMonthId);
            console.log('getMonthDropdown: Default selected month set to id:', defaultMonthId, '(', currentMonthVal, ')');
          } else {
            console.log('getMonthDropdown: Current month id', currentMonthVal, 'not found in response data.');
          }
        } else {
          console.log('getMonthDropdown: Response status is not true:', monthsRes?.status);
        }
      } catch (err) {
        console.log('getMonthDropdown: Fetch failed with error:', err);
      }

      // 3. Fetch Quarters Dropdown
      try {
        console.log('getQuarterDropdown: Sending request...');
        const quartersRes = await getQuarterDropdown({ company: 'CRM', user_id: userId }).unwrap();
        console.log('getQuarterDropdown: Received response:', JSON.stringify(quartersRes));
        if (quartersRes && String(quartersRes.status) === 'true') {
          const quartersData = quartersRes.data || [];
          setQuartersList(quartersData);
          console.log('getQuarterDropdown: Loaded quarters list size:', quartersData.length);
        } else {
          console.log('getQuarterDropdown: Response status is not true:', quartersRes?.status);
        }
      } catch (err) {
        console.log('getQuarterDropdown: Fetch failed with error:', err);
      }

      await fetchTargetData(defaultYearId, defaultMonthId, null);
    } catch (err) {
      console.log('Error inside fetchDropdowns:', err);
      await fetchTargetData(null, null, null);
    } finally {
      setIsDropdownsLoading(false);
    }
  };

  const fetchTargetData = async (y = selectedYear, m = selectedMonth, q = selectedQuarter) => {
    try {
      const params = {
        user_id: user?.id || '',
        company: user?.company_user_code || '',
        sub_user_id: user?.company_user_id || '',
      };
      if (y !== undefined && y !== null) params.years = y;
      if (m !== undefined && m !== null) params.month = m;
      if (q !== undefined && q !== null) params.quater = q;

      const response = await getSalesTarget(params).unwrap();

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
      fetchDropdowns();
    }
  }, [user?.company_user_code, user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const companyCode = user?.company_user_code || '';
      const userId = user?.id || '';

      const [yearsRes, monthsRes, quartersRes] = await Promise.all([
        getYearsDropdown({ company: 'CRM', user_id: userId }).unwrap(),
        getMonthDropdown({ company: 'CRM', user_id: userId }).unwrap(),
        getQuarterDropdown({ company: 'CRM', user_id: userId }).unwrap(),
      ]);

      if (yearsRes && String(yearsRes.status) === 'true') {
        setYearsList(yearsRes.data || []);
      }
      if (monthsRes && String(monthsRes.status) === 'true') {
        setMonthsList(monthsRes.data || []);
      }
      if (quartersRes && String(quartersRes.status) === 'true') {
        setQuartersList(quartersRes.data || []);
      }
    } catch (err) {
      console.log('Error refreshing dropdowns:', err);
    }
    
    await fetchTargetData(selectedYear, selectedMonth, selectedQuarter);
    setRefreshing(false);
  };

  const handleYearChange = (yearVal) => {
    setSelectedYear(yearVal);
    fetchTargetData(yearVal, selectedMonth, selectedQuarter);
  };

  const handleMonthChange = (monthVal) => {
    setSelectedMonth(monthVal);
    fetchTargetData(selectedYear, monthVal, selectedQuarter);
  };

  const handleQuarterChange = (quarterVal) => {
    setSelectedQuarter(quarterVal);
    fetchTargetData(selectedYear, selectedMonth, quarterVal);
  };

  const handleClearFilters = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedQuarter(null);
    fetchTargetData(null, null, null);
  };

  // Search filter
  const filteredData = data.filter(item =>
    (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Totals calculations
  const totals = filteredData.reduce(
    (acc, curr) => {
      acc.target += parseFloat(curr.target || 0);
      acc.sale += parseFloat(curr.sale || 0);
      acc.diff += parseFloat(curr.diff || 0);
      return acc;
    },
    { target: 0, sale: 0, diff: 0 }
  );

  const totalAchv = totals.target > 0 ? (totals.sale / totals.target) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Cards Summary */}
      <View style={styles.topSummaryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.iconBg, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name="locate-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total Target</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {totals.target.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.iconBg, { backgroundColor: '#10B98115' }]}>
              <Icon name="trending-up-outline" size={20} color="#10B981" />
            </View>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total Sales</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              {totals.sale.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.iconBg, { backgroundColor: totalAchv >= 90 ? '#10B98115' : '#EF444415' }]}>
              <Icon name="pie-chart-outline" size={20} color={totalAchv >= 90 ? '#10B981' : '#EF4444'} />
            </View>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Overall Achivement</Text>
            <Text style={[styles.summaryValue, { color: totalAchv >= 90 ? '#10B981' : '#EF4444' }]}>
              {totalAchv.toFixed(1)}%
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.iconBg, { backgroundColor: totals.diff >= 0 ? '#10B98115' : '#EF444415' }]}>
              <Icon name="git-compare-outline" size={20} color={totals.diff >= 0 ? '#10B981' : '#EF4444'} />
            </View>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total Diff</Text>
            <Text style={[styles.summaryValue, { color: totals.diff >= 0 ? '#10B981' : '#EF4444' }]}>
              {totals.diff.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Dropdown Filters */}
      <View style={styles.filtersWrapper}>
        {isDropdownsLoading ? (
          <View style={[styles.dropdownLoaderContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary, marginLeft: 8 }]}>
              Loading filters...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.filterRow}>
              <View style={styles.filterCol}>
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Year</Text>
                <Dropdown
                  style={[
                    styles.filterDropdown,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                  data={yearsList}
                  labelField="year"
                  valueField="id"
                  placeholder="Select Year"
                  placeholderStyle={{ color: theme.colors.textSecondary, fontSize: 13 }}
                  value={selectedYear}
                  onChange={item => handleYearChange(item.id)}
                  selectedTextStyle={{ color: theme.colors.text, fontSize: 13, fontWeight: '500' }}
                  itemTextStyle={{ color: theme.colors.text, fontSize: 13 }}
                  containerStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 10 }}
                  activeColor={theme.colors.border + '50'}
                />
              </View>
              <View style={styles.filterCol}>
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Month</Text>
                <Dropdown
                  style={[
                    styles.filterDropdown,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                  data={monthsList}
                  labelField="description"
                  valueField="id"
                  placeholder="Select Month"
                  placeholderStyle={{ color: theme.colors.textSecondary, fontSize: 13 }}
                  value={selectedMonth}
                  onChange={item => handleMonthChange(item.id)}
                  selectedTextStyle={{ color: theme.colors.text, fontSize: 13, fontWeight: '500' }}
                  itemTextStyle={{ color: theme.colors.text, fontSize: 13 }}
                  containerStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 10 }}
                  activeColor={theme.colors.border + '50'}
                />
              </View>
            </View>

            <View style={styles.filterRow}>
              <View style={styles.filterCol}>
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Quarter</Text>
                <Dropdown
                  style={[
                    styles.filterDropdown,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                  data={quartersList}
                  labelField="description"
                  valueField="combo_code"
                  placeholder="Select Quarter"
                  placeholderStyle={{ color: theme.colors.textSecondary, fontSize: 13 }}
                  value={selectedQuarter}
                  onChange={item => handleQuarterChange(item.combo_code)}
                  selectedTextStyle={{ color: theme.colors.text, fontSize: 13, fontWeight: '500' }}
                  itemTextStyle={{ color: theme.colors.text, fontSize: 13 }}
                  containerStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 10 }}
                  activeColor={theme.colors.border + '50'}
                />
              </View>
              {selectedYear || selectedMonth || selectedQuarter ? (
                <TouchableOpacity
                  style={[styles.clearBtn, { borderColor: theme.colors.primary }]}
                  onPress={handleClearFilters}>
                  <Icon name="close-circle-outline" size={16} color={theme.colors.primary} />
                  <Text style={[styles.clearBtnText, { color: theme.colors.primary }]}>Clear</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.dummyCol} />
              )}
            </View>
          </>
        )}
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Icon name="search-outline" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search categories..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sales vs Target Table */}
      {isLoading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredData.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.center}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}>
          <Icon name="bar-chart-outline" size={60} color={theme.colors.textSecondary + '40'} />
          <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>No target details found</Text>
        </ScrollView>
      ) : (
        <View style={styles.tableWrapper}>
          {/* Table Header */}
          <View style={[styles.tableHeader, { backgroundColor: theme.colors.primary + '15', borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.columnHeader, styles.colCategory, { color: theme.colors.primary }]}>Category</Text>
            <Text style={[styles.columnHeader, styles.colMiddle, { color: theme.colors.primary }]}>Actual Vs Target</Text>
            <Text style={[styles.columnHeader, styles.colRight, { color: theme.colors.primary }]}>Ach/ Diff</Text>
          </View>

          {/* Table Body */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}>
            {filteredData.map((item, index) => {
              const achvVal = parseFloat(item.achv || 0);
              const diffVal = parseFloat(item.diff || 0);
              return (
                <View
                  key={item.category_id || index}
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor: theme.colors.surface,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}>
                  {/* Category Name */}
                  <View style={styles.colCategory}>
                    <Text style={[styles.categoryTitle, { color: theme.colors.text }]} numberOfLines={2}>
                      {item.description || 'N/A'}
                    </Text>
                    <Text style={[styles.categoryId, { color: theme.colors.textSecondary }]}>
                      ID: {item.category_id || '-'}
                    </Text>
                  </View>

                  {/* Actual Vs Target */}
                  <View style={styles.colMiddle}>
                    <Text style={[styles.saleText, { color: theme.colors.text }]}>
                      {parseFloat(item.sale || 0).toLocaleString()}/{parseFloat(item.target || 0).toLocaleString()}
                    </Text>
                    {selectedQuarter && (
                      <Text style={[styles.incentiveText, { color: '#EAB308', fontSize: 12, fontWeight: '700', marginTop: 4 }]}>
                        Incentive: {item.total_incentive || '0'}
                      </Text>
                    )}
                  </View>

                  {/* Ach/ Diff */}
                  <View style={styles.colRight}>
                    <Text style={[styles.achvDiffText, { color: diffVal >= 0 ? '#10B981' : '#EF4444', fontWeight: '700', fontSize: 14 }]}>
                      {achvVal.toFixed(0)}% / {diffVal >= 0 ? `+${diffVal.toLocaleString()}` : diffVal.toLocaleString()}
                    </Text>
                    <View style={styles.achvContainer}>
                      {/* Micro achievement bar */}
                      <View style={[styles.progressTrack, { backgroundColor: theme.colors.border, width: 70 }]}>
                        <View
                          style={[
                            styles.progressBar,
                            {
                              width: `${Math.min(Math.max(achvVal, 0), 100)}%`,
                              backgroundColor: achvVal >= 90 ? '#10B981' : '#EF4444',
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
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
  dropdownLoaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  filterCol: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  filterDropdown: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
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
  dummyCol: {
    flex: 1,
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
  topSummaryContainer: {
    paddingVertical: 12,
  },
  horizontalScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryCard: {
    width: width * 0.38,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'flex-start',
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    padding: 0,
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
    fontSize: 14,
    fontWeight: '700',
  },
  categoryId: {
    fontSize: 11,
    marginTop: 2,
  },
  saleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  targetText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  diffText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  achvContainer: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  achvText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    width: 60,
    height: 3,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  colCategory: {
    flex: 2.2,
  },
  colMiddle: {
    flex: 1.6,
    textAlign: 'left',
  },
  colRight: {
    flex: 1.6,
    alignItems: 'flex-end',
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
