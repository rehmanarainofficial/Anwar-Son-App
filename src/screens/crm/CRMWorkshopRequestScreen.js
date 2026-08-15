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
  useGetStockCategoryMutation,
  useGetWorkshopDataMutation,
  usePostWorkshopDataMutation,
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

// Workshop Options
const WORKSHOP_TYPES = [
  { id: '1', name: 'Educational' },
  { id: '2', name: 'Product Demonstration' },
  { id: '3', name: 'Hands-on Training' },
  { id: '4', name: 'Other' },
];

const PRODUCT_SEGMENTS = [
  { id: '1', name: 'Sutures' },
  { id: '2', name: 'Airway Management' },
  { id: '3', name: 'Haemostats' },
  { id: '4', name: 'Mesh' },
  { id: '5', name: 'Other' },
];

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

const DEFAULT_AUDIENCE = [
  { audience: 'HOD / KOLs', expected: '0' },
  { audience: 'APs / SRs', expected: '0' },
  { audience: 'OT / Nurses', expected: '0' },
  { audience: 'Interns / Students', expected: '0' },
  { audience: 'Other', expected: '0' },
];

const DEFAULT_BUDGET = [
  { budget_item: 'Refreshment', unit_cost: '0', qty: '0' },
  { budget_item: 'Hands-on Material', unit_cost: '0', qty: '0' },
  { budget_item: 'Equipment Rental', unit_cost: '0', qty: '0' },
  { budget_item: 'Other', unit_cost: '0', qty: '0' },
];

const CRMWorkshopRequestScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const user = useSelector(state => state.auth.user);

  const isRole3 = String(user?.role_id) === '3';

  // List Data State
  const [workshopList, setWorkshopList] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Main Form Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formId, setFormId] = useState(0);

  // Form Fields
  const [title, setTitle] = useState('');
  const [requestDate, setRequestDate] = useState(formatToYYYYMMDD(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [venue, setVenue] = useState('');
  const [hospitalDepart, setHospitalDepart] = useState('');
  const [workshopType, setWorkshopType] = useState('1');
  const [productSegment, setProductSegment] = useState('1');
  const [objectives, setObjectives] = useState('');
  const [selectedStatusId, setSelectedStatusId] = useState(isRole3 ? '1' : '3');
  const [managerRemarks, setManagerRemarks] = useState('');

  // Dynamic Array States
  const [keyProducts, setKeyProducts] = useState([
    { prod_category: '', size_code: '', purpose: '', qty: '1' },
  ]);
  const [audienceList, setAudienceList] = useState(DEFAULT_AUDIENCE);
  const [materialsList, setMaterialsList] = useState([
    { material_agenda: '', size_qty: '1', agenda: '', time: '10:00:00' },
  ]);
  const [budgetList, setBudgetList] = useState(DEFAULT_BUDGET);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manager Status Modal State
  const [isManagerStatusModalVisible, setIsManagerStatusModalVisible] = useState(false);
  const [selectedManagerItem, setSelectedManagerItem] = useState(null);
  const [managerStatusId, setManagerStatusId] = useState('3');
  const [managerRemarksText, setManagerRemarksText] = useState('');
  const [isManagerSubmitting, setIsManagerSubmitting] = useState(false);

  // API Hooks
  const [getWorkshopData, { isLoading: dataLoading }] = useGetWorkshopDataMutation();
  const [getHospital, { data: hospRes, isLoading: hospLoading }] = useGetHospitalMutation();
  const [getStockCategory, { data: stockCatRes, isLoading: stockCatLoading }] = useGetStockCategoryMutation();
  const [postWorkshopData] = usePostWorkshopDataMutation();

  // Header options with (+) button on the right
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Workshop Request',
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

  // Load Workshop List Data
  const loadWorkshopData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await getWorkshopData({
        user_id: user.id,
        role_id: user?.role_id || '2',
      }).unwrap();

      let list = [];
      if (res && (res.status === 'true' || res.status === true)) {
        if (res.data && Array.isArray(res.data.workshops)) {
          list = res.data.workshops;
        } else if (Array.isArray(res.data)) {
          list = res.data;
        }
      }
      setWorkshopList(list);
    } catch (error) {
      console.log('Error loading workshop data:', error);
      setWorkshopList([]);
    }
  }, [user?.id, user?.role_id, getWorkshopData]);

  useEffect(() => {
    loadWorkshopData();
  }, [loadWorkshopData]);

  useEffect(() => {
    if (user?.id) {
      getHospital({ id: user.id });
      getStockCategory({ user_id: user.id });
    }
  }, [user?.id, getHospital, getStockCategory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWorkshopData();
    setIsRefreshing(false);
  };

  // Open Main Form Modal
  const openFormModal = async (mode, item = null) => {
    setFormMode(mode);
    if (mode === 'update' && item) {
      setFormId(item.id || 0);
      setTitle(item.title || '');
      setRequestDate(formatToYYYYMMDD(item.date || item.tran_date || new Date()));
      setSelectedHospitalId(item.hospital_id || null);
      setVenue(item.venue || '');
      setHospitalDepart(item.hospital_depart || '');
      setWorkshopType(String(item.workshop_type || '1'));
      setProductSegment(String(item.product_segment || '1'));
      setObjectives(item.objectives || '');
      setSelectedStatusId(String(item.status_id || (isRole3 ? '1' : '3')));
      setManagerRemarks(item.manager_remarks || '');

      setIsModalVisible(true);

      // Fetch detail record by id
      try {
        const detailRes = await getWorkshopData({
          user_id: user?.id,
          role_id: user?.role_id || '2',
          id: item.id,
        }).unwrap();

        if (detailRes && (detailRes.status === 'true' || detailRes.status === true) && detailRes.data) {
          let d = detailRes.data;
          if (d && Array.isArray(d.workshops) && d.workshops.length > 0) {
            d = d.workshops[0];
          }
          setFormId(d.id || item.id);
          if (d.title !== undefined) setTitle(d.title);
          if (d.date) setRequestDate(formatToYYYYMMDD(d.date));
          if (d.hospital_id) setSelectedHospitalId(d.hospital_id);
          if (d.venue !== undefined) setVenue(d.venue);
          if (d.hospital_depart !== undefined) setHospitalDepart(d.hospital_depart);
          if (d.workshop_type !== undefined) setWorkshopType(String(d.workshop_type));
          if (d.product_segment !== undefined) setProductSegment(String(d.product_segment));
          if (d.objectives !== undefined) setObjectives(d.objectives);
          if (d.status_id !== undefined) setSelectedStatusId(String(d.status_id));
          if (d.manager_remarks !== undefined) setManagerRemarks(d.manager_remarks || '');

          if (Array.isArray(d.key_products)) {
            setKeyProducts(d.key_products.map((kp, i) => ({ ...kp, id: kp.id || (Date.now() + i) })));
          } else if (typeof d.key_products === 'string') {
            try { setKeyProducts(JSON.parse(d.key_products).map((kp, i) => ({ ...kp, id: kp.id || (Date.now() + i) }))); } catch (e) {}
          }

          if (Array.isArray(d.audience)) {
            setAudienceList(d.audience);
          } else if (typeof d.audience === 'string') {
            try { setAudienceList(JSON.parse(d.audience)); } catch (e) {}
          }

          const mats = d.material_agenda || d.materials;
          if (Array.isArray(mats)) {
            setMaterialsList(mats.map((mat, i) => ({ ...mat, id: mat.id || (Date.now() + i + 100) })));
          } else if (typeof mats === 'string') {
            try { setMaterialsList(JSON.parse(mats).map((mat, i) => ({ ...mat, id: mat.id || (Date.now() + i + 100) }))); } catch (e) {}
          }

          if (Array.isArray(d.budget)) {
            setBudgetList(d.budget);
          } else if (typeof d.budget === 'string') {
            try { setBudgetList(JSON.parse(d.budget)); } catch (e) {}
          }
        }
      } catch (err) {
        console.log('Error fetching workshop details:', err);
      }
    } else {
      // New Add
      setFormId(0);
      setTitle('');
      setRequestDate(formatToYYYYMMDD(new Date()));
      setSelectedHospitalId(null);
      setVenue('');
      setHospitalDepart('');
      setWorkshopType('1');
      setProductSegment('1');
      setObjectives('');
      setSelectedStatusId(isRole3 ? '1' : '3');
      setManagerRemarks('');
      setKeyProducts([{ id: Date.now(), prod_category: '', size_code: '', purpose: '', qty: '1' }]);
      setAudienceList(DEFAULT_AUDIENCE);
      setMaterialsList([{ id: Date.now() + 100, material_agenda: '', size_qty: '1', agenda: '', time: '10:00:00' }]);
      setBudgetList(DEFAULT_BUDGET);
      setIsModalVisible(true);
    }
  };

  // Open Dedicated Manager Status Modal
  const openManagerStatusModal = item => {
    setSelectedManagerItem(item);
    setManagerStatusId(String(item.status_id || '3'));
    setManagerRemarksText(item.manager_remarks || '');
    setIsManagerStatusModalVisible(true);
  };

  // Dynamic Handlers
  const addKeyProductRow = () => {
    setKeyProducts(prev => [
      ...prev,
      { id: Date.now() + Math.random(), prod_category: '', size_code: '', purpose: '', qty: '1' },
    ]);
  };

  const removeKeyProductRow = index => {
    if (keyProducts.length <= 1) return;
    setKeyProducts(prev => prev.filter((_, i) => i !== index));
  };

  const updateKeyProduct = (index, field, value) => {
    setKeyProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMaterialRow = () => {
    setMaterialsList(prev => [
      ...prev,
      { id: Date.now() + Math.random(), material_agenda: '', size_qty: '1', agenda: '', time: '10:00:00' },
    ]);
  };

  const removeMaterialRow = index => {
    if (materialsList.length <= 1) return;
    setMaterialsList(prev => prev.filter((_, i) => i !== index));
  };

  const updateMaterial = (index, field, value) => {
    setMaterialsList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const updateAudience = (index, expected) => {
    setAudienceList(prev => {
      const updated = [...prev];
      updated[index].expected = expected;
      return updated;
    });
  };

  const updateBudget = (index, field, val) => {
    setBudgetList(prev => {
      const updated = [...prev];
      updated[index][field] = val;
      return updated;
    });
  };

  // Save Form Handler
  const handleSaveForm = async () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter Workshop Title.' });
      return;
    }
    if (!selectedHospitalId) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please select a Hospital.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        company: 'CRM',
        id: formId,
        title: title,
        date: requestDate,
        hospital_id: selectedHospitalId || '',
        venue: venue,
        hospital_depart: hospitalDepart,
        workshop_type: workshopType,
        product_segment: productSegment,
        objectives: objectives,
        key_products: keyProducts,
        audience: audienceList,
        materials: materialsList,
        budget: budgetList,
        status_id: selectedStatusId || (isRole3 ? '1' : '3'),
        user_id: user?.id || '',
        role_id: user?.role_id || '2',
        manager_remarks: isRole3 ? (formMode === 'update' ? managerRemarks : null) : managerRemarks,
      };

      const response = await postWorkshopData(payload).unwrap();

      if (response && (response.status === 'true' || response.status === true)) {
        Toast.show({
          type: 'success',
          text1: formMode === 'update' ? 'Workshop Updated' : 'Workshop Saved',
          text2: response.message || 'Workshop request processed successfully.',
        });
        setIsModalVisible(false);
        loadWorkshopData();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Action Failed',
          text2: response?.message || 'Failed to save workshop request.',
        });
      }
    } catch (error) {
      console.log('Error posting workshop data:', error);
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
        title: selectedManagerItem.title || '',
        date: selectedManagerItem.date || selectedManagerItem.tran_date || '',
        hospital_id: selectedManagerItem.hospital_id || '',
        venue: selectedManagerItem.venue || '',
        hospital_depart: selectedManagerItem.hospital_depart || '',
        workshop_type: selectedManagerItem.workshop_type || '',
        product_segment: selectedManagerItem.product_segment || '',
        objectives: selectedManagerItem.objectives || '',
        key_products: selectedManagerItem.key_products || [],
        audience: selectedManagerItem.audience || [],
        materials: selectedManagerItem.materials || [],
        budget: selectedManagerItem.budget || [],
        status_id: managerStatusId,
        user_id: user?.id || '',
        role_id: user?.role_id || '2',
        manager_remarks: managerRemarksText,
      };

      const response = await postWorkshopData(payload).unwrap();

      if (response && (response.status === 'true' || response.status === true)) {
        Toast.show({
          type: 'success',
          text1: 'Status Updated',
          text2: response.message || 'Workshop status updated successfully.',
        });
        setIsManagerStatusModalVisible(false);
        loadWorkshopData();
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

  // Options
  const hospitalList = (hospRes && (hospRes.data || Array.isArray(hospRes))) ? (Array.isArray(hospRes) ? hospRes : hospRes.data) : [];
  const hospitalOptions = hospitalList.map(h => ({
    id: String(h.id || h.debtor_no || h.hospital_id || ''),
    name: h.name || h.hospital_name || h.title || 'Hospital',
  }));

  const stockCategoryList = (stockCatRes && (stockCatRes.data || Array.isArray(stockCatRes))) ? (Array.isArray(stockCatRes) ? stockCatRes : stockCatRes.data) : [];
  const productCategoryOptions = stockCategoryList.map(c => ({
    id: String(c.category_id || c.id || ''),
    name: c.description || c.name || 'Category',
  }));

  const renderStatusBadge = statusId => {
    const info = STATUS_MAP[String(statusId)] || { label: 'Draft', bg: '#FEF3C7', text: '#92400E' };
    return (
      <View style={[styles.statusBadge, { backgroundColor: info.bg }]}>
        <Text style={[styles.statusText, { color: info.text }]}>{info.label}</Text>
      </View>
    );
  };

  const renderCardItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.referenceContainer}>
            <Icon name="easel-outline" size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.referenceText}>{item.reference || `WS-${item.id}`}</Text>
          </View>
          <View style={styles.headerRightRow}>
            {renderStatusBadge(item.status_id)}
            <Text style={styles.cardDateText}>{item.date || item.tran_date}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {item.title ? <Text style={styles.cardTitleText}>{item.title}</Text> : null}

        <View style={styles.infoRow}>
          <Icon name="business-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Hospital:</Text>
          <Text style={styles.infoValue}>{item.hospital_name || 'N/A'}</Text>
        </View>

        {item.venue ? (
          <View style={styles.infoRow}>
            <Icon name="location-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Venue:</Text>
            <Text style={styles.infoValue}>{item.venue}</Text>
          </View>
        ) : null}

        {item.hospital_depart ? (
          <View style={styles.infoRow}>
            <Icon name="git-network-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Department:</Text>
            <Text style={styles.infoValue}>{item.hospital_depart}</Text>
          </View>
        ) : null}

        {item.objectives ? (
          <View style={styles.remarksBox}>
            <Text style={styles.remarksLabel}>Objectives:</Text>
            <Text style={styles.remarksText}>{item.objectives}</Text>
          </View>
        ) : null}

        {item.manager_remarks ? (
          <View style={styles.managerRemarksBox}>
            <Text style={styles.managerRemarksLabel}>Manager Remarks:</Text>
            <Text style={styles.managerRemarksText}>{item.manager_remarks}</Text>
          </View>
        ) : null}

        <View style={styles.cardActionsRow}>
          {isRole3 ? (
            <TouchableOpacity
              style={styles.updateCardBtn}
              onPress={() => openFormModal('update', item)}
              activeOpacity={0.7}
            >
              <Icon name="create-outline" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.updateCardBtnText}>Update</Text>
            </TouchableOpacity>
          ) : (
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
      {dataLoading && !isRefreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>Loading workshop requests...</Text>
        </View>
      ) : (
        <FlatList
          data={workshopList}
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
              <Icon name="easel-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Workshop Requests</Text>
              <Text style={styles.emptySubtext}>
                Tap the (+) icon in the top right header to add a new workshop request.
              </Text>
              <TouchableOpacity
                style={styles.addFirstBtn}
                onPress={() => openFormModal('add')}
                activeOpacity={0.8}
              >
                <Icon name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.addFirstBtnText}>Add Workshop Request</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => openFormModal('add')}
        activeOpacity={0.85}
      >
        <Icon name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Main Form Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>
              {formMode === 'update' ? 'Update Workshop Request' : 'Add Workshop Request'}
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
              {/* Workshop Title */}
              <Text style={styles.fieldLabel}>
                Workshop Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Title e.g. New Product Introduction"
                placeholderTextColor={theme.colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />

              {/* Date */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
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
                  onSelect={item => setSelectedHospitalId(item.id || item.debtor_no)}
                  isLoading={hospLoading}
                  iconName="business-outline"
                />
              </View>

              {/* Venue */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Venue</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Venue e.g. Karachi"
                placeholderTextColor={theme.colors.textSecondary}
                value={venue}
                onChangeText={setVenue}
              />

              {/* Department / Specialty Text Input */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Department / Specialty</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Department e.g. Cardio / Surgery"
                placeholderTextColor={theme.colors.textSecondary}
                value={hospitalDepart}
                onChangeText={setHospitalDepart}
              />

              {/* Workshop Type Dropdown */}
              <View style={{ marginTop: 12 }}>
                <SearchableDropdown
                  label="Workshop Type"
                  placeholder="Select Workshop Type..."
                  data={WORKSHOP_TYPES}
                  selectedId={workshopType}
                  onSelect={item => setWorkshopType(item.id)}
                  iconName="easel-outline"
                />
              </View>

              {/* Product Segment Dropdown */}
              <View style={{ marginTop: 12 }}>
                <SearchableDropdown
                  label="Product Segment"
                  placeholder="Select Product Segment..."
                  data={PRODUCT_SEGMENTS}
                  selectedId={productSegment}
                  onSelect={item => setProductSegment(item.id)}
                  iconName="grid-outline"
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

              {/* Objectives */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Objectives</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Objectives or goals..."
                placeholderTextColor={theme.colors.textSecondary}
                value={objectives}
                onChangeText={setObjectives}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Section: Key Products */}
              <View style={styles.sectionHeaderBox}>
                <Text style={styles.sectionHeaderTitle}>Key Products</Text>
                <TouchableOpacity onPress={addKeyProductRow} style={styles.addRowBtn}>
                  <Icon name="add-circle-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.addRowBtnText}>Add Product</Text>
                </TouchableOpacity>
              </View>

              {keyProducts.map((kp, idx) => (
                <View key={kp.id || `kp_${idx}`} style={styles.dynamicRowCard}>
                  <View style={styles.dynamicRowHeader}>
                    <Text style={styles.dynamicRowTitle}>Product #{idx + 1}</Text>
                    {keyProducts.length > 1 && (
                      <TouchableOpacity onPress={() => removeKeyProductRow(idx)}>
                        <Icon name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <SearchableDropdown
                    label="Product Category"
                    placeholder="Select Product Category..."
                    data={productCategoryOptions}
                    idKey="id"
                    labelKey="name"
                    selectedId={kp.prod_category}
                    onSelect={item => updateKeyProduct(idx, 'prod_category', item.id)}
                    isLoading={stockCatLoading}
                    iconName="cube-outline"
                  />

                  <View style={styles.inlineInputsRow}>
                    <View style={{ flex: 1, marginRight: 6 }}>
                      <Text style={styles.subLabel}>Size Code</Text>
                      <TextInput
                        style={styles.textInputSmall}
                        placeholder="e.g. 2-0"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={kp.size_code}
                        onChangeText={v => updateKeyProduct(idx, 'size_code', v)}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Text style={styles.subLabel}>Qty</Text>
                      <TextInput
                        style={styles.textInputSmall}
                        placeholder="Qty"
                        placeholderTextColor={theme.colors.textSecondary}
                        keyboardType="numeric"
                        value={String(kp.qty)}
                        onChangeText={v => updateKeyProduct(idx, 'qty', v)}
                      />
                    </View>
                  </View>

                  <Text style={[styles.subLabel, { marginTop: 6 }]}>Purpose</Text>
                  <TextInput
                    style={styles.textInputSmall}
                    placeholder="Purpose e.g. Product Demonstration"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={kp.purpose}
                    onChangeText={v => updateKeyProduct(idx, 'purpose', v)}
                  />
                </View>
              ))}

              {/* Section: Audience */}
              <View style={[styles.sectionHeaderBox, { marginTop: 20 }]}>
                <Text style={styles.sectionHeaderTitle}>Audience Breakdown</Text>
              </View>
              {audienceList.map((aud, idx) => (
                <View key={idx} style={styles.audienceRow}>
                  <Text style={styles.audienceLabel}>{aud.audience}</Text>
                  <TextInput
                    style={styles.audienceInput}
                    placeholder="Expected"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                    value={String(aud.expected)}
                    onChangeText={v => updateAudience(idx, v)}
                  />
                </View>
              ))}

              {/* Section: Materials & Agenda */}
              <View style={[styles.sectionHeaderBox, { marginTop: 20 }]}>
                <Text style={styles.sectionHeaderTitle}>Materials & Agenda</Text>
                <TouchableOpacity onPress={addMaterialRow} style={styles.addRowBtn}>
                  <Icon name="add-circle-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.addRowBtnText}>Add Material</Text>
                </TouchableOpacity>
              </View>

              {materialsList.map((mat, idx) => (
                <View key={mat.id || `mat_${idx}`} style={styles.dynamicRowCard}>
                  <View style={styles.dynamicRowHeader}>
                    <Text style={styles.dynamicRowTitle}>Material #{idx + 1}</Text>
                    {materialsList.length > 1 && (
                      <TouchableOpacity onPress={() => removeMaterialRow(idx)}>
                        <Icon name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.subLabel}>Material / Equipment</Text>
                  <TextInput
                    style={styles.textInputSmall}
                    placeholder="e.g. Projector / Demo Kit"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={mat.material_agenda}
                    onChangeText={v => updateMaterial(idx, 'material_agenda', v)}
                  />

                  <View style={styles.inlineInputsRow}>
                    <View style={{ flex: 1, marginRight: 6 }}>
                      <Text style={styles.subLabel}>Qty / Size</Text>
                      <TextInput
                        style={styles.textInputSmall}
                        placeholder="e.g. 1"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={mat.size_qty}
                        onChangeText={v => updateMaterial(idx, 'size_qty', v)}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Text style={styles.subLabel}>Time</Text>
                      <TextInput
                        style={styles.textInputSmall}
                        placeholder="e.g. 10:00:00"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={mat.time}
                        onChangeText={v => updateMaterial(idx, 'time', v)}
                      />
                    </View>
                  </View>

                  <Text style={[styles.subLabel, { marginTop: 6 }]}>Agenda Item</Text>
                  <TextInput
                    style={styles.textInputSmall}
                    placeholder="Agenda e.g. Introduction / Demonstration"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={mat.agenda}
                    onChangeText={v => updateMaterial(idx, 'agenda', v)}
                  />
                </View>
              ))}

              {/* Section: Budget Breakdown */}
              <View style={[styles.sectionHeaderBox, { marginTop: 20 }]}>
                <Text style={styles.sectionHeaderTitle}>Budget Breakdown</Text>
              </View>

              {budgetList.map((bgItem, idx) => (
                <View key={idx} style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>{bgItem.budget_item}</Text>
                  <View style={styles.budgetInputsRow}>
                    <TextInput
                      style={styles.budgetInputSmall}
                      placeholder="Unit Cost"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="numeric"
                      value={String(bgItem.unit_cost)}
                      onChangeText={v => updateBudget(idx, 'unit_cost', v)}
                    />
                    <TextInput
                      style={styles.budgetInputSmall}
                      placeholder="Qty"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="numeric"
                      value={String(bgItem.qty)}
                      onChangeText={v => updateBudget(idx, 'qty', v)}
                    />
                  </View>
                </View>
              ))}

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
                        {formMode === 'update' ? 'Update Workshop Request' : 'Save Workshop Request'}
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
              Update Workshop Status
            </Text>

            {selectedManagerItem ? (
              <View style={styles.managerSummaryBox}>
                <Text style={styles.summaryRefText}>
                  {selectedManagerItem.reference || `WS-${selectedManagerItem.id}`} - {selectedManagerItem.title || selectedManagerItem.hospital_name || 'Workshop'}
                </Text>
                {selectedManagerItem.venue ? (
                  <Text style={styles.summaryAmountText}>Venue: {selectedManagerItem.venue}</Text>
                ) : null}
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
    cardTitleText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 8,
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
    subLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 4,
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
    textInputSmall: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 13,
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
    sectionHeaderBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginBottom: 12,
      marginTop: 14,
    },
    sectionHeaderTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
    },
    addRowBtn: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    addRowBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
      marginLeft: 4,
    },
    dynamicRowCard: {
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dynamicRowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    dynamicRowTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.text,
    },
    inlineInputsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    audienceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    audienceLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
    },
    audienceInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      width: 90,
      textAlign: 'center',
      fontSize: 13,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    budgetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    budgetLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    budgetInputsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    budgetInputSmall: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      width: 80,
      textAlign: 'center',
      fontSize: 13,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
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

export default CRMWorkshopRequestScreen;
