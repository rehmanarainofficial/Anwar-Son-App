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
import { Dropdown } from 'react-native-element-dropdown';

const DUMMY_DROPDOWN = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
];

const YES_NO_DROPDOWN = [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
];

const CRMGiveawayRequestScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Giveaway Request',
    });
  }, [navigation]);

  const [formData, setFormData] = useState({
    hospitalName: null,
    salesmanName: null,
    salesRegion: null,
    purpose: '',
    recipientCategory: null,
    giveawayType: null,
    approvedBy: '',
    expectedDate: '',
    managerApproval: null,
    approvalDate: '',
    remarks: '',
  });

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
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

  const renderDropdown = (label, value, onChange, data = DUMMY_DROPDOWN) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <Dropdown
        style={[styles.dropdown, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
        placeholderStyle={[styles.placeholderStyle, { color: theme.colors.textSecondary }]}
        selectedTextStyle={[styles.selectedTextStyle, { color: theme.colors.text }]}
        itemTextStyle={[styles.itemTextStyle, { color: theme.colors.text }]}
        containerStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
        data={data}
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={`Select ${label}`}
        value={value}
        onChange={(item) => onChange(item.value)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {renderDropdown('Hospital Name', formData.hospitalName, (val) => updateField('hospitalName', val))}
          {renderDropdown('Salesman Name', formData.salesmanName, (val) => updateField('salesmanName', val))}
          {renderDropdown('Sales Region/Territory', formData.salesRegion, (val) => updateField('salesRegion', val))}
          {renderInput('Purpose of Giveaway', formData.purpose, (text) => updateField('purpose', text))}
          {renderDropdown('Recipient Category', formData.recipientCategory, (val) => updateField('recipientCategory', val))}
          {renderDropdown('Giveaway Type', formData.giveawayType, (val) => updateField('giveawayType', val))}
          {renderInput('Approved By', formData.approvedBy, (text) => updateField('approvedBy', text))}
          {renderInput('Expected Date of Distribution', formData.expectedDate, (text) => updateField('expectedDate', text))}
          {renderDropdown('Manager Approvals (Yes/No)', formData.managerApproval, (val) => updateField('managerApproval', val), YES_NO_DROPDOWN)}
          {renderInput('Approval Date', formData.approvalDate, (text) => updateField('approvalDate', text))}
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Remarks</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Add any remarks..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              value={formData.remarks}
              onChangeText={(text) => updateField('remarks', text)}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.submitBtnText}>Submit Request</Text>
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
  content: {
    padding: 16,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  placeholderStyle: { fontSize: 15 },
  selectedTextStyle: { fontSize: 15 },
  itemTextStyle: { fontSize: 15 },
  submitBtn: {
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CRMGiveawayRequestScreen;
