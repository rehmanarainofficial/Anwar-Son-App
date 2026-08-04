import { useState } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeDropdown } from '@components/common';
import { logout, selectCurrentUser } from '@store/slices/authSlice';
import { useTheme } from '@config/useTheme';
import { useToggleErpStatusMutation } from '@api/baseApi';
import Toast from 'react-native-toast-message';
import DailyActivitiesSlider from '@components/dashboard/DailyActivitiesSlider';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT =
  Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.16 : SCREEN_HEIGHT * 0.14;

/**
 * MainScreen - Professional ERP Dashboard with Grid Navigation
 */
const MainScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const company = useSelector(state => state.auth.company);

  const [toggleErpStatus] = useToggleErpStatusMutation();

  const [systemEnabled, setSystemEnabled] = useState(true);
  const [selectedMenuCompany, setSelectedMenuCompany] = useState(null);

  // const companyCards = [
  //   {
  //     id: 'SaleManagement',
  //     name: 'Sale Management',
  //     icon: 'briefcase-outline',
  //   },
  //   { id: 'Anwar & Sons', name: 'Anwar & Sons', icon: 'location-outline' },
  //   {
  //     id: 'Kunhar Distribution',
  //     name: 'Kunhar Distribution',
  //     icon: 'location-outline',
  //   },
  //   {
  //     id: 'KMED Rawalpindi',
  //     name: 'KMED Rawalpindi',
  //     icon: 'location-outline',
  //   },
  //   { id: 'KMED Lahore', name: 'KMED Lahore', icon: 'location-outline' },
  //   {
  //     id: 'KMED Faisalabad',
  //     name: 'KMED Faisalabad',
  //     icon: 'location-outline',
  //   },
  //   { id: 'KMED Karachi', name: 'KMED Karachi', icon: 'location-outline' },
  // ];

  const salesActions = [
    {
      id: 'new_order',
      title: 'New Order',
      icon: 'clipboard-outline',
    },
    {
      id: 'order_status',
      title: 'Order Status',
      icon: 'document-text-outline',
    },
    {
      id: 'supply_info',
      title: 'Supply Info',
      icon: 'bus-outline',
    },
    {
      id: 'payment',
      title: 'Payment',
      icon: 'cash-outline',
    },
  ];

  const fieldActivityRequests = [
    {
      id: 'sample',
      title: 'Sample',
      icon: 'flask-outline',
      color: '#EC4899',
      bgColor: '#FCE7F3',
    },
    {
      id: 'promotional',
      title: 'Promotional',
      icon: 'megaphone-outline',
      color: '#8B5CF6',
      bgColor: '#F3E8FF',
    },
    {
      id: 'giveaway',
      title: 'Giveaway',
      icon: 'gift-outline',
      color: '#3B82F6',
      bgColor: '#DBEAFE',
    },
    {
      id: 'workshop',
      title: 'Workshop',
      icon: 'easel-outline',
      color: '#10B981',
      bgColor: '#D1FAE5',
    },
    {
      id: 'conference',
      title: 'Conference',
      icon: 'people-outline',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
    },
  ];

  const expenseRequests = [
    {
      id: 'fuel_summary',
      title: 'Fuel Summary',
      icon: 'color-fill-outline',
    },
    {
      id: 'field_expense',
      title: 'Field Expense',
      icon: 'wallet-outline',
    },
    {
      id: 'outstation_expense',
      title: 'Outstation Expense',
      icon: 'briefcase-outline',
    },
  ];

  const handleActionPress = item => {
    if (item.id === 'new_order') {
      navigation.navigate('SalesGenerateOrderScreen');
    } else if (item.id === 'order_status') {
      navigation.navigate('SalesTrackOrderStatus');
    } else if (item.id === 'supply_info') {
      navigation.navigate('SupplyInfoScreen');
    } else if (item.id === 'payment') {
      navigation.navigate('SalesPayment');
    } else if (item.id === 'sample') {
      navigation.navigate('CRMSampleRequest');
    } else if (item.id === 'promotional') {
      navigation.navigate('EmptyPlaceholder', { title: 'Promotional Request' });
    } else if (item.id === 'giveaway') {
      navigation.navigate('CRMGiveawayRequest');
    } else if (item.id === 'workshop') {
      navigation.navigate('CRMWorkshopRequest');
    } else if (item.id === 'conference') {
      navigation.navigate('EmptyPlaceholder', { title: 'Conference Request' });
    } else if (item.id === 'fuel_summary') {
      navigation.navigate('EmptyPlaceholder', { title: 'Fuel Summary' });
    } else if (item.id === 'field_expense') {
      navigation.navigate('CRMMonthlyExpense');
    } else if (item.id === 'outstation_expense') {
      navigation.navigate('EmptyPlaceholder', { title: 'Outstation Expense' });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const dynamicStyles = getStyles(theme);

  return (
    <View style={dynamicStyles.container}>
      {/* Custom Header Section */}
      <View style={dynamicStyles.header}>
        <SafeAreaView style={dynamicStyles.headerContent} edges={['top']}>
          <View style={dynamicStyles.topBar}>
            <View style={dynamicStyles.companyInfo}>
              <Text style={dynamicStyles.companyName}>
                {user?.user_id || user?.name || 'Ayesha Khan'}
              </Text>
            </View>
            <View style={dynamicStyles.headerActions}>
              <TouchableOpacity style={dynamicStyles.iconBtn}>
                <Icon name="notifications-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={dynamicStyles.themeIcon}>
                <ThemeDropdown />
              </View>
              <TouchableOpacity
                style={[dynamicStyles.iconBtn, dynamicStyles.logoutBtn]}
                onPress={handleLogout}
              >
                <Icon name="log-out-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP ROW: ATTENDANCE, PLAN, PROGRESS */}
        <View style={dynamicStyles.topActionsRow}>
          <TouchableOpacity
            style={dynamicStyles.topActionCard}
            onPress={() => navigation.navigate('HCMAttendance')}
          >
            <View style={[dynamicStyles.topActionIconWrap, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name="person-outline" size={22} color={theme.colors.primary} />
            </View>
            <Text style={dynamicStyles.topActionTitle}>Mark{'\n'}Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={dynamicStyles.topActionCard}
            onPress={() =>
              navigation.navigate('SaleTask', {
                initialTab: 'plan',
                showTabs: false,
              })
            }
          >
            <View style={[dynamicStyles.topActionIconWrap, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name="clipboard-outline" size={22} color={theme.colors.primary} />
            </View>
            <Text style={dynamicStyles.topActionTitle}>Today's{'\n'}Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={dynamicStyles.topActionCard}
            onPress={() =>
              navigation.navigate('SaleTask', {
                initialTab: 'progress',
                showTabs: false,
              })
            }
          >
            <View style={[dynamicStyles.topActionIconWrap, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name="trending-up-outline" size={22} color={theme.colors.primary} />
            </View>
            <Text style={dynamicStyles.topActionTitle}>Today's{'\n'}Progress</Text>
          </TouchableOpacity>
        </View>

        {/* SALES SECTION */}
        <View style={dynamicStyles.sectionHeaderWrap}>
          <View style={dynamicStyles.accentBar} />
          <Text style={dynamicStyles.sectionHeader}>SALES</Text>
        </View>

        <View style={dynamicStyles.gridContainer}>
          {salesActions.map(action => (
            <TouchableOpacity
              key={action.id}
              style={dynamicStyles.gridItem}
              onPress={() => handleActionPress(action)}
            >
              <View style={dynamicStyles.gridItemLeft}>
                <View style={dynamicStyles.gridIconWrap}>
                  <Icon
                    name={action.icon}
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={dynamicStyles.gridItemText}>{action.title}</Text>
              </View>
              <Icon name="chevron-forward" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* FIELD ACTIVITIES REQUESTS SECTION */}
        <View style={[dynamicStyles.sectionHeaderWrap, { marginTop: 20 }]}>
          <View style={dynamicStyles.accentBar} />
          <Text style={dynamicStyles.sectionHeader}>FIELD ACTIVITIES REQUESTS</Text>
        </View>

        <View style={dynamicStyles.fieldReqRow}>
          {fieldActivityRequests.map(req => (
            <TouchableOpacity
              key={req.id}
              style={dynamicStyles.fieldReqItem}
              onPress={() => handleActionPress(req)}
            >
              <View style={[dynamicStyles.fieldReqCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                <Icon name={req.icon} size={22} color={theme.colors.primary} />
              </View>
              <Text style={dynamicStyles.fieldReqLabel}>{req.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* EXPENSE REQUESTS SECTION */}
        <View style={[dynamicStyles.sectionHeaderWrap, { marginTop: 20 }]}>
          <View style={dynamicStyles.accentBar} />
          <Text style={dynamicStyles.sectionHeader}>EXPENSE REQUESTS</Text>
        </View>

        <View style={dynamicStyles.gridContainer}>
          {expenseRequests.map(exp => (
            <TouchableOpacity
              key={exp.id}
              style={dynamicStyles.gridItem}
              onPress={() => handleActionPress(exp)}
            >
              <View style={dynamicStyles.gridItemLeft}>
                <View style={dynamicStyles.gridIconWrap}>
                  <Icon
                    name={exp.icon}
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={dynamicStyles.gridItemText}>{exp.title}</Text>
              </View>
              <Icon name="chevron-forward" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
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
      paddingBottom: 20,
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
    companyName: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    userName: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    userInfoContainer: {
      marginTop: 20,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    toggleWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 4,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 20,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    iconBtn: {
      padding: 8,
      marginLeft: 4,
    },
    themeIcon: {
      width: 'auto',
      marginLeft: 4,
    },
    logoutBtn: {
      marginLeft: 8,
    },
    scrollContent: {
      padding: 20,
      paddingTop: 30,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    gridBox: {
      width: '31%',
      aspectRatio: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
      ...theme.shadows.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    moreBox: {
      borderStyle: 'dashed',
      borderColor: theme.colors.primary,
      position: 'relative',
    },
    moreBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
    },
    moreBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },
    iconContainer: {
      width: 50,
      height: 50,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    boxName: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
    },
    companyCard: {
      width: '48%',
      aspectRatio: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
      ...theme.shadows.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 10,
    },
    companyIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 20,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
    },
    companyCardName: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
    },
    topActionIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    topActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    topActionCard: {
      width: '31%',
      aspectRatio: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 8,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    topActionTitle: {
      fontSize: 11,
      fontWeight: '800',
      textAlign: 'center',
      color: theme.colors.text,
      marginTop: 4,
    },
    sectionHeaderWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    accentBar: {
      width: 4,
      height: 16,
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
      marginRight: 8,
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: '900',
      color: theme.colors.primary,
      letterSpacing: 0.5,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 10,
    },
    gridItem: {
      width: '48%',
      height: 54,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    gridItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 4,
    },
    gridIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme.colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    gridItemText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.text,
    },
    fieldReqRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    fieldReqItem: {
      alignItems: 'center',
      width: '18%',
    },
    fieldReqCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    fieldReqLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
    },
  });

export default MainScreen;
