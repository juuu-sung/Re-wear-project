// components/ui/SkeletonLoader.js

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

const SkeletonLoader = ({ width, height, borderRadius = 8 }) => {
  const sharedValue = useSharedValue(0);

  useEffect(() => {
    sharedValue.value = withRepeat(withTiming(1, { duration: 1000 }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          sharedValue.value,
          [0, 1],
          [-width, width]
        ),
      },
    ],
  }));

  return (
    <View style={[styles.container, { width, height, borderRadius }]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.shimmer, animatedStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e1e9ee',
    overflow: 'hidden',
  },
  shimmer: {
    backgroundColor: '#f2f8fc',
    opacity: 0.8,
  },
});

export default SkeletonLoader;