import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { ModuleQuickActionButton } from '@components/common';

const HCMScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const actions = [
    { label: 'Attendance', icon: 'calendar-outline', screen: 'HCMAttendance' },
    { label: 'Expense Claim', icon: 'cash-outline', screen: 'HCMExpenseClaim' },
    { label: 'DVR Inquiry', icon: 'document-search-outline', screen: 'HCMDVRInquiry' },
    { label: 'Local Purchase', icon: 'cart-outline', screen: 'HCMLocalPurchase' },
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

export default HCMScreen;
