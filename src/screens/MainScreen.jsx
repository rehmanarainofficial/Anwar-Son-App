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
  Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.24 : SCREEN_HEIGHT * 0.21;

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

  const orderActions = [
    {
      id: 'new_order',
      title: 'NEW ORDER',
      icon: 'clipboard-outline',
    },
    {
      id: 'order_status',
      title: 'ORDER STATUS',
      icon: 'document-text-outline',
    },
    {
      id: 'supply_info',
      title: 'SUPPLY INFO',
      icon: 'bus-outline',
    },
    {
      id: 'payment',
      title: 'PAYMENT',
      icon: 'cash-outline',
    },
  ];

  const crmActions = [
    {
      id: 'hospital',
      title: 'HOSPITALS',
      icon: 'business-outline',
    },
    {
      id: 'contact',
      title: 'CONTACTS',
      icon: 'people-outline',
    },
  ];

  const reportActions = [
    {
      id: 'sales_target',
      title: 'SALES VS\nTARGET',
      icon: 'bar-chart-outline',
    },
    {
      id: 'cust_balance',
      title: 'CUSTOMER\nBALANCES',
      icon: 'pie-chart-outline',
    },
  ];

  const expense = [
    {
      id: 'expense',
      title: 'FIELD EXPENSE',
      icon: 'wallet-outline',
    },
    {
      id: 'sample',
      title: 'SAMPLE REQUEST',
      icon: 'flask-outline',
    },
  ];

  const handleToggleSystem = async () => {
    const newState = !systemEnabled;
    const activateValue = newState ? 0 : 1;

    try {
      const response = await toggleErpStatus({
        company: company,
        activate: activateValue,
      }).unwrap();

      if (response && response.status === true) {
        setSystemEnabled(newState);
        Toast.show({
          type: 'success',
          text1: 'System Updated',
          text2: `Application is now turned ${newState ? 'ON' : 'OFF'}.`,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Action Failed',
          text2: 'Could not change system status.',
        });
      }
    } catch (error) {
      console.log('Toggle ERP Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Network error occurred.',
      });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  // const menuItems = [
  //   {
  //     id: 'Dashboard',
  //     name: 'Dashboard',
  //     icon: 'grid-outline',
  //     screen: 'Dashboard',
  //   },
  //   {
  //     id: 'Approvals',
  //     name: 'Approvals',
  //     icon: 'checkmark-circle-outline',
  //     screen: 'Approvals',
  //   },
  //   { id: 'Sales', name: 'Sales', icon: 'cart-outline', screen: 'Sales' },
  //   {
  //     id: 'Purchase',
  //     name: 'Purchase',
  //     icon: 'bag-handle-outline',
  //     screen: 'Purchase',
  //   },
  //   {
  //     id: 'Inventory',
  //     name: 'Inventory',
  //     icon: 'cube-outline',
  //     screen: 'Inventory',
  //   },
  //   { id: 'HCM', name: 'HCM', icon: 'people-outline', screen: 'HCM' },
  //   {
  //     id: 'Manufacturing',
  //     name: 'Manufacturing',
  //     icon: 'settings-outline',
  //     screen: 'Manufacturing',
  //   },
  //   { id: 'CRM', name: 'CRM', icon: 'business-outline', screen: 'CRM' },
  //   {
  //     id: 'SalesCRM',
  //     name: 'Sales CRM',
  //     icon: 'trending-up-outline',
  //     screen: 'SalesCRM',
  //   },
  //   { id: 'Finance', name: 'Finance', icon: 'cash-outline', screen: 'Finance' },
  //   {
  //     id: 'Reporting',
  //     name: 'Reporting',
  //     icon: 'bar-chart-outline',
  //     screen: 'Reporting',
  //   },
  //   {
  //     id: 'VoidTransactions',
  //     name: 'Reversal Transactions',
  //     icon: 'refresh-circle-outline',
  //     screen: 'VoidTransactions',
  //   },
  // ];

  const dynamicStyles = getStyles(theme);

  // const renderCompanyCard = item => (
  //   <TouchableOpacity
  //     key={item.id}
  //     style={dynamicStyles.companyCard}
  //     activeOpacity={0.7}
  //     onPress={() => {
  //       if (item.id === 'SaleManagement') {
  //         navigation.navigate('SaleManagement');
  //       } else {
  //         setSelectedMenuCompany(item.id);
  //       }
  //     }}
  //   >
  //     <View style={dynamicStyles.companyIconContainer}>
  //       <Icon name={item.icon} size={40} color={theme.colors.primary} />
  //     </View>
  //     <Text style={dynamicStyles.companyCardName}>{item.name}</Text>
  //   </TouchableOpacity>
  // );

  const handleActionPress = item => {
    if (item.id === 'new_order') {
      navigation.navigate('SalesGenerateOrderScreen');
    } else if (item.id === 'cust_balance' || item.id === 'customer_balance') {
      navigation.navigate('CustomerBalanceScreen');
    } else if (item.id === 'contact') {
      navigation.navigate('CRMContactList');
    } else if (item.id === 'hospital') {
      navigation.navigate('CRMHospitalList');
    } else if (item.id === 'payment') {
      navigation.navigate('SalesPayment');
    } else if (item.id === 'order_status') {
      navigation.navigate('SalesTrackOrderStatus');
    } else if (item.id === 'supply_info') {
      navigation.navigate('SupplyInfoScreen');
    } else if (item.id === 'sample') {
      navigation.navigate('CRMSampleRequest');
    } else if (item.id === 'sales_target') {
      navigation.navigate('CRMSalesVsTarget');
    }
  };

  // const renderTile = item => (
  //   <TouchableOpacity
  //     key={item.id}
  //     style={dynamicStyles.gridBox}
  //     activeOpacity={0.7}
  //     onPress={() => navigation.navigate(item.screen)}
  //   >
  //     <View style={dynamicStyles.iconContainer}>
  //       <Icon name={item.icon} size={30} color={theme.colors.primary} />
  //     </View>
  //     <Text style={dynamicStyles.boxName}>{item.name}</Text>
  //   </TouchableOpacity>
  // );

  return (
    <View style={dynamicStyles.container}>
      {/* Custom Header Section */}
      <View style={dynamicStyles.header}>
        <SafeAreaView style={dynamicStyles.headerContent} edges={['top']}>
          <View style={dynamicStyles.topBar}>
            <View
              style={[
                dynamicStyles.companyInfo,
                { flexDirection: 'row', alignItems: 'center' },
              ]}
            >
              {selectedMenuCompany && (
                <TouchableOpacity
                  onPress={() => setSelectedMenuCompany(null)}
                  style={{ marginRight: 10 }}
                >
                  <Icon name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              <Text style={dynamicStyles.companyName}>
                {selectedMenuCompany
                  ? selectedMenuCompany.length > 12
                    ? selectedMenuCompany.slice(0, 12) + '...'
                    : selectedMenuCompany
                  : 'Kmivo'}
              </Text>
            </View>
            <View style={dynamicStyles.headerActions}>
              {/* <TouchableOpacity
                style={dynamicStyles.iconBtn}
                onPress={handleToggleSystem}
              >
                <Icon
                  name={systemEnabled ? 'power' : 'power-outline'}
                  size={24}
                  color={systemEnabled ? '#4ADE80' : 'rgba(255,255,255,0.5)'}
                />
              </TouchableOpacity> */}

              {/* Notification Bell */}
              <TouchableOpacity style={dynamicStyles.iconBtn}>
                <Icon name="notifications-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Theme Switcher */}
              <View style={dynamicStyles.themeIcon}>
                <ThemeDropdown />
              </View>

              {/* Logout */}
              <TouchableOpacity
                style={[dynamicStyles.iconBtn, dynamicStyles.logoutBtn]}
                onPress={handleLogout}
              >
                <Icon name="log-out-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={dynamicStyles.userInfoContainer}>
            <Text style={dynamicStyles.userName}>
              Welcome back, {user?.user_id || 'User'}
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Grid Section */}
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
            <Icon
              name="calendar-number"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={dynamicStyles.topActionTitle}>
              Mark{'\n'}Attendance
            </Text>
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
            <Icon name="list-outline" size={24} color={theme.colors.primary} />
            <Text style={dynamicStyles.topActionTitle}>TODAYS{'\n'}PLAN</Text>
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
            <Icon
              name="trending-up-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={dynamicStyles.topActionTitle}>
              TODAYS{'\n'}PROGRESS
            </Text>
          </TouchableOpacity>
        </View>

        {/* ORDERS SECTION */}
        <Text style={dynamicStyles.sectionHeader}>ORDERS</Text>
        <View style={dynamicStyles.gridRow}>
          {orderActions.slice(0, 2).map(action => (
            <TouchableOpacity
              key={action.id}
              style={dynamicStyles.gridItem}
              onPress={() => handleActionPress(action)}
            >
              <Icon
                name={action.icon}
                size={20}
                color={theme.colors.primary}
                style={dynamicStyles.gridIcon}
              />
              <Text style={dynamicStyles.gridItemText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={dynamicStyles.gridRow}>
          {orderActions.slice(2, 4).map(action => (
            <TouchableOpacity
              key={action.id}
              style={dynamicStyles.gridItem}
              onPress={() => handleActionPress(action)}
            >
              <Icon
                name={action.icon}
                size={20}
                color={theme.colors.primary}
                style={dynamicStyles.gridIcon}
              />
              <Text style={dynamicStyles.gridItemText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CRM SECTION */}
        <Text style={dynamicStyles.sectionHeader}>CRM</Text>
        <View style={dynamicStyles.gridRow}>
          {crmActions.map(action => (
            <TouchableOpacity
              key={action.id}
              style={dynamicStyles.gridItem}
              onPress={() => handleActionPress(action)}
            >
              <Icon
                name={action.icon}
                size={20}
                color={theme.colors.primary}
                style={dynamicStyles.gridIcon}
              />
              <Text style={dynamicStyles.gridItemText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* REPORTS SECTION */}
        <Text style={dynamicStyles.sectionHeader}>REPORTS</Text>
        <View style={dynamicStyles.gridRow}>
          {reportActions.map(action => (
            <TouchableOpacity
              key={action.id}
              style={dynamicStyles.gridItem}
              onPress={() => handleActionPress(action)}
            >
              <Icon
                name={action.icon}
                size={20}
                color={theme.colors.primary}
                style={dynamicStyles.gridIcon}
              />
              <Text style={dynamicStyles.gridItemText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FIELD EXPENSE & SAMPLE SECTION */}
        <Text style={dynamicStyles.sectionHeader}>FIELD EXPENSE & SAMPLE</Text>
        <View style={dynamicStyles.gridRow}>
          {expense.map(item => (
            <TouchableOpacity
              key={item.id}
              style={dynamicStyles.gridItem}
              onPress={() => handleActionPress(item)}
            >
              <Icon
                name={item.icon}
                size={20}
                color={theme.colors.primary}
                style={dynamicStyles.gridIcon}
              />
              <Text style={dynamicStyles.gridItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Activities Slider (Moved below) */}
        {/* <DailyActivitiesSlider /> */}
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
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      ...theme.shadows.lg,
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
    topActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    topActionCard: {
      width: '31%',
      aspectRatio: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
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
      marginTop: 8,
    },
    sectionHeader: {
      fontSize: 16,
      fontWeight: '900',
      color: theme.colors.primary,
      marginBottom: 12,
      marginTop: 20,
    },
    gridRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    gridItem: {
      width: '48%',
      height: 60,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    gridIcon: {
      marginRight: 10,
    },
    gridItemText: {
      flex: 1,
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.text,
    },
  });

export default MainScreen;
