import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { useTheme } from '@config/useTheme';
import { CustomButton, CustomDatePicker } from '@components/common';
import {
  useGetEmployeeLeaveHistoryMutation,
  usePostEmployeeLeaveMutation,
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

const formatToYYYYMMDD = date => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseDate(date) : date;
  if (isNaN(d.getTime())) return String(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const LeaveScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const userData = useSelector(state => state.auth.user);

  // Extract Employee ID & Name
  const employeeId =
    userData?.employee_id ||
    userData?.emp_id ||
    userData?.emp_code ||
    userData?.id ||
    userData?.user_id ||
    '';

  const displayName =
    userData?.real_name ||
    userData?.name ||
    userData?.emp_name ||
    userData?.user_id ||
    'Employee';

  const displayCode =
    userData?.emp_code || userData?.employee_id || userData?.id || '';

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const [leaveHistory, setLeaveHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [getEmployeeLeaveHistory] = useGetEmployeeLeaveHistoryMutation();
  const [postEmployeeLeave, { isLoading: submitting }] = usePostEmployeeLeaveMutation();

  useEffect(() => {
    if (employeeId) {
      fetchLeaveHistory(employeeId);
    }
  }, [employeeId]);

  const fetchLeaveHistory = async empId => {
    if (!empId) return;
    setLoadingHistory(true);
    try {
      const response = await getEmployeeLeaveHistory({ emp_id: empId }).unwrap();
      if (response && response !== 'null' && response !== null) {
        setLeaveHistory(response);
      } else {
        setLeaveHistory(null);
      }
    } catch (error) {
      console.log('Error fetching leave history:', error);
      setLeaveHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async () => {
    if (!employeeId) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Employee profile not found.',
      });
      return;
    }
    if (!fromDate) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select From Date.',
      });
      return;
    }
    if (!toDate) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select To Date.',
      });
      return;
    }
    if (!reason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a reason for the leave.',
      });
      return;
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (start > end) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'From Date cannot be after To Date.',
      });
      return;
    }

    if (leaveHistory === null) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'No leave record found. Cannot submit request.',
      });
      return;
    }

    if (leaveHistory && Number(leaveHistory.balance) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Leave limit is completed. Cannot submit request.',
      });
      return;
    }

    try {
      const response = await postEmployeeLeave({
        from_date: fromDate,
        to_date: toDate,
        emp_id: employeeId,
        reason: reason.trim(),
        leave_type: leaveHistory?.id || '',
      }).unwrap();

      if (response && (response.status === true || response.status === 'true')) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.message || 'Leave requested successfully!',
        });

        setFromDate('');
        setToDate('');
        setReason('');

        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Submission Failed',
          text2: response?.message || 'Failed to submit leave request.',
        });
      }
    } catch (error) {
      console.log('Error submitting leave:', error);
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Could not connect to the server.',
      });
    }
  };

  const isLimitCompleted = leaveHistory && Number(leaveHistory.balance) <= 0;

  const totalLeaves =
    leaveHistory?.leave_days || leaveHistory?.allow_leave || leaveHistory?.allowed || 0;
  const availedLeaves =
    leaveHistory?.availed || leaveHistory?.leave || leaveHistory?.taken || 0;
  const balanceLeaves =
    leaveHistory?.balance !== undefined ? leaveHistory.balance : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logged in Employee Info Box */}
        <View style={styles.employeeCard}>
          <Text style={styles.fieldLabel}>Employee Profile</Text>
          <View style={styles.employeeBadge}>
            <Icon name="person-circle-outline" size={22} color={theme.colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.employeeText}>
              {displayName} {displayCode ? `(${displayCode})` : ''}
            </Text>
          </View>
        </View>

        {/* Leave Balance Header Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Icon name="calendar-outline" size={22} color={theme.colors.primary} />
            <Text style={styles.balanceTitle}>Leave Balance Summary</Text>
          </View>

          {loadingHistory ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 12 }} />
          ) : leaveHistory ? (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{totalLeaves}</Text>
                <Text style={styles.statLabel}>Allowed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{availedLeaves}</Text>
                <Text style={styles.statLabel}>Availed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text
                  style={[
                    styles.statNumber,
                    { color: Number(balanceLeaves) <= 0 ? theme.colors.error : theme.colors.primary },
                  ]}
                >
                  {balanceLeaves}
                </Text>
                <Text style={styles.statLabel}>Balance</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noHistoryText}>No leave record found for your profile.</Text>
          )}

          {isLimitCompleted && (
            <View style={styles.warningBox}>
              <Icon name="alert-circle-outline" size={16} color={theme.colors.error} />
              <Text style={styles.warningText}>Leave limit completed. Application disabled.</Text>
            </View>
          )}
        </View>

        {/* Leave Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Application Details</Text>

          {/* Dates Selection Row */}
          <View style={styles.dateRow}>
            {/* From Date */}
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.fieldLabel}>
                From Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowFromPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateText, !fromDate && { color: theme.colors.textSecondary }]}>
                  {fromDate ? fromDate : 'Select Date'}
                </Text>
                <Icon name="calendar-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {/* To Date */}
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.fieldLabel}>
                To Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowToPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateText, !toDate && { color: theme.colors.textSecondary }]}>
                  {toDate ? toDate : 'Select Date'}
                </Text>
                <Icon name="calendar-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reason */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
            Reason for Leave <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Enter detailed reason..."
            placeholderTextColor={theme.colors.textSecondary}
            value={reason}
            onChangeText={setReason}
            textAlignVertical="top"
          />

          {/* Submit Button */}
          <View style={{ marginTop: 24 }}>
            <CustomButton
              title="Submit Leave Request"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting || isLimitCompleted}
            />
          </View>
        </View>
      </ScrollView>

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
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    employeeCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    employeeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 10,
      marginTop: 4,
    },
    employeeText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    balanceCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    balanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    balanceTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 8,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginTop: 8,
    },
    statBox: {
      alignItems: 'center',
      flex: 1,
    },
    statNumber: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: theme.colors.border,
    },
    noHistoryText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      marginVertical: 8,
    },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEE2E2',
      borderRadius: 8,
      padding: 8,
      marginTop: 12,
    },
    warningText: {
      fontSize: 12,
      color: '#DC2626',
      marginLeft: 6,
      fontWeight: '500',
    },
    formCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 14,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 6,
    },
    required: {
      color: theme.colors.error || '#EF4444',
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dateSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.colors.background,
    },
    dateText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    textArea: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      minHeight: 90,
    },
  });

export default LeaveScreen;
