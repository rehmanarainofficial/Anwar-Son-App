import React, { useLayoutEffect, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTheme } from '@config/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGetHospitalDataMutation } from '@api/portalApi';
import { useGetHospitalTierDropdownMutation } from '@api/baseApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@store/slices/authSlice';

const CRMHospitalListScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const user = useSelector(selectCurrentUser);
  const [hospitals, setHospitals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [getHospitalData, { isLoading }] = useGetHospitalDataMutation();
  const [getHospitalTierDropdown, { data: tierRes }] = useGetHospitalTierDropdownMutation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Hospitals',
      hideHomeIcon: true,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('CRMAddHospital', { onSuccess: () => fetchHospitals(selectedTierId) })}
          style={{ paddingRight: 10 }}
        >
          <Icon name="add" color="#FFF" size={28} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedTierId]);

  useEffect(() => {
    fetchHospitals(null);
    getHospitalTierDropdown({});
  }, []);

  const fetchHospitals = async (tierId = selectedTierId) => {
    try {
      const res = await getHospitalData({
        user_id: user?.id || user?.company_user_id || '',
        role_id: user?.role_id,
        company: 'CRM',
        tier_id: tierId || '',
      }).unwrap();
      if (res?.status === 'true' && Array.isArray(res.data)) {
        setHospitals(res.data);
      } else {
        setHospitals([]);
      }
    } catch (error) {
      console.log('Fetch Hospitals Error:', error);
      setHospitals([]);
    }
  };

  const handleTierFilter = (tierId) => {
    setSelectedTierId(tierId);
    fetchHospitals(tierId);
  };

  const toggleExpand = (debtorNo) => {
    setExpandedCards(prev => ({
      ...prev,
      [debtorNo]: !prev[debtorNo],
    }));
  };

  const cleanText = text => {
    if (!text) return '';
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  const selectedTierObj = tierRes?.data?.find(
    t => String(t.id) === String(selectedTierId)
  );

  const filteredHospitals = hospitals.filter(item => {
    if (selectedTierId) {
      const tierIdStr = String(selectedTierId).toLowerCase();
      const tierDesc = (selectedTierObj?.description || '').toLowerCase();

      const itemTierId = String(item.tier_id || item.tier || '').toLowerCase();
      const itemTierName = (item.tier || item.tier_name || '').toLowerCase();

      const matchesTierId =
        itemTierId === tierIdStr ||
        itemTierId.includes(`tier${tierIdStr}`) ||
        itemTierId.includes(`tier ${tierIdStr}`);
      const matchesTierDesc = tierDesc
        ? itemTierName.includes(tierDesc) || itemTierName === tierDesc
        : false;

      if (!matchesTierId && !matchesTierDesc) {
        return false;
      }
    }

    const q = searchQuery.toLowerCase();
    if (!q) return true;

    const name = (item.hospital_name || '').toLowerCase();
    const city = (item.city_name || '').toLowerCase();
    const segment = (item.segment || '').toLowerCase();
    const contact = (item.person_name || '').toLowerCase();
    const cell = (item.cell_no || '').toLowerCase();
    const custType = (item.cust_type || '').toLowerCase();
    const salesPerson = (
      item.sales_person ||
      item.sales_person_name ||
      item.salesman_name ||
      item.salesman ||
      ''
    ).toLowerCase();

    return (
      name.includes(q) ||
      city.includes(q) ||
      segment.includes(q) ||
      contact.includes(q) ||
      cell.includes(q) ||
      custType.includes(q) ||
      salesPerson.includes(q)
    );
  });

  const renderKeyValue = (label, value) => (
    <View style={styles.keyValueCol}>
      <Text style={[styles.keyText, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[styles.valueText, { color: theme.colors.text }]}
        numberOfLines={1}
      >
        {cleanText(value)}
      </Text>
    </View>
  );

  const renderFocusTag = (label, val) => {
    if (!val) return null;
    let color = '#3B82F6';
    const valLower = val.toLowerCase().trim();
    if (valLower === 'focus') color = '#EF4444';
    else if (valLower === 'develop') color = '#F59E0B';
    else if (valLower === 'maintain') color = '#10B981';

    return (
      <View style={[styles.focusTag, { borderColor: color + '40', backgroundColor: color + '08' }]}>
        <Text style={[styles.focusTagText, { color }]}>
          {label}: {val}
        </Text>
      </View>
    );
  };

  const renderHospitalCard = ({ item }) => {
    const isExpanded = expandedCards[item.debtor_no];

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleExpand(item.debtor_no)}
          style={[styles.cardHeader, isExpanded && { marginBottom: 16 }]}
        >
          <View
            style={[
              styles.hospitalIcon,
              { backgroundColor: theme.colors.primary + '15' },
            ]}
          >
            <Icon name="business" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.nameText, { color: theme.colors.text }]} numberOfLines={2}>
              {cleanText(item.hospital_name)}
            </Text>
            <View style={styles.collapsedMeta}>
              <Text style={[styles.cityText, { color: theme.colors.textSecondary }]}>
                <Icon name="location-outline" size={12} /> {item.city_name || 'N/A'}
              </Text>
              {item.tier ? (
                <View style={[styles.tierBadge, { backgroundColor: theme.colors.primary + '10' }]}>
                  <Text style={[styles.tierBadgeText, { color: theme.colors.primary }]}>
                    {item.tier}
                  </Text>
                </View>
              ) : null}
            </View>
            {(item.sales_person || item.sales_person_name || item.salesman_name || item.salesman) ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Icon name="person-outline" size={12} color={theme.colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.cityText, { color: theme.colors.primary, fontWeight: '600' }]}>
                  {cleanText(item.sales_person || item.sales_person_name || item.salesman_name || item.salesman)}
                </Text>
              </View>
            ) : null}
            <View style={styles.collapsedSubMeta}>
              {item.customer_status ? (
                <View style={[styles.statusBadge, { backgroundColor: '#10B98110' }]}>
                  <Text style={[styles.statusBadgeText, { color: '#10B981' }]}>
                    {item.customer_status}
                  </Text>
                </View>
              ) : null}
              {item.category ? (
                <View style={[styles.categoryBadge, { backgroundColor: '#3B82F610' }]}>
                  <Text style={[styles.categoryBadgeText, { color: '#3B82F6' }]}>
                    {item.category}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.expandIconBtn}>
            <Icon
              name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={20}
              color={theme.colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <>
            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />
            <View style={styles.cardBody}>
              {/* Address */}
              <View style={styles.fullWidthCol}>
                <Text style={[styles.keyText, { color: theme.colors.textSecondary }]}>
                  Address
                </Text>
                <Text style={[styles.valueText, { color: theme.colors.text }]}>
                  {cleanText(item.address) || 'N/A'}
                </Text>
              </View>

              <View style={styles.row}>
                {renderKeyValue('Primary Contact', item.person_name || 'N/A')}
                {renderKeyValue('Contact No', item.cell_no || 'N/A')}
              </View>

              <View style={styles.row}>
                {renderKeyValue('Beds', item.beds || '0')}
                {renderKeyValue('OTs', item.ots || '0')}
              </View>

              <View style={styles.row}>
                {renderKeyValue(
                  'Sales Person',
                  item.sales_person || item.sales_person_name || item.salesman_name || item.salesman || 'N/A'
                )}
                {renderKeyValue('Payment Terms', item.payment_terms || 'N/A')}
              </View>

              {item.website ? (
                <View style={styles.fullWidthCol}>
                  {renderKeyValue('Website', item.website)}
                </View>
              ) : null}

              {/* Opportunity Focus Tags */}
              <View style={[styles.fullWidthCol, { marginTop: 4 }]}>
                <Text style={[styles.keyText, { color: theme.colors.textSecondary }]}>
                  Opportunity Focus
                </Text>
                <View style={styles.focusRow}>
                  {renderFocusTag('Wound Closure', item.wound_closure_value)}
                  {renderFocusTag('Hemostasis', item.hemostatis_value)}
                  {renderFocusTag('Hernia', item.hernia_value)}
                  {renderFocusTag('Airway', item.airway_value)}
                  {renderFocusTag('Other Products', item.other_products_value)}
                </View>
              </View>

              {/* Competitor Analysis Table */}
              {item.comp_analysis && item.comp_analysis.length > 0 && (
                <View style={[styles.fullWidthCol, { marginTop: 8 }]}>
                  <Text style={[styles.keyText, { color: theme.colors.textSecondary, marginBottom: 6 }]}>
                    Competitor Analysis
                  </Text>
                  
                  {/* Table Container */}
                  <View style={[styles.compTable, { borderColor: theme.colors.border }]}>
                    {/* Header Row */}
                    <View style={[styles.compTableHeader, { backgroundColor: theme.colors.primary + '08', borderBottomColor: theme.colors.border }]}>
                      <Text style={[styles.compColHeader, styles.compColCat, { color: theme.colors.text }]}>Product Category</Text>
                      <Text style={[styles.compColHeader, styles.compColQty, { color: theme.colors.text, textAlign: 'center' }]}>Monthly Consumption</Text>
                      <Text style={[styles.compColHeader, styles.compColBrand, { color: theme.colors.text }]}>Main Brands</Text>
                    </View>

                    {/* Data Rows */}
                    {item.comp_analysis.map((comp, index) => (
                      <View 
                        key={index} 
                        style={[
                          styles.compTableRow, 
                          { borderBottomColor: theme.colors.border },
                          index === item.comp_analysis.length - 1 && { borderBottomWidth: 0 }
                        ]}
                      >
                        <Text style={[styles.compCellText, styles.compColCat, { color: theme.colors.text }]}>
                          {comp.product_category || 'N/A'}
                        </Text>
                        <Text style={[styles.compCellText, styles.compColQty, { color: theme.colors.text, textAlign: 'center' }]}>
                          {comp.monthly_consumption || '0'}
                        </Text>
                        <Text style={[styles.compCellText, styles.compColBrand, { color: theme.colors.textSecondary }]}>
                          {comp.sutures || 'N/A'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon
            name="search-outline"
            size={20}
            color={theme.colors.textSecondary}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search hospitals..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon
                name="close-circle"
                size={18}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Horizontal Scrollable Tier Filter */}
      {tierRes?.data && tierRes.data.length > 0 && (
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollFilterContent}
          >
            <TouchableOpacity
              onPress={() => handleTierFilter(null)}
              style={[
                styles.chip,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: !selectedTierId ? theme.colors.primary : theme.colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: !selectedTierId ? '#FFF' : theme.colors.text },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {tierRes.data.map(tier => {
              const isActive = selectedTierId === tier.id;
              return (
                <TouchableOpacity
                  key={tier.id}
                  onPress={() => handleTierFilter(isActive ? null : tier.id)}
                  style={[
                    styles.chip,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isActive ? '#FFF' : theme.colors.text },
                    ]}
                  >
                    {tier.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredHospitals}
          keyExtractor={(item, index) => item.debtor_no || index.toString()}
          renderItem={renderHospitalCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={{ color: theme.colors.textSecondary }}>
                No hospitals found.
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingTop: 8 },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hospitalIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cityText: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 16,
  },
  cardBody: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  keyValueCol: {
    flex: 1,
  },
  fullWidthCol: {
    width: '100%',
  },
  keyText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  valueText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  scrollFilterContent: {
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  collapsedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addressText: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 4,
  },
  expandIconBtn: {
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapsedSubMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  focusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  focusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  focusTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  compItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  compTable: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 4,
  },
  compTableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  compTableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  compColHeader: {
    fontSize: 11,
    fontWeight: '700',
  },
  compCellText: {
    fontSize: 12,
    fontWeight: '500',
  },
  compColCat: {
    flex: 1.4,
  },
  compColQty: {
    flex: 1,
    paddingHorizontal: 4,
  },
  compColBrand: {
    flex: 1.2,
    paddingLeft: 8,
  },
});

export default CRMHospitalListScreen;
