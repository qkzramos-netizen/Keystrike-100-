
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Montserrat_400Regular,
  Montserrat_700Bold,
  Montserrat_900Black,
} from '@expo-google-fonts/montserrat';
import { AppButton, BackButton, Page, styles } from './native';

const minigame = require('../../public/assets/minigame.png');
const splashscreen = require('../../public/assets/pianomanlogo.png');
const GOLD = '#db9500';
const NAVY = '#010172';

function GameCard({
  title,
  description,
  image,
  onPress,
  playButtonSound,
  delay = 0,
  selected,
  disabled,
  onSelect,
  titleFont = 'Georgia',
  descriptionFont = 'Georgia',
}) {
  const entrance = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(1)).current;
  const lightPosition = useRef(new Animated.Value(-1)).current;
  const selectionScale = useRef(new Animated.Value(1)).current;
  const selectionGlow = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);
  const navigating = useRef(false);

  useEffect(() => {
    const enter = Animated.sequence([
      Animated.delay(delay),
      Animated.spring(entrance, {
        toValue: 1,
        damping: 16,
        stiffness: 90,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]);

    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const imageMotion = Animated.loop(
      Animated.sequence([
        Animated.timing(imageScale, {
          toValue: 1.04,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(imageScale, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const lightSweep = Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(lightPosition, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(2200),
        Animated.timing(lightPosition, {
          toValue: -1,
          duration: 1,
          useNativeDriver: true,
        }),
      ])
    );

    enter.start();
    floating.start();
    imageMotion.start();
    lightSweep.start();

    return () => {
      enter.stop();
      floating.stop();
      imageMotion.stop();
      lightSweep.stop();
    };
  }, [delay, entrance, float, imageScale, lightPosition]);

  useEffect(() => {
    Animated.timing(glow, {
      toValue: hovered ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [hovered, glow]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(selectionScale, {
        toValue: selected ? 1.035 : 1,
        damping: 12,
        stiffness: 140,
        useNativeDriver: true,
      }),
      Animated.timing(selectionGlow, {
        toValue: selected ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  }, [selected, selectionScale, selectionGlow]);

  const handlePressIn = () => {
    if (disabled || navigating.current) return;
    setHovered(true);
    Animated.spring(scale, {
      toValue: 0.985,
      speed: 28,
      bounciness: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (navigating.current) return;
    setHovered(false);
    Animated.spring(scale, {
      toValue: 1,
      speed: 20,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled || navigating.current) return;
    navigating.current = true;
    playButtonSound?.();
    onSelect?.();

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1.035,
        speed: 18,
        bounciness: 5,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setTimeout(() => onPress?.(), 650);
      }
    });
  };

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [NAVY, '#fff1a8'],
  });

  const shadowOpacity = Animated.add(
    glow.interpolate({
      inputRange: [0, 1],
      outputRange: [0.08, 0.35],
    }),
    selectionGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.35],
    })
  );

  const lightX = lightPosition.interpolate({
    inputRange: [-1, 1],
    outputRange: [-300, 300],
  });

  const floatY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  const entryY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [35, 0],
  });

  const entryScale = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  const selectionBorder = selectionGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [NAVY, '#fff1a8'],
  });

  return (
    <Animated.View
      style={{
        width: '100%',
        opacity: entrance,
        transform: [
          { translateY: Animated.add(entryY, floatY) },
          { scale: Animated.multiply(Animated.multiply(entryScale, scale), selectionScale) },
        ],
      }}
    >
      <Animated.View
        style={[
          styles.card,
          {
            alignItems: 'center',
            backgroundColor: GOLD,
            borderColor: selected ? selectionBorder : borderColor,
            borderWidth: selected ? 3 : 2,
            borderRadius: 18,
            padding: 18,
            shadowColor: '#ffe47a',
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity,
            shadowRadius: selected ? 20 : 14,
            elevation: selected ? 10 : hovered ? 8 : 3,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Play ${title}`}
          disabled={disabled}
          onHoverIn={() => !disabled && setHovered(true)}
          onHoverOut={() => setHovered(false)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={{ width: '100%' }}
        >
          <View
            style={{
              width: '100%',
              height: 130,
              overflow: 'hidden',
              borderRadius: 14,
              backgroundColor: '#000000',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.25)',
            }}
          >
            <Animated.Image
              source={image}
              resizeMode="contain"
              style={{
                width: '100%',
                height: '100%',
                transform: [{ scale: imageScale }],
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                overflow: 'hidden',
              }}
            >
              <Animated.View
                style={{
                  position: 'absolute',
                  top: -35,
                  bottom: -35,
                  width: 55,
                  backgroundColor: 'rgba(255,239,177,0.17)',
                  transform: [
                    { translateX: lightX },
                    { skewX: '-18deg' },
                  ],
                }}
              />
            </View>
          </View>

          <Text
            style={{
              color: NAVY,
              fontFamily: titleFont,
              fontSize: 26,
              fontWeight: '700',
              letterSpacing: 0.35,
              marginTop: 9,
              textAlign: 'center',
            }}
          >
            {title}
          </Text>

          <Text
            style={{
              color: NAVY,
              fontFamily: descriptionFont,
              fontSize: 16,
              lineHeight: 22,
              letterSpacing: 0.05,
              marginVertical: 8,
              textAlign: 'center',
            }}
          >
            {description}
          </Text>
        </Pressable>
        <AppButton
          title={selected ? 'Loading...' : 'Play'}
          onPress={handlePress}
          disabled={disabled}
          style={{
            width: 150,
            alignSelf: 'center',
            backgroundColor: NAVY,
            borderColor: 'rgba(255,255,255,0.3)',
            borderWidth: 1,
          }}
          textStyle={{
            fontFamily: titleFont,
            fontWeight: '700',
            letterSpacing: 0.4,
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}

function Minigame({ onNavigate, playButtonSound = () => {} }) {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_700Bold,
    Montserrat_900Black,
  });
  const headingOpacity = useRef(new Animated.Value(0)).current;
  const headingY = useRef(new Animated.Value(12)).current;
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return undefined;

    Animated.parallel([
      Animated.timing(headingOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(headingY, {
        toValue: 0,
        damping: 18,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headingOpacity, headingY, fontsLoaded, fontError]);

  const displayFont = fontsLoaded ? 'Montserrat_900Black' : 'Georgia';
  const interfaceFont = fontsLoaded ? 'Montserrat_700Bold' : 'Georgia';
  const bodyFont = fontsLoaded ? 'Montserrat_400Regular' : 'Georgia';

  const navigate = (screen) => {
    playButtonSound();
    onNavigate(screen);
  };

  const selectGame = (game) => setSelectedGame(game);

  return (
    <Page style={{ justifyContent: 'center' }} contentStyle={{ maxWidth: 400 }}>
      <BackButton onPress={() => navigate('mainmenu')} />

      <Animated.View
        style={{
          width: '100%',
          opacity: headingOpacity,
          transform: [{ translateY: headingY }],
        }}
      >
        <Text style={[styles.title, {
          fontFamily: displayFont,
          fontSize: 31,
          fontWeight: '900',
          letterSpacing: 0.8,
          textShadowColor: 'rgba(127, 168, 255, 0.48)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 8,
          marginTop: 70,
        }]}>
          Welcome to the Minigame!
        </Text>
        <Text style={[styles.subtitle, {
          fontFamily: bodyFont,
          fontSize: 14,
          letterSpacing: 0.1,
        }]}>
          Get ready to test your skills and have fun!
        </Text>
      </Animated.View>

      <GameCard
        title="Tower Defense"
        description="Defend your tower with the power of music."
        image={minigame}
        delay={100}
        playButtonSound={playButtonSound}
        selected={selectedGame === 'towerdefense'}
        disabled={selectedGame !== null}
        onSelect={() => selectGame('towerdefense')}
        onPress={() => onNavigate('towerdefense')}
        titleFont={interfaceFont}
        descriptionFont={bodyFont}
      />

      <GameCard
        title="Piano Man"
        description="Match the falling notes to the beat."
        image={splashscreen}
        delay={260}
        playButtonSound={playButtonSound}
        selected={selectedGame === 'pianoman'}
        disabled={selectedGame !== null}
        onSelect={() => selectGame('pianoman')}
        onPress={() => onNavigate('pianoman')}
        titleFont={interfaceFont}
        descriptionFont={bodyFont}
      />
    </Page>
  );
}

export default Minigame;
