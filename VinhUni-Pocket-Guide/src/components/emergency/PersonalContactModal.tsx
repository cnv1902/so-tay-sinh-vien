import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography, shadows } from '../../design';
import {
  usePersonalEmergencyStore,
  PersonalEmergencyContact,
} from '../../stores/usePersonalEmergencyStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function PersonalContactModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { contact, setContact, clearContact } = usePersonalEmergencyStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (visible) {
      if (contact) {
        setName(contact.name);
        setPhone(contact.phone);
      } else {
        setName('');
        setPhone('');
      }
    }
  }, [visible, contact]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('emergency.nameRequired'));
      return;
    }
    const cleanPhone = phone.trim().replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 8) {
      Alert.alert(t('common.error'), t('emergency.phoneRequired'));
      return;
    }

    setContact({
      name: name.trim(),
      phone: cleanPhone,
    });
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      t('common.deleteConfirmTitle'),
      t('emergency.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            clearContact();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-add" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.title}>
                {contact ? t('emergency.editPersonal') : t('emergency.setupPersonalContact')}
              </Text>
              <Text style={styles.subtitle}>
                {t('emergency.setupPersonalDesc')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>{t('emergency.nameLabel')}</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder={t('emergency.namePlaceholder')}
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
                maxLength={40}
              />
            </View>

            <Text style={[styles.label, { marginTop: spacing.md }]}>{t('emergency.phoneLabel')}</Text>
            <View style={styles.inputBox}>
              <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder={t('emergency.phonePlaceholder')}
                placeholderTextColor={colors.textTertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {contact && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
              <Text style={styles.saveBtnText}>{t('emergency.saveContact')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  form: {
    marginVertical: spacing.sm,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 46,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  deleteBtn: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: '#FEE2E2',
    marginRight: 'auto',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  cancelBtnText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    gap: 6,
    ...shadows.small,
  },
  saveBtnText: {
    fontSize: typography.size.sm,
    color: '#ffffff',
    fontWeight: '700',
  },
});
