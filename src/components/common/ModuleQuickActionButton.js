import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';

const ModuleQuickActionButton = ({ label, icon, onPress }) => {
  const { theme } = useTheme();
  const s = getStyles(theme);

  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={s.iconContainer}>
        <Icon name={icon || 'chevron-forward-outline'} size={22} color={theme.colors.primary} />
      </View>
      <View style={s.textContainer}>
        <Text style={[s.label, { color: theme.colors.text }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Icon name="chevron-forward" size={18} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 10,
      width: '100%',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '12',
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
    },
  });

export default ModuleQuickActionButton;

