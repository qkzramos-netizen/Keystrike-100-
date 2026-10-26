
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Montserrat_700Bold,
  Montserrat_900Black,
} from '@expo-google-fonts/montserrat';
import { BackButton, ImageActionButton, Page, styles } from './native';

const musicBackground = require('../../public/assets/background2.png');
const piano = require('../../public/assets/piano.png');
const achievements = require('../../public/assets/achievements.png');
const minigame = require('../../public/assets/minigame.png');

function PlayMenu({ onNavigate, playButtonSound = () => {} }) {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_700Bold,
    Montserrat_900Black,
  });
  const containerScale = useRef(new Animated.Value(0.94)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!fontsLoaded && !fontError) return undefined;

    const entrance = Animated.parallel([
      Animated.timing(containerScale, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.back(1.3)),
        useNativeDriver: true,
      }),
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    entrance.start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.012,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => {
      entrance.stop();
      pulse.stop();
    };
  }, [containerScale, containerOpacity, pulseScale, fontsLoaded, fontError]);

  const navigate = (screen) => {
    playButtonSound();
    onNavigate(screen);
  };

  if (!fontsLoaded && !fontError) return null;
  const displayFont = fontsLoaded ? 'Montserrat_900Black' : 'Georgia';
  const interfaceFont = fontsLoaded ? 'Montserrat_700Bold' : 'Georgia';

  return (
    <Page
      backgroundImage={musicBackground}
      overlayColor="rgba(1, 1, 32, 0.8)"
      style={{ justifyContent: 'center' }}
      contentStyle={{ maxWidth: 420 }}
    >
      <BackButton onPress={() => navigate('mainmenu')} />

      <Animated.View
        style={{
          width: '100%',
          alignItems: 'center',
          opacity: containerOpacity,
          transform: [
            { scale: containerScale },
            { scale: pulseScale },
          ],
        }}
      >
        <Text style={[styles.title, {
          fontFamily: displayFont,
          fontSize: 38,
          fontWeight: '900',
          letterSpacing: 1.2,
          textShadowColor: 'rgba(127, 168, 255, 0.5)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 9,
          marginBottom: 16,
        }]}>
          Play Menu
        </Text>

        <View style={{ width: '100%', maxWidth: 280, gap: 8 }}>
          <ImageActionButton
            title="Music Lesson"
            image={piano}
            tint="rgba(5, 224, 97, 0.78)"
            imageOpacity={0.2}
            textStyle={{ fontFamily: interfaceFont, fontWeight: '700', fontSize: 18, letterSpacing: 0.45 }}
            onPress={() => navigate('musiclesson')}
          />

          <ImageActionButton
            title="Goal"
            image={achievements}
            tint="rgba(214, 158, 3, 0.78)"
            imageOpacity={0.4}
            textStyle={{ fontFamily: interfaceFont, fontWeight: '700', fontSize: 18, letterSpacing: 0.45 }}
            onPress={() => navigate('goal')}
          />

          <ImageActionButton
            title="MINIGAME"
            image={minigame}
            tint="#087eaa"
            imageOpacity={0.25}
            textStyle={{ fontFamily: interfaceFont, fontWeight: '700', fontSize: 18, letterSpacing: 0.45 }}
            onPress={() => navigate('minigame')}
          />
        </View>
      </Animated.View>
    </Page>
  );
}

export default PlayMenu;
