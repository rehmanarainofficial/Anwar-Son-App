import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useTheme } from '@config/useTheme';
import Toast from 'react-native-toast-message';
import { CustomDatePicker } from '@components/common';
import {
  useGetOutstationExpenseInquiryMutation,
  usePostExpenseApprovalMutation,
} from '@api/hcmApi';
import { useGetViewGLMutation } from '@api/voidApi';

const getDefaultDateRange = () => {
  const today = new Date();
  const fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
  return { fromDate, toDate: today };
};

export default function OutstationExpenseApprovalScreen({ navigation }) {
  const { theme } = useTheme();
  const userData = useSelector(state => state.auth.user);
  const isRole2 =
    userData?.role_id !== undefined &&
    userData?.role_id !== null &&
    (String(userData.role_id) === '2' || Number(userData.role_id) === 2);

  // Tabs: 'manager' | 'accounts'
  const [activeTab, setActiveTab] = useState('manager');

  // Inquiry State
  const [inquiryData, setInquiryData] = useState([]);
  const [loadingTransNo, setLoadingTransNo] = useState(null);
  const [actionLoadingKey, setActionLoadingKey] = useState(null);

  const { fromDate: defaultFromDate, toDate: defaultToDate } =
    getDefaultDateRange();
  const [filterFromDate, setFilterFromDate] = useState(defaultFromDate);
  const [filterToDate, setFilterToDate] = useState(defaultToDate);
  const [showFilterFromDatePicker, setShowFilterFromDatePicker] =
    useState(false);
  const [showFilterToDatePicker, setShowFilterToDatePicker] = useState(false);

  // Mutations
  const [getOutstationExpenseInquiry, { isLoading: inquiryLoading }] =
    useGetOutstationExpenseInquiryMutation();
  const [getViewGL] = useGetViewGLMutation();
  const [postExpenseApproval] = usePostExpenseApprovalMutation();

  const formatDateForApi = date => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const formatNumber = num => {
    if (!num) return '0';
    const parsed = parseFloat(String(num).replace(/,/g, ''));
    return isNaN(parsed)
      ? '0'
      : parsed.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatDisplayDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchInquiryData = useCallback(async () => {
    try {
      const payload = {
        company: 'ANS',
        from_date: formatDateForApi(filterFromDate),
        to_date: formatDateForApi(filterToDate),
        employee_id: String(userData?.employee_id || ''),
        role_id:
          userData?.role_id !== undefined && userData?.role_id !== null
            ? String(userData.role_id)
            : '',
      };

      const response = await getOutstationExpenseInquiry(payload).unwrap();
      const rawList = Array.isArray(response)
        ? response
        : response?.status === 'true' || response?.status === true
        ? response.data || []
        : Array.isArray(response?.data)
        ? response.data
        : [];

      setInquiryData(rawList);
    } catch (error) {
      console.log('--- [OUTSTATION EXPENSE APPROVAL ERROR] ---', error);
      Toast.show({
        type: 'error',
        text1: 'Error loading outstation claims',
      });
      setInquiryData([]);
    }
  }, [filterFromDate, filterToDate, userData, getOutstationExpenseInquiry]);

  useEffect(() => {
    fetchInquiryData();
  }, [fetchInquiryData]);

  const handleView = async item => {
    setLoadingTransNo(item.trans_no);
    try {
      const response = await getViewGL({
        company: 'ANS',
        trans_no: item.trans_no,
        type: item.type,
      }).unwrap();

      navigation.navigate('FinanceViewLedger', {
        glData: response,
        reference: item.reference,
        trans_no: item.trans_no,
        type: item.type,
      });
    } catch (error) {
      console.log('GL View API Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to fetch GL details',
      });
    } finally {
      setLoadingTransNo(null);
    }
  };

  const handleApprovalAction = (item, approvalValue) => {
    const isApprove = approvalValue === '0';
    Alert.alert(
      isApprove ? 'Approve Expense' : 'Unapprove Expense',
      `Are you sure you want to ${
        isApprove ? 'approve' : 'unapprove'
      } this outstation claim (${item.reference || item.trans_no})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isApprove ? 'Approve' : 'Unapprove',
          style: isApprove ? 'default' : 'destructive',
          onPress: async () => {
            const actionKey = `${item.trans_no}_${approvalValue}`;
            setActionLoadingKey(actionKey);
            try {
              const res = await postExpenseApproval({
                company: 'ANS',
                trans_no: item.trans_no,
                type: item.type || '0',
                approval: approvalValue, // '0' for Approved, '1' for Unapproved
              }).unwrap();

              Toast.show({
                type: 'success',
                text1: isApprove ? 'Expense Approved' : 'Expense Unapproved',
                text2:
                  res?.message ||
                  `Outstation claim ${isApprove ? 'approved' : 'unapproved'} successfully.`,
              });
              fetchInquiryData();
            } catch (err) {
              console.log('Outstation approval post error:', err);
              Toast.show({
                type: 'error',
                text1: 'Approval Failed',
                text2: err?.data?.message || 'Could not update approval status.',
              });
            } finally {
              setActionLoadingKey(null);
            }
          },
        },
      ],
    );
  };

  const getApprovalStatus = (val, isAccounts = false) => {
    if (val === null || val === undefined || val === '') {
      return {
        label: isAccounts ? 'Unapproved' : 'Pending',
        isApproved: false,
        color: isAccounts ? '#EF4444' : '#D97706',
        bg: isAccounts ? '#FEE2E2' : '#FEF3C7',
        icon: isAccounts ? 'close-circle' : 'time',
      };
    }
    if (val === '0' || val === 0 || val === 'Approved' || val === 'approved') {
      return {
        label: 'Approved',
        isApproved: true,
        color: '#059669',
        bg: '#D1FAE5',
        icon: 'checkmark-circle',
      };
    }
    return {
      label: 'Unapproved',
      isApproved: false,
      color: '#EF4444',
      bg: '#FEE2E2',
      icon: 'close-circle',
    };
  };

  const isManagerApproved = item =>
    item.manager_approval === '0' ||
    item.manager_approval === 0 ||
    item.manager_approval === 'Approved' ||
    item.manager_approval === 'approved';

  const isAccountsApproved = item =>
    item.approval === '0' ||
    item.approval === 0 ||
    item.approval === 'Approved' ||
    item.approval === 'approved';

  // Tab Filtering
  // 1. Manager Tab: items NOT yet approved by manager
  const managerUnapprovedList = inquiryData.filter(
    item => !isManagerApproved(item),
  );

  // 2. Accounts Tab: items approved by manager BUT NOT yet approved by accounts
  const accountsUnapprovedList = inquiryData.filter(
    item => isManagerApproved(item) && !isAccountsApproved(item),
  );

  const displayedList =
    activeTab === 'accounts' ? accountsUnapprovedList : managerUnapprovedList;

  const totalFuel = displayedList.reduce(
    (sum, item) =>
      sum + (parseFloat(String(item.fuel || 0).replace(/,/g, '')) || 0),
    0,
  );

  const renderCard = ({ item }) => {
    const managerStatus = getApprovalStatus(item.manager_approval, false);
    const accountsStatus = getApprovalStatus(item.approval, true);
    const isActionLoadingApprove =
      actionLoadingKey === `${item.trans_no}_0`;
    const isActionLoadingUnapprove =
      actionLoadingKey === `${item.trans_no}_1`;

    const routeInfo =
      item.from_city && item.to_city
        ? `${item.from_city} ➔ ${item.to_city}`
        : item.from_city_name && item.to_city_name
        ? `${item.from_city_name} ➔ ${item.to_city_name}`
        : '';

    const dateText =
      item.leave_date && item.return_date
        ? `${formatDisplayDate(item.leave_date)} - ${formatDisplayDate(item.return_date)}`
        : formatDisplayDate(item.ord_date || item.trans_date || item.date);

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
              {item.reference || `Claim #${item.trans_no || 'N/A'}`}
            </Text>
            {item.name ? (
              <Text style={[styles.inquiryName, { color: theme.colors.text }]}>
                {item.name}
              </Text>
            ) : null}
            {routeInfo ? (
              <View style={styles.routeRow}>
                <Ionicons
                  name="navigate-outline"
                  size={13}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.routeText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {routeInfo}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.badgesContainer}>
            <View
              style={[
                styles.approvalBadge,
                { backgroundColor: managerStatus.bg },
              ]}
            >
              <Ionicons
                name={managerStatus.icon}
                size={12}
                color={managerStatus.color}
              />
              <Text
                style={[
                  styles.approvalText,
                  { color: managerStatus.color },
                ]}
              >
                Manager: {managerStatus.label}
              </Text>
            </View>

            <View
              style={[
                styles.approvalBadge,
                { backgroundColor: accountsStatus.bg, marginTop: 4 },
              ]}
            >
              <Ionicons
                name={accountsStatus.icon}
                size={12}
                color={accountsStatus.color}
              />
              <Text
                style={[
                  styles.approvalText,
                  { color: accountsStatus.color },
                ]}
              >
                Accounts: {accountsStatus.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.inquiryBody}>
          <View style={{ flex: 1 }}>
            <View style={styles.inquiryRow}>
              <Ionicons
                name="calendar-outline"
                size={15}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.inquiryDateText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {dateText}
              </Text>
            </View>
            {item.fuel ? (
              <View style={[styles.inquiryRow, { marginTop: 4 }]}>
                <Ionicons
                  name="speedometer-outline"
                  size={15}
                  color={theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.inquiryDateText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Fuel: {item.fuel} Ltrs
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            style={[
              styles.inquiryTotal,
              { color: theme.colors.success || '#10b981' },
            ]}
          >
            Rs. {formatNumber(item.total || item.amount || 0)}
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
          {/* View Button */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: theme.colors.primary + '15' },
            ]}
            onPress={() => handleView(item)}
            disabled={loadingTransNo === item.trans_no}
          >
            {loadingTransNo === item.trans_no ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="eye-outline"
                  size={16}
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

          {/* Manager Action Buttons (Only in Manager Tab for role_id 2 / Manager) */}
          {activeTab === 'manager' && isRole2 ? (
            <View style={styles.managerActionRow}>
              {/* Unapprove / Reject Button */}
              <TouchableOpacity
                style={[styles.rejectBtn, { backgroundColor: '#FEE2E2' }]}
                onPress={() => handleApprovalAction(item, '1')}
                disabled={isActionLoadingUnapprove || isActionLoadingApprove}
              >
                {isActionLoadingUnapprove ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Ionicons
                      name="close-circle-outline"
                      size={16}
                      color="#EF4444"
                    />
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>
                      Unapprove
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Approve Button */}
              <TouchableOpacity
                style={[styles.approveBtn, { backgroundColor: '#059669' }]}
                onPress={() => handleApprovalAction(item, '0')}
                disabled={isActionLoadingApprove || isActionLoadingUnapprove}
              >
                {isActionLoadingApprove ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text
                      style={[styles.actionBtnText, { color: '#FFFFFF' }]}
                    >
                      Approve
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Top 2 Tabs */}
      <View
        style={[
          styles.tabContainer,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'manager' && [
              styles.tabButtonActive,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
          onPress={() => setActiveTab('manager')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="person-circle-outline"
            size={18}
            color={
              activeTab === 'manager'
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabButtonText,
              {
                color:
                  activeTab === 'manager'
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
                fontWeight: activeTab === 'manager' ? '800' : '600',
              },
            ]}
          >
            Manager Approval
          </Text>
          {managerUnapprovedList.length > 0 ? (
            <View
              style={[
                styles.tabBadge,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.tabBadgeText}>
                {managerUnapprovedList.length}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'accounts' && [
              styles.tabButtonActive,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
          onPress={() => setActiveTab('accounts')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="card-outline"
            size={18}
            color={
              activeTab === 'accounts'
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabButtonText,
              {
                color:
                  activeTab === 'accounts'
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
                fontWeight: activeTab === 'accounts' ? '800' : '600',
              },
            ]}
          >
            Accounts Approval
          </Text>
          {accountsUnapprovedList.length > 0 ? (
            <View style={[styles.tabBadge, { backgroundColor: '#D97706' }]}>
              <Text style={styles.tabBadgeText}>
                {accountsUnapprovedList.length}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
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

      {/* Summary Row Card (Total Trips & Total Petrol Ltrs) */}
      <View
        style={[
          styles.summaryRowCard,
          {
            backgroundColor: theme.colors.surface,
            shadowColor: theme.colors.text,
          },
        ]}
      >
        <View style={styles.summaryItem}>
          <View
            style={[
              styles.summaryIconBox,
              { backgroundColor: theme.colors.primary + '15' },
            ]}
          >
            <Ionicons
              name="navigate-outline"
              size={16}
              color={theme.colors.primary}
            />
          </View>
          <View>
            <Text
              style={[
                styles.summaryItemLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Total Trips
            </Text>
            <Text
              style={[
                styles.summaryItemValue,
                { color: theme.colors.text },
              ]}
            >
              {displayedList.length}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.summaryDivider,
            { backgroundColor: theme.colors.border },
          ]}
        />

        <View style={styles.summaryItem}>
          <View
            style={[
              styles.summaryIconBox,
              { backgroundColor: '#F59E0B18' },
            ]}
          >
            <Ionicons
              name="speedometer-outline"
              size={16}
              color="#D97706"
            />
          </View>
          <View>
            <Text
              style={[
                styles.summaryItemLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Total Petrol
            </Text>
            <Text
              style={[
                styles.summaryItemValue,
                { color: '#D97706' },
              ]}
            >
              {totalFuel.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}{' '}
              Ltrs
            </Text>
          </View>
        </View>
      </View>

      {/* List Content */}
      {inquiryLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.loaderText, { color: theme.colors.textSecondary }]}
          >
            Loading outstation claims...
          </Text>
        </View>
      ) : displayedList.length > 0 ? (
        <FlatList
          data={displayedList}
          keyExtractor={(item, index) =>
            `outstation-approval-${item.trans_no || index}`
          }
          renderItem={renderCard}
          contentContainerStyle={styles.inquiryList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={inquiryLoading}
              onRefresh={fetchInquiryData}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={inquiryLoading}
              onRefresh={fetchInquiryData}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          <Ionicons
            name="checkmark-done-circle-outline"
            size={60}
            color={theme.colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            No pending claims in {activeTab === 'accounts' ? 'Accounts' : 'Manager'} Approval
          </Text>
          <Text
            style={[
              styles.emptySubText,
              { color: theme.colors.textSecondary },
            ]}
          >
            All outstation claims for the selected date range are up to date.
          </Text>
        </ScrollView>
      )}

      {/* Date Pickers */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomWidth: 3,
  },
  tabButtonText: {
    fontSize: 13,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
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
  summaryRowCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'center',
  },
  summaryIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryItemLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  summaryItemValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    height: 30,
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
    paddingRight: 8,
  },
  inquiryRef: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  inquiryName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  routeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  badgesContainer: {
    alignItems: 'flex-end',
  },
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    gap: 4,
  },
  approvalText: {
    fontSize: 11,
    fontWeight: '700',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  managerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
