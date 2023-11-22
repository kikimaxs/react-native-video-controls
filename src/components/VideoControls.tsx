import React, {
  PropsWithChildren,
  useMemo,
} from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import ControlsVisibilityProvider from '../context/ControlsVisibility';
import useLayout from '../hooks/useLayout';
import usePinchGesture from '../hooks/usePinchGesture';
import useTapGesture from '../hooks/useTapGesture';
import { ControlSlider } from './ControlSlider';
import ControlVideoState from './ControlVideoState';
import { defaultProps } from './defaultProps';
import type {
  ComponentProps,
  Components,
  ControlSliderProps,
  ControlVideoStateProps,
  VideoControlProps,
} from './types';

const defaultComponents: Components = {
  slider: ControlSlider,
  videoState: ControlVideoState,
};

export const VideoControls = ({
  initialVisible = true,
  components,
  componentsProps,
  onFastForward,
  onFastRewind,
  children,
  videoStateContainerStyle,
  containerStyle,
  videoElement,
  onZoomIn,
  onZoomOut,
}: PropsWithChildren<VideoControlProps>) => {
  // const [visible, setVisible] = useState(initialVisible);
  const opacityAnim = useSharedValue(initialVisible ? 1 : 0);
  const usedComponents = useMemo(() => {
    return { ...defaultComponents, ...components };
  }, [components]);
  const _componentsProps = useMemo<ComponentProps>(() => {
    return {
      slider: {
        ...defaultProps.slider,
        ...componentsProps?.slider,
      } as ControlSliderProps,
      videoState: {
        ...defaultProps.videoState,
        ...componentsProps?.videoState,
      } as ControlVideoStateProps,
    };
  }, [componentsProps]);
  const [containerLayout, onContainerLayout] = useLayout();
  const [videoStateLayout, onVideoStateLayout] = useLayout();
  const { pinchGesture } = usePinchGesture({
    onPinchIn: () => {
      onZoomOut?.();
    },
    onPinchOut: () => {
      onZoomIn?.();
    },
  });

  // const toggleVisible = useCallback(() => {
  //   setVisible((old) => !old);
  // }, []);

  const tapGesture = useTapGesture({
    numberOfTaps: 1,
    maxTapDuration: 100,
    onEnd: () => {
      'worklet';
      // runOnJS(toggleVisible)();
    },
  });
  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    maxTapDuration: 250,
    onEnd: (event) => {
      'worklet';
      const { x } = event;
      const containerWidth = containerLayout?.width ?? 0;

      if (x < containerWidth / 2) {
        if (onFastRewind) {
          runOnJS(onFastRewind)();
        }
      } else {
        if (onFastForward) {
          runOnJS(onFastForward)();
        }
      }
    },
  });

  const videoStatePosition = useMemo<ViewStyle | undefined>(() => {
    if (!videoStateLayout || !containerLayout) {
      return undefined;
    }

    return {
      left: containerLayout.width / 2 - videoStateLayout.width / 2,
      top: containerLayout.height / 2 - videoStateLayout.height / 2,
    };
  }, [videoStateLayout, containerLayout]);

  // useEffect(() => {
  //   opacityAnim.value = withTiming(visible ? 1 : 0, {
  //     duration: visible ? 200 : 600,
  //   });
  // }, [visible]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacityAnim.value,
    };
  }, []);

  const SliderComponent = usedComponents.slider!;
  const VideoStateComponent = usedComponents.videoState!;

  // const onHide = useCallback(() => {
  //   setVisible(false);
  // }, []);

  return (
    <ControlsVisibilityProvider
      isPlaying={componentsProps?.videoState?.isPlaying ?? false} visible={false}    >
      <GestureDetector
        gesture={Gesture.Exclusive(pinchGesture, doubleTap, tapGesture)}
      >
        <Animated.View>
          {videoElement}
          <Animated.View
            style={[styles.container, animatedContainerStyle, containerStyle]}
            onLayout={onContainerLayout}
            pointerEvents={'none'}
          >
            {/* <LinearGradient
              colors={
                componentsProps?.videoState?.isPlaying ?? true
                  ? ['rgba(0, 0, 0, 0.3)', 'transparent']
                  : ['rgba(0, 0, 0, 0.7)', 'transparent']
              }
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={{ flex: 1, borderRadius: 20 }}
            > */}
            <SliderComponent {..._componentsProps.slider!} />
            <View
              style={[
                styles.videoStateContainer,
                { opacity: videoStatePosition ? 1 : 0 },
                videoStatePosition,
                videoStateContainerStyle,
              ]}
              onLayout={onVideoStateLayout}
            >
              <VideoStateComponent {..._componentsProps.videoState!} />
            </View>
            {children}
            {/* </LinearGradient> */}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </ControlsVisibilityProvider>
  );
};

export default VideoControls;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    // backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  videoStateContainer: {
    position: 'absolute',
  },
});
