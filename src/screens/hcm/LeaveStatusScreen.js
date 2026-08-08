import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { useTheme } from '@config/useTheme';
import { useGetEmpSelfLeavesMutation } from '@api/hcmApi';

const LeaveStatusScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const userData = useSelector(state => state.auth.user);

  const employeeId =
    userData?.employee_id ||
    userData?.emp_id ||
    userData?.emp_code ||
    userData?.id ||
    userData?.user_id ||
    '';

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [getEmpSelfLeaves] = useGetEmpSelfLeavesMutation();

  useEffect(() => {
    if (employeeId) {
      fetchSelfLeaves(false);
    }
  }, [employeeId]);

  const fetchSelfLeaves = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await getEmpSelfLeaves({ emp_id: employeeId || '' }).unwrap();
      if (response && (response.status === true || response.status === 'true')) {
        setLeaves(response.data || []);
      } else {
        setLeaves([]);
      }
    } catch (error) {
      console.log('Error fetching self leaves:', error);
      Toast.show({
        type: 'error',
        text1: 'Query Error',
        text2: 'Failed to fetch your leave applications.',
      });
      setLeaves([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isApproved = val => val === '1' || val === 1;
  const isPending = val => val === '0' || val === 0 || !val;

  const renderStatusBadge = (statusVal, label) => {
    const isBadgeApproved = isApproved(statusVal);
    const isBadgePending = isPending(statusVal);

    let bg = '#FEF3C7';
    let text = '#D97706';
    let icon = 'time-outline';
    let statusText = 'Pending';

    if (isBadgeApproved) {
      bg = '#D1FAE5';
      text = '#059669';
      icon = 'checkmark-circle-outline';
      statusText = 'Approved';
    } else if (!isBadgePending) {
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

  const renderLeaveCard = ({ item }) => {
    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Icon name="calendar-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.leaveTitle}>Leave Request #{item.id}</Text>
          </View>
          <View style={styles.daysBadge}>
            <Text style={styles.daysText}>
              {item.no_of_leave || '1'} Day
              {parseInt(item.no_of_leave, 10) > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={styles.rowItem}>
            <Icon name="time-outline" size={16} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.datesText}>
              {item.from_date} to {item.to_date}
            </Text>
          </View>

          {/* Reason section */}
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>
              {item.reason && item.reason.trim() !== '' ? item.reason : 'No description provided.'}
            </Text>
          </View>
        </View>

        {/* Status Badges Footer */}
        <View style={styles.cardFooter}>
          {renderStatusBadge(item.approve, 'Manager')}
          {renderStatusBadge(item.hr_approve, 'HR')}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Retrieving your leave applications...</Text>
        </View>
      ) : (
        <FlatList
          data={leaves}
          renderItem={renderLeaveCard}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchSelfLeaves(true)}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="calendar-clear-outline" size={60} color={theme.colors.border} />
              <Text style={styles.emptyTitle}>No Leave Applications</Text>
              <Text style={styles.emptySubtitle}>You have not submitted any leave applications yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
    cardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    leaveTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
      marginLeft: 8,
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
      marginBottom: 12,
    },
    rowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
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
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      gap: 10,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    statusText: {
      fontSize: 12,
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

export default LeaveStatusScreen;
