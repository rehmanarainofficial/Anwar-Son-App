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
import { useGetCounterPartyDropdownMutation } from '@api/ledgerApi';

/**
 * CounterPartyDropdown
 * A reusable dropdown component to select Counter Parties based on a GL Account.
 */
const CounterPartyDropdown = ({ accountCode, selectedPartyId, onSelect, onVisibilityChange, style, company: propCompany }) => {
  const { theme } = useTheme();
  const globalCompany = useSelector(state => state.auth.company);
  const company = propCompany || globalCompany;

  const [getCounterPartyDropdown, { isLoading }] = useGetCounterPartyDropdownMutation();

  const [parties, setParties] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredParties = parties.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (accountCode) {
      fetchParties();
    } else {
      setParties([]);
      if (onVisibilityChange) onVisibilityChange(false);
    }
  }, [accountCode, company]);

  const fetchParties = async () => {
    try {
      const response = await getCounterPartyDropdown({ company, account: accountCode }).unwrap();
      const raw = response?.data || [];
      setParties(
        raw.map(p => ({
          id: p.id,
          name: (p.name || '').replace(/&amp;/g, '&'),
        }))
      );
      if (onVisibilityChange) onVisibilityChange(raw.length > 0);
    } catch (e) {
      console.warn('CounterPartyDropdown fetch error:', e);
      setParties([]);
      if (onVisibilityChange) onVisibilityChange(false);
    }
  };

  // Do not render anything if no account is selected, or if loading is finished and there are no counter parties
  if (!accountCode) return null;
  if (!isLoading && parties.length === 0) return null;

  const selectedData = parties.find(p => p.id === selectedPartyId);
  const accentColor = '#3B82F6'; 
  const s = getStyles(theme, accentColor);

  return (
    <View style={[s.container, style]}>
      <Text style={[s.label, { color: theme.colors.textSecondary }]}>
        Select Counter Party
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
                name="people-outline"
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
              {selectedData ? selectedData.name : `Choose counter party...`}
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
              Select Counter Party
            </Text>

            <View style={[s.searchContainer, { backgroundColor: theme.colors.background }]}>
              <Icon name="search-outline" size={18} color={theme.colors.textSecondary} />
              <TextInput
                style={[s.searchInput, { color: theme.colors.text }]}
                placeholder="Search party..."
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
              data={filteredParties}
              keyExtractor={(item, i) => i.toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={[s.emptyText, { color: theme.colors.textSecondary }]}>
                  {isLoading ? 'Loading...' : 'No counter parties found.'}
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    s.modalItem,
                    {
                      borderBottomColor: theme.colors.border,
                      backgroundColor:
                        selectedPartyId === item.id ? accentColor + '12' : 'transparent',
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
                  {selectedPartyId === item.id && (
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
    emptyText: { textAlign: 'center', padding: 30 },
  });

export default CounterPartyDropdown;
