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
  value: string;
  onChangeText: (text: string) => void;
};

export default function MapSearch({
  value,
  onChangeText,
}: Props) {
  return (
    <View style={styles.containerWrapper}>
      <BlurView intensity={85} tint="light" style={styles.container}>
        <Ionicons
          name="search"
          size={22}
          color={colors.primary}
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Tìm tòa nhà, phòng học..."
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          returnKeyType="search"
        />

        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearBtn}>
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    borderRadius: radius.round,
    overflow: 'hidden',
    ...shadows.medium,
    marginBottom: spacing.md,
  },
  container: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  input: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 4,
  }
});