import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Dropdown } from 'react-native-element-dropdown';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '@config/useTheme';
import { CustomButton, CustomDatePicker } from '@components/common';
import { useGetCityDropdownMutation } from '@api/baseApi';
import {
  useGetOutstationDataMutation,
  usePostOutstationExpenseClaimMutation,
} from '@api/hcmApi';

const parseDate = dateStr => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
};

const formatToYYYYMMDD = date => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseDate(date) : date;
  if (isNaN(d.getTime())) return String(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const OutstationExpenseScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const onRefresh = route?.params?.onRefresh;
  const userData = useSelector(state => state.auth.user);
  const userId = userData?.id || userData?.user_id || '';
  const employeeId =
    userData?.employee_id || userData?.emp_code || userData?.id || '';

  const [cities, setCities] = useState([]);
  const [fromCity, setFromCity] = useState(null);
  const [toCity, setToCity] = useState(null);
  const [leavingDate, setLeavingDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [fuel, setFuel] = useState('');
  const [nightStay, setNightStay] = useState('');
  const [nightStayDetail, setNightStayDetail] = useState('');
  const [otherExpense, setOtherExpense] = useState('');
  const [otherDetail, setOtherDetail] = useState('');
  const [receipt, setReceipt] = useState(null);

  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Date picker state: { visible: boolean, field: 'leavingDate' | 'returnDate' }
  const [datePickerState, setDatePickerState] = useState({
    visible: false,
    field: null,
  });

  // RTK Mutations
  const [getCityDropdown, { isLoading: citiesLoading }] =
    useGetCityDropdownMutation();
  const [getOutstationData] = useGetOutstationDataMutation();
  const [postOutstationExpenseClaim, { isLoading: submitting }] =
    usePostOutstationExpenseClaimMutation();

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const res = await getCityDropdown({
        id: userId,
        role_id: userData?.role_id,
      }).unwrap();

      if (res?.status === 'true' || res?.status === true) {
        const mapped = (res.data || []).map((item, index) => {
          const id =
            item.id !== undefined && item.id !== null
              ? item.id
              : item.city_id !== undefined && item.city_id !== null
              ? item.city_id
              : index;
          const description =
            item.description || item.cityname || item.name || '';
          return {
            id: String(id),
            description: String(description),
          };
        });
        setCities(mapped);
      }
    } catch (e) {
      console.log('Error loading city dropdown:', e);
    }
  };

  const handleCityChange = async (field, value) => {
    let nextFromCity = fromCity;
    let nextToCity = toCity;

    if (field === 'from_city') {
      setFromCity(value);
      nextFromCity = value;
    } else if (field === 'to_city') {
      setToCity(value);
      nextToCity = value;
    }

    if (nextFromCity && nextToCity) {
      setIsLoadingRates(true);
      try {
        const payload = {
          company: 'ANS',
          from_city: String(nextFromCity),
          to_city: String(nextToCity),
          user_id: String(userId),
        };
        console.log('Fetching outstation rates payload:', payload);

        const res = await getOutstationData(payload).unwrap();
        console.log('Outstation rates response:', res);

        if (res?.status === 'true' || res?.status === true) {
          const rateData = Array.isArray(res.data) ? res.data[0] : res.data;
          if (rateData) {
            if (rateData.fuel !== undefined && rateData.fuel !== null) {
              setFuel(String(rateData.fuel));
            }
            if (
              rateData.out_allowance !== undefined &&
              rateData.out_allowance !== null
            ) {
              setOtherExpense(String(rateData.out_allowance));
            }
            if (
              rateData.overnight !== undefined &&
              rateData.overnight !== null
            ) {
              setNightStay(String(rateData.overnight));
            }
          }
        }
      } catch (err) {
        console.log('Error fetching outstation data:', err);
      } finally {
        setIsLoadingRates(false);
      }
    }
  };

  const handlePickReceipt = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
      if (response.didCancel) return;
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setReceipt({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || `receipt_${Date.now()}.jpg`,
        });
      }
    });
  };

  const openDatePicker = field => {
    setDatePickerState({
      visible: true,
      field: field,
    });
  };

  const handleDateSelect = selectedDate => {
    const formatted = formatToYYYYMMDD(selectedDate);
    if (datePickerState.field === 'leavingDate') {
      setLeavingDate(formatted);
    } else if (datePickerState.field === 'returnDate') {
      setReturnDate(formatted);
    }
    setDatePickerState({ visible: false, field: null });
  };

  const handleSubmit = async () => {
    if (!fromCity) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select From City',
      });
      return;
    }
    if (!toCity) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select To City',
      });
      return;
    }
    if (!leavingDate) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select Leaving Date',
      });
      return;
    }
    if (!returnDate) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select Return Date',
      });
      return;
    }

    try {
      const expense_detail = [];

      const parsedNightStay =
        parseFloat(String(nightStay).replace(/,/g, '')) || 0;
      if (parsedNightStay > 0 || nightStayDetail.trim()) {
        expense_detail.push({
          amount: parsedNightStay,
          line_memo: nightStayDetail.trim() || 'Night Stay',
        });
      }

      const parsedOtherExpense =
        parseFloat(String(otherExpense).replace(/,/g, '')) || 0;
      if (parsedOtherExpense > 0 || otherDetail.trim()) {
        expense_detail.push({
          amount: parsedOtherExpense,
          line_memo: otherDetail.trim() || 'Other Expense',
        });
      }

      const payload = {
        company: 'ANS',
        user_id: String(userId),
        employee_id: String(employeeId),
        from_city: String(fromCity),
        to_city: String(toCity),
        leave_date: String(leavingDate),
        return_date: String(returnDate),
        fuel: String(fuel || '0'),
        expense_detail: JSON.stringify(expense_detail),
        filename: receipt ? receipt : null,
      };

      console.log('Outstation Visit Request Payload:', payload);

      const response = await postOutstationExpenseClaim(payload).unwrap();
      console.log('Outstation Visit Response:', response);

      if (
        response?.status === true ||
        response?.status === 'true' ||
        response?.success === true
      ) {
        Toast.show({
          type: 'success',
          text1: 'Claim Submitted',
          text2: 'Outstation Visit claim submitted successfully.',
        });

        if (onRefresh) {
          onRefresh();
        }

        setTimeout(() => {
          navigation.goBack();
        }, 1200);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Submission Failed',
          text2: response?.message || 'Server rejected submission.',
        });
      }
    } catch (error) {
      console.log('Error submitting outstation claim:', error);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error?.message || 'Failed to submit outstation visit claim.',
      });
    }
  };

  const currentPickedDate =
    datePickerState.field === 'leavingDate'
      ? parseDate(leavingDate)
      : datePickerState.field === 'returnDate'
      ? parseDate(returnDate)
      : new Date();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tripCard}>
          {/* Card Header & Rate Loading Indicator */}
          <View style={styles.tripCardHeader}>
            <View style={styles.tripBadge}>
              <Icon
                name="navigate-outline"
                size={16}
                color="#1E293B"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.tripBadgeText}>TRIP DETAILS</Text>
            </View>
            {isLoadingRates && (
              <View style={styles.loadingRatesBadge}>
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.loadingRatesText,
                    { color: theme.colors.primary },
                  ]}
                >
                  Loading Rates...
                </Text>
              </View>
            )}
          </View>

          {/* From City & To City Dropdowns in 1 Row */}
          <View style={styles.dropdownRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.fieldLabel}>
                From City <Text style={styles.required}>*</Text>
              </Text>
              <Dropdown
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
                data={cities}
                search
                searchPlaceholder="Search city..."
                labelField="description"
                valueField="id"
                value={fromCity}
                placeholder={citiesLoading ? 'Loading...' : 'Select From City'}
                placeholderStyle={[
                  styles.dropdownPlaceholder,
                  { color: theme.colors.textSecondary },
                ]}
                selectedTextStyle={[
                  styles.dropdownSelectedText,
                  { color: theme.colors.text },
                ]}
                itemTextStyle={[
                  styles.dropdownItemText,
                  { color: theme.colors.text },
                ]}
                containerStyle={[
                  styles.dropdownContainer,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onChange={item => handleCityChange('from_city', item.id)}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.fieldLabel}>
                To City <Text style={styles.required}>*</Text>
              </Text>
              <Dropdown
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
                data={cities}
                search
                searchPlaceholder="Search city..."
                labelField="description"
                valueField="id"
                value={toCity}
                placeholder={citiesLoading ? 'Loading...' : 'Select To City'}
                placeholderStyle={[
                  styles.dropdownPlaceholder,
                  { color: theme.colors.textSecondary },
                ]}
                selectedTextStyle={[
                  styles.dropdownSelectedText,
                  { color: theme.colors.text },
                ]}
                itemTextStyle={[
                  styles.dropdownItemText,
                  { color: theme.colors.text },
                ]}
                containerStyle={[
                  styles.dropdownContainer,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onChange={item => handleCityChange('to_city', item.id)}
              />
            </View>
          </View>

          {/* Leaving & Return Dates Row */}
          <View style={styles.dateRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.fieldLabel}>
                Leaving Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => openDatePicker('leavingDate')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dateText,
                    !leavingDate && {
                      color: theme.colors.textSecondary,
                    },
                  ]}
                >
                  {leavingDate ? leavingDate : 'Select Date'}
                </Text>
                <Icon
                  name="calendar-outline"
                  size={18}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.fieldLabel}>
                Return Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => openDatePicker('returnDate')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dateText,
                    !returnDate && {
                      color: theme.colors.textSecondary,
                    },
                  ]}
                >
                  {returnDate ? returnDate : 'Select Date'}
                </Text>
                <Icon
                  name="calendar-outline"
                  size={18}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Fuel Allowance (Not Editable - System Rate) */}
          <View style={styles.inputRowWithTag}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Fuel Allowance (Ltrs)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.readOnlyInput,
                  { color: theme.colors.text },
                ]}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textSecondary}
                value={fuel}
                editable={false}
              />
            </View>
            <View style={styles.systemTag}>
              <Text style={styles.tagText}>[System]</Text>
            </View>
          </View>

          {/* Night Stay (Editable) & Night Stay Detail (Editable) */}
          <View style={styles.detailInputRow}>
            <View style={{ width: 120, marginRight: 10 }}>
              <Text style={styles.fieldLabel}>Night Stay</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                value={nightStay}
                onChangeText={setNightStay}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Night Stay Detail</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Night stay detail..."
                placeholderTextColor={theme.colors.textSecondary}
                value={nightStayDetail}
                onChangeText={setNightStayDetail}
              />
            </View>
          </View>

          {/* Other Expense (Editable) & Other Expense Detail (Editable) */}
          <View style={styles.detailInputRow}>
            <View style={{ width: 120, marginRight: 10 }}>
              <Text style={styles.fieldLabel}>Other Expense</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                value={otherExpense}
                onChangeText={setOtherExpense}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Other Expense Detail</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Other expense detail..."
                placeholderTextColor={theme.colors.textSecondary}
                value={otherDetail}
                onChangeText={setOtherDetail}
              />
            </View>
          </View>

          {/* Upload Receipt Section */}
          <View style={{ marginTop: 14 }}>
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={handlePickReceipt}
              activeOpacity={0.8}
            >
              <Icon
                name="cloud-upload-outline"
                size={20}
                color="#854D0E"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.uploadBtnText}>
                {receipt ? 'Change Receipt Image' : 'Upload Receipt (Optional)'}
              </Text>
            </TouchableOpacity>

            {receipt && (
              <View style={styles.receiptPreviewRow}>
                <Image
                  source={{ uri: receipt.uri }}
                  style={styles.receiptImage}
                />
                <TouchableOpacity
                  onPress={() => setReceipt(null)}
                  style={styles.removeReceiptBtn}
                >
                  <Icon name="close-circle" size={22} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* SUBMIT BUTTON */}
        <View style={{ marginTop: 8, marginBottom: 30 }}>
          <CustomButton
            title="Submit Outstation Visit Request"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
          />
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <CustomDatePicker
        visible={datePickerState.visible}
        onClose={() => setDatePickerState({ visible: false, field: null })}
        onSelect={handleDateSelect}
        selectedDate={currentPickedDate}
        title="Select Date"
      />
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
      paddingBottom: 40,
    },
    tripCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      elevation: 2,
    },
    tripCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom: 8,
    },
    tripBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E2E8F0',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    tripBadgeText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#1E293B',
    },
    loadingRatesBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 4,
    },
    loadingRatesText: {
      fontSize: 12,
      fontWeight: '600',
    },
    dropdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    dropdown: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      height: 44,
    },
    dropdownPlaceholder: {
      fontSize: 13,
    },
    dropdownSelectedText: {
      fontSize: 13,
      fontWeight: '600',
    },
    dropdownItemText: {
      fontSize: 13,
    },
    dropdownContainer: {
      borderRadius: 8,
      borderWidth: 1,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 4,
      marginTop: 8,
    },
    required: {
      color: theme.colors.error || '#EF4444',
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    readOnlyInput: {
      opacity: 0.8,
      backgroundColor: 'rgba(0,0,0,0.03)',
      fontWeight: '700',
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    dateSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 10,
      backgroundColor: theme.colors.background,
      height: 44,
    },
    dateText: {
      fontSize: 13,
      color: theme.colors.text,
      fontWeight: '500',
    },
    inputRowWithTag: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 4,
    },
    systemTag: {
      marginLeft: 10,
      marginBottom: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    tagText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    detailInputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 4,
    },
    uploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#CA8A04',
      borderStyle: 'dashed',
      borderRadius: 8,
      paddingVertical: 10,
      backgroundColor: '#FEF9C3',
    },
    uploadBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#854D0E',
    },
    receiptPreviewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
    },
    receiptImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 10,
    },
    removeReceiptBtn: {
      padding: 4,
    },
  });

export default OutstationExpenseScreen;
