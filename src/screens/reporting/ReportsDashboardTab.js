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

const ReportsDashboardTab = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const styles = getStyles(theme);

  const handleLogout = () => {
    dispatch(logout());
  };

  const kpis = [
    {
      id: 'overall',
      title: 'Overall',
      icon: 'pie-chart-outline',
      screen: 'EmptyPlaceholder',
      params: { title: 'Overall KPI' },
    },
    {
      id: 'kol',
      title: 'KOL Focused',
      icon: 'star-outline',
      screen: 'EmptyPlaceholder',
      params: { title: 'KOL Focused KPI' },
    },
    {
      id: 'product',
      title: 'Product Focused',
      icon: 'cube-outline',
      screen: 'EmptyPlaceholder',
      params: { title: 'Product Focused KPI' },
    },
  ];

  const reports = [
    {
      id: 'sales_target',
      title: 'Sales vs\nTarget',
      icon: 'trending-up-outline',
      screen: 'CRMSalesVsTarget',
    },
    {
      id: 'product_sales',
      title: 'Product\nSales',
      icon: 'grid-outline',
      screen: 'CRMProductSales',
    },
    {
      id: 'customer_sales',
      title: 'Customer\nSales',
      icon: 'people-outline',
      screen: 'CRMCustomerSales',
    },
    {
      id: 'cust_balances',
      title: 'Customer\nBalances',
      icon: 'wallet-outline',
      screen: 'CustomerBalanceScreen',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Dynamic Theme Header */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerContent} edges={['top']}>
          <View style={styles.topBar}>
            <View style={styles.companyInfo}>
              <Text style={styles.headerTitle}>Reports</Text>
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

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPIS SECTION */}
        <View style={styles.sectionHeaderWrap}>
          <View style={styles.accentBar} />
          <Text style={styles.sectionTitle}>KPIS</Text>
        </View>

        <View style={styles.kpiRow}>
          {kpis.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.kpiCard}
              onPress={() => navigation.navigate(item.screen, item.params)}
            >
              <View style={styles.kpiIconWrap}>
                <Icon name={item.icon} size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.kpiText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* REPORTS SECTION */}
        <View style={[styles.sectionHeaderWrap, { marginTop: 24 }]}>
          <View style={styles.accentBar} />
          <Text style={styles.sectionTitle}>REPORTS</Text>
        </View>

        <View style={styles.reportsGrid}>
          {reports.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.reportCard}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.reportIconWrap}>
                <Icon name={item.icon} size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.reportTitle}>{item.title}</Text>
              <Icon name="chevron-forward" size={18} color={theme.colors.textSecondary} />
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
    },
    sectionHeaderWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
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
    kpiRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    kpiCard: {
      width: '31%',
      aspectRatio: 1,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 16,
      borderWidth: 1,
      padding: 10,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
    },
    kpiIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.colors.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    kpiText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
    },
    reportsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
    },
    reportCard: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
    },
    reportIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.colors.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    reportTitle: {
      flex: 1,
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.text,
      lineHeight: 16,
    },
  });

export default ReportsDashboardTab;
