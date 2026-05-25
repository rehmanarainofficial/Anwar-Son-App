import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  PermissionsAndroid,
  TextInput,
  RefreshControl,
  Text,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '@config/useTheme';
import Modal from 'react-native-modal';
import Geolocation from 'react-native-geolocation-service';
import Icon from 'react-native-vector-icons/Ionicons';
import { CustomButton } from '@components/common';
import {
  useGetAttendanceDetailMutation,
  usePostAttendanceMutation,
} from '@api/hcmApi';

const { width } = Dimensions.get('window');

const AttendanceScreen = () => {
  const { theme } = useTheme();
  const userData = useSelector(state => state.auth.user);

  // Modals Visibility
  const [isDVRModalVisible, setDVRModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentLocationCoords, setCurrentLocationCoords] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  const [getAttendanceDetail, { isLoading: isFetching }] =
    useGetAttendanceDetailMutation();
  const [postAttendanceMutation] = usePostAttendanceMutation();

  // Unified Feedback State
  const [feedback, setFeedback] = useState({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const [dvrData, setDvrData] = useState({
    site_name: '',
    site_address: '',
    contact_person: '',
    mobile_no: '',
    nature_of_visit: '',
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const totalDays = getDaysInMonth(currentYear, currentMonth);
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const currentDateStr = new Date().toISOString().split('T')[0];
    try {
      const response = await getAttendanceDetail({
        emp_code: userData?.emp_code || '',
        date: currentDateStr,
      }).unwrap();

      if (response.status === 'true' || response.status === true) {
        setAttendanceHistory(response.data || []);
      }
    } catch (error) {
      console.log('Fetch History Error:', error);
    }
  };

  const showFeedback = (type, title, message) => {
    setFeedback({
      visible: true,
      type,
      title,
      message,
    });
  };

  const formatTime12h = timeStr => {
    if (!timeStr) return 'N/A';
    try {
      const [hours, minutes, seconds] = timeStr.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
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
        position => {
          resolve(position.coords);
        },
        error => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    });
  };

  const getAddressFromCoords = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
        {
          headers: {
            'User-Agent': 'Desolution-App',
          },
        },
      );
      const data = await response.json();
      return data.display_name || 'Unknown Location';
    } catch (error) {
      return 'Unknown Location';
    }
  };

  const handleDayPress = async day => {
    if (day !== currentDate) return;

    setLoading(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        showFeedback(
          'error',
          'Permission Denied',
          'Please enable location permissions to mark attendance.',
        );
        setLoading(false);
        return;
      }

      const coords = await getCurrentLocation();
      setCurrentLocationCoords(coords);

      // Directly post attendance without geofencing or DVR checks
      await postAttendance(coords);
    } catch (error) {
      showFeedback(
        'error',
        'Location Error',
        'Could not get current location. Please ensure GPS is ON.',
      );
    } finally {
      setLoading(false);
    }
  };

  const postAttendance = async (
    coords,
    isDVR = false,
    isOut = false,
    checkOutId = null,
  ) => {
    const currentDateStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const hours = now.getHours();
    const displayHours = hours === 0 ? '12' : String(hours).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const currentTimeStr = `${displayHours}:${minutes}:${seconds}`;

    const lat = coords?.latitude || 0;
    const lon = coords?.longitude || 0;
    const addressName = await getAddressFromCoords(lat, lon);

    const payload = {
      code: userData?.emp_code || '',
      ActivityDate: currentDateStr,
      ActivityTime: currentTimeStr,
      current_location: addressName,
      latitude: lat.toString(),
      longitude: lon.toString(),
      in_out: '1',
      status1: '1',
      id: '0',
    };

    setLoading(true);
    try {
      const responseData = await postAttendanceMutation(payload).unwrap();

      if (responseData.status === 'true' || responseData.status === true) {
        showFeedback(
          'success',
          'Success!',
          isOut
            ? 'Checked out successfully!'
            : isDVR
            ? 'DVR and Attendance marked successfully!'
            : 'Attendance marked successfully!',
        );
        if (isDVR) setDVRModalVisible(false);
        fetchHistory();
      } else {
        showFeedback(
          'error',
          'API Error',
          responseData.message || 'Failed to process request.',
        );
      }
    } catch (error) {
      console.log('Attendance Request Error details:', error);
      showFeedback(
        'error',
        'Network Error',
        error.message || 'An error occurred while connecting to the server.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async id => {
    setLoading(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        showFeedback(
          'error',
          'Permission Denied',
          'Location access is required for checkout.',
        );
        setLoading(false);
        return;
      }
      const coords = await getCurrentLocation();
      await postAttendance(coords, false, true, id);
    } catch (error) {
      showFeedback(
        'error',
        'Checkout Error',
        'Failed to get location for checkout.',
      );
    } finally {
      setLoading(false);
    }
  };

  const submitDVR = () => {
    if (
      !dvrData.site_name ||
      !dvrData.site_address ||
      !dvrData.contact_person ||
      !dvrData.mobile_no
    ) {
      showFeedback(
        'error',
        'Fields Required',
        'Please fill all fields to proceed.',
      );
      return;
    }
    postAttendance(currentLocationCoords, true);
  };

  const renderInput = (label, key, placeholder, isMulti = false) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
          },
          isMulti && { height: 80, textAlignVertical: 'top' },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={dvrData[key]}
        onChangeText={text => setDvrData({ ...dvrData, [key]: text })}
        multiline={isMulti}
      />
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={fetchHistory}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Employee Info Card */}
        <View
          style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.userName, { color: theme.colors.primary }]}>
            {userData?.real_name || 'User'}
          </Text>
          <Text style={[styles.empCode, { color: theme.colors.textSecondary }]}>
            Employee Code: {userData?.emp_code || 'N/A'}
          </Text>
          <View
            style={[
              styles.monthBadge,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text style={styles.monthText}>
              {`${now.toLocaleString('default', {
                month: 'long',
              })} ${currentYear}`}
            </Text>
          </View>
        </View>

        {/* Calendar Grid */}
        <View
          style={[
            styles.calendarContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View
            style={[
              styles.calendarHeader,
              { borderBottomColor: theme.colors.border },
            ]}
          >
            <Text
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Daily Attendance
            </Text>
            <View style={styles.todayIndicator}>
              <View
                style={[
                  styles.todayDot,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
              <Text
                style={[
                  styles.todayText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Today
              </Text>
            </View>
          </View>

          <View style={styles.grid}>
            {daysArray.map(day => {
              const isToday = day === currentDate;
              const isPast = day < currentDate;
              const isDisabled = !isToday;

              return (
                <TouchableOpacity
                  key={day}
                  disabled={isDisabled}
                  onPress={() => handleDayPress(day)}
                  style={[
                    styles.dayButton,
                    { borderColor: theme.colors.border },
                    isToday && {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                      transform: [{ scale: 1.1 }],
                      zIndex: 1,
                      elevation: 4,
                    },
                    isPast && { backgroundColor: theme.colors.surface + '80' },
                    !isToday &&
                      !isPast && {
                        backgroundColor: theme.colors.background,
                        opacity: 0.5,
                      },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: isToday
                          ? '#FFFFFF'
                          : isPast
                          ? theme.colors.text
                          : theme.colors.border,
                      },
                    ]}
                  >
                    {day}
                  </Text>
                  {isToday && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Attendance History */}
        <View style={styles.historySection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text, marginBottom: 15 },
            ]}
          >
            Today's Logs
          </Text>

          {attendanceHistory.length === 0 ? (
            <View
              style={[
                styles.emptyContainer,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Text style={{ color: theme.colors.textSecondary }}>
                No records found for today.
              </Text>
            </View>
          ) : (
            attendanceHistory.map((item, index) => {
              const isOutValue = item.status === '1' || item.status === 1;
              return (
                <View
                  key={index}
                  style={[
                    styles.historyCard,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <View
                    style={[
                      styles.cardHeader,
                      { borderBottomColor: theme.colors.border },
                    ]}
                  >
                    <View style={styles.timeBadge}>
                      <Icon
                        name="time-outline"
                        size={14}
                        color={theme.colors.primary}
                      />
                      <Text
                        style={[
                          styles.timeText,
                          { color: theme.colors.primary },
                        ]}
                      >
                        {formatTime12h(item.ActivityTime)}
                      </Text>
                    </View>
                    {!isOutValue && (
                      <TouchableOpacity
                        style={[
                          styles.outButton,
                          { backgroundColor: theme.colors.secondary },
                        ]}
                        onPress={() => handleCheckOut(item.id)}
                      >
                        <Text style={styles.outBtnText}>Checkout</Text>
                      </TouchableOpacity>
                    )}
                    {isOutValue && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>Completed</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.detailItem}>
                      <Icon
                        name="location-outline"
                        size={16}
                        color={theme.colors.secondary}
                        style={styles.detailIcon}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.detailTitle,
                            { color: theme.colors.text },
                          ]}
                        >
                          {item.site_name || 'Office Entry'}
                        </Text>
                        <Text
                          style={[
                            styles.detailSubtitle,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {item.current_location || 'N/A'}
                        </Text>
                      </View>
                    </View>
                    {item.nature_of_visit && (
                      <View style={[styles.detailItem, { marginTop: 8 }]}>
                        <Icon
                          name="information-circle-outline"
                          size={16}
                          color={theme.colors.textSecondary}
                          style={styles.detailIcon}
                        />
                        <Text
                          style={[
                            styles.detailSubtitle,
                            { color: theme.colors.text, flex: 1 },
                          ]}
                        >
                          {item.nature_of_visit}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* DVR Form Modal */}
      <Modal
        isVisible={isDVRModalVisible}
        onBackdropPress={() => !loading && setDVRModalVisible(false)}
        style={styles.modal}
      >
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>
              Daily Visit Report (DVR)
            </Text>
            <TouchableOpacity
              onPress={() => !loading && setDVRModalVisible(false)}
            >
              <Text
                style={{ color: theme.colors.secondary, fontWeight: 'bold' }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <Text
              style={{
                color: theme.colors.textSecondary,
                marginBottom: 15,
                fontSize: 13,
              }}
            >
              You are out of range. Please submit DVR to mark attendance.
            </Text>
            {renderInput('Company Name', 'site_name', 'Enter company name')}
            {renderInput('Site Address', 'site_address', 'Enter site address')}
            {renderInput('Contact Person', 'contact_person', 'Enter name')}
            {renderInput('Mobile No', 'mobile_no', 'Enter mobile number')}
            {renderInput(
              'Nature of Visit',
              'nature_of_visit',
              'Describe visit',
              true,
            )}

            <CustomButton
              title={loading ? 'Submitting...' : 'Submit & Mark Attendance'}
              onPress={submitDVR}
              style={{ marginTop: 20 }}
              loading={loading}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Unified Feedback Modal */}
      <Modal
        isVisible={feedback.visible}
        onBackdropPress={() => setFeedback({ ...feedback, visible: false })}
        animationIn="zoomIn"
        animationOut="zoomOut"
      >
        <View
          style={[
            styles.successModalContent,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.successIconContainer}>
            <Icon
              name={
                feedback.type === 'success'
                  ? 'checkmark-circle'
                  : 'close-circle'
              }
              size={80}
              color={feedback.type === 'success' ? '#28A745' : '#DC3545'}
            />
          </View>
          <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>
            {feedback.title}
          </Text>
          <Text
            style={[
              styles.feedbackMessage,
              { color: theme.colors.textSecondary },
            ]}
          >
            {feedback.message}
          </Text>
          <TouchableOpacity
            style={[
              styles.successButton,
              {
                backgroundColor:
                  feedback.type === 'success'
                    ? theme.colors.primary
                    : '#DC3545',
              },
            ]}
            onPress={() => setFeedback({ ...feedback, visible: false })}
          >
            <Text
              style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}
            >
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
            Processing...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  infoCard: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    alignItems: 'center',
  },
  userName: { fontSize: 24, fontWeight: 'bold' },
  empCode: { fontSize: 16, marginTop: 5 },
  monthBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15,
  },
  monthText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  calendarContainer: {
    marginHorizontal: 15,
    borderRadius: 20,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  todayIndicator: { flexDirection: 'row', alignItems: 'center' },
  todayDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  todayText: { fontSize: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayButton: {
    width: (width - 70) / 7,
    height: (width - 70) / 7,
    margin: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  dayText: { fontSize: 16, fontWeight: '600' },
  activeIndicator: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  historySection: { paddingHorizontal: 20, marginTop: 25 },
  historyCard: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 10,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  timeText: { marginLeft: 5, fontSize: 12, fontWeight: 'bold' },
  outButton: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8,
  },
  outBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  completedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E9F7EF',
    borderRadius: 8,
  },
  completedText: { color: '#28A745', fontSize: 12, fontWeight: 'bold' },
  cardBody: { paddingHorizontal: 5 },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start' },
  detailIcon: { width: 20, marginTop: 2 },
  detailTitle: { fontSize: 14, fontWeight: 'bold' },
  detailSubtitle: { fontSize: 12, marginTop: 2 },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 15,
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  modal: { margin: 0, justifyContent: 'flex-end' },
  modalContent: {
    padding: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  inputGroup: { marginBottom: 15 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },
  successModalContent: {
    padding: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  successIconContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  feedbackTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 15 },
  feedbackMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  successButton: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 15,
    marginTop: 25,
    width: '100%',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default AttendanceScreen;
