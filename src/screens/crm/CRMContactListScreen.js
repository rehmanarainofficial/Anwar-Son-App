import React, { useLayoutEffect, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTheme } from '@config/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGetContactsDataMutation } from '@api/portalApi';
import {
  useGetContactTierDropdownMutation,
  useGetSurgicalSpecialityDropdownMutation,
} from '@api/baseApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@store/slices/authSlice';

const mapDropdownData = (data, valueKey = null, labelKey = null) => {
  return (data || []).map((item, index) => {
    let id = valueKey ? item[valueKey] : (
      item.id !== undefined && item.id !== null ? item.id : (
        item.sales_code !== undefined && item.sales_code !== null ? item.sales_code : (
          item.combo_code !== undefined && item.combo_code !== null ? item.combo_code : (
            item.debtor_no !== undefined && item.debtor_no !== null ? item.debtor_no : (
              item.unique_id !== undefined && item.unique_id !== null ? item.unique_id : null
            )
          )
        )
      )
    );
    if (id === null || id === undefined || id === '') {
      id = String(index);
    }
    const description = labelKey ? item[labelKey] : (
      item.description || item.cityname || item.hospital_name || item.name || ''
    );
    return {
      ...item,
      id: String(id),
      description: String(description),
    };
  });
};

const CRMContactListScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const user = useSelector(selectCurrentUser);
  
  // Data States
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [tiers, setTiers] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedSpeciality, setSelectedSpeciality] = useState(null);
  
  // Expansion state: tracks which cards are expanded by contact_id
  const [expandedCards, setExpandedCards] = useState({});

  // API Mutations
  const [getContactsData, { isLoading }] = useGetContactsDataMutation();
  const [getContactTierDropdown] = useGetContactTierDropdownMutation();
  const [getSurgicalSpecialityDropdown] = useGetSurgicalSpecialityDropdownMutation();

  const fetchFilters = useCallback(async () => {
    try {
      const tierRes = await getContactTierDropdown({}).unwrap();
      if (tierRes?.status === 'true') {
        setTiers(mapDropdownData(tierRes.data || []));
      }
      const specRes = await getSurgicalSpecialityDropdown({}).unwrap();
      if (specRes?.status === 'true') {
        setSpecialities(mapDropdownData(specRes.data || []));
      }
    } catch (e) {
      console.log('Error fetching filters:', e);
    }
  }, [getContactTierDropdown, getSurgicalSpecialityDropdown]);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await getContactsData({
        user_id: user?.id,
        contact_tier: selectedTier,
        surgical_speciality: selectedSpeciality,
      }).unwrap();
      if (res.status === 'true') {
        setContacts(res.data || []);
      }
    } catch (error) {
      console.log('Fetch Contacts Error:', error);
    }
  }, [getContactsData, user?.id, selectedTier, selectedSpeciality]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Contacts',
      hideHomeIcon: true,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('CRMAddLead', { onSuccess: fetchContacts })}
          style={{ paddingRight: 10 }}
        >
          <Icon name="add" color="#FFF" size={28} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, fetchContacts]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchContacts();
    });
    return unsubscribe;
  }, [navigation, fetchContacts]);

  // Refetch when filters change
  useEffect(() => {
    fetchContacts();
  }, [selectedTier, selectedSpeciality, fetchContacts]);

  const toggleExpand = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const cleanText = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  const filteredContacts = contacts.filter((item) => {
    const q = searchQuery.toLowerCase();
    const name = (item.person_name || '').toLowerCase();
    const title = (item.title_name || '').toLowerCase();
    const dept = (item.department_name || '').toLowerCase();
    const city = (item.city_name || '').toLowerCase();
    const hosp = (item.hospitals_name || '').toLowerCase();
    const cell = (item.cell_no || '').toLowerCase();
    const role = (item.surgical_role || '').toLowerCase();
    const specialty = (item.speciality || '').toLowerCase();
    const tierVal = (item.tier || '').toLowerCase();

    return (
      name.includes(q) ||
      title.includes(q) ||
      dept.includes(q) ||
      city.includes(q) ||
      hosp.includes(q) ||
      cell.includes(q) ||
      role.includes(q) ||
      specialty.includes(q) ||
      tierVal.includes(q)
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

  const renderContactCard = ({ item }) => {
    const isExpanded = !!expandedCards[item.contact_id];
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
        {/* Card Header section is touchable, exact style matches hospital card header */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleExpand(item.contact_id)}
          style={[styles.cardHeader, isExpanded && { marginBottom: 16 }]}
        >
          {item.profile_pic_url ? (
            <Image
              source={{ uri: item.profile_pic_url }}
              style={styles.avatarImage}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                {item.person_name ? item.person_name.charAt(0) : 'C'}
              </Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={[styles.nameText, { color: theme.colors.text }]} numberOfLines={2}>
              {item.title_name || ''}{item.person_name}
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
            <View style={styles.collapsedSubMeta}>
              {item.speciality ? (
                <View style={[styles.categoryBadge, { backgroundColor: '#3B82F610' }]}>
                  <Text style={[styles.categoryBadgeText, { color: '#3B82F6' }]}>
                    {cleanText(item.speciality)}
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

        {/* Expanded View Body */}
        {isExpanded && (
          <>
            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />
            <View style={styles.cardBody}>
              <View style={styles.row}>
                {renderKeyValue('Mobile No', item.cell_no || '-')}
                {renderKeyValue('Community', item.community_name || '-')}
              </View>
              <View style={styles.row}>
                {renderKeyValue('Department', item.department_name || '-')}
                {renderKeyValue('Surgical Role', item.surgical_role || '-')}
              </View>
              <View style={styles.row}>
                {renderKeyValue('Administrative Role', item.administrative_role_name || '-')}
                {renderKeyValue('Focus Product', item.focus_product || '-')}
              </View>

              <View style={styles.fullWidthCol}>
                <Text style={[styles.keyText, { color: theme.colors.textSecondary }]}>
                  Hospital
                </Text>
                <Text style={[styles.valueText, { color: theme.colors.text }]}>
                  {cleanText(item.hospitals_name || '-')}
                </Text>
              </View>

              <View style={styles.fullWidthCol}>
                <Text style={[styles.keyText, { color: theme.colors.textSecondary }]}>
                  Email
                </Text>
                <Text style={[styles.valueText, { color: theme.colors.text }]}>
                  {item.personal_email || '-'}
                </Text>
              </View>

              {item.business_card_url ? (
                <View style={styles.businessCardContainer}>
                  <Text
                    style={[
                      styles.keyText,
                      { color: theme.colors.textSecondary, marginBottom: 8 },
                    ]}
                  >
                    Business Card
                  </Text>
                  <Image
                    source={{ uri: item.business_card_url }}
                    style={styles.businessCardImage}
                  />
                </View>
              ) : null}
            </View>
          </>
        )}
      </View>
    );
  };

  const renderHorizontalFilter = (data, selectedValue, onSelect, allLabel, iconName) => {
    return (
      <View style={styles.filterRowContainer}>
        <View style={styles.filterIconWrapper}>
          <Icon name={iconName} size={18} color={theme.colors.primary} />
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, description: allLabel }, ...data]}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.filterScroll}
          renderItem={({ item }) => {
            const isActive = selectedValue === item.id;
            return (
              <TouchableOpacity
                onPress={() => onSelect(item.id)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                    borderColor: isActive ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: isActive ? '#fff' : theme.colors.text,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                >
                  {item.description}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.headerContainer}>
        {/* Search Bar */}
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
              placeholder="Search contacts..."
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

        {/* Filters section */}
        <View style={styles.filtersSectionContainer}>
          {renderHorizontalFilter(tiers, selectedTier, setSelectedTier, 'All Tiers', 'funnel-outline')}
          {renderHorizontalFilter(specialities, selectedSpeciality, setSelectedSpeciality, 'All Specialities', 'git-branch-outline')}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item, index) => `${item.contact_id || index}-${index}`}
          renderItem={renderContactCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={{ color: theme.colors.textSecondary }}>
                No contacts found.
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
  headerContainer: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  listContent: { padding: 16, paddingTop: 8 },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  filtersSectionContainer: {
    gap: 8,
    marginTop: 4,
  },
  filterRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  filterIconWrapper: {
    marginRight: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  filterScroll: {
    paddingRight: 16,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 12,
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
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
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
  businessCardContainer: {
    marginTop: 8,
  },
  businessCardImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    resizeMode: 'cover',
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
  collapsedSubMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
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
  expandIconBtn: {
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CRMContactListScreen;
