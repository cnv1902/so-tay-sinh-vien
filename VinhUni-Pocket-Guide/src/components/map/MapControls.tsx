import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import {
  colors,
  radius,
  shadows,
  typography,
} from '../../design';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onResetNorth: () => void;
  onToggle3D: () => void;
  is3D: boolean;
  bearing: number;
}

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onRotateLeft,
  onRotateRight,
  onResetNorth,
  onToggle3D,
  is3D,
  bearing,
}: MapControlsProps) {
  return (
    <View style={styles.container}>
      {/* 1. Nhóm Chế độ 3D & La bàn Hướng Bắc */}
      <View style={styles.groupCard}>
        <BlurView intensity={85} tint="light" style={styles.blurContainer}>
          {/* Nút Toggle 3D / 2D */}
          <TouchableOpacity
            style={[styles.button, is3D && styles.activeButton]}
            onPress={onToggle3D}
            activeOpacity={0.7}
            accessibilityLabel="Toggle 3D View"
          >
            <Text style={[styles.badge3DText, is3D && styles.activeBadgeText]}>
              {is3D ? '3D' : '2D'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Nút La bàn / Reset Hướng Bắc */}
          <TouchableOpacity
            style={styles.button}
            onPress={onResetNorth}
            activeOpacity={0.7}
            accessibilityLabel="Reset North"
          >
            <View style={{ transform: [{ rotate: `${-bearing}deg` }] }}>
              <Ionicons
                name="compass"
                size={22}
                color={bearing !== 0 ? colors.accent : colors.primaryDark}
              />
            </View>
          </TouchableOpacity>
        </BlurView>
      </View>

      {/* 2. Nhóm Xoay Trái / Phải */}
      <View style={styles.groupCard}>
        <BlurView intensity={85} tint="light" style={styles.blurContainer}>
          {/* Xoay trái 45 độ */}
          <TouchableOpacity
            style={styles.button}
            onPress={onRotateLeft}
            activeOpacity={0.7}
            accessibilityLabel="Rotate Left"
          >
            <Ionicons
              name="reload"
              size={18}
              color={colors.primaryDark}
              style={{ transform: [{ scaleX: -1 }] }}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Xoay phải 45 độ */}
          <TouchableOpacity
            style={styles.button}
            onPress={onRotateRight}
            activeOpacity={0.7}
            accessibilityLabel="Rotate Right"
          >
            <Ionicons
              name="reload"
              size={18}
              color={colors.primaryDark}
            />
          </TouchableOpacity>
        </BlurView>
      </View>

      {/* 3. Nhóm Phóng to (+) / Thu nhỏ (-) */}
      <View style={styles.groupCard}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  groupCard: {
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  blurContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
  },
  button: {
    width: 44,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: colors.primaryLight,
  },
  badge3DText: {
    fontSize: 13,
    fontWeight: typography.weight.bold,
    color: colors.primaryDark,
  },
  activeBadgeText: {
    color: colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 6,
  },
});
