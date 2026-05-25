import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';

const mockData = [
  {
    id: '1',
    hospitalName: 'N/A',
    purpose: 'abc',
    approvedBy: 'Sports Medicine / Arthroscopy',
    salesRep: 'abc',
    recipientCategory: 'Craniotomy for Glioblastoma',
    expectedDate: '29-Oct-2025',
    salesRegion: 'abc',
    giveawayType: 'Cancer/Oncology',
    managerApproval: 'abc686',
    approvalDate: '29-Oct-2025',
    remarks: 'hellooooooooooooooooooo',
  },
  {
    id: '2',
    hospitalName: 'PAF Hospital',
    purpose: 'Promotional',
    approvedBy: 'Spine Surgery',
    salesRep: 'Hamza Hassan',
    recipientCategory: 'N/A',
    expectedDate: '22-Mar-2026',
    salesRegion: 'N/A',
    giveawayType: 'Spinal Tumor Decompression',
    managerApproval: 'Yes',
    approvalDate: '19-Mar-2026',
    remarks: 'The End User is an frequent buyer of our products....',
  },
  {
    id: '3',
    hospitalName: 'North West General Hospital',
    purpose: 'abc',
    approvedBy: 'Sports Medicine / Arthroscopy',
    salesRep: 'eee',
    recipientCategory: 'Coronary Artery Bypass',
    expectedDate: 'N/A',
    salesRegion: 'abc',
    giveawayType: 'Nephrectomy',
    managerApproval: 'N/A',
    approvalDate: 'N/A',
    remarks: 'N/A',
  },
  {
    id: '4',
    hospitalName: 'Peshawar General Hospital',
    purpose: 'N/A',
    approvedBy: 'N/A',
    salesRep: 'eee',
    recipientCategory: 'Craniotomy for Glioblastoma',
    expectedDate: 'N/A',
    salesRegion: 'N/A',
    giveawayType: 'Craniotomy for Glioblastoma',
    managerApproval: 'N/A',
    approvalDate: 'N/A',
    remarks: 'N/A',
  },
  {
    id: '5',
    hospitalName: 'North West General Hospital',
    purpose: '221',
    approvedBy: 'Joint Replacement / Arthroplasty',
    salesRep: 'aaaa',
    recipientCategory: 'Craniotomy for Glioblastoma',
    expectedDate: '07-Nov-2025',
    salesRegion: 'abc',
    giveawayType: 'Transplant',
    managerApproval: "1' 2' 12",
    approvalDate: '30-Oct-2025',
    remarks: '11111111111111111111',
  },
];

const CRMGiveawayApprovalScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Header: Hospital Name, Date */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.hospitalName, { color: theme.colors.primary }]} numberOfLines={2}>
            {item.hospitalName}
          </Text>
          <Text style={[styles.salesRep, { color: theme.colors.textSecondary }]}>
            Rep: {item.salesRep} {item.salesRegion !== 'N/A' ? `(${item.salesRegion})` : ''}
          </Text>
        </View>
        <View style={styles.dateContainer}>
          <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>Expected Date</Text>
          <Text style={[styles.dateText, { color: theme.colors.text }]}>{item.expectedDate}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      {/* Row 1 */}
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Purpose</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{item.purpose}</Text>
        </View>
        <View style={styles.col}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Giveaway Type</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{item.giveawayType}</Text>
        </View>
      </View>

      {/* Row 2 */}
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Approved By</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{item.approvedBy}</Text>
        </View>
        <View style={styles.col}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Recipient Category</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{item.recipientCategory}</Text>
        </View>
      </View>

      {/* Row 3 */}
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Manager Approval</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{item.managerApproval}</Text>
        </View>
        <View style={styles.col}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Approval Date</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{item.approvalDate}</Text>
        </View>
      </View>

      {/* Remarks */}
      {item.remarks !== 'N/A' && (
        <View style={styles.fullRow}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Remarks</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{item.remarks}</Text>
        </View>
      )}

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.primary + '15' }]}>
          <Icon name="create-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={mockData}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <Text style={[styles.screenTitle, { color: theme.colors.text }]}>
                Giveaway Inquiry
              </Text>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}>
                <Icon name="add" size={18} color="#FFF" />
                <Text style={styles.addBtnText}>Add New</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const getStyles = theme => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  salesRep: {
    fontSize: 13,
    fontWeight: '500',
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 2,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 16,
  },
  col: {
    flex: 1,
  },
  fullRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: '600',
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default CRMGiveawayApprovalScreen;
