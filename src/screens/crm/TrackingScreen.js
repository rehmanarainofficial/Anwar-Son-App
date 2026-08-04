import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@config/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import { selectCurrentUser } from '@store/slices/authSlice';
import { useGetLiveTrackingMutation } from '@api/portalApi';
import Toast from 'react-native-toast-message';

const TrackingScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const user = useSelector(selectCurrentUser);
  const [getLiveTracking, { isLoading }] = useGetLiveTrackingMutation();

  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrackingData = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const userEmpCode = user?.emp_code || '';

      const res = await getLiveTracking({
        emp_code: userEmpCode,
        date: todayStr,
      }).unwrap();

      if (res && (res.status === 'true' || res.status === true) && Array.isArray(res.data)) {
        setEmployees(res.data);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.log('Error fetching tracking list:', error);
    }
  }, [user, getLiveTracking]);

  // Battery & Performance Optimization: Only poll when screen is active/focused
  useFocusEffect(
    useCallback(() => {
      fetchTrackingData();
      const interval = setInterval(fetchTrackingData, 10000);
      return () => clearInterval(interval);
    }, [fetchTrackingData]),
  );

  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = employees.filter(
        emp =>
          (emp.name && emp.name.toLowerCase().includes(query)) ||
          (emp.EmployeeCode &&
            emp.EmployeeCode.toLowerCase().includes(query)) ||
          (emp.current_location &&
            emp.current_location.toLowerCase().includes(query)),
      );
      setFilteredEmployees(filtered);
    }
  }, [searchQuery, employees]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrackingData();
    setRefreshing(false);
  };

  const handleTrackEmployee = employee => {
    if (!employee.latitude || !employee.longitude) {
      Toast.show({
        type: 'error',
        text1: 'Location Unavailable',
        text2: 'No GPS coordinates found for this employee.',
      });
      return;
    }

    navigation.navigate('LiveTrackingMapScreen', {
      employee,
      employees: employees.length > 0 ? employees : [employee],
    });
  };

  const handleViewAllOnMap = () => {
    const validEmployees = (employees.length > 0 ? employees : filteredEmployees).filter(
      emp => emp.latitude && emp.longitude,
    );

    if (validEmployees.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No GPS Data',
        text2: 'No active employees with GPS coordinates found.',
      });
      return;
    }

    navigation.navigate('LiveTrackingMapScreen', {
      employees: validEmployees,
    });
  };

  const getInitials = name => {
    if (!name) return 'EMP';
    return name
      .split(' ')
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getStatusBadge = activityTime => {
    if (!activityTime) {
      return { label: 'Offline', color: theme.colors.error || '#EF4444' };
    }
    return { label: 'Active', color: theme.colors.success || '#10B981' };
  };

  const renderItem = ({ item }) => {
    const initials = getInitials(item.name);
    const status = getStatusBadge(item.ActivityTime);

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
        <View style={styles.cardHeader}>
          {/* Avatar */}
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.primary + '15' },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
              {initials}
            </Text>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text
              style={[styles.empName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {item.name || 'Unknown Employee'}
            </Text>
            {item.father_name ? (
              <Text
                style={[
                  styles.fatherName,
                  { color: theme.colors.textSecondary },
                ]}
              >
                S/O: {item.father_name}
              </Text>
            ) : null}
            <Text
              style={[styles.empCode, { color: theme.colors.textSecondary }]}
            >
              Code: {item.EmployeeCode || 'N/A'}
            </Text>
          </View>

          {/* Status & Time Badge */}
          <View
            style={[
              styles.timeBadge,
              { backgroundColor: status.color + '15' },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.timeText, { color: status.color }]}>
              {item.ActivityTime || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Location Info */}
        <View
          style={[
            styles.locationContainer,
            { borderTopColor: theme.colors.border + '30' },
          ]}
        >
          <Icon
            name="location-outline"
            size={16}
            color={theme.colors.primary}
            style={styles.locIcon}
          />
          <Text
            style={[styles.locationText, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.current_location || 'No location updated'}
          </Text>
        </View>

        {/* Coordinates Info */}
        <View style={styles.coordsContainer}>
          <View
            style={[
              styles.coordBadge,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[styles.coordLabel, { color: theme.colors.textSecondary }]}
            >
              Lat:{' '}
            </Text>
            <Text style={[styles.coordValue, { color: theme.colors.text }]}>
              {item.latitude || 'N/A'}
            </Text>
          </View>
          <View
            style={[
              styles.coordBadge,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                marginLeft: 8,
              },
            ]}
          >
            <Text
              style={[styles.coordLabel, { color: theme.colors.textSecondary }]}
            >
              Lon:{' '}
            </Text>
            <Text style={[styles.coordValue, { color: theme.colors.text }]}>
              {item.longitude || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.trackButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => handleTrackEmployee(item)}
          activeOpacity={0.8}
        >
          <Icon
            name="map-outline"
            size={16}
            color="#FFFFFF"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.trackBtnText}>Show on Map</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Search Header */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.searchInputWrapper,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon
            name="search-outline"
            size={20}
            color={theme.colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Search employee or location..."
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.searchInput, { color: theme.colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon
                name="close-circle"
                size={18}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* View All Employees on Map Button */}
        <TouchableOpacity
          style={[
            styles.viewAllMapBtn,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={handleViewAllOnMap}
          activeOpacity={0.8}
        >
          <Icon
            name="map"
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.viewAllMapBtnText}>
            View All Employees on Map
          </Text>
        </TouchableOpacity>
      </View>

      {/* Employee list */}
      {isLoading && employees.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Loading live tracking data...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEmployees}
          renderItem={renderItem}
          keyExtractor={item => String(item.id || item.EmployeeCode || Math.random())}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon
                name="people-outline"
                size={60}
                color={theme.colors.textSecondary + '50'}
              />
              <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                No active tracking data
              </Text>
              <Text
                style={[
                  styles.emptySubText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Employees who have marked attendance will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
  },
  viewAllMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 12,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  viewAllMapBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    padding: 0,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  empName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  empCode: {
    fontSize: 12,
    marginTop: 2,
  },
  fatherName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 14,
  },
  locIcon: {
    marginTop: 2,
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 20,
    elevation: 2,
  },
  trackBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  coordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  coordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  coordLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  coordValue: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default TrackingScreen;
