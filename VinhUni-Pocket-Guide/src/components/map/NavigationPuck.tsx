import React from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import Svg, { Polygon, Circle } from 'react-native-svg';

interface NavigationPuckProps {
  animatedHeading: Animated.Value;
  mapBearing?: number;
  isNavigating?: boolean;
}

export default function NavigationPuck({
  animatedHeading,
  mapBearing = 0,
  isNavigating = false,
}: NavigationPuckProps) {
  // Trừ đi góc xoay của camera bản đồ để mũi tên luôn chỉ đúng hướng địa lý thực tế
  const rotateStr = animatedHeading.interpolate({
    inputRange: [-360, 360],
    outputRange: [`${-360 - mapBearing}deg`, `${360 - mapBearing}deg`],
    extrapolate: 'extend',
  });

  return (
    <View style={styles.container}>
      {/* Vòng hào quang phát sáng xung quanh */}
      <View style={[styles.halo, isNavigating && styles.haloNavigating]} />

      {/* Khung xoay chứa Mũi tên định vị la bàn */}
      <Animated.View
        style={[
          styles.puck,
          isNavigating && styles.puckNavigating,
          {
            transform: [{ rotate: rotateStr }],
          },
        ]}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24">
          {/* Mũi tên định hướng thẳng đứng (0 độ = Hướng Bắc) */}
          <Polygon
            points="12,2 21,20 12,16 3,20"
            fill={isNavigating ? "#10B981" : "#2563EB"}
          />
          {/* Chấm tròn tâm */}
          <Circle cx="12" cy="12" r="2.5" fill="#FFFFFF" />
        </Svg>
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
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  haloNavigating: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
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
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  puckNavigating: {
    borderColor: '#ECFDF5',
  },
});
