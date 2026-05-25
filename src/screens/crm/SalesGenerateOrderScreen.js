import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { generateAndShareStatementPDF } from '../../utils/PDFExportService';
import {
  useGetDebtorsMasterQuery,
  useGetOutstandingReportMutation,
} from '@api/portalApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@store/slices/authSlice';
import { CustomAlertModal } from '@components/common';

const CustomerCard = ({ item, theme }) => {
  const styles = getCardStyles(theme);
  const navigation = useNavigation();
  const user = useSelector(selectCurrentUser);
  const [modalConfig, setModalConfig] = React.useState({
    visible: false,
    title: '',
    message: '',
  });

  const cleanName = item.name ? item.name.replace(/&amp;/g, '&') : '';
  const displayName = item.city ? `${cleanName} , ${item.city}` : cleanName;

  const [getOutstandingReport, { isLoading: isReportLoading }] =
    useGetOutstandingReportMutation();

  const handleSharePDF = async () => {
    try {
      const res = await getOutstandingReport({
        company: user?.company_user_code,
        customer_id: item.person_id,
      }).unwrap();

      if (res && String(res.status) === 'true') {
        await generateAndShareStatementPDF(
          cleanName,
          item.payment_terms || 0,
          res.data || [],
          user?.company_name,
        );
      } else {
        await generateAndShareStatementPDF(
          cleanName,
          item.payment_terms || 0,
          [],
          user?.company_name,
        );
      }
    } catch (e) {
      console.log('Error in handleSharePDF:', e);
      setModalConfig({
        visible: true,
        title: 'Share Cancelled',
        message: e.message || 'User did not share.',
      });
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Icon name="person" size={16} color={theme.colors.primary} />
        </View>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {displayName}
        </Text>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Left Column: Details */}
        <View style={styles.detailsColumn}>
          {/* Outstanding */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('CustomerBalanceDetails', {
                customerId: item.person_id || item.customer_id,
                customerName: item.name,
                company: user?.company_user_code,
              })
            }
          >
            <View style={styles.detailRow}>
              <Icon name="pie-chart" size={14} color={theme.colors.primary} />
              <Text style={styles.detailLabel}>OUTSTANDING</Text>
            </View>
            <Text style={styles.detailValueRed}>
              {Math.floor(item.outstanding || 0).toLocaleString()}
            </Text>
          </TouchableOpacity>

          {/* Due */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('CustomerAging', {
                customerId: item.person_id || item.customer_id,
                customerName: item.name,
                company: user?.company_user_code,
              })
            }
            style={{ marginTop: 12 }}
          >
            <View style={styles.detailRow}>
              <Icon name="warning" size={14} color={theme.colors.primary} />
              <Text style={styles.detailLabel}>DUE</Text>
            </View>
            <Text style={styles.detailValueRed}>{item.due ?? '0'}</Text>
          </TouchableOpacity>

          {/* Payment Terms */}
          <View style={[styles.detailRow, { marginTop: 12 }]}>
            <Icon name="document-text" size={14} color={theme.colors.primary} />
            <Text style={styles.detailLabel}>PAYMENT TERMS</Text>
          </View>
          <Text style={styles.detailValueBlack}>
            {item.payment_terms ? `${item.payment_terms}` : '0'}
          </Text>

          {/* Credit Limit */}
          <View style={[styles.detailRow, { marginTop: 12 }]}>
            <Icon name="card" size={14} color={theme.colors.primary} />
            <Text style={styles.detailLabel}>CREDIT LIMIT</Text>
          </View>
          <Text style={styles.detailValueBlack}>
            {item.credit_limit ?? '0'}
          </Text>
        </View>

        {/* Right Column: Buttons */}
        <View style={styles.actionsColumn}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.primary + '0D',
              },
            ]}
            onPress={() =>
              navigation.navigate('SalesOrderForm', { customer: item })
            }
          >
            <Icon name="cart" size={16} color={theme.colors.primary} />
            <Text
              style={[styles.actionBtnText, { color: theme.colors.primary }]}
            >
              New Order
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.primary + '0D',
              },
            ]}
            onPress={() =>
              navigation.navigate('SalesPayment', { customer: item })
            }
          >
            <Icon name="cash" size={16} color={theme.colors.primary} />
            <Text
              style={[styles.actionBtnText, { color: theme.colors.primary }]}
            >
              Payment
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.primary + '0D',
              },
            ]}
            onPress={handleSharePDF}
            disabled={isReportLoading}
          >
            {isReportLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Icon
                name="share-social"
                size={16}
                color={theme.colors.primary}
              />
            )}
            <Text
              style={[styles.actionBtnText, { color: theme.colors.primary }]}
            >
              Outstanding
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <CustomAlertModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setModalConfig({ ...modalConfig, visible: false })}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>LAST ORDER</Text>
          <Text style={styles.footerValueBlack}>{item.last_order ?? '—'}</Text>
        </View>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>DATE</Text>
          <Text style={styles.footerValueBlack}>
            {item.last_order_date || 'N/A'}
          </Text>
        </View>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>DAYS</Text>
          <Text style={styles.footerValueRed}>{item.days ?? 'N/A'}</Text>
        </View>
      </View>
    </View>
  );
};

const SalesGenerateOrderScreen = () => {
  const { theme } = useTheme();
  const user = useSelector(selectCurrentUser);
  const [searchQuery, setSearchQuery] = React.useState('');
  const styles = getCardStyles(theme);

  const { data, isLoading, isFetching, refetch, error } =
    useGetDebtorsMasterQuery(
      {
        company: user?.company_user_code,
        user_id: user?.company_user_id,
      },
      { skip: !user?.company_user_code || !user?.company_user_id },
    );

  const customerCards = useMemo(() => {
    try {
      let dataArray = [];

      // Handle string response
      let parsedData = data;
      if (typeof data === 'string') {
        try {
          // Extract from first { or [ to the last } or ]
          const match = data.match(/(\{|\[)[\s\S]*(\}|\])/);
          if (match) {
            parsedData = JSON.parse(match[0]);
          } else {
            parsedData = JSON.parse(data);
          }
        } catch (e) {
          console.log('JSON Parse Error:', e, 'Raw Data:', data);
        }
      }

      // Handle { status, data: [] } vs [...]
      if (parsedData && Array.isArray(parsedData.data)) {
        dataArray = parsedData.data;
      } else if (Array.isArray(parsedData)) {
        dataArray = parsedData;
      }

      if (dataArray.length > 0) {
        if (!searchQuery) return dataArray;

        return dataArray.filter(customer => {
          const query = searchQuery.toLowerCase();
          const matchesName = (customer.name || '').toLowerCase().includes(query);
          const matchesCity = (customer.city || '').toLowerCase().includes(query);
          
          return matchesName || matchesCity;
        });
      }
    } catch (e) {
      console.log('Error parsing data:', e);
    }
    return [];
  }, [data, searchQuery]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['bottom', 'left', 'right']}
    >
      {isLoading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <Text style={{ color: theme.colors.error, textAlign: 'center' }}>
            Failed to load customers.
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 16,
              padding: 10,
              backgroundColor: theme.colors.primary,
              borderRadius: 8,
            }}
            onPress={refetch}
          >
            <Text style={{ color: '#fff' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Search Section */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Icon name="search" size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by Name or City..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="close-circle" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <FlatList
            data={customerCards}
            keyExtractor={(item, index) => item.debtor_no + '-' + index}
            renderItem={({ item }) => <CustomerCard item={item} theme={theme} />}
            contentContainerStyle={{ padding: 16, gap: 16 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} />
            }
            ListEmptyComponent={
              <View style={{ padding: 20 }}>
                <Text
                  style={{
                    textAlign: 'center',
                    color: theme.colors.textSecondary,
                  }}
                >
                  {searchQuery ? 'No customers match your search.' : 
                  (!user?.company_user_code || !user?.company_user_id
                    ? 'Missing company_user_code or company_user_id for API.'
                    : data
                    ? 'No customers found.'
                    : 'No customers found.')}
                </Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
};

const getCardStyles = theme =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    header: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    iconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    headerTitle: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      flex: 1,
      lineHeight: 22,
    },
    body: {
      flexDirection: 'row',
      padding: 16,
      justifyContent: 'space-between',
    },
    detailsColumn: {
      flex: 1,
      paddingRight: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    detailLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: '#64748b',
      marginLeft: 6,
      letterSpacing: 0.5,
    },
    detailValueRed: {
      fontSize: 15,
      fontWeight: '600',
      color: '#ef4444',
      marginLeft: 20,
    },
    detailValueBlack: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1e293b',
      marginLeft: 20,
    },
    actionsColumn: {
      flex: 1,
      justifyContent: 'center',
      gap: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 24,
      borderWidth: 1,
    },
    btnNewOrder: {
      borderColor: '#1f3d58',
      backgroundColor: '#f8fafc',
    },
    btnPayment: {
      borderColor: '#10b981',
      backgroundColor: '#f0fdf4',
    },
    btnReturn: {
      borderColor: '#ef4444',
      backgroundColor: '#fef2f2',
    },
    actionBtnText: {
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 6,
    },
    footer: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: '#f1f5f9',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: '#fafafa',
    },
    footerCol: {
      flex: 1,
      alignItems: 'center',
    },
    footerLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: '#64748b',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    footerValueBlack: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1e293b',
    },
    footerValueRed: {
      fontSize: 13,
      fontWeight: '600',
      color: '#ef4444',
    },
    // Search Styles
    searchContainer: {
      padding: 16,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 48,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: 8,
    },
    criteriaContainer: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 8,
    },
    criteriaChip: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    activeCriteriaChip: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    criteriaText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    activeCriteriaText: {
      color: '#FFFFFF',
    },
  });

const getStyles = (theme) => {
  // Adding this to avoid reference error if getStyles is used elsewhere
  return StyleSheet.create({});
};

export default SalesGenerateOrderScreen;
