import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTheme } from '@config/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import { Dropdown } from 'react-native-element-dropdown';
import { launchImageLibrary } from 'react-native-image-picker';

const DUMMY_DROPDOWN = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
];

const CRMMonthlyExpenseScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Monthly Expense Request',
    });
  }, [navigation]);

  // Section 1 State
  const [basicInfo, setBasicInfo] = useState({ salesman: null, city: null, month: null });

  // Section 2 State
  const [localExpense, setLocalExpense] = useState({ allowances: '', noOfDays: '', fuelAllowance: '', totalAmount: '' });

  // Section 3 State (Dynamic)
  const [outstationVisits, setOutstationVisits] = useState([
    { date: '', fromCity: null, toCity: null, outboundExpense: '', outstationAllowance: '', overnightStay: '', total: '', image: null }
  ]);

  // Section 4 State
  const [otherExpense, setOtherExpense] = useState({
    mobile: { amount: '', image: null },
    courier: { amount: '', image: null },
    printing: { amount: '', image: null },
    transport: { amount: '', image: null },
    others: { amount: '', image: null },
    vehicle: { amount: '', image: null },
  });

  const handleImagePick = (callback) => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.didCancel) return;
      if (response.assets && response.assets.length > 0) {
        callback(response.assets[0].uri);
      }
    });
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
        data={DUMMY_DROPDOWN}
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={`Select ${label}`}
        value={value}
        onChange={(item) => onChange(item.value)}
      />
    </View>
  );

  const renderInputWithImage = (label, stateKey) => {
    const data = otherExpense[stateKey];
    return (
      <View style={styles.inputWithImageRow}>
        <View style={styles.inputFlex}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
            placeholder="Amount"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            value={data.amount}
            onChangeText={(text) => setOtherExpense(prev => ({ ...prev, [stateKey]: { ...data, amount: text } }))}
          />
        </View>
        <TouchableOpacity 
          style={[styles.imageUploadBtnSmall, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
          onPress={() => handleImagePick((uri) => setOtherExpense(prev => ({ ...prev, [stateKey]: { ...data, image: uri } })))}
        >
          {data.image ? (
            <Image source={{ uri: data.image }} style={styles.smallPreview} />
          ) : (
            <Icon name="camera-outline" size={24} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Section 1: Basic (No Title) */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {renderDropdown('Salesman Name', basicInfo.salesman, (val) => setBasicInfo({...basicInfo, salesman: val}))}
          {renderDropdown('City', basicInfo.city, (val) => setBasicInfo({...basicInfo, city: val}))}
          {renderDropdown('Month', basicInfo.month, (val) => setBasicInfo({...basicInfo, month: val}))}
        </View>

        {/* Section 2: Local Working Expense */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Local Working Expense</Text>
          {renderInput('Allowances', localExpense.allowances, (text) => setLocalExpense({...localExpense, allowances: text}), 'numeric')}
          {renderInput('No. of Days', localExpense.noOfDays, (text) => setLocalExpense({...localExpense, noOfDays: text}), 'numeric')}
          {renderInput('Daily Allowance of Fuel', localExpense.fuelAllowance, (text) => setLocalExpense({...localExpense, fuelAllowance: text}), 'numeric')}
          {renderInput('Total Amount', localExpense.totalAmount, (text) => setLocalExpense({...localExpense, totalAmount: text}), 'numeric')}
        </View>

        {/* Section 3: Outstation Working Expense */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Outstation Working Expense</Text>
          
          {outstationVisits.map((visit, index) => (
            <View key={index} style={[styles.dynamicBlock, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
              <View style={styles.dynamicHeader}>
                <Text style={[styles.dynamicTitle, { color: theme.colors.text }]}>Visit {index + 1}</Text>
                {outstationVisits.length > 1 && (
                  <TouchableOpacity onPress={() => setOutstationVisits(prev => prev.filter((_, i) => i !== index))}>
                    <Icon name="trash-outline" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                )}
              </View>

              {renderInput('Date', visit.date, (text) => {
                const updated = [...outstationVisits];
                updated[index].date = text;
                setOutstationVisits(updated);
              })}
              {renderDropdown('From City', visit.fromCity, (val) => {
                const updated = [...outstationVisits];
                updated[index].fromCity = val;
                setOutstationVisits(updated);
              })}
              {renderDropdown('To City', visit.toCity, (val) => {
                const updated = [...outstationVisits];
                updated[index].toCity = val;
                setOutstationVisits(updated);
              })}
              {renderInput('Outbound Expense', visit.outboundExpense, (text) => {
                const updated = [...outstationVisits];
                updated[index].outboundExpense = text;
                setOutstationVisits(updated);
              }, 'numeric')}
              {renderInput('Outstation Allowance', visit.outstationAllowance, (text) => {
                const updated = [...outstationVisits];
                updated[index].outstationAllowance = text;
                setOutstationVisits(updated);
              }, 'numeric')}
              {renderInput('Overnight Stay', visit.overnightStay, (text) => {
                const updated = [...outstationVisits];
                updated[index].overnightStay = text;
                setOutstationVisits(updated);
              }, 'numeric')}
              {renderInput('Total', visit.total, (text) => {
                const updated = [...outstationVisits];
                updated[index].total = text;
                setOutstationVisits(updated);
              }, 'numeric')}

              <Text style={[styles.label, { color: theme.colors.text, marginTop: 8 }]}>Upload Image</Text>
              <TouchableOpacity 
                style={[styles.imageUploadBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
                onPress={() => handleImagePick((uri) => {
                  const updated = [...outstationVisits];
                  updated[index].image = uri;
                  setOutstationVisits(updated);
                })}
              >
                {visit.image ? (
                  <Image source={{ uri: visit.image }} style={styles.previewImage} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Icon name="cloud-upload-outline" size={28} color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>Tap to upload receipt</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity 
            style={[styles.addMoreBtn, { borderColor: theme.colors.primary }]}
            onPress={() => setOutstationVisits([...outstationVisits, { date: '', fromCity: null, toCity: null, outboundExpense: '', outstationAllowance: '', overnightStay: '', total: '', image: null }])}
          >
            <Icon name="add" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.addMoreText, { color: theme.colors.primary }]}>Add More Visit</Text>
          </TouchableOpacity>
        </View>

        {/* Section 4: Other Expense */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Other Expense</Text>
          {renderInputWithImage('Mobile/Internet Charges', 'mobile')}
          {renderInputWithImage('Courier & Postage', 'courier')}
          {renderInputWithImage('Printing, Stationary & Photography', 'printing')}
          {renderInputWithImage('Good Delivery Transport', 'transport')}
          {renderInputWithImage('Vehicle Repair & Maintenance', 'vehicle')}
          {renderInputWithImage('Others', 'others')}
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.submitBtnText}>Submit Expense</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
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
  placeholderStyle: { fontSize: 15 },
  selectedTextStyle: { fontSize: 15 },
  itemTextStyle: { fontSize: 15 },
  dynamicBlock: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  },
  addMoreText: {
    fontSize: 15,
    fontWeight: '600',
  },
  imageUploadBtn: {
    height: 120,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWithImageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 12,
  },
  inputFlex: {
    flex: 1,
  },
  imageUploadBtnSmall: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  smallPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
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

export default CRMMonthlyExpenseScreen;
