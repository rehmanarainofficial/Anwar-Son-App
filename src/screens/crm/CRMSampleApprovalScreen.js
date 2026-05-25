import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';

const mockData = [
  {
    id: '1',
    salesman: 'Khurram',
    salesRegion: 'qasim',
    hospital: 'Al-Suffah Hospital',
    surgeon: 'Shahzadaaa',
    department: 'Aesthetic Plastic Surg',
    product: 'Tracheal tube - with cuff - 10',
    qtySent: 11,
    date: '8/16/2025',
    smApproval: { status: 'Unapproved', time: '27Aug25 16:20' },
    omApproval: { status: 'Approved', time: '27Aug25 16:42' },
    mdApproval: { status: 'Approved', time: '27Aug25 15:23' },
  },
  {
    id: '2',
    salesman: 'Hamza Hassan',
    salesRegion: 'Islamabad',
    hospital: 'PAF Hospital',
    surgeon: 'Dr Waqas Ahmed',
    department: 'Aesthetic Plastic Surg',
    product: 'Tracheal tube - with cuff - 9',
    qtySent: 11,
    date: '8/23/2025',
    smApproval: { status: 'Approved', time: '27Aug25 16:46' },
    omApproval: { status: 'Approved', time: '27Aug25 16:46' },
    mdApproval: { status: 'Unapproved', time: '28Aug25 10:34' },
  },
  {
    id: '3',
    salesman: 'Hamza Hassan',
    salesRegion: 'Islamabad',
    hospital: 'Shifa International Hospital',
    surgeon: 'Ajmal Khanna',
    department: 'Aesthetic Plastic Surg',
    product: 'Surgicryl Monofilament PDO',
    qtySent: 1,
    date: '3/19/2026',
    smApproval: { status: 'Review', time: '' },
    omApproval: { status: 'Review', time: '' },
    mdApproval: { status: 'Review', time: '' },
  },
  {
    id: '4',
    salesman: 'Hamza Hassan',
    salesRegion: 'Islamabad',
    hospital: 'PAF Hospital',
    surgeon: 'Dr Waqas Ahmed',
    department: 'Aesthetic Plastic Surg',
    product: 'Tracheal tube - with cuff - 7',
    qtySent: 32,
    date: '8/23/2025',
    smApproval: { status: 'Resubmit', time: '28Aug25 10:42' },
    omApproval: { status: 'Review', time: '' },
    mdApproval: { status: 'Review', time: '' },
  },
];

const CRMSampleApprovalScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const getStatusColor = status => {
    switch (status) {
      case 'Approved':
        return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'Unapproved':
        return { bg: '#ffebee', text: '#c62828' };
      case 'Resubmit':
        return { bg: '#fff8e1', text: '#f57f17' };
      case 'Review':
      default:
        return { bg: '#f5f5f5', text: '#616161' };
    }
  };

  const ApprovalBadge = ({ title, approvalData }) => {
    const colors = getStatusColor(approvalData.status);
    return (
      <View style={styles.badgeContainer}>
        <Text
          style={[styles.badgeTitle, { color: theme.colors.textSecondary }]}
        >
          {title}
        </Text>
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
          {approvalData.status === 'Review' && (
            <Icon
              name="time-outline"
              size={12}
              color={colors.text}
              style={{ marginRight: 4 }}
            />
          )}
          <Text style={[styles.badgeText, { color: colors.text }]}>
            {approvalData.status}
          </Text>
        </View>
        {approvalData.time ? (
          <Text
            style={[styles.badgeTime, { color: theme.colors.textSecondary }]}
          >
            {approvalData.time}
          </Text>
        ) : (
          <Text style={[styles.badgeTime, { color: 'transparent' }]}>-</Text>
        )}
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
      {/* Header: Hospital & Date */}
      <View style={styles.cardHeader}>
        <View style={styles.hospitalContainer}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.primary + '20' },
            ]}
          >
            <Icon name="medkit" size={16} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.hospitalName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {item.hospital}
            </Text>
            <Text
              style={[
                styles.salesmanName,
                { color: theme.colors.textSecondary },
              ]}
            >
              Rep: {item.salesman} ({item.salesRegion})
            </Text>
          </View>
        </View>
        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, { color: theme.colors.primary }]}>
            {item.date}
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
            Surgeon
          </Text>
          <Text
            style={[styles.value, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {item.surgeon}
          </Text>
        </View>
        <View style={styles.smallItem}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Department
          </Text>
          <Text
            style={[styles.value, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {item.department}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.smallItem, { flex: 2 }]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Product
          </Text>
          <Text
            style={[styles.value, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {item.product}
          </Text>
        </View>
        <View style={[styles.smallItem, { flex: 1, alignItems: 'flex-end' }]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            Qty Sent
          </Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>
            {item.qtySent}
          </Text>
        </View>
      </View>

      <View
        style={[styles.divider, { backgroundColor: theme.colors.border }]}
      />

      {/* Approvals Row */}
      <View style={styles.approvalsRow}>
        <ApprovalBadge title="SM Approval" approvalData={item.smApproval} />
        <ApprovalBadge title="OM Approval" approvalData={item.omApproval} />
        <ApprovalBadge title="MD Approval" approvalData={item.mdApproval} />
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
    hospitalContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 10,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    hospitalName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    salesmanName: {
      fontSize: 12,
      marginTop: 2,
    },
    dateContainer: {
      alignItems: 'flex-end',
      justifyContent: 'flex-start',
    },
    dateText: {
      fontSize: 14,
      fontWeight: 'bold',
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
      gap: 10,
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
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
      marginBottom: 4,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    badgeTime: {
      fontSize: 9,
    },
  });

export default CRMSampleApprovalScreen;
