import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@config/useTheme';

const TAB_CONFIGS = [
  {
    key: 'Home',
    label: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    key: 'CRM',
    label: 'CRM',
    icon: 'people-outline',
    activeIcon: 'people',
  },
  {
    key: 'Reports',
    label: 'Reports',
    icon: 'bar-chart-outline',
    activeIcon: 'bar-chart',
  },
  {
    key: 'Approvals',
    label: 'Approvals',
    icon: 'checkbox-outline',
    activeIcon: 'checkbox',
  },
];

const CustomTabBar = ({ activeTab, setActiveTab }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabContainer,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 6) : 6,
        },
      ]}
    >
      {TAB_CONFIGS.map(tab => {
        const isFocused = activeTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            {/* Facebook-style Top Active Line Indicator */}
            <View
              style={[
                styles.topIndicator,
                {
                  backgroundColor: isFocused ? theme.colors.primary : 'transparent',
                },
              ]}
            />
            <View style={styles.tabContent}>
              <Icon
                name={isFocused ? tab.activeIcon : tab.icon}
                size={22}
                color={isFocused ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isFocused ? theme.colors.primary : theme.colors.textSecondary,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  topIndicator: {
    width: 36,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    marginBottom: 4,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 3,
  },
  tabText: {
    fontSize: 11,
    textAlign: 'center',
  },
});

export default CustomTabBar;
