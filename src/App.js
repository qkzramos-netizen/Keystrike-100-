
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import { onAuthStateChanged } from 'firebase/auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { flushPendingGameResults } from './achievements';
import { auth } from './firebase';

import SplashScreen from './components/splashscreen';
import Login from './components/login';
import Signup from './components/signup';
import MainMenu from './components/mainmenu';
import PlayMenu from './components/playmenu';
import Settings from './components/settings';
import Minigame from './components/minigame';
import Goal from './components/goal';
import Stats from './components/stats';
import Profile from './components/profile';
import MusicLesson from './components/musiclesson';
import PianoMan from './components/pianoman';
import TowerDefense from './components/towerdefense';

const BUTTON_SFX = require('../public/appsfx/mainsfx.mp3');
const BACKGROUND_MUSIC = require('../public/appmusic/background.mp3');
const AUDIO_SETTINGS_KEY = '@keystrike_audio_settings';

const DEFAULT_AUDIO_SETTINGS = {
  soundEffects: true,
  music: true,
  musicVolume: 35,
  soundEffectsVolume: 100,
  towerDefenseGuide: true,
  towerDefenseGuidePrompted: false,
  pianoManGuide: true,
  pianoManGuidePrompted: false,
};

const SILENT_SCREENS = [
  'splash',
  'musiclesson',
  'pianoman',
  'towerdefense',
];

const TRANSITION_OUT_MS = 130;
const TRANSITION_IN_MS = 260;

const StyleSheetFill = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [displayScreen, setDisplayScreen] = useState('splash');
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [audioSettings, setAudioSettings] = useState(
    DEFAULT_AUDIO_SETTINGS
  );
  const [audioSettingsLoaded, setAudioSettingsLoaded] = useState(false);

  const buttonSoundPlayer = useAudioPlayer(BUTTON_SFX);
  const backgroundMusicPlayer = useAudioPlayer(BACKGROUND_MUSIC);

  const transitioning = useRef(false);

  const screenOpacity = useSharedValue(1);
  const screenScale = useSharedValue(1);
  const transitionOpacity = useSharedValue(0);

  const animatedScreenStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: screenOpacity.value,
    transform: [{ scale: screenScale.value }],
  }));

  const animatedTransitionStyle = useAnimatedStyle(() => ({
    ...StyleSheetFill,
    opacity: transitionOpacity.value,
  }));

  // Called on the React Native JS runtime after the transition finishes.
  const finishTransition = useCallback(() => {
    transitioning.current = false;
    setScreen(displayScreen);
  }, [displayScreen]);

  const playButtonSound = useCallback(() => {
    if (
      !audioSettings.soundEffects ||
      audioSettings.soundEffectsVolume <= 0
    ) {
      return;
    }

    try {
      buttonSoundPlayer.volume =
        audioSettings.soundEffectsVolume / 100;

      buttonSoundPlayer.seekTo(0);
      buttonSoundPlayer.play();
    } catch (error) {
      console.warn('Button sound failed:', error);
    }
  }, [
    buttonSoundPlayer,
    audioSettings.soundEffects,
    audioSettings.soundEffectsVolume,
  ]);

  const navigate = useCallback(
    (nextScreen) => {
      if (
        transitioning.current ||
        nextScreen === displayScreen
      ) {
        return;
      }

      transitioning.current = true;

      screenOpacity.value = withTiming(0, {
        duration: TRANSITION_OUT_MS,
        easing: Easing.in(Easing.quad),
      });

      screenScale.value = withTiming(0.965, {
        duration: TRANSITION_OUT_MS,
        easing: Easing.in(Easing.quad),
      });

      transitionOpacity.value = withTiming(
        0.12,
        {
          duration: TRANSITION_OUT_MS,
          easing: Easing.out(Easing.quad),
        },
        (finished) => {
          if (finished) {
            runOnJS(setDisplayScreen)(nextScreen);
          }
        }
      );
    },
    [
      displayScreen,
      screenOpacity,
      screenScale,
      transitionOpacity,
    ]
  );

  const handleHardwareBack = useCallback(() => {
    const previousScreen = {
      login: 'splash',
      signup: 'splash',
      mainmenu: 'splash',
      playmenu: 'mainmenu',
      settings: 'mainmenu',
      minigame: 'mainmenu',
      goal: 'playmenu',
      stats: 'mainmenu',
      profile: 'mainmenu',
      musiclesson: 'playmenu',
      pianoman: 'minigame',
      towerdefense: 'minigame',
    }[displayScreen];

    if (!previousScreen) return false;
    navigate(previousScreen);
    return true;
  }, [displayScreen, navigate]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleHardwareBack
    );
    return () => subscription.remove();
  }, [handleHardwareBack]);

  // Animate the incoming screen.
  useEffect(() => {
    if (!authReady || !transitioning.current) {
      return;
    }

    screenOpacity.value = 0;
    screenScale.value = 1.025;
    transitionOpacity.value = 0.12;

    screenOpacity.value = withTiming(1, {
      duration: TRANSITION_IN_MS,
      easing: Easing.out(Easing.quad),
    });

    screenScale.value = withTiming(1, {
      duration: TRANSITION_IN_MS,
      easing: Easing.out(Easing.cubic),
    });

    transitionOpacity.value = withTiming(
      0,
      {
        duration: TRANSITION_IN_MS,
        easing: Easing.out(Easing.quad),
      },
      (finished) => {
        if (finished) {
          runOnJS(finishTransition)();
        }
      }
    );
  }, [
    displayScreen,
    authReady,
    screenOpacity,
    screenScale,
    transitionOpacity,
    finishTransition,
  ]);

  // Cancel animations on unmount.
  useEffect(() => {
    return () => {
      cancelAnimation(screenOpacity);
      cancelAnimation(screenScale);
      cancelAnimation(transitionOpacity);
    };
  }, [
    screenOpacity,
    screenScale,
    transitionOpacity,
  ]);

  // Load saved audio settings.
  useEffect(() => {
    let active = true;

    const loadAudioSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(
          AUDIO_SETTINGS_KEY
        );

        if (saved && active) {
          const parsed = JSON.parse(saved);

          setAudioSettings({
            soundEffects:
              typeof parsed.soundEffects === 'boolean'
                ? parsed.soundEffects
                : DEFAULT_AUDIO_SETTINGS.soundEffects,

            music:
              typeof parsed.music === 'boolean'
                ? parsed.music
                : DEFAULT_AUDIO_SETTINGS.music,

            musicVolume:
              Number.isFinite(parsed.musicVolume)
                ? Math.max(
                    0,
                    Math.min(100, parsed.musicVolume)
                  )
                : DEFAULT_AUDIO_SETTINGS.musicVolume,

            soundEffectsVolume:
              Number.isFinite(parsed.soundEffectsVolume)
                ? Math.max(
                    0,
                    Math.min(100, parsed.soundEffectsVolume)
                  )
                : DEFAULT_AUDIO_SETTINGS.soundEffectsVolume,

            towerDefenseGuide:
              typeof parsed.towerDefenseGuide === 'boolean'
                ? parsed.towerDefenseGuide
                : DEFAULT_AUDIO_SETTINGS.towerDefenseGuide,

            towerDefenseGuidePrompted:
              typeof parsed.towerDefenseGuidePrompted === 'boolean'
                ? parsed.towerDefenseGuidePrompted
                : DEFAULT_AUDIO_SETTINGS.towerDefenseGuidePrompted,

            pianoManGuide:
              typeof parsed.pianoManGuide === 'boolean'
                ? parsed.pianoManGuide
                : DEFAULT_AUDIO_SETTINGS.pianoManGuide,

            pianoManGuidePrompted:
              typeof parsed.pianoManGuidePrompted === 'boolean'
                ? parsed.pianoManGuidePrompted
                : DEFAULT_AUDIO_SETTINGS.pianoManGuidePrompted,
          });
        }
      } catch (error) {
        console.warn('Could not load audio settings:', error);
      } finally {
        if (active) {
          setAudioSettingsLoaded(true);
        }
      }
    };

    loadAudioSettings();

    return () => {
      active = false;
    };
  }, []);

  // Persist audio settings.
  useEffect(() => {
    if (!audioSettingsLoaded) {
      return;
    }

    AsyncStorage.setItem(
      AUDIO_SETTINGS_KEY,
      JSON.stringify(audioSettings)
    ).catch((error) => {
      console.warn('Could not save audio settings:', error);
    });
  }, [audioSettings, audioSettingsLoaded]);

  // Firebase authentication state.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (authenticatedUser) => {
        setUser(authenticatedUser);

        if (authenticatedUser) {
          flushPendingGameResults().catch((error) => {
            console.error(
              'Could not save pending game results:',
              error
            );
          });
        }

        setAuthReady(true);
      }
    );

    return unsubscribe;
  }, []);

  // Apply the configured background music volume.
  useEffect(() => {
    const volume = Number(audioSettings.musicVolume);
    const safeVolume = Number.isFinite(volume)
      ? Math.max(0, Math.min(100, volume)) / 100
      : DEFAULT_AUDIO_SETTINGS.musicVolume / 100;

    backgroundMusicPlayer.loop = true;
    backgroundMusicPlayer.volume = safeVolume;
  }, [
    backgroundMusicPlayer,
    audioSettings.musicVolume,
  ]);

  // Play or pause background music according to settings and screen.
  useEffect(() => {
    if (!audioSettings.music || SILENT_SCREENS.includes(displayScreen)) {
      backgroundMusicPlayer.pause();
      return;
    }

    try {
      backgroundMusicPlayer.play();
    } catch (error) {
      console.warn('Background music failed:', error);
    }
  }, [
    backgroundMusicPlayer,
    audioSettings.music,
    displayScreen,
  ]);

  const updateAudioSettings = useCallback((updates) => {
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      console.warn('Audio settings update must be an object.');
      return;
    }

    setAudioSettings((previous) => ({
      ...previous,
      ...updates,
    }));
  }, []);

  const renderScreen = () => {
    const commonProps = {
      onNavigate: navigate,
      navigate,
      user,
      audioSettings,
      onAudioSettingsChange: updateAudioSettings,
      playButtonSound,
    };

    switch (displayScreen) {
      case 'splash':
        return (
          <SplashScreen
            onNavigate={navigate}
            onStart={() => navigate('mainmenu')}
          />
        );

      case 'login':
        return <Login {...commonProps} />;

      case 'signup':
        return <Signup {...commonProps} />;

      case 'mainmenu':
        return <MainMenu {...commonProps} />;

      case 'playmenu':
        return <PlayMenu {...commonProps} />;

      case 'settings':
        return <Settings {...commonProps} />;

      case 'minigame':
        return <Minigame {...commonProps} />;

      case 'goal':
        return <Goal {...commonProps} />;

      case 'stats':
        return <Stats {...commonProps} />;

      case 'profile':
        return <Profile {...commonProps} />;

      case 'musiclesson':
        return <MusicLesson {...commonProps} />;

      case 'pianoman':
        return <PianoMan {...commonProps} />;

      case 'towerdefense':
        return <TowerDefense {...commonProps} />;

      default:
        return <MainMenu {...commonProps} />;
    }
  };

  if (!authReady || !audioSettingsLoaded) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#080914',
          }}
        >
          <StatusBar style="light" translucent backgroundColor="transparent" />
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#080914' }}>
        <StatusBar style="light" translucent backgroundColor="transparent" />

        <Animated.View
          style={animatedScreenStyle}
          pointerEvents={transitioning.current ? 'none' : 'auto'}
        >
          {renderScreen()}
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[
            animatedTransitionStyle,
            { backgroundColor: '#080914' },
          ]}
        />
      </View>
    </SafeAreaProvider>
  );
}
