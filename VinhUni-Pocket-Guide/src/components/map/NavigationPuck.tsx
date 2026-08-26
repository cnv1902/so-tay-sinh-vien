import React from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design';

interface NavigationPuckProps {
  animatedHeading: Animated.Value;
  isNavigating?: boolean;
}

export default function NavigationPuck({ animatedHeading, isNavigating = false }: NavigationPuckProps) {
  const rotateStr = animatedHeading.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Outer Pulse/Aura Glow */}
      <View style={[styles.halo, isNavigating && styles.haloNavigating]} />

      {/* Rotating Arrow Puck */}
      <Animated.View
        style={[
          styles.puck,
          {
            transform: [{ rotate: rotateStr }],
          },
        ]}
      >
        <View style={styles.arrowContainer}>
          <Ionicons
            name="navigate"
            size={isNavigating ? 30 : 24}
            color={colors.primary}
            style={styles.arrowIcon}
          />
        </View>
        <View style={styles.centerDot} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 58, 95, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(30, 58, 95, 0.3)',
  },
  haloNavigating: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(59, 130, 246, 0.22)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  puck: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    marginTop: -2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  centerDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    top: 17,
  },
});
