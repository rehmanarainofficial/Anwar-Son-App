import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
 * PersonDropdown
 * A reusable dropdown component to select a Customer or Supplier based on type.
 * It automatically fetches from dash_receivable or dash_payable.
 */
const PersonDropdown = ({ type = 'customer', selectedPersonId, onSelect, style, company: propCompany }) => {
  const { theme } = useTheme();
  const globalCompany = useSelector(state => state.auth.company);
  const company = propCompany || globalCompany;

  const isSupplier = type === 'supplier';

  const [getDashReceivable, { isLoading: recLoading }] = useGetDashReceivableMutation();
  const [getDashPayable, { isLoading: payLoading }] = useGetDashPayableMutation();
  const isLoading = recLoading || payLoading;

  const [people, setPeople] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
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
      console.warn('PersonDropdown fetch error:', e);
    }
  };

  const selectedData = people.find(p => p.id === selectedPersonId);
  const accentColor = isSupplier ? '#10B981' : '#3B82F6';
  const s = getStyles(theme, accentColor);

  return (
    <View style={[s.container, style]}>
      <Text style={[s.label, { color: theme.colors.textSecondary }]}>
        Select {isSupplier ? 'Supplier' : 'Customer'}
      </Text>

      <TouchableOpacity
        style={[
          s.dropdownBtn,
          {
            backgroundColor: theme.colors.surface,
            borderColor: dropdownOpen ? accentColor : theme.colors.border,
          },
        ]}
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
              <Icon
                name={isSupplier ? 'bag-handle-outline' : 'person-outline'}
                size={18}
                color={accentColor}
              />
            </View>
            <Text
              style={[
                s.dropdownText,
                { color: selectedData ? theme.colors.text : theme.colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {selectedData ? selectedData.name : `Choose ${isSupplier ? 'supplier' : 'customer'}...`}
            </Text>
            <Icon name="chevron-down" size={18} color={theme.colors.textSecondary} />
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={dropdownOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalBg} onPress={() => setDropdownOpen(false)} />
          <View style={[s.modalSheet, { backgroundColor: theme.colors.surface }]}>
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
                      backgroundColor:
                        selectedPersonId === item.id ? accentColor + '12' : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setDropdownOpen(false);
                  }}
                  activeOpacity={0.6}
                >
                  <View style={[s.modalItemDot, { backgroundColor: accentColor }]} />
                  <Text style={[s.modalItemName, { color: theme.colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[s.modalItemBalance, { color: accentColor }]}>
                    {parseFloat(item.balance).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </Text>
                  {selectedPersonId === item.id && (
                    <Icon
                      name="checkmark-circle"
                      size={18}
                      color={accentColor}
                      style={{ marginLeft: 8 }}
                    />
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

const getStyles = (theme, accentColor) =>
  StyleSheet.create({
    container: { marginBottom: 15, paddingHorizontal: 15, paddingTop: 10 },
    label: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    dropdownBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: 14,
      padding: 10,
      gap: 12,
    },
    dropdownIconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdownText: { flex: 1, fontSize: 14, fontWeight: '600' },
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
      paddingHorizontal: 6,
      borderBottomWidth: 1,
      gap: 10,
      borderRadius: 8,
    },
    modalItemDot: { width: 8, height: 8, borderRadius: 4 },
    modalItemName: { flex: 1, fontSize: 14, fontWeight: '600' },
    modalItemBalance: { fontSize: 13, fontWeight: '700' },
    emptyText: { textAlign: 'center', padding: 30 },
  });

export default PersonDropdown;
