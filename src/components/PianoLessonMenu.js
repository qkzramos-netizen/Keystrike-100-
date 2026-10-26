
import React, { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { useFonts } from 'expo-font';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import {
  Montserrat_400Regular,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';

const LESSONS = [
  {
    title: 'Treble Clef',
    description: 'Practice reading notes on the treble staff.',
    mode: 'Treble',
    image: require('../../public/assets/treble-clef.png'),
    subtitle: 'TREBLE STAFF',
  },
  {
    title: 'Bass Clef',
    description: 'Practice reading notes on the bass staff.',
    mode: 'Bass',
    image: require('../../public/assets/bass-clef.png'),
    subtitle: 'BASS STAFF',
  },
  {
    title: 'Chords',
    description: 'Practice identifying musical chords.',
    mode: 'Chords',
    image: require('../../public/assets/chords.png'),
    subtitle: 'CHORD RECOGNITION',
  },
];

export default function PianoLessonMenu({ onSelectLesson }) {
  const { height } = useWindowDimensions();
  const [selectedMode, setSelectedMode] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  const [fontsLoaded] = useFonts({
    Cinzel_700Bold,
    Montserrat_400Regular,
    Montserrat_700Bold,
  });

  const menuOpacity = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const cardScales = useRef(
    LESSONS.map(() => new Animated.Value(1))
  ).current;

  const ringScales = useRef(
    LESSONS.map(() => new Animated.Value(0.5))
  ).current;

  const ringOpacities = useRef(
    LESSONS.map(() => new Animated.Value(0))
  ).current;

  const titleTranslateY = useRef(new Animated.Value(0)).current;
  const compactLayout = height < 640;
  const titleFont = fontsLoaded ? 'Cinzel_700Bold' : 'Georgia';
  const interfaceFont = fontsLoaded ? 'Montserrat_700Bold' : 'Georgia';
  const bodyFont = fontsLoaded ? 'Montserrat_400Regular' : 'Georgia';

  const selectLesson = (lesson, index) => {
    if (transitioning) return;

    setTransitioning(true);
    setSelectedMode(lesson.mode);

    Animated.parallel([
      Animated.timing(menuOpacity, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.sequence([
        Animated.spring(cardScales[index], {
          toValue: 1.12,
          speed: 20,
          bounciness: 7,
          useNativeDriver: true,
        }),

        Animated.timing(cardScales[index], {
          toValue: 1.65,
          duration: 360,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      Animated.sequence([
        Animated.timing(ringOpacities[index], {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),

        Animated.parallel([
          Animated.timing(ringScales[index], {
            toValue: 3.5,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),

          Animated.timing(ringOpacities[index], {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
      ]),

      Animated.timing(titleTranslateY, {
        toValue: -10,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onSelectLesson(lesson.mode);
      }
    });
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(8,8,18,0.82)',
        overflow: 'hidden',
      }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 22,
          paddingVertical: compactLayout ? 14 : 28,
        }}
        showsVerticalScrollIndicator={false}
      >
      <Animated.View
        style={{
          opacity: menuOpacity,
          justifyContent: 'center',
        }}
      >
        {/* HEADER */}
        <Animated.View
          style={{
            alignItems: 'center',
            marginBottom: compactLayout ? 18 : 32,
            transform: [{ translateY: titleTranslateY }],
          }}
        >
          <View
            style={{
              width: 68,
              height: 3,
              backgroundColor: '#D4AF37',
              borderRadius: 3,
              marginBottom: 18,
            }}
          />

          <Text
            style={{
              color: '#D4AF37',
              fontFamily: titleFont,
              fontSize: compactLayout ? 27 : 32,
              fontWeight: '900',
              textAlign: 'center',
              letterSpacing: 1.5,
            }}
          >
            PIANO LESSONS
          </Text>

          <Text
            style={{
              color: '#E0E0E0',
              fontFamily: interfaceFont,
              fontSize: 13,
              textAlign: 'center',
              marginTop: 10,
              letterSpacing: 1,
            }}
          >
            CHOOSE YOUR NEXT CHALLENGE
          </Text>

          <Text
            style={{
              color: '#888888',
              fontFamily: bodyFont,
              fontSize: 12,
              textAlign: 'center',
              marginTop: 7,
            }}
          >
            Read the notes. Find your rhythm.
          </Text>
        </Animated.View>

        {/* LESSON CARDS */}
        <View style={{ gap: compactLayout ? 10 : 15 }}>
          {LESSONS.map((lesson, index) => {
            const isSelected = selectedMode === lesson.mode;

            return (
              <Animated.View
                key={lesson.mode}
                style={{
                  position: 'relative',
                  zIndex: isSelected ? 5 : 1,
                  transform: [{ scale: cardScales[index] }],
                  opacity:
                    selectedMode && !isSelected ? 0.35 : 1,
                }}
              >
                {/* EXPANDING SELECTION RING */}
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    borderWidth: 2,
                    borderColor: '#F7D96B',
                    borderRadius: 16,
                    opacity: ringOpacities[index],
                    transform: [
                      { scale: ringScales[index] },
                    ],
                  }}
                />

                <Pressable
                  disabled={transitioning}
                  onPress={() => selectLesson(lesson, index)}
                  style={({ pressed }) => ({
                    minHeight: compactLayout ? 88 : 105,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: compactLayout ? 12 : 17,
                    paddingHorizontal: compactLayout ? 12 : 17,
                    borderRadius: 16,

                    backgroundColor: isSelected
                      ? '#39300F'
                      : pressed
                        ? '#302A17'
                        : 'rgba(25,25,30,0.96)',

                    borderWidth: 1.5,

                    borderColor: isSelected
                      ? '#F7D96B'
                      : pressed
                        ? '#F7D96B'
                        : '#66551D',

                    shadowColor: '#D4AF37',
                    shadowOpacity: isSelected ? 0.75 : 0.16,
                    shadowRadius: isSelected ? 24 : 8,
                    shadowOffset: {
                      width: 0,
                      height: 0,
                    },
                    elevation: isSelected ? 12 : 3,
                  })}
                >
                  {/* IMAGE ICON */}
                  <View
                    style={{
                      width: compactLayout ? 52 : 62,
                      height: compactLayout ? 52 : 62,
                      borderRadius: 14,
                      backgroundColor: isSelected
                        ? '#D4AF37'
                        : '#302A17',
                      borderWidth: 1,
                      borderColor: '#9C812B',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: compactLayout ? 10 : 16,
                    }}
                  >
                    <Image
                      source={lesson.image}
                      resizeMode="contain"
                      style={{
                        width: compactLayout ? 36 : 42,
                        height: compactLayout ? 42 : 48,
                      }}
                    />
                  </View>

                  {/* CARD TEXT */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: '#D4AF37',
                        fontFamily: interfaceFont,
                        fontSize: 10,
                        fontWeight: '900',
                        letterSpacing: 1.8,
                        marginBottom: 5,
                      }}
                    >
                      {lesson.subtitle}
                    </Text>

                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontFamily: interfaceFont,
                        fontSize: 17,
                        fontWeight: '800',
                        marginBottom: 5,
                      }}
                    >
                      {lesson.title}
                    </Text>

                    <Text
                      style={{
                        color: '#BDBDBD',
                        fontFamily: bodyFont,
                        fontSize: 11,
                        lineHeight: 18,
                      }}
                    >
                      {lesson.description}
                    </Text>
                  </View>

                  {/* CHEVRON */}
                  <Text
                    style={{
                      color: '#D4AF37',
                      fontFamily: bodyFont,
                      fontSize: 25,
                      fontWeight: '300',
                      marginLeft: 8,
                    }}
                  >
                    ›
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* FOOTER */}
        <Text
          style={{
            color: '#777777',
            fontFamily: interfaceFont,
            fontSize: 10,
            textAlign: 'center',
            marginTop: 28,
            letterSpacing: 2,
          }}
        >
          FOCUS • TIMING • PRECISION
        </Text>
      </Animated.View>
      </ScrollView>

      {/* TRANSITION OVERLAY */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#08080D',
          opacity: overlayOpacity,
        }}
      />
    </View>
  );
}
