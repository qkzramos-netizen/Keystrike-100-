import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackButton, COLORS, Page } from './native';
import { CHORD_IMAGES } from './chordData';

const LESSONS = [
  {
    title: 'Meet the Chord',
    description: 'A chord is made by playing multiple notes together. These lessons focus on three-note chords called triads.',
    chord: 'C Major',
    notes: ['C', 'E', 'G'],
    tip: 'Read the notes together: the stacked noteheads make one chord.',
  },
  {
    title: 'C Major',
    description: 'The C major triad is built from C, E, and G.',
    chord: 'C Major',
    notes: ['C', 'E', 'G'],
    tip: 'C is the root. E and G complete the major chord.',
  },
  {
    title: 'G Major',
    description: 'The G major triad is built from G, B, and D.',
    chord: 'G Major',
    notes: ['G', 'B', 'D'],
    tip: 'G is the root. Look for the three notes stacked together.',
  },
  {
    title: 'A Minor',
    description: 'The A minor triad is built from A, C, and E.',
    chord: 'A Minor',
    notes: ['A', 'C', 'E'],
    tip: 'A is the root. A minor uses the same three-note shape as a major triad, with a different middle note.',
  },
  {
    title: 'Ready to Practice?',
    description: 'You have reviewed C Major, G Major, and A Minor.',
    chord: 'A Minor',
    notes: ['C Major', 'G Major', 'A Minor'],
    caption: 'CHORDS TO REVIEW',
    tip: 'In practice, identify the chord from its notation or tap the root note on the piano.',
  },
];

export default function ChordsClefLesson({ onBack, onStartQuiz }) {
  const [step, setStep] = useState(0);
  const entrance = useRef(new Animated.Value(0)).current;
  const headingEntrance = useRef(new Animated.Value(0)).current;
  const navigationEntrance = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const noteAnimations = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;
  const lesson = LESSONS[step];
  const isLastStep = step === LESSONS.length - 1;

  useEffect(() => {
    entrance.setValue(0);
    headingEntrance.setValue(0);
    navigationEntrance.setValue(0);
    progress.setValue(0);
    noteAnimations.forEach(animation => animation.setValue(0));

    Animated.parallel([
      Animated.timing(headingEntrance, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(progress, { toValue: (step + 1) / LESSONS.length, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.sequence([Animated.delay(120), Animated.spring(entrance, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true })]),
      Animated.sequence([Animated.delay(260), Animated.timing(navigationEntrance, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true })]),
    ]).start();

    Animated.stagger(180, noteAnimations.map(animation =>
      Animated.spring(animation, { toValue: 1, speed: 16, bounciness: 7, useNativeDriver: true })
    )).start();
  }, [step]);

  const goToStep = nextStep => setStep(nextStep);
  const headingStyle = {
    opacity: headingEntrance,
    transform: [{ translateY: headingEntrance.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
  };
  const cardStyle = {
    opacity: entrance,
    transform: [
      { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
      { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  };
  const navigationStyle = {
    opacity: navigationEntrance,
    transform: [{ translateY: navigationEntrance.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  return (
    <Page>
      <BackButton onPress={onBack} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Animated.View style={[styles.headingArea, headingStyle]}>
          <Text style={styles.eyebrow}>PIANO LESSON</Text>
          <Text style={styles.heading}>Chords</Text>
        </Animated.View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
        <Text style={styles.stepText}>STEP {step + 1} OF {LESSONS.length}</Text>

        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepIndicatorText}>LESSON {String(step + 1).padStart(2, '0')}</Text>
          </View>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.description}>{lesson.description}</Text>

          <View style={styles.chordBox}>
            <Image
              source={CHORD_IMAGES[lesson.chord]}
              resizeMode="contain"
              style={styles.chordImage}
              accessibilityLabel={`${lesson.chord} chord notation`}
            />
            <View style={styles.noteRow}>
              {lesson.notes.map((note, index) => (
                <Animated.View
                  key={`${step}-${note}`}
                  style={[
                    styles.noteChip,
                    {
                      opacity: noteAnimations[index],
                      transform: [
                        { translateY: noteAnimations[index].interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
                        { scale: noteAnimations[index].interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.notes}>{note}</Text>
                </Animated.View>
              ))}
            </View>
            <Text style={styles.smallText}>{lesson.caption || `NOTES IN ${lesson.chord.toUpperCase()}`}</Text>
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>✦ REMEMBER</Text>
            <Text style={styles.tipText}>{lesson.tip}</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.navigation, navigationStyle]}>
          {step > 0 && (
            <Pressable style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} onPress={() => goToStep(step - 1)}>
              <Text style={styles.backButtonText}>Previous</Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [styles.continueButton, pressed && styles.continuePressed]}
            onPress={() => isLastStep ? onStartQuiz?.() : goToStep(step + 1)}
          >
            <Text style={styles.continueText}>{isLastStep ? 'Back to Activities' : 'Continue'}</Text>
            <Text style={styles.continueArrow}>{isLastStep ? '♫' : '→'}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 24, gap: 14 },
  headingArea: { alignItems: 'center', gap: 5 },
  eyebrow: { color: COLORS.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  heading: { color: COLORS.text, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  progressTrack: { height: 7, backgroundColor: '#343D59', borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 10 },
  stepText: { color: COLORS.text, opacity: 0.7, textAlign: 'center', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  card: { backgroundColor: '#202943', borderRadius: 18, padding: 18, gap: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  stepIndicator: { alignSelf: 'center', backgroundColor: '#151D34', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  stepIndicatorText: { color: COLORS.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  lessonTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  description: { color: COLORS.text, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  chordBox: { alignItems: 'center', backgroundColor: '#151D34', borderRadius: 14, padding: 14, gap: 12 },
  chordImage: { width: '100%', height: 150, backgroundColor: '#FFFFFF', borderRadius: 10 },
  noteRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  noteChip: { minWidth: 43, height: 48, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#293753', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.primary },
  notes: { color: COLORS.primary, fontSize: 19, fontWeight: '900' },
  smallText: { color: COLORS.text, opacity: 0.7, fontSize: 11, textAlign: 'center', fontWeight: '800', letterSpacing: 1 },
  tipBox: { backgroundColor: '#293753', borderRadius: 12, padding: 14, gap: 6 },
  tipTitle: { color: COLORS.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  tipText: { color: COLORS.text, fontSize: 14, lineHeight: 21 },
  navigation: { flexDirection: 'row', gap: 10 },
  backButton: { flex: 1, minHeight: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#343D59' },
  backButtonText: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  continueButton: { flex: 2, minHeight: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, backgroundColor: COLORS.primary },
  continueText: { color: '#10182C', fontSize: 16, fontWeight: '800' },
  continueArrow: { color: '#10182C', fontSize: 20, fontWeight: '900' },
  pressed: { opacity: 0.75 },
  continuePressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
