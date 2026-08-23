import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Location } from '../../types/location';

import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from '../../design';

type Props = {
  locations: Location[];
  onSelect: (location: Location) => void;
};

export default function LocationSearchResults({
  locations,
  onSelect,
}: Props) {
  if (locations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {locations.map((location) => (
        <TouchableOpacity
          key={location.id}
          style={styles.item}
          onPress={() => onSelect(location)}
          activeOpacity={0.7}
        >
          <View style={styles.icon}>
            <Ionicons
              name="location-outline"
              size={20}
              color={colors.primary}
            />
          </View>

          <View style={styles.content}>
            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {location.name}
            </Text>

            <Text
              style={styles.address}
              numberOfLines={1}
            >
              {location.address ?? 'Đại học Vinh'}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.medium,
  },

  item: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  icon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },

  content: {
    flex: 1,
    marginHorizontal: spacing.md,
  },

  name: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  address: {
    marginTop: 3,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
  },
});