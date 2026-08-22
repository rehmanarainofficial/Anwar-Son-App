import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dropdown } from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useTheme } from '@config/useTheme';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@store/slices/authSlice';
import {
  useGetSalesTargetCategoryMutation,
  useGetStockMasterCodeMutation,
} from '@api/baseApi';
import {
  useGetSalesmanDropdownMutation,
  useGetSalesmanProductSalesAverageMutation,
} from '@api/portalApi';

const cleanText = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

const mapDropdownData = (data, valueKey = null, labelKey = null) => {
  return (data || []).map((item, index) => {
    let id = valueKey ? item[valueKey] : (
      item.salesman_code !== undefined && item.salesman_code !== null ? item.salesman_code : (
        item.stock_id !== undefined && item.stock_id !== null ? item.stock_id : (
          item.id !== undefined && item.id !== null ? item.id : (
            item.category_id !== undefined && item.category_id !== null ? item.category_id : null
          )
        )
      )
    );
    if (id === null || id === undefined || id === '') {
      id = String(index);
    }
    const description = labelKey ? item[labelKey] : (
      item.salesman_name || item.description || item.sales_category_name || item.name || ''
    );
    return {
      ...item,
      id: String(id),
      description: cleanText(String(description)),
    };
  });
};

const CRMProductSalesScreen = () => {
  const { theme } = useTheme();
  const user = useSelector(selectCurrentUser);

  // Toggle filter visibility
  const [showFilters, setShowFilters] = useState(true);

  // Check if salesman dropdown should be shown (only visible if user role_id is 12)
  const showSalesman = String(user?.role_id) === '12';

  // Filter selections
  const [selectedSalesman, setSelectedSalesman] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Dropdown lists
  const [salesmen, setSalesmen] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Data state
  const [analysisData, setAnalysisData] = useState([]);

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Mutations
  const [getSalesman] = useGetSalesmanDropdownMutation();
  const [getSalesTargetCategory] = useGetSalesTargetCategoryMutation();
  const [getStockMasterCode] = useGetStockMasterCodeMutation();
  const [getAverageSales] = useGetSalesmanProductSalesAverageMutation();

  // Fetch initial filters on mount
  useEffect(() => {
    fetchInitialDropdowns();
  }, []);

  const fetchInitialDropdowns = async () => {
    setInitialLoading(true);
    try {
      const companyCode = user?.company_user_code || '';
      const userId = user?.company_user_id || '';
      const roleId = user?.role_id || '';

      if (showSalesman) {
        const salesmanRes = await getSalesman({
          user_id: userId,
          company: companyCode,
          role_id: roleId,
        }).unwrap();
        if (salesmanRes?.status === 'true') {
          setSalesmen(mapDropdownData(salesmanRes.data || []));
        }
      }

      const categoryRes = await getSalesTargetCategory({
        company: 'CRM',
        user_id: userId,
      }).unwrap();
      if (categoryRes?.status === 'true') {
        setCategories(mapDropdownData(categoryRes.data || [], 'category_id', 'description'));
      }
    } catch (e) {
      console.log('Error fetching initial filter dropdowns:', e);
      Toast.show({
        type: 'error',
        text1: 'Fetch Error',
        text2: 'Could not load filter options.',
      });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    const fetchCodes = async () => {
      if (!selectedCategory) {
        setProducts([]);
        setSelectedProduct(null);
        return;
      }
      try {
        const res = await getStockMasterCode({
          category_id: selectedCategory,
          company: user?.company_user_code || '',
        }).unwrap();
        if (res?.status === 'true') {
          setProducts(mapDropdownData(res.data || [], 'stock_id', 'stock_id'));
        } else {
          setProducts([]);
        }
        setSelectedProduct(null);
      } catch (err) {
        console.log('Error fetching product codes:', err);
        setProducts([]);
        setSelectedProduct(null);
      }
    };
    fetchCodes();
  }, [selectedCategory, getStockMasterCode, user]);

  const fetchAnalysisData = useCallback(async () => {
    if (initialLoading) return;
    setSubmitting(true);
    try {
      const res = await getAverageSales({
        company: user?.company_user_code || '',
        category_id: selectedCategory || '',
        product_id: selectedProduct || '',
        salesman: selectedSalesman || '',
        user_id: user?.company_user_id || '',
      }).unwrap();

      if (res?.status === 'true') {
        setAnalysisData(res.data || []);
      } else {
        setAnalysisData([]);
      }
    } catch (e) {
      console.log('Error fetching salesman product sales average:', e);
      setAnalysisData([]);
    } finally {
      setSubmitting(false);
    }
  }, [selectedCategory, selectedProduct, selectedSalesman, getAverageSales, user, initialLoading]);

  useEffect(() => {
    fetchAnalysisData();
  }, [fetchAnalysisData]);

  const handleReset = () => {
    setSelectedSalesman(null);
    setSelectedCategory(null);
    setSelectedProduct(null);
  };

  const formatMonthName = (name) => {
    if (!name) return '';
    const parts = name.split('-');
    if (parts.length === 2) {
      const month = parts[0];
      const year = parts[1].substring(2);
      return `${month} ${year}`;
    }
    return name;
  };

  const formatTableCellValue = (val) => {
    if (val === undefined || val === null || val === '' || parseFloat(val) === 0) {
      return '-';
    }
    return parseFloat(val).toFixed(0);
  };

  const renderSummaryCards = (list) => {
    if (!list || list.length === 0) return null;

    const firstItem = list[0];
    const currentMonthLabel = firstItem ? formatMonthName(firstItem.current_month_name) : 'Current Month';

    // Calculate total sums across all customers in complete_analysis
    const totalCurrentMonth = list.reduce((sum, item) => sum + parseFloat(item.current_month || 0), 0);
    const totalPreviousMonth = list.reduce((sum, item) => sum + parseFloat(item.previous_month || 0), 0);
    const total6MonthAvg = list.reduce((sum, item) => sum + parseFloat(item.avg_last_6_months || 0), 0);

    const sumCurrent = totalCurrentMonth;
    const sumPrevious = totalPreviousMonth;
    const sumM2 = list.reduce((sum, item) => sum + parseFloat(item.month_2 || 0), 0);
    const sumM3 = list.reduce((sum, item) => sum + parseFloat(item.month_3 || 0), 0);
    const sumM4 = list.reduce((sum, item) => sum + parseFloat(item.month_4 || 0), 0);
    const sumM5 = list.reduce((sum, item) => sum + parseFloat(item.month_5 || 0), 0);
    const sumM6 = list.reduce((sum, item) => sum + parseFloat(item.month_6 || 0), 0);
    const sumM7 = list.reduce((sum, item) => sum + parseFloat(item.month_7 || 0), 0);
    const sumM8 = list.reduce((sum, item) => sum + parseFloat(item.month_8 || 0), 0);
    const sumM9 = list.reduce((sum, item) => sum + parseFloat(item.month_9 || 0), 0);
    const sumM10 = list.reduce((sum, item) => sum + parseFloat(item.month_10 || 0), 0);
    const sumM11 = list.reduce((sum, item) => sum + parseFloat(item.month_11 || 0), 0);

    const total12MonthAvg = (sumCurrent + sumPrevious + sumM2 + sumM3 + sumM4 + sumM5 + sumM6 + sumM7 + sumM8 + sumM9 + sumM10 + sumM11) / 12;

    // Pct change calculations
    let currentChangePct = 0;
    if (totalPreviousMonth > 0) {
      currentChangePct = ((totalCurrentMonth - totalPreviousMonth) / totalPreviousMonth) * 100;
    }

    let avg6vs12Change = 0;
    if (total12MonthAvg > 0) {
      avg6vs12Change = ((total6MonthAvg - total12MonthAvg) / total12MonthAvg) * 100;
    }

    const first6MonthsAvg = (sumM7 + sumM8 + sumM9 + sumM10 + sumM11 + sumPrevious) / 6;
    let avg12Change = 0;
    if (first6MonthsAvg > 0) {
      avg12Change = ((total12MonthAvg - first6MonthsAvg) / first6MonthsAvg) * 100;
    }

    const renderCard = (title, value, percentage) => {
      const isPositive = percentage >= 0;
      const arrow = isPositive ? '▲' : '▼';
      const absPercent = Math.abs(percentage).toFixed(0);
      const badgeBg = isPositive ? '#E8F5E9' : '#FFEBEE';
      const badgeText = isPositive ? '#2E7D32' : '#C62828';

      return (
        <View style={[styles.summaryCard, { borderColor: theme.colors.border }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
          <Text style={[styles.cardValue, { color: theme.colors.text }]}>{value.toFixed(0)}</Text>
          <View style={[styles.cardBadge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.cardBadgeText, { color: badgeText }]}>
              {arrow} {absPercent}%
            </Text>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.cardsRow}>
        {renderCard(currentMonthLabel, totalCurrentMonth, currentChangePct)}
        {renderCard('6-Month Avg', total6MonthAvg, avg6vs12Change)}
        {renderCard('12-Month Avg', total12MonthAvg, avg12Change)}
      </View>
    );
  };

  const renderTable = (completeAnalysis) => {
    if (!completeAnalysis || completeAnalysis.length === 0) {
      return null;
    }

    const firstItem = completeAnalysis[0];
    const prevMonthName = formatMonthName(firstItem.previous_month_name) || 'Prev Month';
    const currMonthName = formatMonthName(firstItem.current_month_name) || 'Curr Month';
    const m2Name = formatMonthName(firstItem.month_2_name) || 'Month 2';
    const m3Name = formatMonthName(firstItem.month_3_name) || 'Month 3';
    const m4Name = formatMonthName(firstItem.month_4_name) || 'Month 4';
    const m5Name = formatMonthName(firstItem.month_5_name) || 'Month 5';
    const m6Name = formatMonthName(firstItem.month_6_name) || 'Month 6';
    const m7Name = formatMonthName(firstItem.month_7_name) || 'Month 7';
    const m8Name = formatMonthName(firstItem.month_8_name) || 'Month 8';
    const m9Name = formatMonthName(firstItem.month_9_name) || 'Month 9';
    const m10Name = formatMonthName(firstItem.month_10_name) || 'Month 10';
    const m11Name = formatMonthName(firstItem.month_11_name) || 'Month 11';

    // Calculate Total Sales Row values
    const totalCurrent = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.current_month || 0), 0);
    const totalPrevious = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.previous_month || 0), 0);
    const totalM2 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_2 || 0), 0);
    const totalM3 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_3 || 0), 0);
    const totalM4 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_4 || 0), 0);
    const totalM5 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_5 || 0), 0);
    const totalM6 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_6 || 0), 0);
    const totalM7 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_7 || 0), 0);
    const totalM8 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_8 || 0), 0);
    const totalM9 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_9 || 0), 0);
    const totalM10 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_10 || 0), 0);
    const totalM11 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_11 || 0), 0);

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={[styles.table, { borderColor: theme.colors.border }]}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 180 }]} />
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 85, textAlign: 'center' }]}>{currMonthName}</Text>
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 85, textAlign: 'center' }]}>{prevMonthName}</Text>
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 85, textAlign: 'center' }]}>{m2Name}</Text>
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 85, textAlign: 'center' }]}>{m3Name}</Text>
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 85, textAlign: 'center' }]}>{m4Name}</Text>
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 85, textAlign: 'center' }]}>{m5Name}</Text>
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 85, textAlign: 'center' }]}>{m6Name}</Text>
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 85, textAlign: 'center' }]}>{m7Name}</Text>
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 85, textAlign: 'center' }]}>{m8Name}</Text>
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 85, textAlign: 'center' }]}>{m9Name}</Text>
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 85, textAlign: 'center' }]}>{m10Name}</Text>
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 85, textAlign: 'center' }]}>{m11Name}</Text>
          </View>

          {/* Row 1: Total Sales (Highlighted background) */}
          <View style={[styles.tableRow, { backgroundColor: '#ECE9F8', borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.tableCell, { color: '#000', width: 180, fontWeight: 'bold' }]}>Total Sales</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{totalCurrent === 0 ? '-' : totalCurrent.toFixed(0)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{totalPrevious === 0 ? '-' : totalPrevious.toFixed(0)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{totalM2 === 0 ? '-' : totalM2.toFixed(0)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{totalM3 === 0 ? '-' : totalM3.toFixed(0)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{totalM4 === 0 ? '-' : totalM4.toFixed(0)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{totalM5 === 0 ? '-' : totalM5.toFixed(0)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{totalM6 === 0 ? '-' : totalM6.toFixed(0)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{totalM7 === 0 ? '-' : totalM7.toFixed(0)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{totalM8 === 0 ? '-' : totalM8.toFixed(0)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{totalM9 === 0 ? '-' : totalM9.toFixed(0)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{totalM10 === 0 ? '-' : totalM10.toFixed(0)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{totalM11 === 0 ? '-' : totalM11.toFixed(0)}</Text>
          </View>

          {/* Other rows (Customers) */}
          {completeAnalysis.map((item, index) => (
            <View 
              key={index} 
              style={[
                styles.tableRow, 
                { 
                  backgroundColor: theme.colors.surface,
                  borderBottomColor: theme.colors.border 
                }
              ]}
            >
              <Text style={[styles.tableCell, { color: theme.colors.text, width: 180, fontWeight: '500' }]} numberOfLines={2}>
                {item.customer_name || item.product_name || item.stock_id || 'N/A'}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, width: 85, textAlign: 'center' }]}>
                {formatTableCellValue(item.current_month)}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, width: 85, textAlign: 'center' }]}>
                {formatTableCellValue(item.previous_month)}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, width: 85, textAlign: 'center' }]}>
                {formatTableCellValue(item.month_2)}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, width: 85, textAlign: 'center' }]}>
                {formatTableCellValue(item.month_3)}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, width: 85, textAlign: 'center' }]}>
                {formatTableCellValue(item.month_4)}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, width: 85, textAlign: 'center' }]}>
                {formatTableCellValue(item.month_5)}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, width: 85, textAlign: 'center' }]}>
                {formatTableCellValue(item.month_6)}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, width: 85, textAlign: 'center' }]}>
                {formatTableCellValue(item.month_7)}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, width: 85, textAlign: 'center' }]}>
                {formatTableCellValue(item.month_8)}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, width: 85, textAlign: 'center' }]}>
                {formatTableCellValue(item.month_9)}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, width: 85, textAlign: 'center' }]}>
                {formatTableCellValue(item.month_10)}
              </Text>
              <Text style={[styles.tableCell, { color: theme.colors.text, width: 85, textAlign: 'center' }]}>
                {formatTableCellValue(item.month_11)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      {/* Sticky Show/Hide Filters Toggle Button */}
      <View style={[styles.toggleContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowFilters(!showFilters)}
          style={styles.toggleButton}
        >
          <View style={styles.toggleLeft}>
            <Icon name="funnel-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.toggleText, { color: theme.colors.text }]}>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Text>
          </View>
          <Icon
            name={showFilters ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={18}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {initialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Dropdown Filters Panel */}
          {showFilters && (
            <View style={styles.filterPanel}>
              {/* Salesman (only visible if login user ID has/is 12) */}
              {showSalesman && (
                <View style={styles.dropdownWrapper}>
                  <Text style={[styles.dropdownLabel, { color: theme.colors.textSecondary }]}>Salesman</Text>
                  <Dropdown
                    style={[styles.dropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    data={salesmen}
                    search
                    labelField="description"
                    valueField="id"
                    placeholder="Select Salesman"
                    placeholderStyle={{ color: theme.colors.textSecondary }}
                    searchPlaceholder="Search salesman..."
                    value={selectedSalesman}
                    onChange={item => setSelectedSalesman(item.id)}
                    selectedTextStyle={{ color: theme.colors.text }}
                    itemTextStyle={{ color: theme.colors.text }}
                    containerStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
                    activeColor={theme.colors.border}
                  />
                </View>
              )}

              {/* Row: Category & Code / Reset */}
              <View style={styles.filterRow}>
                <View style={styles.flex1}>
                  <Text style={[styles.dropdownLabel, { color: theme.colors.textSecondary }]}>Category</Text>
                  <Dropdown
                    style={[styles.dropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    data={categories}
                    search
                    labelField="description"
                    valueField="id"
                    placeholder="Select Category"
                    placeholderStyle={{ color: theme.colors.textSecondary }}
                    searchPlaceholder="Search category..."
                    value={selectedCategory}
                    onChange={item => setSelectedCategory(item.id)}
                    selectedTextStyle={{ color: theme.colors.text }}
                    itemTextStyle={{ color: theme.colors.text }}
                    containerStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
                    activeColor={theme.colors.border}
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={[styles.dropdownLabel, { color: theme.colors.textSecondary }]}>Code</Text>
                  <Dropdown
                    style={[styles.dropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    data={products}
                    search
                    labelField="description"
                    valueField="id"
                    placeholder="Select Code"
                    placeholderStyle={{ color: theme.colors.textSecondary }}
                    searchPlaceholder="Search code..."
                    value={selectedProduct}
                    onChange={item => setSelectedProduct(item.id)}
                    selectedTextStyle={{ color: theme.colors.text }}
                    itemTextStyle={{ color: theme.colors.text }}
                    containerStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
                    activeColor={theme.colors.border}
                  />
                </View>
              </View>

              {/* Reset button row */}
              {(selectedSalesman || selectedCategory || selectedProduct) && (
                <TouchableOpacity
                  style={[styles.btnReset, { borderColor: theme.colors.primary }]}
                  onPress={handleReset}
                >
                  <Text style={[styles.btnResetText, { color: theme.colors.primary }]}>Reset Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Submitting Loading indicator */}
          {submitting ? (
            <View style={styles.loaderSpacing}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            (() => {
              const allCompleteAnalysis = (analysisData || []).reduce((acc, prod) => {
                if (prod && Array.isArray(prod.complete_analysis)) {
                  const items = prod.complete_analysis.map(item => ({
                    ...item,
                    product_name: prod.description || prod.stock_id || prod.product_name || item.product_name,
                  }));
                  return acc.concat(items);
                }
                return acc;
              }, []);

              if (allCompleteAnalysis.length === 0) {
                return (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
                      No sales average analysis found.
                    </Text>
                  </View>
                );
              }

              return (
                <View style={styles.analysisContainer}>
                  {/* Section 1: Summary Cards dynamically populated for all data */}
                  {renderSummaryCards(allCompleteAnalysis)}

                  {/* Section 2: Monthly Trend Table Header & Layout */}
                  <View style={styles.trendHeaderContainer}>
                    <View style={styles.trendHeaderRow}>
                      <View style={[styles.trendIndicator, { backgroundColor: theme.colors.primary }]} />
                      <Text style={[styles.trendTitle, { color: theme.colors.text }]}>Monthly trend</Text>
                    </View>
                    <Text style={[styles.trendSubtitle, { color: theme.colors.textSecondary }]}>
                      Scroll sideways once — every row moves together
                    </Text>
                  </View>

                  {/* Horizontally scrollable analysis table containing all combined data */}
                  <View style={[styles.tableCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    {renderTable(allCompleteAnalysis)}
                  </View>
                </View>
              );
            })()
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleContainer: {
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 10,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  filterPanel: {
    gap: 12,
    marginBottom: 20,
  },
  dropdownWrapper: {
    width: '100%',
  },
  dropdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  dropdown: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  btnReset: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  btnResetText: {
    fontSize: 14,
    fontWeight: '700',
  },
  analysisContainer: {
    marginTop: 8,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  trendHeaderContainer: {
    marginBottom: 12,
    marginTop: 8,
  },
  trendHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  trendIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  trendSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  tableCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 20,
  },
  table: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  tableHeader: {
    borderBottomWidth: 1,
  },
  tableHeaderCell: {
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  tableCell: {
    fontSize: 12,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  loaderSpacing: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CRMProductSalesScreen;
