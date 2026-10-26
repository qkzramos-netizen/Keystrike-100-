import React, { useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Pressable, Image } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';

const splash = require('../../public/assets/splashscreen.gif');
const musicBackground = require('../../public/assets/background2.png');
const splashscreenbg = require('../../public/appmusic/splashscreenbg.mp3');
const splashscreenlogo = require('../../public/appmusic/splashscreenlogo.mp3');
const CIRCLE_SIZE = 280;

export default function SplashScreen({ onNavigate, playButtonSound = () => {} }) {
  const splashMusic = useAudioPlayer(splashscreenbg);
  const logoMusic = useAudioPlayer(splashscreenlogo);

  const imageOpacity = useSharedValue(0);
  const imageScale = useSharedValue(0.88);
  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(18);
  const buttonScale = useSharedValue(0.96);
  const promptOpacity = useSharedValue(0);
  const promptScale = useSharedValue(0.98);
  const screenOpacity = useSharedValue(1);
  const circleScale = useSharedValue(0);
  const circleOpacity = useSharedValue(0);
  const hitScale = useSharedValue(0.2);
  const hitOpacity = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  const startedRef = useRef(false);
  const musicTimerRef = useRef(null);
  const fadeTimerRef = useRef(null);

  useEffect(() => {
    try {
      splashMusic.loop = false;
      splashMusic.volume = 1;
      splashMusic.seekTo(0);
      splashMusic.play();

      logoMusic.loop = false;
      logoMusic.volume = 0;
      logoMusic.seekTo(0);

      musicTimerRef.current = setTimeout(() => {
        try {
          logoMusic.play();
          let step = 0;

          fadeTimerRef.current = setInterval(() => {
            step++;
            logoMusic.volume = Math.min(step / 20, 1);

            if (step >= 20) {
              clearInterval(fadeTimerRef.current);
              fadeTimerRef.current = null;
            }
          }, 100);
        } catch (error) {
          console.warn('Unable to fade in splash logo music:', error);
        }
      }, 2000);
    } catch (error) {
      console.warn('Unable to start splash music:', error);
    }

    imageOpacity.value = withTiming(1, {
      duration: 1800,
      easing: Easing.out(Easing.cubic),
    });
    imageScale.value = withTiming(1, {
      duration: 1800,
      easing: Easing.out(Easing.back(1.05)),
    });

    contentOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
    contentY.value = withDelay(
      500,
      withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
    buttonScale.value = withDelay(
      1200,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.05)) }),
    );

    promptOpacity.value = withDelay(
      1300,
      withTiming(1, { duration: 500 }, (finished) => {
        if (finished) {
          promptOpacity.value = withRepeat(
            withTiming(0.35, {
              duration: 850,
              easing: Easing.inOut(Easing.ease),
            }),
            -1,
            true,
          );
        }
      }),
    );

    promptScale.value = withDelay(
      1900,
      withRepeat(
        withTiming(1.025, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );

    return () => {
      [
        imageOpacity,
        imageScale,
        contentOpacity,
        contentY,
        buttonScale,
        promptOpacity,
        promptScale,
        screenOpacity,
        circleScale,
        circleOpacity,
        hitScale,
        hitOpacity,
        flashOpacity,
      ].forEach(cancelAnimation);

      if (musicTimerRef.current) clearTimeout(musicTimerRef.current);
      if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
    };
  }, [splashMusic, logoMusic]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
    transform: [{ scale: imageScale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const promptStyle = useAnimatedStyle(() => ({
    opacity: promptOpacity.value,
    transform: [{ scale: promptScale.value }],
  }));

  const circleStyle = useAnimatedStyle(() => ({
    opacity: circleOpacity.value,
    transform: [{ scale: circleScale.value }],
  }));

  const hitStyle = useAnimatedStyle(() => ({
    opacity: hitOpacity.value,
    transform: [{ scale: hitScale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const handleStart = () => {
    if (startedRef.current) return;
    startedRef.current = true;

    cancelAnimation(promptOpacity);
    cancelAnimation(promptScale);
    promptOpacity.value = withTiming(0, { duration: 150 });
    promptScale.value = withTiming(1, { duration: 150 });

    try {
      playButtonSound();
    } catch (error) {
      console.warn('Unable to play button sound:', error);
    }

    circleScale.value = 0;
    circleOpacity.value = 0;
    hitScale.value = 0.2;
    hitOpacity.value = 0;
    flashOpacity.value = 0;

    circleOpacity.value = withTiming(1, { duration: 120 });
    circleScale.value = withTiming(9, {
      duration: 850,
      easing: Easing.in(Easing.cubic),
    });

    imageScale.value = withTiming(1.12, {
      duration: 550,
      easing: Easing.in(Easing.cubic),
    });
    imageOpacity.value = withTiming(0, {
      duration: 500,
      easing: Easing.in(Easing.cubic),
    });
    contentOpacity.value = withTiming(0, { duration: 350 });

    hitOpacity.value = withDelay(850, withTiming(1, { duration: 100 }));
    hitScale.value = withDelay(
      850,
      withTiming(1.8, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      }),
    );

    flashOpacity.value = withDelay(
      850,
      withTiming(0.65, { duration: 100 }),
    );
    flashOpacity.value = withDelay(
      1030,
      withTiming(0, { duration: 300 }),
    );

    screenOpacity.value = withDelay(
      1030,
      withTiming(0, { duration: 400 }, (finished) => {
        if (finished) runOnJS(onNavigate)('mainmenu');
      }),
    );
  };

  return (
    <Animated.View style={[styles.screen, screenStyle]}>
      <Image
        source={musicBackground}
        resizeMode="cover"
        style={StyleSheet.absoluteFillObject}
      />

      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: 'rgba(0, 0, 32, 0.8)' },
        ]}
      />

      <Pressable style={styles.fullScreenPressable} onPress={handleStart}>
        <View style={styles.container}>
          <Animated.Image
            source={splash}
            resizeMode="contain"
            style={[styles.splashImage, imageStyle]}
          />

          <Animated.View
            style={[styles.content, contentStyle]}
            pointerEvents="none"
          >
            <Text style={styles.tagline}>
              Build your rhythm. Master the keys.
            </Text>

            <Animated.View style={[styles.promptContainer, buttonStyle]}>
              <Animated.Text style={[styles.pressAnywhere, promptStyle]}>
                PRESS ANYWHERE TO CONTINUE
              </Animated.Text>
              <View style={styles.promptLine} />
            </Animated.View>
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[styles.transitionCircle, circleStyle]}
          />

          <Animated.View
            pointerEvents="none"
            style={[styles.hitCircle, hitStyle]}
          />

          <Animated.View
            pointerEvents="none"
            style={[styles.flash, flashStyle]}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050f47' },
  fullScreenPressable: { flex: 1 },
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  splashImage: {
    width: 365,
    height: 900,
    marginBottom: -300,
    marginTop: -200,
    zIndex: 1,
  },
  content: { alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  tagline: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  promptContainer: { alignItems: 'center', justifyContent: 'center', width: 320 },
  pressAnywhere: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 3,
    paddingVertical: 12,
    paddingHorizontal: 8,
    textShadowColor: 'rgba(180, 150, 255, 0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  promptLine: {
    width: 90,
    height: 2,
    marginTop: 2,
    borderRadius: 2,
    backgroundColor: '#DCC8FF',
    opacity: 0.8,
  },
  transitionCircle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#050f47',
    zIndex: 10,
  },
  hitCircle: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#050f47',
    zIndex: 11,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050f47',
    zIndex: 12,
  },
});
