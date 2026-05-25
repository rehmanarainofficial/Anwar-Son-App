import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { useGetDebtorsMasterQuery } from '@api/portalApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@store/slices/authSlice';

const CustomerBalanceRow = ({ item, theme }) => {
  const styles = getRowStyles(theme);
  const navigation = useNavigation();
  const user = useSelector(selectCurrentUser);

  const cleanName = item.name ? item.name.replace(/&amp;/g, '&') : '';

  return (
    <View style={styles.rowContainer}>
      {/* Col 1: Customer Name & Badges */}
      <View style={styles.colName}>
        <Text style={styles.customerName} numberOfLines={2}>
          {cleanName}
        </Text>
        <View style={styles.badgeRow}>
          <View style={styles.badgeAdvance}>
            <Icon name="time-outline" size={10} color="#15803d" />
            <Text style={styles.badgeAdvanceText}>Advance Payment</Text>
          </View>
          <View style={styles.badgeLimit}>
            <Icon name="trending-down-outline" size={10} color="#1d4ed8" />
            <Text style={styles.badgeLimitText}>
              Limit: {item.credit_limit ?? '0'}
            </Text>
          </View>
        </View>
      </View>

      {/* Col 2: City */}
      <View style={styles.colCity}>
        <Icon
          name="location"
          size={14}
          color="#64748b"
          style={{ marginRight: 4 }}
        />
        <Text style={styles.cityText} numberOfLines={1}>
          {item.city || 'N/A'}
        </Text>
      </View>

      {/* Col 3: Balance */}
      <View style={styles.colBalance}>
        <Text style={styles.balanceLabel}>
          Outstanding:{' '}
          <Text style={styles.balanceValueGreen}>
            {parseFloat(
              String(item.outstanding || 0).replace(/,/g, ''),
            ).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </Text>
        <Text style={styles.balanceLabel}>
          Due:{' '}
          <Text style={styles.balanceValueRed}>
            {parseFloat(item.due?.replace(/,/g, '') || 0).toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}
          </Text>
        </Text>
      </View>

      {/* Col 4: Buttons Stacked */}
      <View style={styles.colActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            navigation.navigate('CustomerBalanceDetails', {
              customerId: item.person_id || item.customer_id,
              customerName: item.name,
              company: user?.company_user_code,
            })
          }
        >
          <Icon
            name="book-outline"
            size={12}
            color="#475569"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.actionBtnText}>Outstand</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { marginTop: 6 }]}
          onPress={() => {
            const today = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);

            navigation.navigate('Ledger', {
              personId: item.person_id || item.customer_id,
              account: item.account,
              company: user?.company_user_code,
              title: item.name,
              type: 'customer',
              fromDate: thirtyDaysAgo.toISOString(),
              toDate: today.toISOString(),
            });
          }}
        >
          <Icon
            name="stats-chart"
            size={12}
            color="#475569"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.actionBtnText}>Ledger</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CustomerBalanceScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const user = useSelector(selectCurrentUser);

  const { data, isLoading, isFetching, refetch, error } =
    useGetDebtorsMasterQuery(
      {
        company: user?.company_user_code,
        user_id: user?.company_user_id,
      },
      { skip: !user?.company_user_code || !user?.company_user_id },
    );

  const customerData = useMemo(() => {
    try {
      let dataArray = [];
      let parsedData = data;

      if (typeof data === 'string') {
        const match = data.match(/(\{|\[)[\s\S]*(\}|\])/);
        if (match) {
          parsedData = JSON.parse(match[0]);
        } else {
          parsedData = JSON.parse(data);
        }
      }

      if (parsedData && Array.isArray(parsedData.data)) {
        dataArray = parsedData.data;
      } else if (Array.isArray(parsedData)) {
        dataArray = parsedData;
      }

      return dataArray;
    } catch (e) {
      return [];
    }
  }, [data]);

  const totalCustomers = customerData.length;
  const totalDue = customerData.reduce(
    (acc, curr) =>
      acc + parseFloat(String(curr.due || 0).replace(/,/g, '')),
    0,
  );
  const totalOutstanding = customerData.reduce(
    (acc, curr) =>
      acc + parseFloat(String(curr.outstanding || 0).replace(/,/g, '')),
    0,
  );

  const formatNumber = num => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Top Stats Header */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
        >
          {/* Total Customers */}
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconBg,
                { backgroundColor: theme.colors.primary + '1A' },
              ]}
            >
              <Icon name="people" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.statLabel}>TOTAL CUSTOMERS</Text>
            <Text style={styles.statValueDark}>{totalCustomers}</Text>
            <View style={styles.statFooterRow}>
              <Icon
                name="person"
                size={12}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.statFooterText}>Active accounts</Text>
            </View>
          </View>

          {/* Total Outstanding */}
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconBg,
                { backgroundColor: theme.colors.success + '1A' || '#dcfce7' },
              ]}
            >
              <Icon
                name="pie-chart"
                size={20}
                color={theme.colors.success || '#16a34a'}
              />
            </View>
            <Text style={styles.statLabel}>TOTAL OUTSTANDING</Text>
            <Text style={styles.statValueGreen}>
              {formatNumber(totalOutstanding)}
            </Text>
            <View style={styles.statFooterRow}>
              <Icon
                name="trending-up"
                size={12}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.statFooterText}>Total receivables</Text>
            </View>
          </View>

          {/* Total Due */}
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconBg,
                { backgroundColor: theme.colors.error + '1A' },
              ]}
            >
              <Icon name="warning" size={20} color={theme.colors.error} />
            </View>
            <Text style={styles.statLabel}>TOTAL DUE</Text>
            <Text style={styles.statValueRed}>{formatNumber(totalDue)}</Text>
            <View style={styles.statFooterRow}>
              <Icon name="time" size={12} color={theme.colors.textSecondary} />
              <Text style={styles.statFooterText}>Overdue + Current Due</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Portfolio Header */}
      <View style={styles.portfolioHeader}>
        <View>
          <View style={styles.portfolioTitleRow}>
            <Icon
              name="people"
              size={20}
              color={theme.colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.portfolioTitle}>Customer Portfolio</Text>
          </View>
          <Text style={styles.portfolioSubtitle}>
            Real-time outstanding & due insights
          </Text>
        </View>

        <View style={styles.ledgerAccessBtn}>
          <Icon
            name="stats-chart"
            size={12}
            color={theme.colors.text}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.ledgerAccessText}>Ledger / Detail Access</Text>
        </View>
      </View>

      {/* Table Header Row */}
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderLabel, { flex: 1.5 }]}>
          CUSTOMER NAME
        </Text>
        <Text style={[styles.tableHeaderLabel, { flex: 1 }]}>CITY NAME</Text>
        <Text style={[styles.tableHeaderLabel, { flex: 1.5 }]}>
          BALANCE (OUTSTANDING)
        </Text>
        <Text
          style={[styles.tableHeaderLabel, { flex: 1, textAlign: 'center' }]}
        >
          ACTIONS
        </Text>
      </View>

      {/* List */}
      {isLoading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerMsg}>
          <Text style={{ color: theme.colors.error }}>
            Failed to load customers.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={{ color: '#fff' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={customerData}
          keyExtractor={(item, index) => item.debtor_no + '-' + index}
          renderItem={({ item }) => (
            <CustomerBalanceRow item={item} theme={theme} />
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={styles.centerMsg}>
              <Text style={{ color: theme.colors.textSecondary }}>
                No customers found.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const getRowStyles = theme =>
  StyleSheet.create({
    rowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    colName: {
      flex: 1.5,
      paddingRight: 8,
    },
    customerName: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.text,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    badgeAdvance: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.success + '1A' || '#dcfce7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 12,
    },
    badgeAdvanceText: {
      fontSize: 9,
      color: theme.colors.success || '#15803d',
      fontWeight: '600',
      marginLeft: 2,
    },
    badgeLimit: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '1A',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 12,
    },
    badgeLimitText: {
      fontSize: 9,
      color: theme.colors.primary,
      fontWeight: '600',
      marginLeft: 2,
    },
    colCity: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 8,
    },
    cityText: {
      fontSize: 12,
      color: theme.colors.text,
      fontWeight: '500',
      flex: 1,
    },
    colBalance: {
      flex: 1.5,
      paddingRight: 8,
    },
    balanceLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 2,
    },
    balanceValueRed: {
      color: theme.colors.error,
    },
    balanceValueGreen: {
      color: theme.colors.success || '#16a34a',
    },
    colActions: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 8,
      width: '100%',
    },
    actionBtnText: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.colors.text,
    },
  });

const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    statsContainer: {
      padding: 16,
      gap: 12,
    },
    statCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    statIconBg: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    statValueDark: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.text,
      marginBottom: 8,
    },
    statValueRed: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.error,
      marginBottom: 8,
    },
    statValueGreen: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.success || '#16a34a',
      marginBottom: 8,
    },
    statFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statFooterText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginLeft: 6,
    },
    portfolioHeader: {
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginHorizontal: 8,
      marginTop: 8,
    },
    portfolioTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    portfolioTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.text,
    },
    portfolioSubtitle: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    ledgerAccessBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
    },
    ledgerAccessText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.text,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginHorizontal: 8,
    },
    tableHeaderLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.colors.text,
    },
    centerMsg: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    retryBtn: {
      marginTop: 16,
      padding: 10,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
    },
  });

export default CustomerBalanceScreen;
