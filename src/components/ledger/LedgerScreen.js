import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Orientation from 'react-native-orientation-locker';
import { useTheme } from '@config/useTheme';
import { DateFilter, LoadingSpinner, PersonDropdown, GLAccountDropdown, CounterPartyDropdown, DimensionDropdown } from '@components/common';
import { useGetGLAccountInquiryMutation } from '@api/ledgerApi';
import { generateAndShareStatementPDF } from '../../utils/PDFExportService';
import { CustomAlertModal } from '../common';

const LedgerScreen = ({ route, navigation }) => {
  const { account: initialAccount, title, fromDate: pFromDate, toDate: pToDate, personId: initialPersonId, type, company: pCompany } = route.params || {};
  const { theme } = useTheme();

  const isGenericReport = !!type;
  const isSupplier = type === 'supplier';
  const isAccount = type === 'account';

  const [account, setAccount] = useState(initialAccount);
  const [personId, setPersonId] = useState(initialPersonId);
  const [selectedPersonObj, setSelectedPersonObj] = useState(null);
  const [dimensionId, setDimensionId] = useState(0);
  const [hasCounterParties, setHasCounterParties] = useState(false);
  const [modalConfig, setModalConfig] = useState({ visible: false, title: '', message: '' });

  const [getGLAccountInquiry, { isLoading }] = useGetGLAccountInquiryMutation();
  const [fromDate, setFromDate] = useState(
    pFromDate ? new Date(pFromDate) : null,
  );
  const [toDate, setToDate] = useState(pToDate ? new Date(pToDate) : null);

  useEffect(() => {
    const currentName = selectedPersonObj ? selectedPersonObj.name : title;
    const decodedTitle = currentName ? currentName.replace(/&amp;/g, '&') : (isGenericReport ? (isAccount ? 'GL Account Ledger' : (isSupplier ? 'Supplier Balance' : 'Customer Balance')) : 'Ledger');
    const truncatedTitle =
      decodedTitle.length > 25
        ? decodedTitle.substring(0, 22) + '...'
        : decodedTitle;
    navigation.setOptions({
      title: truncatedTitle,
    });
  }, [navigation, title, selectedPersonObj, isGenericReport, isSupplier]);

  const [ledgerData, setLedgerData] = useState([]);
  const [opening, setOpening] = useState('0');

  useEffect(() => {
    Orientation.lockToLandscape();

    if (!fromDate && !toDate) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      setFromDate(thirtyDaysAgo);
      setToDate(today);
      if (account || personId) {
        fetchData(thirtyDaysAgo, today, account, personId, dimensionId);
      }
    } else {
      if (account || personId) {
        fetchData(fromDate, toDate, account, personId, dimensionId);
      }
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

  const fetchData = async (start, end, accToFetch, personToFetch, dimToFetch) => {
    if (!accToFetch && !personToFetch) return;
    try {
      const response = await getGLAccountInquiry({
        from_date: formatDateForAPI(start),
        to_date: formatDateForAPI(end),
        account: accToFetch,
        person_id: personToFetch,
        dimension_id: dimToFetch || 0,
        company: pCompany,
      }).unwrap();

      if (response && response.status === 'true') {
        setLedgerData(response.data || []);
        setOpening(response.opening || '0');
      } else {
        setLedgerData([]);
        setOpening('0');
      }
    } catch (error) {
      console.log('Ledger fetch error:', error);
      setLedgerData([]);
    }
  };

  const handleApplyFilter = () => {
    if (account || personId) {
      fetchData(fromDate, toDate, account, personId, dimensionId);
    }
  };

  const handlePersonSelect = (person) => {
    setSelectedPersonObj(person);
    setAccount(person.account);
    setPersonId(person.id);
  };

  const calculateClosing = () => {
    const openNum = parseFloat(opening || 0);
    const transSum = ledgerData.reduce(
      (acc, item) => acc + parseFloat(item.amount || 0),
      0,
    );
    return (openNum + transSum).toLocaleString();
  };

  const s = getStyles(theme);

  const handleSharePDF = async () => {
    try {
      await generateAndShareStatementPDF();
    } catch (e) {
      console.log('Error sharing PDF:', e);
      setModalConfig({
        visible: true,
        title: 'Share Cancelled',
        message: e.message || 'User did not share.',
      });
    }
  };

  const renderHeader = () => (
    <View style={s.summaryContainer}>
      <View style={[s.summaryCard, { flex: 0.42, backgroundColor: theme.colors.surface }]}>
        <Text style={[s.summaryLabel, { color: theme.colors.textSecondary }]}>
          Opening Balance
        </Text>
        <Text style={[s.summaryValue, { color: theme.colors.primary }]}>
          {parseFloat(opening).toLocaleString()}
        </Text>
      </View>
      <View style={[s.summaryCard, { flex: 0.42, backgroundColor: theme.colors.surface }]}>
        <Text style={[s.summaryLabel, { color: theme.colors.textSecondary }]}>
          Closing Balance
        </Text>
        <Text style={[s.summaryValue, { color: theme.colors.success }]}>
          {calculateClosing()}
        </Text>
      </View>
      <TouchableOpacity 
        style={[s.summaryCard, { flex: 0.12, backgroundColor: theme.colors.primary, justifyContent: 'center' }]}
        onPress={handleSharePDF}
      >
        <Icon name="share-social" size={20} color="#fff" />
      </TouchableOpacity>
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
        style={[s.cell, s.cellDate, s.headerText, { color: theme.colors.text }]}
      >
        Date
      </Text>
      <Text
        style={[s.cell, s.cellRef, s.headerText, { color: theme.colors.text }]}
      >
        Ref/Person
      </Text>
      <Text
        style={[s.cell, s.cellMemo, s.headerText, { color: theme.colors.text }]}
      >
        Memo
      </Text>
      <Text
        style={[
          s.cell,
          s.cellAmount,
          s.headerText,
          { color: theme.colors.text },
        ]}
      >
        Amount
      </Text>
      <Text
        style={[
          s.cell,
          s.cellBalance,
          s.headerText,
          { color: theme.colors.text },
        ]}
      >
        Balance
      </Text>
    </View>
  );

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
      <View style={[s.cell, s.cellDate]}>
        <Text style={{ color: theme.colors.text, fontSize: 11 }}>
          {item.doc_date}
        </Text>
      </View>
      <View style={[s.cell, s.cellRef]}>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: 11,
            fontWeight: '600',
          }}
        >
          {item.reference}
        </Text>
        {item.person_name && (
          <Text
            style={{ color: theme.colors.primary, fontSize: 10 }}
            numberOfLines={1}
          >
            {item.person_name}
          </Text>
        )}
      </View>
      <View style={[s.cell, s.cellMemo]}>
        <Text
          style={{ color: theme.colors.text, fontSize: 11 }}
          numberOfLines={2}
        >
          {item.memo}
        </Text>
      </View>
      <View style={[s.cell, s.cellAmount]}>
        <Text
          style={{
            color:
              parseFloat(item.amount) >= 0
                ? theme.colors.success
                : theme.colors.error,
            fontWeight: '700',
            fontSize: 12,
          }}
        >
          {parseFloat(item.amount).toLocaleString()}
        </Text>
      </View>
      <View style={[s.cell, s.cellBalance]}>
        <Text
          style={{
            color: theme.colors.text,
            fontWeight: '600',
            fontSize: 12,
          }}
        >
          {parseFloat(item.balance).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={ledgerData}
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
              {/* Filter Row: Dropdowns + DateFilter */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', paddingHorizontal: 15, paddingTop: 10, gap: 10, zIndex: 10 }}>
                {isGenericReport && !isAccount && (
                  <PersonDropdown
                    type={isSupplier ? 'supplier' : 'customer'}
                    selectedPersonId={personId}
                    onSelect={handlePersonSelect}
                    company={pCompany}
                    style={{ flex: 1.5, marginBottom: 0, paddingHorizontal: 0, paddingTop: 0 }}
                  />
                )}
                {isGenericReport && isAccount && (
                  <>
                    <GLAccountDropdown
                      selectedAccountId={account}
                      onSelect={(acc) => {
                        setAccount(acc.account_code);
                        setSelectedPersonObj({ name: acc.account_name });
                        setPersonId('0');
                        setHasCounterParties(false);
                      }}
                      company={pCompany}
                      style={{ width: hasCounterParties ? '48%' : '30%', flex: hasCounterParties ? 0 : 1.5, marginBottom: 0, paddingHorizontal: 0, paddingTop: 0 }}
                    />
                    <CounterPartyDropdown
                      accountCode={account}
                      selectedPartyId={personId}
                      company={pCompany}
                      onVisibilityChange={setHasCounterParties}
                      onSelect={(party) => {
                        setPersonId(party.id);
                        setSelectedPersonObj({ name: party.name });
                      }}
                      style={{ width: '48%', marginBottom: 0, paddingHorizontal: 0, paddingTop: 0 }}
                    />
                  </>
                )}
                <DimensionDropdown 
                  showLabel={true}
                  onDimensionSelect={setDimensionId}
                  style={{ width: hasCounterParties ? '32%' : '30%', flex: hasCounterParties ? 0 : 1, marginBottom: 0 }} 
                />
                
                <View style={{ width: hasCounterParties ? '65%' : 'auto', flex: hasCounterParties ? 0 : 2, marginBottom: 0 }}>
                  <DateFilter
                    fromDate={fromDate}
                    toDate={toDate}
                    onFromDate={setFromDate}
                    onToDate={setToDate}
                    onFilter={handleApplyFilter}
                  />
                </View>
              </View>

              {/* Summary and Table Header */}
              {(account || personId || !isGenericReport) && (
                <View style={s.scrollableHeader}>
                  {renderHeader()}
                </View>
              )}

              {/* Table section header */}
              {(account || personId || !isGenericReport) && (
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
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <Text style={{ color: theme.colors.textSecondary }}>
                No transactions found.
              </Text>
            </View>
          }
          // Wrap the flattened items in the same border style
          ListFooterComponent={<View style={{ height: 10 }} />}
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

      <CustomAlertModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setModalConfig({ ...modalConfig, visible: false })}
      />
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
      marginBottom: 15,
    },
    title: {
      fontSize: 18,
      fontWeight: '900',
      marginBottom: 10,
      width: '100%',
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
      marginBottom: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 5,
      borderBottomWidth: 1,
    },
    tableHeader: {
      borderBottomWidth: 2,
    },
    headerText: {
      fontWeight: '800',
      fontSize: 12,
    },
    cell: {
      paddingHorizontal: 5,
      justifyContent: 'center',
    },
    cellDate: { width: '12%' },
    cellRef: { width: '20%' },
    cellMemo: { flex: 1 },
    cellAmount: { width: '15%', alignItems: 'flex-end' },
    cellBalance: { width: '15%', alignItems: 'flex-end' },
    tableScroll: {
      flex: 1,
    },
    emptyContainer: {
      padding: 40,
      alignItems: 'center',
    },
  });

export default LedgerScreen;
