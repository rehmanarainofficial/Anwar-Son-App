import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useGetVoidTransactionDataMutation } from '@api/voidApi';
import {
  DateFilter,
  DimensionDropdown,
  CustomInput,
  LoadingSpinner,
} from '@components/common';

const VOUCHER_TYPES = [
  { id: 0, title: 'Journal Entry', icon: 'document-text-outline' },
  { id: 1, title: 'Bank Payment', icon: 'cash-outline' },
  { id: 2, title: 'Bank Deposit', icon: 'wallet-outline' },
  { id: 41, title: 'Cash Payment', icon: 'cash-outline' },
  { id: 42, title: 'Cash Receipt', icon: 'receipt-outline' },
  { id: 4, title: 'Funds Transfer', icon: 'swap-horizontal-outline' },
  { id: 10, title: 'Sales Invoice', icon: 'document-outline' },
  { id: 11, title: 'Customer Credit Note', icon: 'return-down-back-outline' },
  { id: 12, title: 'Customer Payment', icon: 'card-outline' },
  { id: 13, title: 'Delivery Note', icon: 'car-outline' },
  { id: 16, title: 'Location Transfer', icon: 'location-outline' },
  { id: 17, title: 'Inventory Adjustment', icon: 'construct-outline' },
  { id: 20, title: 'Supplier Invoice', icon: 'document-text-outline' },
  {
    id: 21,
    title: 'Supplier Credit Note',
    icon: 'return-down-forward-outline',
  },
  { id: 43, title: 'Import Invoice', icon: 'airplane-outline' },
  { id: 22, title: 'Supplier Payment', icon: 'card-outline' },
  { id: 25, title: 'GRN', icon: 'cube-outline' },
  { id: 26, title: 'Work Order', icon: 'hammer-outline' },
  { id: 28, title: 'Work Order Issue', icon: 'arrow-redo-outline' },
  { id: 29, title: 'Work Order Production', icon: 'cog-outline' },
  { id: 35, title: 'Cost Update', icon: 'pricetag-outline' },
];

const VoidTransactionsScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const company = useSelector(state => state.auth.company);

  // View state
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Filter state
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [dimensionId, setDimensionId] = useState(0);
  const [reference, setReference] = useState('');
  const [transNo, setTransNo] = useState('');

  // Data state
  const [tableData, setTableData] = useState([]);

  const [getVoidData, { isLoading }] = useGetVoidTransactionDataMutation();

  useEffect(() => {
    // Set default date range: 1 month
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);

    setFromDate(lastMonth);
    setToDate(today);
  }, []);

  const formatDateForAPI = date => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = dateStr => {
    if (!dateStr) return '';
    // Expected dateStr: yyyy-mm-dd
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // dd/mm/yyyy
  };

  const resetSearchState = () => {
    setReference('');
    setTransNo('');
    setDimensionId(0);
    setTableData([]);
  };

  const handleVoucherPress = voucher => {
    resetSearchState();
    setSelectedVoucher(voucher);
    handleSearch(voucher.id);
  };

  const handleSearch = async (typeOverride = null) => {
    const type = typeOverride !== null ? typeOverride : selectedVoucher?.id;
    if (type === undefined) return;

    try {
      const response = await getVoidData({
        company,
        from_date: formatDateForAPI(fromDate),
        to_date: formatDateForAPI(toDate),
        type,
        dimension_id: dimensionId,
        ref: reference,
        trans_no: transNo,
      }).unwrap();

      if (response.status_unapprove_vouchers_order === 'true') {
        setTableData(response.data_unapprove_voucher || []);
      } else {
        setTableData([]);
        Toast.show({
          type: 'info',
          text1: 'No Data',
          text2: 'No records found for the selected criteria.',
        });
      }
    } catch (error) {
      console.log('Search Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch transaction data.',
      });
    }
  };

  const handleClearFilters = () => {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    setFromDate(lastMonth);
    setToDate(today);
    setDimensionId(0);
    setReference('');
    setTransNo('');
    // Re-fetch with cleared filters
    handleSearch();
  };

  const handleVoidAction = item => {
    Toast.show({
      type: 'info',
      text1: 'Void Action',
      text2: `Voiding transaction: ${item.trans_no}`,
    });
  };

  const renderGrid = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.grid}>
        {VOUCHER_TYPES.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => handleVoucherPress(item)}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <Icon
                name={item.icon || 'document-outline'}
                size={24}
                color={theme.colors.primary}
              />
            </View>
            <Text
              style={[styles.cardTitle, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderTable = () => {
    if (isLoading) return <LoadingSpinner />;

    return (
      <View style={styles.tableWrapper}>
        <View
          style={[
            styles.tableHeader,
            {
              backgroundColor: theme.colors.primary + '10',
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.headerCell,
              styles.cellTrans,
              { color: theme.colors.textSecondary },
            ]}
          >
            Trans
          </Text>
          <Text
            style={[
              styles.headerCell,
              styles.cellRef,
              { color: theme.colors.textSecondary },
            ]}
          >
            Reference
          </Text>
          <Text
            style={[
              styles.headerCell,
              styles.cellDate,
              { color: theme.colors.textSecondary },
            ]}
          >
            Date
          </Text>
          <Text
            style={[
              styles.headerCell,
              styles.cellTotal,
              { color: theme.colors.textSecondary, textAlign: 'right' },
            ]}
          >
            Total
          </Text>
          <Text
            style={[
              styles.headerCell,
              styles.cellAction,
              { color: theme.colors.textSecondary, textAlign: 'center' },
            ]}
          >
            Void
          </Text>
        </View>

        <FlatList
          data={tableData}
          keyExtractor={(item, index) => index.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tableRow,
                { borderBottomColor: theme.colors.border },
              ]}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('VoidTransactionDetail', {
                  trans_no: item.trans_no,
                  type: selectedVoucher?.id,
                  title: selectedVoucher?.title,
                })
              }
            >
              <Text
                style={[
                  styles.cell,
                  styles.cellTrans,
                  { color: theme.colors.text },
                ]}
              >
                {item.trans_no}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.cellRef,
                  { color: theme.colors.text },
                ]}
                numberOfLines={1}
              >
                {item.reference}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.cellDate,
                  { color: theme.colors.text },
                ]}
              >
                {formatDateDisplay(item.ord_date)}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.cellTotal,
                  { color: theme.colors.text, textAlign: 'right' },
                ]}
              >
                {parseFloat(item.total).toLocaleString()}
              </Text>
              <View
                style={[
                  styles.cell,
                  styles.cellAction,
                  { alignItems: 'center' },
                ]}
              >
                <Icon
                  name="trash-outline"
                  size={18}
                  color={theme.colors.error}
                />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !isLoading && (
              <View style={styles.emptyContainer}>
                <Text style={{ color: theme.colors.textSecondary }}>
                  No data available
                </Text>
              </View>
            )
          }
        />
      </View>
    );
  };

  const renderSearchView = () => (
    <ScrollView
      contentContainerStyle={styles.searchContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            resetSearchState();
            setSelectedVoucher(null);
          }}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {selectedVoucher?.title}
        </Text>
      </View>

      <DateFilter
        fromDate={fromDate}
        toDate={toDate}
        onFromDate={setFromDate}
        onToDate={setToDate}
        onClear={handleClearFilters}
        onFilter={() => handleSearch()}
      />

      <View style={styles.filterSection}>
        <DimensionDropdown
          onDimensionSelect={id => setDimensionId(id)}
          currentDimensionId={dimensionId}
        />

        <View style={styles.inputRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <CustomInput
              placeholder="Reference"
              value={reference}
              onChangeText={setReference}
              icon="search-outline"
            />
          </View>
          <View style={{ flex: 1 }}>
            <CustomInput
              placeholder="Trans No"
              value={transNo}
              onChangeText={setTransNo}
              keyboardType="numeric"
              icon="hash-outline"
            />
          </View>
        </View>
      </View>

      {renderTable()}
    </ScrollView>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {selectedVoucher ? renderSearchView() : renderGrid()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  searchContainer: {
    padding: 15,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterSection: {
    marginVertical: 10,
  },
  inputRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  tableWrapper: {
    marginTop: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '800',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  cell: {
    fontSize: 10,
    fontWeight: '500',
  },
  cellTrans: { flex: 1 },
  cellRef: { flex: 2 },
  cellDate: { flex: 1.5, textAlign: 'center' },
  cellTotal: { flex: 1.5, textAlign: 'right' },
  cellAction: { flex: 0.8, textAlign: 'center' },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
});

export default VoidTransactionsScreen;
