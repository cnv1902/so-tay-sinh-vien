import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '../design';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  onAnimationFinish: () => void;
};

export default function AnimatedSplashScreen({ onAnimationFinish }: Props) {
  const opacity = useSharedValue(1);
  const progress = useSharedValue(1); // 1 = fully hidden (dashed out), 0 = fully drawn

  useEffect(() => {
    // 1. Hiệu ứng chạy viền chữ V trong 1.5s
    progress.value = withTiming(0, {
      duration: 1500,
      easing: Easing.inOut(Easing.ease),
    }, () => {
      // 2. Chờ 300ms rồi Fade out toàn màn hình (chuyển vào app)
      opacity.value = withDelay(
        300,
        withTiming(0, { duration: 500 }, (finished) => {
          if (finished) {
            runOnJS(onAnimationFinish)();
          }
        })
      );
    });
  }, []);

  const animatedProps = useAnimatedProps(() => {
    const pathLength = 200; // Độ dài đường viền chữ V
    return {
      strokeDashoffset: progress.value * pathLength,
      strokeDasharray: pathLength,
    };
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Svg width="120" height="120" viewBox="0 0 100 100">
        <AnimatedPath
          d="M 25 25 L 50 75 L 75 25"
          stroke={colors.primary}
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="transparent"
          animatedProps={animatedProps}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999, // Luôn nằm trên cùng các components khác
  },
});
