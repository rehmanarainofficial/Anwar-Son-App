import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';

const CustomHeader = ({ navigation, route, options, back }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const title = options.title || route.name;

  const isMainScreen = route.name === 'MainScreen';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.primary,
          paddingTop: insets.top,
          height: Platform.OS === 'ios' ? 90 + insets.top : 70 + insets.top,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Left: Back Button */}
        <View style={styles.leftContainer}>
          {back && !isMainScreen ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.iconBtn}
            >
              <Icon name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Center: Title - absolute so it stays centered on iOS & Android */}
        <View style={styles.centerContainer} pointerEvents="none">
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Right Buttons */}
        <View style={styles.rightContainer}>
          {options?.headerRight ? options.headerRight() : null}
          {!isMainScreen && !options?.hideHomeIcon ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('MainScreen')}
              style={styles.iconBtn}
            >
              <Icon name="home-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            !options?.headerRight && <View style={{ width: 40 }} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
    zIndex: 1,
  },
  centerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  iconBtn: {
    padding: 8,
  },
});

export default CustomHeader;
