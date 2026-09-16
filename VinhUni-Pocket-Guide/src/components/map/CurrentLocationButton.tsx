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

interface CurrentLocationButtonProps {
  onPress?: () => void;
}

export default function CurrentLocationButton({ onPress }: CurrentLocationButtonProps = {}) {
  return (
    <View style={styles.buttonWrapper}>
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.7}>
          <Ionicons
            name="locate"
            size={24}
            color={colors.primaryDark}
          />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: radius.round,
    overflow: 'hidden',
    ...shadows.large,
  },
  blurContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  button: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});