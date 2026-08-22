import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectCurrentUser } from '@store/slices/authSlice';
import { useTheme } from '@config/useTheme';
import { ThemeDropdown } from '@components/common';
import { useGetHospitalDataMutation, useGetContactsDataMutation } from '@api/portalApi';
import { useFocusEffect } from '@react-navigation/native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT =
  Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.16 : SCREEN_HEIGHT * 0.14;

const CRMDashboardTab = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const styles = getStyles(theme);

  const [hospitalsData, setHospitalsData] = useState([]);
  const [contactsData, setContactsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [getHospitalData] = useGetHospitalDataMutation();
  const [getContactsData] = useGetContactsDataMutation();

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const uId = user?.id || user?.company_user_id || '';
      const rId = user?.role_id;

      const [hospRes, contactRes] = await Promise.all([
        getHospitalData({ user_id: uId, role_id: rId, company: 'CRM' })
          .unwrap()
          .catch(() => ({ status: 'false', data: [] })),
        getContactsData({ user_id: uId, role_id: rId, company: 'CRM' })
          .unwrap()
          .catch(() => ({ status: 'false', data: [] })),
      ]);

      if (hospRes?.status === 'true' && Array.isArray(hospRes.data)) {
        setHospitalsData(hospRes.data);
      } else {
        setHospitalsData([]);
      }

      if (contactRes?.status === 'true' && Array.isArray(contactRes.data)) {
        setContactsData(contactRes.data);
      } else {
        setContactsData([]);
      }
    } catch (e) {
      console.log('Error loading CRM Dashboard counts:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.company_user_id, user?.role_id, getHospitalData, getContactsData]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  // Hospital Dynamic Counts
  const totalHospitals = hospitalsData.length;
  const activeHospitalsCount = hospitalsData.filter(h => {
    const s = (h.customer_status || h.status || '').toLowerCase();
    return s === 'active' || s === '1' || s === '';
  }).length;
  const activeHospitals = totalHospitals > 0 ? (activeHospitalsCount || totalHospitals) : 0;
  const hospitalPct = totalHospitals > 0 ? Math.round((activeHospitals / totalHospitals) * 100) : 0;

  const tier1Count = hospitalsData.filter(h => {
    const tid = String(h.tier_id || '').toLowerCase();
    const tname = (h.tier || '').toLowerCase();
    return tid === '1' || tname.includes('tier 1') || tname === '1';
  }).length;

  const tier2Count = hospitalsData.filter(h => {
    const tid = String(h.tier_id || '').toLowerCase();
    const tname = (h.tier || '').toLowerCase();
    return tid === '2' || tname.includes('tier 2') || tname === '2';
  }).length;

  const tier3Count = hospitalsData.filter(h => {
    const tid = String(h.tier_id || '').toLowerCase();
    const tname = (h.tier || '').toLowerCase();
    return tid === '3' || tname.includes('tier 3') || tname === '3';
  }).length;

  // Contact Dynamic Counts
  const totalContacts = contactsData.length;
  const activeContactsCount = contactsData.filter(c => {
    const s = (c.status || '').toLowerCase();
    return s === 'active' || s === '1' || s === '';
  }).length;
  const activeContacts = totalContacts > 0 ? (activeContactsCount || totalContacts) : 0;
  const contactPct = totalContacts > 0 ? Math.round((activeContacts / totalContacts) * 100) : 0;

  const doctorCount = contactsData.filter(c => {
    const title = (c.title_name || c.designation || c.role || '').toLowerCase();
    return title.includes('doc') || title.includes('dr');
  }).length;

  const nurseCount = contactsData.filter(c => {
    const title = (c.title_name || c.designation || c.role || '').toLowerCase();
    return title.includes('nurse');
  }).length;

  const adminCount = contactsData.filter(c => {
    const title = (c.title_name || c.designation || c.role || '').toLowerCase();
    return title.includes('admin') || title.includes('manager') || title.includes('head');
  }).length;

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Theme Header */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerContent} edges={['top']}>
          <View style={styles.topBar}>
            <View style={styles.companyInfo}>
              <Text style={styles.headerTitle}>CRM</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn}>
                <Icon name="notifications-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.themeIcon}>
                <ThemeDropdown />
              </View>
              <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
                <Icon name="log-out-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* HOSPITALS CARD */}
        <View style={styles.card}>
          {/* Card Header */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconWrap}>
              <Icon name="business" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>Hospitals</Text>
            </View>
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeNumber}>{totalHospitals}</Text>
            </View>
          </View>

          {/* Active Accounts SubHeader */}
          <View style={styles.subInfoRow}>
            <Text style={styles.subInfoLabel}>Active accounts</Text>
            <Text style={styles.subInfoVal}>{`${activeHospitals}/${totalHospitals}`}</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${hospitalPct}%` }]} />
          </View>

          {/* Tier Counts */}
          <View style={styles.tierRow}>
            <View style={styles.tierBox}>
              <Text style={styles.tierLabel}>Tier 1</Text>
              <Text style={styles.tierVal}>{tier1Count}</Text>
            </View>
            <View style={styles.tierBox}>
              <Text style={styles.tierLabel}>Tier 2</Text>
              <Text style={styles.tierVal}>{tier2Count}</Text>
            </View>
            <View style={styles.tierBox}>
              <Text style={styles.tierLabel}>Tier 3</Text>
              <Text style={styles.tierVal}>{tier3Count}</Text>
            </View>
          </View>

          {/* Card Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigation.navigate('CRMHospitalList')}
            >
              <Icon name="eye-outline" size={16} color={theme.colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('CRMAddHospital')}
            >
              <Icon name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CONTACTS CARD */}
        <View style={styles.card}>
          {/* Card Header */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconWrap}>
              <Icon name="people" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>Contacts</Text>
            </View>
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeNumber}>{totalContacts}</Text>
            </View>
          </View>

          {/* Active Contacts SubHeader */}
          <View style={styles.subInfoRow}>
            <Text style={styles.subInfoLabel}>Active contacts</Text>
            <Text style={styles.subInfoVal}>{`${activeContacts}/${totalContacts}`}</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${contactPct}%` }]} />
          </View>

          {/* Roles Counts */}
          <View style={styles.tierRow}>
            <View style={styles.tierBox}>
              <Text style={styles.tierLabel}>Doctors</Text>
              <Text style={styles.tierVal}>{doctorCount}</Text>
            </View>
            <View style={styles.tierBox}>
              <Text style={styles.tierLabel}>Nurses</Text>
              <Text style={styles.tierVal}>{nurseCount}</Text>
            </View>
            <View style={styles.tierBox}>
              <Text style={styles.tierLabel}>Admins</Text>
              <Text style={styles.tierVal}>{adminCount}</Text>
            </View>
          </View>

          {/* Card Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigation.navigate('CRMContactList')}
            >
              <Icon name="eye-outline" size={16} color={theme.colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('CRMAddLead')}
            >
              <Icon name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      height: HEADER_HEIGHT,
      backgroundColor: theme.colors.primary,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    headerContent: {
      flex: 1,
      paddingHorizontal: 20,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
    },
    companyInfo: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconBtn: {
      padding: 6,
      marginLeft: 4,
    },
    themeIcon: {
      marginLeft: 4,
    },
    scrollContent: {
      padding: 16,
      paddingTop: 20,
      gap: 16,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    cardTitleWrap: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.text,
    },
    badgeWrap: {
      alignItems: 'flex-end',
    },
    badgeNumber: {
      fontSize: 22,
      fontWeight: '900',
      color: theme.colors.primary,
    },
    badgeSub: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    subInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    subInfoLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    subInfoVal: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.text,
    },
    progressBarBg: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.border,
      overflow: 'hidden',
      marginBottom: 16,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
    },
    tierRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: theme.colors.background,
      paddingVertical: 10,
      borderRadius: 10,
      marginBottom: 16,
    },
    tierBox: {
      alignItems: 'center',
    },
    tierLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    tierVal: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.text,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    viewAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    viewAllText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 20,
    },
    addBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },
  });

export default CRMDashboardTab;
