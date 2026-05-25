import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { useSelector } from 'react-redux';
import { useGetTrailBalanceMutation } from '@api/ledgerApi';
import {
  DateFilter,
  LoadingSpinner,
  DimensionDropdown,
} from '@components/common';
import Toast from 'react-native-toast-message';
import { exportReportToPDF, exportReportToExcel } from '@config/reportHelper';
import {
  generateTrailBalanceHTML,
  mapTrailBalanceToExcel,
} from '../../reports/TrailBalanceReportTemplate';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TrailBalanceReportScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const company = useSelector(state => state.auth.company);
  const reportType = route.params?.type || 'trail_balance';

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(new Date());
  const [reportData, setReportData] = useState([]);
  const [expandedClasses, setExpandedClasses] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedDimensionId, setSelectedDimensionId] = useState(null);
  const [showZero, setShowZero] = useState(false);
  const [isSummary, setIsSummary] = useState(false);

  const [getTrailBalance, { isLoading }] = useGetTrailBalanceMutation();

  useEffect(() => {
    if (route.params?.dimensionId !== undefined) {
      setSelectedDimensionId(route.params.dimensionId);
    }
  }, [route.params?.dimensionId]);

  useEffect(() => {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setFromDate(start);
  }, []);

  const formatDateForAPI = date => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleFetchReport = async () => {
    try {
      const response = await getTrailBalance({
        company,
        from_date: formatDateForAPI(fromDate),
        to_date: formatDateForAPI(toDate),
        show_zero: showZero ? 1 : 0,
        dimension_id: selectedDimensionId || 0,
      }).unwrap();

      if (response.status) {
        setReportData(response.data || []);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch report data.',
        });
      }
    } catch (error) {
      console.log('Trail Balance Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred while fetching report.',
      });
    }
  };

  const toggleClass = className => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedClasses(prev => ({ ...prev, [className]: !prev[className] }));
  };

  const toggleGroup = groupName => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const renderAccount = account => (
    <TouchableOpacity
      key={account.code}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate('Ledger', {
          account: account.code,
          title: account.name,
          fromDate: fromDate,
          toDate: toDate,
          personId: '',
          dimensionId: selectedDimensionId || 0,
          type: 'account',
        })
      }
      style={[
        styles.accountContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border + '30',
        },
      ]}
    >
      <View style={styles.kvRow}>
        <Text style={[styles.kvLabel, { color: theme.colors.textSecondary }]}>
          Name
        </Text>
        <Text style={[styles.kvValue, { color: theme.colors.text }]}>
          {account.name}
        </Text>
      </View>

      <View style={styles.kvRow}>
        <Text style={[styles.kvLabel, { color: theme.colors.textSecondary }]}>
          Opening
        </Text>
        <Text style={[styles.kvValue, { color: theme.colors.text }]}>
          {account.opening.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </Text>
      </View>

      {!isSummary && (
        <>
          <View style={styles.kvRow}>
            <Text
              style={[styles.kvLabel, { color: theme.colors.textSecondary }]}
            >
              Debit
            </Text>
            <Text style={[styles.kvValue, { color: theme.colors.success }]}>
              {account.debit.toLocaleString()}
            </Text>
          </View>

          <View style={styles.kvRow}>
            <Text
              style={[styles.kvLabel, { color: theme.colors.textSecondary }]}
            >
              Credit
            </Text>
            <Text style={[styles.kvValue, { color: theme.colors.error }]}>
              {account.credit.toLocaleString()}
            </Text>
          </View>

          <View style={[styles.kvRow, { borderBottomWidth: 0 }]}>
            <Text
              style={[
                styles.kvLabel,
                { color: theme.colors.textSecondary, fontWeight: '700' },
              ]}
            >
              Closing
            </Text>
            <Text
              style={[
                styles.kvValue,
                { color: theme.colors.primary, fontWeight: '800' },
              ]}
            >
              {account.closing.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  );

  const renderGroup = group => {
    const isExpanded = expandedGroups[group.group_name];
    return (
      <View key={group.group_name} style={styles.groupContainer}>
        <TouchableOpacity
          style={[
            styles.groupHeader,
            { backgroundColor: theme.colors.surface },
          ]}
          onPress={() => toggleGroup(group.group_name)}
          activeOpacity={0.7}
        >
          <View style={styles.row}>
            <Icon
              name={isExpanded ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={[styles.groupName, { color: theme.colors.text }]}>
              {group.group_name}
            </Text>
          </View>
          <View style={styles.headerTotal}>
            <Text style={[styles.totalText, { color: theme.colors.primary }]}>
              {group.total.closing.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.accountList}>
            {group.accounts.map(renderAccount)}
          </View>
        )}
      </View>
    );
  };

  const renderClass = item => {
    const isExpanded = expandedClasses[item.class_name];
    return (
      <View
        key={item.class_name}
        style={[styles.classCard, { borderColor: theme.colors.border }]}
      >
        <TouchableOpacity
          style={[
            styles.classHeader,
            { backgroundColor: theme.colors.surface },
          ]}
          onPress={() => toggleClass(item.class_name)}
          activeOpacity={0.8}
        >
          <View style={styles.row}>
            <View>
              <Text style={[styles.className, { color: theme.colors.text }]}>
                {item.class_name}
              </Text>
              <Text
                style={[styles.classBalance, { color: theme.colors.primary }]}
              >
                {item.total.closing.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
          <Icon
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.groupList}>{item.groups.map(renderGroup)}</View>
        )}
      </View>
    );
  };

  const exportToPDF = async () => {
    if (reportData.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'No Data',
        text2: 'Generate the report first.',
      });
      return;
    }

    try {
      const html = generateTrailBalanceHTML(
        reportData,
        reportType,
        fromDate,
        toDate,
        isSummary,
      );
      await exportReportToPDF(html, 'TrailBalance');
    } catch (error) {
      console.log('PDF Export Error:', error);
    }
  };

  const exportToExcel = async () => {
    if (reportData.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'No Data',
        text2: 'Generate the report first.',
      });
      return;
    }

    try {
      const data = mapTrailBalanceToExcel(reportData, isSummary);
      await exportReportToExcel(data, 'TrailBalance');
    } catch (error) {
      console.log('Excel Export Error:', error);
    }
  };

  const Checkbox = ({ label, value, onValueChange }) => (
    <TouchableOpacity
      style={styles.checkboxWrapper}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.7}
    >
      <Icon
        name={value ? 'checkbox' : 'square-outline'}
        size={22}
        color={value ? theme.colors.primary : theme.colors.textSecondary}
      />
      <Text style={[styles.checkboxLabel, { color: theme.colors.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.filterWrapper}>
        <View style={styles.dimRow}>
          <DimensionDropdown
            onDimensionSelect={dimensionId => {
              navigation.setParams({ dimensionId });
            }}
          />
        </View>

        <DateFilter
          fromDate={fromDate}
          toDate={toDate}
          onFromDate={setFromDate}
          onToDate={setToDate}
          onFilter={handleFetchReport}
          onClear={() => {
            setFromDate(null);
            setToDate(new Date());
            setReportData([]);
            setSelectedDimensionId(null);
          }}
        />

        <View style={styles.checkboxRow}>
          <Checkbox
            label="Show Zero"
            value={showZero}
            onValueChange={setShowZero}
          />
          <Checkbox
            label="Summary"
            value={isSummary}
            onValueChange={setIsSummary}
          />
        </View>

        <View style={styles.exportRow}>
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: '#FF5722' }]}
            onPress={exportToPDF}
          >
            <Icon name="document-text-outline" size={18} color="#FFF" />
            <Text style={styles.exportText}>PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: '#4CAF50' }]}
            onPress={exportToExcel}
          >
            <Icon name="grid-outline" size={18} color="#FFF" />
            <Text style={styles.exportText}>EXCEL</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {reportData.length > 0 ? (
            reportData.map(renderClass)
          ) : (
            <View style={styles.emptyContainer}>
              <Icon
                name="document-text-outline"
                size={60}
                color={theme.colors.border}
              />
              <Text
                style={[
                  styles.emptyText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Select dates and click filter to generate report
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterWrapper: {
    padding: 16,
    paddingBottom: 8,
  },
  dimRow: {
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 24,
    paddingHorizontal: 4,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  exportRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 10,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  exportText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  classCard: {
    borderRadius: 16,
    backgroundColor: '#FFF',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  classIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  className: {
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  classBalance: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  groupList: {
    paddingHorizontal: 8,
  },
  groupContainer: {
    marginBottom: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  headerTotal: {
    alignItems: 'flex-end',
  },
  totalText: {
    fontSize: 13,
    fontWeight: '600',
  },
  accountList: {
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  accountContainer: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  accountHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 4,
  },
  accountCodeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  kvLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  kvValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    paddingLeft: 20,
  },
  classTotal: {
    marginVertical: 12,
    paddingTop: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  classTotalValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default TrailBalanceReportScreen;
