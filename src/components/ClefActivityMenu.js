import React, { useEffect, useRef } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Animated, { Easing, cancelAnimation, useSharedValue, useAnimatedStyle, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { AppButton, BackButton, Page } from './native';

const notes = ['♪', '♫', '♬'];


export default function ClefActivityMenu({ mode, onBack, onLesson, onPractice, onQuiz, skipEntrance = false }) {
  const title = mode === 'Chords' ? 'Chords' : `${mode} Clef`;
  const enter = useSharedValue(0);
  const glow = useSharedValue(0);
  const float = useSharedValue(0);
  const buttons = [useSharedValue(0), useSharedValue(0), useSharedValue(0)];

  const buttonStyles = buttons.map(value => useAnimatedStyle(() => ({
    opacity: value.value,
    transform: [{ translateY: 20 * (1 - value.value) }, { scale: 0.96 + value.value * 0.04 }],
  })));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: 18 * (1 - enter.value) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + glow.value * 0.35,
    transform: [{ scale: 1 + glow.value * 0.025 }],
  }));

  const noteStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + float.value * 0.18,
    transform: [{ translateY: -float.value * 14 }, { rotate: `${float.value * 8 - 4}deg` }],
  }));

  useEffect(() => {
    enter.value = skipEntrance
  ? 1
  : withTiming(1, {
      duration: 450,
      easing: Easing.out(Easing.cubic),
    });
    glow.value = withRepeat(withSequence(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) })
    ), -1, false);
    float.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }), -1, true);
    buttons.forEach((value, i) => {
      value.value = withDelay(150 + i * 100, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    });
    return () => [enter, glow, float, ...buttons].forEach(cancelAnimation);
  }, []);

  return (
    <Page backgroundImage={require('../../public/assets/glowing-musical-pentagram-background-with-sound-notes_1017-31220.avif')} overlayColor="rgba(8, 8, 18, 0.94)" style={{ justifyContent: 'center', backgroundColor: '#08080D' }} contentStyle={{ maxWidth: 420, backgroundColor: '#08080D' }}>
      <BackButton onPress={onBack} />
      <View style={styles.container}>
        {notes.map((note, i) => (
          <Animated.Text key={note} pointerEvents="none" style={[styles.note, i === 0 ? styles.noteOne : i === 1 ? styles.noteTwo : styles.noteThree, noteStyle]}>{note}</Animated.Text>
        ))}
        <Animated.View style={[styles.heading, contentStyle]}>
          <Animated.Text style={[styles.title, glowStyle]}>{title}</Animated.Text>
          <View style={styles.titleLine} />
          <Text style={styles.subtitle}>Choose your learning activity</Text>
        </Animated.View>
        <View style={styles.buttons}>
          {[['Lesson', onLesson], ['Practice', onPractice], ['Quiz', onQuiz]].map(([label, action], i) => (
            <Animated.View key={label} style={buttonStyles[i]}>
              <AppButton title={label} onPress={action} />
            </Animated.View>
          ))}
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#08080D' },
  heading: { alignItems: 'center', marginBottom: 30 },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: 'bold', textAlign: 'center', textShadowColor: '#8B83FF', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14 },
  titleLine: { width: 64, height: 2, borderRadius: 2, backgroundColor: '#DCC8FF', marginTop: 12, marginBottom: 12, opacity: 0.85 },
  subtitle: { color: '#D6D8FF', fontSize: 16, textAlign: 'center' },
  buttons: { width: '100%', gap: 14 },
  note: { position: 'absolute', color: '#DCC8FF', fontSize: 42, textShadowColor: '#827BFF', textShadowRadius: 14 },
  noteOne: { top: -95, left: 25 },
  noteTwo: { top: 30, right: 8, fontSize: 34 },
  noteThree: { bottom: -70, left: 40, fontSize: 36 },
});