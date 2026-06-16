import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { useSelector } from 'react-redux';
import {
  useGetOrderStatusListingMutation,
  useGetViewDataMutation,
} from '@api/portalApi';
import { selectCurrentUser } from '@store/slices/authSlice';
import { generateAndShareOrderChallanPDF } from '../../utils/PDFOrderChallanService';
import { CustomAlertModal } from '@components/common';

const SalesOrderStatusScreen = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orders, setOrders] = useState([]);
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const { company } = useSelector(state => state.auth);
  const user = useSelector(selectCurrentUser);

  const [getOrderStatusListing, { isLoading }] =
    useGetOrderStatusListingMutation();
  const [getViewData, { isLoading: isViewLoading }] = useGetViewDataMutation();

  const handleViewDetail = async order => {
    console.log('Clicked Order Info:', order);
    try {
      const res = await getViewData({
        company: user?.company_user_code || company,
        trans_no: order.trans_no || '',
        type: order.type || '30',
      }).unwrap();

      console.log('API Response (OrderStatus):', res);

      if (res && String(res.status_header) === 'true') {
        const headerData = res.data_header?.[0] || {};
        const detailData = res.data_detail || [];
        await generateAndShareOrderChallanPDF(
          'Sales Order',
          headerData,
          detailData,
          user?.company_name,
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

  const fetchOrders = async () => {
    try {
      const response = await getOrderStatusListing({
        company: user?.company_user_code || '',
        user_id: user?.company_user_id || '',
      }).unwrap();

      if (response && String(response.status) === 'true') {
        setOrders(response.data || []);
      }
    } catch (error) {
      console.log('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatDate = dateString => {
    if (!dateString || dateString.includes('0000-00-00')) return '-';
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

  // Derived stats
  const totalOrders = orders.length;
  const readyCount = orders.filter(
    o => o.status === 'Ready For Dispatched',
  ).length;
  const awaitedCount = orders.filter(
    o => o.status === 'Awaited Payment',
  ).length;
  const unapprovedCount = orders.filter(
    o =>
      o.status === 'Un Approved' ||
      o.status === 'Unapproved' ||
      o.status === 'UnApproved',
  ).length;

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filter by search query
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        (order.customer || '').toLowerCase().includes(query) ||
        (order.reference || '').toLowerCase().includes(query) ||
        (order.po_no || '').toLowerCase().includes(query) ||
        (order.order_no || '').toLowerCase().includes(query);

      // Filter by status
      const matchesStatus =
        statusFilter === 'ALL' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, orders]);

  const renderFilterButton = (title, count, icon, color, filterType) => {
    const isActive = statusFilter === filterType;
    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          isActive && { borderColor: color, backgroundColor: color + '15' },
        ]}
        onPress={() => setStatusFilter(filterType)}
      >
        <Icon name={icon} size={20} color={color} />
        <View style={styles.filterTextContainer}>
          <Text style={styles.filterTitle}>{title}</Text>
          <Text style={[styles.filterCount, { color }]}>{count}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item: order }) => {
    console.log(order);

    return (
      <View style={styles.orderCard}>
        {/* Branch / Customer header */}
        <View style={styles.branchContainer}>
          <Icon
            name="storefront"
            size={18}
            color="#1e40af"
            style={styles.branchIcon}
          />
          <Text style={styles.branchLabel}>Branch / Customer:</Text>
          <Text style={styles.branchValue} numberOfLines={2}>
            {order.customer}
          </Text>
        </View>

        {/* 2-Column Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailRow}>
            <View style={styles.detailCell}>
              <View style={styles.detailLabelRow}>
                <Icon
                  name="pricetag"
                  size={14}
                  color="#64748b"
                  style={styles.detailIcon}
                />
                <Text style={styles.detailLabel}>Reference:</Text>
              </View>
              <Text style={styles.detailValue} numberOfLines={1}>
                {order.reference}
              </Text>
            </View>
            <View style={styles.detailCell}>
              <View style={styles.detailLabelRow}>
                <Icon
                  name="calendar"
                  size={14}
                  color="#64748b"
                  style={styles.detailIcon}
                />
                <Text style={styles.detailLabel}>Order Date:</Text>
              </View>
              <Text style={styles.detailValue}>
                {formatDate(order.ord_date)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailCell}>
              <View style={styles.detailLabelRow}>
                <Icon
                  name="document-text"
                  size={14}
                  color="#64748b"
                  style={styles.detailIcon}
                />
                <Text style={styles.detailLabel}>PO Number:</Text>
              </View>
              <Text style={styles.detailValue} numberOfLines={1}>
                {order.po_no || '-'}
              </Text>
            </View>
            <View style={styles.detailCell}>
              <View style={styles.detailLabelRow}>
                <Icon
                  name="calendar"
                  size={14}
                  color="#64748b"
                  style={styles.detailIcon}
                />
                <Text style={styles.detailLabel}>PO Date:</Text>
              </View>
              <Text style={styles.detailValue}>
                {formatDate(order.po_date)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Footer Area with Amount & Details Button Stacked */}
        <View style={styles.amountSection}>
          <View style={styles.amountContainer}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 15,
              }}
            >
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.amountLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.amountValue}>
                  {parseFloat(order.total || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>

              {(order.status === 'Ready For Dispatched' ||
                order.status === 'Awaited Payment') && (
                <>
                  <View style={styles.vDivider} />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.amountLabel}>RECEIVED</Text>
                    <Text
                      style={[
                        styles.amountValue,
                        { color: theme.colors.success, fontSize: 18 },
                      ]}
                    >
                      {parseFloat(order.payment_received || 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.vDivider} />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.amountLabel}>REMAINING</Text>
                    <Text
                      style={[
                        styles.amountValue,
                        { color: theme.colors.error, fontSize: 18 },
                      ]}
                    >
                      {parseFloat(
                        order.payment_reamining || 0,
                      ).toLocaleString()}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    order.status === 'Ready For Dispatched'
                      ? '#dcfce7'
                      : order.status === 'Awaited Payment'
                      ? '#fef3c7'
                      : '#fee2e2',
                  marginTop: 10,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      order.status === 'Ready For Dispatched'
                        ? '#166534'
                        : order.status === 'Awaited Payment'
                        ? '#b45309'
                        : '#991b1b',
                  },
                ]}
              >
                {order.status}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {order.status === 'Awaited Payment' && (
              <TouchableOpacity
                style={[
                  styles.viewDetailsBtn,
                  { backgroundColor: theme.colors.success },
                ]}
                onPress={() =>
                  navigation.navigate('SalesPayment', {
                    customer: { name: order.customer },
                    order_no: order.order_no,
                  })
                }
              >
                <Icon
                  name="cash-outline"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.viewDetailsText}>Payment</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.viewDetailsBtn}
              onPress={() => handleViewDetail(order)}
              disabled={isViewLoading}
            >
              {isViewLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
              ) : (
                <Icon
                  name="eye"
                  size={16}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
              )}
              <Text style={styles.viewDetailsText}>View Details</Text>
              <Icon
                name="arrow-forward"
                size={16}
                color="#FFFFFF"
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.headerArea}>
        <View style={styles.searchContainer}>
          <Icon
            name="search-outline"
            size={20}
            color={theme.colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {renderFilterButton(
            'TOTAL ORDERS',
            totalOrders,
            'bar-chart',
            theme.colors.primary,
            'ALL',
          )}
          {renderFilterButton(
            'Ready For Dispatched',
            readyCount,
            'checkmark-done-circle',
            theme.colors.success,
            'Ready For Dispatched',
          )}
          {renderFilterButton(
            'Awaited Payment',
            awaitedCount,
            'hourglass-outline',
            theme.colors.warning,
            'Awaited Payment',
          )}
          {renderFilterButton(
            'Un Approved',
            unapprovedCount,
            'warning',
            theme.colors.error,
            'Un Approved',
          )}

          <TouchableOpacity
            style={[styles.filterButton, { justifyContent: 'center' }]}
            onPress={() => {
              setStatusFilter('ALL');
              setSearchQuery('');
            }}
          >
            <Icon
              name="close-circle"
              size={16}
              color={theme.colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text
              style={{ color: theme.colors.textSecondary, fontWeight: '700' }}
            >
              Clear Filter
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {isLoading && orders.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item, index) => `${item.order_no || 'order'}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchOrders}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            !isLoading && (
              <View style={styles.emptyState}>
                <Icon
                  name="search-outline"
                  size={48}
                  color={theme.colors.border}
                />
                <Text style={styles.emptyStateText}>
                  No orders found matching your criteria
                </Text>
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
    </KeyboardAvoidingView>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerArea: {
      backgroundColor: theme.colors.surface,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      elevation: 2,
      zIndex: 10,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      marginHorizontal: 16,
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
    filterRow: {
      paddingHorizontal: 16,
      gap: 12,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 8,
      minWidth: 130,
    },
    filterTextContainer: {
      marginLeft: 10,
    },
    filterTitle: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
    },
    filterCount: {
      fontSize: 18,
      fontWeight: '800',
    },
    listContainer: {
      padding: 16,
      paddingBottom: 40,
    },
    orderCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    branchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '10',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 12,
      marginBottom: 16,
    },
    branchIcon: {
      marginRight: 8,
    },
    branchLabel: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
      marginRight: 6,
    },
    branchValue: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.primary,
      flex: 1,
    },
    detailsGrid: {
      marginBottom: 8,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailCell: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 12,
      marginHorizontal: 4,
    },
    detailLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    detailIcon: {
      marginRight: 6,
    },
    detailLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 12,
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    amountSection: {
      alignItems: 'center',
    },
    amountContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    amountLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.textSecondary,
      letterSpacing: 1,
      marginBottom: 4,
    },
    amountValue: {
      fontSize: 26,
      fontWeight: '800',
      color: theme.colors.text,
    },
    viewDetailsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      width: '50%',
      borderRadius: 24,
    },
    viewDetailsText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyStateText: {
      marginTop: 16,
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    vDivider: {
      width: 1,
      height: 30,
      backgroundColor: theme.colors.border,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 15,
      fontWeight: '900',
      textTransform: 'uppercase',
    },
  });

export default SalesOrderStatusScreen;
