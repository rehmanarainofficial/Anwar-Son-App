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
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { useTheme } from '@config/useTheme';
import { CustomDatePicker, SearchableDropdown, DateFilter } from '@components/common';
import { formatToAsiaDateTime } from '../../utils/dateUtils';
import {
  useGetHospitalMutation,
  useGetHospitalContactsMutation,
  useGetCityDropdownMutation,
  useGetStockMasterMainDropdownMutation,
  useGetDepartmentDropdownMutation,
  useGetSurgicalSpecialityDropdownMutation,
  useGetSampleDataMutation,
  usePostSampleDataMutation,
} from '@api/baseApi';

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

const STATUS_OPTIONS = [
  { id: '1', name: 'Draft' },
  { id: '2', name: 'Submit for Approval' },
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

const CRMSampleRequestScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const user = useSelector(state => state.auth.user);

  const isRole3 = String(user?.role_id) === '3';

  // Route Status Filter Initializer
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
  const [sampleList, setSampleList] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Date Filter State (Default 1 Month Range)
  const initialDates = getInitialFilterDates();
  const [fromDate, setFromDate] = useState(initialDates.from);
  const [toDate, setToDate] = useState(initialDates.to);

  // Main Form Modal State (Add / Edit)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formId, setFormId] = useState(0);

  // Form Field States
  const [basicInfo, setBasicInfo] = useState({
    hospital: null,
    hospitalContact: null,
    salesRegion: null,
    department: null,
    surgicalSpecialty: null,
  });

  const emptyProduct = {
    product: null,
    quantity: '',
  };
  const [products, setProducts] = useState([{ ...emptyProduct }]);
  const [remarks, setRemarks] = useState('');
  const [selectedStatusId, setSelectedStatusId] = useState(isRole3 ? '1' : '3');
  const [managerRemarks, setManagerRemarks] = useState('');

  // Dedicated Manager Status Modal State
  const [isManagerStatusModalVisible, setIsManagerStatusModalVisible] = useState(false);
  const [selectedManagerItem, setSelectedManagerItem] = useState(null);
  const [managerStatusId, setManagerStatusId] = useState('3');
  const [managerRemarksText, setManagerRemarksText] = useState('');
  const [isManagerSubmitting, setIsManagerSubmitting] = useState(false);

  // API Hooks
  const [getSampleData, { isLoading: dataLoading }] = useGetSampleDataMutation();
  const [getHospital, { data: hospRes, isLoading: hospLoading }] = useGetHospitalMutation();
  const [getHospitalContacts, { data: contactRes, isLoading: contactLoading }] = useGetHospitalContactsMutation();
  const [getCityDropdown, { data: cityRes }] = useGetCityDropdownMutation();
  const [getStockMasterMain, { data: stockRes, isLoading: stockLoading }] = useGetStockMasterMainDropdownMutation();
  const [getDepartment, { data: deptRes }] = useGetDepartmentDropdownMutation();
  const [getSurgicalSpecialty, { data: surgicalRes }] = useGetSurgicalSpecialityDropdownMutation();
  const [postSampleData, { isLoading: isSubmitting }] = usePostSampleDataMutation();

  // Header options with (+) button on the right
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Sample Request',
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

  // Load Sample List Data
  const loadSampleData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const payload = {
        user_id: user.id,
        role_id: user?.role_id || '2',
      };
      if (fromDate) {
        payload.from_date = formatToYYYYMMDD(fromDate);
      }
      if (toDate) {
        payload.to_date = formatToYYYYMMDD(toDate);
      }

      const res = await getSampleData(payload).unwrap();

      let list = [];
      if (res && (res.status === 'true' || res.status === true)) {
        if (Array.isArray(res.data)) {
          list = res.data;
        } else if (res.data && Array.isArray(res.data.samples)) {
          list = res.data.samples;
        }
      }
      setSampleList(list);
    } catch (error) {
      console.log('Error loading sample data:', error);
      setSampleList([]);
    }
  }, [user?.id, user?.role_id, fromDate, toDate, getSampleData]);

  useEffect(() => {
    loadSampleData();
  }, [loadSampleData]);

  useEffect(() => {
    if (user?.id) {
      getHospital({ id: user.id });
      getCityDropdown({ id: user.id });
      getStockMasterMain({});
      getDepartment({});
      getSurgicalSpecialty({});
    }
  }, [
    user?.id,
    getHospital,
    getCityDropdown,
    getStockMasterMain,
    getDepartment,
    getSurgicalSpecialty,
  ]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSampleData();
    setIsRefreshing(false);
  };

  const handleHospitalSelect = item => {
    setBasicInfo(prev => ({
      ...prev,
      hospital: item.debtor_no,
      hospitalContact: null,
      salesRegion: null,
      department: null,
      surgicalSpecialty: null,
    }));
    getHospitalContacts({ hospital_id: item.debtor_no, user_id: user?.id });
  };

  const handleContactSelect = item => {
    setBasicInfo(prev => ({
      ...prev,
      hospitalContact: item.id,
      salesRegion: item.city || prev.salesRegion,
      department: item.department || prev.department,
      surgicalSpecialty: item.surgical_speciality || prev.surgicalSpecialty,
    }));

    if (item.city) {
      getCityDropdown({ id: user?.id, city: item.city });
    }
    if (item.department) {
      getDepartment({ department: item.department });
    }
    if (item.surgical_speciality) {
      getSurgicalSpecialty({ surgical_speciality: item.surgical_speciality });
    }
  };

  const updateProductField = (index, key, value) => {
    setProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const addProduct = () => {
    setProducts(prev => [...prev, { ...emptyProduct }]);
  };

  const removeProduct = index => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const openFormModal = (mode = 'add', item = null) => {
    setFormMode(mode);
    if (mode === 'update' && item) {
      setFormId(item.id || 0);
      setBasicInfo({
        hospital: item.hospital_id || item.hospital || null,
        hospitalContact: item.contact_id || item.contact || null,
        salesRegion: item.city || null,
        department: item.department || null,
        surgicalSpecialty: item.surgical_speciality || null,
      });
      setRemarks(item.comments || item.remarks || '');
      setSelectedStatusId(String(item.status_id || (isRole3 ? '1' : '3')));
      setManagerRemarks(item.manager_remarks || '');

      if (Array.isArray(item.purch_order_details) && item.purch_order_details.length > 0) {
        setProducts(
          item.purch_order_details.map(p => ({
            product: p.item_code || p.stock_id || null,
            quantity: String(p.quantity_ordered || p.qty || '1'),
          })),
        );
      } else {
        setProducts([{ ...emptyProduct }]);
      }
      if (item.hospital_id || item.hospital) {
        getHospitalContacts({ hospital_id: item.hospital_id || item.hospital, user_id: user?.id });
      }
    } else {
      setFormId(0);
      setBasicInfo({
        hospital: null,
        hospitalContact: null,
        salesRegion: null,
        department: null,
        surgicalSpecialty: null,
      });
      setProducts([{ ...emptyProduct }]);
      setRemarks('');
      setSelectedStatusId(isRole3 ? '1' : '3');
      setManagerRemarks('');
    }
    setIsModalVisible(true);
  };

  const openManagerStatusModal = item => {
    setSelectedManagerItem(item);
    setManagerStatusId(String(item.status_id || '3'));
    setManagerRemarksText(item.manager_remarks || '');
    setIsManagerStatusModalVisible(true);
  };

  const handleSaveManagerStatus = async () => {
    if (!selectedManagerItem) return;
    try {
      setIsManagerSubmitting(true);
      const payload = {
        company: 'CRM',
        id: String(selectedManagerItem.id || '0'),
        status_id: String(managerStatusId),
        manager_remarks: managerRemarksText,
        user_id: user?.id || '',
        role_id: String(user?.role_id || '2'),
      };

      const res = await postSampleData(payload).unwrap();
      setIsManagerSubmitting(false);

      if (res && (res.status === 'true' || res.status === true)) {
        Toast.show({
          type: 'success',
          text1: 'Status Updated',
          text2: 'Sample request status updated successfully!',
        });
        setIsManagerStatusModalVisible(false);
        setSelectedManagerItem(null);
        loadSampleData();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: res?.message || 'Failed to update status.',
        });
      }
    } catch (error) {
      console.log('Error updating manager status:', error);
      setIsManagerSubmitting(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update status.',
      });
    }
  };

  const handleSubmit = async () => {
    if (!basicInfo.hospital) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a hospital.',
      });
      return;
    }

    if (!basicInfo.hospitalContact) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a hospital contact.',
      });
      return;
    }

    const invalidProduct = products.find(p => !p.product || !p.quantity);
    if (invalidProduct) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please ensure all items have a product and quantity specified.',
      });
      return;
    }

    const todayStr = formatToYYYYMMDD(new Date());

    const purchOrderDetails = products.map(p => {
      const selectedProduct = stockRes?.data?.find(
        s => s.stock_id === p.product,
      );
      return {
        item_code: p.product,
        quantity_ordered: p.quantity || '1',
        unit_price: selectedProduct?.price || '2000',
      };
    });

    const hospitalName =
      hospRes?.data?.find(
        h => String(h.debtor_no) === String(basicInfo.hospital),
      )?.name || basicInfo.hospital;
    const contactPerson =
      contactRes?.data?.find(
        c => String(c.id) === String(basicInfo.hospitalContact),
      )?.person_name || basicInfo.hospitalContact;
    const cityName =
      cityRes?.data?.find(c => String(c.id) === String(basicInfo.salesRegion))
        ?.cityname || basicInfo.salesRegion;
    const departmentName =
      deptRes?.data?.find(
        d => String(d.sales_code) === String(basicInfo.department),
      )?.description || basicInfo.department;
    const surgicalSpecialtyName =
      surgicalRes?.data?.find(
        s => String(s.id) === String(basicInfo.surgicalSpecialty),
      )?.description || basicInfo.surgicalSpecialty;

    const payload = {
      company: 'CRM',
      id: String(formId || '0'),
      person_id: user?.person_id || user?.id || '1',
      user_id: user?.id || '',
      role_id: String(user?.role_id || '2'),
      branch_code: user?.branch_code || '',
      ord_date: todayStr,
      hospital_name: hospitalName || '',
      contact_person: contactPerson || '',
      city: cityName || '',
      department: departmentName || '',
      surgical_speciality: surgicalSpecialtyName || '',
      comments: remarks || '',
      status_id: String(selectedStatusId),
      purch_order_details: purchOrderDetails,
    };

    if (!isRole3 && managerRemarks) {
      payload.manager_remarks = managerRemarks;
    }

    try {
      const response = await postSampleData(payload).unwrap();
      if (String(response.status) === 'true' || response.status === true) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: formMode === 'add' ? 'Sample request submitted successfully!' : 'Sample request updated successfully!',
        });
        setIsModalVisible(false);
        loadSampleData();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Submission failed.',
        });
      }
    } catch (err) {
      console.error('Submit sample request error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred during submission.',
      });
    }
  };

  const renderStatusBadge = statusId => {
    const config = STATUS_MAP[String(statusId)] || {
      label: 'Draft',
      bg: '#FEF3C7',
      text: '#92400E',
    };
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
        <Text style={[styles.statusBadgeText, { color: config.text }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  const renderCardItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.referenceContainer}>
            <Icon name="flask-outline" size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.referenceText}>{item.reference || item.ord_no || `SAMPLE-${item.id}`}</Text>
          </View>
          <View style={styles.headerRightRow}>
            {renderStatusBadge(item.status_id)}
            <Text style={styles.cardDateText}>{formatToAsiaDateTime(item.ord_date || item.created_at, false)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Icon name="business-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Hospital:</Text>
          <Text style={styles.infoValue}>{item.hospital_name || item.hospital || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="person-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Contact:</Text>
          <Text style={styles.infoValue}>{item.contact_person || item.contact || 'N/A'}</Text>
        </View>

        {(item.created_by_name || item.salesman || item.created_by) ? (
          <View style={styles.infoRow}>
            <Icon name="person-circle-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Created By:</Text>
            <Text style={[styles.infoValue, { fontWeight: '700' }]}>{item.created_by_name || item.salesman || item.created_by}</Text>
          </View>
        ) : null}

        {item.department ? (
          <View style={styles.infoRow}>
            <Icon name="git-network-outline" size={16} color={theme.colors.textSecondary} style={styles.infoIcon} />
            <Text style={styles.infoLabel}>Department:</Text>
            <Text style={styles.infoValue}>{item.department}</Text>
          </View>
        ) : null}

        {item.comments || item.remarks ? (
          <View style={styles.remarksBox}>
            <Text style={styles.remarksLabel}>Comments:</Text>
            <Text style={styles.remarksText}>{item.comments || item.remarks}</Text>
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

  const filteredSampleList = sampleList.filter(item => {
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
          onFilter={loadSampleData}
        />
      </View>

      {/* Main Content: List of Sample Cards */}
      {dataLoading && !isRefreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>Loading sample requests...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSampleList}
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
              <Icon name="flask-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Sample Requests</Text>
              <Text style={styles.emptySubtext}>
                Tap the (+) icon in the top right header to add a new sample request.
              </Text>
              <TouchableOpacity
                style={styles.addFirstBtn}
                onPress={() => openFormModal('add')}
                activeOpacity={0.8}
              >
                <Icon name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.addFirstBtnText}>Add Sample Request</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Add / Edit Form Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>
              {formMode === 'add' ? 'Add Sample Request' : 'Edit Sample Request'}
            </Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.modalCloseBtn}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            {/* Hospital & Contact */}
            <View style={styles.sectionCard}>
              <SearchableDropdown
                label="Hospital"
                placeholder="Select Hospital"
                data={hospRes?.data || []}
                selectedId={basicInfo.hospital}
                onSelect={handleHospitalSelect}
                isLoading={hospLoading}
                idKey="debtor_no"
                labelKey="name"
                iconName="business-outline"
              />

              <SearchableDropdown
                label="Hospital Contact"
                placeholder="Select Contact Person"
                data={contactRes?.data || []}
                selectedId={basicInfo.hospitalContact}
                onSelect={handleContactSelect}
                isLoading={contactLoading}
                idKey="id"
                labelKey="person_name"
                iconName="person-outline"
                disabled={!basicInfo.hospital}
              />
            </View>

            {/* Products Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionCardTitle}>Product Details</Text>
                <TouchableOpacity style={styles.addProductBtn} onPress={addProduct}>
                  <Icon name="add-circle-outline" size={18} color={theme.colors.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.addProductBtnText}>Add Product</Text>
                </TouchableOpacity>
              </View>

              {products.map((item, index) => (
                <View key={index} style={styles.productCard}>
                  <View style={styles.productHeaderRow}>
                    <Text style={styles.productItemLabel}>Item #{index + 1}</Text>
                    {products.length > 1 && (
                      <TouchableOpacity onPress={() => removeProduct(index)}>
                        <Icon name="trash-outline" size={18} color={theme.colors.error || '#EF4444'} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <SearchableDropdown
                    label="Select Product"
                    placeholder="Search Product"
                    data={stockRes?.data || []}
                    selectedId={item.product}
                    onSelect={selected => updateProductField(index, 'product', selected.stock_id)}
                    isLoading={stockLoading}
                    idKey="stock_id"
                    labelKey="description"
                    iconName="cube-outline"
                  />

                  <View style={styles.inputContainer}>
                    <Text style={styles.fieldLabel}>Quantity</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter quantity"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="numeric"
                      value={item.quantity}
                      onChangeText={val => updateProductField(index, 'quantity', val)}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Comments & Status */}
            <View style={styles.sectionCard}>
              <View style={styles.inputContainer}>
                <Text style={styles.fieldLabel}>Comments / Remarks</Text>
                <TextInput
                  style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
                  placeholder="Enter comments..."
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  value={remarks}
                  onChangeText={setRemarks}
                />
              </View>

              <SearchableDropdown
                label="Status"
                placeholder="Select Status"
                data={STATUS_OPTIONS}
                selectedId={selectedStatusId}
                onSelect={item => setSelectedStatusId(item.id)}
                idKey="id"
                labelKey="name"
                iconName="flag-outline"
              />

              {!isRole3 && (
                <View style={styles.inputContainer}>
                  <Text style={styles.fieldLabel}>Manager Remarks</Text>
                  <TextInput
                    style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
                    placeholder="Enter manager remarks..."
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    value={managerRemarks}
                    onChangeText={setManagerRemarks}
                  />
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {formMode === 'add' ? 'Submit Sample Request' : 'Update Sample Request'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Dedicated Manager Status Modal */}
      <Modal
        visible={isManagerStatusModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsManagerStatusModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.statusModalOverlay}
          activeOpacity={1}
          onPress={() => setIsManagerStatusModalVisible(false)}
        >
          <View style={styles.statusModalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalSheetHandle} />
            <Text style={styles.statusModalTitle}>Update Manager Status</Text>

            {selectedManagerItem ? (
              <View style={styles.managerSummaryBox}>
                <Text style={styles.summaryRefText}>
                  {selectedManagerItem.reference || `SAMPLE-${selectedManagerItem.id}`}
                </Text>
                <Text style={styles.summaryAmountText}>
                  {selectedManagerItem.hospital_name || selectedManagerItem.hospital || 'Hospital'}
                </Text>
              </View>
            ) : null}

            <SearchableDropdown
              label="Select Status"
              placeholder="Choose Status"
              data={STATUS_OPTIONS}
              selectedId={managerStatusId}
              onSelect={item => setManagerStatusId(String(item.id))}
              idKey="id"
              labelKey="name"
              iconName="flag-outline"
            />

            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Manager Remarks</Text>
              <TextInput
                style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Enter remarks..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                value={managerRemarksText}
                onChangeText={setManagerRemarksText}
              />
            </View>

            <TouchableOpacity
              style={styles.saveManagerStatusBtn}
              onPress={handleSaveManagerStatus}
              disabled={isManagerSubmitting}
              activeOpacity={0.8}
            >
              {isManagerSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveManagerStatusBtnText}>Save Status</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loaderText: {
      marginTop: 10,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    listContent: {
      padding: 16,
      paddingBottom: 80,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
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
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.text,
    },
    headerRightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '800',
    },
    cardDateText: {
      fontSize: 11,
      fontWeight: '600',
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
    infoIcon: {
      marginRight: 8,
    },
    infoLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginRight: 6,
    },
    infoValue: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    remarksBox: {
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      padding: 10,
      marginTop: 4,
      marginBottom: 8,
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
      fontSize: 12,
      color: theme.colors.text,
    },
    managerRemarksBox: {
      backgroundColor: '#EFF6FF',
      borderRadius: 10,
      padding: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#BFDBFE',
    },
    managerRemarksLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: '#1E40AF',
      marginBottom: 2,
    },
    managerRemarksText: {
      fontSize: 12,
      color: '#1E3A8A',
    },
    cardActionsRow: {
      marginTop: 6,
    },
    updateCardBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary + '15',
      borderColor: theme.colors.primary,
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 8,
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
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      paddingVertical: 8,
    },
    statusManagerCardBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 24,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.text,
      marginTop: 12,
      marginBottom: 6,
    },
    emptySubtext: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    addFirstBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
    },
    addFirstBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    modalHeaderTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.text,
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalScrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    sectionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionCardTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.text,
    },
    addProductBtn: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    addProductBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    productCard: {
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    productHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    productItemLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    inputContainer: {
      marginBottom: 12,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 6,
    },
    textInput: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 13,
      color: theme.colors.text,
    },
    submitBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      elevation: 2,
    },
    submitBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
    // Manager Status Modal Sheet
    statusModalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    statusModalSheet: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 34,
    },
    modalSheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
      alignSelf: 'center',
      marginBottom: 14,
    },
    statusModalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.text,
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

export default CRMSampleRequestScreen;
