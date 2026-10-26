import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Keyboard from './Keyboard';
import { BackButton } from './native';
import { CHORD_IMAGES, CHORD_QUESTIONS } from './chordData';

const GOLD = '#d4af37';
const WHITE = '#FFFFFF';
const PRACTICE_LENGTH = 5;

function shuffleQuestions() {
  const shuffled = [...CHORD_QUESTIONS];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}

function getPracticeQuestions() {
  const questions = shuffleQuestions();
  while (questions.length < PRACTICE_LENGTH) {
    questions.push(CHORD_QUESTIONS[Math.floor(Math.random() * CHORD_QUESTIONS.length)]);
  }
  return questions;
}

function ChordsPractice({ onBack, onComplete }) {
  const { height: screenHeight } = useWindowDimensions();
  const [answerMode, setAnswerMode] = useState(null);
  const [practiceQuestions, setPracticeQuestions] = useState(getPracticeQuestions);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [correct, setCorrect] = useState(false);
  const [mistake, setMistake] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [highlightedChord, setHighlightedChord] = useState(null);
  const [locked, setLocked] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const transitionScale = useRef(new Animated.Value(1)).current;
  const transitioning = useRef(false);
  const current = practiceQuestions[index];
  const keyboardHeight = Math.max(105, Math.min(145, screenHeight * 0.17));

  const runTransition = action => {
    if (transitioning.current) return;
    transitioning.current = true;
    Animated.timing(transitionScale, { toValue: 0.965, duration: 130, useNativeDriver: true }).start(({ finished }) => {
      if (!finished) {
        transitioning.current = false;
        return;
      }
      action();
      Animated.spring(transitionScale, { toValue: 1, speed: 22, bounciness: 5, useNativeDriver: true }).start(() => {
        transitioning.current = false;
      });
    });
  };

  useEffect(() => {
    if (!correct) return undefined;
    glow.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(280),
      Animated.timing(glow, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [correct, index, glow]);

  const answerQuestion = answer => {
    if (locked || completed || !current) return;
    setLocked(true);
    setHighlightedChord(answer);

    if (answer === current.answer) {
      setCorrect(true);
      setMistake(false);
      setFeedback('CORRECT! ✓');
      setTimeout(() => {
        setCorrect(false);
        setHighlightedChord(null);
        if (index === practiceQuestions.length - 1) {
          setCompleted(true);
          setFeedback('ALL FIVE CHORDS COMPLETE!');
        } else {
          setIndex(value => value + 1);
          setFeedback('');
        }
        setLocked(false);
      }, 650);
      return;
    }

    setCorrect(false);
    setMistake(true);
    setFeedback(`NOT QUITE — ${current.answer.toUpperCase()} IS CORRECT`);
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: -7, duration: 45, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 7, duration: 45, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -5, duration: 45, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 5, duration: 45, useNativeDriver: true }),
      Animated.spring(shake, { toValue: 0, speed: 24, bounciness: 3, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      setMistake(false);
      setHighlightedChord(null);
      setFeedback('');
      setLocked(false);
    }, 850);
  };

  const startMode = mode => {
    setPracticeQuestions(getPracticeQuestions());
    setAnswerMode(mode);
    setIndex(0);
    setFeedback('');
    setCorrect(false);
    setMistake(false);
    setCompleted(false);
    setLocked(false);
    setHighlightedChord(null);
    glow.setValue(0);
    shake.setValue(0);
  };

  const reset = () => {
    setPracticeQuestions(getPracticeQuestions());
    setAnswerMode(null);
    setIndex(0);
    setFeedback('');
    setCorrect(false);
    setMistake(false);
    setCompleted(false);
    setLocked(false);
    setHighlightedChord(null);
    glow.setValue(0);
    shake.setValue(0);
  };

  const answerButton = option => {
    const isCorrect = option === current?.answer;
    const isChosen = highlightedChord === option;
    return (
      <Pressable
        key={option}
        disabled={locked}
        onPress={() => answerQuestion(option)}
        accessibilityRole="button"
        accessibilityLabel={option}
        style={{
          flex: 1,
          minHeight: 50,
          marginHorizontal: 4,
          paddingHorizontal: 4,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 9,
          borderWidth: 1,
          borderColor: isChosen ? (isCorrect ? GOLD : '#ff6464') : '#454545',
          backgroundColor: isChosen ? (isCorrect ? '#514510' : '#571f25') : '#252525',
          opacity: locked && !isChosen ? 0.65 : 1,
          shadowColor: isChosen ? (isCorrect ? GOLD : '#ff6464') : 'transparent',
          shadowOpacity: isChosen ? 0.7 : 0,
          shadowRadius: 9,
          elevation: isChosen ? 5 : 0,
        }}
      >
        <Text style={{ color: WHITE, fontSize: 15, fontWeight: '800', textAlign: 'center' }}>{option}</Text>
      </Pressable>
    );
  };

  const selectedChord = CHORD_QUESTIONS.find(question => question.answer === highlightedChord);
  const highlightedRoot = correct || mistake ? current?.answerRoot : selectedChord?.answerRoot;

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: '#121212',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingTop: 54,
        paddingBottom: 16,
        transform: [{ scale: transitionScale }],
      }}
    >
      <BackButton label="‹  Back" onPress={() => runTransition(answerMode ? reset : onBack)} />
      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
      <View style={{ width: '100%', maxWidth: 390, backgroundColor: '#000', borderWidth: 1, borderColor: '#333', borderRadius: 24, padding: 18 }}>
        {!answerMode ? (
          <>
            <Text style={{ color: GOLD, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>CHORD PRACTICE</Text>
            <Text style={{ color: '#ccc', fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 22 }}>
              Choose how you want to identify each chord.
            </Text>
            <Pressable
              onPress={() => runTransition(() => startMode('keyboard'))}
              style={{ padding: 18, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: GOLD, backgroundColor: '#211d0c', alignItems: 'center' }}
            >
              <Text style={{ color: GOLD, fontSize: 19, fontWeight: '900' }}>🎹 Piano Keyboard</Text>
              <Text style={{ color: '#ccc', fontSize: 12, textAlign: 'center', marginTop: 6 }}>Identify each chord by tapping its root note.</Text>
            </Pressable>
            <Pressable
              onPress={() => runTransition(() => startMode('names'))}
              style={{ padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#444', backgroundColor: '#202020', alignItems: 'center' }}
            >
              <Text style={{ color: WHITE, fontSize: 19, fontWeight: '900' }}>Chord Names</Text>
              <Text style={{ color: '#ccc', fontSize: 12, textAlign: 'center', marginTop: 6 }}>Identify each chord by choosing its name.</Text>
            </Pressable>
            <Text style={{ color: '#888', fontSize: 11, textAlign: 'center', marginTop: 20 }}>Answer all five chords to complete the measure.</Text>
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#aaa', fontSize: 12, fontWeight: '700' }}>MEASURE 1 · CHORDS</Text>
              <Text style={{ color: GOLD, fontSize: 12, fontWeight: '800' }}>{completed ? practiceQuestions.length : index + 1}/{practiceQuestions.length}</Text>
            </View>
            <View style={{ height: 4, backgroundColor: '#292929', borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
              <View style={{ height: '100%', width: `${((completed ? practiceQuestions.length : index + (correct ? 1 : 0)) / practiceQuestions.length) * 100}%`, backgroundColor: GOLD }} />
            </View>
            <Animated.View style={{ width: '100%', height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 12, transform: [{ translateX: shake }] }}>
              <Animated.Image
                source={current ? CHORD_IMAGES[current.note] : undefined}
                resizeMode="contain"
                accessibilityLabel={current ? `${current.note} chord notation` : 'Chord notation'}
                style={{
                  width: '100%',
                  height: 140,
                  backgroundColor: WHITE,
                  borderRadius: 10,
                  borderWidth: mistake ? 2 : 0,
                  borderColor: '#ff6464',
                  transform: [{ scale: correct ? glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) : 1 }],
                }}
              />
            </Animated.View>
            <Text style={{ color: '#ddd', fontSize: 14, textAlign: 'center', marginBottom: 14 }}>
              {completed ? 'Great work! You completed the measure.' : 'Which chord is shown?'}
            </Text>

            {!completed && answerMode === 'keyboard' ? (
              <>
                <Text style={{ color: '#888', fontSize: 11, textAlign: 'center', marginBottom: 8 }}>TAP THE CHORD'S ROOT NOTE</Text>
                <Animated.View style={{ height: keyboardHeight, borderWidth: 1, borderColor: mistake ? '#ff6464' : '#555', borderRadius: 10, overflow: 'hidden', transform: [{ translateX: shake }] }}>
                  <Keyboard
                    height={keyboardHeight}
                    highlightedNote={highlightedRoot}
                    onPress={note => {
                      const chord = CHORD_QUESTIONS.find(question => question.answerRoot === note);
                      if (chord) answerQuestion(chord.answer);
                    }}
                    disabled={locked}
                  />
                </Animated.View>
                {mistake ? <Text style={{ color: GOLD, textAlign: 'center', marginTop: 8, fontWeight: '800' }}>Correct chord: {current.answer}</Text> : null}
              </>
            ) : null}

            {!completed && answerMode === 'names' ? (
              <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: shake }] }}>
                {current.options.map(answerButton)}
              </Animated.View>
            ) : null}

            <Text accessibilityLiveRegion="polite" style={{ color: mistake ? '#ff6464' : correct || completed ? GOLD : '#aaa', fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 16, minHeight: 18 }}>
              {feedback || (answerMode === 'keyboard' && !completed ? 'TAP THE ROOT NOTE' : answerMode === 'names' && !completed ? 'CHOOSE THE CHORD NAME' : '')}
            </Text>
            {completed ? (
              <Pressable onPress={() => runTransition(onComplete)} style={{ minHeight: 50, marginTop: 12, borderRadius: 10, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#111', fontSize: 15, fontWeight: '900' }}>BACK TO ACTIVITIES →</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={reset} style={{ alignItems: 'center', padding: 10, marginTop: 4 }}>
              <Text style={{ color: '#888', fontSize: 12 }}>Change practice mode</Text>
            </Pressable>
          </>
        )}
      </View>
      </ScrollView>
    </Animated.View>
  );
}

export default ChordsPractice;
