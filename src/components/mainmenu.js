
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Montserrat_400Regular,
  Montserrat_700Bold,
  Montserrat_900Black,
} from '@expo-google-fonts/montserrat';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BackButton, ImageActionButton, Page, styles } from './native';

const musicBackground = require('../../public/assets/glowing-musical-pentagram-background-with-sound-notes_1017-31220.avif');
const piano = require('../../public/assets/piano.png');
const achievements = require('../../public/assets/achievements.png');
const settings = require('../../public/assets/settings.png');
const profile = require('../../public/assets/profile.png');

const AnimatedView = Animated.View;
const AnimatedText = Animated.Text;

function MainMenu({ onNavigate, isAuthenticated, playButtonSound = () => {} }) {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_700Bold,
    Montserrat_900Black,
  });
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(12);
  const titleScale = useSharedValue(0.94);

  const menuOpacity = useSharedValue(0);
  const menuY = useSharedValue(18);

  const subtitleOpacity = useSharedValue(0);
  const subtitleY = useSharedValue(6);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [
      { translateY: titleY.value },
      { scale: titleScale.value },
    ],
  }));

  const menuStyle = useAnimatedStyle(() => ({
    opacity: menuOpacity.value,
    transform: [{ translateY: menuY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleY.value }],
  }));

  useEffect(() => {
    if (!fontsLoaded && !fontError) return undefined;

    titleOpacity.value = withTiming(1, { duration: 400 });
    titleY.value = withSpring(0, { damping: 14, stiffness: 110 });
    titleScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    menuOpacity.value = withDelay(
      140,
      withTiming(1, { duration: 420 })
    );
    menuY.value = withDelay(
      140,
      withSpring(0, { damping: 16, stiffness: 100 })
    );

    subtitleOpacity.value = withDelay(
      360,
      withTiming(1, { duration: 350 })
    );
    subtitleY.value = withDelay(
      360,
      withTiming(0, {
        duration: 350,
        easing: Easing.out(Easing.quad),
      })
    );

    return () => {
      cancelAnimation(titleOpacity);
      cancelAnimation(titleY);
      cancelAnimation(titleScale);
      cancelAnimation(menuOpacity);
      cancelAnimation(menuY);
      cancelAnimation(subtitleOpacity);
      cancelAnimation(subtitleY);
    };
  }, [fontsLoaded, fontError]);

  const navigate = (screen) => {
    playButtonSound();
    onNavigate(screen);
  };

  if (!fontsLoaded && !fontError) return null;
  const displayFont = fontsLoaded ? 'Montserrat_900Black' : 'Georgia';
  const interfaceFont = fontsLoaded ? 'Montserrat_700Bold' : 'Georgia';
  const bodyFont = fontsLoaded ? 'Montserrat_400Regular' : 'Georgia';

  return (
    <Page
      backgroundImage={musicBackground}
      overlayColor="rgba(1, 1, 58, 0.8)"
      style={{ justifyContent: 'center' }}
      contentStyle={{ maxWidth: 420 }}
    >
      <BackButton onPress={() => navigate('splash')} />

      <AnimatedText style={[
        styles.title,
        {
          fontFamily: displayFont,
          fontSize: 46,
          fontWeight: '900',
          letterSpacing: 1.8,
          textShadowColor: 'rgba(127, 168, 255, 0.62)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 12,
        },
        titleStyle,
      ]}>
        Main Menu
      </AnimatedText>

      <AnimatedView
        style={[
          { width: '100%', maxWidth: 280, marginTop: 12 },
          menuStyle,
        ]}
      >
        <ImageActionButton
          title="Play"
          image={piano}
          tint="rgba(5, 224, 97, 0.78)"
          imageOpacity={0.2}
          textStyle={{ fontFamily: interfaceFont, fontWeight: '700', letterSpacing: 0.8 }}
          onPress={() => navigate('playmenu')}
        />

        <ImageActionButton
          title="Stats"
          image={achievements}
          tint="rgba(214, 158, 3, 0.78)"
          imageOpacity={0.4}
          textStyle={{ fontFamily: interfaceFont, fontWeight: '700', letterSpacing: 0.8 }}
          onPress={() => navigate('stats')}
        />

        <ImageActionButton
          title="Settings"
          image={settings}
          tint="rgba(3, 147, 214, 0.78)"
          imageOpacity={0.4}
          textStyle={{ fontFamily: interfaceFont, fontWeight: '700', letterSpacing: 0.8 }}
          onPress={() => navigate('settings')}
        />

        <ImageActionButton
          title="Profile"
          image={profile}
          tint="rgba(255, 81, 0, 0.88)"
          imageOpacity={0.4}
          textStyle={{ fontFamily: interfaceFont, fontWeight: '700', letterSpacing: 0.8 }}
          onPress={() => navigate('profile')}
        />
      </AnimatedView>

      <AnimatedText
        style={[
          styles.subtitle,
          {
            fontFamily: bodyFont,
            fontSize: 13,
            letterSpacing: 0.15,
            marginTop: 10,
            marginBottom: 0,
          },
          subtitleStyle,
        ]}
      >
        {isAuthenticated
          ? 'Signed in. Your stats sync to your account.'
          : 'Play as a guest; sign in only when you want to save progress.'}
      </AnimatedText>
    </Page>
  );
}

export default MainMenu;
