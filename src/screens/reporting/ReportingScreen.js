import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const reportingGroups = [
  {
    id: 'sale',
    title: 'Sale Report',
    icon: 'cart-outline',
    color: '#3B82F6',
    items: ['Customer Balance', 'Customer Aging', 'Customer Detail'],
    navParams: [
      { screen: 'Ledger', params: { type: 'customer' } },
      { screen: 'CustomerAging', params: { type: 'customer' } },
      { screen: 'CustomerBalanceDetails', params: { type: 'customer' } },
    ],
  },
  {
    id: 'supplier',
    title: 'Supplier Report',
    icon: 'bag-handle-outline',
    color: '#10B981',
    items: ['Supplier Balance', 'Supplier Aging', 'Supplier Detail'],
    navParams: [
      { screen: 'Ledger', params: { type: 'supplier' } },
      { screen: 'CustomerAging', params: { type: 'supplier' } },
      { screen: 'CustomerBalanceDetails', params: { type: 'supplier' } },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory Report',
    icon: 'cube-outline',
    color: '#F59E0B',
    items: ['Category Valuation', 'Location Valuation', 'Item Valuation'],
    navParams: [
      { screen: 'InventoryValuation', params: {} },
      { screen: 'InventoryValuation', params: {} },
      { screen: 'InventoryValuation', params: {} },
    ],
  },
  {
    id: 'account',
    title: 'Account Report',
    icon: 'bar-chart-outline',
    color: '#8B5CF6',
    items: [
      'Ledger Report',
      'Trail Balance',
      'Balance Sheet',
      'Profit & Loss',
      'Cash Flow',
    ],
    navParams: [
      { screen: 'Ledger', params: { type: 'account' } },
      { screen: 'TrailBalanceReport', params: {} },
      { screen: 'BalanceSheetReport', params: {} },
      { screen: 'TrailBalanceReport', params: { type: 'profit_loss' } },
      { screen: 'TrailBalanceReport', params: { type: 'cash_flow' } },
    ],
  },
];

const AccordionItem = ({ group, theme, navigation }) => {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handleItemPress = (index) => {
    const nav = group.navParams?.[index];
    if (nav && navigation) {
      try {
        navigation.navigate(nav.screen, nav.params || {});
      } catch (e) {
        // screen might not be registered yet
      }
    }
  };

  return (
    <View
      style={[
        styles.accordionCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: expanded ? group.color : theme.colors.border,
          borderWidth: expanded ? 1.5 : 1,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={toggle}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: group.color + '20' }]}>
          <Icon name={group.icon} size={22} color={group.color} />
        </View>
        <Text style={[styles.groupTitle, { color: theme.colors.text }]}>
          {group.title}
        </Text>
        <View style={styles.rightSection}>
          <View style={[styles.countBadge, { backgroundColor: group.color + '20' }]}>
            <Text style={[styles.countText, { color: group.color }]}>
              {group.items.length}
            </Text>
          </View>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Icon name="chevron-down" size={20} color={theme.colors.textSecondary} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.itemsContainer, { borderTopColor: theme.colors.border }]}>
          {group.items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.subItem,
                index < group.items.length - 1 && {
                  borderBottomColor: theme.colors.border,
                  borderBottomWidth: 1,
                },
              ]}
              activeOpacity={0.6}
              onPress={() => handleItemPress(index)}
            >
              <View style={[styles.subItemDot, { backgroundColor: group.color }]} />
              <Text style={[styles.subItemText, { color: theme.colors.text }]}>
                {item}
              </Text>
              <Icon name="chevron-forward" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const ReportingScreen = ({ navigation }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {reportingGroups.map(group => (
          <AccordionItem key={group.id} group={group} theme={theme} navigation={navigation} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
  },
  pageSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  accordionCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 26,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemsContainer: {
    borderTopWidth: 1,
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  subItemDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  subItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ReportingScreen;
