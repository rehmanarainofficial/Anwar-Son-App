import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { SearchableDropdown, CustomButton } from '@components/common';
import { useSelector } from 'react-redux';
import {
  useGetSalesCategoryMutation,
  useGetSalesActivityMutation,
  useGetHospitalMutation,
  useGetHospitalContactsMutation,
  useGetDailyWorkingPlanMutation,
  useAddDailyWorkingPlanMutation,
  useGetSalesProgressStatusMutation,
  useDeleteDailyWorkingPlanMutation,
  useGetProductPlanCategoryDropdownMutation,
} from '@api/baseApi';

const SaleTaskScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const user = useSelector(state => state.auth.user);

  const [activeTab, setActiveTab] = useState(
    route.params?.initialTab || 'plan',
  ); 

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  // Dropdown States
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedProductCategory, setSelectedProductCategory] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedProgressStatusId, setSelectedProgressStatusId] =
    useState(null);
  const [eveningRemarks, setEveningRemarks] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal States
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const [getSalesCategory, { data: catRes, isLoading: catLoading }] =
    useGetSalesCategoryMutation();
  const [getSalesActivity, { data: actRes, isLoading: actLoading }] =
    useGetSalesActivityMutation();
  const [getHospital, { data: hospRes, isLoading: hospLoading }] =
    useGetHospitalMutation();
  const [getHospitalContacts, { data: contactRes, isLoading: contactLoading }] =
    useGetHospitalContactsMutation();
  const [getDailyWorkingPlan, { isLoading: planLoading }] =
    useGetDailyWorkingPlanMutation();
  const [addDailyWorkingPlan, { isLoading: addLoading }] =
    useAddDailyWorkingPlanMutation();
  const [
    getSalesProgressStatus,
    { data: progressStatusRes, isLoading: progressStatusLoading },
  ] = useGetSalesProgressStatusMutation();
  const [deleteDailyWorkingPlan] = useDeleteDailyWorkingPlanMutation();
  const [getProductPlanCategory, { data: prodCatRes, isLoading: prodCatLoading }] =
    useGetProductPlanCategoryDropdownMutation();

  const [dailyPlans, setDailyPlans] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const getCurrentDate = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const fetchDailyPlan = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await getDailyWorkingPlan({
        user_id: user?.id,
        date: getCurrentDate(),
      }).unwrap();
      if (response.status === 'true') {
        setDailyPlans(response.data || []);
      }
    } catch (error) {
      console.error('Fetch Plan Error:', error);
    }
  }, [user?.id, getDailyWorkingPlan]);

  useEffect(() => {
    if (user?.id) {
      getSalesCategory({});
      getHospital({ id: user?.id });
      getProductPlanCategory({ user_id: user?.id });
      fetchDailyPlan();
    }
  }, [user?.id, getSalesCategory, getHospital, getProductPlanCategory, fetchDailyPlan]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDailyPlan();
    setRefreshing(false);
  };

  const handleCategorySelect = item => {
    setSelectedCategory(item.id);
    setSelectedActivity(null);
    getSalesActivity({ sales_category: item.id });
  };

  const handleHospitalSelect = item => {
    setSelectedHospital(item.debtor_no);
    setSelectedContact(null);
    getHospitalContacts({ hospital_id: item.debtor_no, user_id: user?.id });
  };

  const handleAddTask = async () => {
    if (
      !selectedCategory ||
      !selectedActivity ||
      !selectedProductCategory ||
      !selectedHospital ||
      !selectedContact
    ) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select all fields.',
      });
      return;
    }

    try {
      const response = await addDailyWorkingPlan({
        id: '0',
        user_id: user?.id,
        code: user?.emp_code,
        activity_date: getCurrentDate(),
        category: selectedCategory,
        activity: selectedActivity,
        product_category: selectedProductCategory,
        hospital_name: selectedHospital,
        contact_person: selectedContact,
        created_by: user?.id,
        progress_status: '0',
      }).unwrap();

      if (String(response.status) === 'true') {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Task added successfully!',
        });
        setSelectedCategory(null);
        setSelectedActivity(null);
        setSelectedProductCategory(null);
        setSelectedHospital(null);
        setSelectedContact(null);
        fetchDailyPlan();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to add task.',
        });
      }
    } catch (error) {
      console.error('Add Task Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An unexpected error occurred.',
      });
    }
  };

  const handleOpenUpdateModal = task => {
    setSelectedTask(task);
    setEveningRemarks(task.evening_remarks || '');
    setSelectedProgressStatusId(null);
    getSalesProgressStatus({ activity: task.activity_id });
    setIsUpdateModalVisible(true);
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => resolve(position.coords),
        error => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    });
  };

  const getAddressFromCoords = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
        { headers: { 'User-Agent': 'Desolution-App' } },
      );
      const data = await response.json();
      return data.display_name || 'Unknown Location';
    } catch (error) {
      return 'Unknown Location';
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedProgressStatusId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select progress status.',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const hasPermission = await requestLocationPermission();
      let lat = '';
      let lon = '';
      let addressName = '';

      if (hasPermission) {
        try {
          const coords = await getCurrentLocation();
          lat = coords?.latitude || '';
          lon = coords?.longitude || '';
          if (lat && lon) {
            addressName = await getAddressFromCoords(lat, lon);
          } else {
            throw new Error('Empty coordinates');
          }
        } catch (locError) {
          console.log('Location fetch failed:', locError);
          Alert.alert(
            'Location Required',
            'Please turn on your device location (GPS) to update tasks.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Turn On',
                onPress: () => {
                  if (Platform.OS === 'android') {
                    Linking.sendIntent(
                      'android.settings.LOCATION_SOURCE_SETTINGS',
                    );
                  } else {
                    Linking.openSettings();
                  }
                },
              },
            ],
          );
          return;
        }
      } else {
        console.log('Location permission denied, proceeding without location');
        setIsUpdating(false);
        Alert.alert(
          'Permission Required',
          'Please enable location permissions in your settings to update tasks.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }


      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}:${seconds}`;

      const selectedStatusObj = progressStatusRes?.data?.find(
        s => s.id === selectedProgressStatusId,
      );
      const response = await addDailyWorkingPlan({
        id: selectedTask.id,
        user_id: user?.id,
        emp_code: user?.emp_code,
        activity: selectedStatusObj?.description || '',
        activity_id: selectedProgressStatusId,
        evening_remarks: eveningRemarks,
        activity_date: getCurrentDate(),
        category: selectedTask.category,
        hospital_name: selectedTask.hospital_name,
        contact_person: selectedTask.contact_person,
        created_by: selectedTask.created_by,
        progress_status: selectedProgressStatusId, // Sending dropdown ID as progress status
        longitude: lon.toString(),
        latitude: lat.toString(),
        location_name: addressName,
        ActivityTime: currentTimeStr,
      }).unwrap();

      if (String(response.status) === 'true') {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Task updated successfully!',
        });
        setIsUpdateModalVisible(false);
        fetchDailyPlan();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to update task.',
        });
      }
    } catch (error) {
      console.error('Update Task Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An unexpected error occurred.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTaskPrompt = taskId => {
    setTaskToDelete(taskId);
    setIsDeleteModalVisible(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      const response = await deleteDailyWorkingPlan({
        id: taskToDelete,
      }).unwrap();
      if (String(response.status) === 'true') {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Task deleted successfully!',
        });
        fetchDailyPlan();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to delete task.',
        });
      }
    } catch (error) {
      console.error('Delete Task Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred while deleting.',
      });
    } finally {
      setIsDeleteModalVisible(false);
      setTaskToDelete(null);
    }
  };

  const TaskCard = ({ item, isProgress = false }) => {
    const cleanText = text => {
      if (!text) return '';
      return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
    };

    const productCategoryName = prodCatRes?.data?.find(
      c => c.category_id === item.product_category
    )?.description || item.product_category_name || item.product_category;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.activityIconBox}>
            <Icon
              name="calendar-outline"
              size={20}
              color={theme.colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              {cleanText(item.activity_name || item.activity || 'Activity')}
            </Text>
            <Text style={styles.cardSubtitle}>
              {cleanText(item.category_name || item.category || 'Category')}
            </Text>
          </View>
          <TouchableOpacity
            style={isProgress ? styles.updateBtn : styles.deleteBtn}
            onPress={() =>
              isProgress
                ? handleOpenUpdateModal(item)
                : handleDeleteTaskPrompt(item.id)
            }
          >
            <Icon
              name={isProgress ? 'refresh-outline' : 'trash-outline'}
              size={18}
              color={isProgress ? theme.colors.primary : '#ef4444'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Icon
              name="business-outline"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.infoText}>
              {cleanText(item.hospital_name || 'No Hospital')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon
              name="person-outline"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.infoText}>
              {cleanText(item.contact_person || 'No Contact')}
            </Text>
          </View>
          {productCategoryName ? (
            <View style={styles.infoRow}>
              <Icon
                name="cube-outline"
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.infoText}>
                {cleanText(productCategoryName)}
              </Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Icon
              name="stats-chart-outline"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.infoText,
                {
                  color: item.progress_status === '0' ? '#f59e0b' : '#10b981',
                  fontWeight: '800',
                },
              ]}
            >
              {item.progress_status === '0' ? 'Pending' : (item.progress_name || 'Completed')}
            </Text>
          </View>

          {isProgress && (
            <>
              <View style={styles.cardDivider} />
              <View style={styles.remarksBox}>
                <Text style={styles.remarksLabel}>Evening Remarks:</Text>
                <Text style={styles.remarksText}>
                  {cleanText(item.evening_remarks || 'No remarks yet')}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderPlanTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.formContainer}>
          <SearchableDropdown
            label="Category"
            placeholder="Select Category"
            data={catRes?.data || []}
            selectedId={selectedCategory}
            onSelect={handleCategorySelect}
            isLoading={catLoading}
            labelKey="description"
            iconName="apps-outline"
          />

          <SearchableDropdown
            label="Activity"
            placeholder={
              selectedCategory ? 'Select Activity' : 'First select category'
            }
            data={actRes?.data || []}
            selectedId={selectedActivity}
            onSelect={item => setSelectedActivity(item.id)}
            isLoading={actLoading}
            labelKey="description"
            iconName="walk-outline"
            disabled={!selectedCategory}
          />

          <SearchableDropdown
            label="Product Category"
            placeholder="Select Product Category"
            data={prodCatRes?.data || []}
            selectedId={selectedProductCategory}
            onSelect={item => setSelectedProductCategory(item.category_id)}
            isLoading={prodCatLoading}
            idKey="category_id"
            labelKey="description"
            iconName="cube-outline"
          />

          <SearchableDropdown
            label="Hospital"
            placeholder="Select Hospital"
            data={hospRes?.data || []}
            selectedId={selectedHospital}
            onSelect={handleHospitalSelect}
            isLoading={hospLoading}
            idKey="debtor_no"
            labelKey="name"
            iconName="business-outline"
          />

          <SearchableDropdown
            label="Hospital Contact"
            placeholder={
              selectedHospital ? 'Select Contact' : 'First select hospital'
            }
            data={contactRes?.data || []}
            selectedId={selectedContact}
            onSelect={item => setSelectedContact(item.id)}
            isLoading={contactLoading}
            labelKey="person_name"
            iconName="people-outline"
            disabled={!selectedHospital}
          />

          <View style={styles.buttonContainer}>
            <CustomButton
              title="ADD TASK"
              onPress={handleAddTask}
              loading={addLoading}
              icon="add-circle-outline"
            />
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Today's Working Plan</Text>
          {planLoading && (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          )}
        </View>

        {dailyPlans.length > 0
          ? dailyPlans.map(item => <TaskCard key={item.id} item={item} />)
          : !planLoading && (
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>
                  No tasks planned for today.
                </Text>
              </View>
            )}
      </View>
    );
  };

  const renderProgressTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Task Progress Status</Text>
          {planLoading && (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          )}
        </View>

        {dailyPlans.length > 0
          ? dailyPlans.map(item => (
              <TaskCard key={item.id} item={item} isProgress={true} />
            ))
          : !planLoading && (
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>
                  No tasks to track progress.
                </Text>
              </View>
            )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {route.params?.showTabs !== false && (
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'plan' && {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={() => setActiveTab('plan')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'plan' && styles.activeTabText,
              ]}
            >
              PLAN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'progress' && {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={() => setActiveTab('progress')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'progress' && styles.activeTabText,
              ]}
            >
              PROGRESS
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {activeTab === 'plan' ? renderPlanTab() : renderProgressTab()}
      </ScrollView>

      {/* Update Progress Modal */}
      <Modal
        visible={isUpdateModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsUpdateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Progress</Text>
              <TouchableOpacity onPress={() => setIsUpdateModalVisible(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <SearchableDropdown
                label="Progress Status"
                placeholder="Select Status"
                data={progressStatusRes?.data || []}
                selectedId={selectedProgressStatusId}
                onSelect={item => setSelectedProgressStatusId(item.id)}
                isLoading={progressStatusLoading}
                labelKey="description"
                iconName="stats-chart-outline"
              />

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Remarks</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Enter evening remarks"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline={true}
                  numberOfLines={4}
                  value={eveningRemarks}
                  onChangeText={setEveningRemarks}
                />
              </View>

              <View style={styles.modalButtonContainer}>
                <CustomButton
                  title="UPDATE STATUS"
                  onPress={handleUpdateTask}
                  loading={isUpdating}
                  icon="refresh-outline"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Delete Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalIconBox}>
              <Icon name="trash-outline" size={32} color="#ef4444" />
            </View>
            <Text style={styles.deleteModalTitle}>Delete Task</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={confirmDeleteTask}
              >
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    tabsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    tabText: {
      fontWeight: '700',
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    activeTabText: { color: '#FFFFFF' },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
    tabContent: { paddingTop: 8 },
    formContainer: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 24,
      ...theme.shadows?.sm,
    },
    buttonContainer: { marginTop: 10 },
    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    listTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.text,
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows?.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    activityIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
    cardSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    deleteBtn: { padding: 8, backgroundColor: '#ef444415', borderRadius: 10 },
    updateBtn: {
      padding: 8,
      backgroundColor: theme.colors.primary + '15',
      borderRadius: 10,
    },
    cardDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 12,
    },
    cardBody: { gap: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoText: { fontSize: 13, color: theme.colors.text, fontWeight: '500' },
    remarksBox: {
      backgroundColor: theme.colors.background,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    remarksLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    remarksText: {
      fontSize: 13,
      color: theme.colors.text,
      fontStyle: 'italic',
    },
    emptyList: { padding: 40, alignItems: 'center' },
    emptyListText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 24,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
    modalContent: { padding: 20 },
    inputGroup: { marginBottom: 20 },
    inputLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 8,
      marginLeft: 4,
    },
    textArea: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      fontSize: 14,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      textAlignVertical: 'top',
      height: 100,
    },
    modalButtonContainer: { marginTop: 10 },
    deleteModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteModalContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 24,
      width: '85%',
      alignItems: 'center',
      ...theme.shadows?.lg,
    },
    deleteModalIconBox: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#ef444415',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    deleteModalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.colors.text,
      marginBottom: 8,
    },
    deleteModalText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
    },
    deleteModalActions: { flexDirection: 'row', gap: 12, width: '100%' },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
    },
    confirmDeleteButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: '#ef4444',
      alignItems: 'center',
    },
    confirmDeleteButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });

export default SaleTaskScreen;
