import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { ModuleQuickActionButton } from '@components/common';

const PurchaseScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const actions = [
    { label: 'Add Supplier', icon: 'person-add-outline', screen: 'PurchaseAddSupplier' },
    { label: 'GRN Again PO', icon: 'document-text-outline', screen: 'PurchaseGRNAgainPO' },
    { label: 'Post Dated Cheque Detail', icon: 'calendar-outline', screen: 'PurchasePDCDetail' },
    { label: 'Payable Summary', icon: 'card-outline', screen: 'PurchasePayableSummary' },
    { label: 'Purchase Transaction', icon: 'swap-horizontal-outline', screen: 'PurchaseTransactions' },
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

export default PurchaseScreen;
