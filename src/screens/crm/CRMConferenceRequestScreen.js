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
import { CustomDatePicker, SearchableDropdown } from '@components/common';
import { useGetStockMasterMainDropdownMutation } from '@api/baseApi';

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
  { id: 'Conference', name: 'Conference' },
  { id: 'Doctor Workshop', name: 'Doctor Workshop' },
  { id: 'Exhibition', name: 'Exhibition' },
];

const MODES = [
  { id: 'In person', name: 'In person' },
  { id: 'Online', name: 'Online' },
];

const CRMConferenceRequestScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const user = useSelector(state => state.auth.user);

  // Section 1: Conference Information State
  const [activityType, setActivityType] = useState(null);
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState(formatToYYYYMMDD(new Date()));
  const [endDate, setEndDate] = useState(formatToYYYYMMDD(new Date()));
  const [venue, setVenue] = useState('');
  const [organizedBy, setOrganizedBy] = useState('');
  const [leadOrganiserName, setLeadOrganiserName] = useState('');
  const [mode, setMode] = useState(null);
  const [websiteLink, setWebsiteLink] = useState('');

  // Date picker modal state
  const [datePickerState, setDatePickerState] = useState({
    visible: false,
    field: null,
  });

  // Section 2: Purpose & Benefits State
  const [purposeParticipation, setPurposeParticipation] = useState('');
  const [expectedBenefit, setExpectedBenefit] = useState('');

  // Section 3: Company Attendees State
  const [salesTeam, setSalesTeam] = useState('');
  const [officeStaff, setOfficeStaff] = useState('');

  // Section 4: Materials & Agenda Dynamic Table State
  const [materials, setMaterials] = useState([
    { id: 1, material: '', sizeQty: '', agenda: '', time: '' },
  ]);

  // Section 5: Stock Required Dynamic Table State
  const [stockItems, setStockItems] = useState([
    { id: 1, itemCode: '', quantity: '', unitPrice: '', amount: '' },
  ]);

  // Section 6: Estimated Cost (PKR) State
  const [costs, setCosts] = useState({
    registrationFee: { unitCost: '', qtyDays: '' },
    travel: { unitCost: '', qtyDays: '' },
    accommodation: { unitCost: '', qtyDays: '' },
    meals: { unitCost: '', qtyDays: '' },
    otherExpenses: { unitCost: '', qtyDays: '' },
  });

  // Brochure Upload State
  const [brochureUri, setBrochureUri] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // API Hooks
  const [getStockMasterMain, { data: stockRes, isLoading: stockLoading }] =
    useGetStockMasterMainDropdownMutation();

  useEffect(() => {
    getStockMasterMain({});
  }, [getStockMasterMain]);

  // Date Picker Helper
  const openDatePicker = field => {
    setDatePickerState({ visible: true, field });
  };
  const handleDateSelect = selectedDate => {
    const formatted = formatToYYYYMMDD(selectedDate);
    if (datePickerState.field === 'start') {
      setStartDate(formatted);
    } else if (datePickerState.field === 'end') {
      setEndDate(formatted);
    }
    setDatePickerState({ visible: false, field: null });
  };

  // Materials Helpers
  const addMaterialRow = () => {
    setMaterials(prev => [
      ...prev,
      { id: Date.now(), material: '', sizeQty: '', agenda: '', time: '' },
    ]);
  };
  const removeMaterialRow = index => {
    if (materials.length <= 1) return;
    setMaterials(prev => prev.filter((_, i) => i !== index));
  };
  const updateMaterial = (index, field, value) => {
    setMaterials(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  // Stock Items Helpers
  const addStockRow = () => {
    setStockItems(prev => [
      ...prev,
      { id: Date.now(), itemCode: '', quantity: '', unitPrice: '', amount: '' },
    ]);
  };
  const removeStockRow = index => {
    if (stockItems.length <= 1) return;
    setStockItems(prev => prev.filter((_, i) => i !== index));
  };
  const updateStockItem = (index, field, value) => {
    setStockItems(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      const q = parseFloat(field === 'quantity' ? value : updated[index].quantity) || 0;
      const p = parseFloat(field === 'unitPrice' ? value : updated[index].unitPrice) || 0;
      if (q > 0 && p > 0) {
        updated[index].amount = (q * p).toString();
      }
      return updated;
    });
  };

  // Estimated Cost Helpers
  const calcRowTotal = item => {
    const cost = parseFloat(item.unitCost) || 0;
    const qty = parseFloat(item.qtyDays) || 0;
    return cost * qty;
  };

  const totalEstimatedCost =
    calcRowTotal(costs.registrationFee) +
    calcRowTotal(costs.travel) +
    calcRowTotal(costs.accommodation) +
    calcRowTotal(costs.meals) +
    calcRowTotal(costs.otherExpenses);

  const updateCostItem = (category, field, val) => {
    setCosts(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: val,
      },
    }));
  };

  const handlePickBrochure = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
      if (response.didCancel) return;
      if (response.assets && response.assets.length > 0) {
        setBrochureUri(response.assets[0].uri);
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
        text2: 'Conference request saved as draft locally.',
      });
    } catch (error) {
      console.log('Error saving draft:', error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!eventName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter Event Name.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        activity_type: activityType?.id,
        event_name: eventName,
        start_date: startDate,
        end_date: endDate,
        venue,
        organized_by: organizedBy,
        lead_organiser_name: leadOrganiserName,
        mode: mode?.id,
        website_link: websiteLink,
        purpose_participation: purposeParticipation,
        expected_benefit: expectedBenefit,
        sales_team: salesTeam,
        office_staff: officeStaff,
        materials_agenda: materials,
        stock_required: stockItems,
        estimated_costs: { ...costs, total_cost: totalEstimatedCost },
        brochure_uri: brochureUri,
        user_id: user?.id,
      };

      console.log('Conference Request Payload:', payload);
      await new Promise(resolve => setTimeout(resolve, 1200));

      Toast.show({
        type: 'success',
        text1: 'Request Submitted',
        text2: 'Conference request submitted for manager approval.',
      });

      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.log('Error submitting conference request:', error);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Failed to submit conference request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stock options
  const stockList = Array.isArray(stockRes) ? stockRes : stockRes?.data || [];
  const stockOptions = stockList.map(s => ({
    id: s.id || s.stock_id,
    name: s.description || s.name || s.title || 'Stock Item',
  }));

  const currentPickedDate =
    datePickerState.field === 'start'
      ? parseDate(startDate)
      : datePickerState.field === 'end'
      ? parseDate(endDate)
      : new Date();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTitleRow}>
            <Icon name="mic-outline" size={24} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.headerTitle}>CONFERENCE</Text>
          </View>
          <View style={styles.workflowBadge}>
            <Text style={styles.workflowText}>
              Workflow: Draft ➔ Submit ➔ Manager Approval ➔ Progress Update ➔ Completed
            </Text>
          </View>
        </View>

        {/* Section 1: Conference Information */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>1. Conference Information</Text>

          <View style={{ marginTop: 4 }}>
            <SearchableDropdown
              label="Activity Type [Dropdown]"
              placeholder="Select Activity (Conference, Workshop, Exhibition)..."
              data={ACTIVITY_TYPES}
              selectedId={activityType?.id}
              onSelect={item => setActivityType(item)}
              iconName="layers-outline"
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
            Event Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Event Name"
            placeholderTextColor={theme.colors.textSecondary}
            value={eventName}
            onChangeText={setEventName}
          />

          {/* Dates Row */}
          <View style={styles.dateRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.fieldLabel}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => openDatePicker('start')}
                activeOpacity={0.7}
              >
                <Text style={styles.dateText}>{startDate ? startDate : 'Select Date'}</Text>
                <Icon name="calendar-outline" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.fieldLabel}>End Date</Text>
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => openDatePicker('end')}
                activeOpacity={0.7}
              >
                <Text style={styles.dateText}>{endDate ? endDate : 'Select Date'}</Text>
                <Icon name="calendar-outline" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Venue</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Venue / Location"
            placeholderTextColor={theme.colors.textSecondary}
            value={venue}
            onChangeText={setVenue}
          />

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Organized By</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Society / Association Name"
            placeholderTextColor={theme.colors.textSecondary}
            value={organizedBy}
            onChangeText={setOrganizedBy}
          />

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Lead Organiser Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Lead Organiser Name"
            placeholderTextColor={theme.colors.textSecondary}
            value={leadOrganiserName}
            onChangeText={setLeadOrganiserName}
          />

          <View style={{ marginTop: 12 }}>
            <SearchableDropdown
              label="Mode [Dropdown]"
              placeholder="Select Mode (In person, Online)..."
              data={MODES}
              selectedId={mode?.id}
              onSelect={item => setMode(item)}
              iconName="location-outline"
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Website / Link</Text>
          <TextInput
            style={styles.textInput}
            placeholder="https://..."
            placeholderTextColor={theme.colors.textSecondary}
            value={websiteLink}
            onChangeText={setWebsiteLink}
          />
        </View>

        {/* Section 2: Purpose & Benefits */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>2. Purpose & Benefits</Text>

          <Text style={styles.fieldLabel}>Purpose of Participation</Text>
          <Text style={styles.subHint}>Describe in Bullet Points</Text>
          <TextInput
            style={styles.textArea}
            placeholder="• Reason for attending...&#10;• Objectives..."
            placeholderTextColor={theme.colors.textSecondary}
            value={purposeParticipation}
            onChangeText={setPurposeParticipation}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
            Expected Benefit to Organization
          </Text>
          <Text style={styles.subHint}>Describe in Bullet Points</Text>
          <TextInput
            style={styles.textArea}
            placeholder="• Expected outcomes...&#10;• Brand visibility..."
            placeholderTextColor={theme.colors.textSecondary}
            value={expectedBenefit}
            onChangeText={setExpectedBenefit}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Section 3: Company Attendees */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>3. Company Attendees</Text>

          <Text style={styles.fieldLabel}>Sales Team [Add sales person Name - Multiple]</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter sales team members..."
            placeholderTextColor={theme.colors.textSecondary}
            value={salesTeam}
            onChangeText={setSalesTeam}
          />

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Office Staff [Mention Names]</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter office staff names..."
            placeholderTextColor={theme.colors.textSecondary}
            value={officeStaff}
            onChangeText={setOfficeStaff}
          />
        </View>

        {/* Section 4: Materials & Agenda */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>4. Materials & Agenda</Text>

          {materials.map((item, index) => (
            <View key={item.id} style={styles.tableBlock}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>Item #{index + 1}</Text>
                {materials.length > 1 && (
                  <TouchableOpacity onPress={() => removeMaterialRow(index)}>
                    <Icon name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.fieldLabel}>Material / Equipment</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Banners, Standees, Brochure"
                placeholderTextColor={theme.colors.textSecondary}
                value={item.material}
                onChangeText={val => updateMaterial(index, 'material', val)}
              />

              <View style={styles.rowTwoCols}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.fieldLabel}>Size/Qty</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Size or Qty"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={item.sizeQty}
                    onChangeText={val => updateMaterial(index, 'sizeQty', val)}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.fieldLabel}>Time</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Day 1 - 09:00 AM"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={item.time}
                    onChangeText={val => updateMaterial(index, 'time', val)}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Agenda</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Agenda details"
                placeholderTextColor={theme.colors.textSecondary}
                value={item.agenda}
                onChangeText={val => updateMaterial(index, 'agenda', val)}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addBtn} onPress={addMaterialRow} activeOpacity={0.8}>
            <Icon name="add-circle-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.addBtnText}>+ Add Material / Agenda</Text>
          </TouchableOpacity>
        </View>

        {/* Section 5: Stock Required */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>5. Stock Required</Text>

          {stockItems.map((item, index) => (
            <View key={item.id} style={styles.tableBlock}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>Stock Item #{index + 1}</Text>
                {stockItems.length > 1 && (
                  <TouchableOpacity onPress={() => removeStockRow(index)}>
                    <Icon name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              <SearchableDropdown
                label="Item Code / Product"
                placeholder="Select Stock Item..."
                data={stockOptions}
                selectedId={item.stockId}
                onSelect={s => {
                  updateStockItem(index, 'stockId', s.id);
                  updateStockItem(index, 'itemCode', s.name);
                }}
                isLoading={stockLoading}
                iconName="cube-outline"
              />

              <View style={styles.rowTwoCols}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.fieldLabel}>Quantity</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                    value={item.quantity}
                    onChangeText={val => updateStockItem(index, 'quantity', val)}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.fieldLabel}>Unit Price</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                    value={item.unitPrice}
                    onChangeText={val => updateStockItem(index, 'unitPrice', val)}
                  />
                </View>
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={styles.fieldLabel}>Amount: Rs. {item.amount || '0'}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addBtn} onPress={addStockRow} activeOpacity={0.8}>
            <Icon name="add-circle-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.addBtnText}>+ Add Stock Item</Text>
          </TouchableOpacity>
        </View>

        {/* Section 6: Estimated Cost (PKR) */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>6. Estimated Cost (PKR)</Text>

          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableColHeader, { flex: 2 }]}>Cost Item</Text>
            <Text style={[styles.tableColHeader, { flex: 1 }]}>Unit Cost</Text>
            <Text style={[styles.tableColHeader, { flex: 1 }]}>Qty / Days</Text>
            <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'right' }]}>Total</Text>
          </View>

          {/* Registration Fee */}
          <View style={styles.budgetRow}>
            <Text style={styles.budgetCategoryLabel}>Registration Fee</Text>
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Cost"
              placeholderTextColor={theme.colors.textSecondary}
              value={costs.registrationFee.unitCost}
              onChangeText={val => updateCostItem('registrationFee', 'unitCost', val)}
            />
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Qty"
              placeholderTextColor={theme.colors.textSecondary}
              value={costs.registrationFee.qtyDays}
              onChangeText={val => updateCostItem('registrationFee', 'qtyDays', val)}
            />
            <Text style={styles.budgetTotalText}>{calcRowTotal(costs.registrationFee)}</Text>
          </View>

          {/* Travel */}
          <View style={styles.budgetRow}>
            <Text style={styles.budgetCategoryLabel}>Travel</Text>
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Cost"
              placeholderTextColor={theme.colors.textSecondary}
              value={costs.travel.unitCost}
              onChangeText={val => updateCostItem('travel', 'unitCost', val)}
            />
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Qty"
              placeholderTextColor={theme.colors.textSecondary}
              value={costs.travel.qtyDays}
              onChangeText={val => updateCostItem('travel', 'qtyDays', val)}
            />
            <Text style={styles.budgetTotalText}>{calcRowTotal(costs.travel)}</Text>
          </View>

          {/* Accommodation */}
          <View style={styles.budgetRow}>
            <Text style={styles.budgetCategoryLabel}>Accommodation</Text>
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Cost"
              placeholderTextColor={theme.colors.textSecondary}
              value={costs.accommodation.unitCost}
              onChangeText={val => updateCostItem('accommodation', 'unitCost', val)}
            />
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Qty"
              placeholderTextColor={theme.colors.textSecondary}
              value={costs.accommodation.qtyDays}
              onChangeText={val => updateCostItem('accommodation', 'qtyDays', val)}
            />
            <Text style={styles.budgetTotalText}>{calcRowTotal(costs.accommodation)}</Text>
          </View>

          {/* Meals */}
          <View style={styles.budgetRow}>
            <Text style={styles.budgetCategoryLabel}>Meals</Text>
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Cost"
              placeholderTextColor={theme.colors.textSecondary}
              value={costs.meals.unitCost}
              onChangeText={val => updateCostItem('meals', 'unitCost', val)}
            />
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Qty"
              placeholderTextColor={theme.colors.textSecondary}
              value={costs.meals.qtyDays}
              onChangeText={val => updateCostItem('meals', 'qtyDays', val)}
            />
            <Text style={styles.budgetTotalText}>{calcRowTotal(costs.meals)}</Text>
          </View>

          {/* Other Expenses */}
          <View style={styles.budgetRow}>
            <Text style={styles.budgetCategoryLabel}>Other Expenses</Text>
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Cost"
              placeholderTextColor={theme.colors.textSecondary}
              value={costs.otherExpenses.unitCost}
              onChangeText={val => updateCostItem('otherExpenses', 'unitCost', val)}
            />
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Qty"
              placeholderTextColor={theme.colors.textSecondary}
              value={costs.otherExpenses.qtyDays}
              onChangeText={val => updateCostItem('otherExpenses', 'qtyDays', val)}
            />
            <Text style={styles.budgetTotalText}>{calcRowTotal(costs.otherExpenses)}</Text>
          </View>

          <View style={styles.tableTotalRow}>
            <Text style={styles.totalLabel}>Total Estimated Cost (PKR)</Text>
            <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
              Rs. {totalEstimatedCost}
            </Text>
          </View>
        </View>

        {/* Upload Brochure Section */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={handlePickBrochure}
            activeOpacity={0.8}
          >
            <Icon name="cloud-upload-outline" size={20} color="#854D0E" style={{ marginRight: 8 }} />
            <Text style={styles.uploadBtnText}>
              {brochureUri ? 'Change Uploaded Brochure' : 'Upload Conference Brochure'}
            </Text>
          </TouchableOpacity>

          {brochureUri && (
            <View style={styles.previewRow}>
              <Image source={{ uri: brochureUri }} style={styles.previewImage} />
              <TouchableOpacity
                onPress={() => setBrochureUri(null)}
                style={styles.removeBtn}
              >
                <Icon name="close-circle" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Buttons Row */}
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
        visible={datePickerState.visible}
        onClose={() => setDatePickerState({ visible: false, field: null })}
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
      backgroundColor: '#4C1D95',
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
      fontSize: 11,
      color: '#EDE9FE',
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
    sectionHeading: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom: 6,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 4,
    },
    subHint: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
      marginBottom: 6,
    },
    required: {
      color: theme.colors.error || '#EF4444',
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
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
      paddingVertical: 9,
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
    tableBlock: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    blockHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    blockTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.text,
    },
    rowTwoCols: {
      flexDirection: 'row',
      marginTop: 8,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: '#059669',
      borderRadius: 8,
      backgroundColor: '#D1FAE5',
      marginTop: 4,
    },
    addBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#047857',
    },
    tableHeaderRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 6,
      marginBottom: 6,
    },
    tableColHeader: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    tableTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
      marginTop: 6,
    },
    totalLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.text,
    },
    totalValue: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
    },
    budgetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      gap: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    budgetCategoryLabel: {
      flex: 2,
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.text,
    },
    budgetInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 6,
      height: 36,
      textAlign: 'center',
      fontSize: 12,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    budgetTotalText: {
      flex: 1,
      textAlign: 'right',
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.text,
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
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
    },
    previewImage: {
      width: 70,
      height: 70,
      borderRadius: 8,
      marginRight: 10,
    },
    removeBtn: {
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

export default CRMConferenceRequestScreen;
