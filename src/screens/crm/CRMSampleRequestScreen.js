import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from 'react';
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
import { SearchableDropdown } from '@components/common';
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

const isUnapproved = status => {
  if (!status) return true;
  const s = String(status).trim().toLowerCase();
  return s === 'un approved' || s === 'unapproved' || s.includes('un');
};

const isApproved = status => {
  if (!status) return false;
  const s = String(status).trim().toLowerCase();
  return s === 'approved';
};

const CRMSampleRequestScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const user = useSelector(state => state.auth.user);

  const [sampleList, setSampleList] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('approved');

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formId, setFormId] = useState(0);

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

  const [getSampleData, { isLoading: dataLoading }] =
    useGetSampleDataMutation();
  const [getHospital, { data: hospRes, isLoading: hospLoading }] =
    useGetHospitalMutation();
  const [getHospitalContacts, { data: contactRes, isLoading: contactLoading }] =
    useGetHospitalContactsMutation();
  const [getCityDropdown, { data: cityRes }] = useGetCityDropdownMutation();
  const [getStockMasterMain, { data: stockRes, isLoading: stockLoading }] =
    useGetStockMasterMainDropdownMutation();
  const [getDepartment, { data: deptRes }] = useGetDepartmentDropdownMutation();
  const [getSurgicalSpecialty, { data: surgicalRes }] =
    useGetSurgicalSpecialityDropdownMutation();
  const [postSampleData, { isLoading: isSubmitting }] =
    usePostSampleDataMutation();

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

  const loadSampleData = useCallback(async () => {
    const userId = user?.id || user?.company_user_id;
    if (!userId) return;
    try {
      const payload = {
        company: 'ANS',
        user_id: String(userId),
        role_id: String(user?.role_id || user?.company_role_id || '2'),
      };

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
  }, [
    user?.id,
    user?.company_user_id,
    user?.role_id,
    user?.company_role_id,
    getSampleData,
  ]);

  useEffect(() => {
    loadSampleData();
  }, [loadSampleData]);

  useEffect(() => {
    const userId = user?.id || user?.company_user_id;
    if (userId) {
      getHospital({ id: userId });
      getCityDropdown({ id: userId });
      getStockMasterMain({});
      getDepartment({});
      getSurgicalSpecialty({});
    }
  }, [
    user?.id,
    user?.company_user_id,
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

  const unapprovedCount = useMemo(() => {
    return sampleList.filter(item => isUnapproved(item.status)).length;
  }, [sampleList]);

  const approvedCount = useMemo(() => {
    return sampleList.filter(item => isApproved(item.status)).length;
  }, [sampleList]);

  const filteredList = useMemo(() => {
    if (activeTab === 'unapproved') {
      return sampleList.filter(item => isUnapproved(item.status));
    }
    return sampleList.filter(item => isApproved(item.status));
  }, [sampleList, activeTab]);

  const handleHospitalSelect = item => {
    setBasicInfo(prev => ({
      ...prev,
      hospital: item.debtor_no,
      hospitalContact: null,
      salesRegion: null,
      department: null,
      surgicalSpecialty: null,
    }));
    getHospitalContacts({
      hospital_id: item.debtor_no,
      user_id: user?.id || user?.company_user_id,
    });
  };

  const handleContactSelect = item => {
    setBasicInfo(prev => ({
      ...prev,
      hospitalContact: item.id,
      salesRegion: item.city || prev.salesRegion,
      department: item.department || prev.department,
      surgicalSpecialty: item.surgical_speciality || prev.surgicalSpecialty,
    }));

    const userId = user?.id || user?.company_user_id;
    if (item.city) {
      getCityDropdown({ id: userId, city: item.city });
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
    const userId = user?.id || user?.company_user_id;
    if (mode === 'update' && item) {
      setFormId(item.id || item.order_no || 0);
      setBasicInfo({
        hospital: item.hospital_id || item.hospital || null,
        hospitalContact: item.contact_id || item.contact || null,
        salesRegion: item.city || null,
        department: item.department || null,
        surgicalSpecialty: item.surgical_speciality || null,
      });
      setRemarks(item.comments || item.remarks || '');

      if (
        Array.isArray(item.purch_order_details) &&
        item.purch_order_details.length > 0
      ) {
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
        getHospitalContacts({
          hospital_id: item.hospital_id || item.hospital,
          user_id: userId,
        });
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
    }
    setIsModalVisible(true);
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

    const userId = user?.id || user?.company_user_id || '';

    const payload = {
      company: 'ANS',
      id: String(formId || '0'),
      person_id: user?.person_id || userId || '1',
      user_id: userId,
      role_id: String(user?.role_id || '2'),
      branch_code: user?.branch_code || '',
      ord_date: todayStr,
      hospital_name: hospitalName || '',
      contact_person: contactPerson || '',
      city: cityName || '',
      department: departmentName || '',
      surgical_speciality: surgicalSpecialtyName || '',
      comments: remarks || '',
      purch_order_details: purchOrderDetails,
    };

    try {
      const response = await postSampleData(payload).unwrap();
      if (String(response.status) === 'true' || response.status === true) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2:
            formMode === 'add'
              ? 'Sample request submitted successfully!'
              : 'Sample request updated successfully!',
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
      console.error('CRMSampleRequest [Submit Error]:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred during submission.',
      });
    }
  };

  const getSurgicalSpecialtyLabel = val => {
    if (!val) return 'N/A';
    const found = surgicalRes?.data?.find(
      s =>
        String(s.id) === String(val) || String(s.description) === String(val),
    );
    return found?.description || val;
  };

  const renderCardItem = ({ item }) => {
    const itemIsApproved = isApproved(item.status);
    const statusLabel =
      item.status || (itemIsApproved ? 'Approved' : 'Un Approved');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.headerLeft}>
            <View style={styles.referenceContainer}>
              <Icon
                name="flask-outline"
                size={16}
                color={theme.colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.referenceText}>
                {item.reference ||
                  `SO-${item.order_no || item.trans_no || 'N/A'}`}
              </Text>
            </View>
            {item.order_no ? (
              <View style={styles.orderNoBadge}>
                <Text style={styles.orderNoBadgeText}>#{item.order_no}</Text>
              </View>
            ) : null}
          </View>

          <View
            style={[
              styles.statusBadge,
              itemIsApproved
                ? styles.statusBadgeApproved
                : styles.statusBadgeUnapproved,
            ]}
          >
            <Icon
              name={itemIsApproved ? 'checkmark-circle' : 'time'}
              size={12}
              color={itemIsApproved ? '#16A34A' : '#D97706'}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.statusBadgeText,
                itemIsApproved
                  ? styles.statusTextApproved
                  : styles.statusTextUnapproved,
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Date & Branch Subheader */}
        <View style={styles.subHeaderRow}>
          <View style={styles.subHeaderItem}>
            <Icon
              name="calendar-outline"
              size={13}
              color={theme.colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.cardDateText}>
              {item.ord_date
                ? formatToAsiaDateTime(item.ord_date, false)
                : 'N/A'}
            </Text>
          </View>
          {item.branch ? (
            <View style={styles.subHeaderItem}>
              <Icon
                name="business-outline"
                size={13}
                color={theme.colors.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.branchText}>{item.branch}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.divider} />

        {/* Customer */}
        {item.customer ? (
          <View style={styles.infoRow}>
            <Icon
              name="people-outline"
              size={15}
              color={theme.colors.textSecondary}
              style={styles.infoIcon}
            />
            <Text style={styles.infoLabel}>Customer:</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {item.customer}
            </Text>
          </View>
        ) : null}
        <View style={styles.infoRow}>
          <Icon
            name="medkit-outline"
            size={15}
            color={theme.colors.textSecondary}
            style={styles.infoIcon}
          />
          <Text style={styles.infoLabel}>Hospital:</Text>
          <Text style={styles.infoValue} numberOfLines={2}>
            {item.hospital || item.hospital_name || 'N/A'}
          </Text>
        </View>

        {/* Contact */}
        <View style={styles.infoRow}>
          <Icon
            name="person-outline"
            size={15}
            color={theme.colors.textSecondary}
            style={styles.infoIcon}
          />
          <Text style={styles.infoLabel}>Contact:</Text>
          <Text style={styles.infoValue}>
            {item.contact || item.contact_person || 'N/A'}
          </Text>
        </View>

        {/* City & Department */}
        <View style={styles.twoColumnRow}>
          <View style={[styles.infoRow, { flex: 1, marginBottom: 0 }]}>
            <Icon
              name="location-outline"
              size={15}
              color={theme.colors.textSecondary}
              style={styles.infoIcon}
            />
            <Text style={styles.infoLabel}>City:</Text>
            <Text style={styles.infoValue}>{item.city || 'N/A'}</Text>
          </View>
          <View style={[styles.infoRow, { flex: 1, marginBottom: 0 }]}>
            <Icon
              name="git-network-outline"
              size={15}
              color={theme.colors.textSecondary}
              style={styles.infoIcon}
            />
            <Text style={styles.infoLabel}>Dept:</Text>
            <Text style={styles.infoValue}>{item.department || 'N/A'}</Text>
          </View>
        </View>

        {/* Surgical Speciality */}
        {item.surgical_speciality ? (
          <View style={[styles.infoRow, { marginTop: 8 }]}>
            <Icon
              name="cut-outline"
              size={15}
              color={theme.colors.textSecondary}
              style={styles.infoIcon}
            />
            <Text style={styles.infoLabel}>Surgical Spec:</Text>
            <Text style={styles.infoValue}>
              {getSurgicalSpecialtyLabel(item.surgical_speciality)}
            </Text>
          </View>
        ) : null}

        {/* Remarks / Comments */}
        {item.comments || item.remarks ? (
          <View style={styles.remarksBox}>
            <Text style={styles.remarksLabel}>Comments:</Text>
            <Text style={styles.remarksText}>
              {item.comments || item.remarks}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1 Row 2 Tabs: Un Approved & Approved */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'unapproved' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('unapproved')}
            activeOpacity={0.7}
          >
            <Icon
              name="time-outline"
              size={16}
              color={
                activeTab === 'unapproved'
                  ? '#FFFFFF'
                  : theme.colors.textSecondary
              }
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'unapproved' && styles.activeTabText,
              ]}
            >
              Un Approved
            </Text>
            <View
              style={[
                styles.badge,
                activeTab === 'unapproved'
                  ? styles.activeBadge
                  : styles.inactiveBadge,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  activeTab === 'unapproved'
                    ? styles.activeBadgeText
                    : styles.inactiveBadgeText,
                ]}
              >
                {unapprovedCount}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'approved' && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab('approved')}
            activeOpacity={0.7}
          >
            <Icon
              name="checkmark-circle-outline"
              size={16}
              color={
                activeTab === 'approved'
                  ? '#FFFFFF'
                  : theme.colors.textSecondary
              }
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'approved' && styles.activeTabText,
              ]}
            >
              Approved
            </Text>
            <View
              style={[
                styles.badge,
                activeTab === 'approved'
                  ? styles.activeBadge
                  : styles.inactiveBadge,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  activeTab === 'approved'
                    ? styles.activeBadgeText
                    : styles.inactiveBadgeText,
                ]}
              >
                {approvedCount}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content: List of Sample Cards */}
      {dataLoading && !isRefreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>Loading sample requests...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item, index) =>
            `${item.order_no || item.trans_no || item.id || 'item'}_${
              item.reference || ''
            }_${index}`
          }
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
              <Icon
                name={
                  activeTab === 'unapproved'
                    ? 'flask-outline'
                    : 'checkmark-done-circle-outline'
                }
                size={48}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'unapproved'
                  ? 'No Unapproved Sample Requests'
                  : 'No Approved Sample Requests'}
              </Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'unapproved'
                  ? 'Tap the (+) icon in the header to submit a new sample request.'
                  : 'Approved sample requests will show up here.'}
              </Text>
              {activeTab === 'unapproved' && (
                <TouchableOpacity
                  style={styles.addFirstBtn}
                  onPress={() => openFormModal('add')}
                  activeOpacity={0.8}
                >
                  <Icon
                    name="add"
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.addFirstBtnText}>Add Sample Request</Text>
                </TouchableOpacity>
              )}
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
              {formMode === 'add'
                ? 'Add Sample Request'
                : 'Edit Sample Request'}
            </Text>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
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
                <TouchableOpacity
                  style={styles.addProductBtn}
                  onPress={addProduct}
                >
                  <Icon
                    name="add-circle-outline"
                    size={18}
                    color={theme.colors.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.addProductBtnText}>Add Product</Text>
                </TouchableOpacity>
              </View>

              {products.map((item, index) => (
                <View key={index} style={styles.productCard}>
                  <View style={styles.productHeaderRow}>
                    <Text style={styles.productItemLabel}>
                      Item #{index + 1}
                    </Text>
                    {products.length > 1 && (
                      <TouchableOpacity onPress={() => removeProduct(index)}>
                        <Icon
                          name="trash-outline"
                          size={18}
                          color={theme.colors.error || '#EF4444'}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  <SearchableDropdown
                    label="Select Product"
                    placeholder="Search Product"
                    data={stockRes?.data || []}
                    selectedId={item.product}
                    onSelect={selected =>
                      updateProductField(index, 'product', selected.stock_id)
                    }
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
                      onChangeText={val =>
                        updateProductField(index, 'quantity', val)
                      }
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Comments */}
            <View style={styles.sectionCard}>
              <View style={styles.inputContainer}>
                <Text style={styles.fieldLabel}>Comments / Remarks</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { height: 75, textAlignVertical: 'top' },
                  ]}
                  placeholder="Enter comments..."
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  value={remarks}
                  onChangeText={setRemarks}
                />
              </View>
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
                  {formMode === 'add'
                    ? 'Submit Sample Request'
                    : 'Update Sample Request'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
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
    tabBarContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      backgroundColor: theme.colors.background,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
    },
    activeTabButton: {
      backgroundColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    activeTabText: {
      color: '#FFFFFF',
    },
    badge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 6,
    },
    activeBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    inactiveBadge: {
      backgroundColor: theme.colors.border,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '800',
    },
    activeBadgeText: {
      color: '#FFFFFF',
    },
    inactiveBadgeText: {
      color: theme.colors.textSecondary,
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
      paddingTop: 8,
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
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      flexWrap: 'wrap',
    },
    referenceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 8,
    },
    referenceText: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.text,
    },
    orderNoBadge: {
      backgroundColor: theme.colors.primary + '15',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    orderNoBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusBadgeApproved: {
      backgroundColor: '#DCFCE7',
    },
    statusBadgeUnapproved: {
      backgroundColor: '#FEF3C7',
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    statusTextApproved: {
      color: '#16A34A',
    },
    statusTextUnapproved: {
      color: '#D97706',
    },
    subHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    subHeaderItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardDateText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    branchText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 10,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    twoColumnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    infoIcon: {
      marginRight: 6,
      marginTop: 1,
    },
    infoLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginRight: 6,
    },
    infoValue: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.text,
      flex: 1,
    },
    remarksBox: {
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      padding: 10,
      marginTop: 8,
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
    cardActionsRow: {
      marginTop: 12,
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
      textAlign: 'center',
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
  });

export default CRMSampleRequestScreen;
