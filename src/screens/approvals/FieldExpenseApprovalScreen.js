import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
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
  Modal,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useTheme } from '@config/useTheme';
import Toast from 'react-native-toast-message';
import { CustomDatePicker } from '@components/common';
import {
  useGetFieldExpensePaymentsInquiryMutation,
  usePostExpenseApprovalMutation,
} from '@api/hcmApi';
import { useGetViewGLMutation } from '@api/voidApi';

const getDefaultDateRange = () => {
  const today = new Date();
  const fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
  return { fromDate, toDate: today };
};

export default function FieldExpenseApprovalScreen({ navigation, route }) {
  const { theme } = useTheme();
  const userData = useSelector(state => state.auth.user);

  const initialCategory = route?.params?.selectedCategory || 'All';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const [statusFilter, setStatusFilter] = useState('pending');

  // Inquiry State
  const [inquiryData, setInquiryData] = useState([]);
  const [loadingTransNo, setLoadingTransNo] = useState(null);
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [expandedTransNos, setExpandedTransNos] = useState(new Set());
  const [previewAttachment, setPreviewAttachment] = useState(null);

  const { fromDate: defaultFromDate, toDate: defaultToDate } =
    getDefaultDateRange();
  const [filterFromDate, setFilterFromDate] = useState(defaultFromDate);
  const [filterToDate, setFilterToDate] = useState(defaultToDate);
  const [showFilterFromDatePicker, setShowFilterFromDatePicker] =
    useState(false);
  const [showFilterToDatePicker, setShowFilterToDatePicker] = useState(false);

  // Mutations
  const [getFieldExpensePaymentsInquiry, { isLoading: inquiryLoading }] =
    useGetFieldExpensePaymentsInquiryMutation();
  const [getViewGL] = useGetViewGLMutation();
  const [postExpenseApproval] = usePostExpenseApprovalMutation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title:
        selectedCategory && selectedCategory !== 'All'
          ? `${selectedCategory} Approvals`
          : 'All Expense Approvals',
    });
  }, [navigation, selectedCategory]);

  const formatDateForApi = date => {
    if (!date) return new Date().toISOString().split('T')[0];
    const d = new Date(date);
    return isNaN(d.getTime())
      ? new Date().toISOString().split('T')[0]
      : d.toISOString().split('T')[0];
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
    if (isNaN(date.getTime())) return String(dateString);
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
        employee_id: String(userData?.employee_id || userData?.id || ''),
      };

      const response = await getFieldExpensePaymentsInquiry(payload).unwrap();
      const rawList = Array.isArray(response)
        ? response
        : response?.status === 'true' || response?.status === true
        ? response.data || []
        : Array.isArray(response?.data)
        ? response.data
        : [];

      setInquiryData(rawList);
    } catch (error) {
      console.log('--- [FIELD EXPENSE APPROVAL ERROR] ---', error);
      Toast.show({
        type: 'error',
        text1: 'Error loading expenses',
      });
      setInquiryData([]);
    }
  }, [filterFromDate, filterToDate, userData, getFieldExpensePaymentsInquiry]);

  useEffect(() => {
    fetchInquiryData();
  }, [fetchInquiryData]);

  const handleView = async item => {
    setLoadingTransNo(item.trans_no);
    try {
      const response = await getViewGL({
        company: 'ANS',
        trans_no: item.trans_no,
        type: item.type || '1',
      }).unwrap();

      navigation.navigate('FinanceViewLedger', {
        glData: response,
        reference: item.reference,
        trans_no: item.trans_no,
        type: item.type || '1',
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
      } this expense (${item.reference || item.trans_no})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isApprove ? 'Approve' : 'Unapprove',
          style: isApprove ? 'default' : 'destructive',
          onPress: async () => {
            const actionKey = `${item.trans_no}_${approvalValue}`;
            setActionLoadingKey(actionKey);
            try {
              const approvalPayload = {
                company: 'ANS',
                trans_no: item.trans_no,
                type: String(item.type !== undefined ? item.type : '1'),
                approval: approvalValue,
              };
              console.log('📌 [FIELD EXPENSE APPROVAL] Action:', isApprove ? 'APPROVE' : 'UNAPPROVE', '| trans_no:', item.trans_no);
              console.log('📌 [FIELD EXPENSE APPROVAL] Payload:', JSON.stringify(approvalPayload, null, 2));

              const res = await postExpenseApproval(approvalPayload).unwrap();
              console.log('📥 [FIELD EXPENSE APPROVAL RESPONSE]:', res);

              Toast.show({
                type: 'success',
                text1: isApprove ? 'Expense Approved' : 'Expense Unapproved',
                text2:
                  res?.message ||
                  `Expense ${isApprove ? 'approved' : 'unapproved'} successfully.`,
              });
              fetchInquiryData();
            } catch (err) {
              console.log('Expense approval post error:', err);
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

  const toggleExpand = transNo => {
    setExpandedTransNos(prev => {
      const next = new Set(prev);
      if (next.has(transNo)) {
        next.delete(transNo);
      } else {
        next.add(transNo);
      }
      return next;
    });
  };

  // Status mapping: "0" = Approved, "1" or "" or null = Pending
  const isApproved = statusVal => String(statusVal) === '0';

  // Extract all categories dynamically from inquiryData
  const availableCategories = ['All'];
  inquiryData.forEach(item => {
    const catName = item.expense_type_name || 'Other Expense';
    if (!availableCategories.includes(catName)) {
      availableCategories.push(catName);
    }
  });

  // Filter by category
  const categoryFilteredList = inquiryData.filter(item => {
    if (selectedCategory === 'All') return true;
    return (item.expense_type_name || 'Other Expense') === selectedCategory;
  });

  // Counts for status tabs
  const pendingCount = categoryFilteredList.filter(
    item => !isApproved(item.manager_status),
  ).length;
  const approvedCount = categoryFilteredList.filter(
    item => isApproved(item.manager_status),
  ).length;
  const totalCategoryCount = categoryFilteredList.length;

  // Filter by status tab
  const displayedList = categoryFilteredList.filter(item => {
    if (statusFilter === 'pending') {
      return !isApproved(item.manager_status);
    }
    if (statusFilter === 'approved') {
      return isApproved(item.manager_status);
    }
    return true; // 'all'
  });

  const getStatusBadge = (val, labelPrefix) => {
    const approved = isApproved(val);
    return {
      label: `${labelPrefix}: ${approved ? 'Approved' : 'Pending'}`,
      isApproved: approved,
      color: approved ? '#059669' : '#D97706',
      bg: approved ? '#D1FAE5' : '#FEF3C7',
      icon: approved ? 'checkmark-circle' : 'time',
    };
  };

  const getCategoryTheme = name => {
    switch (name) {
      case 'Field Expense':
        return { color: theme.colors.primary, bg: theme.colors.primary + '18' };
      case 'Outstation Expense':
        return { color: '#D97706', bg: '#F59E0B20' };
      case 'Promotional':
        return { color: '#8B5CF6', bg: '#8B5CF620' };
      case 'Workshop':
        return { color: '#EC4899', bg: '#EC489920' };
      case 'Conference':
        return { color: '#10B981', bg: '#10B98120' };
      default:
        return { color: '#3B82F6', bg: '#3B82F620' };
    }
  };

  const renderCard = ({ item }) => {
    const managerBadge = getStatusBadge(item.manager_status, 'Manager');
    const accountsBadge = getStatusBadge(item.accounts_status, 'Accounts');
    const isActionLoadingApprove = actionLoadingKey === `${item.trans_no}_0`;
    const isActionLoadingUnapprove = actionLoadingKey === `${item.trans_no}_1`;
    const isExpanded = expandedTransNos.has(item.trans_no);
    const catTheme = getCategoryTheme(item.expense_type_name);
    const hasAttachments = Array.isArray(item.attachments) && item.attachments.length > 0;
    const hasDetails = Array.isArray(item.expense_detail) && item.expense_detail.length > 0;
    const isOutstation =
      (item.from_city && item.from_city !== '0') ||
      (item.to_city && item.to_city !== '0');

    return (
      <View
        style={[styles.inquiryCard, { backgroundColor: theme.colors.surface }]}
      >
        {/* Header */}
        <View
          style={[
            styles.inquiryHeader,
            { borderBottomColor: theme.colors.border },
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={styles.refRow}>
              <Text style={[styles.inquiryRef, { color: theme.colors.primary }]}>
                {item.reference || `Claim #${item.trans_no || 'N/A'}`}
              </Text>
              {item.expense_type_name ? (
                <View
                  style={[
                    styles.categoryChip,
                    { backgroundColor: catTheme.bg },
                  ]}
                >
                  <Text style={[styles.categoryChipText, { color: catTheme.color }]}>
                    {item.expense_type_name}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={[styles.inquiryName, { color: theme.colors.text }]}>
              {item.employee_name || 'N/A'}
            </Text>

            {item.comments ? (
              <Text
                style={[
                  styles.inquiryMemo,
                  { color: theme.colors.textSecondary },
                ]}
                numberOfLines={isExpanded ? undefined : 2}
              >
                {item.comments}
              </Text>
            ) : null}
          </View>

          {/* Status Badges */}
          <View style={styles.badgesContainer}>
            <View
              style={[
                styles.approvalBadge,
                { backgroundColor: managerBadge.bg },
              ]}
            >
              <Ionicons
                name={managerBadge.icon}
                size={12}
                color={managerBadge.color}
              />
              <Text
                style={[
                  styles.approvalText,
                  { color: managerBadge.color },
                ]}
              >
                {managerBadge.label}
              </Text>
            </View>

            <View
              style={[
                styles.approvalBadge,
                { backgroundColor: accountsBadge.bg, marginTop: 4 },
              ]}
            >
              <Ionicons
                name={accountsBadge.icon}
                size={12}
                color={accountsBadge.color}
              />
              <Text
                style={[
                  styles.approvalText,
                  { color: accountsBadge.color },
                ]}
              >
                {accountsBadge.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Outstation Trip Details if applicable */}
        {isOutstation ? (
          <View
            style={[
              styles.tripDetailsRow,
              {
                backgroundColor: theme.colors.background,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.tripItem}>
              <Ionicons name="navigate-outline" size={14} color="#D97706" />
              <Text style={[styles.tripText, { color: theme.colors.text }]}>
                Trip: City {item.from_city} → {item.to_city}
              </Text>
            </View>
            {item.leave_date ? (
              <View style={styles.tripItem}>
                <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.tripText, { color: theme.colors.textSecondary }]}>
                  {item.leave_date} to {item.return_date}
                </Text>
              </View>
            ) : null}
            {item.fuel && item.fuel !== '0' && item.fuel !== 0 ? (
              <View style={styles.tripItem}>
                <Ionicons name="speedometer-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.tripText, { color: theme.colors.textSecondary }]}>
                  Fuel: {item.fuel} Ltrs
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Body (Date & Amount) */}
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
              {formatDisplayDate(item.trans_date)}
            </Text>
          </View>
          <Text style={[styles.inquiryTotal, { color: theme.colors.success }]}>
            Rs. {formatNumber(item.amount || 0)}
          </Text>
        </View>

        {/* Expandable Expense Breakdown */}
        {hasDetails ? (
          <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <TouchableOpacity
              style={styles.expandHeader}
              onPress={() => toggleExpand(item.trans_no)}
              activeOpacity={0.7}
            >
              <Text style={[styles.expandHeaderText, { color: theme.colors.primary }]}>
                {isExpanded ? 'Hide Line Items' : `View Line Items (${item.expense_detail.length})`}
              </Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.colors.primary}
              />
            </TouchableOpacity>

            {isExpanded && (
              <View style={[styles.detailsBox, { backgroundColor: theme.colors.background }]}>
                {item.expense_detail.map((detail, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.detailItemRow,
                      idx < item.expense_detail.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.detailAccount, { color: theme.colors.text }]}>
                        {detail.account_name || detail.account_code}
                      </Text>
                      {detail.line_memo ? (
                        <Text style={[styles.detailMemo, { color: theme.colors.textSecondary }]}>
                          {detail.line_memo}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.detailAmount, { color: theme.colors.text }]}>
                      Rs. {formatNumber(detail.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}

        {/* Attachments Section */}
        {hasAttachments ? (
          <View
            style={[
              styles.attachmentsRow,
              {
                backgroundColor: theme.colors.background,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <Ionicons name="attach-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.attachmentsTitle, { color: theme.colors.textSecondary }]}>
              Receipts:
            </Text>
            {item.attachments.map((att, aIdx) => (
              <TouchableOpacity
                key={aIdx}
                style={[styles.attachmentChip, { backgroundColor: theme.colors.surface }]}
                onPress={() => setPreviewAttachment(att)}
              >
                <Ionicons name="image-outline" size={14} color={theme.colors.primary} />
                <Text
                  style={[styles.attachmentChipText, { color: theme.colors.primary }]}
                  numberOfLines={1}
                >
                  {att.filename || `Receipt #${att.id}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Footer Actions */}
        <View
          style={[
            styles.inquiryFooter,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          {/* View GL Button */}
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

          {/* Manager Action Buttons (Always visible) */}
          <View style={styles.managerActionRow}>
            {/* Unapprove Button: shown if currently approved */}
            {isApproved(item.manager_status) ? (
              <TouchableOpacity
                style={[styles.rejectBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1 }]}
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
            ) : (
              /* Approve Button: shown if pending */
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
                      Manager Approve
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Date Filter Bar */}
      <View
        style={[
          styles.dateFilterContainer,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.dateBtn,
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
          <Text style={[styles.dateBtnText, { color: theme.colors.text }]}>
            From: {formatDisplayDate(filterFromDate)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.dateBtn,
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
          <Text style={[styles.dateBtnText, { color: theme.colors.text }]}>
            To: {formatDisplayDate(filterToDate)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories Horizontal Filter Chips */}
      <View
        style={[
          styles.categoryChipsContainer,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsScroll}
        >
          {availableCategories.map((catName, index) => {
            const isSelected = selectedCategory === catName;
            const count =
              catName === 'All'
                ? inquiryData.length
                : inquiryData.filter(
                    i => (i.expense_type_name || 'Other Expense') === catName,
                  ).length;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.background,
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(catName)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.colors.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {catName}
                </Text>
                <View
                  style={[
                    styles.chipCountBadge,
                    {
                      backgroundColor: isSelected
                        ? '#FFFFFF30'
                        : theme.colors.primary + '18',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipCountText,
                      {
                        color: isSelected ? '#FFFFFF' : theme.colors.primary,
                      },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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
            statusFilter === 'pending' && [
              styles.tabButtonActive,
              { borderBottomColor: '#D97706' },
            ],
          ]}
          onPress={() => setStatusFilter('pending')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="time-outline"
            size={16}
            color={
              statusFilter === 'pending' ? '#D97706' : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabButtonText,
              {
                color:
                  statusFilter === 'pending'
                    ? '#D97706'
                    : theme.colors.textSecondary,
                fontWeight: statusFilter === 'pending' ? '800' : '600',
              },
            ]}
          >
            Pending
          </Text>
          {pendingCount > 0 ? (
            <View style={[styles.tabBadge, { backgroundColor: '#D97706' }]}>
              <Text style={styles.tabBadgeText}>{pendingCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            statusFilter === 'approved' && [
              styles.tabButtonActive,
              { borderBottomColor: '#059669' },
            ],
          ]}
          onPress={() => setStatusFilter('approved')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={16}
            color={
              statusFilter === 'approved' ? '#059669' : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabButtonText,
              {
                color:
                  statusFilter === 'approved'
                    ? '#059669'
                    : theme.colors.textSecondary,
                fontWeight: statusFilter === 'approved' ? '800' : '600',
              },
            ]}
          >
            Approved
          </Text>
          {approvedCount > 0 ? (
            <View style={[styles.tabBadge, { backgroundColor: '#059669' }]}>
              <Text style={styles.tabBadgeText}>{approvedCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            statusFilter === 'all' && [
              styles.tabButtonActive,
              { borderBottomColor: theme.colors.primary },
            ],
          ]}
          onPress={() => setStatusFilter('all')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="layers-outline"
            size={16}
            color={
              statusFilter === 'all'
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabButtonText,
              {
                color:
                  statusFilter === 'all'
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
                fontWeight: statusFilter === 'all' ? '800' : '600',
              },
            ]}
          >
            All
          </Text>
          <View style={[styles.tabBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.tabBadgeText}>{totalCategoryCount}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {inquiryLoading && !inquiryData.length ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loaderText, { color: theme.colors.textSecondary }]}>
            Loading expenses...
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedList}
          keyExtractor={item => String(item.trans_no)}
          renderItem={renderCard}
          contentContainerStyle={styles.inquiryList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={inquiryLoading}
              onRefresh={fetchInquiryData}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="receipt-outline"
                size={54}
                color={theme.colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                No expenses found
              </Text>
              <Text
                style={[
                  styles.emptySubText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {statusFilter === 'pending'
                  ? 'All expenses are approved for this date range'
                  : 'Try adjusting the date filter or category'}
              </Text>
            </View>
          }
        />
      )}

      {/* Attachment Image Preview Modal */}
      {previewAttachment && (
        <Modal
          visible={!!previewAttachment}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewAttachment(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]} numberOfLines={1}>
                  {previewAttachment.filename || 'Receipt Preview'}
                </Text>
                <TouchableOpacity
                  onPress={() => setPreviewAttachment(null)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {previewAttachment.filename ? (
                  <Image
                    source={{
                      uri: `https://kmivo.com/mobile_ans/attachments/${previewAttachment.filename}`,
                    }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 40 }}>
                    Image not available
                  </Text>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Date Pickers */}
      <CustomDatePicker
        visible={showFilterFromDatePicker}
        selectedDate={filterFromDate}
        date={filterFromDate}
        onSelect={date => {
          setFilterFromDate(date);
          setShowFilterFromDatePicker(false);
        }}
        onDateChange={date => {
          setFilterFromDate(date);
          setShowFilterFromDatePicker(false);
        }}
        onClose={() => setShowFilterFromDatePicker(false)}
        title="Select From Date"
      />

      <CustomDatePicker
        visible={showFilterToDatePicker}
        selectedDate={filterToDate}
        date={filterToDate}
        onSelect={date => {
          setFilterToDate(date);
          setShowFilterToDatePicker(false);
        }}
        onDateChange={date => {
          setFilterToDate(date);
          setShowFilterToDatePicker(false);
        }}
        onClose={() => setShowFilterToDatePicker(false)}
        title="Select To Date"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  dateBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipsContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  categoryChipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
  },
  chipCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  chipCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 6,
  },
  tabButtonActive: {
    borderBottomWidth: 3,
  },
  tabButtonText: {
    fontSize: 13,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  inquiryRef: {
    fontSize: 14,
    fontWeight: '700',
  },
  categoryChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  inquiryName: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  inquiryMemo: {
    fontSize: 11,
    marginTop: 3,
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
  tripDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    gap: 12,
  },
  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripText: {
    fontSize: 11,
    fontWeight: '500',
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
  expandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  expandHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsBox: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  detailItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailAccount: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailMemo: {
    fontSize: 11,
    marginTop: 1,
  },
  detailAmount: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  attachmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  attachmentsTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    maxWidth: 160,
  },
  attachmentChipText: {
    fontSize: 11,
    fontWeight: '600',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    height: '75%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
});
