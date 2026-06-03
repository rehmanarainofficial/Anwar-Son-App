import React, { useLayoutEffect, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTheme } from '@config/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGetHospitalDataMutation } from '@api/portalApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@store/slices/authSlice';

const CRMHospitalListScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const user = useSelector(selectCurrentUser);
  const [hospitals, setHospitals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [getHospitalData, { isLoading }] = useGetHospitalDataMutation();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Hospitals',
      hideHomeIcon: true,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('CRMAddHospital', { onSuccess: fetchHospitals })}
          style={{ paddingRight: 10 }}
        >
          <Icon name="add" color="#FFF" size={28} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, fetchHospitals]);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const res = await getHospitalData({ user_id: user?.id }).unwrap();
      if (res.status === 'true') {
        setHospitals(res.data || []);
      }
    } catch (error) {
      console.log('Fetch Hospitals Error:', error);
    }
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

  const filteredHospitals = hospitals.filter(item => {
    const q = searchQuery.toLowerCase();
    const name = (item.hospital_name || '').toLowerCase();
    const city = (item.city_name || '').toLowerCase();
    const segment = (item.segment || '').toLowerCase();
    const contact = (item.person_name || '').toLowerCase();
    const cell = (item.cell_no || '').toLowerCase();
    const custType = (item.cust_type || '').toLowerCase();

    return (
      name.includes(q) ||
      city.includes(q) ||
      segment.includes(q) ||
      contact.includes(q) ||
      cell.includes(q) ||
      custType.includes(q)
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

  const renderHospitalCard = ({ item }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.hospitalIcon,
            { backgroundColor: theme.colors.primary + '15' },
          ]}
        >
          <Icon name="business" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.nameText, { color: theme.colors.text }]}>
            {cleanText(item.hospital_name)}
          </Text>
          <Text
            style={[styles.cityText, { color: theme.colors.textSecondary }]}
          >
            <Icon name="location-outline" size={12} /> {item.city_name}
          </Text>
        </View>
      </View>

      <View
        style={[styles.divider, { backgroundColor: theme.colors.border }]}
      />

      <View style={styles.cardBody}>
        <View style={styles.row}>
          {renderKeyValue('Segment', item.segment)}
          {renderKeyValue('Status', item.customer_status)}
        </View>
        <View style={styles.row}>
          {renderKeyValue('Primary Contact', item.person_name || 'N/A')}
          {renderKeyValue('Contact No', item.cell_no || 'N/A')}
        </View>
        <View style={styles.row}>
          {renderKeyValue('Beds', item.beds)}
          {renderKeyValue('OTs', item.ots)}
        </View>
        <View style={styles.row}>
          {renderKeyValue('Sales Person', item.sales_person)}
          {renderKeyValue('Type', item.cust_type)}
        </View>

        <View style={styles.fullWidthCol}>
          <Text style={[styles.keyText, { color: theme.colors.textSecondary }]}>
            Address
          </Text>
          <Text style={[styles.valueText, { color: theme.colors.text }]}>
            {item.address || 'N/A'}
          </Text>
        </View>

        {item.competitor_analysis && (
          <View style={[styles.fullWidthCol, { marginTop: 8 }]}>
            <Text
              style={[styles.keyText, { color: theme.colors.textSecondary }]}
            >
              Competitor Analysis
            </Text>
            <Text
              style={[
                styles.valueText,
                { color: theme.colors.text, fontSize: 12 },
              ]}
            >
              {cleanText(item.competitor_analysis)}
            </Text>
          </View>
        )}
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
});

export default CRMHospitalListScreen;
