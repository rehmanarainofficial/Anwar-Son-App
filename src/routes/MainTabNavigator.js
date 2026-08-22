import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import MainScreen from '@screens/MainScreen';
import CRMDashboardTab from '@screens/crm/CRMDashboardTab';
import ReportsDashboardTab from '@screens/reporting/ReportsDashboardTab';
import ApprovalsDashboardTab from '@screens/approvals/ApprovalsDashboardTab';
import CustomTabBar from '@components/navigation/CustomTabBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = ['Home', 'CRM', 'Reports', 'Approvals'];

const MainTabNavigator = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('Home');
  const scrollViewRef = useRef(null);

  const handleTabPress = tabName => {
    setActiveTab(tabName);
    const index = TABS.indexOf(tabName);
    if (index !== -1 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const handleScrollEnd = e => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (index >= 0 && index < TABS.length) {
      setActiveTab(TABS[index]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.scrollView}
      >
        <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
          <MainScreen navigation={navigation} route={route} />
        </View>
        <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
          <CRMDashboardTab navigation={navigation} route={route} />
        </View>
        <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
          <ReportsDashboardTab navigation={navigation} route={route} />
        </View>
        <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
          <ApprovalsDashboardTab navigation={navigation} route={route} />
        </View>
      </ScrollView>

      <CustomTabBar activeTab={activeTab} setActiveTab={handleTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});

export default MainTabNavigator;
