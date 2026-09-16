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

import { useTranslation } from 'react-i18next';

import {
  colors,
  radius,
  shadows,
  spacing,
} from '../../design';

export default function MapCategories() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>('buildings');

  const categories = [
    {
      id: 'buildings',
      label: t('map.categories.buildings'),
      icon: 'business-outline' as const,
    },
    {
      id: 'food',
      label: t('map.categories.food'),
      icon: 'restaurant-outline' as const,
    },
    {
      id: 'bus',
      label: t('map.categories.bus'),
      icon: 'bus-outline' as const,
    },
    {
      id: 'medical',
      label: t('map.categories.medical'),
      icon: 'medkit-outline' as const,
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => {
        const isActive = activeCategory === category.id;
        
        return (
          <View key={category.id} style={[styles.itemWrapper, isActive && styles.activeWrapper]}>
            <BlurView intensity={isActive ? 100 : 70} tint={isActive ? "dark" : "light"} style={styles.blurContainer}>
              <TouchableOpacity
                style={styles.item}
                onPress={() => setActiveCategory(category.id)}
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