import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { logout } from '@store/slices/authSlice';
import { useTheme } from '@config/useTheme';
import { ThemeDropdown } from '@components/common';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT =
  Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.16 : SCREEN_HEIGHT * 0.14;

const ApprovalsDashboardTab = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const styles = getStyles(theme);

  const handleLogout = () => {
    dispatch(logout());
  };

  const pendingItems = [
    {
      id: 'field_expense',
      title: 'Field expense',
      subtext: 'Rs 2,400',
      date: 'Raised Jun 24, 10:15 AM',
      icon: 'card-outline',
      screen: 'CRMMonthlyExpenseApproval',
    },
    {
      id: 'discount_request',
      title: 'Discount request',
      subtext: 'Crescent Heart Institute -10%',
      date: 'Raised Jun 25, 2:30 PM',
      icon: 'pricetag-outline',
      screen: 'EmptyPlaceholder',
      params: { title: 'Discount Request Approval' },
    },
  ];

  const approvedItems = [
    {
      id: 'leave_request',
      title: 'Leave request',
      subtext: 'Jun 28 - Jun 29 · 2 days',
      date: 'Raised Jun 20, 9:00 AM',
      icon: 'calendar-outline',
      screen: 'EmptyPlaceholder',
      params: { title: 'Leave Request Detail' },
    },
  ];

  const rejectedItems = [
    {
      id: 'sample_request',
      title: 'Sample request',
      subtext: 'City General Hospital',
      date: 'Raised Jun 18, 11:45 AM',
      icon: 'flask-outline',
      screen: 'CRMSampleApproval',
    },
  ];

  const renderApprovalCard = (item, badgeType) => {
    let badgeText = 'Pending';
    let badgeColor = theme.colors.warning || theme.colors.primary;

    if (badgeType === 'APPROVED') {
      badgeText = 'Approved';
      badgeColor = theme.colors.success || theme.colors.primary;
    } else if (badgeType === 'REJECTED') {
      badgeText = 'Rejected';
      badgeColor = theme.colors.error || theme.colors.primary;
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => navigation.navigate(item.screen, item.params)}
      >
        <View style={styles.iconWrap}>
          <Icon name={item.icon} size={22} color={theme.colors.primary} />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtext}>{item.subtext}</Text>
          <View style={styles.dateRow}>
            <Icon name="time-outline" size={12} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        </View>

        <View style={[styles.badge, { backgroundColor: badgeColor + '20' }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Theme Header */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerContent} edges={['top']}>
          <View style={styles.topBar}>
            <View style={styles.companyInfo}>
              <Text style={styles.headerTitle}>Approvals</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn}>
                <Icon name="notifications-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.themeIcon}>
                <ThemeDropdown />
              </View>
              <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
                <Icon name="log-out-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PENDING SECTION */}
        <View style={styles.sectionHeaderWrap}>
          <View style={styles.accentBar} />
          <Text style={styles.sectionTitle}>PENDING</Text>
        </View>
        {pendingItems.map(item => renderApprovalCard(item, 'PENDING'))}

        {/* APPROVED SECTION */}
        <View style={[styles.sectionHeaderWrap, { marginTop: 20 }]}>
          <View style={styles.accentBar} />
          <Text style={styles.sectionTitle}>APPROVED</Text>
        </View>
        {approvedItems.map(item => renderApprovalCard(item, 'APPROVED'))}

        {/* REJECTED SECTION */}
        <View style={[styles.sectionHeaderWrap, { marginTop: 20 }]}>
          <View style={styles.accentBar} />
          <Text style={styles.sectionTitle}>REJECTED</Text>
        </View>
        {rejectedItems.map(item => renderApprovalCard(item, 'REJECTED'))}
      </ScrollView>
    </View>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      height: HEADER_HEIGHT,
      backgroundColor: theme.colors.primary,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    headerContent: {
      flex: 1,
      paddingHorizontal: 20,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
    },
    companyInfo: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconBtn: {
      padding: 6,
      marginLeft: 4,
    },
    themeIcon: {
      marginLeft: 4,
    },
    scrollContent: {
      padding: 16,
      paddingTop: 20,
      gap: 10,
    },
    sectionHeaderWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    accentBar: {
      width: 4,
      height: 16,
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
      marginRight: 8,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: theme.colors.primary,
      letterSpacing: 0.5,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.colors.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.text,
      marginBottom: 2,
    },
    cardSubtext: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 12,
      marginLeft: 8,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '800',
    },
  });

export default ApprovalsDashboardTab;
