import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Orientation from 'react-native-orientation-locker';
import { useTheme } from '@config/useTheme';
import { DateFilter, LoadingSpinner, PersonDropdown, DimensionDropdown } from '@components/common';
import { useGetCustomerBalanceDetailsMutation, useGetSupplierBalanceDetailsMutation } from '@api/ledgerApi';
import { useSelector } from 'react-redux';

const CustomerBalanceDetailsScreen = ({ route, navigation }) => {
  const { customerId, customerName, supplierId, supplierName, type, company: pCompany } = route.params || {};
  const { theme } = useTheme();
  const globalCompany = useSelector(state => state.auth.company);
  const company = pCompany || globalCompany;
  
  const isSupplier = type === 'supplier' || !!supplierId;
  const displayName = customerName || supplierName;
  const initialEntityId = customerId || supplierId;

  const isGenericReport = !!type && !initialEntityId;

  const [entityId, setEntityId] = useState(initialEntityId);
  const [selectedPersonObj, setSelectedPersonObj] = useState(null);
  const [dimensionId, setDimensionId] = useState(0);

  const [getCustomerBalanceDetails, { isLoading: isCustomerLoading }] = useGetCustomerBalanceDetailsMutation();
  const [getSupplierBalanceDetails, { isLoading: isSupplierLoading }] = useGetSupplierBalanceDetailsMutation();
  const isLoading = isCustomerLoading || isSupplierLoading;
  const [balanceData, setBalanceData] = useState([]);
  const [opening, setOpening] = useState('0');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  useEffect(() => {
    const currentName = selectedPersonObj ? selectedPersonObj.name : displayName;
    const decodedName = currentName ? currentName.replace(/&amp;/g, '&') : (isSupplier ? 'Supplier Balance Details' : 'Balance Details');
    const truncatedName =
      decodedName.length > 25
        ? decodedName.substring(0, 22) + '...'
        : decodedName;
    navigation.setOptions({
      title: truncatedName,
    });
  }, [navigation, displayName, selectedPersonObj, isSupplier]);

  useEffect(() => {
    Orientation.lockToLandscape();

    // Set default one month range
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const formattedStart = formatDateForAPI(thirtyDaysAgo);
    const formattedEnd = formatDateForAPI(today);

    setFromDate(thirtyDaysAgo);
    setToDate(today);

    // Fetch data with formatted dates only if we have an entityId initially
    if (initialEntityId) {
      fetchDataWithFormattedDates(initialEntityId, formattedStart, formattedEnd, 0);
    }

    return () => {
      Orientation.lockToPortrait();
    };
  }, []);

  const fetchDataWithFormattedDates = async (idToFetch, fromDateStr, toDateStr, dimToFetch) => {
    if (!idToFetch) return;
    try {
      let response;
      if (isSupplier) {
        response = await getSupplierBalanceDetails({
          company: company,
          supplier_id: idToFetch,
          from_date: fromDateStr,
          to_date: toDateStr,
          dimension_id: dimToFetch || 0,
        }).unwrap();
      } else {
        response = await getCustomerBalanceDetails({
          company: company,
          customer_id: idToFetch,
          from_date: fromDateStr,
          to_date: toDateStr,
          dimension_id: dimToFetch || 0,
        }).unwrap();
      }

      if (response && response.status_cust_age === 'true') {
        setBalanceData(response.data_cust_age || []);
        setOpening(response.opening || '0');
      } else {
        setBalanceData([]);
        setOpening('0');
      }
    } catch (error) {
      console.log('Balance details fetch error:', error);
      setBalanceData([]);
      setOpening('0');
    }
  };

  const formatDateForAPI = date => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchData = async (start, end) => {
    if (entityId) {
      const formattedStart = formatDateForAPI(start);
      const formattedEnd = formatDateForAPI(end);
      await fetchDataWithFormattedDates(entityId, formattedStart, formattedEnd, dimensionId);
    }
  };

  const handleApplyFilter = () => {
    fetchData(fromDate, toDate);
  };

  const handlePersonSelect = (person) => {
    setSelectedPersonObj(person);
    setEntityId(person.id);
  };

  const calculateClosing = () => {
    // Get the last transaction's balance from the table
    if (balanceData.length > 0) {
      const lastItem = balanceData[balanceData.length - 1];
      return parseAmount(lastItem.balance).toLocaleString();
    }
    return parseAmount(opening).toLocaleString();
  };

  const s = getStyles(theme);

  const renderHeader = () => (
    <View style={s.summaryContainer}>
      <View style={[s.summaryCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[s.summaryLabel, { color: theme.colors.textSecondary }]}>
          Opening
        </Text>
        <Text style={[s.summaryValue, { color: theme.colors.primary }]}>
          {parseFloat(opening).toLocaleString()}
        </Text>
      </View>
      <View style={[s.summaryCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[s.summaryLabel, { color: theme.colors.textSecondary }]}>
          Closing
        </Text>
        <Text style={[s.summaryValue, { color: theme.colors.success }]}>
          {calculateClosing()}
        </Text>
      </View>
    </View>
  );

  const TableHeader = () => (
    <View
      style={[
        s.tableRow,
        s.tableHeader,
        { backgroundColor: theme.colors.primary + '20' },
      ]}
    >
      <Text
        style={[s.cell, s.cellReference, s.headerText, { color: theme.colors.text }]}
      >
        Reference
      </Text>
      <Text
        style={[s.cell, s.cellDate, s.headerText, { color: theme.colors.text }]}
      >
        Date
      </Text>
      <Text
        style={[s.cell, s.cellRate, s.headerText, { color: theme.colors.text }]}
      >
        Rate
      </Text>
      <Text
        style={[s.cell, s.cellQty, s.headerText, { color: theme.colors.text }]}
      >
        Qty
      </Text>
      <Text
        style={[s.cell, s.cellDisc, s.headerText, { color: theme.colors.text }]}
      >
        Disc%
      </Text>
      <Text
        style={[s.cell, s.cellTotal, s.headerText, { color: theme.colors.text }]}
      >
        Total
      </Text>
      <Text
        style={[s.cell, s.cellDebit, s.headerText, { color: theme.colors.text }]}
      >
        Dr
      </Text>
      <Text
        style={[s.cell, s.cellCredit, s.headerText, { color: theme.colors.text }]}
      >
        Cr
      </Text>
      <Text
        style={[s.cell, s.cellBalance, s.headerText, { color: theme.colors.text }]}
      >
        Balance
      </Text>
    </View>
  );

  const parseAmount = (amountStr) => {
    if (!amountStr) return 0;
    return parseFloat(amountStr.toString().replace(/,/g, '')) || 0;
  };

  const calculateItemTotal = (item) => {
    const rate = parseFloat(item.unit_price || 0);
    const qty = parseFloat(item.quantity || 0);
    const disc = parseFloat(item.discount_percent || 0);
    const total = rate * qty;
    const discountAmount = total * (disc / 100);
    return total - discountAmount;
  };

  const renderItemRow = (item, index, isNested = false) => (
    <View
      style={[
        s.tableRow,
        { borderBottomColor: theme.colors.border },
        index % 2 === 0 && !isNested && {
          backgroundColor: theme.colors.surface + '10',
        },
        isNested && { backgroundColor: theme.colors.primary + '05' },
      ]}
    >
      {/* For nested items: merge Reference and Date columns for description */}
      {isNested ? (
        <View style={[s.cell, s.cellNestedDescription]}>
          <Text style={{ color: theme.colors.text, fontSize: 10, fontStyle: 'italic' }}>
            ↳ {item.description || '-'}
          </Text>
        </View>
      ) : (
        <>
          <View style={[s.cell, s.cellReference]}>
            <Text style={{ color: theme.colors.text, fontSize: 11 }}>
              {item.reference}
            </Text>
          </View>
          <View style={[s.cell, s.cellDate]}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 11 }}>
              {item.tran_date}
            </Text>
          </View>
        </>
      )}
      <View style={[s.cell, s.cellRate]}>
        <Text
          style={{
            color: isNested ? theme.colors.text : theme.colors.textSecondary,
            fontSize: isNested ? 10 : 11,
            fontWeight: isNested ? '500' : '400',
          }}
        >
          {isNested ? parseFloat(item.unit_price || 0).toLocaleString() : '-'}
        </Text>
      </View>
      <View style={[s.cell, s.cellQty]}>
        <Text
          style={{
            color: isNested ? theme.colors.text : theme.colors.textSecondary,
            fontSize: isNested ? 10 : 11,
            fontWeight: isNested ? '500' : '400',
          }}
        >
          {isNested ? parseFloat(item.quantity || 0).toLocaleString() : '-'}
        </Text>
      </View>
      <View style={[s.cell, s.cellDisc]}>
        <Text
          style={{
            color: isNested ? theme.colors.warning : theme.colors.textSecondary,
            fontSize: isNested ? 10 : 11,
            fontWeight: isNested ? '500' : '400',
          }}
        >
          {isNested ? `${item.discount_percent || 0}%` : '-'}
        </Text>
      </View>
      <View style={[s.cell, s.cellTotal]}>
        <Text
          style={{
            color: isNested ? theme.colors.success : theme.colors.textSecondary,
            fontSize: isNested ? 10 : 11,
            fontWeight: isNested ? '600' : '400',
          }}
        >
          {isNested ? calculateItemTotal(item).toLocaleString() : '-'}
        </Text>
      </View>
      <View style={[s.cell, s.cellDebit]}>
        <Text
          style={{
            color: isNested ? theme.colors.textSecondary : parseAmount(item.debit) !== 0 ? theme.colors.error : theme.colors.textSecondary,
            fontSize: isNested ? 10 : 11,
            fontWeight: isNested ? '400' : '600',
          }}
        >
          {isNested ? '-' : parseAmount(item.debit) !== 0 ? parseAmount(item.debit).toLocaleString() : '-'}
        </Text>
      </View>
      <View style={[s.cell, s.cellCredit]}>
        <Text
          style={{
            color: isNested ? theme.colors.textSecondary : parseAmount(item.credit) !== 0 ? theme.colors.success : theme.colors.textSecondary,
            fontSize: isNested ? 10 : 11,
            fontWeight: isNested ? '400' : '600',
          }}
        >
          {isNested ? '-' : parseAmount(item.credit) !== 0 ? parseAmount(item.credit).toLocaleString() : '-'}
        </Text>
      </View>
      <View style={[s.cell, s.cellBalance]}>
        <Text
          style={{
            color: isNested ? theme.colors.textSecondary : theme.colors.text,
            fontSize: isNested ? 10 : 11,
            fontWeight: isNested ? '400' : '700',
          }}
        >
          {isNested ? '-' : parseAmount(item.balance).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const calculateSubtotal = (items) => {
    return items.reduce((acc, item) => {
      const rate = parseFloat(item.unit_price || 0);
      const qty = parseFloat(item.quantity || 0);
      const disc = parseFloat(item.discount_percent || 0);
      const total = rate * qty;
      const discountAmount = total * (disc / 100);
      return acc + (total - discountAmount);
    }, 0);
  };

  const renderExtraCharges = (item) => {
    const charges = [];
    
    if (parseFloat(item.shiping_charges || 0) > 0) {
      charges.push({ label: 'Shipping Charges', value: parseFloat(item.shiping_charges) });
    }
    if (parseFloat(item.tax_amount || 0) > 0) {
      charges.push({ label: 'Tax Amount', value: parseFloat(item.tax_amount) });
    }
    if (parseFloat(item.total_discount || 0) > 0) {
      charges.push({ label: 'Total Discount', value: parseFloat(item.total_discount) });
    }
    
    if (charges.length === 0) return null;
    
    return (
      <View style={s.extraChargesContainer}>
        {charges.map((charge, idx) => (
          <View key={idx} style={s.extraChargeRow}>
            <Text style={[s.extraChargeLabel, { color: theme.colors.textSecondary }]}>
              {charge.label}
            </Text>
            <Text style={[s.extraChargeValue, { color: theme.colors.text }]}>
              {charge.value.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderGrandTotal = (item) => {
    if (!item.items || item.items.length === 0) return null;
    
    const subtotal = calculateSubtotal(item.items);
    const shipping = parseFloat(item.shiping_charges || 0);
    const tax = parseFloat(item.tax_amount || 0);
    const discount = parseFloat(item.total_discount || 0);
    
    const grandTotal = subtotal + shipping + tax - discount;
    
    return (
      <View style={[s.grandTotalRow, { backgroundColor: theme.colors.primary + '10' }]}>
        <Text style={[s.grandTotalLabel, { color: theme.colors.text }]}>
          Grand Total
        </Text>
        <Text style={[s.grandTotalValue, { color: theme.colors.success }]}>
          {grandTotal.toLocaleString()}
        </Text>
      </View>
    );
  };

  const renderRow = ({ item, index }) => {
    const hasItems = item.items && item.items.length > 0;
    const isLastItem = index === balanceData.length - 1;

    return (
      <View>
        {/* Main Transaction Row */}
        {renderItemRow(item, index)}

        {/* Nested Items Rows */}
        {hasItems && item.items.map((nestedItem, nestedIndex) => (
          <View key={`${index}-nested-${nestedIndex}`}>
            {renderItemRow(nestedItem, nestedIndex, true)}
          </View>
        ))}

        {/* Extra Charges (Shipping, Tax, Discount) */}
        {hasItems && renderExtraCharges(item)}

        {/* Grand Total */}
        {hasItems && renderGrandTotal(item)}

        {/* Separator after each header's nested items (except last item) */}
        {!isLastItem && (
          <View style={[s.separator, { backgroundColor: theme.colors.primary + '30' }]} />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={balanceData}
          renderItem={renderRow}
          keyExtractor={(item, index) => index.toString()}
          style={s.mainScroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={true}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 15, paddingTop: 10, gap: 10, zIndex: 10 }}>
                {isGenericReport && (
                  <PersonDropdown
                    type={isSupplier ? 'supplier' : 'customer'}
                    selectedPersonId={entityId}
                    onSelect={handlePersonSelect}
                    company={company}
                    style={{ flex: 1.5, marginBottom: 0, paddingHorizontal: 0, paddingTop: 0 }}
                  />
                )}
                
                <DimensionDropdown 
                  showLabel={true}
                  onDimensionSelect={setDimensionId}
                  style={{ flex: 1, marginBottom: 0 }} 
                />
                
                <View style={{ flex: isGenericReport ? 2 : 1.5, marginBottom: 0 }}>
                  <DateFilter
                    fromDate={fromDate}
                    toDate={toDate}
                    onFromDate={setFromDate}
                    onToDate={setToDate}
                    onFilter={handleApplyFilter}
                  />
                </View>
              </View>

              {/* Header section Summary */}
              {(entityId || !isGenericReport) && (
                <View style={s.scrollableHeader}>
                  {renderHeader()}
                </View>
              )}

              {/* Table section header */}
              {(entityId || !isGenericReport) && (
                <View
                  style={[
                    s.tableContainer,
                    { marginBottom: 0, borderBottomWidth: 0 },
                  ]}
                >
                  <TableHeader />
                </View>
              )}
            </View>
          }
          ListFooterComponent={
            balanceData.length > 0 ? (
              <View
                style={[
                  s.tableRow,
                  s.totalRow,
                  { backgroundColor: theme.colors.primary + '15', marginHorizontal: 15, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border },
                ]}
              >
                <View style={[s.cell, s.cellReference]}>
                  <Text style={[s.totalText, { color: theme.colors.text }]}>Total</Text>
                </View>
                <View style={[s.cell, s.cellDate]} />
                <View style={[s.cell, s.cellRate]} />
                <View style={[s.cell, s.cellQty]} />
                <View style={[s.cell, s.cellDisc]} />
                <View style={[s.cell, s.cellTotal]} />
                <View style={[s.cell, s.cellDebit]}>
                  <Text style={[s.totalText, { color: theme.colors.error }]}>
                    {balanceData.reduce((acc, item) => acc + parseAmount(item.debit), 0).toLocaleString()}
                  </Text>
                </View>
                <View style={[s.cell, s.cellCredit]}>
                  <Text style={[s.totalText, { color: theme.colors.success }]}>
                    {balanceData.reduce((acc, item) => acc + parseAmount(item.credit), 0).toLocaleString()}
                  </Text>
                </View>
                <View style={[s.cell, s.cellBalance]}>
                  <Text style={[s.totalText, { color: theme.colors.text }]}>
                    {balanceData[balanceData.length - 1]?.balance ? parseAmount(balanceData[balanceData.length - 1].balance).toLocaleString() : '0'}
                  </Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <Text style={{ color: theme.colors.textSecondary }}>
                No balance details found.
              </Text>
            </View>
          }
          CellRendererComponent={({ children, style, ...props }) => (
            <View
              {...props}
              style={[
                style,
                {
                  marginHorizontal: 15,
                  borderLeftWidth: 1,
                  borderRightWidth: 1,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {children}
            </View>
          )}
        />
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
    mainScroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    scrollableHeader: {
      paddingHorizontal: 15,
      paddingTop: 10,
    },
    headerRow: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    summaryCard: {
      flex: 0.49,
      padding: 8,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    summaryLabel: {
      fontSize: 10,
      fontWeight: '600',
      marginBottom: 2,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '800',
    },
    tableContainer: {
      flex: 1,
      marginHorizontal: 15,
      marginTop: 10,
      marginBottom: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 5,
      borderBottomWidth: 1,
    },
    tableHeader: {
      borderBottomWidth: 2,
    },
    totalRow: {
      borderTopWidth: 2,
      borderTopColor: theme.colors.primary,
    },
    headerText: {
      fontWeight: '800',
      fontSize: 11,
    },
    totalText: {
      fontWeight: '800',
      fontSize: 11,
    },
    cell: {
      paddingHorizontal: 4,
      justifyContent: 'center',
    },
    cellReference: { width: '18%', paddingLeft: 5 },
    cellDate: { width: '11%' },
    cellNestedDescription: { width: '29%', paddingLeft: 5 },
    cellRate: { width: '10%', alignItems: 'flex-end' },
    cellQty: { width: '8%', alignItems: 'flex-end' },
    cellDisc: { width: '8%', alignItems: 'flex-end' },
    cellTotal: { width: '12%', alignItems: 'flex-end' },
    cellDebit: { width: '11%', alignItems: 'flex-end' },
    cellCredit: { width: '11%', alignItems: 'flex-end' },
    cellBalance: { width: '11%', alignItems: 'flex-end' },
    separator: {
      height: 2,
      marginVertical: 2,
    },
    extraChargesContainer: {
      marginHorizontal: 15,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.colors.border,
    },
    extraChargeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    extraChargeLabel: {
      fontSize: 10,
      fontWeight: '500',
    },
    extraChargeValue: {
      fontSize: 10,
      fontWeight: '600',
    },
    grandTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 15,
      marginHorizontal: 15,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    grandTotalLabel: {
      fontSize: 12,
      fontWeight: '700',
    },
    grandTotalValue: {
      fontSize: 12,
      fontWeight: '800',
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
  });

export default CustomerBalanceDetailsScreen;
