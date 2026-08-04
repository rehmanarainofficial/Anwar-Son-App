import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MainScreen from '@screens/MainScreen';
import CRMDashboardTab from '@screens/crm/CRMDashboardTab';
import ReportsDashboardTab from '@screens/reporting/ReportsDashboardTab';
import ApprovalsDashboardTab from '@screens/approvals/ApprovalsDashboardTab';
import CustomTabBar from '@components/navigation/CustomTabBar';

const MainTabNavigator = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('Home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <MainScreen navigation={navigation} route={route} />;
      case 'CRM':
        return <CRMDashboardTab navigation={navigation} route={route} />;
      case 'Reports':
        return <ReportsDashboardTab navigation={navigation} route={route} />;
      case 'Approvals':
        return <ApprovalsDashboardTab navigation={navigation} route={route} />;
      default:
        return <MainScreen navigation={navigation} route={route} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>{renderScreen()}</View>
      <CustomTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});

export default MainTabNavigator;
