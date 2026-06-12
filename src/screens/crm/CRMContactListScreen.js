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
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@store/slices/authSlice';

const CRMContactListScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const user = useSelector(selectCurrentUser);
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [getContactsData, { isLoading }] = useGetContactsDataMutation();

  const fetchContacts = useCallback(async () => {
    try {
      const res = await getContactsData({ user_id: user?.id }).unwrap();
      if (res.status === 'true') {
        setContacts(res.data || []);
      }
    } catch (error) {
      console.log('Fetch Contacts Error:', error);
    }
  }, [getContactsData, user?.id]);

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
    const unsubscribe = navigation.addListener('focus', () => {
      fetchContacts();
    });
    return unsubscribe;
  }, [navigation, fetchContacts]);

  const cleanText = text => {
    if (!text) return '';
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  const filteredContacts = contacts.filter(item => {
    const q = searchQuery.toLowerCase();
    const name = (item.person_name || '').toLowerCase();
    const dept = (item.department_name || '').toLowerCase();
    const city = (item.city_name || '').toLowerCase();
    const hosp = (item.hosp_1 || '').toLowerCase();
    const cell = (item.cell_no || '').toLowerCase();
    const role = (item.job_role_name || '').toLowerCase();
    const specialty = (item.surgery || '').toLowerCase();

    return (
      name.includes(q) ||
      dept.includes(q) ||
      city.includes(q) ||
      hosp.includes(q) ||
      cell.includes(q) ||
      role.includes(q) ||
      specialty.includes(q)
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

  const renderContactCard = ({ item }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {/* Header section with Name and Title */}
      <View style={styles.cardHeader}>
        {item.profile_pic_url ? (
          <Image
            source={{ uri: item.profile_pic_url }}
            style={styles.avatarImage}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.primary + '20' },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
              {item.person_name ? item.person_name.charAt(0) : 'C'}
            </Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={[styles.nameText, { color: theme.colors.text }]}>
            {item.title_name} {item.person_name}
          </Text>
          <Text style={[styles.specialtyText, { color: theme.colors.primary }]}>
            {cleanText(item.department_name)}{' '}
            {item.job_role_name && `- ${item.job_role_name}`}
          </Text>
        </View>
      </View>

      <View
        style={[styles.divider, { backgroundColor: theme.colors.border }]}
      />

      {/* Detail Section */}
      <View style={styles.cardBody}>
        {/* Row 1 */}
        <View style={styles.row}>
          {renderKeyValue('Mobile No', item.cell_no)}
          {renderKeyValue('City', item.city_name)}
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          {renderKeyValue('Gender', item.gender_name)}
          {renderKeyValue('Education', item.education_name)}
        </View>

        {/* Row 3 */}
        <View style={styles.row}>
          {renderKeyValue('Surgery', item.surgery)}
          {renderKeyValue('Private Practice', item.private_practice)}
        </View>

        {/* Full Width Keys */}
        <View style={styles.fullWidthCol}>
          <Text style={[styles.keyText, { color: theme.colors.textSecondary }]}>
            Hospital
          </Text>
          <Text style={[styles.valueText, { color: theme.colors.text }]}>
            {cleanText(item.hosp_1)}
          </Text>
        </View>

        <View style={styles.fullWidthCol}>
          <Text style={[styles.keyText, { color: theme.colors.textSecondary }]}>
            Email
          </Text>
          <Text style={[styles.valueText, { color: theme.colors.text }]}>
            {item.work_email || item.personal_email || '-'}
          </Text>
        </View>

        {/* Business Card Section */}
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
    </View>
  );

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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  avatarText: {
    fontSize: 20,
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
  specialtyText: {
    fontSize: 14,
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
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  valueText: {
    fontSize: 14,
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
});

export default CRMContactListScreen;
