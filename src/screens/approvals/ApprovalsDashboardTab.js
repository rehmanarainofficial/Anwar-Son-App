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
  RefreshControl,
  Modal,
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

  // Modal State for Selected Activity Status Popup
  const [selectedActivityModal, setSelectedActivityModal] = useState(null);

  const fetchAllActivities = useCallback(async () => {
    if (!user?.id) return;
    const payload = {
      user_id: user.id,
      role_id: user?.role_id || '2',
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
        const val = resPromo.value;
        if (Array.isArray(val.data)) {
          setPromoList(val.data);
        } else if (val.data && Array.isArray(val.data.promotional)) {
          setPromoList(val.data.promotional);
        }
      }

      if (resGiveaway.status === 'fulfilled' && resGiveaway.value) {
        const val = resGiveaway.value;
        if (Array.isArray(val.data)) {
          setGiveawayList(val.data);
        } else if (val.data && Array.isArray(val.data.giveaways)) {
          setGiveawayList(val.data.giveaways);
        }
      }

      if (resWorkshop.status === 'fulfilled' && resWorkshop.value) {
        const val = resWorkshop.value;
        if (val.data && Array.isArray(val.data.workshops)) {
          setWorkshopList(val.data.workshops);
        } else if (Array.isArray(val.data)) {
          setWorkshopList(val.data);
        }
      }

      if (resConference.status === 'fulfilled' && resConference.value) {
        const val = resConference.value;
        if (val.data && Array.isArray(val.data.conferences)) {
          setConferenceList(val.data.conferences);
        } else if (val.data && Array.isArray(val.data.workshops)) {
          setConferenceList(val.data.workshops);
        } else if (Array.isArray(val.data)) {
          setConferenceList(val.data);
        }
      }

      if (resSample.status === 'fulfilled' && resSample.value) {
        const val = resSample.value;
        if (Array.isArray(val.data)) {
          setSampleList(val.data);
        } else if (val.data && Array.isArray(val.data.samples)) {
          setSampleList(val.data.samples);
        }
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

  useEffect(() => {
    fetchAllActivities();
  }, [fetchAllActivities]);

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
      const s = String(item.status_id !== undefined && item.status_id !== null ? item.status_id : '').trim();
      const statusName = String(item.status || item.status_name || '').trim().toLowerCase();

      if (s === '1' || statusName === 'draft') draft++;
      else if (s === '2' || statusName === 'submit for approval' || statusName === 'pending') pending++;
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

  const handleSelectStatusChoice = (act, statusId) => {
    setSelectedActivityModal(null);
    navigation.navigate(act.screen, { statusId });
  };

  const pendingItems = [
    {
      id: 'leave_approval_pending',
      title: 'Leave Approval',
      subtext: 'Department & Manager Leave Approvals',
      date: 'Active',
      icon: 'calendar-outline',
      screen: 'LeaveApproval',
    },
    {
      id: 'field_expense',
      title: 'Field expense',
      subtext: 'Rs 2,400',
      date: 'Raised Jun 24, 10:15 AM',
      icon: 'card-outline',
      screen: 'CRMMonthlyExpenseApproval',
    },
    {
      id: 'discount_request',
      title: 'Discount request',
      subtext: 'Crescent Heart Institute -10%',
      date: 'Raised Jun 25, 2:30 PM',
      icon: 'pricetag-outline',
      screen: 'EmptyPlaceholder',
      params: { title: 'Discount Request Approval' },
    },
  ];

  const approvedItems = [
    {
      id: 'leave_request',
      title: 'Leave request',
      subtext: 'Leave Approvals Inquiry',
      date: 'Latest',
      icon: 'calendar-outline',
      screen: 'LeaveApproval',
    },
  ];

  const rejectedItems = [
    {
      id: 'sample_request',
      title: 'Sample request',
      subtext: 'City General Hospital',
      date: 'Raised Jun 18, 11:45 AM',
      icon: 'flask-outline',
      screen: 'CRMSampleRequest',
    },
  ];

  const renderApprovalCard = (item, badgeType) => {
    let badgeText = 'Pending';
    let badgeColor = theme.colors.warning || theme.colors.primary;

    if (badgeType === 'APPROVED') {
      badgeText = 'Approved';
      badgeColor = theme.colors.success || theme.colors.primary;
    } else if (badgeType === 'REJECTED') {
      badgeText = 'Rejected';
      badgeColor = theme.colors.error || theme.colors.primary;
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => navigation.navigate(item.screen, item.params)}
      >
        <View style={styles.iconWrap}>
          <Icon name={item.icon} size={22} color={theme.colors.primary} />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtext}>{item.subtext}</Text>
          <View style={styles.dateRow}>
            <Icon
              name="time-outline"
              size={12}
              color={theme.colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        </View>

        <View style={[styles.badge, { backgroundColor: badgeColor + '20' }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>
            {badgeText}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const isLoadingAll =
    promoLoading || giveawayLoading || workshopLoading || conferenceLoading;

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
        {/* FIELD ACTIVITIES REQUESTS SECTION (HOME STYLE CLEAN CIRCLE ICONS) */}
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
            {activityItems.map(act => (
              <TouchableOpacity
                key={act.id}
                style={styles.fieldReqItem}
                onPress={() => setSelectedActivityModal(act)}
                activeOpacity={0.75}
              >
                <View style={styles.circleWrap}>
                  <View
                    style={[
                      styles.fieldReqCircle,
                      { backgroundColor: theme.colors.primary + '15' },
                    ]}
                  >
                    <Icon
                      name={act.icon}
                      size={22}
                      color={theme.colors.primary}
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
                <Text style={styles.fieldReqLabel} numberOfLines={1}>
                  {act.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* PENDING SECTION */}
        <View style={[styles.sectionHeaderWrap, { marginTop: 16 }]}>
          <View style={styles.accentBar} />
          <Text style={styles.sectionTitle}>PENDING</Text>
        </View>
        {pendingItems.map(item => renderApprovalCard(item, 'PENDING'))}

        {/* APPROVED SECTION */}
        <View style={[styles.sectionHeaderWrap, { marginTop: 14 }]}>
          <View style={styles.accentBar} />
          <Text style={styles.sectionTitle}>APPROVED</Text>
        </View>
        {approvedItems.map(item => renderApprovalCard(item, 'APPROVED'))}

        {/* REJECTED SECTION */}
        <View style={[styles.sectionHeaderWrap, { marginTop: 14 }]}>
          <View style={styles.accentBar} />
          <Text style={styles.sectionTitle}>REJECTED</Text>
        </View>
        {rejectedItems.map(item => renderApprovalCard(item, 'REJECTED'))}
      </ScrollView>

      {/* STATUS SELECTION MODAL POPUP */}
      <Modal
        visible={!!selectedActivityModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedActivityModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedActivityModal(null)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderLeft}>
                <View
                  style={[
                    styles.modalHeaderIconWrap,
                    { backgroundColor: theme.colors.primary + '18' },
                  ]}
                >
                  <Icon
                    name={selectedActivityModal?.icon || 'layers-outline'}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {selectedActivityModal?.title} Approvals
                  </Text>
                  <Text style={styles.modalSubTitle}>
                    Select status filter to view requests
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedActivityModal(null)}
                style={styles.closeBtn}
              >
                <Icon name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {STATUS_CONFIG.map(st => {
                const count = selectedActivityModal?.counts[st.id] || 0;
                return (
                  <TouchableOpacity
                    key={st.id}
                    style={styles.statusOptionRow}
                    onPress={() => handleSelectStatusChoice(selectedActivityModal, st.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.statusOptionLeft}>
                      <View style={[styles.statusIconWrap, { backgroundColor: st.bg }]}>
                        <Icon name={st.icon} size={18} color={st.text} />
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
            </ScrollView>
          </View>
        </TouchableOpacity>
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
      paddingVertical: 8,
      paddingHorizontal: 4,
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
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.colors.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.text,
      marginBottom: 2,
    },
    cardSubtext: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 12,
      marginLeft: 8,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '800',
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 18,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    modalHeaderIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    modalTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.text,
    },
    modalSubTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    closeBtn: {
      padding: 4,
    },
    modalDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 12,
    },
    statusOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 6,
      backgroundColor: theme.colors.background,
    },
    statusOptionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    statusOptionName: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.text,
    },
    statusCountBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    statusCountText: {
      fontSize: 12,
      fontWeight: '900',
    },
  });

export default ApprovalsDashboardTab;
