import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '@config/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { SearchableDropdown } from '@components/common';
import {
  useGetHospitalMutation,
  useGetHospitalContactsMutation,
  useGetCityDropdownMutation,
  useGetStockMasterMainDropdownMutation,
  useGetDepartmentDropdownMutation,
  useGetSurgicalSpecialityDropdownMutation,
  usePostSampleDataMutation,
} from '@api/baseApi';

const CRMSampleRequestScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const user = useSelector(state => state.auth.user);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Sample Request',
    });
  }, [navigation]);

  // Top Section State
  const [basicInfo, setBasicInfo] = useState({
    salePerson: null,
    salesRegion: null,
    hospital: null,
    hospitalContact: null,
    department: null,
    surgicalSpecialty: null,
  });

  // Dynamic Products Section State
  const emptyProduct = {
    product: null,
    quantity: '',
  };
  const [products, setProducts] = useState([{ ...emptyProduct }]);

  // API Hooks
  const [getHospital, { data: hospRes, isLoading: hospLoading }] = useGetHospitalMutation();
  const [getHospitalContacts, { data: contactRes, isLoading: contactLoading }] = useGetHospitalContactsMutation();
  const [getCityDropdown, { data: cityRes, isLoading: cityLoading }] = useGetCityDropdownMutation();
  const [getStockMasterMain, { data: stockRes, isLoading: stockLoading }] = useGetStockMasterMainDropdownMutation();
  const [getDepartment, { data: deptRes, isLoading: deptLoading }] = useGetDepartmentDropdownMutation();
  const [getSurgicalSpecialty, { data: surgicalRes, isLoading: surgicalLoading }] = useGetSurgicalSpecialityDropdownMutation();
  const [postSampleData, { isLoading: isSubmitting }] = usePostSampleDataMutation();

  useEffect(() => {
    getHospital({ id: user?.id });
    getCityDropdown({ id: user?.id });
    getStockMasterMain({});
    getDepartment({});
    getSurgicalSpecialty({});
  }, [user?.id, getHospital, getCityDropdown, getStockMasterMain, getDepartment, getSurgicalSpecialty]);

  const handleHospitalSelect = (item) => {
    setBasicInfo(prev => ({
      ...prev,
      hospital: item.debtor_no,
      hospitalContact: null,
      salesRegion: null,
      department: null,
      surgicalSpecialty: null,
    }));
    getHospitalContacts({ hospital_id: item.debtor_no, user_id: user?.id });
  };

  const handleContactSelect = (item) => {
    setBasicInfo(prev => ({
      ...prev,
      hospitalContact: item.id,
      salesRegion: item.city || prev.salesRegion,
      department: item.department || prev.department,
      surgicalSpecialty: item.surgical_speciality || prev.surgicalSpecialty,
    }));

    if (item.city) {
      getCityDropdown({ id: user?.id, city: item.city });
    }
    if (item.department) {
      getDepartment({ department: item.department });
    }
    if (item.surgical_speciality) {
      getSurgicalSpecialty({ surgical_speciality: item.surgical_speciality });
    }
  };

  // Remarks State
  const [remarks, setRemarks] = useState('');

  // Handlers
  const updateBasicField = (key, value) => {
    setBasicInfo(prev => ({ ...prev, [key]: value }));
  };

  const updateProductField = (index, key, value) => {
    const updated = [...products];
    updated[index][key] = value;
    setProducts(updated);
  };

  const addProduct = () => {
    setProducts([...products, { ...emptyProduct }]);
  };

  const removeProduct = (index) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!basicInfo.hospital) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a hospital.',
      });
      return;
    }

    if (!basicInfo.hospitalContact) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a hospital contact.',
      });
      return;
    }

    const invalidProduct = products.find(p => !p.product || !p.quantity);
    if (invalidProduct) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please ensure all items have a product and quantity specified.',
      });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const purchOrderDetails = products.map(p => {
      const selectedProduct = stockRes?.data?.find(s => s.stock_id === p.product);
      return {
        item_code: p.product,
        quantity_ordered: p.quantity || '1',
        unit_price: selectedProduct?.price || '2000',
      };
    });

    const hospitalName = hospRes?.data?.find(h => String(h.debtor_no) === String(basicInfo.hospital))?.name || basicInfo.hospital;
    const contactPerson = contactRes?.data?.find(c => String(c.id) === String(basicInfo.hospitalContact))?.person_name || basicInfo.hospitalContact;
    const cityName = cityRes?.data?.find(c => String(c.id) === String(basicInfo.salesRegion))?.cityname || basicInfo.salesRegion;
    const departmentName = deptRes?.data?.find(d => String(d.sales_code) === String(basicInfo.department))?.description || basicInfo.department;
    const surgicalSpecialtyName = surgicalRes?.data?.find(s => String(s.id) === String(basicInfo.surgicalSpecialty))?.description || basicInfo.surgicalSpecialty;

    const payload = {
      company: 'ANS',
      order_no: '0',
      person_id: user?.person_id || user?.id || '1',
      branch_code: user?.branch_code || '',
      ord_date: todayStr,
      hospital_name: hospitalName || '',
      contact_person: contactPerson || '',
      city: cityName || '',
      department: departmentName || '',
      surgical_speciality: surgicalSpecialtyName || '',
      comments: remarks || '',
      purch_order_details: purchOrderDetails,
    };

    console.log('Post Sample Data Payload sent to database/server:', JSON.stringify(payload, null, 2));

    try {
      const response = await postSampleData(payload).unwrap();
      if (String(response.status) === 'true') {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Sample request submitted successfully!',
        });
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Submission failed.',
        });
      }
    } catch (err) {
      console.error('Submit sample request error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred during submission.',
      });
    }
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Top Section */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <SearchableDropdown
            label="Hospital"
            placeholder="Select Hospital"
            data={hospRes?.data || []}
            selectedId={basicInfo.hospital}
            onSelect={handleHospitalSelect}
            isLoading={hospLoading}
            idKey="debtor_no"
            labelKey="name"
            iconName="business-outline"
          />

          <SearchableDropdown
            label="Hospital Contact"
            placeholder={
              basicInfo.hospital ? 'Select Contact' : 'First select hospital'
            }
            data={contactRes?.data || []}
            selectedId={basicInfo.hospitalContact}
            onSelect={handleContactSelect}
            isLoading={contactLoading}
            labelKey="person_name"
            iconName="people-outline"
            disabled={!basicInfo.hospital}
          />

          <SearchableDropdown
            label="Sales Region/Territory"
            placeholder="Select City"
            data={cityRes?.data || []}
            selectedId={basicInfo.salesRegion}
            onSelect={item => updateBasicField('salesRegion', item.id)}
            isLoading={cityLoading}
            idKey="id"
            labelKey="cityname"
            iconName="location-outline"
          />

          <SearchableDropdown
            label="Department"
            placeholder="Select Department"
            data={deptRes?.data || []}
            selectedId={basicInfo.department}
            onSelect={item => updateBasicField('department', item.sales_code)}
            isLoading={deptLoading}
            idKey="sales_code"
            labelKey="description"
            iconName="briefcase-outline"
          />

          <SearchableDropdown
            label="Surgical Specialty"
            placeholder="Select Surgical Specialty"
            data={surgicalRes?.data || []}
            selectedId={basicInfo.surgicalSpecialty}
            onSelect={item => updateBasicField('surgicalSpecialty', item.id)}
            isLoading={surgicalLoading}
            idKey="id"
            labelKey="description"
            iconName="medical-outline"
          />
        </View>

        {/* Dynamic Products Section */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Products Details</Text>
          
          {products.map((item, index) => (
            <View key={index} style={[styles.dynamicBlock, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
              <View style={styles.dynamicHeader}>
                <Text style={[styles.dynamicTitle, { color: theme.colors.text }]}>Item {index + 1}</Text>
                {products.length > 1 && (
                  <TouchableOpacity onPress={() => removeProduct(index)}>
                    <Icon name="trash-outline" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                )}
              </View>

              <SearchableDropdown
                label="Product"
                placeholder="Select Product"
                data={stockRes?.data || []}
                selectedId={item.product}
                onSelect={selectedItem => updateProductField(index, 'product', selectedItem.stock_id)}
                isLoading={stockLoading}
                idKey="stock_id"
                labelKey="description"
                iconName="cube-outline"
              />
              {renderInput('Quantity', item.quantity, (text) => updateProductField(index, 'quantity', text), 'numeric')}
            </View>
          ))}
          
          <TouchableOpacity 
            style={[styles.addMoreBtn, { borderColor: theme.colors.primary }]}
            onPress={addProduct}
          >
            <Icon name="add" size={20} color={theme.colors.primary} style={styles.addIcon} />
            <Text style={[styles.addMoreText, { color: theme.colors.primary }]}>Add More Item</Text>
          </TouchableOpacity>
        </View>

        {/* Remarks */}
        <View style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Remarks</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Add any remarks..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              value={remarks}
              onChangeText={setRemarks}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[
            styles.submitBtn, 
            { backgroundColor: theme.colors.primary },
            isSubmitting && { opacity: 0.7 }
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Request</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.footerSpacer} />
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
  addIcon: {
    marginRight: 8,
  },
  footerSpacer: {
    height: 40,
  },
});

export default CRMSampleRequestScreen;
