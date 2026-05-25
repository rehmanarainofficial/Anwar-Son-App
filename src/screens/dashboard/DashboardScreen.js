import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { DateFilter, DimensionDropdown } from '@components/common';
import { useSelector, useDispatch } from 'react-redux';
import {
  useGetIncomeExpenseMutation,
  useGetFinancialOverviewMutation,
  dashboardApi,
} from '@api/dashboardApi';
import { LoadingSpinner } from '@components/common';



const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DashboardScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const company = useSelector(state => state.auth.company);
  
  // Get cached data from RTK Query cache
  const apiCache = useSelector(state => state.api);
  const cachedIncomeData = apiCache?.queries?.['getIncomeExpense']?.data;
  const cachedFinancialData = apiCache?.queries?.['getFinancialOverview']?.data;
  
  const [getIncomeExpense, { isLoading: isIncomeLoading }] =
    useGetIncomeExpenseMutation();
  const [
    getFinancialOverview,
    { data: financialData, isLoading: isFinancialLoading },
  ] = useGetFinancialOverviewMutation();
  
  // Use cached data if available
  const effectiveFinancialData = financialData || cachedFinancialData;

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [incomeList, setIncomeList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [selectedDimensionId, setSelectedDimensionId] = useState(null);

  // Update selectedDimensionId when route.params change
  useEffect(() => {
    if (route.params?.dimensionId !== undefined) {
      setSelectedDimensionId(route.params.dimensionId);
    }
  }, [route.params?.dimensionId]);

  useEffect(() => {
    if (!company) return;

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setFromDate(thirtyDaysAgo);
    setToDate(today);

    const formatDateForAPI = date => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Only run this exact effect on initial load (when dates are set) or when dimension changes
    const fetchFreshData = () => {
      const formattedFrom = formatDateForAPI(thirtyDaysAgo);
      const formattedTo = formatDateForAPI(today);
      fetchData(formattedFrom, formattedTo);
      getFinancialOverview({ company, dimension_id: selectedDimensionId ?? 0 });
    };

    // If cache available & first load, use it, else fetch fresh
    if (cachedIncomeData && incomeList.length === 0 && !selectedDimensionId) {
      processIncomeData(cachedIncomeData);
    } else {
      fetchFreshData();
    }
  }, [company, getFinancialOverview, selectedDimensionId]);

  // Don't show loader if we already have data (including cache)
  const isLoading = (isIncomeLoading && incomeList.length === 0 && !cachedIncomeData) || 
                    (isFinancialLoading && !effectiveFinancialData);

  const processIncomeData = (response) => {
    if (response.status_income_det === 'true') {
      const transformedIncome = response.data_income_det.map(
        (item, index) => ({
          id: `inc-${index}`,
          title: item.name ? item.name.replace(/&amp;/g, '&') : '',
          amount: Math.abs(parseFloat(item.total)).toLocaleString(),
          date: '',
          account_type: item.account_type,
          icon: 'trending-up-outline',
          color: '#10B981',
        }),
      );
      setIncomeList(transformedIncome);
      const total = response.data_income_det.reduce(
        (acc, item) => acc + Math.abs(parseFloat(item.total)),
        0,
      );
      setTotalIncome(total);
    }

    if (response.status_exp_det === 'true') {
      const transformedExpense = response.data_exp_det.map((item, index) => ({
        id: `exp-${index}`,
        title: item.name ? item.name.replace(/&amp;/g, '&') : '',
        amount: Math.abs(parseFloat(item.total)).toLocaleString(),
        date: '',
        account_type: item.account_type,
        icon: 'trending-down-outline',
        color: '#EF4444',
      }));
      setExpenseList(transformedExpense);
      const total = response.data_exp_det.reduce(
        (acc, item) => acc + Math.abs(parseFloat(item.total)),
        0,
      );
      setTotalExpense(total);
    }
  };

  const fetchData = async (start, end) => {
    try {
      const response = await getIncomeExpense({
        from_date: start,
        to_date: end,
        company: company,
        dimension_id: selectedDimensionId ?? 0,
      }).unwrap();
      
      processIncomeData(response);
    } catch (error) {
      console.log('Dashboard fetch error:', error);
    }
  };

  const handleClearFilter = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setFromDate(thirtyDaysAgo);
    setToDate(today);

    const formatDateForAPI = date => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    fetchData(formatDateForAPI(thirtyDaysAgo), formatDateForAPI(today));
  };

  const handleApplyFilter = () => {
    const formatDateForAPI = date => {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    fetchData(formatDateForAPI(fromDate), formatDateForAPI(toDate));
  };

  const getFormattedAmount = amountStr => {
    if (!amountStr) return '0';
    const num = Math.abs(parseFloat(amountStr));
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const calculateTrend = (curStr, preStr) => {
    const cur = parseFloat(curStr || 0);
    const pre = parseFloat(preStr || 0);

    if (pre === 0 && cur === 0) return { text: '0%', isPositive: true };
    if (pre === 0) return { text: '+100%', isPositive: true };

    const diff = Math.abs(cur) - Math.abs(pre);
    const percentage = (diff / Math.abs(pre)) * 100;

    const isPositive = Math.abs(cur) >= Math.abs(pre);
    const sign = isPositive ? '+' : '';

    return {
      text: `${sign}${percentage.toFixed(1)}%`,
      isPositive,
    };
  };
  const stats = [];
  if (effectiveFinancialData && effectiveFinancialData.slider_data) {
    const sd = effectiveFinancialData.slider_data;

    // Helper to add card
    const addCard = (id, title, icon, color, curStr, preStr) => {
      const trend = calculateTrend(curStr, preStr);
      stats.push({
        id,
        title,
        value: getFormattedAmount(curStr),
        icon,
        color,
        trend: trend.text,
        trendIsPositive: trend.isPositive,
      });
    };
    addCard(
      '1',
      'Cash/Bank',
      'business-outline',
      '#3B82F6',
      sd.cur_m_bank,
      sd.pre_m_bank,
    );
    addCard(
      '2',
      'Receivable',
      'arrow-down-circle-outline',
      '#10B981',
      sd.cur_m_receivable,
      sd.pre_m_receivable,
    );
    addCard(
      '3',
      'Payable',
      'arrow-up-circle-outline',
      '#EF4444',
      sd.cur_m_payable,
      sd.pre_m_payable,
    );
    addCard(
      '4',
      'Inventory Val',
      'cube-outline',
      '#F59E0B',
      sd.cur_m_inventory_val,
      sd.pre_m_inventory_val,
    );
    addCard(
      '5',
      'Income',
      'wallet-outline',
      '#10B981',
      sd.cur_m_income,
      sd.pre_m_income,
    );
    addCard(
      '6',
      'Expense',
      'card-outline',
      '#EF4444',
      sd.cur_m_expense,
      sd.pre_m_expense,
    );
    addCard(
      '7',
      'Revenue',
      'cash-outline',
      '#3B82F6',
      sd.cur_m_revenue,
      sd.pre_m_revenue,
    );
    addCard(
      '8',
      'Equity',
      'pie-chart-outline',
      '#8B5CF6',
      sd.cur_m_equity,
      sd.pre_m_equity,
    );
  }

  const handleListItemPress = item => {
    if (item.account_type) {
      navigation.navigate('AccountDetail', {
        title: item.title,
        accountType: item.account_type,
        initialFromDate: fromDate?.toISOString(),
        initialToDate: toDate?.toISOString(),
        dimensionId: selectedDimensionId,
      });
    }
  };

  const renderTotalRow = (label, value, color) => (
    <View style={[s.totalRow, { borderTopColor: theme.colors.border }]}>
      <Text style={[s.totalLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[s.totalValue, { color: color || theme.colors.text }]}>
        {value.toLocaleString()}
      </Text>
    </View>
  );

  const renderListSection = (title, listData, totalValue, showDifference) => {
    const isExpense = title.toLowerCase().includes('expense');
    const accentColor = isExpense ? '#EF4444' : '#10B981';

    return (
      <View style={s.listSection}>
        <Text style={[s.sectionTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        <View
          style={[
            s.listContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {listData.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                s.listItem,
                index !== listData.length - 1 && {
                  borderBottomColor: theme.colors.border,
                  borderBottomWidth: 1,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => handleListItemPress(item)}
            >
              {/* Left Side: Title Only */}
              <View style={s.listTextContent}>
                <Text
                  style={[s.listItemTitle, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    s.listItemDate,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {item.date}
                </Text>
              </View>

              {/* Right Side: Amount & Icon */}
              <View style={s.listItemRight}>
                <Text style={[s.listItemAmount, { color: item.color }]}>
                  {item.amount}
                </Text>
               
              </View>
            </TouchableOpacity>
          ))}

          {renderTotalRow(`Total ${title}`, totalValue, accentColor)}

          {showDifference &&
            renderTotalRow(
              'Difference (Inc - Exp)',
              totalIncome - totalExpense,
              totalIncome - totalExpense >= 0 ? '#10B981' : '#EF4444',
            )}
        </View>
      </View>
    );
  };

  const handleStatCardPress = stat => {
    if (['Receivable', 'Payable', 'Cash/Bank'].includes(stat.title)) {
      navigation.navigate('FinancialDetail', {
        type: stat.title,
        title: stat.title,
        dimensionId: selectedDimensionId,
      });
    } else if (stat.title === 'Inventory Val') {
      navigation.navigate('InventoryValuation', { dimensionId: selectedDimensionId });
    }
  };

  const s = getStyles(theme);

  return (
    <View style={s.container}>
      {isLoading && (
        <View style={StyleSheet.absoluteFill}>
          <LoadingSpinner />
        </View>
      )}
      <ScrollView
        contentContainerStyle={[s.content, isLoading && { opacity: 0.5 }]}
        showsVerticalScrollIndicator={false}
      >
        <DateFilter
          fromDate={fromDate}
          toDate={toDate}
          onFromDate={setFromDate}
          onToDate={setToDate}
          onClear={handleClearFilter}
          onFilter={handleApplyFilter}
        />

        <View style={{paddingTop: 16, paddingBottom: 16, width: '100%' }}>
          <DimensionDropdown 
            onDimensionSelect={(dimensionId) => {
              navigation.setParams({ dimensionId });
            }} 
          />
        </View>

        {renderListSection('Income', incomeList, totalIncome)}
        {renderListSection('Expense', expenseList, totalExpense, true)}

        <View style={s.overviewHeader}>
          <Text
            style={[
              s.sectionTitle,
              { color: theme.colors.text, marginBottom: 0 },
            ]}
          >
            Financial Overview
          </Text>
          <View
            style={[s.badge, { backgroundColor: theme.colors.success + '15' }]}
          >
            <View
              style={[s.badgeDot, { backgroundColor: theme.colors.success }]}
            />
            <Text style={[s.badgeText, { color: theme.colors.success }]}>
              Up to date
            </Text>
          </View>
        </View>

        <View style={s.statsGrid}>
          {stats.map(stat => (
            <TouchableOpacity
              key={stat.id}
              style={[
                s.statCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => handleStatCardPress(stat)}
              activeOpacity={0.7}
            >
              <View style={[s.iconBox, { backgroundColor: stat.color + '15' }]}>
                <Icon name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text
                style={[s.statValue, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {stat.value}
              </Text>
              <Text
                style={[s.statTitle, { color: theme.colors.textSecondary }]}
              >
                {stat.title}
              </Text>
              <View style={s.trendContainer}>
                <Icon
                  name={stat.trendIsPositive ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={
                    stat.trendIsPositive
                      ? theme.colors.success
                      : theme.colors.error
                  }
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    s.trendText,
                    {
                      color: stat.trendIsPositive
                        ? theme.colors.success
                        : theme.colors.error,
                    },
                  ]}
                >
                  {stat.trend}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
    content: {
      padding: 20,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 14,
    },

    listSection: {
      marginBottom: 24,
    },
    listContainer: {
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    listItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 10,
    },
    listItemRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    listIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listTextContent: {
      flex: 1,
    },
    listItemTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 3,
    },
    listItemDate: {
      fontSize: 11,
      fontWeight: '500',
    },
    listItemAmount: {
      fontSize: 15,
      fontWeight: '800',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statCard: {
      width: (SCREEN_WIDTH - 55) / 2,
      padding: 15,
      borderRadius: 18,
      borderWidth: 1,
      marginBottom: 15,
    },
    iconBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    statValue: {
      fontSize: 17,
      fontWeight: '800',
      marginBottom: 2,
    },
    statTitle: {
      fontSize: 11,
    },
    trendContainer: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    trendText: {
      fontSize: 11,
      fontWeight: '600',
    },
    overviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 4,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderTopWidth: 1,
    },
    totalLabel: {
      fontSize: 13,
      fontWeight: '700',
    },
    totalValue: {
      fontSize: 15,
      fontWeight: '800',
    },
  });

export default DashboardScreen;
