import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';
import { themeList } from '@config/themes';

/**
 * ThemeDropdown - Simple icon trigger with bell-style dropdown panel
 */
const ThemeDropdown = ({ style }) => {
  const { theme, themeName, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeSelect = selectedThemeId => {
    setTheme(selectedThemeId);
    setIsOpen(false);
  };

  const renderThemeItem = ({ item }) => {
    const isSelected = item.id === themeName;

    return (
      <TouchableOpacity
        style={[
          styles.themeItem,
          {
            backgroundColor: isSelected
              ? theme.colors.primary + '25'
              : theme.colors.surface + 'EE',
            borderColor: isSelected
              ? theme.colors.primary
              : theme.colors.border,
          },
        ]}
        onPress={() => handleThemeSelect(item.id)}
        activeOpacity={0.7}
      >
        {/* Color Preview */}
        <View style={styles.colorPreview}>
          <View
            style={[
              styles.colorCircle,
              { backgroundColor: item.colors.primary },
            ]}
          />
          <View
            style={[
              styles.colorCircle,
              { backgroundColor: item.colors.background },
            ]}
          />
          <View
            style={[
              styles.colorCircle,
              { backgroundColor: item.colors.surface },
            ]}
          />
        </View>

        {/* Theme Name */}
        <Text style={[styles.themeName, { color: theme.colors.text }]}>
          {item.name}
        </Text>

        {/* Selected Indicator */}
        {isSelected && (
          <Icon
            name="checkmark-circle"
            size={18}
            color={theme.colors.primary}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Simple Icon Button — same style as bell icon */}
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Icon name="color-palette-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Dropdown Modal — top-right panel style */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.dropdown,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View
              style={[
                styles.dropdownHeader,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <Icon
                name="color-palette-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text
                style={[styles.dropdownTitle, { color: theme.colors.text }]}
              >
                Choose Theme
              </Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Icon
                  name="close"
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Theme List */}
            <FlatList
              data={themeList}
              renderItem={renderThemeItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
              scrollEnabled={true}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  iconBtn: {
    padding: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    width: 280,
    maxHeight: '70%',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  dropdownTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    padding: 10,
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 8,
    gap: 8,
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 3,
  },
  colorCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  themeName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ThemeDropdown;
