import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useState } from 'react';

import {
  colors,
  radius,
  shadows,
  spacing,
} from '../../design';

const categories = [
  {
    label: 'Tòa nhà',
    icon: 'business-outline',
  },
  {
    label: 'Ăn uống',
    icon: 'restaurant-outline',
  },
  {
    label: 'Xe buýt',
    icon: 'bus-outline',
  },
  {
    label: 'Y tế',
    icon: 'medkit-outline',
  },
] as const;

export default function MapCategories() {
  const [activeCategory, setActiveCategory] = useState<string>('Tòa nhà');

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => {
        const isActive = activeCategory === category.label;
        
        return (
          <View key={category.label} style={[styles.itemWrapper, isActive && styles.activeWrapper]}>
            <BlurView intensity={isActive ? 100 : 70} tint={isActive ? "dark" : "light"} style={styles.blurContainer}>
              <TouchableOpacity
                style={styles.item}
                onPress={() => setActiveCategory(category.label)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={category.icon}
                  size={18}
                  color={isActive ? colors.white : colors.primaryDark}
                />
                <Text style={[styles.label, isActive && styles.activeLabel]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  itemWrapper: {
    borderRadius: radius.round,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...shadows.small,
  },
  activeWrapper: {
    borderColor: colors.primary,
    ...shadows.medium,
  },
  blurContainer: {
    // Không set background color để thấy blur
  },
  item: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  activeLabel: {
    color: colors.white,
  },
});