import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
  PermissionsAndroid,
} from 'react-native';
import { CustomDatePicker, SearchableDropdown } from '@components/common';
import { useTheme } from '@config/useTheme';
import {
  useGetDebtorsMasterQuery,
  usePostPaymentMutation,
} from '@api/portalApi';
import { useGetBankNamesMutation } from '@api/baseApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@store/slices/authSlice';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SalesPaymentScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const user = useSelector(selectCurrentUser);
  const { company } = useSelector(state => state.auth);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [orderNo, setOrderNo] = useState(route?.params?.order_no || '');
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [chequeNo, setChequeNo] = useState('');
  const [comments, setComments] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [date, setDate] = useState(new Date());
  const [banks, setBanks] = useState([]);

  const { data: debtorsRes, isLoading: debtorsLoading } =
    useGetDebtorsMasterQuery(
      {
        company: user?.company_user_code || company,
        user_id: user?.company_user_id || user?.id,
      },
      { skip: !user?.company_user_code && !company },
    );

  const [getBankNames, { isLoading: banksLoading }] = useGetBankNamesMutation();
  const [postPayment, { isLoading: isPosting }] = usePostPaymentMutation();

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    if (route?.params?.customer && debtorsList.length > 0) {
      const found = debtorsList.find(
        d =>
          d.name?.toLowerCase() === route.params.customer.name?.toLowerCase() ||
          d.person_id === route.params.customer.person_id,
      );
      if (found) {
        setSelectedCustomer(found);
      }
    }
  }, [route?.params?.customer, debtorsList]);

  const fetchBanks = async () => {
    try {
      const res = await getBankNames({
        company: user?.company_user_code || company,
      }).unwrap();
      if (res.status === 'true') {
        setBanks(res.data || []);
      }
    } catch (error) {
      console.log('Error fetching banks:', error);
    }
  };

  const debtorsList = React.useMemo(() => {
    if (!debtorsRes) return [];
    let parsedData = debtorsRes;
    if (typeof debtorsRes === 'string') {
      try {
        const match = debtorsRes.match(/(\{|\[)[\s\S]*(\}|\])/);
        if (match) {
          parsedData = JSON.parse(match[0]);
        } else {
          parsedData = JSON.parse(debtorsRes);
        }
      } catch (e) {
        console.log('Dropdown Parse Error:', e);
        return [];
      }
    }

    if (parsedData && Array.isArray(parsedData.data)) {
      return parsedData.data;
    } else if (Array.isArray(parsedData)) {
      return parsedData;
    }
    return [];
  }, [debtorsRes]);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const formatDisplayDate = d => {
    if (!d) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatApiDate = d => {
    if (!d) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const handlePickImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.7,
      selectionLimit: 1,
    };
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Toast.show({ type: 'error', text1: 'Error selecting image' });
      } else if (response.assets && response.assets.length > 0) {
        setAttachment(response.assets[0]);
      }
    });
  };

  const handleCaptureImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.7,
      saveToPhotos: false,
    };

    launchCamera(options, response => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        console.log(
          'Camera Error: ',
          response.errorMessage || response.errorCode,
        );
        Toast.show({
          type: 'error',
          text1: response.errorMessage || 'Error opening camera',
        });
      } else if (response.assets && response.assets.length > 0) {
        setAttachment(response.assets[0]);
      }
    });
  };

  const handleDone = async () => {
    if (!selectedCustomer) {
      Toast.show({ type: 'error', text1: 'Please select a customer' });
      return;
    }
    if (!selectedBank) {
      Toast.show({ type: 'error', text1: 'Please select a bank' });
      return;
    }
    if (!chequeNo) {
      Toast.show({ type: 'error', text1: 'Please enter cheque no' });
      return;
    }
    if (!amount) {
      Toast.show({ type: 'error', text1: 'Please enter amount' });
      return;
    }

    try {
      const payload = {
        company: user?.company_user_code,
        type: '2',
        comments: comments,
        trans_date: formatApiDate(new Date()),
        amount: amount,
        cheque: chequeNo,
        cheque_date: formatApiDate(date),
        bank_act: selectedBank.id,
        gl_detail: [
          {
            type: '2',
            account_code: selectedCustomer.account || '',
            amount: amount,
            memo_: '',
          },
        ],
        filename: attachment,
        user_id: user?.company_user_id,
        person_type_id: '2',
        person_id: selectedCustomer.person_id,
        order_no: orderNo || '',
      };

      const res = await postPayment(payload).unwrap();
      if (res.status === true) {
        Toast.show({ type: 'success', text1: 'Payment Posted Successfully' });
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: res.message || 'Failed to post payment',
        });
      }
    } catch (error) {
      console.log('Payment Post Error:', error);
      Toast.show({ type: 'error', text1: 'Something went wrong' });
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <SearchableDropdown
            label="Customer"
            placeholder="Select Customer"
            data={debtorsList}
            selectedId={selectedCustomer?.person_id}
            onSelect={setSelectedCustomer}
            isLoading={debtorsLoading}
            idKey="person_id"
            labelKey="name"
            iconName="person-outline"
          />

          {orderNo ? (
            <View
              style={[
                styles.inputWrapper,
                {
                  marginTop: 15,
                  backgroundColor: theme.colors.surface,
                  shadowColor: theme.colors.text,
                  opacity: 0.8,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.colors.textSecondary }]}
                value={`Order No: ${orderNo}`}
                editable={false}
              />
            </View>
          ) : null}

          <View style={{ height: 20 }} />

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Payment Details
          </Text>

          <View style={styles.formContainer}>
            <SearchableDropdown
              label="Bank Name"
              placeholder="Select Bank"
              data={banks}
              selectedId={selectedBank?.id}
              onSelect={setSelectedBank}
              isLoading={banksLoading}
              idKey="id"
              labelKey="bank_name"
              iconName="business-outline"
            />

            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.colors.surface,
                  shadowColor: theme.colors.text,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="Cheque Slash / Slip No"
                placeholderTextColor={theme.colors.textSecondary}
                value={chequeNo}
                onChangeText={setChequeNo}
              />
            </View>

            <View style={styles.rowInputs}>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    flex: 1,
                    marginRight: 10,
                    backgroundColor: theme.colors.surface,
                    shadowColor: theme.colors.text,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Amount"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    flex: 1,
                    backgroundColor: theme.colors.surface,
                    shadowColor: theme.colors.text,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.input, styles.datePickerBtn]}
                  onPress={() => setDatePickerVisibility(true)}
                >
                  <Text style={[styles.dateText, { color: theme.colors.text }]}>
                    {formatDisplayDate(date)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.colors.surface,
                  shadowColor: theme.colors.text,
                  height: 100,
                  paddingTop: 10,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.colors.text, height: 80 }]}
                placeholder="Comments"
                placeholderTextColor={theme.colors.textSecondary}
                value={comments}
                onChangeText={setComments}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.uploadSection}>
              <Text
                style={[styles.label, { color: theme.colors.textSecondary }]}
              >
                ATTACHMENT
              </Text>
              <View style={styles.uploadButtons}>
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={handleCaptureImage}
                >
                  <Ionicons
                    name="camera"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.uploadBtnText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Camera
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.uploadBtn}
                  onPress={handlePickImage}
                >
                  <Ionicons
                    name="images"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.uploadBtnText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Gallery
                  </Text>
                </TouchableOpacity>
              </View>
              {attachment && (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: attachment.uri }}
                    style={styles.previewImage}
                  />
                  <TouchableOpacity
                    style={styles.removeImage}
                    onPress={() => setAttachment(null)}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={theme.colors.error}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <View
            style={[styles.separator, { backgroundColor: theme.colors.border }]}
          />

          <TouchableOpacity
            style={[
              styles.doneBtn,
              {
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.primary,
                opacity: isPosting ? 0.7 : 1,
              },
            ]}
            onPress={handleDone}
            disabled={isPosting}
          >
            {isPosting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.doneBtnText}>Post Payment</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomDatePicker
        visible={isDatePickerVisible}
        onClose={() => setDatePickerVisibility(false)}
        onSelect={d => {
          setDate(d);
          setDatePickerVisibility(false);
        }}
      />
    </View>
  );
};

export default SalesPaymentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 25,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
  },
  formContainer: {
    gap: 15,
  },
  inputWrapper: {
    borderRadius: 30,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  input: {
    height: 50,
    paddingHorizontal: 20,
    fontSize: 14,
    fontWeight: '500',
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerBtn: {
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginVertical: 35,
  },
  doneBtn: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  uploadSection: {
    marginTop: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  uploadBtn: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  uploadBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewContainer: {
    marginTop: 15,
    position: 'relative',
    width: 100,
    height: 100,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImage: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
});
