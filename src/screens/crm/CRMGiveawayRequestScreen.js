import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { useTheme } from '@config/useTheme';
import { CustomDatePicker, SearchableDropdown } from '@components/common';
import {
  useGetHospitalMutation,
  useGetCommunityDropdownMutation,
  useGetHospitalContactsMutation,
  useGetGiveawayCategoryDropdownMutation,
  useGetGiveawayDataMutation,
  usePostGiveawayDataMutation,
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

const CRMGiveawayRequestScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const user = useSelector(state => state.auth.user);

  const isRole3 = String(user?.role_id) === '3';

  // List Data State
  const [giveawayList, setGiveawayList] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  const [selectedStockId, setSelectedStockId] = useState(null);
  const [selectedStatusId, setSelectedStatusId] = useState(isRole3 ? '1' : '3');

  const [qtyRequested, setQtyRequested] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [managerRemarks, setManagerRemarks] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manager Status Modal State (For non-role 3 status updates)
  const [isManagerStatusModalVisible, setIsManagerStatusModalVisible] = useState(false);
  const [selectedManagerItem, setSelectedManagerItem] = useState(null);
  const [managerStatusId, setManagerStatusId] = useState('3');
  const [managerRemarksText, setManagerRemarksText] = useState('');
  const [isManagerSubmitting, setIsManagerSubmitting] = useState(false);

  // API Hooks
  const [getGiveawayData, { isLoading: dataLoading }] = useGetGiveawayDataMutation();
  const [getHospital, { data: hospRes, isLoading: hospLoading }] = useGetHospitalMutation();
  const [getCommunityDropdown, { data: commRes, isLoading: commLoading }] = useGetCommunityDropdownMutation();
  const [getHospitalContacts, { data: contactRes, isLoading: contactLoading }] = useGetHospitalContactsMutation();
  const [getGiveawayCategory, { data: stockRes, isLoading: stockLoading }] = useGetGiveawayCategoryDropdownMutation();
  const [postGiveawayData] = usePostGiveawayDataMutation();

  // Header options with (+) button on the right
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Giveaway Request',
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

  // Load Giveaway List Data
  const loadGiveawayData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await getGiveawayData({
        user_id: user.id,
        role_id: user?.role_id || '2',
      }).unwrap();

      if (res && (res.status === 'true' || res.status === true) && Array.isArray(res.data)) {
        setGiveawayList(res.data);
      } else {
        setGiveawayList([]);
      }
    } catch (error) {
      console.log('Error loading giveaway data:', error);
      setGiveawayList([]);
    }
  }, [user?.id, user?.role_id, getGiveawayData]);

  // Initial Data Fetch
  useEffect(() => {
    loadGiveawayData();
  }, [loadGiveawayData]);

  // Load Dropdown Options on mount
  useEffect(() => {
    if (user?.id) {
      getHospital({ id: user.id });
      getCommunityDropdown({});
      getHospitalContacts({ user_id: user.id });
      getGiveawayCategory({});
    }
  }, [user?.id, getHospital, getCommunityDropdown, getHospitalContacts, getGiveawayCategory]);

  // Pull to refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadGiveawayData();
    setIsRefreshing(false);
  };

  // Open Main Form Modal for Add or Edit
  const openFormModal = (mode, item = null) => {
    setFormMode(mode);
    if (mode === 'update' && item) {
      setFormId(item.id || 0);
      setRequestDate(formatToYYYYMMDD(item.tran_date || new Date()));
      setSelectedHospitalId(item.hospital_id || null);
      setSelectedCommunityId(item.community_id || null);
      setSelectedContactId(item.contact_id || null);
      setSelectedStockId(item.stock_id || null);
      setSelectedStatusId(String(item.status_id || (isRole3 ? '1' : '3')));
      setQtyRequested(item.qty_requested ? String(item.qty_requested) : '');
      setUnitPrice(item.unit_price ? String(item.unit_price) : '');
      setAmount(item.amount ? String(item.amount) : '');
      setRemarks(item.remarks || '');
      setManagerRemarks(item.manager_remarks || '');

      getHospitalContacts({
        user_id: user?.id,
        hospital_id: item.hospital_id,
        community_id: item.community_id,
      });
    } else {
      // New Add Mode
      setFormId(0);
      setRequestDate(formatToYYYYMMDD(new Date()));
      setSelectedHospitalId(null);
      setSelectedCommunityId(null);
      setSelectedContactId(null);
      setSelectedStockId(null);
      setSelectedStatusId(isRole3 ? '1' : '3');
      setQtyRequested('');
      setUnitPrice('');
      setAmount('');
      setRemarks('');
      setManagerRemarks('');

      getHospitalContacts({ user_id: user?.id });
    }
    setIsModalVisible(true);
  };

  // Open Dedicated Manager Status Modal
  const openManagerStatusModal = item => {
    setSelectedManagerItem(item);
    setManagerStatusId(String(item.status_id || '3'));
    setManagerRemarksText(item.manager_remarks || '');
    setIsManagerStatusModalVisible(true);
  };

  // When Hospital selection changes
  const handleHospitalSelect = item => {
    const hospId = item.id || item.debtor_no;
    setSelectedHospitalId(hospId);
    setSelectedContactId(null);
    getHospitalContacts({
      user_id: user?.id,
      hospital_id: hospId,
      community_id: selectedCommunityId,
    });
  };

  // When Community selection changes
  const handleCommunitySelect = item => {
    const commId = item.combo_code || item.id;
    setSelectedCommunityId(commId);
    setSelectedContactId(null);
    getHospitalContacts({
      user_id: user?.id,
      hospital_id: selectedHospitalId,
      community_id: commId,
    });
  };

  // Calculate Amount when Qty or Unit Price changes
  const handleQtyChange = val => {
    setQtyRequested(val);
    const q = parseFloat(val) || 0;
    const p = parseFloat(unitPrice) || 0;
    if (q > 0 && p > 0) {
      setAmount((q * p).toFixed(2));
    }
  };

  const handleUnitPriceChange = val => {
    setUnitPrice(val);
    const q = parseFloat(qtyRequested) || 0;
    const p = parseFloat(val) || 0;
    if (q > 0 && p > 0) {
      setAmount((q * p).toFixed(2));
    }
  };

  // Save / Update Handler from Main Form Modal
  const handleSaveForm = async () => {
    if (!selectedHospitalId) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a Hospital.' });
      return;
    }
    if (!selectedStockId) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a Stock/Giveaway Item.' });
      return;
    }
    if (!qtyRequested.trim() || parseFloat(qtyRequested) <= 0) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter valid requested quantity.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        company: 'CRM',
        id: formId,
        tran_date: requestDate,
        hospital_id: selectedHospitalId || '',
        community_id: selectedCommunityId || '',
        contact_id: selectedContactId || '',
        stock_id: selectedStockId || '',
        qty_requested: qtyRequested,
        unit_price: unitPrice || '0',
        remarks: remarks,
        status_id: selectedStatusId || (isRole3 ? '1' : '3'),
        user_id: user?.id || '',
        role_id: user?.role_id || '2',
        manager_remarks: isRole3 ? (formMode === 'update' ? managerRemarks : null) : managerRemarks,
      };

      const response = await postGiveawayData(payload).unwrap();

      if (response && (response.status === 'true' || response.status === true)) {
        Toast.show({
          type: 'success',
          text1: formMode === 'update' ? 'Giveaway Updated' : 'Giveaway Saved',
          text2: response.message || 'Giveaway record processed successfully.',
        });
        setIsModalVisible(false);
        loadGiveawayData();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Action Failed',
          text2: response?.message || 'Failed to save giveaway request.',
        });
      }
    } catch (error) {
      console.log('Error posting giveaway data:', error);
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
      const payload = {
        company: 'CRM',
        id: selectedManagerItem.id,
        tran_date: selectedManagerItem.tran_date,
        hospital_id: selectedManagerItem.hospital_id || '',
        community_id: selectedManagerItem.community_id || '',
        contact_id: selectedManagerItem.contact_id || '',
        stock_id: selectedManagerItem.stock_id || '',
        qty_requested: selectedManagerItem.qty_requested || '',
        unit_price: selectedManagerItem.unit_price || '',
        remarks: selectedManagerItem.remarks || '',
        status_id: managerStatusId,
        user_id: user?.id || '',
        role_id: user?.role_id || '2',
        manager_remarks: managerRemarksText,
      };

      const response = await postGiveawayData(payload).unwrap();

      if (response && (response.status === 'true' || response.status === true)) {
        Toast.show({
          type: 'success',
          text1: 'Status Updated',
          text2: response.message || 'Giveaway status updated successfully.',
        });
        setIsManagerStatusModalVisible(false);
        loadGiveawayData();
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
    name: h.name || h.hospital_name || h.title || 'Hospital',
    debtor_no: h.debtor_no,
  }));

  const communityList = (commRes && (commRes.data || Array.isArray(commRes))) ? (Array.isArray(commRes) ? commRes : commRes.data) : [];
  const contactList = (contactRes && (contactRes.data || Array.isArray(contactRes))) ? (Array.isArray(contactRes) ? contactRes : contactRes.data) : [];
  const stockList = (stockRes && (stockRes.data || Array.isArray(stockRes))) ? (Array.isArray(stockRes) ? stockRes : stockRes.data) : [];
  const stockOptions = stockList.map(st => ({
    id: String(st.id || st.stock_id || st.item_code || ''),
    name: st.description || st.name || st.title || 'Giveaway Item',
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

  // Render Giveaway Card Item
  const renderCardItem = ({ item }) => {
    return (
      <View style={styles.card}>
        {/* Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.referenceContainer}>
            <Icon name="gift-outline" size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.referenceText}>{item.reference || `GAW-${item.id}`}</Text>
          </View>
          <View style={styles.headerRightRow}>
            {renderStatusBadge(item.status_id)}
            <Text style={styles.cardDateText}>{item.tran_date}</Text>
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
            <Icon name="cube-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Qty:</Text>
            <Text style={styles.infoValue}>{parseFloat(item.qty_requested || 0)}</Text>
          </View>

          <View style={[styles.infoRow, { flex: 1 }]}>
            <Icon name="cash-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Unit Price:</Text>
            <Text style={styles.infoValue}>Rs. {parseFloat(item.unit_price || 0).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Icon name="wallet-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Total Amount:</Text>
          <Text style={[styles.infoValue, { fontWeight: '700', color: theme.colors.primary }]}>
            Rs. {parseFloat(item.amount || (parseFloat(item.qty_requested || 0) * parseFloat(item.unit_price || 0))).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>

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

  return (
    <View style={styles.container}>
      {/* Main Content: List of Giveaway Cards */}
      {dataLoading && !isRefreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>Loading giveaway requests...</Text>
        </View>
      ) : (
        <FlatList
          data={giveawayList}
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
              <Icon name="gift-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Giveaway Requests</Text>
              <Text style={styles.emptySubtext}>
                Tap the (+) icon in the top right header to add a new giveaway request.
              </Text>
              <TouchableOpacity
                style={styles.addFirstBtn}
                onPress={() => openFormModal('add')}
                activeOpacity={0.8}
              >
                <Icon name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.addFirstBtnText}>Add Giveaway Request</Text>
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>
              {formMode === 'update' ? 'Update Giveaway Request' : 'Add Giveaway Request'}
            </Text>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={styles.closeModalBtn}
              activeOpacity={0.7}
            >
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
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
                  data={communityList}
                  idKey="combo_code"
                  labelKey="description"
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
                  data={contactList}
                  idKey="id"
                  labelKey="person_name"
                  selectedId={selectedContactId}
                  onSelect={item => setSelectedContactId(item.id)}
                  isLoading={contactLoading}
                  iconName="person-outline"
                />
              </View>

              {/* Stock / Giveaway Item Dropdown */}
              <View style={{ marginTop: 12 }}>
                <SearchableDropdown
                  label="Stock Item"
                  placeholder="Select Giveaway Stock Item..."
                  data={stockOptions}
                  idKey="id"
                  labelKey="name"
                  selectedId={selectedStockId}
                  onSelect={item => setSelectedStockId(item.id)}
                  isLoading={stockLoading}
                  iconName="cube-outline"
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
                  onSelect={item => setSelectedStatusId(item.id)}
                  iconName="flag-outline"
                />
              </View>

              {/* Requested Quantity */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
                Requested Quantity <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Quantity e.g. 5"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                value={qtyRequested}
                onChangeText={handleQtyChange}
              />

              {/* Unit Price */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Unit Price (Rs.)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Unit Price e.g. 100"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                value={unitPrice}
                onChangeText={handleUnitPriceChange}
              />

              {/* Total Amount (Read-only / Auto-calculated) */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Total Amount (Rs.)</Text>
              <View style={styles.readOnlyBox}>
                <Text style={[styles.readOnlyText, { fontWeight: '700', color: theme.colors.primary }]}>
                  {amount ? `Rs. ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Rs. 0.00'}
                </Text>
              </View>

              {/* Remarks Text Input */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Remarks</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Remarks or request details..."
                placeholderTextColor={theme.colors.textSecondary}
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Manager Remarks Input / Readonly View */}
              {isRole3 ? (
                formMode === 'update' && managerRemarks ? (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.fieldLabel}>Manager Remarks</Text>
                    <View style={styles.readOnlyBox}>
                      <Text style={styles.readOnlyText}>{managerRemarks}</Text>
                    </View>
                  </View>
                ) : null
              ) : (
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
                        {formMode === 'update' ? 'Update Giveaway Request' : 'Save Giveaway Request'}
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
              Update Giveaway Status
            </Text>

            {selectedManagerItem ? (
              <View style={styles.managerSummaryBox}>
                <Text style={styles.summaryRefText}>
                  {selectedManagerItem.reference || `GAW-${selectedManagerItem.id}`} - {selectedManagerItem.hospital_name || 'Hospital'}
                </Text>
                <Text style={styles.summaryAmountText}>
                  Qty: {parseFloat(selectedManagerItem.qty_requested || 0)} | Amount: Rs. {parseFloat(selectedManagerItem.amount || (parseFloat(selectedManagerItem.qty_requested || 0) * parseFloat(selectedManagerItem.unit_price || 0))).toLocaleString()}
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
      backgroundColor: theme.colors.background,
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
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.text,
    },
    closeModalBtn: {
      padding: 4,
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
      minHeight: 46,
      justifyContent: 'center',
    },
    readOnlyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
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
  });

export default CRMGiveawayRequestScreen;
