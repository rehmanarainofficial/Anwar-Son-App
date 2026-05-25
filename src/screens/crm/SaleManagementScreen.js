import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';

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

const SaleManagementScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

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
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP ROW: ATTENDANCE, PLAN, PROGRESS */}
        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={styles.topActionCard}
            onPress={() => navigation.navigate('HCMAttendance')}
          >
            <Icon
              name="calendar-number"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.topActionTitle}>Mark{'\n'}Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topActionCard}
            onPress={() =>
              navigation.navigate('SaleTask', {
                initialTab: 'plan',
                showTabs: false,
              })
            }
          >
            <Icon name="list-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.topActionTitle}>TODAYS{'\n'}PLAN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topActionCard}
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
            <Text style={styles.topActionTitle}>TODAYS{'\n'}PROGRESS</Text>
          </TouchableOpacity>
        </View>

        {/* ORDERS SECTION */}
        <Text style={styles.sectionHeader}>ORDERS</Text>
        <View style={styles.gridRow}>
          {orderActions.slice(0, 2).map(action => (
            <TouchableOpacity
              key={action.id}
              style={styles.gridItem}
              onPress={() => handleActionPress(action)}
            >
              <Icon
                name={action.icon}
                size={20}
                color={theme.colors.primary}
                style={styles.gridIcon}
              />
              <Text style={styles.gridItemText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.gridRow}>
          {orderActions.slice(2, 4).map(action => (
            <TouchableOpacity
              key={action.id}
              style={styles.gridItem}
              onPress={() => handleActionPress(action)}
            >
              <Icon
                name={action.icon}
                size={20}
                color={theme.colors.primary}
                style={styles.gridIcon}
              />
              <Text style={styles.gridItemText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CRM SECTION */}
        <Text style={styles.sectionHeader}>CRM</Text>
        <View style={styles.gridRow}>
          {crmActions.map(action => (
            <TouchableOpacity
              key={action.id}
              style={styles.gridItem}
              onPress={() => handleActionPress(action)}
            >
              <Icon
                name={action.icon}
                size={20}
                color={theme.colors.primary}
                style={styles.gridIcon}
              />
              <Text style={styles.gridItemText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* REPORTS SECTION */}
        <Text style={styles.sectionHeader}>REPORTS</Text>
        <View style={styles.gridRow}>
          {reportActions.map(action => (
            <TouchableOpacity
              key={action.id}
              style={styles.gridItem}
              onPress={() => handleActionPress(action)}
            >
              <Icon
                name={action.icon}
                size={20}
                color={theme.colors.primary}
                style={styles.gridIcon}
              />
              <Text style={styles.gridItemText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FIELD EXPENSE & SAMPLE SECTION */}
        <Text style={styles.sectionHeader}>FIELD EXPENSE & SAMPLE</Text>
        <View style={styles.gridRow}>
          {expense.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridItem}
              onPress={() => handleActionPress(item)}
            >
              <Icon
                name={item.icon}
                size={20}
                color={theme.colors.primary}
                style={styles.gridIcon}
              />
              <Text style={styles.gridItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
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

export default SaleManagementScreen;
