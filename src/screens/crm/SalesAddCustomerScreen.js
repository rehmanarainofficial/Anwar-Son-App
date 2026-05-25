import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import Toast from 'react-native-toast-message';
import { useTheme } from '@config/useTheme';

const SalesAddCustomerScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  
  const [CustomerName, setCustomerName] = useState('');
  const [TradeName, setTradeName] = useState('');
  const [ContactNo, setContactNo] = useState('');
  const [Address, setAddress] = useState('');
  const [NTN, setNTN] = useState('');
  const [CNIC, setCNIC] = useState('');
  const [Province, setProvince] = useState('');

  const [POCName, setPOCName] = useState('');
  const [POCContact, setPOCContact] = useState('');
  const [POCEmail, setPOCEmail] = useState('');

  // Dropdown states with dummy data as requested (No API calls)
  const [taxOptions, setTaxOptions] = useState([
    { label: 'Exempt', value: 1 },
    { label: 'Standard Rate (17%)', value: 2 },
    { label: 'Zero Rated (0%)', value: 3 },
  ]);
  const [salesmanOptions, setSalesmanOptions] = useState([
    { label: 'Ali Raza', value: 'S001' },
    { label: 'Umer Farooq', value: 'S002' },
    { label: 'Hassan Tariq', value: 'S003' },
  ]);
  const [taxValue, setTaxValue] = useState(null);
  const [salesmanValue, setSalesmanValue] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const provinceOptions = [
    { label: 'Sindh', value: 8 },
    { label: 'Punjab', value: 7 },
    { label: 'Balochistan', value: 2 },
    { label: 'Khyber Pakhtunkhwa', value: 6 },
    { label: 'Gilgit-Baltistan', value: 9 },
    { label: 'Azad Jammu and Kashmir', value: 5 },
    { label: 'Capital Territory', value: 1 },
  ];

  // Animated entrance values
  const animValues = useRef([]).current;
  const inputsCount = 13;
  if (animValues.length === 0) {
    for (let i = 0; i < inputsCount; i++) {
      animValues.push({
        translateY: new Animated.Value(20),
        opacity: new Animated.Value(0),
      });
    }
  }

  useEffect(() => {
    // Staggered entrance animation
    const anims = animValues.map((av, idx) =>
      Animated.parallel([
        Animated.timing(av.translateY, {
          toValue: 0,
          duration: 450,
          delay: idx * 60,
          useNativeDriver: true,
        }),
        Animated.timing(av.opacity, {
          toValue: 1,
          duration: 450,
          delay: idx * 60,
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.stagger(60, anims).start();
  }, []);

  const validate = () => {
    if (!TradeName || TradeName.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Trade Name is required',
      });
      return false;
    }
    if (!taxValue) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Tax Group is required',
      });
      return false;
    }
    if (!salesmanValue) {
      Toast.show({
        type: 'error',
        text1: 'Validation',
        text2: 'Salesperson is required',
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      setSubmitting(false);
      Toast.show({
        type: 'success',
        text1: 'Customer added successfully',
      });

      if (route.params?.onSuccess) {
        route.params.onSuccess();
      }

      navigation.goBack();
    }, 1500);
  };

  const renderInputAnimated = (
    index,
    placeholder,
    value,
    setValue,
    keyboardType,
    fieldName,
  ) => (
    <Animated.View
      style={[
        styles.glassInput,
        {
          transform: [{ translateY: animValues[index].translateY }],
          opacity: animValues[index].opacity,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}>
      <TextInput
        style={[styles.textInput, { color: theme.colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={txt => setValue(txt)}
        keyboardType={keyboardType || 'default'}
        selectionColor={theme.colors.primary}
        autoCapitalize="words"
      />
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header is handled by AppNavigator */}
      
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 20 }}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={{ gap: 18 }}>
          <Text style={[styles.sectionHeading, { color: theme.colors.text }]}>Customer Information</Text>

          {renderInputAnimated(0, 'Business Name', CustomerName, setCustomerName)}
          {renderInputAnimated(1, 'Trade Name *', TradeName, setTradeName)}
          {renderInputAnimated(2, 'Contact No', ContactNo, setContactNo, 'phone-pad')}
          {renderInputAnimated(3, 'Address', Address, setAddress)}
          {renderInputAnimated(4, 'NTN', NTN, setNTN)}
          {renderInputAnimated(5, 'CNIC', CNIC, setCNIC)}

          <Animated.View
            style={{
              transform: [{ translateY: animValues[6].translateY }],
              opacity: animValues[6].opacity,
            }}>
            <Dropdown
              style={[styles.dropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              data={taxOptions}
              search
              labelField="label"
              valueField="value"
              placeholder="Select Tax Group *"
              placeholderStyle={{ color: theme.colors.textSecondary }}
              searchPlaceholder="Search..."
              value={taxValue}
              onChange={item => setTaxValue(item.value)}
              selectedTextProps={{ numberOfLines: 1 }}
              selectedTextStyle={{ color: theme.colors.text }}
              itemTextStyle={{ color: theme.colors.text }}
              containerStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
              activeColor={theme.colors.border}
            />
          </Animated.View>

          <Animated.View
            style={{
              transform: [{ translateY: animValues[7].translateY }],
              opacity: animValues[7].opacity,
            }}>
            <Dropdown
              style={[styles.dropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              data={salesmanOptions}
              search
              labelField="label"
              valueField="value"
              placeholder="Select Salesperson *"
              placeholderStyle={{ color: theme.colors.textSecondary }}
              searchPlaceholder="Search..."
              value={salesmanValue}
              onChange={item => setSalesmanValue(item.value)}
              selectedTextStyle={{ color: theme.colors.text }}
              itemTextStyle={{ color: theme.colors.text }}
              containerStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
              activeColor={theme.colors.border}
            />
          </Animated.View>

          <Animated.View
            style={{
              transform: [{ translateY: animValues[8].translateY }],
              opacity: animValues[8].opacity,
            }}>
            <Dropdown
              style={[styles.dropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              data={provinceOptions}
              labelField="label"
              valueField="value"
              placeholder="Select Province"
              placeholderStyle={{ color: theme.colors.textSecondary }}
              value={Province}
              onChange={item => setProvince(item.value)}
              selectedTextStyle={{ color: theme.colors.text }}
              itemTextStyle={{ color: theme.colors.text }}
              containerStyle={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
              activeColor={theme.colors.border}
            />
          </Animated.View>
        </Animated.View>

        <Animated.View style={{ gap: 12 }}>
          <Text style={[styles.sectionHeading, { color: theme.colors.text }]}>POC Detail</Text>
          {renderInputAnimated(9, 'Name', POCName, setPOCName)}
          {renderInputAnimated(10, 'Contact No', POCContact, setPOCContact, 'phone-pad')}
          {renderInputAnimated(11, 'Email', POCEmail, setPOCEmail, 'email-address')}
        </Animated.View>

        <Animated.View
          style={{
            transform: [{ translateY: animValues[12].translateY }],
            opacity: animValues[12].opacity,
          }}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: theme.colors.primary },
              submitting && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
                Submit
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default SalesAddCustomerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  glassInput: {
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
  },
  textInput: {
    height: 56,
    fontSize: 16,
  },
  dropdown: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  submitBtn: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
});
