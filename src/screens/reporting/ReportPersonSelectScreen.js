import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { useSelector } from 'react-redux';
import { useGetDashReceivableMutation, useGetDashPayableMutation } from '@api/dashboardApi';

/**
 * ReportPersonSelectScreen
 * Reusable screen for Reporting module.
 * Loads customers/suppliers from existing dash_receivable / dash_payable APIs,
 * lets the user pick one, then gives Aging, Detail, Ledger action buttons.
 *
 * Route params:
 *   type  → 'customer' | 'supplier'
 *   mode  → 'balance' | 'aging' | 'detail'  (used only to set the default title)
 */
const ReportPersonSelectScreen = ({ route, navigation }) => {
  const { type = 'customer', mode = 'balance' } = route.params || {};
  const { theme } = useTheme();
  const company = useSelector(state => state.auth.company);

  const isSupplier = type === 'supplier';

  const [getDashReceivable, { isLoading: recLoading }] = useGetDashReceivableMutation();
  const [getDashPayable, { isLoading: payLoading }] = useGetDashPayableMutation();
  const isLoading = recLoading || payLoading;

  const [people, setPeople] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const modeLabels = { balance: 'Balance', aging: 'Aging', detail: 'Detail' };
  const title = `${isSupplier ? 'Supplier' : 'Customer'} ${modeLabels[mode] || 'Report'}`;

  useEffect(() => {
    navigation.setOptions({ title });
    fetchPeople();
  }, [type, company]);

  const fetchPeople = async () => {
    try {
      let response;
      if (isSupplier) {
        response = await getDashPayable({ company, dimension_id: '' }).unwrap();
        const raw = response?.data_supp_bal || response?.data_supp_bal_view_all || [];
        setPeople(
          raw.map(p => ({
            id: p.person_id || p.customer_id,
            name: (p.supp_name || p.name || '').replace(/&amp;/g, '&'),
            account: p.account || '',
            balance: p.Balance || p.bank_balance || '0',
          }))
        );
      } else {
        response = await getDashReceivable({ company, dimension_id: '' }).unwrap();
        const raw = response?.data_cust_bal || [];
        setPeople(
          raw.map(p => ({
            id: p.customer_id || p.person_id,
            name: (p.name || '').replace(/&amp;/g, '&'),
            account: p.account || '',
            balance: p.Balance || '0',
          }))
        );
      }
    } catch (e) {
      console.warn('ReportPersonSelect fetch error:', e);
    }
  };

  const s = getStyles(theme);
  const accentColor = isSupplier ? '#10B981' : '#3B82F6';

  const actions = [
    {
      label: 'Aging',
      icon: 'time-outline',
      color: '#F59E0B',
      onPress: () => {
        if (!selected) return;
        navigation.navigate('CustomerAging', {
          customerId: isSupplier ? undefined : selected.id,
          customerName: isSupplier ? undefined : selected.name,
          supplierId: isSupplier ? selected.id : undefined,
          supplierName: isSupplier ? selected.name : undefined,
          type: isSupplier ? 'supplier' : 'customer',
        });
      },
    },
    {
      label: 'Detail',
      icon: 'eye-outline',
      color: '#3B82F6',
      onPress: () => {
        if (!selected) return;
        navigation.navigate('CustomerBalanceDetails', {
          customerId: isSupplier ? undefined : selected.id,
          customerName: isSupplier ? undefined : selected.name,
          supplierId: isSupplier ? selected.id : undefined,
          supplierName: isSupplier ? selected.name : undefined,
          type: isSupplier ? 'supplier' : 'customer',
        });
      },
    },
    {
      label: 'Ledger',
      icon: 'book-outline',
      color: '#8B5CF6',
      onPress: () => {
        if (!selected) return;
        navigation.navigate('Ledger', {
          account: selected.account,
          title: selected.name,
          person_id: selected.id,
        });
      },
    },
  ];

  return (
    <View style={[s.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Dropdown Selector */}
        <View style={s.section}>
          <Text style={[s.label, { color: theme.colors.textSecondary }]}>
            Select {isSupplier ? 'Supplier' : 'Customer'}
          </Text>

          <TouchableOpacity
            style={[s.dropdownBtn, {
              backgroundColor: theme.colors.surface,
              borderColor: dropdownOpen ? accentColor : theme.colors.border,
            }]}
            onPress={() => {
              setSearchQuery('');
              setDropdownOpen(true);
            }}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={accentColor} />
            ) : (
              <>
                <View style={[s.dropdownIconBox, { backgroundColor: accentColor + '20' }]}>
                  <Icon name={isSupplier ? 'bag-handle-outline' : 'person-outline'} size={18} color={accentColor} />
                </View>
                <Text
                  style={[s.dropdownText, { color: selected ? theme.colors.text : theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {selected ? selected.name : `Choose ${isSupplier ? 'supplier' : 'customer'}...`}
                </Text>
                <Icon name="chevron-down" size={18} color={theme.colors.textSecondary} />
              </>
            )}
          </TouchableOpacity>

          {/* Selected person's balance */}
          {selected && (
            <View style={[s.balancePill, { backgroundColor: accentColor + '15', borderColor: accentColor + '40' }]}>
              <Text style={[s.balancePillLabel, { color: theme.colors.textSecondary }]}>Balance</Text>
              <Text style={[s.balancePillValue, { color: accentColor }]}>
                {parseFloat(selected.balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {selected && (
          <View style={s.actionsSection}>
            <Text style={[s.label, { color: theme.colors.textSecondary }]}>View Report</Text>
            {actions.map(action => (
              <TouchableOpacity
                key={action.label}
                style={[s.actionCard, {
                  backgroundColor: theme.colors.surface,
                  borderColor: action.color + '40',
                  borderLeftColor: action.color,
                }]}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[s.actionIconBox, { backgroundColor: action.color + '15' }]}>
                  <Icon name={action.icon} size={22} color={action.color} />
                </View>
                <View style={s.actionText}>
                  <Text style={[s.actionTitle, { color: theme.colors.text }]}>
                    {isSupplier ? 'Supplier' : 'Customer'} {action.label}
                  </Text>
                  <Text style={[s.actionSubtitle, { color: theme.colors.textSecondary }]}>
                    {selected.name}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalBg} onPress={() => setDropdownOpen(false)} />
          <View style={[s.modalSheet, { backgroundColor: theme.colors.surface }]}>
            {/* Modal Handle */}
            <View style={[s.handle, { backgroundColor: theme.colors.border }]} />
            <Text style={[s.modalTitle, { color: theme.colors.text }]}>
              Select {isSupplier ? 'Supplier' : 'Customer'}
            </Text>

            <View style={[s.searchContainer, { backgroundColor: theme.colors.background }]}>
              <Icon name="search-outline" size={18} color={theme.colors.textSecondary} />
              <TextInput
                style={[s.searchInput, { color: theme.colors.text }]}
                placeholder="Search by name..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="close-circle" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredPeople}
              keyExtractor={(item, i) => i.toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={[s.emptyText, { color: theme.colors.textSecondary }]}>
                  {isLoading ? 'Loading...' : 'No records found.'}
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    s.modalItem,
                    {
                      borderBottomColor: theme.colors.border,
                      backgroundColor: selected?.id === item.id ? accentColor + '12' : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    setSelected(item);
                    setDropdownOpen(false);
                  }}
                  activeOpacity={0.6}
                >
                  <View style={[s.modalItemDot, { backgroundColor: accentColor }]} />
                  <Text style={[s.modalItemName, { color: theme.colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[s.modalItemBalance, { color: accentColor }]}>
                    {parseFloat(item.balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Text>
                  {selected?.id === item.id && (
                    <Icon name="checkmark-circle" size={18} color={accentColor} style={{ marginLeft: 8 }} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingTop: 16 },
    section: { marginBottom: 24 },
    actionsSection: { marginBottom: 24 },
    label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
    dropdownBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: 14,
      padding: 14,
      gap: 12,
    },
    dropdownIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdownText: { flex: 1, fontSize: 15, fontWeight: '600' },
    balancePill: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginTop: 10,
    },
    balancePillLabel: { fontSize: 13, fontWeight: '600' },
    balancePillValue: { fontSize: 16, fontWeight: '800' },
    actionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderLeftWidth: 4,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      gap: 14,
    },
    actionIconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionText: { flex: 1 },
    actionTitle: { fontSize: 15, fontWeight: '700' },
    actionSubtitle: { fontSize: 12, marginTop: 2 },
    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 16,
      maxHeight: '75%',
    },
    handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
    modalTitle: { fontSize: 17, fontWeight: '800', marginBottom: 14, paddingHorizontal: 4 },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      marginBottom: 14,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      padding: 0,
      minHeight: 24,
    },
    modalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      gap: 10,
    },
    modalItemDot: { width: 8, height: 8, borderRadius: 4 },
    modalItemName: { flex: 1, fontSize: 14, fontWeight: '600' },
    modalItemBalance: { fontSize: 13, fontWeight: '700' },
    emptyText: { textAlign: 'center', padding: 30 },
  });

export default ReportPersonSelectScreen;
