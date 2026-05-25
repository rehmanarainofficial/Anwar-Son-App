import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';

const data = [
  { id: 'expense', title: 'Expense' },
  { id: 'samples', title: 'Samples' },
  { id: 'giveaways', title: 'Giveaways' },
  { id: 'workshops', title: 'Workshops' },
  { id: 'conferences', title: 'Conferences' },
];

const stages = [
  'SALES MANAGER APPROVAL',
  'OFFICE MANAGER APPROVAL',
  'MD APPROVAL',
];

const CRMApprovalDashboard = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const Badge = ({ type, count, icon }) => {
    let bgColor, textColor;
    switch (type) {
      case 'Approved':
        bgColor = '#e8f5e9'; // soft green
        textColor = '#2e7d32'; // dark green
        break;
      case 'Rejected':
        bgColor = '#ffebee'; // soft red
        textColor = '#c62828'; // dark red
        break;
      case 'Pending':
        bgColor = '#fff8e1'; // soft orange/yellow
        textColor = '#f57f17'; // dark orange
        break;
      case 'Resubmit':
        bgColor = '#e3f2fd'; // soft blue
        textColor = '#1565c0'; // dark blue
        break;
      default:
        bgColor = theme.colors.surface;
        textColor = theme.colors.text;
    }

    return (
      <View style={[styles.badge, { backgroundColor: bgColor }]}>
        <Icon name={icon} size={14} color={textColor} />
        <Text style={[styles.badgeText, { color: textColor }]}>
          {type} ({count})
        </Text>
      </View>
    );
  };

  const renderStage = (stageName, index) => (
    <View
      key={index}
      style={[
        styles.stageCard,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <Text style={[styles.stageTitle, { color: theme.colors.textSecondary }]}>
        {stageName}
      </Text>
      <View style={styles.badgesContainer}>
        <Badge type="Approved" count={0} icon="checkmark-outline" />
        <Badge type="Rejected" count={0} icon="close-outline" />
        <Badge type="Pending" count={0} icon="hourglass-outline" />
        <Badge type="Resubmit" count={0} icon="refresh-outline" />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {data.map(item => (
            <View key={item.id} style={styles.categoryContainer}>
              <Text
                style={[styles.categoryTitle, { color: theme.colors.text }]}
              >
                {item.title}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {stages.map((stage, idx) => renderStage(stage, idx))}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      paddingVertical: 20,
    },
    categoryContainer: {
      marginBottom: 28,
    },
    categoryTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    horizontalScroll: {
      paddingHorizontal: 16,
    },
    stageCard: {
      width: 290,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      marginRight: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    stageTitle: {
      fontSize: 13,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 16,
      letterSpacing: 0.5,
    },
    badgesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 20,
      width: '48%',
      marginBottom: 10,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 4,
    },
  });

export default CRMApprovalDashboard;
