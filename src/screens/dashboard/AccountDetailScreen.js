import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { DateFilter, LoadingSpinner } from '@components/common';
import { useGetParentAccountDetailMutation } from '@api/dashboardApi';

const AccountDetailScreen = ({ route, navigation }) => {
  const { title, accountType, initialFromDate, initialToDate } = route.params;
  const { theme } = useTheme();

  const [getParentAccountDetail, { isLoading }] =
    useGetParentAccountDetailMutation();
  const [fromDate, setFromDate] = useState(
    initialFromDate ? new Date(initialFromDate) : null,
  );
  const [toDate, setToDate] = useState(
    initialToDate ? new Date(initialToDate) : null,
  );

  React.useLayoutEffect(() => {
    const decodedTitle = title ? title.replace(/&amp;/g, '&') : 'Details';
    const truncatedTitle =
      decodedTitle.length > 25
        ? decodedTitle.substring(0, 22) + '...'
        : decodedTitle;
    navigation.setOptions({
      title: truncatedTitle,
    });
  }, [navigation, title]);
  const [details, setDetails] = useState([]);

  useEffect(() => {
    if (!fromDate && !toDate) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      setFromDate(thirtyDaysAgo);
      setToDate(today);
      fetchData(thirtyDaysAgo, today);
    } else if (fromDate && toDate) {
      fetchData(fromDate, toDate);
    }
  }, []);

  const formatDateForAPI = date => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchData = async (start, end) => {
    try {
      const response = await getParentAccountDetail({
        from_date: formatDateForAPI(start),
        to_date: formatDateForAPI(end),
        account_type: accountType,
        dimension_id: route.params?.dimensionId || '',
      }).unwrap();

      if (response && response.status === 'true' && response.data) {
        setDetails(response.data);
      } else {
        setDetails([]);
      }
    } catch (error) {
      console.log('Account Detail fetch error:', error);
      setDetails([]);
    }
  };

  const handleClearFilter = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setFromDate(thirtyDaysAgo);
    setToDate(today);
    fetchData(thirtyDaysAgo, today);
  };

  const handleApplyFilter = () => {
    fetchData(fromDate, toDate);
  };

  const s = getStyles(theme);


  const renderItem = ({ item, index }) => {
    const isFirst = index === 0;
    const isLast = index === details.length - 1;
    const formattedName = item.account_name ? item.account_name.replace(/&amp;/g, '&') : '';

    return (
      <View
        style={[
          s.listContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderBottomWidth: isLast ? 1 : 0,
            borderTopLeftRadius: isFirst ? 16 : 0,
            borderTopRightRadius: isFirst ? 16 : 0,
            borderBottomLeftRadius: isLast ? 16 : 0,
            borderBottomRightRadius: isLast ? 16 : 0,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            s.listItem,
            !isLast && {
              borderBottomColor: theme.colors.border,
              borderBottomWidth: 1,
            },
          ]}
          onPress={() =>
            navigation.navigate('Ledger', {
              account: item.account_code,
              title: formattedName,
              fromDate: fromDate?.toISOString(),
              toDate: toDate?.toISOString(),
            })
          }
        >
          <View style={s.listItemLeft}>
            <View
              style={[
                s.listIconBox,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <Icon
                name="document-text-outline"
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <View style={s.listTextContent}>
              <Text
                style={[s.listItemTitle, { color: theme.colors.text }]}
                numberOfLines={2}
              >
                {formattedName}
              </Text>

            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={[
                s.listItemAmount,
                { color: theme.colors.text, marginRight: 8 },
              ]}
            >
              {Math.abs(parseFloat(item.t_amount)).toLocaleString()}
            </Text>
            <Icon
              name="chevron-forward"
              size={16}
              color={theme.colors.textSecondary}
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={s.container}>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={details}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={
            <View>
              <DateFilter
                fromDate={fromDate}
                toDate={toDate}
                onFromDate={setFromDate}
                onToDate={setToDate}
                onClear={handleClearFilter}
                onFilter={handleApplyFilter}
              />
              <View style={s.listSection} />
            </View>
          }
          ListEmptyComponent={
            <View style={s.listSection}>
              <View
                style={[
                  s.emptyContainer,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                  },
                ]}
              >
                <Icon
                  name="folder-open-outline"
                  size={40}
                  color={theme.colors.textSecondary}
                />
                <Text
                  style={[s.emptyText, { color: theme.colors.textSecondary }]}
                >
                  No details found for this period.
                </Text>
              </View>
            </View>
          }
        />
      )}
    </View>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    pageTitle: {
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 20,
    },
    listSection: {
      marginTop: 10,
    },
    listContainer: {
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    listItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 10,
    },
    listIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    listTextContent: {
      flex: 1,
    },
    listItemTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 3,
    },
    listItemDate: {
      fontSize: 12,
      fontWeight: '500',
    },
    listItemAmount: {
      fontSize: 16,
      fontWeight: '700',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      borderRadius: 16,
      borderWidth: 1,
      borderStyle: 'dashed',
    },
    emptyText: {
      marginTop: 10,
      fontSize: 14,
      fontWeight: '500',
    },
  });

export default AccountDetailScreen;
