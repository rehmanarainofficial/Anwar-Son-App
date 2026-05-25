import React, { useState, useEffect } from 'react';
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
import { LoadingSpinner, DateFilter, PersonDropdown, DimensionDropdown } from '@components/common';
import { useGetCustomerAgingMutation, useGetSupplierAgingMutation } from '@api/ledgerApi';
import { useSelector } from 'react-redux';

const CustomerAgingScreen = ({ route, navigation }) => {
  const { customerId, customerName, supplierId, supplierName, type, company: pCompany } = route.params || {};
  const { theme } = useTheme();
  const globalCompany = useSelector(state => state.auth.company);
  const company = pCompany || globalCompany;
  
  const isSupplier = type === 'supplier' || !!supplierId;
  const displayName = customerName || supplierName;
  const initialEntityId = customerId || supplierId;

  // Generic report mode means it was opened without a specific person, so we show the dropdown
  const isGenericReport = !!type && !initialEntityId;

  const [entityId, setEntityId] = useState(initialEntityId);
  const [selectedPersonObj, setSelectedPersonObj] = useState(null);
  const [dimensionId, setDimensionId] = useState(0);
  
  // Date states
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [getCustomerAging, { isLoading: isCustomerLoading }] = useGetCustomerAgingMutation();
  const [getSupplierAging, { isLoading: isSupplierLoading }] = useGetSupplierAgingMutation();
  const isLoading = isCustomerLoading || isSupplierLoading;
  const [agingData, setAgingData] = useState([]);

  useEffect(() => {
    const currentName = selectedPersonObj ? selectedPersonObj.name : displayName;
    const decodedName = currentName ? currentName.replace(/&amp;/g, '&') : (isSupplier ? 'Supplier Aging' : 'Customer Aging');
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
    setFromDate(thirtyDaysAgo);
    setToDate(today);

    // Only fetch automatically if we have an entity ID initially
    if (initialEntityId) {
      fetchData(initialEntityId, thirtyDaysAgo, today, 0);
    }

    return () => {
      Orientation.lockToPortrait();
    };
  }, []);

  const formatDateForAPI = date => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchData = async (idToFetch, start, end, dimToFetch) => {
    if (!idToFetch) return;
    try {
      const formattedStart = formatDateForAPI(start);
      const formattedEnd = formatDateForAPI(end);

      let response;
      if (isSupplier) {
        response = await getSupplierAging({
          company: company,
          supplier_id: idToFetch,
          from_date: formattedStart,
          to_date: formattedEnd,
          dimension_id: dimToFetch || 0,
        }).unwrap();
      } else {
        response = await getCustomerAging({
          company: company,
          customer_id: idToFetch,
          from_date: formattedStart,
          to_date: formattedEnd,
          dimension_id: dimToFetch || 0,
        }).unwrap();
      }
      if (response && response.status_cust_age === 'true') {
        setAgingData(response.data_cust_age || []);
      } else {
        setAgingData([]);
      }
    } catch (error) {
      console.log('Aging fetch error:', error);
      setAgingData([]);
    }
  };

  const handleApplyFilter = () => {
    if (entityId) {
      fetchData(entityId, fromDate, toDate, dimensionId);
    }
  };

  const handlePersonSelect = (person) => {
    setSelectedPersonObj(person);
    setEntityId(person.id);
  };

  const s = getStyles(theme);

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
        style={[s.cell, s.cellDays, s.headerText, { color: theme.colors.text }]}
      >
        Days
      </Text>
      <Text
        style={[s.cell, s.cellInvoiceAmt, s.headerText, { color: theme.colors.text }]}
      >
        Invoice Amt
      </Text>
      <Text
        style={[s.cell, s.cellAllocated, s.headerText, { color: theme.colors.text }]}
      >
        Allocated
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
    // Remove commas and parse
    return parseFloat(amountStr.toString().replace(/,/g, '')) || 0;
  };

  const renderRow = ({ item, index }) => (
    <View
      style={[
        s.tableRow,
        { borderBottomColor: theme.colors.border },
        index % 2 === 0 && {
          backgroundColor: theme.colors.surface + '10',
        },
      ]}
    >
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
      <View style={[s.cell, s.cellDays]}>
        <Text
          style={{
            color: theme.colors.primary,
            fontSize: 11,
            fontWeight: '600',
          }}
        >
          {item.days}
        </Text>
      </View>
      <View style={[s.cell, s.cellInvoiceAmt]}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 11,
            fontWeight: '600',
          }}
        >
          {parseAmount(item.Invoice_amount).toLocaleString()}
        </Text>
      </View>
      <View style={[s.cell, s.cellAllocated]}>
        <Text
          style={{
            color: theme.colors.success,
            fontSize: 11,
            fontWeight: '600',
          }}
        >
          {parseAmount(item.Allocated).toLocaleString()}
        </Text>
      </View>
      <View style={[s.cell, s.cellBalance]}>
        <Text
          style={{
            color: parseAmount(item.invoce_balance) > 0 ? theme.colors.error : theme.colors.text,
            fontSize: 11,
            fontWeight: '700',
          }}
        >
          {parseAmount(item.invoce_balance).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const renderTotalRow = () => {
    const totals = agingData.reduce(
      (acc, item) => ({
        invoice_amount: acc.invoice_amount + parseAmount(item.Invoice_amount),
        allocated: acc.allocated + parseAmount(item.Allocated),
        balance: acc.balance + parseAmount(item.invoce_balance),
      }),
      { invoice_amount: 0, allocated: 0, balance: 0 }
    );

    return (
      <View
        style={[
          s.tableRow,
          s.totalRow,
          { backgroundColor: theme.colors.primary + '10' },
        ]}
      >
        <View style={[s.cell, s.cellReference]}>
          <Text style={[s.totalText, { color: theme.colors.text }]}>Total</Text>
        </View>
        <View style={[s.cell, s.cellDate]} />
        <View style={[s.cell, s.cellDays]} />
        <View style={[s.cell, s.cellInvoiceAmt]}>
          <Text style={[s.totalText, { color: theme.colors.primary }]}>
            {totals.invoice_amount.toLocaleString()}
          </Text>
        </View>
        <View style={[s.cell, s.cellAllocated]}>
          <Text style={[s.totalText, { color: theme.colors.success }]}>
            {totals.allocated.toLocaleString()}
          </Text>
        </View>
        <View style={[s.cell, s.cellBalance]}>
          <Text style={[s.totalText, { color: theme.colors.error }]}>
            {totals.balance.toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={agingData}
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
            agingData.length > 0 ? renderTotalRow() : null
          }
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <Text style={{ color: theme.colors.textSecondary }}>
                No aging data found.
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
    cellReference: { width: '18%' },
    cellDate: { width: '12%' },
    cellDays: { width: '10%', alignItems: 'center' },
    cellInvoiceAmt: { width: '18%', alignItems: 'flex-end' },
    cellAllocated: { width: '18%', alignItems: 'flex-end' },
    cellBalance: { width: '18%', alignItems: 'flex-end' },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
  });

export default CustomerAgingScreen;
