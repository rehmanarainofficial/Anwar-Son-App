import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { useTheme } from '@config/useTheme';
import { CustomDatePicker, DimensionDropdown } from '@components/common';
import {
  useGetDeptLeaveApprovalMutation,
  usePostLeaveApprovalManagerMutation,
  useGetAllEmployeesQuery,
} from '@api/hcmApi';

const parseDate = dateStr => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
};

const getFirstDayOfMonth = () => {
  const today = new Date();
  const d = new Date(today.getFullYear(), today.getMonth(), 1);
  return formatToYYYYMMDD(d);
};
const getLastDayOfMonth = () => {
  const today = new Date();
  const d = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return formatToYYYYMMDD(d);
};
const formatToYYYYMMDD = date => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseDate(date) : date;
  if (isNaN(d.getTime())) return String(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const LeaveApprovalScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const userData = useSelector(state => state.auth.user);

  const headId =
    userData?.employee_id ||
    userData?.emp_id ||
    userData?.emp_code ||
    userData?.id ||
    userData?.user_id ||
    '';

  const [selectedEmp, setSelectedEmp] = useState('');
  const [fromDate, setFromDate] = useState(getFirstDayOfMonth());
  const [toDate, setToDate] = useState(getLastDayOfMonth());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [inquiryData, setInquiryData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const { data: rawEmployeesData } = useGetAllEmployeesQuery();

  const [getDeptLeaveApproval, { isLoading: loadingList }] = useGetDeptLeaveApprovalMutation();
  const [postLeaveApprovalManager] = usePostLeaveApprovalManagerMutation();

  const employeeOptions = React.useMemo(() => {
    let empList = [];
    if (rawEmployeesData && (rawEmployeesData.status === true || rawEmployeesData.status === 'true')) {
      empList = (rawEmployeesData.data || []).map(emp => ({
        label: emp.emp_code ? `${emp.emp_name} - ${emp.emp_code}` : emp.emp_name,
        value: String(emp.employee_id),
      }));
    }
    return [{ label: 'All Employees', value: '' }, ...empList];
  }, [rawEmployeesData]);

  useEffect(() => {
    fetchLeaveInquiry(false);
  }, []);

  const fetchLeaveInquiry = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }

    try {
      const response = await getDeptLeaveApproval({
        head_id: headId || '',
        employee_id: selectedEmp || '',
        from_date: fromDate,
        to_date: toDate,
      }).unwrap();

      if (response && response.data) {
        setInquiryData(response.data || []);
      } else {
        setInquiryData([]);
      }
    } catch (error) {
      console.log('Error fetching leave approval list:', error);
      Toast.show({
        type: 'error',
        text1: 'Query Error',
        text2: 'Failed to fetch leave approval data.',
      });
      setInquiryData([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleApprovalAction = async (empId, value) => {
    setActionLoading(prev => ({ ...prev, [empId]: true }));
    try {
      const response = await postLeaveApprovalManager({
        emp_id: empId,
        approve: value,
      }).unwrap();

      if (response && (response.status === true || response.status === 'true')) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.message || 'Approval status updated successfully.',
        });
        fetchLeaveInquiry(false);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: response?.message || 'Failed to update approval status.',
        });
      }
    } catch (error) {
      console.log('Approval error:', error);
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Could not connect to the server.',
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [empId]: false }));
    }
  };

  const renderStatusBadge = (statusVal, label) => {
    const isApproved = statusVal === '1' || statusVal === 1;
    const isPending = statusVal === '0' || statusVal === 0 || !statusVal;

    let bg = '#FEF3C7';
    let text = '#D97706';
    let icon = 'time-outline';
    let statusText = 'Pending';

    if (isApproved) {
      bg = '#D1FAE5';
      text = '#059669';
      icon = 'checkmark-circle-outline';
      statusText = 'Approved';
    } else if (!isPending) {
      bg = '#FEE2E2';
      text = '#DC2626';
      icon = 'close-circle-outline';
      statusText = 'Rejected';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <Icon name={icon} size={14} color={text} style={{ marginRight: 4 }} />
        <Text style={[styles.statusText, { color: text }]}>
          {label}: {statusText}
        </Text>
      </View>
    );
  };

  const renderApprovalCard = ({ item }) => {
    const isItemLoading = actionLoading[item.emp_id] || actionLoading[item.id];
    const itemEmpId = item.emp_id || item.id;

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.employeeInfo}>
            <Text style={styles.empName}>{item.emp_name || 'Employee'}</Text>
            {item.emp_code ? <Text style={styles.empCode}>#{item.emp_code}</Text> : null}
          </View>
          <View style={styles.daysBadge}>
            <Text style={styles.daysText}>
              {item.no_of_leave || '1'} Day{parseInt(item.no_of_leave, 10) > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={styles.rowItem}>
            <Icon name="calendar-outline" size={16} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.datesText}>
              {item.from_date} to {item.to_date}
            </Text>
          </View>

          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>
              {item.reason && item.reason.trim() !== '' ? item.reason : 'No reason provided.'}
            </Text>
          </View>
        </View>

        {/* Status Badges */}
        <View style={styles.statusRow}>
          {renderStatusBadge(item.approve, 'Manager')}
          {renderStatusBadge(item.hr_approve, 'HR')}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {isItemLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => handleApprovalAction(itemEmpId, '1')}
              >
                <Icon name="checkmark-sharp" size={16} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.actionBtnText}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => handleApprovalAction(itemEmpId, '2')}
              >
                <Icon name="close-sharp" size={16} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Filters Toggle */}
      <TouchableOpacity
        style={styles.filterHeaderBtn}
        onPress={() => setShowFilters(!showFilters)}
        activeOpacity={0.8}
      >
        <View style={styles.filterHeaderLeft}>
          <Icon name="options-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.filterHeaderTitle}>Filter Parameters</Text>
        </View>
        <Icon name={showFilters ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.fieldLabel}>Employee</Text>
          <DimensionDropdown
            data={employeeOptions}
            value={selectedEmp}
            onChange={item => setSelectedEmp(item.value)}
            placeholder="Select Employee"
          />

          <View style={styles.dateRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.fieldLabel}>From Date</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowFromPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dateText}>{fromDate ? fromDate : 'From Date'}</Text>
                <Icon name="calendar-outline" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.fieldLabel}>To Date</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowToPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dateText}>{toDate ? toDate : 'To Date'}</Text>
                <Icon name="calendar-outline" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.applyFilterBtn}
            onPress={() => fetchLeaveInquiry(false)}
            activeOpacity={0.8}
          >
            <Icon name="search-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.applyFilterText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Leave Approval List */}
      {loadingList && !refreshing ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Fetching leave applications for approval...</Text>
        </View>
      ) : (
        <FlatList
          data={inquiryData}
          renderItem={renderApprovalCard}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchLeaveInquiry(true)}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="checkbox-outline" size={60} color={theme.colors.border} />
              <Text style={styles.emptyTitle}>No Leave Applications Found</Text>
              <Text style={styles.emptySubtitle}>There are no pending leave approval requests for the selected criteria.</Text>
            </View>
          }
        />
      )}

      {/* Custom Date Pickers */}
      <CustomDatePicker
        visible={showFromPicker}
        onClose={() => setShowFromPicker(false)}
        onSelect={date => {
          setFromDate(formatToYYYYMMDD(date));
          setShowFromPicker(false);
        }}
        selectedDate={parseDate(fromDate)}
        title="Select From Date"
      />

      <CustomDatePicker
        visible={showToPicker}
        onClose={() => setShowToPicker(false)}
        onSelect={date => {
          setToDate(formatToYYYYMMDD(date));
          setShowToPicker(false);
        }}
        selectedDate={parseDate(toDate)}
        title="Select To Date"
      />
    </View>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    filterHeaderBtn: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    filterHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    filterHeaderTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 8,
    },
    filterPanel: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      marginBottom: 4,
      marginTop: 4,
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    dateSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: theme.colors.background,
    },
    dateText: {
      fontSize: 13,
      color: theme.colors.text,
      fontWeight: '500',
    },
    applyFilterBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 14,
    },
    applyFilterText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
    centeredContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    listContainer: {
      padding: 16,
      paddingBottom: 40,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom: 10,
      marginBottom: 10,
    },
    employeeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    empName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
    },
    empCode: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: 6,
    },
    daysBadge: {
      backgroundColor: theme.colors.primary + '15',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    daysText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    cardBody: {
      marginBottom: 10,
    },
    rowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    datesText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    reasonContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 10,
      marginTop: 4,
    },
    reasonLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    reasonText: {
      fontSize: 13,
      color: theme.colors.text,
    },
    statusRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    approveBtn: {
      backgroundColor: '#10B981',
    },
    rejectBtn: {
      backgroundColor: '#EF4444',
    },
    actionBtnText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '600',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      marginTop: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 12,
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 6,
    },
  });

export default LeaveApprovalScreen;
