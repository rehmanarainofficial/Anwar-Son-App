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
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 10,
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
            {isFocused ? (
              <View
                style={[
                  styles.activePill,
                  {
                    backgroundColor: theme.colors.primary + '18',
                    borderColor: theme.colors.primary + '40',
                  },
                ]}
              >
                <Icon name={tab.activeIcon} size={18} color={theme.colors.primary} />
                <Text style={[styles.activeText, { color: theme.colors.primary }]}>
                  {tab.label}
                </Text>
              </View>
            ) : (
              <View style={styles.inactiveWrapper}>
                <Icon name={tab.icon} size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.inactiveText, { color: theme.colors.textSecondary }]}>
                  {tab.label}
                </Text>
              </View>
            )}
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
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  inactiveWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
});

export default CustomTabBar;
