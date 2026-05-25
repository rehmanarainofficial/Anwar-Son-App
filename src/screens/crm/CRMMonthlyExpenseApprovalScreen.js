import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';

const mockData = [
  {
    id: '1',
    dateTime: '20-04-2026 12:47',
    expenseMonth: 'April 2026',
    salesPerson: 'Ali Khan',
    salesManager: 'Omar Ahmed',
    city: 'Lahore',
    daysWorked: 22,
    localWorking: 15,
    outstationWorking: 7,
    totalExpense: 'Rs 45,000',
    smApproval: 'Approved',
    omApproval: 'Pending',
    mdApproval: 'Pending',
  },
  {
    id: '2',
    dateTime: '19-04-2026 09:30',
    expenseMonth: 'March 2026',
    salesPerson: 'Sara Ali',
    salesManager: 'Omar Ahmed',
    city: 'Karachi',
    daysWorked: 20,
    localWorking: 20,
    outstationWorking: 0,
    totalExpense: 'Rs 12,000',
    smApproval: 'Approved',
    omApproval: 'Approved',
    mdApproval: 'Approved',
  },
  {
    id: '3',
    dateTime: '18-04-2026 14:15',
    expenseMonth: 'April 2026',
    salesPerson: 'Zain Raza',
    salesManager: 'Tariq Mehmood',
    city: 'Islamabad',
    daysWorked: 25,
    localWorking: 10,
    outstationWorking: 15,
    totalExpense: 'Rs 60,000',
    smApproval: 'Rejected',
    omApproval: 'Pending',
    mdApproval: 'Pending',
  },
];

const CRMMonthlyExpenseApprovalScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const getStatusColor = status => {
    switch (status) {
      case 'Approved':
        return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'Rejected':
        return { bg: '#ffebee', text: '#c62828' };
      case 'Pending':
        return { bg: '#fff8e1', text: '#f57f17' };
      default:
        return { bg: '#f5f5f5', text: '#757575' };
    }
  };

  const ApprovalBadge = ({ title, status }) => {
    const colors = getStatusColor(status);
    return (
      <View style={styles.badgeContainer}>
        <Text
          style={[styles.badgeTitle, { color: theme.colors.textSecondary }]}
        >
          {title}
        </Text>
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.badgeText, { color: colors.text }]}>
            {status}
          </Text>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Header: Person & Amount */}
      <View style={styles.cardHeader}>
        <View style={styles.personContainer}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.primary + '20' },
            ]}
          >
            <Icon name="person" size={16} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={[styles.personName, { color: theme.colors.text }]}>
              {item.salesPerson}
            </Text>
            <Text
              style={[
                styles.managerName,
                { color: theme.colors.textSecondary },
              ]}
            >
              Manager: {item.salesManager}
            </Text>
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, { color: theme.colors.primary }]}>
            {item.totalExpense}
          </Text>
          <Text
            style={[styles.monthText, { color: theme.colors.textSecondary }]}
          >
            {item.expenseMonth}
          </Text>
        </View>
      </View>

      <View
        style={[styles.divider, { backgroundColor: theme.colors.border }]}
      />

      {/* Small Key-Values grouped in rows */}
      <View style={styles.row}>
        <View style={styles.smallItem}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Date & Time
          </Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {item.dateTime}
          </Text>
        </View>
        <View style={styles.smallItem}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            City
          </Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {item.city}
          </Text>
        </View>
        <View style={styles.smallItem}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Days Worked
          </Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {item.daysWorked}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.smallItem}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Local Work
          </Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {item.localWorking} days
          </Text>
        </View>
        <View style={styles.smallItem}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Outstation Work
          </Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {item.outstationWorking} days
          </Text>
        </View>
      </View>

      <View
        style={[styles.divider, { backgroundColor: theme.colors.border }]}
      />

      {/* Approvals Row */}
      <View style={styles.approvalsRow}>
        <ApprovalBadge title="SM Approval" status={item.smApproval} />
        <ApprovalBadge title="OM Approval" status={item.omApproval} />
        <ApprovalBadge title="MD Approval" status={item.mdApproval} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={mockData}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    listContent: {
      padding: 16,
    },
    screenTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
      marginBottom: 16,
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
      marginBottom: 12,
    },
    personContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    personName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    managerName: {
      fontSize: 12,
      marginTop: 2,
    },
    amountContainer: {
      alignItems: 'flex-end',
    },
    amount: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    monthText: {
      fontSize: 12,
      marginTop: 2,
    },
    divider: {
      height: 1,
      width: '100%',
      marginVertical: 12,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    smallItem: {
      flex: 1,
    },
    label: {
      fontSize: 11,
      textTransform: 'uppercase',
      marginBottom: 4,
      fontWeight: '600',
    },
    value: {
      fontSize: 14,
      fontWeight: '500',
    },
    approvalsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    badgeContainer: {
      alignItems: 'center',
      flex: 1,
    },
    badgeTitle: {
      fontSize: 10,
      fontWeight: '600',
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    badge: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
  });

export default CRMMonthlyExpenseApprovalScreen;
