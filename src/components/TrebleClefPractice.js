
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Keyboard from './Keyboard';
import { BackButton } from './native';

const GOLD = '#d4af37';
const WHITE = '#FFFFFF';
const NOTEHEAD = require('../../public/note/notehead.png');

const NOTES = [
  { note: 'E4', answer: 'E', step: 0, options: ['C', 'E', 'G'] },
  { note: 'G4', answer: 'G', step: 2, options: ['E', 'G', 'A'] },
  { note: 'B4', answer: 'B', step: 4, options: ['B', 'D', 'G'] },
  { note: 'D5', answer: 'D', step: 6, options: ['B', 'D', 'F'] },
  { note: 'F4', answer: 'F', step: 1, options: ['F', 'A', 'C'] },
  { note: 'A4', answer: 'A', step: 3, options: ['A', 'C', 'E'] },
  { note: 'C5', answer: 'C', step: 5, options: ['C', 'E', 'G'] },
  { note: 'E5', answer: 'E', step: 7, options: ['D', 'E', 'G'] },
  { note: 'F5', answer: 'F', step: 8, options: ['F', 'G', 'B'] },
];

const STAFF_POSITIONS = {
  0: { top: 65, left: '5%' },
  1: { top: 57, left: '16%' },
  2: { top: 49, left: '27%' },
  3: { top: 41, left: '38%' },
  4: { top: 33, left: '49%' },
  5: { top: 25, left: '60%' },
  6: { top: 17, left: '71%' },
  7: { top: 9, left: '82%' },
  8: { top: 0, left: '93%' },
};

function shuffleNotes() {
  const shuffled = [...NOTES];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function getFiveQuestions() {
  return shuffleNotes().slice(0, 5);
}

function TrebleClefPractice({ onBack, onComplete }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [answerMode, setAnswerMode] = useState(null);
  const [practiceNotes, setPracticeNotes] = useState(() => getFiveQuestions());
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [correct, setCorrect] = useState(false);
  const [mistake, setMistake] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [highlightedNote, setHighlightedNote] = useState(null);
  const [locked, setLocked] = useState(false);

  const shake = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const transitionOpacity = useRef(new Animated.Value(0)).current;
  const transitionScale = useRef(new Animated.Value(1)).current;
  const transitioning = useRef(false);

  const current = practiceNotes[index];
  const keyboardHeight = Math.max(105, Math.min(145, screenHeight * 0.17));
  const staffWidth = Math.min(screenWidth - 52, 340);

  const runTransition = (action) => {
    if (transitioning.current) return;
    transitioning.current = true;

    Animated.parallel([
      Animated.timing(transitionOpacity, {
        toValue: 0.85,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(transitionScale, {
        toValue: 0.965,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) {
        transitioning.current = false;
        return;
      }

      action();
      transitionScale.setValue(1.025);

      Animated.parallel([
        Animated.timing(transitionOpacity, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(transitionScale, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start(() => {
        transitioning.current = false;
      });
    });
  };

  useEffect(() => {
    if (!correct) return undefined;

    glow.setValue(0);

    const animation = Animated.sequence([
      Animated.timing(glow, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.delay(280),
      Animated.timing(glow, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [correct, index, glow]);

  const answerQuestion = (answer) => {
    if (locked || completed || !current) return;

    setLocked(true);
    setHighlightedNote(answer);

    if (answer === current.answer) {
      setCorrect(true);
      setMistake(false);
      setFeedback('CORRECT! ✓');

      setTimeout(() => {
        setCorrect(false);
        setHighlightedNote(null);

        if (index === practiceNotes.length - 1) {
          setCompleted(true);
          setFeedback('ALL FIVE NOTES COMPLETE!');
        } else {
          setIndex((value) => value + 1);
          setFeedback('');
        }

        setLocked(false);
      }, 650);
    } else {
      setCorrect(false);
      setMistake(true);
      setFeedback(`NOT QUITE — ${current.answer} IS CORRECT`);
      shake.setValue(0);

      Animated.sequence([
        Animated.timing(shake, {
          toValue: -7,
          duration: 45,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: 7,
          duration: 45,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: -5,
          duration: 45,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: 5,
          duration: 45,
          useNativeDriver: true,
        }),
        Animated.spring(shake, {
          toValue: 0,
          speed: 24,
          bounciness: 3,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setMistake(false);
        setHighlightedNote(null);
        setFeedback('');
        setLocked(false);
      }, 850);
    }
  };

  const startMode = (mode) => {
    setPracticeNotes(getFiveQuestions());
    setAnswerMode(mode);
    setIndex(0);
    setFeedback('');
    setCorrect(false);
    setMistake(false);
    setCompleted(false);
    setLocked(false);
    setHighlightedNote(null);
    glow.setValue(0);
    shake.setValue(0);
  };

  const reset = () => {
    setPracticeNotes(shuffleNotes());
    setAnswerMode(null);
    setIndex(0);
    setFeedback('');
    setCorrect(false);
    setMistake(false);
    setCompleted(false);
    setLocked(false);
    setHighlightedNote(null);
    glow.setValue(0);
    shake.setValue(0);
  };

  const answerButton = (option) => {
    const isCorrect = option === current?.answer;
    const isChosen = highlightedNote === option;

    return (
      <Pressable
        key={option}
        disabled={locked}
        onPress={() => answerQuestion(option)}
        accessibilityRole="button"
        accessibilityLabel={`Note ${option}`}
        style={{
          flex: 1,
          minHeight: 50,
          marginHorizontal: 4,
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
        <Text style={{ color: '#fff', fontSize: 21, fontWeight: '800' }}>
          {option}
        </Text>
      </Pressable>
    );
  };

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
      <BackButton
        label="‹  Back"
        onPress={() => runTransition(answerMode ? reset : onBack)}
      />

      <View
        style={{
          width: '100%',
          maxWidth: 390,
          backgroundColor: '#000',
          borderWidth: 1,
          borderColor: '#333',
          borderRadius: 24,
          padding: 18,
        }}
      >
        {!answerMode ? (
          <>
            <Text
              style={{
                color: GOLD,
                fontSize: 24,
                fontWeight: '900',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              TREBLE STAFF PRACTICE
            </Text>

            <Text
              style={{
                color: '#ccc',
                fontSize: 14,
                textAlign: 'center',
                lineHeight: 21,
                marginBottom: 22,
              }}
            >
              Choose how you want to answer the treble clef notes.
            </Text>

            <Pressable
              onPress={() => runTransition(() => startMode('keyboard'))}
              style={{
                padding: 18,
                marginBottom: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: GOLD,
                backgroundColor: '#211d0c',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: GOLD, fontSize: 19, fontWeight: '900' }}>
                🎹 Piano Keyboard
              </Text>
              <Text
                style={{
                  color: '#ccc',
                  fontSize: 12,
                  textAlign: 'center',
                  marginTop: 6,
                }}
              >
                Identify each note by tapping its piano key.
              </Text>
            </Pressable>

            <Pressable
              onPress={() => runTransition(() => startMode('names'))}
              style={{
                padding: 18,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#444',
                backgroundColor: '#202020',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 19, fontWeight: '900' }}>
                A B C Note Names
              </Text>
              <Text
                style={{
                  color: '#ccc',
                  fontSize: 12,
                  textAlign: 'center',
                  marginTop: 6,
                }}
              >
                Identify each note by choosing its letter name.
              </Text>
            </Pressable>

            <Text
              style={{
                color: '#888',
                fontSize: 11,
                textAlign: 'center',
                marginTop: 20,
              }}
            >
              Answer all five notes to complete the measure.
            </Text>
          </>
        ) : (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <Text style={{ color: '#aaa', fontSize: 12, fontWeight: '700' }}>
                MEASURE 1 · TREBLE CLEF
              </Text>
              <Text style={{ color: GOLD, fontSize: 12, fontWeight: '800' }}>
                {completed ? practiceNotes.length : index + 1}/{practiceNotes.length}
              </Text>
            </View>

            <View
              style={{
                height: 4,
                backgroundColor: '#292929',
                borderRadius: 4,
                overflow: 'hidden',
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${
                    ((completed
                      ? practiceNotes.length
                      : index + (correct ? 1 : 0)) /
                      practiceNotes.length) *
                    100
                  }%`,
                  backgroundColor: GOLD,
                }}
              />
            </View>

            <View
              style={{
                width: '100%',
                height: 140,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <View style={{ width: staffWidth, height: 110, justifyContent: 'center' }}>
                {[0, 1, 2, 3, 4].map((line) => (
                  <View
                    key={line}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 25 + line * 16,
                      height: 1,
                      backgroundColor: '#aaa',
                    }}
                  />
                ))}

                <Text
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 12,
                    color: '#ddd',
                    fontSize: 47,
                    fontWeight: '400',
                  }}
                >
                  𝄞
                </Text>

                {practiceNotes.map((item, i) => {
                  const visible = i <= index || completed;
                  if (!visible) return null;

                  const active = !completed && i === index;
                  const answered = i < index || completed;
                  const noteColor = answered ? GOLD : WHITE;

                  return (
                    <View
                      key={`${item.note}-${i}`}
                      style={{
                        position: 'absolute',
                        left: STAFF_POSITIONS[item.step].left,
                        top: STAFF_POSITIONS[item.step].top - 6,
                        width: 24,
                        height: 32,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Animated.Image
                        source={NOTEHEAD}
                        resizeMode="contain"
                        style={{
                          width: 80,
                          height: 50,
                          tintColor: active ? GOLD : noteColor,
                          opacity: 1,
                          transform: [
                            {
                              scale: active
                                ? glow.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1, 1.3],
                                  })
                                : 1,
                            },
                          ],
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            </View>

            <Text
              style={{
                color: '#ddd',
                fontSize: 14,
                textAlign: 'center',
                marginBottom: 14,
              }}
            >
              {completed
                ? 'Great work! You completed the measure.'
                : 'Which note is highlighted?'}
            </Text>

            {!completed && answerMode === 'keyboard' ? (
              <>
                <Text
                  style={{
                    color: '#888',
                    fontSize: 11,
                    textAlign: 'center',
                    marginBottom: 8,
                  }}
                >
                  TAP THE MATCHING PIANO KEY
                </Text>

                <Animated.View
                  style={{
                    height: keyboardHeight,
                    borderWidth: 1,
                    borderColor: mistake ? '#ff6464' : '#555',
                    borderRadius: 10,
                    overflow: 'hidden',
                    transform: [{ translateX: shake }],
                  }}
                >
                  <Keyboard
                    includeSharps
                    height={keyboardHeight}
                    sharpHeight={keyboardHeight * 0.62}
                    highlightedNote={correct || mistake ? current.answer : highlightedNote}
                    onPress={(note) => answerQuestion(note.replace(/[0-9]/g, ''))}
                    disabled={locked}
                  />
                </Animated.View>

                {mistake ? (
                  <Text
                    style={{
                      color: GOLD,
                      textAlign: 'center',
                      marginTop: 8,
                      fontWeight: '800',
                    }}
                  >
                    Correct key: {current.answer}
                  </Text>
                ) : null}
              </>
            ) : null}

            {!completed && answerMode === 'names' ? (
              <Animated.View
                style={{
                  flexDirection: 'row',
                  transform: [{ translateX: shake }],
                }}
              >
                {current.options.map(answerButton)}
              </Animated.View>
            ) : null}

            <Text
              accessibilityLiveRegion="polite"
              style={{
                color: mistake ? '#ff6464' : correct || completed ? GOLD : '#aaa',
                fontSize: 12,
                fontWeight: '800',
                textAlign: 'center',
                marginTop: 16,
                minHeight: 18,
              }}
            >
              {feedback ||
                (answerMode === 'keyboard' && !completed
                  ? 'TAP THE CORRECT KEY'
                  : answerMode === 'names' && !completed
                    ? 'CHOOSE THE NOTE NAME'
                    : '')}
            </Text>

            {completed ? (
              <Pressable
                onPress={() => runTransition(onComplete)}
                style={{
                  minHeight: 50,
                  marginTop: 12,
                  borderRadius: 10,
                  backgroundColor: GOLD,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#111', fontSize: 15, fontWeight: '900' }}>
                  BACK TO ACTIVITIES →
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => runTransition(reset)}
              style={{ alignItems: 'center', padding: 10, marginTop: 4 }}
            >
              <Text style={{ color: '#888', fontSize: 12 }}>
                Change practice mode
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: '#080b25',
          opacity: transitionOpacity,
        }}
      />
    </Animated.View>
  );
}

export default TrebleClefPractice;
