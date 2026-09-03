import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectCurrentUser } from '@store/slices/authSlice';
import { useTheme } from '@config/useTheme';
import { ThemeDropdown } from '@components/common';
import {
  useGetPromotionalDataMutation,
  useGetGiveawayDataMutation,
  useGetWorkshopDataMutation,
  useGetConferenceDataMutation,
  useGetSampleDataMutation,
} from '@api/baseApi';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT =
  Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.16 : SCREEN_HEIGHT * 0.14;

const STATUS_CONFIG = [
  { id: 'all', name: 'All Requests', bg: '#F3F4F6', text: '#374151', icon: 'layers-outline' },
  { id: '2', name: 'Submit for Approval', bg: '#DBEAFE', text: '#1E40AF', icon: 'time-outline' },
  { id: '3', name: 'Approved', bg: '#D1FAE5', text: '#065F46', icon: 'checkmark-circle-outline' },
  { id: '4', name: 'Rejected', bg: '#FEE2E2', text: '#991B1B', icon: 'close-circle-outline' },
  { id: '5', name: 'Resubmit', bg: '#FFEDD5', text: '#C2410C', icon: 'refresh-circle-outline' },
  { id: '1', name: 'Draft', bg: '#FEF3C7', text: '#92400E', icon: 'create-outline' },
  { id: '6', name: 'Completed', bg: '#E0E7FF', text: '#3730A3', icon: 'ribbon-outline' },
];

const extractList = (val, keys = []) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (Array.isArray(val.data)) return val.data;

  for (const key of keys) {
    if (val[key] && Array.isArray(val[key])) return val[key];
    if (val.data && val.data[key] && Array.isArray(val.data[key])) return val.data[key];
  }

  if (val.data && typeof val.data === 'object') {
    for (const k in val.data) {
      if (Array.isArray(val.data[k])) return val.data[k];
    }
  }
  return [];
};

const ApprovalsDashboardTab = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const styles = getStyles(theme);

  // API Mutations
  const [getPromotionalData, { isLoading: promoLoading }] =
    useGetPromotionalDataMutation();
  const [getGiveawayData, { isLoading: giveawayLoading }] =
    useGetGiveawayDataMutation();
  const [getWorkshopData, { isLoading: workshopLoading }] =
    useGetWorkshopDataMutation();
  const [getConferenceData, { isLoading: conferenceLoading }] =
    useGetConferenceDataMutation();
  const [getSampleData, { isLoading: sampleLoading }] =
    useGetSampleDataMutation();

  // Data States
  const [promoList, setPromoList] = useState([]);
  const [giveawayList, setGiveawayList] = useState([]);
  const [workshopList, setWorkshopList] = useState([]);
  const [conferenceList, setConferenceList] = useState([]);
  const [sampleList, setSampleList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Selected Active Field Activity Category (Default: promotional)
  const [selectedCategoryId, setSelectedCategoryId] = useState('promotional');

  const fetchAllActivities = useCallback(async () => {
    if (!user?.id) return;

    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - 1);
    const formatToYYYYMMDD = d =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;

    const payload = {
      user_id: user.id,
      role_id: user?.role_id !== undefined ? String(user.role_id) : '2',
      company: 'CRM',
      from_date: formatToYYYYMMDD(from),
      to_date: formatToYYYYMMDD(to),
    };

    try {
      const [resPromo, resGiveaway, resWorkshop, resConference, resSample] =
        await Promise.allSettled([
          getPromotionalData(payload).unwrap(),
          getGiveawayData(payload).unwrap(),
          getWorkshopData(payload).unwrap(),
          getConferenceData(payload).unwrap(),
          getSampleData(payload).unwrap(),
        ]);

      if (resPromo.status === 'fulfilled' && resPromo.value) {
        setPromoList(
          extractList(resPromo.value, [
            'promotional',
            'promotional_data',
            'promotions',
          ]),
        );
      }

      if (resGiveaway.status === 'fulfilled' && resGiveaway.value) {
        setGiveawayList(
          extractList(resGiveaway.value, [
            'giveaways',
            'giveaway_data',
            'giveaway',
          ]),
        );
      }

      if (resWorkshop.status === 'fulfilled' && resWorkshop.value) {
        setWorkshopList(
          extractList(resWorkshop.value, [
            'workshops',
            'workshop_data',
            'workshop',
          ]),
        );
      }

      if (resConference.status === 'fulfilled' && resConference.value) {
        setConferenceList(
          extractList(resConference.value, [
            'conferences',
            'conference_data',
            'conference',
          ]),
        );
      }

      if (resSample.status === 'fulfilled' && resSample.value) {
        setSampleList(
          extractList(resSample.value, ['samples', 'sample_data', 'sample']),
        );
      }
    } catch (error) {
      console.log('Error fetching field activity approvals data:', error);
    }
  }, [
    user?.id,
    user?.role_id,
    getPromotionalData,
    getGiveawayData,
    getWorkshopData,
    getConferenceData,
    getSampleData,
  ]);

  useFocusEffect(
    useCallback(() => {
      fetchAllActivities();
    }, [fetchAllActivities]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllActivities();
    setRefreshing(false);
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  // Status Counts Calculator Helper
  const getStatusCounts = (list = []) => {
    let draft = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let resubmit = 0;
    let completed = 0;

    list.forEach(item => {
      const s = String(
        item.status_id !== undefined && item.status_id !== null
          ? item.status_id
          : '',
      ).trim();
      const statusName = String(item.status || item.status_name || '')
        .trim()
        .toLowerCase();

      if (s === '1' || statusName === 'draft') draft++;
      else if (
        s === '2' ||
        statusName === 'submit for approval' ||
        statusName === 'pending'
      )
        pending++;
      else if (s === '3' || statusName === 'approved') approved++;
      else if (s === '4' || statusName === 'rejected') rejected++;
      else if (s === '5' || statusName === 'resubmit') resubmit++;
      else if (s === '6' || statusName === 'completed') completed++;
    });

    return {
      all: list.length,
      total: list.length,
      '1': draft,
      '2': pending,
      '3': approved,
      '4': rejected,
      '5': resubmit,
      '6': completed,
    };
  };

  // Activity Configuration
  const activityItems = [
    {
      id: 'promotional',
      title: 'Promotional',
      screen: 'CRMPromotionalRequest',
      icon: 'megaphone-outline',
      list: promoList,
      counts: getStatusCounts(promoList),
    },
    {
      id: 'giveaway',
      title: 'Giveaway',
      screen: 'CRMGiveawayRequest',
      icon: 'gift-outline',
      list: giveawayList,
      counts: getStatusCounts(giveawayList),
    },
    {
      id: 'workshop',
      title: 'Workshop',
      screen: 'CRMWorkshopRequest',
      icon: 'school-outline',
      list: workshopList,
      counts: getStatusCounts(workshopList),
    },
    {
      id: 'conference',
      title: 'Conference',
      screen: 'CRMConferenceRequest',
      icon: 'people-outline',
      list: conferenceList,
      counts: getStatusCounts(conferenceList),
    },
    {
      id: 'sample',
      title: 'Sample',
      screen: 'CRMSampleRequest',
      icon: 'flask-outline',
      list: sampleList,
      counts: getStatusCounts(sampleList),
    },
  ];

  const activeCategory =
    activityItems.find(a => a.id === selectedCategoryId) || activityItems[0];

  const isLoadingAll =
    promoLoading || giveawayLoading || workshopLoading || conferenceLoading || sampleLoading;

  return (
    <View style={styles.container}>
      {/* Dynamic Theme Header */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerContent} edges={['top']}>
          <View style={styles.topBar}>
            <View style={styles.companyInfo}>
              <Text style={styles.headerTitle}>Approvals</Text>
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
        {/* FIELD ACTIVITIES SELECTION ROW */}
        <View style={styles.sectionHeaderWrap}>
          <View style={styles.accentBar} />
          <Text style={styles.sectionTitle}>FIELD ACTIVITIES APPROVALS</Text>
        </View>

        {isLoadingAll && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : (
          <View style={styles.fieldReqRow}>
            {activityItems.map(act => {
              const isSelected = selectedCategoryId === act.id;
              return (
                <TouchableOpacity
                  key={act.id}
                  style={styles.fieldReqItem}
                  onPress={() => setSelectedCategoryId(act.id)}
                  activeOpacity={0.75}
                >
                  <View style={styles.circleWrap}>
                    <View
                      style={[
                        styles.fieldReqCircle,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.primary + '15',
                          borderWidth: isSelected ? 2 : 0,
                          borderColor: theme.colors.primary,
                        },
                      ]}
                    >
                      <Icon
                        name={act.icon}
                        size={22}
                        color={isSelected ? '#FFFFFF' : theme.colors.primary}
                      />
                    </View>
                    {act.counts.total > 0 ? (
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>
                          {act.counts.total}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.fieldReqLabel,
                      {
                        color: isSelected
                          ? theme.colors.primary
                          : theme.colors.text,
                        fontWeight: isSelected ? '900' : '700',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {act.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* STATUS FILTERS SECTION (DISPLAYED INLINE ON SCREEN IN PLACE OF OLD PENDING/APPROVED) */}
        <View style={[styles.sectionHeaderWrap, { marginTop: 16 }]}>
          <View style={styles.accentBar} />
          <Text style={styles.sectionTitle}>
            {activeCategory?.title?.toUpperCase()} STATUS FILTERS
          </Text>
        </View>

        <View style={styles.statusCardsList}>
          {STATUS_CONFIG.map(st => {
            const count = activeCategory?.counts ? activeCategory.counts[st.id] || 0 : 0;
            return (
              <TouchableOpacity
                key={st.id}
                style={styles.statusOptionCard}
                onPress={() => navigation.navigate(activeCategory.screen, { statusId: st.id })}
                activeOpacity={0.75}
              >
                <View style={styles.statusOptionLeft}>
                  <View style={[styles.statusIconWrap, { backgroundColor: st.bg }]}>
                    <Icon name={st.icon} size={20} color={st.text} />
                  </View>
                  <Text style={styles.statusOptionName}>{st.name}</Text>
                </View>

                <View style={[styles.statusCountBadge, { backgroundColor: st.bg }]}>
                  <Text style={[styles.statusCountText, { color: st.text }]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
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
      paddingTop: 16,
      gap: 10,
      paddingBottom: 32,
    },
    sectionHeaderWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    accentBar: {
      width: 4,
      height: 16,
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
      marginRight: 8,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '900',
      color: theme.colors.primary,
      letterSpacing: 0.5,
    },
    loaderWrap: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    fieldReqRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 6,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 18,
    },
    fieldReqItem: {
      alignItems: 'center',
      width: '19%',
    },
    circleWrap: {
      position: 'relative',
    },
    fieldReqCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    countBadge: {
      position: 'absolute',
      top: -3,
      right: -4,
      backgroundColor: theme.colors.primary,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      borderWidth: 1.5,
      borderColor: theme.colors.surface,
    },
    countBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '900',
    },
    fieldReqLabel: {
      fontSize: 10,
      textAlign: 'center',
    },
    statusCardsList: {
      marginTop: 4,
      gap: 8,
    },
    statusOptionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    statusOptionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    statusOptionName: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.text,
    },
    statusCountBadge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 12,
    },
    statusCountText: {
      fontSize: 13,
      fontWeight: '900',
    },
  });

export default ApprovalsDashboardTab;
