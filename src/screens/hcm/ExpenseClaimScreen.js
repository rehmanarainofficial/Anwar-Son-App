import React, { useState, useEffect } from 'react';
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
// Removed formatNumber import
import Toast from 'react-native-toast-message';
import { DimensionDropdown, CustomDatePicker } from '@components/common';
import {
  useGetClaimExpenseAccountQuery,
  usePostServiceExpenseClaimMutation,
} from '@api/hcmApi';

// Purpose options for checkboxes with expense_type numbers
const PURPOSE_OPTIONS = [
  { id: 1, label: 'Monthly Exp' },
  { id: 2, label: 'Official Travel' },
  { id: 3, label: 'Client Meeting' },
  { id: 4, label: 'Office Supplies' },
  { id: 5, label: 'Training / Seminar' },
  { id: 6, label: 'Site Visit' },
  { id: 7, label: 'Other' },
];

export default function ExpenseClaimScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const userData = useSelector(state => state.auth.user);
  const userId = userData?.id;
  const employeeId = userData?.emp_code || userData?.employee_id;
  const onRefresh = route?.params?.onRefresh;

  // Claim Details State
  const [submissionDate, setSubmissionDate] = useState(new Date());
  const [selectedPurpose, setSelectedPurpose] = useState(null);
  const [otherPurposeText, setOtherPurposeText] = useState('');
  const [accompaniedBy, setAccompaniedBy] = useState('');
  const [selectedDimensionId, setSelectedDimensionId] = useState(0);

  // Date Picker States
  const [showSubmissionDatePicker, setShowSubmissionDatePicker] =
    useState(false);
  const [showItemDatePicker, setShowItemDatePicker] = useState(false);

  // Expense Item Form State
  const [itemDate, setItemDate] = useState(new Date());
  const [expenseCategory, setExpenseCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Data State
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

  const accountTitles = (accountsData?.data || [])
    .filter(account => account.inactive === '0' || account.inactive === 0)
    .map(account => ({
      label: account.account_name,
      value: account.account_code,
      account_code: account.account_code,
      account_name: account.account_name,
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
      Toast.show({ type: 'error', text1: 'Please fill required fields' });
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

    if (!selectedPurpose) {
      Toast.show({ type: 'error', text1: 'Please select a purpose' });
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
      formData.append('trans_date', formatDateForApi(submissionDate));
      formData.append('expense_type', selectedPurpose.toString());
      formData.append('amount', totalAmount.toString());
      formData.append('user_id', userId);
      formData.append('expense_detail', JSON.stringify(expenseDetail));
      formData.append('comments', accompaniedBy || '');
      formData.append('employee_id', employeeId);
      formData.append('dimension_id', selectedDimensionId);

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
          text1: 'Expense claim submitted successfully',
        });

        // Reset all fields
        setItems([]);
        setExpenseCategory(null);
        setDescription('');
        setAmount('');
        setSubmissionDate(new Date());
        setSelectedPurpose(null);
        setOtherPurposeText('');
        setAccompaniedBy('');
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
      console.log('Error:', error);
      Toast.show({ type: 'error', text1: 'Submission failed' });
    }
  };

  const calculateTotal = () => {
    return formatNumber(
      items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0),
    );
  };

  const paddingTop = Platform.OS === 'ios' ? insets.top + 10 : insets.top + 15;

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

        {/* Claim Details Card */}
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
            Claim Details
          </Text>

          {/* Claim Submission Date */}
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
              Claim Submission Date:
            </Text>
            <TouchableOpacity
              style={[
                styles.dateInputField,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setShowSubmissionDatePicker(true)}
            >
              <Text
                style={[styles.dateInputText, { color: theme.colors.text }]}
              >
                {formatDate(submissionDate)}
              </Text>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Purpose of Expense */}
          <View style={styles.purposeSection}>
            <Text style={[styles.fieldLabel, { color: theme.colors.text }]}>
              Purpose of Expense:
            </Text>
            <Text
              style={[
                styles.purposeHint,
                { color: theme.colors.textSecondary },
              ]}
            >
              (Select one option)
            </Text>
            <View style={styles.checkboxGrid}>
              {PURPOSE_OPTIONS.map(purpose => {
                const isSelected = selectedPurpose === purpose.id;

                return (
                  <TouchableOpacity
                    key={purpose.id}
                    style={[
                      styles.checkboxRow,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => setSelectedPurpose(purpose.id)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        { borderColor: theme.colors.textSecondary },
                        isSelected && {
                          backgroundColor: theme.colors.success,
                          borderColor: theme.colors.success,
                        },
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.checkboxLabel,
                        { color: theme.colors.text },
                      ]}
                    >
                      {purpose.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Other Specify Field */}
            {selectedPurpose === 7 && (
              <TextInput
                style={[
                  styles.otherSpecifyInput,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                  },
                ]}
                placeholder="Please specify..."
                placeholderTextColor={theme.colors.textSecondary}
                value={otherPurposeText}
                onChangeText={setOtherPurposeText}
              />
            )}
          </View>
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

          {/* Add Item Form */}
          <View
            style={[
              styles.addItemForm,
              { backgroundColor: theme.colors.background },
            ]}
          >
            {/* Date Field */}
            <View style={styles.formRow}>
              <Text style={[styles.formLabel, { color: theme.colors.text }]}>
                Date:
              </Text>
              <TouchableOpacity
                style={[
                  styles.formDateField,
                  {
                    backgroundColor: theme.colors.surface,
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
                    backgroundColor: theme.colors.surface,
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
                    backgroundColor: theme.colors.surface,
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
                    backgroundColor: theme.colors.surface,
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
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.text,
                },
              ]}
              onPress={handleAddItem}
            >
              <Ionicons name="add-circle" size={22} color={theme.colors.text} />
              <Text
                style={[styles.addItemBtnText, { color: theme.colors.text }]}
              >
                Add Item
              </Text>
            </TouchableOpacity>
          </View>

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

        {/* Additional Notes Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Additional Notes{' '}
            <Text
              style={[
                styles.cardTitleHint,
                { color: theme.colors.textSecondary },
              ]}
            >
              (Names of Accompanying Person(s) if any)
            </Text>
          </Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            placeholder=""
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={4}
            value={accompaniedBy}
            onChangeText={setAccompaniedBy}
          />
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

      {/* Date Pickers */}
      <CustomDatePicker
        visible={showSubmissionDatePicker}
        onClose={() => setShowSubmissionDatePicker(false)}
        onSelect={date => {
          setSubmissionDate(date);
          setShowSubmissionDatePicker(false);
        }}
        selectedDate={submissionDate}
        title="Submission Date"
      />

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
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

  // Field Styles
  fieldRow: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  dateInputText: {
    fontSize: 15,
  },

  // Purpose Checkbox Styles
  purposeSection: {
    marginBottom: 16,
  },
  purposeHint: {
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  otherSpecifyInput: {
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 14,
  },

  // Add Item Form Styles
  addItemForm: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  formRow: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  formDateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  formDateText: {
    fontSize: 14,
  },
  formDropdown: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    height: 44,
  },
  formInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 14,
    height: 44,
  },
  dropdownPlaceholder: {
    fontSize: 14,
  },
  dropdownSelectedText: {
    fontSize: 14,
  },
  dropdownItemText: {
    fontSize: 14,
  },
  dropdownContainer: {
    borderRadius: 8,
    borderWidth: 1,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
    marginTop: 4,
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

  // Notes Styles
  notesInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },

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
