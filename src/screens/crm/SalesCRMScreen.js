import { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';

const SalesCRMScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [activePlanTab, setActivePlanTab] = useState('Plan');
  const [activeRaiseTab, setActiveRaiseTab] = useState('Promotional');

  const renderPillButton = (title, icon, isPrimary = false, onPress = null) => {
    return (
      <TouchableOpacity
        style={[
          styles.pillButton,
          isPrimary ? styles.pillButtonPrimary : styles.pillButtonSecondary,
          {
            borderColor: isPrimary ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={onPress}
      >
        {icon && (
          <Icon
            name={icon}
            size={16}
            color={isPrimary ? '#FFFFFF' : theme.colors.primary}
            style={{ marginRight: 6 }}
          />
        )}
        <Text
          style={[
            styles.pillButtonText,
            isPrimary
              ? styles.pillButtonTextPrimary
              : styles.pillButtonTextSecondary(theme),
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Row: Box Buttons (Copied from CRMScreen) */}
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

        {/* Card 1: Plan & Track */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIconWrap,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <Icon name="ellipse" size={16} color={theme.colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Plan & Track
            </Text>
          </View>

          <View style={styles.pillContainer}>
            {renderPillButton(
              'Plan',
              'clipboard-outline',
              activePlanTab === 'Plan',
              () => setActivePlanTab('Plan'),
            )}
            {renderPillButton(
              'Progress',
              'trending-up-outline',
              activePlanTab === 'Progress',
              () => setActivePlanTab('Progress'),
            )}
            {renderPillButton(
              'Performance',
              'speedometer-outline',
              activePlanTab === 'Performance',
              () => setActivePlanTab('Performance'),
            )}
          </View>

          {activePlanTab === 'Plan' && (
            <>
              <Text style={styles.sectionSubtitle}>PLAN BREAKDOWN</Text>
              <View style={styles.pillContainer}>
                {renderPillButton(
                  'Daily working plan',
                  'settings-outline',
                  false,
                )}
              </View>
            </>
          )}

          {activePlanTab === 'Progress' && (
            <>
              <Text style={styles.sectionSubtitle}>PROGRESS BREAKDOWN</Text>
              <View style={styles.pillContainer}>
                {renderPillButton(
                  'Daily Working Plan Progress',
                  'bar-chart-outline',
                  false,
                )}
              </View>
            </>
          )}

          {activePlanTab === 'Performance' && (
            <>
              <Text style={styles.sectionSubtitle}>PERFORMANCE METRICS</Text>
              <View style={styles.pillContainer}>
                {renderPillButton('KPI Dashboard', 'pie-chart-outline', false)}
                {renderPillButton(
                  'Sales Vs Target',
                  'stats-chart-outline',
                  false,
                )}
                {renderPillButton('Product Sales', 'cube-outline', false)}
                {renderPillButton('Customer Sales', 'people-outline', false)}
              </View>
            </>
          )}
        </View>

        {/* Card 2: Customer */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIconWrap,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <Icon name="people" size={16} color={theme.colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Customer
            </Text>
          </View>

          <View style={styles.pillContainer}>
            {renderPillButton(
              'Generate Order',
              'document-text-outline',
              false,
              () => navigation.navigate('SalesGenerateOrder'),
            )}
            {renderPillButton(
              'View Order Status',
              'document-text-outline',
              false,
              () => navigation.navigate('SalesTrackOrderStatus'),
            )}
            {renderPillButton(
              'View Shipping Info',
              'document-text-outline',
              false,
            )}
            {renderPillButton(
              'View Customer Balances',
              'document-text-outline',
              false,
            )}
          </View>
        </View>

        {/* Card 3: Raise Request */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIconWrap,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <Icon name="megaphone" size={16} color={theme.colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Raise Request
            </Text>
          </View>

          <View style={styles.pillContainer}>
            {renderPillButton(
              'Promotional',
              'diamond-outline',
              activeRaiseTab === 'Promotional',
              () => setActiveRaiseTab('Promotional'),
            )}
            {renderPillButton(
              'Expense',
              'cash-outline',
              activeRaiseTab === 'Expense',
              () => setActiveRaiseTab('Expense'),
            )}
          </View>

          {activeRaiseTab === 'Promotional' && (
            <>
              <Text style={styles.sectionSubtitle}>PROMOTIONAL CAMPAIGNS</Text>
              <View style={styles.pillContainer}>
                {renderPillButton('Samples', 'flask-outline', false, () =>
                  navigation.navigate('CRMSampleRequest'),
                )}
                {renderPillButton('Giveaway', 'gift-outline', false, () =>
                  navigation.navigate('CRMGiveawayRequest'),
                )}
                {renderPillButton('Workshop', 'easel-outline', false, () =>
                  navigation.navigate('CRMWorkshopRequest'),
                )}
                {renderPillButton('Conference', 'mic-outline', false)}
              </View>
            </>
          )}

          {activeRaiseTab === 'Expense' && (
            <>
              <Text style={styles.sectionSubtitle}>EXPENSE REQUESTS</Text>
              <View style={styles.pillContainer}>
                {renderPillButton(
                  'Monthly Expense',
                  'calendar-outline',
                  false,
                  () => navigation.navigate('CRMMonthlyExpense'),
                )}
                {renderPillButton(
                  'Additional Expense Request',
                  'add-circle-outline',
                  false,
                )}
              </View>
            </>
          )}
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
    card: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    pillContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 8,
    },
    pillButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
    },
    pillButtonPrimary: {
      backgroundColor: theme.colors.primary,
    },
    pillButtonSecondary: {
      backgroundColor: 'transparent',
    },
    pillButtonText: {
      fontSize: 13,
      fontWeight: '600',
    },
    pillButtonTextPrimary: {
      color: '#FFFFFF',
    },
    pillButtonTextSecondary: theme => ({
      color: theme.colors.primary,
    }),
    sectionSubtitle: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      marginTop: 12,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });

export default SalesCRMScreen;
