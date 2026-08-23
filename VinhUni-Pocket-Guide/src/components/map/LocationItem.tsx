import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../design';
import type { Location } from '../../types/location';

interface Props {
  location: Location;
  onPress: () => void;
  isGps?: boolean;
}

export default function LocationItem({ location, onPress, isGps = false }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.iconBox, isGps && styles.iconBoxGps]}>
        <Ionicons 
          name={isGps ? "navigate" : "location"} 
          size={20} 
          color={isGps ? "#ffffff" : colors.primary} 
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{location.name}</Text>
        <Text style={styles.desc} numberOfLines={1}>
          {isGps ? location.description : (location.category || 'Địa điểm')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconBoxGps: {
    backgroundColor: '#3B82F6', // Blue for GPS
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  desc: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  }
});
