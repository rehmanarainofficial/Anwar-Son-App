import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { ModuleQuickActionButton } from '@components/common';

const SalesScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const actions = [
    { label: 'Add Customer', icon: 'person-add-outline', screen: 'SalesAddCustomer' },
    { label: 'Delivery', icon: 'cube-outline', screen: 'SalesDelivery' },
    { label: 'Track Order Status', icon: 'locate-outline', screen: 'SalesTrackOrderStatus' },
    { label: 'Receivable', icon: 'cash-outline', screen: 'SalesReceivable' },
    { label: 'Cost Center', icon: 'layers-outline', screen: 'SalesCostCenter' },
    { label: 'Sales Transactions', icon: 'swap-horizontal-outline', screen: 'SalesTransactions' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {actions.map(item => (
          <ModuleQuickActionButton
            key={item.screen}
            label={item.label}
            icon={item.icon}
            onPress={() => navigation.navigate(item.screen)}
          />
        ))}
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
    content: {
      flex: 1,
      padding: 16,
    },
    headerIconRow: {
      alignItems: 'center',
      marginBottom: 16,
    },
  });

export default SalesScreen;
