import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@config/useTheme';

const CustomAlertModal = ({ visible, title, message, onClose, isError = true }) => {
  const { theme } = useTheme();

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.iconContainer, { backgroundColor: isError ? theme.colors.error + '20' : theme.colors.primary + '20' }]}>
            <Icon 
              name={isError ? "alert-circle" : "information-circle"} 
              size={40} 
              color={isError ? theme.colors.error : theme.colors.primary} 
            />
          </View>
          
          <Text style={[styles.title, { color: theme.colors.text }]}>{title || 'Notice'}</Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.primary }]} 
            onPress={onClose}
          >
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomAlertModal;
