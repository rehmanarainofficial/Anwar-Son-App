import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { ModuleQuickActionButton } from '@components/common';

const InventoryScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const actions = [
    { label: 'Add Item', icon: 'add-circle-outline', screen: 'InventoryAddItem' },
    { label: 'Search Item', icon: 'search-outline', screen: 'InventorySearchItem' },
    { label: 'Item Movement', icon: 'trail-sign-outline', screen: 'InventoryItemMovement' },
    { label: 'Location Transfer', icon: 'swap-vertical-outline', screen: 'InventoryLocationTransfer' },
    { label: 'Inventory Adjustment', icon: 'color-wand-outline', screen: 'InventoryAdjustment' },
    { label: 'Dated Stock Sheet', icon: 'calendar-outline', screen: 'InventoryDatedStockSheet' },
    { label: 'Inventory Transaction', icon: 'swap-horizontal-outline', screen: 'InventoryTransactions' },
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

export default InventoryScreen;
