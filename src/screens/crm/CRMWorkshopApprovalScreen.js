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
    title: 'Advanced Cardiac Life Support (ACLS)',
    date: '17-Jun-2025',
    duration: '2 hours',
    hospital: 'Shifa Tameer-E-Millat University',
    department: 'Cardiac',
    workshopType: 'Educational, Hands-on Training',
    productSegment: 'Sutures, Airway Management',
    speciality: 'Cardiac Life Specialist',
    sutureDetails: 'Basic Surgical Skills',
    airwayDetails: 'Double Lumen Bronchial Tube',
    hemostasisDetails: 'N/A',
    surgicalMesh: 'N/A',
    productCategory: '1',
    purpose: 'Demonstration and hands-on',
    targetAudience: 'Head of Department: 111, KOLs: 222',
    objectives: 'Objective of this workshop is to provide hands-on experience.',
  },
  {
    id: '2',
    title: 'Basic Surgical Skills Training',
    date: '20-Aug-2025',
    duration: '4 hours',
    hospital: 'Aga Khan University Hospital',
    department: 'General Surgery',
    workshopType: 'Hands-on Training',
    productSegment: 'Sutures, Surgical Mesh',
    speciality: 'General Surgery',
    sutureDetails: 'Advanced Suturing Techniques',
    airwayDetails: 'N/A',
    hemostasisDetails: 'Hemostatic Agents Application',
    surgicalMesh: 'Hernia Mesh Repair',
    productCategory: '2',
    purpose: 'Skill enhancement',
    targetAudience: 'Residents: 50, Interns: 100',
    objectives: 'To improve basic surgical skills among residents.',
  },
];

const CRMWorkshopApprovalScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {/* Header: Title, Date, Duration */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.title, { color: theme.colors.primary }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {item.hospital} • {item.department}
          </Text>
        </View>
        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, { color: theme.colors.text }]}>{item.date}</Text>
          <Text style={[styles.durationText, { color: theme.colors.textSecondary }]}>{item.duration}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      {/* Row 1 */}
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Workshop Type</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{item.workshopType}</Text>
        </View>
        <View style={styles.col}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Product Segment</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{item.productSegment}</Text>
        </View>
      </View>

      {/* Row 2 */}
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Speciality</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{item.speciality}</Text>
        </View>
        <View style={styles.col}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Product Category</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{item.productCategory}</Text>
        </View>
      </View>

      {/* Details Row */}
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Suture Details</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{item.sutureDetails}</Text>
        </View>
        <View style={styles.col}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Airway Details</Text>
          <Text style={[styles.value, { color: theme.colors.text }]}>{item.airwayDetails}</Text>
        </View>
      </View>

      {/* Full width items */}
      <View style={styles.fullRow}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Target Audience</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{item.targetAudience}</Text>
      </View>
      
      <View style={styles.fullRow}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Objectives & Purpose</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{item.objectives} ({item.purpose})</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.primary + '15' }]}>
          <Icon name="create-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ffebee' }]}>
          <Icon name="trash-outline" size={18} color="#c62828" />
          <Text style={[styles.actionText, { color: '#c62828' }]}>Delete</Text>
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
                Workshops Inquiry
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
    fontSize: 22,
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
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

export default CRMWorkshopApprovalScreen;
