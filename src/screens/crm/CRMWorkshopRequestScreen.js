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
import { Dropdown, MultiSelect } from 'react-native-element-dropdown';

// Generic data
const DUMMY_DROPDOWN = [{ label: 'Option 1', value: '1' }, { label: 'Option 2', value: '2' }];
const WORKSHOP_TYPES = [
  { label: 'Educational', value: 'Educational' },
  { label: 'Product Demonstration', value: 'Product Demonstration' },
  { label: 'Hands on training', value: 'Hands on training' },
];
const PRODUCT_SEGMENTS = [
  { label: 'Sutures', value: 'Sutures' },
  { label: 'Airway Management', value: 'Airway Management' },
  { label: 'Hemostasis', value: 'Hemostasis' },
  { label: 'Surgical Mesh', value: 'Surgical Mesh' },
];
const BUDGET_CATEGORIES = [
  { label: 'Refreshment', value: 'Refreshment' },
  { label: 'Hands-on Material', value: 'Hands-on Material' },
  { label: 'Equipment Rental', value: 'Equipment Rental' },
  { label: 'Miscellaneous', value: 'Miscellaneous' },
];

const CRMWorkshopRequestScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [activeTab, setActiveTab] = useState('Info');

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Workshop Request' });
  }, [navigation]);

  // Tab 1: Workshop Information
  const [workshopInfo, setWorkshopInfo] = useState({
    title: '', date: '', duration: '', hospitalName: '', department: '', specialty: '', objective: ''
  });
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedSegments, setSelectedSegments] = useState([]);
  
  const [keyProducts, setKeyProducts] = useState([{ name: '', size: '', purpose: '', comments: '' }]);
  
  const TARGET_AUDIENCE_KEYS = ['Head of Department', 'KOLS', 'Associated Professor APs', 'Anesthetics', 'Senior Registrars', 'OT Technicians', 'Nurses', 'Interns/Students', 'Other Mention 1', 'Other Mention 2'];
  const initialAudience = {};
  TARGET_AUDIENCE_KEYS.forEach(k => initialAudience[k] = '');
  const [targetAudience, setTargetAudience] = useState(initialAudience);

  const MATERIAL_KEYS = ['Surgical instrument', 'Knots typing boards', 'Wooden board 1', 'Artificial skin pads', 'Animals Gut / vessels', 'Animals bladders', 'Wooden board 2'];
  const initialMaterial = {};
  MATERIAL_KEYS.forEach(k => initialMaterial[k] = { size: '', purpose: '', comments: '' });
  const [handsOnMaterial, setHandsOnMaterial] = useState(initialMaterial);

  // Tab 2: Workshop Content
  const [agenda, setAgenda] = useState([{ agenda: '', presentation: '', time: '', presenter: '' }]);

  // Tab 3: Sample Required
  const [samples, setSamples] = useState([{ product: null, quantity: '', batchNo: '', primaryQuantity: '', expectedDate: '', secondaryQuantity: '', currentBrand: '', samplePurpose: '' }]);

  // Tab 4: Budget Requirement
  const [budget, setBudget] = useState([{ breakdown: null, unit: '', cost: '', totalCost: '' }]);

  const updateDynamicList = (setState, index, key, value) => {
    setState((prev) => {
      const updated = [...prev];
      updated[index][key] = value;
      return updated;
    });
  };

  const addDynamicRow = (setState, emptyObj) => {
    setState(prev => [...prev, emptyObj]);
  };

  const removeDynamicRow = (setState, index) => {
    setState(prev => prev.filter((_, i) => i !== index));
  };

  // Shared UI Helpers
  const renderInput = (label, value, onChange, keyboardType = 'default') => (
    <View style={styles.inputContainer}>
      {label && <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>}
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
        placeholder={`Enter ${label || 'Value'}`}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
  
  const renderTextArea = (label, value, onChange) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <TextInput
        style={[styles.textArea, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
        placeholder={`Enter ${label}`}
        placeholderTextColor={theme.colors.textSecondary}
        multiline
        numberOfLines={4}
        value={value}
        onChangeText={onChange}
      />
    </View>
  );

  const renderDropdown = (label, value, onChange, data = DUMMY_DROPDOWN) => (
    <View style={styles.inputContainer}>
      {label && <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>}
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
        placeholder={`Select ${label || 'Value'}`}
        value={value}
        onChange={(item) => onChange(item.value)}
      />
    </View>
  );

  const renderMultiSelect = (label, value, onChange, data) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <MultiSelect
        style={[styles.dropdown, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
        placeholderStyle={[styles.placeholderStyle, { color: theme.colors.textSecondary }]}
        selectedTextStyle={[styles.selectedTextStyle, { color: theme.colors.text }]}
        itemTextStyle={[styles.itemTextStyle, { color: theme.colors.text }]}
        containerStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
        data={data}
        labelField="label"
        valueField="value"
        placeholder={`Select ${label}`}
        value={value}
        onChange={onChange}
        selectedStyle={[styles.selectedStyle, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }]}
        renderItem={(item, selected) => (
          <View style={styles.multiSelectItem}>
            <Icon name={selected ? 'checkbox' : 'square-outline'} size={20} color={selected ? theme.colors.primary : theme.colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[{ color: theme.colors.text }]}>{item.label}</Text>
          </View>
        )}
      />
    </View>
  );

  // Tabs Header
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {['Info', 'Content', 'Samples', 'Budget'].map(tab => {
          const labels = { Info: 'Workshop Info', Content: 'Workshop Content', Samples: 'Sample Required', Budget: 'Budget Req.' };
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, { backgroundColor: isActive ? theme.colors.primary : theme.colors.surface, borderColor: isActive ? theme.colors.primary : theme.colors.border }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: isActive ? '#FFF' : theme.colors.textSecondary }]}>{labels[tab]}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // Contents
  const renderInfoTab = () => (
    <View>
      <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>1. Workshop Information</Text>
        {renderInput('Workshop Title', workshopInfo.title, t => setWorkshopInfo({...workshopInfo, title: t}))}
        {renderInput('Date', workshopInfo.date, t => setWorkshopInfo({...workshopInfo, date: t}))}
        {renderInput('Duration', workshopInfo.duration, t => setWorkshopInfo({...workshopInfo, duration: t}))}
        {renderInput('Hospital Name', workshopInfo.hospitalName, t => setWorkshopInfo({...workshopInfo, hospitalName: t}))}
        {renderInput('Hospital Department', workshopInfo.department, t => setWorkshopInfo({...workshopInfo, department: t}))}
        {renderMultiSelect('Workshop Type', selectedTypes, setSelectedTypes, WORKSHOP_TYPES)}
        {renderMultiSelect('Product Segment', selectedSegments, setSelectedSegments, PRODUCT_SEGMENTS)}
        {renderTextArea('Specialty', workshopInfo.specialty, t => setWorkshopInfo({...workshopInfo, specialty: t}))}
      </View>

      <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>2. Objective of the Workshop</Text>
        {renderTextArea('Objective', workshopInfo.objective, t => setWorkshopInfo({...workshopInfo, objective: t}))}
      </View>

      <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>3. Key Product to be Demonstrated</Text>
        {keyProducts.map((item, index) => (
          <View key={index} style={[styles.dynamicBlock, { borderColor: theme.colors.border }]}>
            <View style={styles.dynamicHeader}>
              <Text style={{ fontWeight: '600', color: theme.colors.text }}>Product {index + 1}</Text>
              {keyProducts.length > 1 && <TouchableOpacity onPress={() => removeDynamicRow(setKeyProducts, index)}><Icon name="trash" size={20} color={theme.colors.error} /></TouchableOpacity>}
            </View>
            {renderInput('Product Name', item.name, t => updateDynamicList(setKeyProducts, index, 'name', t))}
            {renderInput('Size/Code', item.size, t => updateDynamicList(setKeyProducts, index, 'size', t))}
            {renderInput('Purpose', item.purpose, t => updateDynamicList(setKeyProducts, index, 'purpose', t))}
            {renderInput('Comments', item.comments, t => updateDynamicList(setKeyProducts, index, 'comments', t))}
          </View>
        ))}
        <TouchableOpacity style={[styles.addMoreBtn, { borderColor: theme.colors.primary }]} onPress={() => addDynamicRow(setKeyProducts, {name:'', size:'', purpose:'', comments:''})}>
          <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>+ Add Product</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>4. Target Audience</Text>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCol, { color: theme.colors.textSecondary, flex: 2 }]}>Category</Text>
          <Text style={[styles.tableHeaderCol, { color: theme.colors.textSecondary, flex: 1 }]}>Expected Number</Text>
        </View>
        {TARGET_AUDIENCE_KEYS.map(cat => (
          <View key={cat} style={styles.tableRow}>
            <Text style={[styles.tableLabel, { color: theme.colors.text, flex: 2 }]}>{cat}</Text>
            <View style={{ flex: 1 }}>
              <TextInput style={[styles.tableInput, { borderColor: theme.colors.border, color: theme.colors.text }]} keyboardType="numeric" value={targetAudience[cat]} onChangeText={(t) => setTargetAudience({...targetAudience, [cat]: t})} />
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>5. Hands on Material</Text>
        {MATERIAL_KEYS.map(cat => (
          <View key={cat} style={[styles.dynamicBlock, { borderColor: theme.colors.border }]}>
            <Text style={{ fontWeight: '600', color: theme.colors.primary, marginBottom: 12 }}>{cat}</Text>
            {renderInput('Size/Code', handsOnMaterial[cat].size, t => setHandsOnMaterial(prev => ({...prev, [cat]: {...prev[cat], size: t}})))}
            {renderInput('Purpose', handsOnMaterial[cat].purpose, t => setHandsOnMaterial(prev => ({...prev, [cat]: {...prev[cat], purpose: t}})))}
            {renderInput('Comment', handsOnMaterial[cat].comments, t => setHandsOnMaterial(prev => ({...prev, [cat]: {...prev[cat], comments: t}})))}
          </View>
        ))}
      </View>
    </View>
  );

  const renderContentTab = () => (
    <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>Workshop Agenda</Text>
      {agenda.map((item, index) => (
        <View key={index} style={[styles.dynamicBlock, { borderColor: theme.colors.border }]}>
          <View style={styles.dynamicHeader}>
            <Text style={{ fontWeight: '600', color: theme.colors.text }}>Agenda {index + 1}</Text>
            {agenda.length > 1 && <TouchableOpacity onPress={() => removeDynamicRow(setAgenda, index)}><Icon name="trash" size={20} color={theme.colors.error} /></TouchableOpacity>}
          </View>
          {renderInput('Agenda', item.agenda, t => updateDynamicList(setAgenda, index, 'agenda', t))}
          {renderInput('Presentation / Hands on', item.presentation, t => updateDynamicList(setAgenda, index, 'presentation', t))}
          {renderInput('Time', item.time, t => updateDynamicList(setAgenda, index, 'time', t))}
          {renderInput('Presenter', item.presenter, t => updateDynamicList(setAgenda, index, 'presenter', t))}
        </View>
      ))}
      <TouchableOpacity style={[styles.addMoreBtn, { borderColor: theme.colors.primary }]} onPress={() => addDynamicRow(setAgenda, {agenda:'', presentation:'', time:'', presenter:''})}>
        <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>+ Add Agenda</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSamplesTab = () => (
    <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>Sample Required</Text>
      {samples.map((item, index) => (
        <View key={index} style={[styles.dynamicBlock, { borderColor: theme.colors.border }]}>
          <View style={styles.dynamicHeader}>
            <Text style={{ fontWeight: '600', color: theme.colors.text }}>Sample {index + 1}</Text>
            {samples.length > 1 && <TouchableOpacity onPress={() => removeDynamicRow(setSamples, index)}><Icon name="trash" size={20} color={theme.colors.error} /></TouchableOpacity>}
          </View>
          {renderDropdown('Product', item.product, val => updateDynamicList(setSamples, index, 'product', val))}
          {renderInput('Quantity', item.quantity, t => updateDynamicList(setSamples, index, 'quantity', t), 'numeric')}
          {renderInput('Batch No.', item.batchNo, t => updateDynamicList(setSamples, index, 'batchNo', t))}
          {renderInput('Primary Quantity', item.primaryQuantity, t => updateDynamicList(setSamples, index, 'primaryQuantity', t), 'numeric')}
          {renderInput('Expected Date of Use', item.expectedDate, t => updateDynamicList(setSamples, index, 'expectedDate', t))}
          {renderInput('Secondary Quantity', item.secondaryQuantity, t => updateDynamicList(setSamples, index, 'secondaryQuantity', t), 'numeric')}
          {renderInput('Current Brand', item.currentBrand, t => updateDynamicList(setSamples, index, 'currentBrand', t))}
          {renderInput('Sample Purpose', item.samplePurpose, t => updateDynamicList(setSamples, index, 'samplePurpose', t))}
        </View>
      ))}
      <TouchableOpacity style={[styles.addMoreBtn, { borderColor: theme.colors.primary }]} onPress={() => addDynamicRow(setSamples, {product: null, quantity: '', batchNo: '', primaryQuantity: '', expectedDate: '', secondaryQuantity: '', currentBrand: '', samplePurpose: ''})}>
        <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>+ Add Sample</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBudgetTab = () => (
    <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>Budget Requirement</Text>
      {budget.map((item, index) => (
        <View key={index} style={[styles.dynamicBlock, { borderColor: theme.colors.border }]}>
          <View style={styles.dynamicHeader}>
            <Text style={{ fontWeight: '600', color: theme.colors.text }}>Budget Row {index + 1}</Text>
            {budget.length > 1 && <TouchableOpacity onPress={() => removeDynamicRow(setBudget, index)}><Icon name="trash" size={20} color={theme.colors.error} /></TouchableOpacity>}
          </View>
          {renderDropdown('Break Down', item.breakdown, val => updateDynamicList(setBudget, index, 'breakdown', val), BUDGET_CATEGORIES)}
          {renderInput('Unit', item.unit, t => updateDynamicList(setBudget, index, 'unit', t), 'numeric')}
          {renderInput('Cost', item.cost, t => updateDynamicList(setBudget, index, 'cost', t), 'numeric')}
          {renderInput('Total Cost', item.totalCost, t => updateDynamicList(setBudget, index, 'totalCost', t), 'numeric')}
        </View>
      ))}
      <TouchableOpacity style={[styles.addMoreBtn, { borderColor: theme.colors.primary }]} onPress={() => addDynamicRow(setBudget, {breakdown: null, unit: '', cost: '', totalCost: ''})}>
        <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>+ Add Budget Item</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderTabs()}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {activeTab === 'Info' && renderInfoTab()}
        {activeTab === 'Content' && renderContentTab()}
        {activeTab === 'Samples' && renderSamplesTab()}
        {activeTab === 'Budget' && renderBudgetTab()}

        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.goBack()}>
          <Text style={styles.submitBtnText}>Submit Workshop</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
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
  tabText: { fontSize: 14, fontWeight: '600' },
  scrollContent: { padding: 16 },
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
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputContainer: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dropdown: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  placeholderStyle: { fontSize: 14 },
  selectedTextStyle: { fontSize: 14 },
  itemTextStyle: { fontSize: 14 },
  selectedStyle: {
    borderRadius: 10,
    borderWidth: 1,
  },
  multiSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  dynamicBlock: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  dynamicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addMoreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 4,
  },
  tableHeaderCol: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  tableInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  submitBtn: {
    height: 52,
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

export default CRMWorkshopRequestScreen;
