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

const approvalGroups = [
  {
    id: 'sale',
    title: 'Sale Approval',
    icon: 'cart-outline',
    color: '#3B82F6',
    items: ['Sale Quotation', 'Sale Order', 'Delivery Note'],
  },
  {
    id: 'purchase',
    title: 'Purchase Approval',
    icon: 'bag-handle-outline',
    color: '#10B981',
    items: ['Purchase Order', 'GRN Approval'],
  },
  {
    id: 'inventory',
    title: 'Inventory Approval',
    icon: 'cube-outline',
    color: '#F59E0B',
    items: ['Location Transfer'],
  },
  {
    id: 'account',
    title: 'Account Approval',
    icon: 'cash-outline',
    color: '#8B5CF6',
    items: ['Voucher Approval'],
  },
  {
    id: 'jobcard',
    title: 'Job Card Approval',
    icon: 'construct-outline',
    color: '#EF4444',
    items: ['Electrical Approval', 'Mechanical Approval'],
  },
];

const AccordionItem = ({ group, theme }) => {
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

const ApprovalsScreen = ({ navigation }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {approvalGroups.map(group => (
          <AccordionItem key={group.id} group={group} theme={theme} />
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

export default ApprovalsScreen;
