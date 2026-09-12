import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Dropdown } from 'react-native-element-dropdown';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@config/useTheme';
import Toast from 'react-native-toast-message';
import { DimensionDropdown, CustomDatePicker } from '@components/common';
import {
  useGetClaimExpenseAccountQuery,
  usePostServiceExpenseClaimMutation,
} from '@api/hcmApi';

export default function CRMMonthlyExpenseScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const userData = useSelector(state => state.auth.user);
  const userId = userData?.id || userData?.user_id;
  const employeeId = userData?.employee_id || userData?.emp_code || userData?.id;
  const onRefresh = route?.params?.onRefresh;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Monthly Expense Request',
    });
  }, [navigation]);

  // Selected Dimension
  const [selectedDimensionId, setSelectedDimensionId] = useState(0);

  // Date Picker State
  const [showItemDatePicker, setShowItemDatePicker] = useState(false);

  // Expense Item Form State
  const [itemDate, setItemDate] = useState(new Date());
  const [expenseCategory, setExpenseCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Items List State
  const [items, setItems] = useState([]);

  // Image State
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // RTK Queries & Mutations
  const { data: accountsData, isLoading: accountsLoading } =
    useGetClaimExpenseAccountQuery();
  const [postServiceExpenseClaim, { isLoading: submitting }] =
    usePostServiceExpenseClaimMutation();

  const rawAccounts = Array.isArray(accountsData)
    ? accountsData
    : Array.isArray(accountsData?.data)
    ? accountsData.data
    : [];

  const accountTitles = rawAccounts
    .filter(account => account.inactive === '0' || account.inactive === 0 || account.inactive === false)
    .map(account => ({
      label: (account.account_name || '').replace(/&amp;/g, '&'),
      value: account.account_code,
      account_code: account.account_code,
      account_name: (account.account_name || '').replace(/&amp;/g, '&'),
    }));

  const formatNumber = num => {
    if (!num) return '0';
    const parsed = parseFloat(num);
    return isNaN(parsed)
      ? '0'
      : parsed.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatDate = date => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day} / ${month} / ${year}`;
  };

  const formatDateForApi = date => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    };

    setImageLoading(true);

    launchImageLibrary(options, response => {
      setImageLoading(false);

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Toast.show({ type: 'error', text1: 'Error selecting image' });
      } else if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        setSelectedImage(imageUri);
        setShowImageModal(true);
      }
    });
  };

  const handleCameraCapture = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'App needs camera permission to take photos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Toast.show({ type: 'error', text1: 'Camera permission denied' });
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
      saveToPhotos: false,
    };

    setImageLoading(true);

    launchCamera(options, response => {
      setImageLoading(false);

      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.error) {
        console.log('Camera Error: ', response.error);
        Toast.show({ type: 'error', text1: 'Error capturing image' });
      } else if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        setSelectedImage(imageUri);
        setShowImageModal(true);
      }
    });
  };

  const handleAddItem = () => {
    if (!expenseCategory || !amount) {
      Toast.show({ type: 'error', text1: 'Please fill required fields (Category & Amount)' });
      return;
    }

    const selectedAccount = accountTitles.find(
      acc => acc.value === expenseCategory,
    );

    setItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        srNo: prev.length + 1,
        date: new Date(itemDate),
        expenseCategory: expenseCategory,
        expenseCategoryLabel: selectedAccount?.account_name || '',
        accountCode: selectedAccount?.account_code || '',
        description: description,
        amount: amount,
      },
    ]);

    // Reset form fields
    setExpenseCategory(null);
    setDescription('');
    setAmount('');
    setItemDate(new Date());
  };

  const handleRemoveItem = id => {
    setItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      return filtered.map((item, index) => ({ ...item, srNo: index + 1 }));
    });
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Please add at least one expense item',
      });
      return;
    }

    try {
      const totalAmount = items.reduce(
        (sum, item) => sum + parseFloat(item.amount || 0),
        0,
      );

      const expenseDetail = items.map(item => ({
        account_code: item.accountCode,
        line_date: formatDateForApi(item.date),
        amount: parseFloat(item.amount),
        line_memo: item.description || '',
      }));

      const formData = new FormData();
      const firstItemDate = items[0]?.date ? new Date(items[0].date) : new Date();
      formData.append('company', 'ANS');
      formData.append('trans_date', formatDateForApi(firstItemDate));
      formData.append('expense_type', '1');
      formData.append('amount', totalAmount.toString());
      formData.append('user_id', userId ? String(userId) : '');
      formData.append('expense_detail', JSON.stringify(expenseDetail));
      formData.append('comments', '');
      formData.append('employee_id', String(userData?.employee_id || employeeId || ''));
      formData.append('dimension_id', selectedDimensionId ? String(selectedDimensionId) : '0');

      if (selectedImage) {
        const imageFile = {
          uri: selectedImage,
          type: 'image/jpeg',
          name: `expense_${Date.now()}.jpg`,
        };
        formData.append('filename', imageFile);
      }

      const response = await postServiceExpenseClaim(formData).unwrap();

      if (response.status === true || response.status === 'true') {
        Toast.show({
          type: 'success',
          text1: 'Monthly expense request submitted successfully',
        });

        // Reset all fields
        setItems([]);
        setExpenseCategory(null);
        setDescription('');
        setAmount('');
        setItemDate(new Date());
        setSelectedImage(null);

        if (onRefresh) {
          onRefresh();
        }
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: response.message || 'Server rejected submission',
        });
      }
    } catch (error) {
      console.log('Error submitting expense claim:', error);
      Toast.show({ type: 'error', text1: 'Submission failed' });
    }
  };

  const calculateTotal = () => {
    return formatNumber(
      items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0),
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 16 }}>
          <DimensionDropdown
            onDimensionSelect={dimensionId => {
              setSelectedDimensionId(dimensionId);
            }}
          />
        </View>

        {/* Expense Items Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text
            style={[
              styles.cardTitle,
              {
                color: theme.colors.text,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            Expense Items
          </Text>

          {/* Direct Input Fields */}
          {/* Date Field */}
          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.colors.text }]}>
              Date:
            </Text>
            <TouchableOpacity
              style={[
                styles.formDateField,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setShowItemDatePicker(true)}
            >
              <Text
                style={[styles.formDateText, { color: theme.colors.text }]}
              >
                {formatDate(itemDate)}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Expense Category Dropdown */}
          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.colors.text }]}>
              Expense Category:
            </Text>
            <Dropdown
              style={[
                styles.formDropdown,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
              data={accountTitles}
              search
              searchPlaceholder="Search account..."
              labelField="account_name"
              valueField="account_code"
              value={expenseCategory}
              onChange={item => setExpenseCategory(item.account_code)}
              placeholder={accountsLoading ? 'Loading...' : 'Select Category'}
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
              renderLeftIcon={() =>
                accountsLoading && (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                    style={{ marginRight: 8 }}
                  />
                )
              }
            />
          </View>

          {/* Description Field */}
          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.colors.text }]}>
              Description:
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Enter description..."
              placeholderTextColor={theme.colors.textSecondary}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Amount Field */}
          <View style={styles.formRow}>
            <Text style={[styles.formLabel, { color: theme.colors.text }]}>
              Amount:
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {/* Add Item Button */}
          <TouchableOpacity
            style={[
              styles.addItemBtn,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={handleAddItem}
          >
            <Ionicons name="add-circle" size={22} color={theme.colors.primary} />
            <Text
              style={[styles.addItemBtnText, { color: theme.colors.text }]}
            >
              Add Item
            </Text>
          </TouchableOpacity>

          {/* Items Table */}
          {items.length > 0 && (
            <View
              style={[
                styles.tableContainer,
                { borderColor: theme.colors.border },
              ]}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  {/* Table Header */}
                  <View
                    style={[
                      styles.tableHeader,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text style={[styles.tableHeaderCell, styles.colSr]}>
                      Sr.
                    </Text>
                    <Text style={[styles.tableHeaderCell, styles.colDate]}>
                      Date
                    </Text>
                    <Text style={[styles.tableHeaderCell, styles.colCategory]}>
                      Expense Category
                    </Text>
                    <Text style={[styles.tableHeaderCell, styles.colDesc]}>
                      Description
                    </Text>
                    <Text style={[styles.tableHeaderCell, styles.colAmount]}>
                      Amount
                    </Text>
                    <Text
                      style={[styles.tableHeaderCell, styles.colAction]}
                    ></Text>
                  </View>

                  {/* Table Rows */}
                  {items.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.tableRow,
                        {
                          backgroundColor: theme.colors.surface,
                          borderBottomColor: theme.colors.border,
                        },
                        index % 2 === 0 && {
                          backgroundColor: theme.colors.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tableCell,
                          styles.colSr,
                          { color: theme.colors.text },
                        ]}
                      >
                        {item.srNo}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.colDate,
                          { color: theme.colors.text },
                        ]}
                      >
                        {formatDate(item.date)}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.colCategory,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={2}
                      >
                        {item.expenseCategoryLabel}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.colDesc,
                          { color: theme.colors.text },
                        ]}
                        numberOfLines={2}
                      >
                        {item.description || '-'}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.colAmount,
                          { color: theme.colors.text },
                        ]}
                      >
                        {formatNumber(item.amount)}
                      </Text>
                      <TouchableOpacity
                        style={[styles.tableCell, styles.colAction]}
                        onPress={() => handleRemoveItem(item.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={theme.colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Total Row */}
                  <View
                    style={[
                      styles.totalRow,
                      { backgroundColor: theme.colors.border },
                    ]}
                  >
                    <Text style={[styles.totalCell, styles.colSr]}></Text>
                    <Text style={[styles.totalCell, styles.colDate]}></Text>
                    <Text style={[styles.totalCell, styles.colCategory]}></Text>
                    <Text
                      style={[
                        styles.totalLabel,
                        styles.colDesc,
                        { color: theme.colors.text },
                      ]}
                    >
                      Total:
                    </Text>
                    <Text
                      style={[
                        styles.totalAmount,
                        styles.colAmount,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {calculateTotal()}
                    </Text>
                    <Text style={[styles.totalCell, styles.colAction]}></Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Attach Receipt Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Attach Receipt / Document{' '}
            <Text
              style={[
                styles.cardTitleHint,
                { color: theme.colors.textSecondary },
              ]}
            >
              (Take photos of your bills before submitting the form.)
            </Text>
          </Text>

          {imageLoading ? (
            <View style={styles.attachButtonsRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.attachButtonsRow}>
              <TouchableOpacity
                onPress={handleCameraCapture}
                style={[
                  styles.attachOptionButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.attachIconWrap,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Ionicons name="camera" size={24} color="#FFF" />
                </View>
                <Text
                  style={[
                    styles.attachOptionText,
                    { color: theme.colors.text },
                  ]}
                >
                  Camera
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleImagePicker}
                style={[
                  styles.attachOptionButton,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.attachIconWrap,
                    { backgroundColor: theme.colors.secondary },
                  ]}
                >
                  <Ionicons name="images" size={24} color="#FFF" />
                </View>
                <Text
                  style={[
                    styles.attachOptionText,
                    { color: theme.colors.text },
                  ]}
                >
                  Gallery
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedImage && (
            <TouchableOpacity
              style={[
                styles.imagePreviewContainer,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setShowImageModal(true)}
            >
              <Image
                source={{ uri: selectedImage }}
                style={styles.imagePreview}
              />
              <Text
                style={[
                  styles.imagePreviewText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Tap to view full image
              </Text>
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={theme.colors.error}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.text,
            },
            (submitting || items.length === 0) && {
              backgroundColor: theme.colors.border,
              borderColor: theme.colors.textSecondary,
            },
          ]}
          onPress={handleSubmit}
          disabled={submitting || items.length === 0}
        >
          {submitting ? (
            <ActivityIndicator color={theme.colors.text} />
          ) : (
            <>
              <Ionicons
                name="paper-plane"
                size={22}
                color={theme.colors.text}
              />
              <Text
                style={[styles.submitBtnText, { color: theme.colors.text }]}
              >
                Submit Expense Claim
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Picker Modal */}
      <CustomDatePicker
        visible={showItemDatePicker}
        onClose={() => setShowItemDatePicker(false)}
        onSelect={date => {
          setItemDate(date);
          setShowItemDatePicker(false);
        }}
        selectedDate={itemDate}
        title="Expense Date"
      />

      {/* Image Preview Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Image Preview
              </Text>
              <TouchableOpacity onPress={() => setShowImageModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.modalImage}
              />
            )}
            <TouchableOpacity
              style={[
                styles.modalCloseButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setShowImageModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Card Styles
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  cardTitleHint: {
    fontSize: 12,
    fontWeight: '400',
    fontStyle: 'italic',
  },

  formRow: {
    width: '100%',
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  formDateField: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
  },
  formDateText: {
    fontSize: 15,
  },
  formDropdown: {
    width: '100%',
    borderRadius: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    height: 48,
  },
  formInput: {
    width: '100%',
    borderRadius: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    fontSize: 15,
    height: 48,
  },
  dropdownPlaceholder: {
    fontSize: 14,
  },
  dropdownSelectedText: {
    fontSize: 15,
  },
  dropdownItemText: {
    fontSize: 14,
  },
  dropdownContainer: {
    borderRadius: 8,
    borderWidth: 1,
  },
  addItemBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    height: 48,
    gap: 8,
    marginTop: 6,
    marginBottom: 16,
    borderWidth: 1,
  },
  addItemBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Table Styles
  tableContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  tableHeaderCell: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  totalCell: {
    paddingHorizontal: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    paddingHorizontal: 8,
  },
  totalAmount: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  // Column Widths
  colSr: { width: 40 },
  colDate: { width: 100 },
  colCategory: { width: 150 },
  colDesc: { width: 130 },
  colAmount: { width: 100 },
  colAction: { width: 40, alignItems: 'center', justifyContent: 'center' },

  // Attach Button Styles
  attachButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  attachOptionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attachIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  attachOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    position: 'relative',
    borderRadius: 10,
    borderWidth: 1,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  imagePreviewText: {
    fontSize: 12,
    marginTop: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 12,
  },

  // Submit Button Styles
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: '700',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 15,
  },
  modalCloseButton: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
