import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import {
  colors,
  radius,
  shadows,
} from '../../design';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function ZoomControls({ onZoomIn, onZoomOut }: ZoomControlsProps) {
  return (
    <View style={styles.container}>
      <BlurView intensity={85} tint="light" style={styles.blurContainer}>
        {/* Nút Phóng to (+) */}
        <TouchableOpacity
          style={styles.button}
          onPress={onZoomIn}
          activeOpacity={0.7}
          accessibilityLabel="Zoom In"
        >
          <Ionicons
            name="add"
            size={22}
            color={colors.primaryDark}
          />
        </TouchableOpacity>

        {/* Đường ngăn cách mỏng */}
        <View style={styles.divider} />

        {/* Nút Thu nhỏ (-) */}
        <TouchableOpacity
          style={styles.button}
          onPress={onZoomOut}
          activeOpacity={0.7}
          accessibilityLabel="Zoom Out"
        >
          <Ionicons
            name="remove"
            size={22}
            color={colors.primaryDark}
          />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  blurContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 6,
  },
});
