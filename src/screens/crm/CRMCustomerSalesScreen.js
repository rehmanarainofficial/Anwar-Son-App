import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useGetSalesTargetCategoryMutation } from '@api/baseApi';
import {
  useGetSalesmanDropdownMutation,
  useGetDebtorsMasterQuery,
  useGetSalesmanProductSalesAverageCustomerMutation,
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
        item.debtor_no !== undefined && item.debtor_no !== null ? item.debtor_no : (
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
      item.salesman_name || item.name || item.description || item.sales_category_name || ''
    );
    return {
      ...item,
      id: String(id),
      description: cleanText(String(description)),
    };
  });
};

const CRMCustomerSalesScreen = () => {
  const { theme } = useTheme();
  const user = useSelector(selectCurrentUser);

  // Toggle filter visibility
  const [showFilters, setShowFilters] = useState(true);

  // Check if salesman dropdown should be shown (only visible if user role_id is 12)
  const showSalesman = String(user?.role_id) === '12';

  // Filter selections
  const [selectedSalesman, setSelectedSalesman] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Dropdown lists
  const [salesmen, setSalesmen] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Data state
  const [analysisData, setAnalysisData] = useState([]);

  const grandTotalSales = useMemo(() => {
    if (!analysisData || analysisData.length === 0) return 0;
    return analysisData.reduce((total, cust) => {
      const custSum = (cust.complete_analysis || []).reduce(
        (sum, i) => sum + parseFloat(i.current_month_sale || 0),
        0,
      );
      return total + custSum;
    }, 0);
  }, [analysisData]);

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Mutations & Queries
  const [getSalesman] = useGetSalesmanDropdownMutation();
  const [getSalesTargetCategory] = useGetSalesTargetCategoryMutation();
  const [getAverageSalesCustomer] = useGetSalesmanProductSalesAverageCustomerMutation();

  // Debtors Master Query for Customer dropdown
  const { data: debtorsRes, isLoading: debtorsLoading } = useGetDebtorsMasterQuery(
    {
      company: user?.company_user_code,
      user_id: user?.company_user_id,
    },
    { skip: !user?.company_user_code || !user?.company_user_id }
  );

  // Populate Customer Dropdown
  useEffect(() => {
    if (debtorsRes) {
      try {
        let dataArray = [];
        let parsedData = debtorsRes;
        if (typeof debtorsRes === 'string') {
          const match = debtorsRes.match(/(\{|\[)[\s\S]*(\}|\])/);
          if (match) {
            parsedData = JSON.parse(match[0]);
          } else {
            parsedData = JSON.parse(debtorsRes);
          }
        }
        if (parsedData && Array.isArray(parsedData.data)) {
          dataArray = parsedData.data;
        } else if (Array.isArray(parsedData)) {
          dataArray = parsedData;
        }
        setCustomers(mapDropdownData(dataArray, 'debtor_no', 'name'));
      } catch (e) {
        console.log('Error parsing debtors master:', e);
      }
    }
  }, [debtorsRes]);

  // Fetch initial filters on mount
  useEffect(() => {
    fetchInitialDropdowns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInitialDropdowns = async () => {
    setInitialLoading(true);
    try {
      const companyCode = user?.company_user_code || '';
      const userId = user?.company_user_id || '';
      const roleId = user?.role_id || '2';

      // 1. Salesman (only fetch if allowed)
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

      // 2. Category
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

  // Fetch average customer sales analysis data based on selected filter values
  const fetchAnalysisData = useCallback(async () => {
    if (initialLoading) return;
    setSubmitting(true);
    try {
      const res = await getAverageSalesCustomer({
        company: user?.company_user_code || '',
        salesman: selectedSalesman || '',
        category_id: selectedCategory || '',
        debtor_no: selectedCustomer || '',
        user_id: user?.company_user_id || '',
      }).unwrap();

      if (res?.status === 'true') {
        setAnalysisData(res.data || []);
      } else {
        setAnalysisData([]);
      }
    } catch (e) {
      console.log('Error fetching customer sales average:', e);
      setAnalysisData([]);
    } finally {
      setSubmitting(false);
    }
  }, [selectedCategory, selectedCustomer, selectedSalesman, getAverageSalesCustomer, user, initialLoading]);

  // Automatically trigger fetch on initial load and when any filter selection changes
  useEffect(() => {
    fetchAnalysisData();
  }, [fetchAnalysisData]);

  const handleReset = () => {
    setSelectedSalesman(null);
    setSelectedCategory(null);
    setSelectedCustomer(null);
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
    if (val === undefined || val === null || val === '' || isNaN(parseFloat(val)) || parseFloat(val) === 0) {
      return '-';
    }
    return parseFloat(val).toFixed(2);
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

    // Calculate Total Sales values across ALL products
    const totalCurrentSale = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.current_month_sale || 0), 0);
    const total6MonthAvg = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.avg_last_6_months || 0), 0);

    const sumCurrent = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.current_month || 0), 0);
    const sumPrevious = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.previous_month || 0), 0);
    const sumM2 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_2 || 0), 0);
    const sumM3 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_3 || 0), 0);
    const sumM4 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_4 || 0), 0);
    const sumM5 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_5 || 0), 0);
    const sumM6 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_6 || 0), 0);
    const sumM7 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_7 || 0), 0);
    const sumM8 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_8 || 0), 0);
    const sumM9 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_9 || 0), 0);
    const sumM10 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_10 || 0), 0);
    const sumM11 = completeAnalysis.reduce((sum, i) => sum + parseFloat(i.month_11 || 0), 0);

    const total12MonthAvg = (sumCurrent + sumPrevious + sumM2 + sumM3 + sumM4 + sumM5 + sumM6 + sumM7 + sumM8 + sumM9 + sumM10 + sumM11) / 12;

    // Group complete_analysis by description/category
    const grouped = {};
    completeAnalysis.forEach(item => {
      const desc = cleanText(item.description) || 'Other';
      if (!grouped[desc]) {
        grouped[desc] = [];
      }
      grouped[desc].push(item);
    });

    // Sort group keys by total group current_month_sale in descending order
    const groupKeys = Object.keys(grouped).sort((a, b) => {
      const totalA = grouped[a].reduce((sum, i) => sum + parseFloat(i.current_month_sale || 0), 0);
      const totalB = grouped[b].reduce((sum, i) => sum + parseFloat(i.current_month_sale || 0), 0);
      return totalB - totalA;
    });

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={[styles.table, { borderColor: theme.colors.border }]}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 180 }]} />
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 85, textAlign: 'center' }]}>Total</Text>
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 85, textAlign: 'center' }]}>6Mo Avg</Text>
            <Text style={[styles.tableHeaderCell, { color: theme.colors.textSecondary, width: 85, textAlign: 'center' }]}>12Mo Avg</Text>
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

          {/* Row 1: Total Sales (purple background) */}
          <View style={[styles.tableRow, { backgroundColor: '#ECE9F8', borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.tableCell, { color: '#000', width: 180, fontWeight: 'bold' }]}>Total Sales</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{totalCurrentSale === 0 ? '-' : totalCurrentSale.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{total6MonthAvg === 0 ? '-' : total6MonthAvg.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{total12MonthAvg === 0 ? '-' : total12MonthAvg.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{sumCurrent === 0 ? '-' : sumCurrent.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{sumPrevious === 0 ? '-' : sumPrevious.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{sumM2 === 0 ? '-' : sumM2.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{sumM3 === 0 ? '-' : sumM3.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{sumM4 === 0 ? '-' : sumM4.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{sumM5 === 0 ? '-' : sumM5.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{sumM6 === 0 ? '-' : sumM6.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{sumM7 === 0 ? '-' : sumM7.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{sumM8 === 0 ? '-' : sumM8.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{sumM9 === 0 ? '-' : sumM9.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{sumM10 === 0 ? '-' : sumM10.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { color: '#000', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{sumM11 === 0 ? '-' : sumM11.toFixed(2)}</Text>
          </View>

          {/* Grouped Rows */}
          {groupKeys.map((desc, groupIdx) => {
            const groupItems = grouped[desc];
            // Calculate sum for group header row
            const grpTotalCurrentSale = groupItems.reduce((sum, i) => sum + parseFloat(i.current_month_sale || 0), 0);
            const grpTotal6MonthAvg = groupItems.reduce((sum, i) => sum + parseFloat(i.avg_last_6_months || 0), 0);
            const grpSumCurrent = groupItems.reduce((sum, i) => sum + parseFloat(i.current_month || 0), 0);
            const grpSumPrevious = groupItems.reduce((sum, i) => sum + parseFloat(i.previous_month || 0), 0);
            const grpSumM2 = groupItems.reduce((sum, i) => sum + parseFloat(i.month_2 || 0), 0);
            const grpSumM3 = groupItems.reduce((sum, i) => sum + parseFloat(i.month_3 || 0), 0);
            const grpSumM4 = groupItems.reduce((sum, i) => sum + parseFloat(i.month_4 || 0), 0);
            const grpSumM5 = groupItems.reduce((sum, i) => sum + parseFloat(i.month_5 || 0), 0);
            const grpSumM6 = groupItems.reduce((sum, i) => sum + parseFloat(i.month_6 || 0), 0);
            const grpSumM7 = groupItems.reduce((sum, i) => sum + parseFloat(i.month_7 || 0), 0);
            const grpSumM8 = groupItems.reduce((sum, i) => sum + parseFloat(i.month_8 || 0), 0);
            const grpSumM9 = groupItems.reduce((sum, i) => sum + parseFloat(i.month_9 || 0), 0);
            const grpSumM10 = groupItems.reduce((sum, i) => sum + parseFloat(i.month_10 || 0), 0);
            const grpSumM11 = groupItems.reduce((sum, i) => sum + parseFloat(i.month_11 || 0), 0);

            const grpTotal12MonthAvg = (grpSumCurrent + grpSumPrevious + grpSumM2 + grpSumM3 + grpSumM4 + grpSumM5 + grpSumM6 + grpSumM7 + grpSumM8 + grpSumM9 + grpSumM10 + grpSumM11) / 12;

            return (
              <React.Fragment key={groupIdx}>
                {/* Group Header Row (light yellow/orange background) */}
                <View style={[styles.tableRow, { backgroundColor: '#FEF3C7', borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.tableCell, { color: '#92400E', width: 180, fontWeight: 'bold' }]}>{desc}</Text>
                  <Text style={[styles.tableCell, { color: '#92400E', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{grpTotalCurrentSale === 0 ? '-' : grpTotalCurrentSale.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, { color: '#92400E', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{grpTotal6MonthAvg === 0 ? '-' : grpTotal6MonthAvg.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, { color: '#92400E', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{grpTotal12MonthAvg === 0 ? '-' : grpTotal12MonthAvg.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, { color: '#92400E', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{grpSumCurrent === 0 ? '-' : grpSumCurrent.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, { color: '#92400E', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{grpSumPrevious === 0 ? '-' : grpSumPrevious.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, { color: '#92400E', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{grpSumM2 === 0 ? '-' : grpSumM2.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, { color: '#92400E', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{grpSumM3 === 0 ? '-' : grpSumM3.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, { color: '#92400E', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{grpSumM4 === 0 ? '-' : grpSumM4.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, { color: '#92400E', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{grpSumM5 === 0 ? '-' : grpSumM5.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, { color: '#92400E', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{grpSumM6 === 0 ? '-' : grpSumM6.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, { color: '#92400E', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{grpSumM7 === 0 ? '-' : grpSumM7.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, { color: '#92400E', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{grpSumM8 === 0 ? '-' : grpSumM8.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, { color: '#92400E', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{grpSumM9 === 0 ? '-' : grpSumM9.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, { color: '#92400E', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{grpSumM10 === 0 ? '-' : grpSumM10.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, { color: '#92400E', width: 85, textAlign: 'center', fontWeight: 'bold' }]}>{grpSumM11 === 0 ? '-' : grpSumM11.toFixed(2)}</Text>
                </View>

                {/* Sub items under group (Individual product codes sorted by total sales desc) */}
                {[...groupItems]
                  .sort((a, b) => parseFloat(b.current_month_sale || 0) - parseFloat(a.current_month_sale || 0))
                  .map((item, index) => {
                  const itCurrent = parseFloat(item.current_month || 0);
                  const itPrevious = parseFloat(item.previous_month || 0);
                  const itM2 = parseFloat(item.month_2 || 0);
                  const itM3 = parseFloat(item.month_3 || 0);
                  const itM4 = parseFloat(item.month_4 || 0);
                  const itM5 = parseFloat(item.month_5 || 0);
                  const itM6 = parseFloat(item.month_6 || 0);
                  const itM7 = parseFloat(item.month_7 || 0);
                  const itM8 = parseFloat(item.month_8 || 0);
                  const itM9 = parseFloat(item.month_9 || 0);
                  const itM10 = parseFloat(item.month_10 || 0);
                  const itM11 = parseFloat(item.month_11 || 0);

                  const it12MonthAvg = (itCurrent + itPrevious + itM2 + itM3 + itM4 + itM5 + itM6 + itM7 + itM8 + itM9 + itM10 + itM11) / 12;

                  return (
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
                        {item.code || 'N/A'}
                      </Text>
                      <Text style={[styles.tableCell, { color: theme.colors.text, width: 85, textAlign: 'center' }]}>
                        {formatTableCellValue(item.current_month_sale)}
                      </Text>
                      <Text style={[styles.tableCell, { color: theme.colors.text, width: 85, textAlign: 'center' }]}>
                        {formatTableCellValue(item.avg_last_6_months)}
                      </Text>
                      <Text style={[styles.tableCell, { color: theme.colors.text, width: 85, textAlign: 'center' }]}>
                        {it12MonthAvg === 0 ? '-' : it12MonthAvg.toFixed(2)}
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
                  );
                })}
              </React.Fragment>
            );
          })}
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

      {initialLoading || debtorsLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Dropdown Filters Panel */}
          {showFilters && (
            <View style={styles.filterPanel}>
              {/* Salesman (only visible if user role_id is 12) */}
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

              {/* Row: Category & Customer */}
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
                  <Text style={[styles.dropdownLabel, { color: theme.colors.textSecondary }]}>Customer</Text>
                  <Dropdown
                    style={[styles.dropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    data={customers}
                    search
                    labelField="description"
                    valueField="id"
                    placeholder="Select Customer"
                    placeholderStyle={{ color: theme.colors.textSecondary }}
                    searchPlaceholder="Search customer..."
                    value={selectedCustomer}
                    onChange={item => setSelectedCustomer(item.id)}
                    selectedTextStyle={{ color: theme.colors.text }}
                    itemTextStyle={{ color: theme.colors.text }}
                    containerStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
                    activeColor={theme.colors.border}
                  />
                </View>
              </View>

              {/* Reset button row */}
              {(selectedSalesman || selectedCategory || selectedCustomer) && (
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
            <>
              {analysisData.filter(cust => cust.complete_analysis && cust.complete_analysis.length > 0).length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
                    No sales average analysis found.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Overall Grand Total Summary Card */}
                  <View
                    style={[
                      styles.grandTotalCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.grandTotalIconBg, { backgroundColor: theme.colors.primary + '15' }]}>
                      <Icon name="calculator-outline" size={22} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.grandTotalLabel, { color: theme.colors.textSecondary }]}>
                        Grand Total
                      </Text>
                      <Text style={[styles.grandTotalValue, { color: theme.colors.primary }]}>
                        {grandTotalSales.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {analysisData.map((cust, index) => {
                    // Only render if complete_analysis has elements
                    if (!cust.complete_analysis || cust.complete_analysis.length === 0) {
                      return null;
                    }

                    const custName = cleanText(cust.br_name) || 'Customer Sales Trend';

                    return (
                      <View key={index} style={styles.analysisContainer}>
                        {/* Section 1: Customer Header & Total Sales Trend Title */}
                        <View style={styles.trendHeaderContainer}>
                          <Text style={[styles.customerHeading, { color: theme.colors.primary }]}>
                            {custName}
                          </Text>
                          <View style={styles.trendHeaderRow}>
                            <View style={[styles.trendIndicator, { backgroundColor: theme.colors.primary }]} />
                            <Text style={[styles.trendTitle, { color: theme.colors.text }]}>TOTAL SALES TREND</Text>
                          </View>
                        </View>

                        {/* Horizontally scrollable grouped products analysis table */}
                        <View style={[styles.tableCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                          {renderTable(cust.complete_analysis)}
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
            </>
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
  grandTotalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  grandTotalIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  analysisContainer: {
    marginTop: 8,
  },
  customerHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
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
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
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
    marginBottom: 24,
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

export default CRMCustomerSalesScreen;
