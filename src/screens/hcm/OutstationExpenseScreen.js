import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '@config/useTheme';
import { CustomButton, CustomDatePicker } from '@components/common';

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

const getCurrentMonthFormatted = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date();
  return `${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
};

const OutstationExpenseScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const userData = useSelector(state => state.auth.user);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthFormatted());
  const [summaryNotes, setSummaryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Array of trips
  const [trips, setTrips] = useState([
    {
      id: 1,
      city: '',
      leavingDate: '',
      returnDate: '',
      fuelAllowance: '',
      nightStay: '0',
      otherExpense: '0',
      otherDetail: '',
      receiptUri: null,
    },
  ]);

  // Date picker state: { visible: boolean, tripIndex: number, field: 'leavingDate' | 'returnDate' }
  const [datePickerState, setDatePickerState] = useState({
    visible: false,
    tripIndex: null,
    field: null,
  });

  const handleAddTrip = () => {
    setTrips(prev => [
      ...prev,
      {
        id: Date.now(),
        city: '',
        leavingDate: '',
        returnDate: '',
        fuelAllowance: '',
        nightStay: '0',
        otherExpense: '0',
        otherDetail: '',
        receiptUri: null,
      },
    ]);
  };

  const handleRemoveTrip = index => {
    if (trips.length <= 1) {
      Toast.show({
        type: 'info',
        text1: 'Cannot Remove',
        text2: 'At least one trip must be filled.',
      });
      return;
    }
    setTrips(prev => prev.filter((_, i) => i !== index));
  };

  const updateTripField = (index, field, value) => {
    setTrips(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handlePickReceipt = index => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
      if (response.didCancel) return;
      if (response.assets && response.assets.length > 0) {
        updateTripField(index, 'receiptUri', response.assets[0].uri);
      }
    });
  };

  const openDatePicker = (index, field) => {
    setDatePickerState({
      visible: true,
      tripIndex: index,
      field: field,
    });
  };

  const handleDateSelect = selectedDate => {
    if (datePickerState.tripIndex !== null && datePickerState.field) {
      const formatted = formatToYYYYMMDD(selectedDate);
      updateTripField(datePickerState.tripIndex, datePickerState.field, formatted);
    }
    setDatePickerState({ visible: false, tripIndex: null, field: null });
  };

  // Summary calculations
  const totalTrips = trips.length;

  const totalFuelLiters = trips.reduce((acc, t) => {
    const val = parseFloat(t.fuelAllowance) || 0;
    return acc + val;
  }, 0);

  const totalOtherExpenses = trips.reduce((acc, t) => {
    const val = parseFloat(t.otherExpense) || 0;
    return acc + val;
  }, 0);

  const handleSubmit = async () => {
    // Validate trips
    for (let i = 0; i < trips.length; i++) {
      const t = trips[i];
      if (!t.city.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: `Please enter Trip City for Trip #${i + 1}`,
        });
        return;
      }
      if (!t.leavingDate) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: `Please select Leaving Date for Trip #${i + 1}`,
        });
        return;
      }
      if (!t.returnDate) {
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: `Please select Return Date for Trip #${i + 1}`,
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      // Simulate API call payload
      const payload = {
        company: 'CRM',
        emp_code: userData?.emp_code || userData?.employee_id || userData?.id || '',
        month: selectedMonth,
        notes: summaryNotes,
        total_trips: totalTrips,
        total_fuel: totalFuelLiters,
        total_other: totalOtherExpenses,
        trips: trips,
      };

      console.log('Outstation Visit Request Payload:', payload);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      Toast.show({
        type: 'success',
        text1: 'Claim Submitted',
        text2: 'Outstation Visit claim submitted for manager approval.',
      });

      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.log('Error submitting outstation claim:', error);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Failed to submit outstation visit claim.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const currentPickedDate =
    datePickerState.tripIndex !== null && datePickerState.field
      ? parseDate(trips[datePickerState.tripIndex][datePickerState.field])
      : new Date();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner / Title Header */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTitleRow}>
            <Icon name="navigate-outline" size={24} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.headerTitle}>OUTSTATION VISITS</Text>
          </View>
          <View style={styles.workflowBadge}>
            <Text style={styles.workflowText}>
              Workflow: Submit ➔ Manager Approval ➔ Completed
            </Text>
          </View>
        </View>

        {/* Top Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.monthRow}>
            <Text style={styles.summaryLabel}>Month</Text>
            <View style={styles.monthBadge}>
              <Icon name="calendar-outline" size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.monthText}>{selectedMonth}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <Text style={styles.summaryTitle}>SUMMARY</Text>

          <View style={styles.summaryStatsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TRIPS</Text>
              <Text style={styles.statValue}>{totalTrips}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>FUEL</Text>
              <Text style={styles.statValue}>{totalFuelLiters}L</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>OTHER EXPENSE</Text>
              <Text style={styles.statValue}>Rs. {totalOtherExpenses}</Text>
            </View>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>NOTES / REMARKS</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Enter visit notes or description..."
            placeholderTextColor={theme.colors.textSecondary}
            value={summaryNotes}
            onChangeText={setSummaryNotes}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Dynamic Trip Lists */}
        {trips.map((trip, index) => (
          <View key={trip.id} style={styles.tripCard}>
            {/* Trip Card Header */}
            <View style={styles.tripCardHeader}>
              <View style={styles.tripBadge}>
                <Text style={styles.tripBadgeText}>TRIP {index + 1}</Text>
              </View>
              {trips.length > 1 && (
                <TouchableOpacity
                  onPress={() => handleRemoveTrip(index)}
                  style={styles.deleteTripBtn}
                >
                  <Icon name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            {/* Trip City Input */}
            <Text style={styles.fieldLabel}>
              Trip City <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Lahore, Islamabad, Multan"
              placeholderTextColor={theme.colors.textSecondary}
              value={trip.city}
              onChangeText={val => updateTripField(index, 'city', val)}
            />

            {/* Dates Row */}
            <View style={styles.dateRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.fieldLabel}>
                  Leaving Date <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => openDatePicker(index, 'leavingDate')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dateText, !trip.leavingDate && { color: theme.colors.textSecondary }]}>
                    {trip.leavingDate ? trip.leavingDate : 'Select Date'}
                  </Text>
                  <Icon name="calendar-outline" size={18} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.fieldLabel}>
                  Return Date <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => openDatePicker(index, 'returnDate')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dateText, !trip.returnDate && { color: theme.colors.textSecondary }]}>
                    {trip.returnDate ? trip.returnDate : 'Select Date'}
                  </Text>
                  <Icon name="calendar-outline" size={18} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Fuel Allowance & System Tag */}
            <View style={styles.inputRowWithTag}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Fuel Allowance (Ltrs)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  value={trip.fuelAllowance}
                  onChangeText={val => updateTripField(index, 'fuelAllowance', val)}
                />
              </View>
              <View style={styles.systemTag}>
                <Text style={styles.tagText}>[System]</Text>
              </View>
            </View>

            {/* Night Stay & System Tag */}
            <View style={styles.inputRowWithTag}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Night Stay</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  value={trip.nightStay}
                  onChangeText={val => updateTripField(index, 'nightStay', val)}
                />
              </View>
              <View style={styles.systemTag}>
                <Text style={styles.tagText}>[System]</Text>
              </View>
            </View>

            {/* Other Expense & Detail */}
            <View style={styles.otherExpenseRow}>
              <View style={{ width: 110, marginRight: 10 }}>
                <Text style={styles.fieldLabel}>Other Expense</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  value={trip.otherExpense}
                  onChangeText={val => updateTripField(index, 'otherExpense', val)}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Detail</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Expense detail..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={trip.otherDetail}
                  onChangeText={val => updateTripField(index, 'otherDetail', val)}
                />
              </View>
            </View>

            {/* Upload Receipt Section */}
            <View style={{ marginTop: 14 }}>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => handlePickReceipt(index)}
                activeOpacity={0.8}
              >
                <Icon name="cloud-upload-outline" size={20} color="#854D0E" style={{ marginRight: 8 }} />
                <Text style={styles.uploadBtnText}>
                  {trip.receiptUri ? 'Change Receipt Image' : 'Upload Receipt'}
                </Text>
              </TouchableOpacity>

              {trip.receiptUri && (
                <View style={styles.receiptPreviewRow}>
                  <Image source={{ uri: trip.receiptUri }} style={styles.receiptImage} />
                  <TouchableOpacity
                    onPress={() => updateTripField(index, 'receiptUri', null)}
                    style={styles.removeReceiptBtn}
                  >
                    <Icon name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}

        {/* ADD TRIP BUTTON */}
        <TouchableOpacity
          style={styles.addTripBtn}
          onPress={handleAddTrip}
          activeOpacity={0.8}
        >
          <Icon name="add-circle-outline" size={22} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.addTripBtnText}>ADD TRIP</Text>
        </TouchableOpacity>

        {/* SUBMIT BUTTON */}
        <View style={{ marginTop: 16, marginBottom: 30 }}>
          <CustomButton
            title="Submit Outstation Visit Request"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
          />
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <CustomDatePicker
        visible={datePickerState.visible}
        onClose={() => setDatePickerState({ visible: false, tripIndex: null, field: null })}
        onSelect={handleDateSelect}
        selectedDate={currentPickedDate}
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
      backgroundColor: '#1E40AF',
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
      color: '#E0E7FF',
      fontWeight: '500',
    },
    summaryCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      elevation: 2,
    },
    monthRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    monthBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#FDE68A',
    },
    monthText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#92400E',
    },
    summaryDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 12,
    },
    summaryTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 10,
    },
    summaryStatsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
    },
    statBox: {
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.primary,
      marginTop: 4,
    },
    notesInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      padding: 10,
      fontSize: 13,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      marginTop: 4,
    },
    tripCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      elevation: 2,
    },
    tripCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom: 8,
    },
    tripBadge: {
      backgroundColor: '#E2E8F0',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 6,
    },
    tripBadgeText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#1E293B',
    },
    deleteTripBtn: {
      padding: 6,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 4,
      marginTop: 8,
    },
    required: {
      color: theme.colors.error || '#EF4444',
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dateSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: theme.colors.background,
    },
    dateText: {
      fontSize: 13,
      color: theme.colors.text,
      fontWeight: '500',
    },
    inputRowWithTag: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    systemTag: {
      marginLeft: 10,
      marginBottom: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    tagText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    otherExpenseRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    uploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#CA8A04',
      borderStyle: 'dashed',
      borderRadius: 8,
      paddingVertical: 10,
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
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 10,
    },
    removeReceiptBtn: {
      padding: 4,
    },
    addTripBtn: {
      backgroundColor: '#10B981',
      borderRadius: 8,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    addTripBtnText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
  });

export default OutstationExpenseScreen;
