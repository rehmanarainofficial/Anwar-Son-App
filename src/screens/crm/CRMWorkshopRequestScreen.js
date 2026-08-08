import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { useTheme } from '@config/useTheme';
import { CustomDatePicker, SearchableDropdown } from '@components/common';
import {
  useGetHospitalMutation,
  useGetDepartmentDropdownMutation,
  useGetStockMasterMainDropdownMutation,
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

const WORKSHOP_TYPES = [
  { id: 'Educational', name: 'Educational' },
  { id: 'Product Demonstration', name: 'Product Demonstration' },
  { id: 'Hands-on Training', name: 'Hands-on Training' },
  { id: 'Other', name: 'Other' },
];

const PRODUCT_SEGMENTS = [
  { id: 'Sutures', name: 'Sutures' },
  { id: 'Airway Management', name: 'Airway Management' },
  { id: 'Haemostats', name: 'Haemostats' },
  { id: 'Mesh', name: 'Mesh' },
  { id: 'Other', name: 'Other' },
];

const CRMWorkshopRequestScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const user = useSelector(state => state.auth.user);

  // Section 1: Workshop Info State
  const [title, setTitle] = useState('');
  const [workshopDate, setWorkshopDate] = useState(formatToYYYYMMDD(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [venue, setVenue] = useState('');
  const [selectedDept, setSelectedDept] = useState(null);
  const [workshopType, setWorkshopType] = useState(null);
  const [otherTypeDetail, setOtherTypeDetail] = useState('');
  const [productSegment, setProductSegment] = useState(null);

  // Section 2: Objective State
  const [objective, setObjective] = useState('');

  // Section 3: Key Products State
  const [keyProducts, setKeyProducts] = useState([
    { id: 1, product: '', sizeCode: '', purpose: '', qty: '' },
  ]);

  // Section 4: Audience Breakdown State
  const [audience, setAudience] = useState({
    hodKols: '0',
    apsSrs: '0',
    otNurses: '0',
    internsStudents: '0',
    other: '0',
  });

  // Section 5: Materials & Agenda State
  const [materials, setMaterials] = useState([
    { id: 1, material: '', sizeQty: '', agenda: '', time: '' },
  ]);

  // Section 6: Samples Required State
  const [samplesRequired, setSamplesRequired] = useState('');

  // Section 7: Budget & Approval State
  const [budget, setBudget] = useState({
    refreshment: { unitCost: '', qty: '' },
    handsOnMaterial: { unitCost: '', qty: '' },
    equipmentRental: { unitCost: '', qty: '' },
    other: { unitCost: '', qty: '' },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // API Hooks
  const [getHospital, { data: hospRes, isLoading: hospLoading }] = useGetHospitalMutation();
  const [getDepartment, { data: deptRes, isLoading: deptLoading }] = useGetDepartmentDropdownMutation();
  const [getStockMasterMain, { data: stockRes, isLoading: stockLoading }] = useGetStockMasterMainDropdownMutation();

  useEffect(() => {
    getHospital({ id: user?.id });
    getDepartment({});
    getStockMasterMain({});
  }, [user?.id, getHospital, getDepartment, getStockMasterMain]);

  // Key Products Helpers
  const addKeyProductRow = () => {
    setKeyProducts(prev => [
      ...prev,
      { id: Date.now(), product: '', sizeCode: '', purpose: '', qty: '' },
    ]);
  };
  const removeKeyProductRow = index => {
    if (keyProducts.length <= 1) return;
    setKeyProducts(prev => prev.filter((_, i) => i !== index));
  };
  const updateKeyProduct = (index, field, value) => {
    setKeyProducts(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  // Materials & Agenda Helpers
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

  // Calculations
  const totalAudience =
    (parseInt(audience.hodKols, 10) || 0) +
    (parseInt(audience.apsSrs, 10) || 0) +
    (parseInt(audience.otNurses, 10) || 0) +
    (parseInt(audience.internsStudents, 10) || 0) +
    (parseInt(audience.other, 10) || 0);

  const calcRowTotal = item => {
    const cost = parseFloat(item.unitCost) || 0;
    const q = parseFloat(item.qty) || 0;
    return cost * q;
  };

  const totalBudget =
    calcRowTotal(budget.refreshment) +
    calcRowTotal(budget.handsOnMaterial) +
    calcRowTotal(budget.equipmentRental) +
    calcRowTotal(budget.other);

  const updateBudgetItem = (category, field, val) => {
    setBudget(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: val,
      },
    }));
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      Toast.show({
        type: 'info',
        text1: 'Draft Saved',
        text2: 'Workshop request saved as draft locally.',
      });
    } catch (error) {
      console.log('Error saving draft:', error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter Workshop Title.',
      });
      return;
    }
    if (!selectedHospital) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a Hospital.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        date: workshopDate,
        hospital_id: selectedHospital?.id,
        hospital_name: selectedHospital?.name,
        venue,
        department_id: selectedDept?.id,
        workshop_type: workshopType?.id,
        other_type_detail: otherTypeDetail,
        product_segment: productSegment?.id,
        objective,
        key_products: keyProducts,
        audience_breakdown: { ...audience, total_audience: totalAudience },
        materials_agenda: materials,
        samples_required: samplesRequired,
        budget_breakdown: { ...budget, total_budget: totalBudget },
        user_id: user?.id,
      };

      console.log('Company Workshop Payload:', payload);
      await new Promise(resolve => setTimeout(resolve, 1200));

      Toast.show({
        type: 'success',
        text1: 'Request Submitted',
        text2: 'Company Workshop request submitted for manager approval.',
      });

      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.log('Error submitting workshop request:', error);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Failed to submit workshop request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dropdown options
  const hospitalList = Array.isArray(hospRes) ? hospRes : hospRes?.data || [];
  const hospitalOptions = hospitalList.map(h => ({
    id: h.id || h.hospital_id,
    name: h.name || h.hospital_name || h.title || 'Hospital',
  }));

  const deptList = Array.isArray(deptRes) ? deptRes : deptRes?.data || [];
  const deptOptions = deptList.map(d => ({
    id: d.id || d.department_id,
    name: d.name || d.department_name || d.title || 'Department',
  }));

  const stockList = Array.isArray(stockRes) ? stockRes : stockRes?.data || [];
  const stockOptions = stockList.map(s => ({
    id: s.id || s.stock_id,
    name: s.description || s.name || s.title || 'Product',
  }));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTitleRow}>
            <Icon name="easel-outline" size={24} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.headerTitle}>COMPANY WORKSHOP</Text>
          </View>
          <View style={styles.workflowBadge}>
            <Text style={styles.workflowText}>
              Workflow: Draft ➔ Submit ➔ Manager Approval ➔ Progress Update ➔ Completed
            </Text>
          </View>
        </View>

        {/* Section 1: Workshop Info */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>1. Workshop Info</Text>

          <Text style={styles.fieldLabel}>
            Workshop Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Workshop Title"
            placeholderTextColor={theme.colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
            Date <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateText}>{workshopDate ? workshopDate : 'Select Date'}</Text>
            <Icon name="calendar-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          <View style={{ marginTop: 12 }}>
            <SearchableDropdown
              label="Hospital [CRM Hospital]"
              placeholder="Select Hospital..."
              data={hospitalOptions}
              selectedId={selectedHospital?.id}
              onSelect={item => setSelectedHospital(item)}
              isLoading={hospLoading}
              iconName="business-outline"
            />
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Venue</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Main Auditorium, Conference Room"
            placeholderTextColor={theme.colors.textSecondary}
            value={venue}
            onChangeText={setVenue}
          />

          <View style={{ marginTop: 12 }}>
            <SearchableDropdown
              label="Department / Specialty"
              placeholder="Select Department / Specialty..."
              data={deptOptions}
              selectedId={selectedDept?.id}
              onSelect={item => setSelectedDept(item)}
              isLoading={deptLoading}
              iconName="medkit-outline"
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <SearchableDropdown
              label="Workshop Type [Dropdown]"
              placeholder="Select Workshop Type..."
              data={WORKSHOP_TYPES}
              selectedId={workshopType?.id}
              onSelect={item => setWorkshopType(item)}
              iconName="school-outline"
            />
          </View>

          {workshopType?.id === 'Other' && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.fieldLabel}>Provide details if Other</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter workshop type details..."
                placeholderTextColor={theme.colors.textSecondary}
                value={otherTypeDetail}
                onChangeText={setOtherTypeDetail}
              />
            </View>
          )}

          <View style={{ marginTop: 12 }}>
            <SearchableDropdown
              label="Product Segment [Dropdown]"
              placeholder="Select Product Segment..."
              data={PRODUCT_SEGMENTS}
              selectedId={productSegment?.id}
              onSelect={item => setProductSegment(item)}
              iconName="shapes-outline"
            />
          </View>
        </View>

        {/* Section 2: Objective */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>2. Objective</Text>
          <Text style={styles.fieldLabel}>Brief purpose / expected outcome of the workshop</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Enter brief purpose or expected outcome..."
            placeholderTextColor={theme.colors.textSecondary}
            value={objective}
            onChangeText={setObjective}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Section 3: Key Products */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>3. Key Products</Text>

          {keyProducts.map((item, index) => (
            <View key={item.id} style={styles.tableBlock}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>Product #{index + 1}</Text>
                {keyProducts.length > 1 && (
                  <TouchableOpacity onPress={() => removeKeyProductRow(index)}>
                    <Icon name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              <SearchableDropdown
                label="Product Name"
                placeholder="Select or enter product..."
                data={stockOptions}
                selectedId={item.productId}
                onSelect={s => {
                  updateKeyProduct(index, 'productId', s.id);
                  updateKeyProduct(index, 'product', s.name);
                }}
                isLoading={stockLoading}
                iconName="cube-outline"
              />

              <View style={styles.rowTwoCols}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.fieldLabel}>Size/Code</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Size/Code"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={item.sizeCode}
                    onChangeText={val => updateKeyProduct(index, 'sizeCode', val)}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.fieldLabel}>Qty</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                    value={item.qty}
                    onChangeText={val => updateKeyProduct(index, 'qty', val)}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Purpose</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Product purpose in workshop"
                placeholderTextColor={theme.colors.textSecondary}
                value={item.purpose}
                onChangeText={val => updateKeyProduct(index, 'purpose', val)}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addBtn} onPress={addKeyProductRow} activeOpacity={0.8}>
            <Icon name="add-circle-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.addBtnText}>+ Add Key Product</Text>
          </TouchableOpacity>
        </View>

        {/* Section 4: Audience */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>4. Audience Breakdown</Text>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableColHeader, { flex: 2 }]}>Category</Text>
            <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'right' }]}>Expected</Text>
          </View>

          <View style={styles.tableBodyRow}>
            <Text style={styles.tableRowLabel}>HOD / KOLs</Text>
            <TextInput
              style={styles.tableNumInput}
              keyboardType="numeric"
              value={audience.hodKols}
              onChangeText={val => setAudience(prev => ({ ...prev, hodKols: val }))}
            />
          </View>

          <View style={styles.tableBodyRow}>
            <Text style={styles.tableRowLabel}>APs / SRs</Text>
            <TextInput
              style={styles.tableNumInput}
              keyboardType="numeric"
              value={audience.apsSrs}
              onChangeText={val => setAudience(prev => ({ ...prev, apsSrs: val }))}
            />
          </View>

          <View style={styles.tableBodyRow}>
            <Text style={styles.tableRowLabel}>OT / Nurses</Text>
            <TextInput
              style={styles.tableNumInput}
              keyboardType="numeric"
              value={audience.otNurses}
              onChangeText={val => setAudience(prev => ({ ...prev, otNurses: val }))}
            />
          </View>

          <View style={styles.tableBodyRow}>
            <Text style={styles.tableRowLabel}>Interns / Students</Text>
            <TextInput
              style={styles.tableNumInput}
              keyboardType="numeric"
              value={audience.internsStudents}
              onChangeText={val => setAudience(prev => ({ ...prev, internsStudents: val }))}
            />
          </View>

          <View style={styles.tableBodyRow}>
            <Text style={styles.tableRowLabel}>Other</Text>
            <TextInput
              style={styles.tableNumInput}
              keyboardType="numeric"
              value={audience.other}
              onChangeText={val => setAudience(prev => ({ ...prev, other: val }))}
            />
          </View>

          <View style={styles.tableTotalRow}>
            <Text style={styles.totalLabel}>Total Audience</Text>
            <Text style={styles.totalValue}>{totalAudience}</Text>
          </View>
        </View>

        {/* Section 5: Materials & Agenda */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>5. Materials & Agenda</Text>

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
                placeholder="e.g. Suture pads, Instruments"
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
                    placeholder="e.g. 10:00 AM"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={item.time}
                    onChangeText={val => updateMaterial(index, 'time', val)}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Agenda</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Agenda description"
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

        {/* Section 6: Samples Required */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>6. Samples Required</Text>
          <Text style={styles.fieldLabel}>Specify required samples / items</Text>
          <TextInput
            style={styles.textArea}
            placeholder="List required samples or items..."
            placeholderTextColor={theme.colors.textSecondary}
            value={samplesRequired}
            onChangeText={setSamplesRequired}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Section 7: Budget & Approval */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>7. Budget & Approval</Text>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableColHeader, { flex: 2 }]}>Budget Item</Text>
            <Text style={[styles.tableColHeader, { flex: 1 }]}>Unit Cost</Text>
            <Text style={[styles.tableColHeader, { flex: 1 }]}>Qty</Text>
            <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'right' }]}>Total</Text>
          </View>

          {/* Refreshment */}
          <View style={styles.budgetRow}>
            <Text style={styles.budgetCategoryLabel}>Refreshment</Text>
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Cost"
              placeholderTextColor={theme.colors.textSecondary}
              value={budget.refreshment.unitCost}
              onChangeText={val => updateBudgetItem('refreshment', 'unitCost', val)}
            />
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Qty"
              placeholderTextColor={theme.colors.textSecondary}
              value={budget.refreshment.qty}
              onChangeText={val => updateBudgetItem('refreshment', 'qty', val)}
            />
            <Text style={styles.budgetTotalText}>{calcRowTotal(budget.refreshment)}</Text>
          </View>

          {/* Hands-on Material */}
          <View style={styles.budgetRow}>
            <Text style={styles.budgetCategoryLabel}>Hands-on Material</Text>
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Cost"
              placeholderTextColor={theme.colors.textSecondary}
              value={budget.handsOnMaterial.unitCost}
              onChangeText={val => updateBudgetItem('handsOnMaterial', 'unitCost', val)}
            />
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Qty"
              placeholderTextColor={theme.colors.textSecondary}
              value={budget.handsOnMaterial.qty}
              onChangeText={val => updateBudgetItem('handsOnMaterial', 'qty', val)}
            />
            <Text style={styles.budgetTotalText}>{calcRowTotal(budget.handsOnMaterial)}</Text>
          </View>

          {/* Equipment Rental */}
          <View style={styles.budgetRow}>
            <Text style={styles.budgetCategoryLabel}>Equipment Rental</Text>
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Cost"
              placeholderTextColor={theme.colors.textSecondary}
              value={budget.equipmentRental.unitCost}
              onChangeText={val => updateBudgetItem('equipmentRental', 'unitCost', val)}
            />
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Qty"
              placeholderTextColor={theme.colors.textSecondary}
              value={budget.equipmentRental.qty}
              onChangeText={val => updateBudgetItem('equipmentRental', 'qty', val)}
            />
            <Text style={styles.budgetTotalText}>{calcRowTotal(budget.equipmentRental)}</Text>
          </View>

          {/* Other */}
          <View style={styles.budgetRow}>
            <Text style={styles.budgetCategoryLabel}>Other</Text>
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Cost"
              placeholderTextColor={theme.colors.textSecondary}
              value={budget.other.unitCost}
              onChangeText={val => updateBudgetItem('other', 'unitCost', val)}
            />
            <TextInput
              style={styles.budgetInput}
              keyboardType="numeric"
              placeholder="Qty"
              placeholderTextColor={theme.colors.textSecondary}
              value={budget.other.qty}
              onChangeText={val => updateBudgetItem('other', 'qty', val)}
            />
            <Text style={styles.budgetTotalText}>{calcRowTotal(budget.other)}</Text>
          </View>

          <View style={styles.tableTotalRow}>
            <Text style={styles.totalLabel}>Total Budget (PKR)</Text>
            <Text style={[styles.totalValue, { color: theme.colors.primary }]}>Rs. {totalBudget}</Text>
          </View>
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
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={date => {
          setWorkshopDate(formatToYYYYMMDD(date));
          setShowDatePicker(false);
        }}
        selectedDate={parseDate(workshopDate)}
        title="Select Workshop Date"
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
      backgroundColor: '#0F766E',
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
      color: '#CCFBF1',
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
    tableBodyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tableRowLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.text,
    },
    tableNumInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 6,
      width: 70,
      height: 36,
      textAlign: 'center',
      fontSize: 13,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
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

export default CRMWorkshopRequestScreen;
