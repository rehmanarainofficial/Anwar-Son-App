import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { useSelector } from 'react-redux';
import {
  useGetOrderShippingInfoMutation,
  useGetViewDataMutation,
} from '@api/portalApi';
import { selectCurrentUser } from '@store/slices/authSlice';
import { generateAndShareOrderChallanPDF } from '../../utils/PDFOrderChallanService';
import { CustomAlertModal } from '@components/common';

const SupplyInfoScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [shipments, setShipments] = useState([]);
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const { company } = useSelector(state => state.auth);
  const user = useSelector(selectCurrentUser);

  const [getOrderShippingInfo, { isLoading }] =
    useGetOrderShippingInfoMutation();
  const [getViewData, { isLoading: isViewLoading }] = useGetViewDataMutation();

  const handleViewDetail = async item => {
    try {
      const res = await getViewData({
        company: user?.company_user_code || company || '',
        trans_no: item.trans_no || '',
        type: item.type || '',
      }).unwrap();

      if (res && String(res.status_header) === 'true') {
        const headerData = res.data_header?.[0] || {};
        const detailData = res.data_detail || [];
        await generateAndShareOrderChallanPDF(
          'Delivery Challan',
          headerData,
          detailData,
          user?.company_name || '',
        );
      } else {
        console.log('API Response Error or No Data:', res);
      }
    } catch (e) {
      console.log('Error fetching view data', e);
      setModalConfig({
        visible: true,
        title: 'Error',
        message: e.message || 'Could not fetch data.',
      });
    }
  };

  const fetchShipments = async () => {
    try {
      const response = await getOrderShippingInfo({
        company: user?.company_user_code || company,
        user_id: user?.company_user_id || '',
      }).unwrap();

      if (response && String(response.status) === 'true') {
        setShipments(response.data || []);
      }
    } catch (error) {
      console.log('Error fetching shipments:', error);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const getStatusInfo = shipStatus => {
    const statusValue = String(shipStatus || '').trim();
    switch (statusValue) {
      case '0':
      case 'Not Start Yet':
        return { text: 'Not Start Yet', color: '#64748b', bg: '#f1f5f9' };
      case '1':
      case 'Booked':
        return { text: 'Booked', color: '#3b82f6', bg: '#dbeafe' };
      case '2':
      case 'In Transit':
        return { text: 'In Transit', color: '#f59e0b', bg: '#fef3c7' };
      case '3':
      case 'Arrived At OPS Facility':
        return {
          text: 'Arrived At OPS Facility',
          color: '#8b5cf6',
          bg: '#ede9fe',
        };
      case '4':
      case 'Out-for-Delivery':
        return { text: 'Out-for-Delivery', color: '#ec4899', bg: '#fce7f3' };
      case '5':
      case 'Delivered':
        return { text: 'Delivered', color: '#10b981', bg: '#d1fae5' };
      default:
        return { text: statusValue || 'In Transit', color: '#f59e0b', bg: '#fef3c7' };
    }
  };

  const filteredShipments = shipments.filter(item => {
    const query = searchQuery.toLowerCase();
    const customer = (item.customer || '').toLowerCase();
    const orderNo = (item.order_no || '').toLowerCase();
    const reference = (item.reference || '').toLowerCase();
    const tracking = (item.tracking_no || '').toLowerCase();
    const shipper = (item.shipper_name || '').toLowerCase();

    const matchesSearch =
      customer.includes(query) ||
      orderNo.includes(query) ||
      reference.includes(query) ||
      tracking.includes(query) ||
      shipper.includes(query);

    if (statusFilter === 'All') return matchesSearch;

    const statusInfo = getStatusInfo(item.shipment_status);
    return matchesSearch && statusInfo.text === statusFilter;
  });

  const formatDate = dateString => {
    if (
      !dateString ||
      dateString.includes('0000-00-00') ||
      dateString.includes('0020-00-00')
    )
      return '-';
    try {
      const date = new Date(dateString);
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return `${String(date.getDate()).padStart(2, '0')}-${
        months[date.getMonth()]
      }-${date.getFullYear()}`;
    } catch (e) {
      return dateString;
    }
  };

  const renderItem = ({ item }) => {
    const statusInfo = getStatusInfo(item.shipment_status);
    const statusText = statusInfo.text;
    const statusColor = statusInfo.color;
    const statusBg = statusInfo.bg;

    return (
      <View style={styles.card}>
        {/* Header - Hospital Name & Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.hospitalInfo}>
            <View style={styles.hospitalIconBg}>
              <Icon name="business" size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.hospitalName} numberOfLines={2}>
              {item.customer}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        {/* Total Amount & Reference - Stacked specifically for mobile */}
        <View style={styles.amountReferenceSection}>
          <View>
            <Text style={styles.infoLabel}>DN Reference</Text>
            <Text style={styles.infoValueDark}>{item.disp_reference}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.infoLabel}>Order Total</Text>
            <Text style={styles.totalAmount}>
              {parseFloat(item.total || 0).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Information Grid */}
        <View style={styles.detailsGrid}>
          {/* Row 1 */}
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Order Date</Text>
            <Text style={styles.infoValue}>{formatDate(item.ord_date)}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Dispatch Date</Text>
            <View style={styles.highlightBadge}>
              <Text style={styles.highlightBadgeText}>
                {formatDate(item.tran_date)}
              </Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Shipment Date</Text>
            <Text style={styles.infoValue}>
              {formatDate(item.Shipment_date)}
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={[styles.infoLabel, { color: theme.colors.primary }]}>
              Tracking #
            </Text>
            <Text
              style={[
                styles.infoValue,
                { color: theme.colors.primary, fontWeight: '700' },
              ]}
            >
              {item.tracking_no || 'Not Available'}
            </Text>
          </View>

          {/* Row 3 */}
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Ship Via</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.shipper_name || '-'}
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Received By</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.person || '-'}
            </Text>
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Reference</Text>
            <Text style={styles.infoValueDark}>{item.reference}</Text>
          </View>
        </View>

        {/* Delivery Address Box */}
        <View style={styles.addressCell}>
          <Icon
            name="location-outline"
            size={18}
            color="#ca8a04"
            style={{ marginRight: 8, marginTop: 2 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.infoLabel, { color: '#ca8a04', marginBottom: 2 }]}
            >
              Delivery Address
            </Text>
            <Text style={[styles.infoValue, { color: '#a16207' }]}>
              {item.delivery_address || '-'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={[
              styles.detailBtn,
              { flex: 1, backgroundColor: theme.colors.success + '1A' },
            ]}
            onPress={() =>
              navigation.navigate('SalesPayment', {
                customer: { name: item.customer },
              })
            }
          >
            <Text
              style={[styles.detailBtnText, { color: theme.colors.success }]}
            >
              Payment
            </Text>
            <Icon name="cash-outline" size={16} color={theme.colors.success} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.detailBtn, { flex: 1 }]}
            onPress={() => handleViewDetail(item)}
            disabled={isViewLoading}
          >
            {isViewLoading ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary}
                style={{ marginRight: 6 }}
              />
            ) : null}
            <Text style={styles.detailBtnText}>View Details</Text>
            <Icon
              name="arrow-forward-outline"
              size={16}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header section optimized for mobile */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Shipments</Text>
        <Text style={styles.pageSubtitle}>Real-time tracking dashboard</Text>

        <View style={styles.searchContainer}>
          <Icon
            name="search-outline"
            size={20}
            color={theme.colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shipments..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            Showing {filteredShipments.length} records
          </Text>
        </View>

        {/* Filters Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {[
            'Not Start Yet',
            'Booked',
            'In Transit',
            'Arrived At OPS Facility',
            'Out-for-Delivery',
            'Delivered',
          ].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                statusFilter === status && styles.filterChipActive,
              ]}
              onPress={() =>
                setStatusFilter(statusFilter === status ? 'All' : status)
              }
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === status && styles.filterChipTextActive,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.clearFilterBtn}
            onPress={() => {
              setSearchQuery('');
              setStatusFilter('All');
            }}
          >
            <Icon name="refresh-outline" size={14} color="#64748b" />
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {isLoading && shipments.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredShipments}
          keyExtractor={(item, index) => `${item.order_no || 'order'}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchShipments}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            !isLoading && (
              <View style={styles.emptyState}>
                <Icon
                  name="bus-outline"
                  size={48}
                  color={theme.colors.border}
                />
                <Text style={styles.emptyStateText}>No shipments found.</Text>
              </View>
            )
          }
        />
      )}

      <CustomAlertModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setModalConfig({ ...modalConfig, visible: false })}
      />
    </SafeAreaView>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    pageHeader: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      zIndex: 10,
      elevation: 2,
    },
    pageTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.text,
    },
    pageSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      height: '100%',
    },
    countBadge: {
      alignSelf: 'flex-start',
    },
    countText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      paddingRight: 16,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      marginRight: 10,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    filterChipTextActive: {
      color: '#fff',
    },
    clearFilterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 'auto',
      gap: 4,
    },
    clearFilterText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#64748b',
    },
    listContent: {
      padding: 16,
      paddingBottom: 40,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginBottom: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    hospitalInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    hospitalIconBg: {
      backgroundColor: theme.colors.primary + '1A',
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    hospitalName: {
      flex: 1,
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.text,
    },
    statusBadge: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    amountReferenceSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      backgroundColor: theme.colors.background,
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
    },
    totalAmount: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.colors.primary,
      marginTop: 2,
    },
    infoValueDark: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.text,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginBottom: 12,
    },
    detailsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 4,
    },
    infoCol: {
      width: '50%',
      marginBottom: 16,
      paddingRight: 8,
    },
    infoLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    infoValue: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
    },
    highlightBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    highlightBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    addressCell: {
      flexDirection: 'row',
      backgroundColor: '#fef9c3', // keep specific alert color
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
    },
    detailBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary + '1A',
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.primary + '33',
    },
    detailBtnText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '700',
      marginRight: 6,
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyStateText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
  });

export default SupplyInfoScreen;
