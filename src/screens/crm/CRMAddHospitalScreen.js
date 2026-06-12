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
import { useTheme } from '@config/useTheme';
import { Dropdown } from 'react-native-element-dropdown';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@store/slices/authSlice';
import Toast from 'react-native-toast-message';
import {
  useGetCityDropdownMutation,
  useGetDepartmentDropdownMutation,
  useGetPaymentTermsDropdownMutation,
  useGetCustomerTypeDropdownMutation,
  useAddHospitalMutation,
} from '@api/baseApi';

const CRMAddHospitalScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const user = useSelector(selectCurrentUser);

  const [basicInfo, setBasicInfo] = useState({
    hospitalName: '',
    address: '',
    city: null,
    segment: null,
    noOfBeds: '',
    customersType: null,
    paymentTerms: null,
  });

  // API Hooks
  const [getCityDropdown, { data: cityRes, isLoading: cityLoading }] =
    useGetCityDropdownMutation();
  const [getDepartmentDropdown, { data: deptRes, isLoading: deptLoading }] =
    useGetDepartmentDropdownMutation();
  const [
    getPaymentTermsDropdown,
    { data: paymentRes, isLoading: paymentLoading },
  ] = useGetPaymentTermsDropdownMutation();
  const [
    getCustomerTypeDropdown,
    { data: custTypeRes, isLoading: custTypeLoading },
  ] = useGetCustomerTypeDropdownMutation();
  const [addHospital, { isLoading: isSubmitting }] = useAddHospitalMutation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Add Hospital',
    });
  }, [navigation]);

  useEffect(() => {
    if (user?.id) {
      getCityDropdown({ id: user.id });
    }
    getDepartmentDropdown({});
    getPaymentTermsDropdown({});
    getCustomerTypeDropdown({});
  }, [user?.id]);

  const updateBasicField = (key, value) => {
    setBasicInfo(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!basicInfo.hospitalName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Hospital Name is required',
      });
      return;
    }
    if (!basicInfo.city) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a City',
      });
      return;
    }
    if (!basicInfo.customersType) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a Customers Type',
      });
      return;
    }
    if (!basicInfo.noOfBeds.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'No. of Beds is required',
      });
      return;
    }
    if (!basicInfo.segment) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a Segment (Department)',
      });
      return;
    }
    if (!basicInfo.paymentTerms) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select Payment Terms',
      });
      return;
    }

    try {
      const payload = {
        user_id: user?.id,
        name: basicInfo.hospitalName,
        address: basicInfo.address,
        city: basicInfo.city,
        cust_type: basicInfo.customersType,
        beds: basicInfo.noOfBeds,
        payment_terms: basicInfo.paymentTerms,
        segment: basicInfo.segment,
      };

      const res = await addHospital(payload).unwrap();
      if (String(res.status) === 'true') {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: res.message || 'Hospital added successfully',
        });
        if (route.params?.onSuccess) {
          route.params.onSuccess();
        }
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: res.message || 'Failed to add hospital',
        });
      }
    } catch (err) {
      console.error('Save Hospital Error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred while saving the hospital.',
      });
    }
  };

  const renderInput = (
    label,
    value,
    onChangeText,
    keyboardType = 'default',
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
        ]}
        placeholder={`Enter ${label}`}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );

  const renderDropdown = (
    label,
    data,
    value,
    onChange,
    labelField = 'label',
    valueField = 'value',
    isLoading = false,
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      {isLoading ? (
        <View style={styles.dropdownLoader}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <Dropdown
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
          placeholderStyle={[
            styles.placeholderStyle,
            { color: theme.colors.textSecondary },
          ]}
          selectedTextStyle={[
            styles.selectedTextStyle,
            { color: theme.colors.text },
          ]}
          itemTextStyle={[styles.itemTextStyle, { color: theme.colors.text }]}
          containerStyle={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
          data={data || []}
          maxHeight={300}
          labelField={labelField}
          valueField={valueField}
          placeholder={`Select ${label}`}
          value={value}
          onChange={item => onChange(item[valueField])}
        />
      )}
    </View>
  );

  // Tab Contents
  const renderBasicInfo = () => (
    <View style={styles.formContent}>
      {renderInput('Hospital Name', basicInfo.hospitalName, text =>
        updateBasicField('hospitalName', text),
      )}
      {renderInput('Address', basicInfo.address, text =>
        updateBasicField('address', text),
      )}
      {renderDropdown(
        'City',
        cityRes?.data || [],
        basicInfo.city,
        val => updateBasicField('city', val),
        'cityname',
        'id',
        cityLoading,
      )}
      {renderDropdown(
        'Customers Type',
        custTypeRes?.data || [],
        basicInfo.customersType,
        val => updateBasicField('customersType', val),
        'description',
        'sales_code',
        custTypeLoading,
      )}
      {renderInput(
        'No. of Beds',
        basicInfo.noOfBeds,
        text => updateBasicField('noOfBeds', text),
        'numeric',
      )}
      {renderDropdown(
        'Segment (Department)',
        deptRes?.data || [],
        basicInfo.segment,
        val => updateBasicField('segment', val),
        'description',
        'sales_code',
        deptLoading,
      )}
      {renderDropdown(
        'Payment Terms',
        paymentRes?.data || [],
        basicInfo.paymentTerms,
        val => updateBasicField('paymentTerms', val),
        'terms',
        'terms_indicator',
        paymentLoading,
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderBasicInfo()}

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: theme.colors.primary },
            isSubmitting && { opacity: 0.7 },
          ]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Hospital</Text>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
    dropdownLoader: {
      height: 50,
      borderWidth: 1,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: theme.colors.border,
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
