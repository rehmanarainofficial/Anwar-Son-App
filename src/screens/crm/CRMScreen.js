import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { useTheme } from '@config/useTheme';

const CRMScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [expandedCard, setExpandedCard] = useState(null);

  const toggleCard = id => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCard(prev => (prev === id ? null : id));
  };

  const cardsData = [
    {
      id: 'raise',
      title: 'Raise Request',
      subtitle: 'Create a new request',
      icon: 'document-text-outline',
      color: theme.colors.primary,
      options: [
        'Monthly Expense',
        'Samples',
        'Give a way',
        'Workshops',
        'Conference',
      ],
    },
    {
      id: 'approval',
      title: 'Approval',
      subtitle: 'View pending approvals',
      icon: 'checkmark-done-circle-outline',
      color: theme.colors.primary,
      options: [
        'Approval Dashboard',
        'Monthly Expense Approval',
        'Samples Approval',
        'Workshops Approval',
        'Give away Approval',
      ],
    },
    {
      id: 'reporting',
      title: 'Reporting',
      subtitle: 'View analytics and reports',
      icon: 'bar-chart-outline',
      color: theme.colors.primary,
      options: ['KPI Dashboard', 'Product Sale', 'Customer Sale', 'Account'],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Row: Box Buttons */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={[
              styles.boxButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => navigation.navigate('CRMContactList')}
          >
            <Icon
              name="person-outline"
              size={32}
              color={theme.colors.primary}
            />
            <Text style={[styles.boxButtonText, { color: theme.colors.text }]}>
              Contact
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.boxButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => navigation.navigate('CRMHospitalList')}
          >
            <Icon
              name="medkit-outline"
              size={32}
              color={theme.colors.primary}
            />
            <Text style={[styles.boxButtonText, { color: theme.colors.text }]}>
              Hospital
            </Text>
          </TouchableOpacity>
        </View>

        {/* Vertical Cards */}
        <View style={styles.cardsContainer}>
          {cardsData.map(card => {
            const isExpanded = expandedCard === card.id;

            return (
              <View
                key={card.id}
                style={[
                  styles.cardWrapper,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => toggleCard(card.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.cardIconWrap,
                      { backgroundColor: card.color + '20' },
                    ]}
                  >
                    <Icon name={card.icon} size={24} color={card.color} />
                  </View>
                  <View style={styles.cardTextWrap}>
                    <Text
                      style={[styles.cardTitle, { color: theme.colors.text }]}
                    >
                      {card.title}
                    </Text>
                    <Text
                      style={[
                        styles.cardSubtitle,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {card.subtitle}
                    </Text>
                  </View>
                  <Icon
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View
                    style={[
                      styles.dropdownContent,
                      { borderTopColor: theme.colors.border },
                    ]}
                  >
                    {card.options.map((option, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.dropdownItem}
                        onPress={() => {
                          if (option === 'Monthly Expense') {
                            navigation.navigate('CRMMonthlyExpense');
                          } else if (option === 'Samples') {
                            navigation.navigate('CRMSampleRequest');
                          } else if (option === 'Give a way') {
                            navigation.navigate('CRMGiveawayRequest');
                          } else if (option === 'Workshops') {
                            navigation.navigate('CRMWorkshopRequest');
                          } else if (option === 'Approval Dashboard') {
                            navigation.navigate('CRMApprovalDashboard');
                          } else if (option === 'Monthly Expense Approval') {
                            navigation.navigate('CRMMonthlyExpenseApproval');
                          } else if (option === 'Samples Approval') {
                            navigation.navigate('CRMSampleApproval');
                          } else if (option === 'Workshops Approval') {
                            navigation.navigate('CRMWorkshopApproval');
                          } else if (option === 'Give away Approval') {
                            navigation.navigate('CRMGiveawayApproval');
                          }
                        }}
                      >
                        <View
                          style={[
                            styles.bulletPoint,
                            { backgroundColor: theme.colors.textSecondary },
                          ]}
                        />
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { color: theme.colors.text },
                          ]}
                        >
                          {option}
                        </Text>
                        <Icon
                          name="arrow-forward"
                          size={16}
                          color={theme.colors.textSecondary}
                          style={{ opacity: 0.5 }}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
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
      padding: 16,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
      gap: 16,
    },
    boxButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      borderRadius: 16,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    boxButtonText: {
      marginTop: 12,
      fontSize: 16,
      fontWeight: '600',
    },
    cardsContainer: {
      gap: 12,
    },
    cardWrapper: {
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    dropdownContent: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 8,
      borderTopWidth: 1,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    bulletPoint: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 12,
      marginLeft: 4,
    },
    dropdownItemText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
    },
    cardIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    cardTextWrap: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 13,
    },
  });

export default CRMScreen;
