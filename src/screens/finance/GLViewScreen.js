import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { useGetViewGLMutation } from '@api/voidApi';

const GLViewScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const {
    glData: initialGlData,
    trans_no,
    type,
    reference,
    dimension_id,
    company = 'ANS',
  } = route.params || {};

  const [glData, setGLData] = useState(initialGlData || null);
  const [getViewGL, { isLoading }] = useGetViewGLMutation();
  const [refreshing, setRefreshing] = useState(false);

  const fetchGLData = async () => {
    if (!trans_no && !type) return;
    try {
      const payload = {
        company,
        trans_no,
        type,
        ...(dimension_id !== undefined ? { dimension_id } : {}),
      };
      const res = await getViewGL(payload).unwrap();
      if (res && (res.status_header === 'true' || res.status === true || res.data_header)) {
        setGLData(res);
      } else {
        setGLData(res || { empty: true });
      }
    } catch (err) {
      console.log('GLViewScreen fetch error:', err);
    }
  };

  useEffect(() => {
    if (!initialGlData && trans_no && type) {
      fetchGLData();
    }
  }, [trans_no, type]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGLData();
    setRefreshing(false);
  };

  const formatNumber = num => {
    if (num === null || num === undefined || num === '') return '-';
    const parsed = parseFloat(num);
    if (isNaN(parsed) || parsed === 0) return '-';
    return parsed.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const header =
    glData?.data_header?.[0] ||
    (Array.isArray(glData?.data_header) ? glData.data_header[0] : null) ||
    (Array.isArray(glData) ? glData[0] : null) ||
    {};

  const details =
    glData?.data_detail ||
    (Array.isArray(glData?.data) ? glData.data : []) ||
    [];

  // Calculate totals
  const totalDebit = details.reduce((sum, item) => {
    const val = parseFloat(item.debit) || 0;
    return sum + val;
  }, 0);

  const totalCredit = details.reduce((sum, item) => {
    const val = parseFloat(item.credit) || 0;
    return sum + Math.abs(val);
  }, 0);

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const renderHeaderField = (label, value, icon) => {
    if (!value && value !== 0) return null;
    return (
      <View style={styles.fieldRow}>
        <View style={styles.fieldLabelContainer}>
          {icon && (
            <Ionicons
              name={icon}
              size={15}
              color={theme.colors.textSecondary}
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
            {label}
          </Text>
        </View>
        <Text style={[styles.fieldValue, { color: theme.colors.text }]}>
          {value}
        </Text>
      </View>
    );
  };

  const hasHeaderData =
    header.reference ||
    header.trans_date ||
    header.name ||
    header.real_name ||
    header.cheque_no ||
    reference;

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {isLoading && !glData ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading General Ledger...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Header Card */}
          {hasHeaderData && (
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
                <View style={styles.badge}>
                  <Ionicons
                    name="receipt-outline"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[styles.badgeText, { color: theme.colors.primary }]}
                  >
                    {header.reference || reference || `Trans #${trans_no || 'N/A'}`}
                  </Text>
                </View>
                {header.trans_date && (
                  <Text
                    style={[
                      styles.dateText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {header.trans_date}
                  </Text>
                )}
              </View>

              <View style={styles.divider} />

              {renderHeaderField('Reference', header.reference || reference, 'bookmark-outline')}
              {renderHeaderField('Date', header.trans_date, 'calendar-outline')}
              {renderHeaderField('Payee / Name', header.name, 'person-outline')}
              {renderHeaderField('Entered By', header.real_name, 'person-circle-outline')}
              {renderHeaderField('Cheque No', header.cheque_no, 'card-outline')}
              {renderHeaderField('Cheque Date', header.cheque_date, 'calendar-number-outline')}
              {renderHeaderField('Supplier Ref', header.supp_reference, 'business-outline')}
            </View>
          )}

          {/* GL Details Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="list-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                General Ledger Entries
              </Text>
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: theme.colors.primary + '15' },
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    { color: theme.colors.primary },
                  ]}
                >
                  {details.length}
                </Text>
              </View>
            </View>

            {details.length > 0 ? (
              <View
                style={[
                  styles.tableCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                {/* Table Header */}
                <View
                  style={[
                    styles.tableRow,
                    styles.tableHeaderRow,
                    { backgroundColor: theme.colors.primary + '12' },
                  ]}
                >
                  <Text
                    style={[
                      styles.tableHeaderCell,
                      { flex: 2, color: theme.colors.textSecondary },
                    ]}
                  >
                    Account
                  </Text>
                  <Text
                    style={[
                      styles.tableHeaderCell,
                      {
                        flex: 1,
                        textAlign: 'right',
                        color: theme.colors.textSecondary,
                      },
                    ]}
                  >
                    Debit (Rs.)
                  </Text>
                  <Text
                    style={[
                      styles.tableHeaderCell,
                      {
                        flex: 1,
                        textAlign: 'right',
                        color: theme.colors.textSecondary,
                      },
                    ]}
                  >
                    Credit (Rs.)
                  </Text>
                </View>

                {/* Table Body */}
                {details.map((item, index) => {
                  const debitVal = parseFloat(item.debit) || 0;
                  const creditVal = parseFloat(item.credit) || 0;
                  const isEven = index % 2 === 0;

                  return (
                    <View
                      key={index}
                      style={[
                        styles.tableRow,
                        {
                          borderBottomColor: theme.colors.border,
                          backgroundColor: isEven
                            ? 'transparent'
                            : theme.colors.background + '60',
                        },
                      ]}
                    >
                      <View style={{ flex: 2, paddingRight: 6 }}>
                        <Text
                          style={[styles.accountName, { color: theme.colors.text }]}
                        >
                          {item.account_name || 'N/A'}
                        </Text>
                        <Text
                          style={[
                            styles.accountCode,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {item.account || ''}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.amountCell,
                          {
                            flex: 1,
                            textAlign: 'right',
                            color:
                              debitVal > 0
                                ? theme.colors.success || '#10b981'
                                : theme.colors.textSecondary,
                            fontWeight: debitVal > 0 ? '700' : '500',
                          },
                        ]}
                      >
                        {formatNumber(item.debit)}
                      </Text>
                      <Text
                        style={[
                          styles.amountCell,
                          {
                            flex: 1,
                            textAlign: 'right',
                            color:
                              creditVal !== 0
                                ? theme.colors.error || '#ef4444'
                                : theme.colors.textSecondary,
                            fontWeight: creditVal !== 0 ? '700' : '500',
                          },
                        ]}
                      >
                        {formatNumber(Math.abs(creditVal))}
                      </Text>
                    </View>
                  );
                })}

                {/* Table Footer Totals */}
                <View
                  style={[
                    styles.tableRow,
                    styles.tableFooterRow,
                    {
                      backgroundColor: theme.colors.primary + '08',
                      borderTopColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.totalLabel, { flex: 2, color: theme.colors.text }]}
                  >
                    Total
                  </Text>
                  <Text
                    style={[
                      styles.totalAmount,
                      {
                        flex: 1,
                        textAlign: 'right',
                        color: theme.colors.success || '#10b981',
                      },
                    ]}
                  >
                    {totalDebit > 0 ? totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </Text>
                  <Text
                    style={[
                      styles.totalAmount,
                      {
                        flex: 1,
                        textAlign: 'right',
                        color: theme.colors.error || '#ef4444',
                      },
                    ]}
                  >
                    {totalCredit > 0 ? totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </Text>
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="document-outline"
                  size={44}
                  color={theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  No GL entries found
                </Text>
                <Text
                  style={[
                    styles.emptySub,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  There are no general ledger records for this transaction.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      fontWeight: '500',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    card: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    badgeText: {
      fontSize: 15,
      fontWeight: '800',
    },
    dateText: {
      fontSize: 13,
      fontWeight: '600',
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 10,
    },
    fieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 7,
      borderBottomWidth: 0.5,
      borderBottomColor: 'rgba(0,0,0,0.04)',
    },
    fieldLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    fieldValue: {
      fontSize: 13,
      fontWeight: '700',
      flex: 1.2,
      textAlign: 'right',
    },
    section: {
      marginBottom: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      flex: 1,
    },
    countBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    countBadgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    tableCard: {
      borderRadius: 14,
      borderWidth: 1,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    tableRow: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 10,
      alignItems: 'center',
      borderBottomWidth: 1,
    },
    tableHeaderRow: {
      paddingVertical: 10,
    },
    tableHeaderCell: {
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    accountName: {
      fontSize: 13,
      fontWeight: '700',
    },
    accountCode: {
      fontSize: 11,
      marginTop: 2,
    },
    amountCell: {
      fontSize: 13,
    },
    tableFooterRow: {
      borderBottomWidth: 0,
      borderTopWidth: 1.5,
      paddingVertical: 12,
    },
    totalLabel: {
      fontSize: 13,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    totalAmount: {
      fontSize: 13,
      fontWeight: '800',
    },
    emptyCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderStyle: 'dashed',
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      marginTop: 10,
      fontSize: 15,
      fontWeight: '700',
    },
    emptySub: {
      marginTop: 4,
      fontSize: 12,
      textAlign: 'center',
    },
  });

export default GLViewScreen;
