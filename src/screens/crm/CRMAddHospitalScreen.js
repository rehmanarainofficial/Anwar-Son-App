import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@config/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import { Dropdown } from 'react-native-element-dropdown';

// Generic dummy data for dropdowns
const DUMMY_OPTIONS = [
  { label: 'Option A', value: 'A' },
  { label: 'Option B', value: 'B' },
  { label: 'Option C', value: 'C' },
];

const CRMAddHospitalScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  // Basic Information State
  const [basicInfo, setBasicInfo] = useState({
    hospitalName: '',
    address: '',
    city: null,
    segment: null,
    noOfOts: '',
    noOfBeds: '',
    status: null,
    customersType: null,
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Add Hospital',
    });
  }, [navigation]);

  const updateBasicField = (key, value) => {
    setBasicInfo((prev) => ({ ...prev, [key]: value }));
  };



  // UI Helpers
  const renderInput = (label, value, onChangeText, keyboardType = 'default') => (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
        placeholder={`Enter ${label}`}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );

  const renderDropdown = (label, value, onChange) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <Dropdown
        style={[styles.dropdown, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
        placeholderStyle={[styles.placeholderStyle, { color: theme.colors.textSecondary }]}
        selectedTextStyle={[styles.selectedTextStyle, { color: theme.colors.text }]}
        itemTextStyle={[styles.itemTextStyle, { color: theme.colors.text }]}
        containerStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
        data={DUMMY_OPTIONS}
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={`Select ${label}`}
        value={value}
        onChange={(item) => onChange(item.value)}
      />
    </View>
  );



  // Tab Contents
  const renderBasicInfo = () => (
    <View style={styles.formContent}>
      {renderInput('Hospital Name', basicInfo.hospitalName, (text) => updateBasicField('hospitalName', text))}
      {renderInput('Address', basicInfo.address, (text) => updateBasicField('address', text))}
      {renderDropdown('City', basicInfo.city, (val) => updateBasicField('city', val))}
      {renderDropdown('Segment', basicInfo.segment, (val) => updateBasicField('segment', val))}
      {renderInput('No. of OTs', basicInfo.noOfOts, (text) => updateBasicField('noOfOts', text), 'numeric')}
      {renderInput('No. of Beds', basicInfo.noOfBeds, (text) => updateBasicField('noOfBeds', text), 'numeric')}
      {renderDropdown('Current Status', basicInfo.status, (val) => updateBasicField('status', val))}
      {renderDropdown('Customers Type', basicInfo.customersType, (val) => updateBasicField('customersType', val))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderBasicInfo()}
        
        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.saveBtnText}>Save Hospital</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  formContent: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  placeholderStyle: {
    fontSize: 15,
  },
  selectedTextStyle: {
    fontSize: 15,
  },
  itemTextStyle: {
    fontSize: 15,
  },
  dynamicRowBlock: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dynamicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dynamicTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 16,
  },
  addMoreText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CRMAddHospitalScreen;
