import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';

/**
 * SearchableDropdown
 * Reusable searchable dropdown supporting both single-select and multi-select modes.
 */
const SearchableDropdown = ({
  label,
  placeholder = 'Select an option...',
  data = [],
  selectedId,
  onSelect,
  isMultiSelect = false,
  selectedIds = [],
  onSelectMulti,
  isLoading = false,
  iconName = 'list-outline',
  idKey = 'id',
  labelKey = 'name',
  style,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = data.filter(item => {
    const val = item[labelKey] || '';
    return val.toString().toLowerCase().includes(searchQuery.toLowerCase());
  });

  const checkIsSelected = item => {
    const itemId = item[idKey];
    if (itemId === null || itemId === undefined || itemId === '') return false;

    if (isMultiSelect) {
      return (selectedIds || []).some(id => String(id) === String(itemId));
    }

    if (selectedId === null || selectedId === undefined || selectedId === '') return false;
    return String(selectedId) === String(itemId);
  };

  const selectedItem = !isMultiSelect ? data.find(item => checkIsSelected(item)) : null;

  const selectedMultiItems = isMultiSelect
    ? data.filter(item => checkIsSelected(item))
    : [];

  const getDisplayText = () => {
    if (isMultiSelect) {
      if (selectedMultiItems.length === 0) return placeholder;
      return selectedMultiItems.map(item => item[labelKey]).join(', ');
    }
    return selectedItem ? selectedItem[labelKey] : placeholder;
  };

  const hasSelection = isMultiSelect ? selectedMultiItems.length > 0 : !!selectedItem;

  const handleToggleMulti = item => {
    const itemId = item[idKey];
    const current = Array.isArray(selectedIds) ? [...selectedIds] : [];
    const existsIndex = current.findIndex(id => String(id) === String(itemId));
    if (existsIndex > -1) {
      current.splice(existsIndex, 1);
    } else {
      current.push(itemId);
    }
    if (onSelectMulti) {
      onSelectMulti(current);
    }
  };

  const s = getStyles(theme, disabled);

  return (
    <View style={[s.container, style]}>
      {label && <Text style={s.label}>{label}</Text>}

      <TouchableOpacity
        style={[
          s.dropdownBtn,
          {
            borderColor: dropdownOpen ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => {
          if (!disabled) {
            setSearchQuery('');
            setDropdownOpen(true);
          }
        }}
        activeOpacity={0.7}
        disabled={disabled}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <View style={[s.dropdownIconBox, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name={iconName} size={18} color={theme.colors.primary} />
            </View>
            <Text
              style={[
                s.dropdownText,
                { color: hasSelection ? theme.colors.text : theme.colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {getDisplayText()}
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
              {label || 'Select Option'}
            </Text>

            <View style={[s.searchContainer, { backgroundColor: theme.colors.background }]}>
              <Icon name="search-outline" size={18} color={theme.colors.textSecondary} />
              <TextInput
                style={[s.searchInput, { color: theme.colors.text }]}
                placeholder="Search..."
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
              data={filteredData}
              keyExtractor={(item, i) => i.toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={s.emptyText}>
                  {isLoading ? 'Loading...' : 'No records found.'}
                </Text>
              }
              renderItem={({ item }) => {
                const itemIsSelected = checkIsSelected(item);
                return (
                  <TouchableOpacity
                    style={[
                      s.modalItem,
                      {
                        borderBottomColor: theme.colors.border,
                        backgroundColor: itemIsSelected
                          ? theme.colors.primary + '12'
                          : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      if (isMultiSelect) {
                        handleToggleMulti(item);
                      } else {
                        onSelect(item);
                        setDropdownOpen(false);
                      }
                    }}
                    activeOpacity={0.6}
                  >
                    <View style={[s.modalItemDot, { backgroundColor: theme.colors.primary }]} />
                    <Text style={[s.modalItemName, { color: theme.colors.text }]} numberOfLines={1}>
                      {item[labelKey]}
                    </Text>
                    {isMultiSelect ? (
                      <Icon
                        name={itemIsSelected ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={itemIsSelected ? theme.colors.primary : theme.colors.textSecondary}
                        style={{ marginLeft: 8 }}
                      />
                    ) : (
                      itemIsSelected && (
                        <Icon
                          name="checkmark-circle"
                          size={18}
                          color={theme.colors.primary}
                          style={{ marginLeft: 8 }}
                        />
                      )
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            {isMultiSelect && (
              <TouchableOpacity
                style={[s.doneBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => setDropdownOpen(false)}
              >
                <Text style={s.doneBtnText}>
                  DONE ({selectedMultiItems.length} selected)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme, disabled) =>
  StyleSheet.create({
    container: { marginBottom: 15, width: '100%' },
    label: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
      color: theme.colors.textSecondary,
    },
    dropdownBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: 14,
      padding: 10,
      gap: 12,
      backgroundColor: theme.colors.surface,
      opacity: disabled ? 0.6 : 1,
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
      paddingVertical: Platform.OS === 'ios' ? 10 : 2,
      borderRadius: 12,
      marginBottom: 14,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      minHeight: 40,
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
    emptyText: { textAlign: 'center', padding: 30, color: theme.colors.textSecondary },
    doneBtn: {
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 10,
    },
    doneBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
  });

export default SearchableDropdown;
