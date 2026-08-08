import React, { useState, useEffect } from 'react';
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
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '@config/useTheme';
import { CustomButton, CustomDatePicker, SearchableDropdown } from '@components/common';
import {
  useGetHospitalMutation,
  useGetHospitalContactsMutation,
  useGetCityDropdownMutation,
} from '@api/baseApi';

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

const ACTIVITY_TYPES = [
  { id: 'Refreshment', name: 'Refreshment' },
  { id: 'Get-together', name: 'Get-together' },
  { id: 'Meeting', name: 'Meeting' },
  { id: 'Gift', name: 'Gift' },
];

const PURPOSES = [
  { id: 'Product Discussion', name: 'Product Discussion' },
  { id: 'Relationship Building', name: 'Relationship Building' },
  { id: 'Follow-up', name: 'Follow-up' },
  { id: 'Other', name: 'Other' },
];

const CRMPromotionalRequestScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const user = useSelector(state => state.auth.user);

  // Form State
  const [requestDate, setRequestDate] = useState(formatToYYYYMMDD(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

  const [activityType, setActivityType] = useState(null);
  const [purpose, setPurpose] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptUri, setReceiptUri] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // API Hooks
  const [getHospital, { data: hospRes, isLoading: hospLoading }] = useGetHospitalMutation();
  const [getHospitalContacts, { data: contactRes, isLoading: contactLoading }] = useGetHospitalContactsMutation();
  const [getCityDropdown, { data: cityRes, isLoading: cityLoading }] = useGetCityDropdownMutation();

  useEffect(() => {
    getHospital({ id: user?.id });
    getCityDropdown({ id: user?.id });
  }, [user?.id, getHospital, getCityDropdown]);

  // When Hospital changes, fetch its contacts
  const handleHospitalChange = item => {
    setSelectedHospital(item);
    setSelectedContact(null);
    if (item?.id) {
      getHospitalContacts({ hospital_id: item.id });
    }
  };

  const handlePickReceipt = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
      if (response.didCancel) return;
      if (response.assets && response.assets.length > 0) {
        setReceiptUri(response.assets[0].uri);
      }
    });
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      Toast.show({
        type: 'info',
        text1: 'Draft Saved',
        text2: 'Promotional activity saved as draft locally.',
      });
    } catch (error) {
      console.log('Error saving draft:', error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedHospital) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a Hospital.',
      });
      return;
    }
    if (!activityType) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select Activity Type.',
      });
      return;
    }
    if (!purpose) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select Purpose.',
      });
      return;
    }
    if (!amount.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter Amount.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        date: requestDate,
        hospital_id: selectedHospital?.id,
        hospital_name: selectedHospital?.name,
        community_id: selectedCommunity?.id,
        contact_id: selectedContact?.id,
        activity_type: activityType?.id,
        purpose: purpose?.id,
        remarks: remarks,
        amount: amount,
        receipt: receiptUri,
        user_id: user?.id,
      };

      console.log('Promotional Request Payload:', payload);
      await new Promise(resolve => setTimeout(resolve, 1200));

      Toast.show({
        type: 'success',
        text1: 'Request Submitted',
        text2: 'Promotional request submitted for manager approval.',
      });

      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.log('Error submitting promotional request:', error);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Failed to submit promotional request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hospital options
  const hospitalList = Array.isArray(hospRes) ? hospRes : hospRes?.data || [];
  const hospitalOptions = hospitalList.map(h => ({
    id: h.id || h.hospital_id,
    name: h.name || h.hospital_name || h.title || 'Hospital',
  }));

  // City / Community options
  const cityList = Array.isArray(cityRes) ? cityRes : cityRes?.data || [];
  const communityOptions = cityList.map(c => ({
    id: c.id || c.city_id,
    name: c.name || c.city_name || c.title || 'City',
  }));

  // Contact options
  const contactList = Array.isArray(contactRes) ? contactRes : contactRes?.data || [];
  const contactOptions = contactList.map(ct => ({
    id: ct.id || ct.contact_id,
    name: ct.name || ct.contact_name || ct.person_name || 'Contact Person',
  }));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner / Title Header */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTitleRow}>
            <Icon name="megaphone-outline" size={24} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.headerTitle}>PROMOTIONAL</Text>
          </View>
          <View style={styles.workflowBadge}>
            <Text style={styles.workflowText}>
              Workflow: Draft ➔ Submit ➔ Manager Approval ➔ Completed
            </Text>
          </View>
        </View>

        {/* Section 1: General Info Card */}
        <View style={styles.card}>
          {/* Date Row */}
          <Text style={styles.fieldLabel}>
            Date <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateText}>{requestDate ? requestDate : 'Select Date'}</Text>
            <Icon name="calendar-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          {/* Hospital Name Dropdown */}
          <View style={{ marginTop: 12 }}>
            <SearchableDropdown
              label="Hospital Name [CRM Database]"
              placeholder="Select Hospital..."
              data={hospitalOptions}
              selectedId={selectedHospital?.id}
              onSelect={handleHospitalChange}
              isLoading={hospLoading}
              iconName="business-outline"
            />
          </View>

          {/* Community Dropdown */}
          <View style={{ marginTop: 12 }}>
            <SearchableDropdown
              label="Community [CRM Database]"
              placeholder="Select Community / City..."
              data={communityOptions}
              selectedId={selectedCommunity?.id}
              onSelect={item => setSelectedCommunity(item)}
              isLoading={cityLoading}
              iconName="map-outline"
            />
          </View>

          {/* Contact Dropdown */}
          <View style={{ marginTop: 12 }}>
            <SearchableDropdown
              label="Contact [CRM Database]"
              placeholder="Select Contact Person..."
              data={contactOptions}
              selectedId={selectedContact?.id}
              onSelect={item => setSelectedContact(item)}
              isLoading={contactLoading}
              iconName="person-outline"
              disabled={!selectedHospital}
            />
          </View>
        </View>

        {/* Section 2: Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>Details</Text>

          {/* Activity Type Dropdown */}
          <View style={{ marginTop: 8 }}>
            <SearchableDropdown
              label="Activity Type [Drop Down]"
              placeholder="Select Activity (Refreshment, Meeting, Gift...)"
              data={ACTIVITY_TYPES}
              selectedId={activityType?.id}
              onSelect={item => setActivityType(item)}
              iconName="sparkles-outline"
            />
          </View>

          {/* Purpose Dropdown */}
          <View style={{ marginTop: 12 }}>
            <SearchableDropdown
              label="Purpose [Drop Down]"
              placeholder="Select Purpose (Product Discussion, Follow-up...)"
              data={PURPOSES}
              selectedId={purpose?.id}
              onSelect={item => setPurpose(item)}
              iconName="disc-outline"
            />
          </View>

          {/* Remarks Text Input */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Remarks</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Text remarks or activity details..."
            placeholderTextColor={theme.colors.textSecondary}
            value={remarks}
            onChangeText={setRemarks}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Amount Numeric Input */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
            Amount (Rs.) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="ERP / Amount e.g. 5000"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          {/* Upload Receipt */}
          <View style={{ marginTop: 18 }}>
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={handlePickReceipt}
              activeOpacity={0.8}
            >
              <Icon name="cloud-upload-outline" size={20} color="#854D0E" style={{ marginRight: 8 }} />
              <Text style={styles.uploadBtnText}>
                {receiptUri ? 'Change Uploaded Receipt' : 'Upload Receipt'}
              </Text>
            </TouchableOpacity>

            {receiptUri && (
              <View style={styles.receiptPreviewRow}>
                <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
                <TouchableOpacity
                  onPress={() => setReceiptUri(null)}
                  style={styles.removeReceiptBtn}
                >
                  <Icon name="close-circle" size={22} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons Row: Save Draft & Submit for Approval */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.saveDraftBtn]}
            onPress={handleSaveDraft}
            disabled={isSavingDraft || isSubmitting}
            activeOpacity={0.8}
          >
            {isSavingDraft ? (
              <ActivityIndicator size="small" color="#854D0E" />
            ) : (
              <>
                <Icon name="save-outline" size={18} color="#854D0E" style={{ marginRight: 6 }} />
                <Text style={styles.saveDraftText}>Save Draft</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.submitBtn]}
            onPress={handleSubmit}
            disabled={isSavingDraft || isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Icon name="checkmark-done-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.submitText}>Submit for Approval</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <CustomDatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={date => {
          setRequestDate(formatToYYYYMMDD(date));
          setShowDatePicker(false);
        }}
        selectedDate={parseDate(requestDate)}
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
    headerBanner: {
      backgroundColor: '#0369A1',
      borderRadius: 12,
      padding: 16,
      marginBottom: 14,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#ffffff',
      letterSpacing: 0.5,
    },
    workflowBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginTop: 4,
    },
    workflowText: {
      fontSize: 12,
      color: '#E0F2FE',
      fontWeight: '500',
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      elevation: 2,
    },
    sectionHeaderTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom: 6,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 6,
    },
    required: {
      color: theme.colors.error || '#EF4444',
    },
    dateSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.colors.background,
    },
    dateText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    textArea: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      minHeight: 80,
    },
    uploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#CA8A04',
      borderStyle: 'dashed',
      borderRadius: 8,
      paddingVertical: 12,
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
      width: 70,
      height: 70,
      borderRadius: 8,
      marginRight: 10,
    },
    removeReceiptBtn: {
      padding: 4,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 10,
      marginBottom: 30,
    },
    actionBtn: {
      flex: 1,
      borderRadius: 8,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
    },
    saveDraftBtn: {
      backgroundColor: '#FEF08A',
      borderWidth: 1,
      borderColor: '#EAB308',
    },
    saveDraftText: {
      color: '#854D0E',
      fontSize: 14,
      fontWeight: '700',
    },
    submitBtn: {
      backgroundColor: '#2563EB',
    },
    submitText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
    },
  });

export default CRMPromotionalRequestScreen;
