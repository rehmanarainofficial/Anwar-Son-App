import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { useSelector } from 'react-redux';
import { useGetFunctionalityCheckMutation, useGetDimensionDropdownMutation } from '@api/baseApi';

const DimensionDropdown = ({ onDimensionSelect, style, showLabel = false }) => {
  const { theme } = useTheme();
  const company = useSelector(state => state.auth.company);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredDimensions, setFilteredDimensions] = useState([]);

  const [getFunctionalityCheck] = useGetFunctionalityCheckMutation();
  const [getDimensionDropdown, { data: dimensionData }] = useGetDimensionDropdownMutation();

  const [dimensionEnabled, setDimensionEnabled] = useState(false);

  useEffect(() => {
    // Check if dimension is enabled
    const checkDimension = async () => {
      try {
        const result = await getFunctionalityCheck({ company }).unwrap();
        if (result.functionalities_check?.dimension_enable === '1') {
          setDimensionEnabled(true);
          // Load dimensions
          getDimensionDropdown({ company });
        }
      } catch (error) {
        console.log('Functionality check error:', error);
      }
    };

    checkDimension();
  }, [company]);

  useEffect(() => {
    if (dimensionData?.status === 'true' && dimensionData.data) {
      setFilteredDimensions(dimensionData.data);
      // Default: no API item selected (show "All"), do not auto-select first dimension
    }
  }, [dimensionData]);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredDimensions(dimensionData?.data || []);
    } else {
      const filtered = (dimensionData?.data || []).filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredDimensions(filtered);
    }
  }, [searchText, dimensionData]);

  const handleSelectDimension = (dimension) => {
    setSelectedDimension(dimension);
    setShowDropdown(false);
    setSearchText('');
    if (onDimensionSelect) {
      onDimensionSelect(dimension ? dimension.id : 0);
    }
  };

  const handleSelectAll = () => {
    setSelectedDimension(null);
    setShowDropdown(false);
    setSearchText('');
    if (onDimensionSelect) {
      onDimensionSelect(0);
    }
  };

  if (!dimensionEnabled) {
    return null;
  }

  return (
    <View style={[{ width: '100%' }, style]}>
      {showLabel && (
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
            color: theme.colors.textSecondary,
          }}
        >
          Select Dimension
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.dropdownButton, 
          { 
            backgroundColor: theme.colors.surface, 
            borderColor: theme.colors.border,
            borderWidth: 1 
          }
        ]}
        onPress={() => setShowDropdown(true)}
        activeOpacity={0.7}
      >
        <Icon name="grid-outline" size={18} color={theme.colors.textSecondary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.selectedText, { color: theme.colors.text }]}>
            {selectedDimension?.name || 'All'}
          </Text>
        </View>
        <Icon name="chevron-down" size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View 
            style={[
              styles.dropdownContainer,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
            ]}
          >
            <View style={styles.dropdownHeader}>
              <Text style={[styles.dropdownTitle, { color: theme.colors.text }]}>
                Select Dimension
              </Text>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <Icon name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: theme.colors.background }]}>
              <Icon name="search" size={18} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="Search dimension..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.itemRow,
                !selectedDimension 
                  ? { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '30' }
                  : { borderColor: theme.colors.border + '60' }
              ]}
              onPress={handleSelectAll}
              activeOpacity={0.7}
            >
              <View style={styles.itemContent}>
                <Text style={[styles.itemName, { color: theme.colors.text }]}>
                  All
                </Text>
              </View>
              {!selectedDimension && (
                <Icon name="checkmark-circle" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>

            <FlatList
              data={filteredDimensions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.itemRow,
                    selectedDimension?.id === item.id 
                      ? { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '30' }
                      : { borderColor: theme.colors.border + '60' }
                  ]}
                  onPress={() => handleSelectDimension(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemName, { color: theme.colors.text }]}>
                      {item.name}
                    </Text>
                    {item.closed === '1' && (
                      <Text style={styles.closedText}>Closed</Text>
                    )}
                  </View>
                  {selectedDimension?.id === item.id && (
                    <Icon name="checkmark-circle" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={{ color: theme.colors.textSecondary }}>
                    No dimensions found
                  </Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: '90%',
    maxHeight: '75%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 14,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  closedText: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
});

export default DimensionDropdown;
