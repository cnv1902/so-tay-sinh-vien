import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import {
  colors,
  radius,
  shadows,
  spacing,
} from '../../design';

type Props = {
  startValue: string;
  endValue: string;
  activeInput: 'start' | 'end';
  onStartChangeText: (text: string) => void;
  onEndChangeText: (text: string) => void;
  onStartFocus: () => void;
  onEndFocus: () => void;
  onSwap: () => void;
  onClose: () => void;
};

export default function MapRoutingSearch({
  startValue,
  endValue,
  activeInput,
  onStartChangeText,
  onEndChangeText,
  onStartFocus,
  onEndFocus,
  onSwap,
  onClose
}: Props) {
  return (
    <View style={styles.containerWrapper}>
      <BlurView intensity={85} tint="light" style={styles.container}>
        {/* Left side: route icons */}
        <View style={styles.routeIcons}>
          <View style={[styles.dot, { backgroundColor: colors.textTertiary }]} />
          <View style={styles.line} />
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        </View>

        {/* Inputs */}
        <View style={styles.inputsContainer}>
          <TextInput
            value={startValue}
            onChangeText={onStartChangeText}
            onFocus={onStartFocus}
            placeholder="Từ đâu?"
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.input, 
              styles.inputTop,
              activeInput === 'start' && styles.activeInput
            ]}
          />
          <View style={styles.divider} />
          <TextInput
            value={endValue}
            onChangeText={onEndChangeText}
            onFocus={onEndFocus}
            placeholder="Đến đâu?"
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.input,
              activeInput === 'end' && styles.activeInput
            ]}
          />
        </View>

        {/* Right side: Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={onSwap} style={styles.actionBtn}>
            <Ionicons name="swap-vertical" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.actionBtn}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.medium,
    marginBottom: spacing.md,
  },
  container: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  routeIcons: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    width: 2,
    height: 24,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  inputsContainer: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  input: {
    height: 40,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  inputTop: {
    marginBottom: 8,
  },
  activeInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: 'transparent', 
  },
  actionsContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  actionBtn: {
    padding: 4,
  }
});
