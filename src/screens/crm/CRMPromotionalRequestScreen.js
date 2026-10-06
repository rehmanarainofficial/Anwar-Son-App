import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  FlatList,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '@config/useTheme';
import { CustomDatePicker, SearchableDropdown, DateFilter } from '@components/common';
import { formatToAsiaDateTime } from '../../utils/dateUtils';
import {
  useGetHospitalMutation,
  useGetCommunityDropdownMutation,
  useGetHospitalContactsMutation,
  useGetPromotionalActivityTypeDropdownMutation,
  useGetPromotionalPurposeDropdownMutation,
  useGetPromotionalDataMutation,
  usePostPromotionalDataMutation,
} from '@api/baseApi';
import { usePostOutstationExpenseClaimMutation } from '@api/hcmApi';

const getInitialFilterDates = () => {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  return { from, to };
};

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

// Status Definitions
const STATUS_OPTIONS_ROLE_3 = [
  { id: '1', name: 'Draft' },
  { id: '2', name: 'Submit for Approval' },
  { id: '5', name: 'Resubmit' },
];

const STATUS_OPTIONS_MANAGER = [
  { id: '3', name: 'Approved' },
  { id: '4', name: 'Rejected' },
  { id: '5', name: 'Resubmit' },
  { id: '6', name: 'Completed' },
];

const STATUS_MAP = {
  '1': { label: 'Draft', bg: '#FEF3C7', text: '#92400E' },
  '2': { label: 'Submit for Approval', bg: '#DBEAFE', text: '#1E40AF' },
  '3': { label: 'Approved', bg: '#D1FAE5', text: '#065F46' },
  '4': { label: 'Rejected', bg: '#FEE2E2', text: '#991B1B' },
  '5': { label: 'Resubmit', bg: '#FFEDD5', text: '#C2410C' },
  '6': { label: 'Completed', bg: '#E0E7FF', text: '#3730A3' },
};

const CRMPromotionalRequestScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const user = useSelector(state => state.auth.user);
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0);

  const isRole3 = String(user?.role_id) === '3';

  const routeStatusId = route?.params?.statusId;
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(
    routeStatusId ? String(routeStatusId) : 'all',
  );

  useEffect(() => {
    if (route?.params?.statusId) {
      setSelectedStatusFilter(String(route.params.statusId));
    }
  }, [route?.params?.statusId]);

  // List Data State
  const [promotionalList, setPromotionalList] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Date Filter State (Default 1 Month Range)
  const initialDates = getInitialFilterDates();
  const [fromDate, setFromDate] = useState(initialDates.from);
  const [toDate, setToDate] = useState(initialDates.to);

  // Main Form Modal State (Add / Full Edit)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'update'
  const [formId, setFormId] = useState(0);

  // Form Field States
  const [requestDate, setRequestDate] = useState(formatToYYYYMMDD(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedActivityTypeId, setSelectedActivityTypeId] = useState(null);
  const [selectedPurposeId, setSelectedPurposeId] = useState(null);
  const [selectedStatusId, setSelectedStatusId] = useState(isRole3 ? '1' : '3');

  const [remarks, setRemarks] = useState('');
  const [managerRemarks, setManagerRemarks] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manager Status Modal State (For role_id !== 3 manager status updates)
  const [isManagerStatusModalVisible, setIsManagerStatusModalVisible] = useState(false);
  const [selectedManagerItem, setSelectedManagerItem] = useState(null);
  const [managerStatusId, setManagerStatusId] = useState('3');
  const [managerRemarksText, setManagerRemarksText] = useState('');
  const [isManagerSubmitting, setIsManagerSubmitting] = useState(false);
  const [formCreatedBy, setFormCreatedBy] = useState(null);

  // API Hooks
  const [getPromotionalData, { isLoading: dataLoading }] = useGetPromotionalDataMutation();
  const [getHospital, { data: hospRes, isLoading: hospLoading }] = useGetHospitalMutation();
  const [getCommunityDropdown, { data: commRes, isLoading: commLoading }] = useGetCommunityDropdownMutation();
  const [getHospitalContacts, { data: contactRes, isLoading: contactLoading }] = useGetHospitalContactsMutation();
  const [getActivityTypeDropdown, { data: activityRes, isLoading: activityLoading }] = useGetPromotionalActivityTypeDropdownMutation();
  const [getPurposeDropdown, { data: purposeRes, isLoading: purposeLoading }] = useGetPromotionalPurposeDropdownMutation();
  const [postPromotionalData] = usePostPromotionalDataMutation();
  const [postFieldExpensePayments] = usePostOutstationExpenseClaimMutation();

  // Header options with (+) button on the right
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Promotional Activity',
      headerRight: () => (
        <TouchableOpacity
          onPress={() => openFormModal('add')}
          style={{ marginRight: 12, padding: 4 }}
          activeOpacity={0.7}
        >
          <Icon name="add-circle" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme]);

  // Load Promotional List Data
  const loadPromotionalData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const payload = {
        user_id: user.id,
        role_id: user?.role_id || '',
      };
      if (fromDate) {
        payload.from_date = formatToYYYYMMDD(fromDate);
      }
      if (toDate) {
        payload.to_date = formatToYYYYMMDD(toDate);
      }

      const res = await getPromotionalData(payload).unwrap();

      if (res && (res.status === 'true' || res.status === true) && Array.isArray(res.data)) {
        setPromotionalList(res.data);
      } else {
        setPromotionalList([]);
      }
    } catch (error) {
      console.log('Error loading promotional data:', error);
      setPromotionalList([]);
    }
  }, [user?.id, user?.role_id, fromDate, toDate, getPromotionalData]);

  useEffect(() => {
    loadPromotionalData();
  }, [loadPromotionalData]);

  useEffect(() => {
    if (user?.id) {
      getHospital({ id: user.id });
      getCommunityDropdown({});
      getActivityTypeDropdown({});
      getPurposeDropdown({});
      getHospitalContacts({ user_id: user.id });
    }
  }, [user?.id, getHospital, getCommunityDropdown, getActivityTypeDropdown, getPurposeDropdown, getHospitalContacts]);

  // Pull to refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPromotionalData();
    setIsRefreshing(false);
  };

  const openFormModal = (mode, item = null) => {
    setFormMode(mode);
    if (mode === 'update' && item) {
      setFormId(item.id || 0);
      setFormCreatedBy(item.created_by || item.user_id || null);
      setRequestDate(formatToYYYYMMDD(item.tran_date || new Date()));
      setSelectedHospitalId(item.hospital_id || null);
      setSelectedCommunityId(item.community_id || null);
      setSelectedContactId(item.contact_id || null);
      setSelectedActivityTypeId(item.activity_type_id || null);
      setSelectedPurposeId(item.purpose_id || null);
      setSelectedStatusId(String(item.status_id || (isRole3 ? '1' : '3')));
      setRemarks(item.remarks || '');
      setManagerRemarks(item.manager_remarks || '');
      setAmount(item.amount ? String(item.amount) : '');
      setReceiptFile(item.receipt_file || null);

      getHospitalContacts({
        user_id: user?.id,
        hospital_id: item.hospital_id,
        community_id: item.community_id,
      });
    } else {
      // New Add Mode
      setFormId(0);
      setFormCreatedBy(null);
      setRequestDate(formatToYYYYMMDD(new Date()));
      setSelectedHospitalId(null);
      setSelectedCommunityId(null);
      setSelectedContactId(null);
      setSelectedActivityTypeId(null);
      setSelectedPurposeId(null);
      setSelectedStatusId(isRole3 ? '1' : '3');
      setRemarks('');
      setManagerRemarks('');
      setAmount('');
      setReceiptFile(null);

      getHospitalContacts({ user_id: user?.id });
    }
    setIsModalVisible(true);
  };

  const openManagerStatusModal = item => {
    setSelectedManagerItem(item);
    setManagerStatusId(String(item.status_id || '3'));
    setManagerRemarksText(item.manager_remarks || '');
    setIsManagerStatusModalVisible(true);
  };

  // When Hospital selection changes
  const handleHospitalSelect = item => {
    const hospId = item.id || item.debtor_no;
    setSelectedHospitalId(String(hospId || ''));
    setSelectedContactId(null);
    getHospitalContacts({
      user_id: user?.id,
      hospital_id: hospId,
      community_id: selectedCommunityId,
    });
  };

  // When Community selection changes
  const handleCommunitySelect = item => {
    const commId = item.id || item.combo_code;
    setSelectedCommunityId(String(commId || ''));
    setSelectedContactId(null);
    getHospitalContacts({
      user_id: user?.id,
      hospital_id: selectedHospitalId,
      community_id: commId,
    });
  };

  // Receipt Image Picker
  const handlePickReceipt = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
      if (response.didCancel) return;
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setReceiptFile({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || 'receipt.jpg',
        });
      }
    });
  };

  const handleSaveForm = async () => {
    if (!selectedHospitalId) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a Hospital.' });
      return;
    }
    if (!selectedActivityTypeId) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select Activity Type.' });
      return;
    }
    if (!selectedPurposeId) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select Purpose.' });
      return;
    }
    if (!amount.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter Amount.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const effectiveStatusId = selectedStatusId || (isRole3 ? '1' : '3');
      const payload = {
        company: 'ANS',
        id: formId,
        tran_date: requestDate,
        hospital_id: selectedHospitalId || '',
        community_id: selectedCommunityId || '',
        contact_id: selectedContactId || '',
        activity_type_id: selectedActivityTypeId || '',
        purpose_id: selectedPurposeId || '',
        remarks: remarks,
        amount: amount,
        receipt_file: receiptFile,
        status_id: effectiveStatusId,
        user_id: (String(effectiveStatusId) === '6' && formCreatedBy) ? formCreatedBy : (user?.user_id || user?.id || ''),
        role_id: user?.role_id || '',
        manager_remarks: isRole3 ? (formMode === 'update' ? managerRemarks : null) : managerRemarks,
      };

      const response = await postPromotionalData(payload).unwrap();

      const isSuccess = response && response.status === 'true' || response.status === true;

      if (isSuccess) {
        Toast.show({
          type: 'success',
          text1: formMode === 'update' ? 'Activity Updated' : 'Activity Saved',
          text2: response?.message || 'Promotional record processed successfully.',
        });

        if (String(effectiveStatusId) === '6') {
          try {
            const currentDate = formatToYYYYMMDD(new Date());
            const loginUserId = user?.user_id || '';
            const parsedAmount = parseFloat(String(amount).replace(/,/g, '')) || 0;

            const hospName = hospitalOptions.find(h => String(h.id) === String(selectedHospitalId))?.name || '';
            const commName = communityOptions.find(c => String(c.id) === String(selectedCommunityId))?.name || '';
            const contName = contactOptions.find(c => String(c.id) === String(selectedContactId))?.name || '';
            const actName = activityTypeOptions.find(a => String(a.id) === String(selectedActivityTypeId))?.name || '';
            const purpName = purposeOptions.find(p => String(p.id) === String(selectedPurposeId))?.name || '';

            const memoParts = [];
            if (hospName) memoParts.push(`Hospital: ${hospName}`);
            if (commName) memoParts.push(`Community: ${commName}`);
            if (contName) memoParts.push(`Contact: ${contName}`);
            if (actName) memoParts.push(`Activity: ${actName}`);
            if (purpName) memoParts.push(`Purpose: ${purpName}`);
            const lineMemo = memoParts.length > 0 ? memoParts.join(' | ') : 'Promotional Activity';

            const promoCommentParts = [
              loginUserId ? `Promotional ${loginUserId}` : 'Promotional',
            ];
            if (requestDate) promoCommentParts.push(`Date: ${requestDate}`);
            if (hospName) promoCommentParts.push(`Hospital: ${hospName}`);
            if (commName) promoCommentParts.push(`Community: ${commName}`);
            if (contName) promoCommentParts.push(`Contact: ${contName}`);
            if (actName) promoCommentParts.push(`Activity: ${actName}`);
            if (purpName) promoCommentParts.push(`Purpose: ${purpName}`);
            if (remarks && remarks.trim()) promoCommentParts.push(`Remarks: ${remarks.trim()}`);
            if (managerRemarks && managerRemarks.trim()) promoCommentParts.push(`Manager Remarks: ${managerRemarks.trim()}`);

            const targetUserId = (formMode === 'update' && formCreatedBy) ? formCreatedBy : String(user?.user_id || user?.id || '');

            const expensePayload = {
              company: 'ANS',
              user_id: targetUserId,
              employee_id: targetUserId,
              from_city: '0',
              to_city: '0',
              leave_date: currentDate,
              return_date: currentDate,
              fuel: '0',
              expense_detail: JSON.stringify([
                {
                  account_code: '606003',
                  line_date: currentDate,
                  amount: parsedAmount,
                  line_memo: lineMemo,
                },
              ]),
              expense_type: '1',
              trans_date: currentDate,
              comments: promoCommentParts.join(' | '),
              amount: String(parsedAmount),
              filename: null,
            };

            await postFieldExpensePayments(expensePayload).unwrap();
          } catch (expErr) {
            // Handled non-blocking
          }
        }

        setIsModalVisible(false);
        loadPromotionalData();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Action Failed',
          text2: response?.message || 'Failed to save promotional activity.',
        });
      }
    } catch (error) {
      console.log('Error posting promotional data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred while communicating with the server.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Handler for Manager Status Modal
  const handleSaveManagerStatus = async () => {
    if (!selectedManagerItem) return;
    setIsManagerSubmitting(true);

    try {
      const cardUserId = (String(managerStatusId) === '6' && (selectedManagerItem?.created_by || selectedManagerItem?.user_id))
        ? (selectedManagerItem.created_by || selectedManagerItem.user_id)
        : (user?.user_id || user?.id || '');
      const payload = {
        company: 'CRM',
        id: selectedManagerItem.id,
        tran_date: selectedManagerItem.tran_date,
        hospital_id: selectedManagerItem.hospital_id || '',
        community_id: selectedManagerItem.community_id || '',
        contact_id: selectedManagerItem.contact_id || '',
        activity_type_id: selectedManagerItem.activity_type_id || '',
        purpose_id: selectedManagerItem.purpose_id || '',
        remarks: selectedManagerItem.remarks || '',
        amount: selectedManagerItem.amount || '',
        receipt_file: selectedManagerItem.receipt_file || '',
        status_id: managerStatusId,
        user_id: cardUserId,
        role_id: user?.role_id || '',
        manager_remarks: managerRemarksText,
      };

      const response = await postPromotionalData(payload).unwrap();

      const isSuccess = response && (
        response.status === 'true' || response.status === true
      );

      if (isSuccess) {
        Toast.show({
          type: 'success',
          text1: 'Status Updated',
          text2: response?.message || 'Activity status updated successfully.',
        });

        // When status is Completed (6), also fire field expense payments API
        if (String(managerStatusId) === '6') {
          try {
            const currentDate = formatToYYYYMMDD(new Date());
            const loginUserId = user?.user_id || user?.username || '';
            const parsedAmount = parseFloat(String(selectedManagerItem?.amount || '0').replace(/,/g, '')) || 0;

            const hospName = selectedManagerItem.hospital_name || hospitalOptions.find(h => String(h.id) === String(selectedManagerItem.hospital_id))?.name || '';
            const commName = selectedManagerItem.community || communityOptions.find(c => String(c.id) === String(selectedManagerItem.community_id))?.name || '';
            const contName = selectedManagerItem.contact_person || contactOptions.find(c => String(c.id) === String(selectedManagerItem.contact_id))?.name || '';
            const actName = selectedManagerItem.activity_name || activityTypeOptions.find(a => String(a.id) === String(selectedManagerItem.activity_type_id))?.name || '';
            const purpName = selectedManagerItem.purpose_name || purposeOptions.find(p => String(p.id) === String(selectedManagerItem.purpose_id))?.name || '';

            const memoParts = [];
            if (hospName) memoParts.push(`Hospital: ${hospName}`);
            if (commName) memoParts.push(`Community: ${commName}`);
            if (contName) memoParts.push(`Contact: ${contName}`);
            if (actName) memoParts.push(`Activity: ${actName}`);
            if (purpName) memoParts.push(`Purpose: ${purpName}`);
            const lineMemo = memoParts.length > 0 ? memoParts.join(' | ') : 'Promotional Activity';

            // Build comments from manager item data
            const promoCommentParts = [
              loginUserId ? `Promotional ${loginUserId}` : 'Promotional',
            ];
            if (selectedManagerItem.tran_date) promoCommentParts.push(`Date: ${formatToYYYYMMDD(selectedManagerItem.tran_date)}`);
            if (hospName) promoCommentParts.push(`Hospital: ${hospName}`);
            if (commName) promoCommentParts.push(`Community: ${commName}`);
            if (contName) promoCommentParts.push(`Contact: ${contName}`);
            if (actName) promoCommentParts.push(`Activity: ${actName}`);
            if (purpName) promoCommentParts.push(`Purpose: ${purpName}`);
            if (selectedManagerItem.remarks && selectedManagerItem.remarks.trim()) promoCommentParts.push(`Remarks: ${selectedManagerItem.remarks.trim()}`);
            if (managerRemarksText && managerRemarksText.trim()) promoCommentParts.push(`Manager Remarks: ${managerRemarksText.trim()}`);

            const targetUserId = String(selectedManagerItem?.created_by || selectedManagerItem?.user_id || '');
            const targetEmployeeId = String(selectedManagerItem?.employee_id || selectedManagerItem?.created_by || '');

            const expensePayload = {
              company: 'ANS',
              user_id: targetUserId,
              employee_id: targetEmployeeId,
              from_city: '0',
              to_city: '0',
              leave_date: currentDate,
              return_date: currentDate,
              fuel: '0',
              expense_detail: JSON.stringify([
                {
                  account_code: '606003',
                  line_date: currentDate,
                  amount: parsedAmount,
                  line_memo: lineMemo,
                },
              ]),
              expense_type: '1',
              trans_date: currentDate,
              comments: promoCommentParts.join(' | '),
              amount: String(parsedAmount),
              filename: null,
            };

            await postFieldExpensePayments(expensePayload).unwrap();
          } catch (expErr) {
            console.log('Error posting field expense payments:', expErr);
          }
        }

        setIsManagerStatusModalVisible(false);
        loadPromotionalData();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: response?.message || 'Failed to update status.',
        });
      }
    } catch (error) {
      console.log('Error updating manager status:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred while updating status.',
      });
    } finally {
      setIsManagerSubmitting(false);
    }
  };

  // Dropdown Lists Data Formatting
  const hospitalList = (hospRes && (hospRes.data || Array.isArray(hospRes))) ? (Array.isArray(hospRes) ? hospRes : hospRes.data) : [];
  const hospitalOptions = hospitalList.map(h => ({
    id: String(h.id || h.debtor_no || h.hospital_id || ''),
    name: h.name || h.hospital_name || h.title || h.description || 'Hospital',
    debtor_no: h.debtor_no,
  }));

  const communityList = (commRes && (commRes.data || Array.isArray(commRes))) ? (Array.isArray(commRes) ? commRes : commRes.data) : [];
  const communityOptions = communityList.map(c => ({
    id: String(c.combo_code !== undefined && c.combo_code !== null ? c.combo_code : (c.id || '')),
    name: c.description || c.name || c.title || 'Community',
    combo_code: c.combo_code,
  }));

  const contactList = (contactRes && (contactRes.data || Array.isArray(contactRes))) ? (Array.isArray(contactRes) ? contactRes : contactRes.data) : [];
  const contactOptions = contactList.map(cp => ({
    id: String(cp.id !== undefined && cp.id !== null ? cp.id : (cp.contact_id || '')),
    name: cp.person_name || cp.name || cp.contact_person || cp.contact_name || cp.title || 'Contact Person',
  }));

  const activityTypeList = (activityRes && (activityRes.data || Array.isArray(activityRes))) ? (Array.isArray(activityRes) ? activityRes : activityRes.data) : [];
  const activityTypeOptions = activityTypeList.map(a => ({
    id: String(a.id !== undefined && a.id !== null ? a.id : (a.activity_type_id || '')),
    name: a.activity_name || a.name || a.description || a.title || 'Activity Type',
  }));

  const purposeList = (purposeRes && (purposeRes.data || Array.isArray(purposeRes))) ? (Array.isArray(purposeRes) ? purposeRes : purposeRes.data) : [];
  const purposeOptions = purposeList.map(p => ({
    id: String(p.id !== undefined && p.id !== null ? p.id : (p.purpose_id || '')),
    name: p.purpose_name || p.name || p.description || p.title || 'Purpose',
  }));

  // Helper function for status styling
  const renderStatusBadge = statusId => {
    const info = STATUS_MAP[String(statusId)] || { label: 'Draft', bg: '#FEF3C7', text: '#92400E' };
    return (
      <View style={[styles.statusBadge, { backgroundColor: info.bg }]}>
        <Text style={[styles.statusText, { color: info.text }]}>{info.label}</Text>
      </View>
    );
  };

  // Render Promotional Card Item
  const renderCardItem = ({ item }) => {
    return (
      <View style={styles.card}>
        {/* Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.referenceContainer}>
            <Icon name="megaphone-outline" size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.referenceText}>{item.reference || `PROMO-${item.id}`}</Text>
          </View>
          <View style={styles.headerRightRow}>
            {renderStatusBadge(item.status_id)}
            <Text style={styles.cardDateText}>{formatToAsiaDateTime(item.tran_date, false)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Card Body Information */}
        <View style={styles.infoRow}>
          <Icon name="business-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Hospital:</Text>
          <Text style={styles.infoValue}>{item.hospital_name || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="person-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Contact:</Text>
          <Text style={styles.infoValue}>{item.contact_person || 'N/A'}</Text>
        </View>

        {item.community ? (
          <View style={styles.infoRow}>
            <Icon name="map-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Community:</Text>
            <Text style={styles.infoValue}>{item.community}</Text>
          </View>
        ) : null}

        <View style={styles.infoGridRow}>
          <View style={[styles.infoRow, { flex: 1 }]}>
            <Icon name="sparkles-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{item.activity_name || item.activity_type_id || 'N/A'}</Text>
          </View>

          <View style={[styles.infoRow, { flex: 1 }]}>
            <Icon name="disc-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Purpose:</Text>
            <Text style={styles.infoValue}>{item.purpose_name || item.purpose_id || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Icon name="cash-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Amount:</Text>
          <Text style={[styles.infoValue, { fontWeight: '700', color: theme.colors.primary }]}>
            Rs. {parseFloat(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {(item.created_by_name || item.created_by) ? (
          <View style={styles.infoRow}>
            <Icon name="person-circle-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Created By:</Text>
            <Text style={[styles.infoValue, { fontWeight: '700' }]}>{item.created_by_name || item.created_by}</Text>
          </View>
        ) : null}

        {item.remarks ? (
          <View style={styles.remarksBox}>
            <Text style={styles.remarksLabel}>Remarks:</Text>
            <Text style={styles.remarksText}>{item.remarks}</Text>
          </View>
        ) : null}

        {item.manager_remarks ? (
          <View style={styles.managerRemarksBox}>
            <Text style={styles.managerRemarksLabel}>Manager Remarks:</Text>
            <Text style={styles.managerRemarksText}>{item.manager_remarks}</Text>
          </View>
        ) : null}

        {item.receipt_file ? (
          <View style={styles.receiptContainer}>
            <Text style={styles.receiptLabel}>Receipt File Attached</Text>
            {typeof item.receipt_file === 'string' && (item.receipt_file.startsWith('http') || item.receipt_file.startsWith('file')) ? (
              <Image source={{ uri: item.receipt_file }} style={styles.receiptThumbnail} />
            ) : null}
          </View>
        ) : null}

        {/* Card Footer Action Button */}
        <View style={styles.cardActionsRow}>
          {isRole3 ? (
            /* Role 3 User: Update Button to edit fields */
            <TouchableOpacity
              style={styles.updateCardBtn}
              onPress={() => openFormModal('update', item)}
              activeOpacity={0.7}
            >
              <Icon name="create-outline" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.updateCardBtnText}>Update</Text>
            </TouchableOpacity>
          ) : (
            /* Non-Role 3 Manager: Status Button to change status & add manager remarks */
            <TouchableOpacity
              style={styles.statusManagerCardBtn}
              onPress={() => openManagerStatusModal(item)}
              activeOpacity={0.7}
            >
              <Icon name="options-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.statusManagerCardBtnText}>Status</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const filteredPromotionalList = promotionalList.filter(item => {
    if (selectedStatusFilter && selectedStatusFilter !== 'all') {
      const sId = String(item.status_id !== undefined && item.status_id !== null ? item.status_id : '').trim();
      const statusName = String(item.status || item.status_name || '').trim().toLowerCase();

      if (selectedStatusFilter === '1') return sId === '1' || statusName === 'draft';
      if (selectedStatusFilter === '2') return sId === '2' || statusName === 'submit for approval' || statusName === 'pending';
      if (selectedStatusFilter === '3') return sId === '3' || statusName === 'approved';
      if (selectedStatusFilter === '4') return sId === '4' || statusName === 'rejected';
      if (selectedStatusFilter === '5') return sId === '5' || statusName === 'resubmit';
      if (selectedStatusFilter === '6') return sId === '6' || statusName === 'completed';

      return sId === String(selectedStatusFilter);
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Date Range Filter */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        <DateFilter
          fromDate={fromDate}
          toDate={toDate}
          onFromDate={setFromDate}
          onToDate={setToDate}
          onClear={() => {
            setFromDate(null);
            setToDate(null);
          }}
          onFilter={loadPromotionalData}
        />
      </View>

      {/* Main Content: List of Promotional Cards */}
      {dataLoading && !isRefreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>Loading promotional activities...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPromotionalList}
          keyExtractor={item => String(item.id)}
          renderItem={renderCardItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="megaphone-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Promotional Activities</Text>
              <Text style={styles.emptySubtext}>
                Tap the (+) icon in the top right header to add a new promotional request.
              </Text>
              <TouchableOpacity
                style={styles.addFirstBtn}
                onPress={() => openFormModal('add')}
                activeOpacity={0.8}
              >
                <Icon name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.addFirstBtnText}>Add Promotional Activity</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button (+) option */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => openFormModal('add')}
        activeOpacity={0.85}
      >
        <Icon name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Main Form Modal (Add / Edit) */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View
            style={[
              styles.customModalHeader,
              {
                paddingTop: topInset,
                backgroundColor: theme.colors.primary,
              },
            ]}
          >
            <StatusBar
              barStyle="light-content"
              backgroundColor={theme.colors.primary}
              translucent={true}
            />
            <View style={styles.customModalHeaderContent}>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.modalHeaderIconBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Icon name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.modalHeaderTitleContainer}>
                <Text style={styles.customModalHeaderTitle} numberOfLines={1}>
                  {formMode === 'update' ? 'Update Promotional Activity' : 'Add Promotional Activity'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.modalHeaderIconBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalCard}>
              {/* Date Input */}
              <Text style={styles.fieldLabel}>
                Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dateText}>{requestDate || 'Select Date'}</Text>
                <Icon name="calendar-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>

              {/* Hospital Dropdown */}
              <View style={{ marginTop: 12 }}>
                <SearchableDropdown
                  label="Hospital"
                  placeholder="Select Hospital..."
                  data={hospitalOptions}
                  idKey="id"
                  labelKey="name"
                  selectedId={selectedHospitalId}
                  onSelect={handleHospitalSelect}
                  isLoading={hospLoading}
                  iconName="business-outline"
                />
              </View>

              {/* Community Dropdown */}
              <View style={{ marginTop: 12 }}>
                <SearchableDropdown
                  label="Community"
                  placeholder="Select Community..."
                  data={communityOptions}
                  idKey="id"
                  labelKey="name"
                  selectedId={selectedCommunityId}
                  onSelect={handleCommunitySelect}
                  isLoading={commLoading}
                  iconName="map-outline"
                />
              </View>

              {/* Contact Person Dropdown */}
              <View style={{ marginTop: 12 }}>
                <SearchableDropdown
                  label="Contact Person"
                  placeholder="Select Contact Person..."
                  data={contactOptions}
                  idKey="id"
                  labelKey="name"
                  selectedId={selectedContactId}
                  onSelect={item => setSelectedContactId(String(item.id))}
                  isLoading={contactLoading}
                  iconName="person-outline"
                />
              </View>

              {/* Activity Type Dropdown */}
              <View style={{ marginTop: 12 }}>
                <SearchableDropdown
                  label="Activity Type"
                  placeholder="Select Activity Type..."
                  data={activityTypeOptions}
                  idKey="id"
                  labelKey="name"
                  selectedId={selectedActivityTypeId}
                  onSelect={item => setSelectedActivityTypeId(String(item.id))}
                  isLoading={activityLoading}
                  iconName="sparkles-outline"
                />
              </View>

              {/* Purpose Dropdown */}
              <View style={{ marginTop: 12 }}>
                <SearchableDropdown
                  label="Purpose"
                  placeholder="Select Purpose..."
                  data={purposeOptions}
                  idKey="id"
                  labelKey="name"
                  selectedId={selectedPurposeId}
                  onSelect={item => setSelectedPurposeId(String(item.id))}
                  isLoading={purposeLoading}
                  iconName="disc-outline"
                />
              </View>

              {/* Status Selector Dropdown */}
              <View style={{ marginTop: 12 }}>
                <SearchableDropdown
                  label="Status"
                  placeholder="Select Status..."
                  data={isRole3 ? STATUS_OPTIONS_ROLE_3 : STATUS_OPTIONS_MANAGER}
                  idKey="id"
                  labelKey="name"
                  selectedId={selectedStatusId}
                  onSelect={item => setSelectedStatusId(String(item.id))}
                  iconName="flag-outline"
                />
              </View>

              {/* Remarks Text Input */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Remarks</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Remarks or activity details..."
                placeholderTextColor={theme.colors.textSecondary}
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Manager Remarks Input / Readonly View */}
              {isRole3 ? (
                // For Role 3: Show Manager Remarks on Update if available, but NOT editable
                formMode === 'update' && managerRemarks ? (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.fieldLabel}>Manager Remarks</Text>
                    <View style={styles.readOnlyBox}>
                      <Text style={styles.readOnlyText}>{managerRemarks}</Text>
                    </View>
                  </View>
                ) : null
              ) : (
                // For Non-Role 3 (Managers): Editable Manager Remarks field
                <View style={{ marginTop: 14 }}>
                  <Text style={styles.fieldLabel}>Manager Remarks</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Enter manager remarks..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={managerRemarks}
                    onChangeText={setManagerRemarks}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              )}

              {/* Amount Numeric Input */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                Amount (Rs.) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Amount e.g. 1000"
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
                    {receiptFile ? 'Change Receipt Photo' : 'Upload Receipt Photo'}
                  </Text>
                </TouchableOpacity>

                {receiptFile ? (
                  <View style={styles.receiptPreviewRow}>
                    {typeof receiptFile === 'object' && receiptFile.uri ? (
                      <Image source={{ uri: receiptFile.uri }} style={styles.receiptImage} />
                    ) : typeof receiptFile === 'string' && receiptFile.length > 0 ? (
                      <Image source={{ uri: receiptFile }} style={styles.receiptImage} />
                    ) : (
                      <Text style={styles.receiptAttachedText}>File attached</Text>
                    )}
                    <TouchableOpacity
                      onPress={() => setReceiptFile(null)}
                      style={styles.removeReceiptBtn}
                    >
                      <Icon name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              {/* Modal Save Action Button */}
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.submitBtn]}
                  onPress={handleSaveForm}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="checkmark-done-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.submitText}>
                        {formMode === 'update' ? 'Update Activity' : 'Save Promotional Activity'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Dedicated Manager Status Modal */}
      <Modal
        visible={isManagerStatusModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsManagerStatusModalVisible(false)}
      >
        <View style={styles.statusModalOverlay}>
          <TouchableOpacity
            style={styles.statusModalBg}
            onPress={() => setIsManagerStatusModalVisible(false)}
          />
          <View style={[styles.statusModalSheet, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalSheetHandle, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.statusModalTitle, { color: theme.colors.text }]}>
              Update Activity Status
            </Text>

            {selectedManagerItem ? (
              <View style={styles.managerSummaryBox}>
                <Text style={styles.summaryRefText}>
                  {selectedManagerItem.reference || `PROMO-${selectedManagerItem.id}`} - {selectedManagerItem.hospital_name || 'Hospital'}
                </Text>
                <Text style={styles.summaryAmountText}>
                  Amount: Rs. {parseFloat(selectedManagerItem.amount || 0).toLocaleString()}
                </Text>
              </View>
            ) : null}

            {/* Manager Status Selection Dropdown */}
            <View style={{ marginTop: 8 }}>
              <SearchableDropdown
                label="Select New Status"
                placeholder="Choose Status..."
                data={STATUS_OPTIONS_MANAGER}
                idKey="id"
                labelKey="name"
                selectedId={managerStatusId}
                onSelect={item => setManagerStatusId(item.id)}
                iconName="flag-outline"
              />
            </View>

            {/* Manager Remarks Input */}
            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Manager Remarks</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter remarks for status change..."
              placeholderTextColor={theme.colors.textSecondary}
              value={managerRemarksText}
              onChangeText={setManagerRemarksText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.saveManagerStatusBtn}
              onPress={handleSaveManagerStatus}
              disabled={isManagerSubmitting}
              activeOpacity={0.8}
            >
              {isManagerSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveManagerStatusBtnText}>Update Status</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker Component */}
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
    listContent: {
      padding: 16,
      paddingBottom: 80,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loaderText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 20,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginTop: 12,
    },
    emptySubtext: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 20,
    },
    addFirstBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 10,
    },
    addFirstBtnText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    referenceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    referenceText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
    },
    headerRightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    cardDateText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 12,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    infoGridRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    infoIcon: {
      marginRight: 6,
    },
    infoLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginRight: 6,
    },
    infoValue: {
      fontSize: 13,
      color: theme.colors.text,
      flex: 1,
    },
    remarksBox: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 10,
      marginTop: 6,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    remarksLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    remarksText: {
      fontSize: 13,
      color: theme.colors.text,
    },
    managerRemarksBox: {
      backgroundColor: '#FEF3C7',
      borderRadius: 8,
      padding: 10,
      marginTop: 6,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: '#F59E0B',
    },
    managerRemarksLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: '#92400E',
      marginBottom: 2,
    },
    managerRemarksText: {
      fontSize: 13,
      color: '#78350F',
    },
    receiptContainer: {
      marginTop: 8,
      alignItems: 'flex-start',
    },
    receiptLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    receiptThumbnail: {
      width: 60,
      height: 60,
      borderRadius: 8,
    },
    cardActionsRow: {
      marginTop: 12,
    },
    updateCardBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 9,
      backgroundColor: theme.colors.primary + '10',
    },
    updateCardBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    statusManagerCardBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      paddingVertical: 10,
      backgroundColor: theme.colors.primary,
      elevation: 2,
    },
    statusManagerCardBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    customModalHeader: {
      width: '100%',
      backgroundColor: theme.colors.primary,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3.84,
    },
    customModalHeaderContent: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
    },
    modalHeaderIconBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    modalHeaderTitleContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 8,
    },
    customModalHeaderTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalHeaderTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.text,
      marginRight: 12,
    },
    closeModalBtn: {
      padding: 6,
    },
    modalScrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    modalCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
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
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
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
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    textArea: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 14,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      minHeight: 80,
    },
    readOnlyBox: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 12,
      backgroundColor: theme.colors.background + '80',
      minHeight: 50,
      justifyContent: 'center',
    },
    readOnlyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    uploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#CA8A04',
      borderStyle: 'dashed',
      borderRadius: 10,
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
    receiptAttachedText: {
      fontSize: 13,
      color: theme.colors.text,
      marginRight: 10,
    },
    removeReceiptBtn: {
      padding: 4,
    },
    modalActionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 20,
      marginBottom: 10,
    },
    actionBtn: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 13,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
    },
    submitBtn: {
      backgroundColor: theme.colors.primary,
    },
    submitText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    statusModalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    statusModalBg: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    statusModalSheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 34,
    },
    modalSheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 14,
    },
    statusModalTitle: {
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 14,
    },
    managerSummaryBox: {
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    summaryRefText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.text,
    },
    summaryAmountText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
      marginTop: 4,
    },
    saveManagerStatusBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      marginTop: 18,
      elevation: 3,
    },
    saveManagerStatusBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    statusTabPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      marginRight: 6,
    },
    statusTabPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
  });

export default CRMPromotionalRequestScreen;
