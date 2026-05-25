import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@config/useTheme';
import Toast from 'react-native-toast-message';
import { exportReportToPDF } from '@config/reportHelper';
import { DimensionDropdown, CustomDatePicker } from '@components/common';
import {
  useGetExpenseClaimInquiryMutation,
  useGetViewGLMutation,
  useGetViewDataMutation,
} from '@api/hcmApi';

const getDefaultDateRange = () => {
  const today = new Date();
  const fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
  return { fromDate, toDate: today };
};

export default function ExpenseClaimInquiryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const userData = useSelector(state => state.auth.user);
  const employeeId = userData?.emp_code || userData?.employee_id;

  // Inquiry State
  const [inquiryData, setInquiryData] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { fromDate: defaultFromDate, toDate: defaultToDate } =
    getDefaultDateRange();
  const [filterFromDate, setFilterFromDate] = useState(defaultFromDate);
  const [filterToDate, setFilterToDate] = useState(defaultToDate);
  const [showFilterFromDatePicker, setShowFilterFromDatePicker] =
    useState(false);
  const [showFilterToDatePicker, setShowFilterToDatePicker] = useState(false);
  const [selectedDimensionId, setSelectedDimensionId] = useState(0);

  // RTK Mutations
  const [getExpenseClaimInquiry, { isLoading: inquiryLoading }] =
    useGetExpenseClaimInquiryMutation();
  const [getViewGL] = useGetViewGLMutation();
  const [getViewData] = useGetViewDataMutation();

  useEffect(() => {
    fetchInquiryData();
  }, []);

  const formatDateForApi = date => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const formatNumber = num => {
    if (!num) return '0';
    const parsed = parseFloat(num);
    return isNaN(parsed)
      ? '0'
      : parsed.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const fetchInquiryData = async () => {
    try {
      const response = await getExpenseClaimInquiry({
        from_date: formatDateForApi(filterFromDate),
        to_date: formatDateForApi(filterToDate),
        employee_id: employeeId,
        dimension_id: selectedDimensionId,
      }).unwrap();

      if (response.status === 'true' || response.status === true) {
        setInquiryData(response.data || []);
      } else {
        setInquiryData([]);
      }
    } catch (error) {
      console.log('Inquiry error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error loading expense claims',
      });
      setInquiryData([]);
    }
  };

  const formatDisplayDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleView = async item => {
    setViewLoading(true);
    try {
      const response = await getViewGL({
        trans_no: item.trans_no,
        type: item.type,
        dimension_id: selectedDimensionId,
      }).unwrap();

      navigation.navigate('FinanceViewLedger', {
        glData: response,
        reference: item.reference,
        transNo: item.trans_no,
      });
    } catch (error) {
      console.log('GL View API Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to fetch GL details',
      });
    } finally {
      setViewLoading(false);
    }
  };

  const handlePDF = async item => {
    setPdfLoading(true);
    try {
      const response = await getViewData({
        trans_no: item.trans_no,
        type: item.type,
        dimension_id: selectedDimensionId,
      }).unwrap();

      const data = response;
      const htmlString = `
        <html>
          <body style="font-family: sans-serif; padding: 20px;">
            <h1>Expense Claim Reference: ${item.reference}</h1>
            <p><strong>Name:</strong> ${item.name}</p>
            <p><strong>Total:</strong> Rs. ${formatNumber(item.total || 0)}</p>
          </body>
        </html>
      `;
      await exportReportToPDF(htmlString, item.reference);
    } catch (error) {
      console.log('PDF Download Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Download Failed',
        text2: 'Failed to download PDF',
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const renderInquiryItem = ({ item, index }) => {
    const isApproved = item.approval === '0' || item.approval === 0;

    return (
      <View
        style={[styles.inquiryCard, { backgroundColor: theme.colors.surface }]}
      >
        <View
          style={[
            styles.inquiryHeader,
            { borderBottomColor: theme.colors.border },
          ]}
        >
          <View style={styles.headerLeft}>
            <Text style={[styles.inquiryRef, { color: theme.colors.primary }]}>
              {item.reference || 'N/A'}
            </Text>
            <Text style={[styles.inquiryName, { color: theme.colors.text }]}>
              {item.name || 'N/A'}
            </Text>
          </View>
          <View
            style={[
              styles.approvalBadge,
              isApproved
                ? { backgroundColor: theme.colors.success + '20' }
                : { backgroundColor: theme.colors.error + '20' },
            ]}
          >
            <Ionicons
              name={isApproved ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={isApproved ? theme.colors.success : theme.colors.error}
            />
            <Text
              style={[
                styles.approvalText,
                {
                  color: isApproved ? theme.colors.success : theme.colors.error,
                },
              ]}
            >
              {isApproved ? 'Approved' : 'Unapproved'}
            </Text>
          </View>
        </View>

        <View style={styles.inquiryBody}>
          <View style={styles.inquiryRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.inquiryDateText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {formatDisplayDate(item.ord_date)}
            </Text>
          </View>
          <Text style={[styles.inquiryTotal, { color: theme.colors.success }]}>
            Rs. {formatNumber(item.total || 0)}
          </Text>
        </View>

        <View
          style={[
            styles.inquiryFooter,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: theme.colors.primary + '10' },
            ]}
            onPress={() => handleView(item)}
            disabled={viewLoading}
          >
            {viewLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="eye-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.actionBtnText,
                    { color: theme.colors.primary },
                  ]}
                >
                  View
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: theme.colors.error + '10' },
            ]}
            onPress={() => handlePDF(item)}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <ActivityIndicator size="small" color={theme.colors.error} />
            ) : (
              <>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={theme.colors.error}
                />
                <Text
                  style={[styles.actionBtnText, { color: theme.colors.error }]}
                >
                  PDF
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Expense Claims',
      hideHomeIcon: true,
      headerRight: () => (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ExpenseClaim', { onRefresh: fetchInquiryData })
          }
          style={{ paddingRight: 10 }}
        >
          <Ionicons name="add" color="#FFF" size={28} />
        </TouchableOpacity>
      ),
    });
  });

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >

      <View style={styles.inquiryContainer}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <DimensionDropdown
            onDimensionSelect={dimensionId => {
              setSelectedDimensionId(dimensionId);
            }}
          />
        </View>

        {/* Filter Section */}
        <View
          style={[
            styles.filterCard,
            {
              backgroundColor: theme.colors.surface,
              shadowColor: theme.colors.text,
            },
          ]}
        >
          <View style={styles.filterRow}>
            <View style={styles.filterField}>
              <Text
                style={[
                  styles.filterLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                From:
              </Text>
              <TouchableOpacity
                style={[
                  styles.filterDateBtn,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => setShowFilterFromDatePicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.filterDateText, { color: theme.colors.text }]}
                >
                  {formatDisplayDate(filterFromDate)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filterField}>
              <Text
                style={[
                  styles.filterLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                To:
              </Text>
              <TouchableOpacity
                style={[
                  styles.filterDateBtn,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => setShowFilterToDatePicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.filterDateText, { color: theme.colors.text }]}
                >
                  {formatDisplayDate(filterToDate)}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.filterSearchBtn,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={fetchInquiryData}
            >
              <Ionicons name="search" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Inquiry List */}
        {inquiryLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[styles.loaderText, { color: theme.colors.textSecondary }]}
            >
              Loading expense claims...
            </Text>
          </View>
        ) : inquiryData.length > 0 ? (
          <FlatList
            data={inquiryData}
            keyExtractor={(item, index) => `inquiry-${item.trans_no || index}`}
            renderItem={renderInquiryItem}
            contentContainerStyle={styles.inquiryList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={60}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No expense claims found
            </Text>
            <Text
              style={[
                styles.emptySubText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Try adjusting the date filter or create a new claim
            </Text>
          </View>
        )}

        {/* Filter Date Pickers */}
        <CustomDatePicker
          visible={showFilterFromDatePicker}
          onClose={() => setShowFilterFromDatePicker(false)}
          onSelect={date => {
            setFilterFromDate(date);
            setShowFilterFromDatePicker(false);
          }}
          selectedDate={filterFromDate}
          title="From Date"
        />
        <CustomDatePicker
          visible={showFilterToDatePicker}
          onClose={() => setShowFilterToDatePicker(false)}
          onSelect={date => {
            setFilterToDate(date);
            setShowFilterToDatePicker(false);
          }}
          selectedDate={filterToDate}
          title="To Date"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  newBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 4,
  },
  inquiryContainer: {
    flex: 1,
  },
  filterCard: {
    margin: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterField: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '500',
  },
  filterDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 6,
  },
  filterDateText: {
    fontSize: 13,
  },
  filterSearchBtn: {
    borderRadius: 8,
    padding: 10,
    marginTop: 16,
  },
  inquiryList: {
    padding: 16,
    paddingTop: 8,
  },
  inquiryCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  inquiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  inquiryRef: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  inquiryName: {
    fontSize: 13,
  },
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  approvalText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inquiryBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inquiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inquiryDateText: {
    fontSize: 13,
  },
  inquiryTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  inquiryFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
