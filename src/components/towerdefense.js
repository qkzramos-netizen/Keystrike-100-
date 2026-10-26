import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, Image, Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTowerDefenseHighScore, recordGameResult, recordGuestGameResult } from '../achievements';
import { auth } from '../firebase';
import AccountSavePrompt from './AccountSavePrompt';
import Keyboard from './Keyboard';
import { AppButton, COLORS, styles } from './native';
import TowerDefenseBackground, {
  BattlefieldGround,
  PianomanDestination,
} from './TowerDefenseBackground';

const NOTES = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'E#', 'Fb', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'B#', 'Cb'];
const NOTE_PITCH = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, 'E#': 5, Fb: 4,
  F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10,
  B: 11, 'B#': 0, Cb: 11,
};
const KEYBOARD_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MONSTERS = [
  require('../../public/monsters/m1.png'),
  require('../../public/monsters/m2.png'),
  require('../../public/monsters/m3.png'),
  require('../../public/monsters/m4.png'),
  require('../../public/monsters/m5.png'),
];
const POOFS = [
  require('../../public/assets/poof1.gif'),
  require('../../public/assets/poof2.gif'),
  require('../../public/assets/poof3.gif'),
];
const IMPACT_PARTICLE = require('../../public/background/processed/magic_particle.png');
const TD_AUDIO = {
  backgroundMusic: require('../../public/assets/audio/td_background_music.mp3'),
  correctNote: require('../../public/assets/audio/td_correct_note.mp3'),
  wrongNote: require('../../public/assets/audio/td_wrong_note.mp3'),
  monsterDefeat: require('../../public/assets/audio/td_monster_defeat.mp3'),
  monsterLeak: require('../../public/assets/audio/td_monster_leak.mp3'),
  waveStart: require('../../public/assets/audio/td_wave_start.mp3'),
  waveComplete: require('../../public/assets/audio/td_wave_complete.mp3'),
  gameOver: require('../../public/assets/audio/td_game_over.mp3'),
  buttonClick: require('../../public/assets/audio/td_button_click.mp3'),
  combo: require('../../public/assets/audio/td_combo.mp3'),
};

const IMG_C = require('../../public/tdnotes/C4.png');
const IMG_CS = require('../../public/tdnotes/C#.png');
const IMG_D = require('../../public/tdnotes/D4.png');
const IMG_DS = require('../../public/tdnotes/D#.png');
const IMG_E = require('../../public/tdnotes/E4.png');
const IMG_F = require('../../public/tdnotes/F4.png');
const IMG_FS = require('../../public/tdnotes/F#.png');
const IMG_G = require('../../public/tdnotes/G4.png');
const IMG_GS = require('../../public/tdnotes/G#.png');
const IMG_A = require('../../public/tdnotes/A1.png');
const IMG_AS = require('../../public/tdnotes/A#.png');
const IMG_B = require('../../public/tdnotes/B.png');

const NOTE_IMAGES = {
  C: IMG_C,
  'C#': IMG_CS,
  Db: IMG_CS,
  D: IMG_D,
  'D#': IMG_DS,
  Eb: IMG_DS,
  E: IMG_E,
  'E#': IMG_F,
  Fb: IMG_E,
  F: IMG_F,
  'F#': IMG_FS,
  Gb: IMG_FS,
  G: IMG_G,
  'G#': IMG_GS,
  Ab: IMG_GS,
  A: IMG_A,
  'A#': IMG_AS,
  Bb: IMG_AS,
  B: IMG_B,
  'B#': IMG_C,
  Cb: IMG_B,
};
const WARNED_UNMAPPED_NOTES = new Set();

function getNoteImage(note) {
  const image = NOTE_IMAGES[note];
  if (image) {
    if (Platform.OS === 'web' && typeof image.uri === 'string' && image.uri.includes('#')) {
      return { ...image, uri: image.uri.replace(/#/g, '%23') };
    }
    return image;
  }

  if (__DEV__ && !WARNED_UNMAPPED_NOTES.has(note)) {
    console.error(`Tower Defense has no note image mapped for "${note}".`);
    WARNED_UNMAPPED_NOTES.add(note);
  }

  return IMG_C;
}

const MAX_HP = 100;
const MONSTER_HP = 100;
const DAMAGE_PER_HIT = 100;
const SPAWN_DELAY = 1500;
const MIN_SPAWN_DELAY = 1200;
const MAX_WAVE_SIZE = 10;
const TRAVEL_DURATION = 6500;
const PROJECTILE_DURATION = 280;
const POOF_DURATION = 900;

function makeWave(tier) {
  return Array.from({ length: Math.min(4 + tier, MAX_WAVE_SIZE) }, (_, index) => ({
    id: `${tier}-${index}-${Date.now()}`,
    note: NOTES[Math.floor(Math.random() * NOTES.length)],
    monster: ((index + tier - 1) % MONSTERS.length),
    hp: MONSTER_HP,
  }));
}

function getSpawnDelay(tier) {
  return Math.max(MIN_SPAWN_DELAY, SPAWN_DELAY - (tier - 1) * 50);
}

const AnimatedStat = React.memo(function AnimatedStat({ value, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const previousValue = useRef(value);

  useEffect(() => {
    if (previousValue.current === value) return undefined;
    previousValue.current = value;
    scale.setValue(0.92);
    const animation = Animated.spring(scale, {
      toValue: 1,
      damping: 8,
      stiffness: 190,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [scale, value]);

  return (
    <Animated.Text style={[style, { transform: [{ scale }] }]}>
      {value}
    </Animated.Text>
  );
});

function gameReducer(state, action) {
  switch (action.type) {
    case 'spawn':
      if (!state.queue.length || state.hp <= 0 || state.paused) return state;
      return {
        ...state,
        queue: state.queue.slice(1),
        mobs: [...state.mobs, state.queue[0]],
      };
    case 'projectile-launch':
      if (state.paused || state.hp <= 0 || !state.mobs.some((mob) => mob.id === action.id && !mob.defeated && !mob.leaking)) return state;
      return {
        ...state,
        mobs: state.mobs.map((mob) => mob.id === action.id ? { ...mob, pendingHit: true } : mob),
      };
    case 'projectile-cancel':
      return {
        ...state,
        mobs: state.mobs.map((mob) => mob.id === action.id ? { ...mob, pendingHit: false } : mob),
      };
    case 'hit':
      if (state.paused || state.hp <= 0 || !state.mobs.some((mob) => mob.id === action.id && !mob.defeated && !mob.leaking && mob.pendingHit)) return state;
      return {
        ...state,
        mobs: state.mobs.map((mob) => mob.id === action.id
          ? {
            ...mob,
            pendingHit: false,
            hp: Math.max(0, mob.hp - action.damage),
            defeated: mob.hp - action.damage <= 0,
            poof: mob.hp - action.damage <= 0 ? action.poof : mob.poof,
          }
          : mob),
        score: state.score + 100,
        combo: state.combo + 1,
      };
    case 'clear-hit':
      return { ...state, mobs: state.mobs.filter((mob) => mob.id !== action.id) };
    case 'press':
      if (state.paused || state.hp <= 0) return state;
      return { ...state, notesPressed: state.notesPressed + 1 };
    case 'miss':
      if (state.paused || state.hp <= 0) return state;
      return { ...state, combo: 0 };
    case 'leak':
      if (state.paused || state.hp <= 0 || !state.mobs.some((mob) => mob.id === action.id && !mob.defeated && !mob.leaking && !mob.pendingHit)) return state;
      return {
        ...state,
        hp: Math.max(0, state.hp - 10),
        combo: 0,
        mobs: state.mobs.map((mob) => mob.id === action.id ? { ...mob, leaking: true } : mob),
      };
    case 'next-wave':
      if (state.paused || state.hp <= 0 || state.queue.length || state.mobs.length) return state;
      return { ...state, tier: state.tier + 1, queue: makeWave(state.tier + 1) };
    case 'toggle-pause':
      if (state.hp <= 0) return state;
      return { ...state, paused: !state.paused };
    case 'restart':
      return {
        tier: 1,
        hp: MAX_HP,
        queue: makeWave(1),
        mobs: [],
        paused: false,
        score: 0,
        combo: 0,
        notesPressed: 0,
      };
    default:
      return state;
  }
}

const TravelingMonster = React.memo(function TravelingMonster({ mob, monsterSize, noteSize, renderOrder, fieldWidth, laneTop, paused, registerMonsterRef, onReachTower, onLeakAnimationComplete }) {
  const progress = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(0);
  const reachedTower = useRef(false);
  const defeatScale = useRef(new Animated.Value(0.72)).current;
  const defeatOpacity = useRef(new Animated.Value(0.7)).current;
  const impactProgress = useRef(new Animated.Value(0)).current;
  const walkProgress = useRef(new Animated.Value(0)).current;
  const pianomanWidth = monsterSize * 1.2;
  const startLeft = -monsterSize;
  const destinationLeft = fieldWidth - pianomanWidth - monsterSize;
  const travelDistance = Math.max(0, destinationLeft - startLeft);
  const noteImage = getNoteImage(mob.note);
  const movementStyle = {
    transform: [{
      translateX: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, travelDistance],
      }),
    }],
  };

  useEffect(() => {
    if (paused || mob.defeated || mob.leaking) {
      progress.stopAnimation((value) => {
        progressValue.current = value;
      });
      return undefined;
    }

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: Math.max(0, (1 - progressValue.current) * TRAVEL_DURATION),
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) {
        progressValue.current = 1;
        if (!reachedTower.current) {
          reachedTower.current = true;
          onReachTower(mob.id);
        }
      }
    });

    return () => {
      animation.stop();
      progress.stopAnimation((value) => {
        progressValue.current = value;
      });
    };
  }, [mob.defeated, mob.id, mob.leaking, onReachTower, paused, progress]);

  useEffect(() => {
    if (paused || mob.defeated || mob.leaking) return undefined;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(walkProgress, {
        toValue: 1,
        duration: 360,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(walkProgress, {
        toValue: 0,
        duration: 360,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [mob.defeated, mob.leaking, paused, walkProgress]);

  useEffect(() => {
    if (!mob.leaking || paused) return undefined;

    const animation = Animated.sequence([
      Animated.delay(90),
      Animated.timing(impactProgress, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished) onLeakAnimationComplete(mob.id);
    });
    return () => animation.stop();
  }, [impactProgress, mob.id, mob.leaking, onLeakAnimationComplete, paused]);

  useEffect(() => {
    if (!mob.defeated) return undefined;

    const animation = Animated.parallel([
      Animated.sequence([
        Animated.timing(defeatScale, {
          toValue: 1.12,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(defeatScale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(defeatOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [defeatOpacity, defeatScale, mob.defeated]);

  return (
    <Animated.View style={[movementStyle, {
      position: 'absolute',
      left: startLeft,
      top: laneTop,
      width: monsterSize,
      height: monsterSize,
      alignItems: 'center',
      zIndex: renderOrder,
      elevation: renderOrder,
    }]}>
      {mob.defeated ? (
        <Animated.Image
          source={POOFS[mob.poof]}
          resizeMode="contain"
          style={{
            width: monsterSize,
            height: monsterSize,
            opacity: defeatOpacity,
            transform: [{ scale: defeatScale }],
          }}
        />
      ) : (
        <>
          {mob.leaking && (
            <>
              <Animated.View
                style={{
                  position: 'absolute',
                  top: monsterSize * 0.2,
                  left: monsterSize * 0.2,
                  width: monsterSize * 0.6,
                  height: monsterSize * 0.6,
                  borderRadius: monsterSize,
                  backgroundColor: '#ffe89b',
                  opacity: impactProgress.interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 0.8, 0.45, 0] }),
                  transform: [{ scale: impactProgress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.4, 1.35, 1.8] }) }],
                }}
              />
              {[0, 1, 2, 3].map((index) => (
                <Animated.Image
                  key={`impact-particle-${index}`}
                  source={IMPACT_PARTICLE}
                  resizeMode="contain"
                  style={{
                    position: 'absolute',
                    left: monsterSize * (index % 2 ? 0.3 : 0.55),
                    top: monsterSize * (index < 2 ? 0.2 : 0.55),
                    width: 16,
                    height: 16,
                    opacity: impactProgress.interpolate({ inputRange: [0, 0.2, 0.65, 1], outputRange: [0, 0.95, 0.6, 0] }),
                    transform: [{
                      translateX: impactProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, index % 2 ? 24 : -24],
                      }),
                    }, {
                      translateY: impactProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, index < 2 ? -26 : 26],
                      }),
                    }],
                  }}
                />
              ))}
            </>
          )}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: (monsterSize - noteSize) / 2,
              bottom: monsterSize + 8,
              width: noteSize,
              height: noteSize * 0.72,
              zIndex: 2,
              elevation: 2,
            }}
          >
            <Image
              source={noteImage}
              resizeMode="contain"
              blurRadius={7}
              style={{
                position: 'absolute',
                left: 2,
                top: 1,
                width: noteSize,
                height: noteSize * 0.72,
                tintColor: '#000',
                opacity: 0.5,
              }}
            />
            <Image
              source={noteImage}
              resizeMode="contain"
              style={{ width: noteSize, height: noteSize * 0.72 }}
              accessibilityLabel={`${mob.note} note`}
            />
          </View>
          <Animated.Image
            ref={(node) => registerMonsterRef(mob.id, node)}
            source={MONSTERS[mob.monster]}
            resizeMode="contain"
            style={{
              width: monsterSize,
              height: monsterSize,
              opacity: mob.leaking ? impactProgress.interpolate({ inputRange: [0, 0.55, 0.72, 1], outputRange: [1, 1, 0.55, 0] }) : 1,
              transform: [{
                scale: mob.leaking
                  ? impactProgress.interpolate({ inputRange: [0, 0.2, 0.52, 1], outputRange: [1, 0.88, 1.16, 0] })
                  : 1,
              }, {
                translateY: mob.leaking
                  ? 0
                  : walkProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }),
              }, {
                rotate: mob.leaking
                  ? '0deg'
                  : walkProgress.interpolate({ inputRange: [0, 1], outputRange: ['-1deg', '1deg'] }),
              }],
            }}
          />
        </>
      )}
    </Animated.View>
  );
});

const NoteProjectile = React.memo(function NoteProjectile({ projectile, paused, onImpact }) {
  const progress = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(0);
  const completed = useRef(false);

  useEffect(() => {
    if (paused || completed.current) {
      progress.stopAnimation((value) => {
        progressValue.current = value;
      });
      return undefined;
    }

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: Math.max(0, (1 - progressValue.current) * PROJECTILE_DURATION),
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !completed.current) {
        completed.current = true;
        onImpact(projectile);
      }
    });

    return () => {
      animation.stop();
      progress.stopAnimation((value) => {
        progressValue.current = value;
      });
    };
  }, [onImpact, paused, progress, projectile]);

  const arcHeight = Math.min(36, Math.abs(projectile.target.y - projectile.source.y) * 0.12 + 18);
  const style = {
    opacity: progress.interpolate({
      inputRange: [0, 0.12, 0.88, 1],
      outputRange: [0.65, 1, 1, 0.8],
    }),
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [projectile.source.x - 12, projectile.target.x - 12],
        }),
      },
      {
        translateY: progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [
            projectile.source.y - 12,
            (projectile.source.y + projectile.target.y) / 2 - arcHeight - 12,
            projectile.target.y - 12,
          ],
        }),
      },
    ],
  };

  return (
    <Animated.Text
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          color: COLORS.primary,
          fontSize: 27,
          fontWeight: '800',
          textShadowColor: '#fff4b0',
          textShadowRadius: 7,
        },
        style,
      ]}
    >
      ♪
    </Animated.Text>
  );
});

const FloatingDamage = React.memo(function FloatingDamage({ indicator, onDone }) {
  const progress = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(progress, {
        toValue: 1,
        duration: 760,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.12,
          damping: 10,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
    ]);
    animation.start(({ finished }) => {
      if (finished) onDone(indicator.id);
    });
    return () => animation.stop();
  }, [indicator.id, onDone, progress, scale]);

  return (
    <Animated.Text
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: indicator.x - 22,
        top: indicator.y - 12,
        color: COLORS.primary,
        fontFamily: 'Georgia',
        fontSize: 18,
        fontWeight: '700',
        textShadowColor: '#071136',
        textShadowRadius: 4,
        opacity: progress.interpolate({
          inputRange: [0, 0.12, 0.7, 1],
          outputRange: [0, 1, 1, 0],
        }),
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -38],
            }),
          },
          { scale },
        ],
      }}
    >
      -{indicator.damage}
    </Animated.Text>
  );
});

const initialGame = {
  tier: 1,
  hp: MAX_HP,
  queue: makeWave(1),
  mobs: [],
  paused: false,
  score: 0,
  combo: 0,
  notesPressed: 0,
};

function TowerDefense({ onNavigate, audioSettings, onAudioSettingsChange }) {
  const { width, height } = useWindowDimensions();
  const backgroundMusicPlayer = useAudioPlayer(TD_AUDIO.backgroundMusic);
  const correctNotePlayer = useAudioPlayer(TD_AUDIO.correctNote);
  const wrongNotePlayer = useAudioPlayer(TD_AUDIO.wrongNote);
  const monsterDefeatPlayer = useAudioPlayer(TD_AUDIO.monsterDefeat);
  const monsterLeakPlayer = useAudioPlayer(TD_AUDIO.monsterLeak);
  const waveStartPlayer = useAudioPlayer(TD_AUDIO.waveStart);
  const waveCompletePlayer = useAudioPlayer(TD_AUDIO.waveComplete);
  const gameOverPlayer = useAudioPlayer(TD_AUDIO.gameOver);
  const buttonClickPlayer = useAudioPlayer(TD_AUDIO.buttonClick);
  const comboPlayer = useAudioPlayer(TD_AUDIO.combo);
  const [game, dispatch] = useReducer(gameReducer, initialGame);
  const [saveStatus, setSaveStatus] = useState('');
  const [savePromptResult, setSavePromptResult] = useState(null);
  const [personalBest, setPersonalBest] = useState(null);
  const [personalBestError, setPersonalBestError] = useState('');
  const [highlightedNote, setHighlightedNote] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [projectiles, setProjectiles] = useState([]);
  const [damageIndicators, setDamageIndicators] = useState([]);
  const [battlefieldSize, setBattlefieldSize] = useState({ width: 0, height: 0 });
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const feedbackScale = useRef(new Animated.Value(0.85)).current;
  const hpProgress = useRef(new Animated.Value(MAX_HP)).current;
  const scoreSaveStarted = useRef(false);
  const gameAreaRef = useRef(null);
  const battlefieldLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const monsterRefs = useRef(new Map());
  const pendingHitTargets = useRef(new Map());
  const reachedTowerTargets = useRef(new Set());
  const leakedMonsterIds = useRef(new Set());
  const hitClearTimers = useRef(new Map());
  const highlightTimer = useRef(null);
  const projectileSequence = useRef(0);
  const damageSequence = useRef(0);
  const audioSettingsRef = useRef(audioSettings);
  const audioMounted = useRef(false);
  const soundPlaySequence = useRef(new WeakMap());
  const previousTier = useRef(game.tier);
  const completedWaveTier = useRef(0);
  const gameRef = useRef(game);
  audioSettingsRef.current = audioSettings;
  gameRef.current = game;
  const defeated = game.hp <= 0;
  const keyboardHeight = Math.max(88, Math.min(140, height * 0.18));
  const sharpHeight = keyboardHeight * 0.62;
  const verticalPadding = Math.min(12, Math.max(4, height * 0.015));
  const monsterSize = Math.min(104, Math.max(72, width * 0.2));
  const fieldHeight = battlefieldSize.height || Math.max(180, height * 0.45);
  const laneTop = Math.max(0, Math.min(fieldHeight - monsterSize, fieldHeight * 0.86 - monsterSize));
  const noteSize = Math.round(Math.min(104, Math.max(102, width * 3.15)) * 1.75);
  const soundEffectsVolume = Math.max(0, Math.min(100, audioSettings?.soundEffectsVolume ?? 100));
  const soundEnabled = audioSettings?.soundEffects !== false && soundEffectsVolume > 0;
  const musicVolume = Math.max(0, Math.min(100, audioSettings?.musicVolume ?? 100));
  const musicEnabled = audioSettings?.music !== false && musicVolume > 0;
  const guideEnabled = audioSettings?.towerDefenseGuide !== false;
  const fieldWidth = battlefieldSize.width || Math.min(width, 430) - 24;
  const currentTarget = game.mobs.find((mob) => !mob.defeated && !mob.leaking);
  const keyboardTarget = currentTarget
    ? KEYBOARD_NOTES[NOTE_PITCH[currentTarget.note]]
    : undefined;

  useEffect(() => {
    const animation = Animated.timing(hpProgress, {
      toValue: game.hp,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [game.hp, hpProgress]);

  useEffect(() => {
    let active = true;
    getTowerDefenseHighScore()
      .then((highScore) => {
        if (active) setPersonalBest(highScore);
      })
      .catch((error) => {
        if (active) setPersonalBestError(error.message || 'Could not load the personal best.');
      });

    return () => {
      active = false;
    };
  }, []);

  const playSound = useCallback((player) => {
    const settings = audioSettingsRef.current;
    const volume = Math.max(0, Math.min(100, settings?.soundEffectsVolume ?? 100)) / 100;
    if (!audioMounted.current || settings?.soundEffects === false || volume === 0) return;

    const sequence = (soundPlaySequence.current.get(player) ?? 0) + 1;
    soundPlaySequence.current.set(player, sequence);

    try {
      player.volume = volume;
      if (!player.playing && player.currentTime === 0) {
        player.play();
        return;
      }
      player.pause();
      player.seekTo(0).then(() => {
        if (audioMounted.current && soundPlaySequence.current.get(player) === sequence) {
          player.play();
        }
      }).catch((error) => {
        console.warn('Tower Defense sound playback failed:', error);
      });
    } catch (error) {
      console.warn('Tower Defense sound playback failed:', error);
    }
  }, []);

  useEffect(() => {
    audioMounted.current = true;
    return () => {
      audioMounted.current = false;
      [
        backgroundMusicPlayer,
        correctNotePlayer,
        wrongNotePlayer,
        monsterDefeatPlayer,
        monsterLeakPlayer,
        waveStartPlayer,
        waveCompletePlayer,
        gameOverPlayer,
        buttonClickPlayer,
        comboPlayer,
      ].forEach((player) => {
        soundPlaySequence.current.set(player, (soundPlaySequence.current.get(player) ?? 0) + 1);
      });
    };
  }, [
    backgroundMusicPlayer,
    correctNotePlayer,
    wrongNotePlayer,
    monsterDefeatPlayer,
    monsterLeakPlayer,
    waveStartPlayer,
    waveCompletePlayer,
    gameOverPlayer,
    buttonClickPlayer,
    comboPlayer,
  ]);

  useEffect(() => {
    backgroundMusicPlayer.loop = true;
    backgroundMusicPlayer.volume = musicVolume / 100;
    if (musicEnabled && !game.paused && !defeated) {
      try {
        backgroundMusicPlayer.play();
      } catch (error) {
        console.warn('Tower Defense background music failed:', error);
      }
    } else {
      backgroundMusicPlayer.pause();
    }
  }, [backgroundMusicPlayer, musicEnabled, musicVolume, game.paused, defeated]);

  useEffect(() => {
    playSound(waveStartPlayer);
  }, [playSound, waveStartPlayer]);

  useEffect(() => {
    if (game.tier !== previousTier.current) {
      previousTier.current = game.tier;
      playSound(waveStartPlayer);
    }
  }, [game.tier, playSound, waveStartPlayer]);

  useEffect(() => {
    if (!defeated && !game.queue.length && !game.mobs.length && completedWaveTier.current !== game.tier) {
      completedWaveTier.current = game.tier;
      playSound(waveCompletePlayer);
    }
  }, [defeated, game.queue.length, game.mobs.length, game.tier, playSound, waveCompletePlayer]);

  useEffect(() => {
    if (defeated) playSound(gameOverPlayer);
  }, [defeated, gameOverPlayer, playSound]);

  useEffect(() => {
    if (game.combo > 0 && game.combo % 5 === 0) playSound(comboPlayer);
  }, [game.combo, comboPlayer, playSound]);

  const showFeedback = useCallback((message, success) => {
    feedbackOpacity.stopAnimation();
    feedbackScale.stopAnimation();
    feedbackOpacity.setValue(0);
    feedbackScale.setValue(0.85);
    setFeedback({ message, success });

    Animated.parallel([
      Animated.sequence([
        Animated.timing(feedbackOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.delay(350),
        Animated.timing(feedbackOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(feedbackScale, {
        toValue: 1,
        damping: 12,
        stiffness: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setFeedback(null);
    });
  }, [feedbackOpacity, feedbackScale]);

  useEffect(() => () => {
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    hitClearTimers.current.forEach((timer) => clearTimeout(timer));
    hitClearTimers.current.clear();
    feedbackOpacity.stopAnimation();
    feedbackScale.stopAnimation();
  }, [feedbackOpacity, feedbackScale]);

  const registerMonsterRef = useCallback((id, node) => {
    if (node) monsterRefs.current.set(id, node);
    else monsterRefs.current.delete(id);
  }, []);

  const removeDamageIndicator = useCallback((id) => {
    setDamageIndicators((current) => current.filter((indicator) => indicator.id !== id));
  }, []);

  const handleMonsterReachedTower = useCallback((id) => {
    reachedTowerTargets.current.add(id);
    const latestGame = gameRef.current;
    const mob = latestGame.mobs.find((item) => item.id === id);
    if (latestGame.paused || latestGame.hp <= 0 || !mob || mob.defeated || mob.leaking) return;
    if (mob.pendingHit || pendingHitTargets.current.has(id)) return;
    if (leakedMonsterIds.current.has(id)) return;

    leakedMonsterIds.current.add(id);
    reachedTowerTargets.current.delete(id);
    playSound(monsterLeakPlayer);
    dispatch({ type: 'leak', id });

    const layout = battlefieldLayout.current;
    const monsterSize = Math.min(104, Math.max(72, width * 0.2));
    const pianomanWidth = monsterSize * 0.95 * (512 / 405);
    setDamageIndicators((current) => [
      ...current.slice(-4),
      {
        id: `castle-damage-${++damageSequence.current}`,
        damage: 10,
        x: layout.x + layout.width - pianomanWidth,
        y: layout.y + layout.height * 0.86 - monsterSize / 2,
      },
    ]);
  }, [playSound, monsterLeakPlayer, width]);

  const handleLeakAnimationComplete = useCallback((id) => {
    const timer = hitClearTimers.current.get(id);
    if (timer) clearTimeout(timer);
    hitClearTimers.current.delete(id);
    pendingHitTargets.current.delete(id);
    reachedTowerTargets.current.delete(id);
    leakedMonsterIds.current.delete(id);
    dispatch({ type: 'clear-hit', id });
  }, []);

  const handleProjectileImpact = useCallback((projectile) => {
    setProjectiles((current) => current.filter((item) => item.id !== projectile.id));
    if (pendingHitTargets.current.get(projectile.targetId) !== projectile.id) return;

    const latestGame = gameRef.current;
    const target = latestGame.mobs.find((mob) => mob.id === projectile.targetId && !mob.defeated && !mob.leaking);
    if (latestGame.paused || latestGame.hp <= 0 || !target) {
      pendingHitTargets.current.delete(projectile.targetId);
      dispatch({ type: 'projectile-cancel', id: projectile.targetId });
      return;
    }

    const damage = Math.min(target.hp ?? MONSTER_HP, DAMAGE_PER_HIT);
    if (damage <= 0) {
      pendingHitTargets.current.delete(projectile.targetId);
      dispatch({ type: 'projectile-cancel', id: projectile.targetId });
      return;
    }

    dispatch({
      type: 'hit',
      id: target.id,
      damage,
      poof: Math.floor(Math.random() * POOFS.length),
    });
    if (target.hp - damage <= 0) playSound(monsterDefeatPlayer);
    setDamageIndicators((current) => [
      ...current.slice(-4),
      {
        id: `damage-${++damageSequence.current}`,
        damage,
        x: projectile.target.x,
        y: projectile.target.y,
      },
    ]);
    const existingTimer = hitClearTimers.current.get(target.id);
    if (existingTimer) clearTimeout(existingTimer);
    hitClearTimers.current.set(target.id, setTimeout(() => {
      hitClearTimers.current.delete(target.id);
      dispatch({ type: 'clear-hit', id: target.id });
    }, POOF_DURATION));
  }, [playSound, monsterDefeatPlayer]);

  const launchProjectile = useCallback((launch, sourcePosition) => {
    if (pendingHitTargets.current.get(launch.targetId) !== launch.id) return;

    const fallbackToImmediateHit = () => handleProjectileImpact(launch);
    const targetRef = monsterRefs.current.get(launch.targetId);
    const gameArea = gameAreaRef.current;
    if (!sourcePosition || !targetRef || !gameArea
      || typeof gameArea.measureInWindow !== 'function'
      || typeof targetRef.measureInWindow !== 'function') {
      fallbackToImmediateHit();
      return;
    }

    gameArea.measureInWindow((areaX, areaY) => {
      targetRef.measureInWindow((targetX, targetY, targetWidth, targetHeight) => {
        if (![areaX, areaY, targetX, targetY, targetWidth, targetHeight].every(Number.isFinite)) {
          fallbackToImmediateHit();
          return;
        }
        const latestGame = gameRef.current;
        const targetStillActive = latestGame.mobs.some(
          (mob) => mob.id === launch.targetId && !mob.defeated && !mob.leaking
        );
        if (latestGame.paused || latestGame.hp <= 0 || !targetStillActive) {
          pendingHitTargets.current.delete(launch.targetId);
          dispatch({ type: 'projectile-cancel', id: launch.targetId });
          return;
        }

        const source = {
          x: sourcePosition.x - areaX,
          y: sourcePosition.y - areaY,
        };
        const target = {
          x: targetX + targetWidth / 2 - areaX,
          y: targetY + targetHeight / 2 - areaY,
        };
        setProjectiles((current) => [
          ...current.slice(-3),
          { ...launch, source, target },
        ]);
      });
    });
  }, [handleProjectileImpact]);

  useEffect(() => {
    pendingHitTargets.current.forEach((_, id) => {
      const mob = game.mobs.find((item) => item.id === id);
      if (!mob || mob.defeated) {
        pendingHitTargets.current.delete(id);
        reachedTowerTargets.current.delete(id);
        leakedMonsterIds.current.delete(id);
      } else if (!mob.pendingHit) {
        pendingHitTargets.current.delete(id);
        if (reachedTowerTargets.current.has(id)) handleMonsterReachedTower(id);
      }
    });
    leakedMonsterIds.current.forEach((id) => {
      if (!game.mobs.some((mob) => mob.id === id)) leakedMonsterIds.current.delete(id);
    });
    reachedTowerTargets.current.forEach((id) => {
      const mob = game.mobs.find((item) => item.id === id);
      if (!mob || mob.defeated) reachedTowerTargets.current.delete(id);
    });
    if (!game.paused) {
      reachedTowerTargets.current.forEach((id) => {
        const mob = game.mobs.find((item) => item.id === id);
        if (mob && !mob.pendingHit && !mob.defeated) handleMonsterReachedTower(id);
      });
    }
  }, [game.mobs, game.paused, handleMonsterReachedTower]);

  useEffect(() => {
    if (!game.queue.length || defeated || game.paused) return undefined;
    const timer = setTimeout(() => dispatch({ type: 'spawn' }), getSpawnDelay(game.tier));
    return () => clearTimeout(timer);
  }, [game.queue.length, game.tier, defeated, game.paused]);

  useEffect(() => {
    if (game.queue.length || game.mobs.length || defeated || game.paused) return undefined;
    const timer = setTimeout(() => dispatch({ type: 'next-wave' }), 1800);
    return () => clearTimeout(timer);
  }, [game.queue.length, game.mobs.length, defeated, game.paused]);

  useEffect(() => {
    if (!defeated) {
      scoreSaveStarted.current = false;
      setSaveStatus('');
      return;
    }
    if (scoreSaveStarted.current) return;
    scoreSaveStarted.current = true;
    const result = { score: game.score, notesPressed: game.notesPressed, highestTier: game.tier };
    const saveResult = async () => {
      if (!auth.currentUser) {
        try {
          const guestResultId = await recordGuestGameResult('towerDefense', result);
          setPersonalBest((best) => Math.max(best ?? 0, result.score));
          setSavePromptResult({ ...result, guestResultId });
        } catch (saveError) {
          setSaveStatus(saveError.message || 'Score could not be saved locally.');
        }
        return;
      }
      setSaveStatus('Saving score...');
      try {
        await recordGameResult('towerDefense', result);
        setPersonalBest((best) => Math.max(best ?? 0, result.score));
        setSaveStatus('Score saved to your account.');
      } catch (saveError) {
        setSaveStatus(saveError.message || 'Score could not be saved.');
      }
    };
    saveResult();
  }, [defeated, game.notesPressed, game.score, game.tier]);

  // Stable callback (reads latest state via ref) so memoized piano keys don't re-render every 50ms tick.
  const playNote = useCallback((note) => {
    const g = gameRef.current;
    if (g.paused || g.hp <= 0) return null;
    setHighlightedNote(note);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => {
      highlightTimer.current = null;
      setHighlightedNote(null);
    }, 150);
    dispatch({ type: 'press' });
    const target = g.mobs.find((mob) => !mob.defeated);
    if (!target) return null;
    if (NOTE_PITCH[target.note] === NOTE_PITCH[note]) {
      playSound(correctNotePlayer);
      if (pendingHitTargets.current.has(target.id)) return null;
      const launch = {
        id: `projectile-${++projectileSequence.current}`,
        targetId: target.id,
        note,
      };
      pendingHitTargets.current.set(target.id, launch.id);
      dispatch({ type: 'projectile-launch', id: target.id });
      return launch;
    } else {
      playSound(wrongNotePlayer);
      showFeedback('Miss!', false);
      dispatch({ type: 'miss' });
    }
    return null;
  }, [correctNotePlayer, playSound, showFeedback, wrongNotePlayer]);

  const restart = () => {
    playSound(buttonClickPlayer);
    playSound(waveStartPlayer);
    scoreSaveStarted.current = false;
    setSavePromptResult(null);
    pendingHitTargets.current.clear();
    hitClearTimers.current.forEach((timer) => clearTimeout(timer));
    hitClearTimers.current.clear();
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = null;
    reachedTowerTargets.current.clear();
    leakedMonsterIds.current.clear();
    completedWaveTier.current = 0;
    previousTier.current = 1;
    setProjectiles([]);
    setDamageIndicators([]);
    dispatch({ type: 'restart' });
  };

  const togglePause = () => {
    playSound(buttonClickPlayer);
    gameRef.current = { ...gameRef.current, paused: !gameRef.current.paused };
    dispatch({ type: 'toggle-pause' });
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (gameRef.current.paused || gameRef.current.hp <= 0) {
        onNavigate('minigame');
      } else {
        togglePause();
      }
      return true;
    });
    return () => subscription.remove();
  }, [onNavigate]);

    return (
    <View
      style={{
        flex: 1,
        width: '100%',
        backgroundColor: '#070d27',
      }}
    >
      <TowerDefenseBackground paused={game.paused || defeated} />

      {
      }
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
      >
        <BattlefieldGround paused={game.paused || defeated} />
      </View>

      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, zIndex: 1 }}>
        <View ref={gameAreaRef} style={{ flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 12, paddingTop: verticalPadding, paddingBottom: verticalPadding, alignItems: 'center' }}>
          <View style={{ width: '100%', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1, height: 28, overflow: 'hidden', borderWidth: 2, borderColor: '#fff', borderRadius: 8, backgroundColor: 'rgba(4,15,44,0.94)' }}>
              <Animated.View style={{ width: hpProgress.interpolate({ inputRange: [0, MAX_HP], outputRange: ['0%', '100%'] }), height: '100%', backgroundColor: '#6be19b' }} />
              <Text style={{ position: 'absolute', top: 0, left: 0, right: 0, color: '#fff', textAlign: 'center', fontSize: 15, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 4 }}>
                CASTLE HP  {game.hp}/100
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={game.paused ? 'Resume game' : 'Pause game'}
              onPress={togglePause}
              disabled={defeated}
              style={({ pressed }) => ({
                minWidth: 76,
                height: 42,
                paddingHorizontal: 12,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: COLORS.primary,
                borderRadius: 9,
                backgroundColor: '#091849',
                opacity: defeated ? 0.5 : pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: COLORS.primary, fontFamily: 'Georgia', fontSize: 15, fontWeight: '800' }}>
                {game.paused ? 'Resume' : 'Pause'}
              </Text>
            </Pressable>
          </View>
          <View style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'stretch',
            marginTop: 3,
            marginBottom: 1,
            padding: 4,
            borderWidth: 1,
            borderColor: 'rgba(240,215,109,0.75)',
            borderRadius: 10,
            backgroundColor: 'rgba(4,15,44,0.9)',
          }}>
            <View style={{ flex: 0.8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
              <Text style={{ color: COLORS.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>WAVE</Text>
              <AnimatedStat value={game.tier} style={{ color: COLORS.text, fontSize: 17, fontWeight: '900', marginTop: 1 }} />
            </View>
            <View style={{ width: 1, marginVertical: 3, backgroundColor: 'rgba(255,255,255,0.22)' }} />
            <View style={{ flex: 1.1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
              <Text style={{ color: COLORS.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>MONSTERS</Text>
              <AnimatedStat
                value={`${game.mobs.length} field · ${game.queue.length} next`}
                style={{ color: COLORS.text, fontSize: 12, fontWeight: '800', marginTop: 2, textAlign: 'center' }}
              />
            </View>
            <View style={{ width: 1, marginVertical: 3, backgroundColor: 'rgba(255,255,255,0.22)' }} />
            <View style={{ flex: 1.1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
              <Text style={{ color: COLORS.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>SCORE / BEST</Text>
              <AnimatedStat
                value={`${game.score} / ${personalBest === null ? '—' : personalBest}`}
                style={{ color: COLORS.text, fontSize: 12, fontWeight: '900', marginTop: 2, textAlign: 'center' }}
              />
            </View>
          </View>

          <View
            onLayout={({ nativeEvent }) => {
              battlefieldLayout.current = nativeEvent.layout;
              setBattlefieldSize((current) => (
                current.width === nativeEvent.layout.width && current.height === nativeEvent.layout.height
                  ? current
                  : { width: nativeEvent.layout.width, height: nativeEvent.layout.height }
              ));
            }}
            style={{
  flex: 1,
  width: '100%',
  alignSelf: 'stretch',
  minHeight: 0,
  overflow: 'hidden',
  marginTop: 2,
  marginBottom: 2,
}}>
            <PianomanDestination monsterSize={monsterSize} laneTop={laneTop} paused={game.paused || defeated} />
            {game.mobs.map((mob, index) => {
              return (
                <TravelingMonster
                  key={mob.id}
                  mob={mob}
                  monsterSize={monsterSize}
                  noteSize={noteSize}
                  renderOrder={game.mobs.length - index}
                  fieldWidth={fieldWidth}
                  laneTop={laneTop}
                  paused={game.paused || (defeated && !mob.leaking)}
                  registerMonsterRef={registerMonsterRef}
                  onReachTower={handleMonsterReachedTower}
                  onLeakAnimationComplete={handleLeakAnimationComplete}
                />
              );
            })}
            {feedback && (
              <Animated.Text
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 32,
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  color: feedback.success ? COLORS.primary : COLORS.danger,
                  fontSize: feedback.success ? 24 : 18,
                  fontWeight: feedback.success ? '800' : '700',
                  textAlign: 'center',
                  textShadowColor: '#071136',
                  textShadowRadius: 4,
                  opacity: feedbackOpacity,
                  transform: [{ scale: feedbackScale }],
                }}
              >
                {feedback.message}
              </Animated.Text>
            )}
            {game.queue.length > 0 && (
              <Text style={{ position: 'absolute', right: 6, top: 6, color: COLORS.text, fontSize: 11, fontWeight: '700', textShadowColor: '#071136', textShadowRadius: 3 }}>
                Next: {game.queue[0].note}
              </Text>
            )}
          </View>

          {guideEnabled && (
            <Text accessibilityLiveRegion="polite" style={{ color: COLORS.primary, fontWeight: '800', marginBottom: 3, textShadowColor: '#071136', textShadowRadius: 3 }}>
              {currentTarget ? `Play ${keyboardTarget} to defend the castle` : 'Get ready for the next monster'}
            </Text>
          )}
          <View style={{ width: '100%', height: keyboardHeight, borderWidth: 1, borderColor: '#fff', borderRadius: 10, overflow: 'hidden' }}>
            <Keyboard
              includeSharps
              height={keyboardHeight}
              sharpHeight={sharpHeight}
              highlightedNote={highlightedNote}
              onPress={playNote}
              onPressOrigin={launchProjectile}
              disabled={game.paused || defeated}
              soundEnabled={soundEnabled}
              volume={soundEffectsVolume / 100}
            />
          </View>
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 4 }}>
            {projectiles.map((projectile) => (
            <NoteProjectile
              key={projectile.id}
              projectile={projectile}
              paused={game.paused || defeated}
              onImpact={handleProjectileImpact}
            />
            ))}
            {damageIndicators.map((indicator) => (
            <FloatingDamage
              key={indicator.id}
              indicator={indicator}
              onDone={removeDamageIndicator}
            />
            ))}
          </View>
          {defeated && (
            <View style={[styles.card, { width: '100%', alignItems: 'center', marginTop: 12, padding: 12 }]}>
              <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: '800' }}>The castle has fallen</Text>
              <Text style={{ color: COLORS.text, fontWeight: '700', marginTop: 8 }}>
                Score: {game.score}
              </Text>
              <Text style={{ color: COLORS.primary, fontWeight: '700', marginTop: 4 }}>
                Highest score: {Math.max(personalBest ?? 0, game.score)}
              </Text>
              {personalBestError ? (
                <Text style={{ color: COLORS.danger, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                  {personalBestError}
                </Text>
              ) : null}
              <Text style={{ color: COLORS.muted, marginVertical: 7 }}>{saveStatus}</Text>
              <AppButton title="Play again" onPress={restart} />
              <AppButton
                title="Back to main menu"
                onPress={() => {
                  playSound(buttonClickPlayer);
                  onNavigate('mainmenu');
                }}
                secondary
              />
            </View>
          )}
          {game.paused && !defeated && (
            <View style={{
              position: 'absolute',
              zIndex: 8,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              backgroundColor: 'rgba(7,23,68,0.68)',
            }}>
              <View style={{ width: '100%', maxWidth: 280, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 8, backgroundColor: '#091849', alignItems: 'stretch' }}>
                <Text style={{ color: COLORS.text, fontFamily: 'Georgia', fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>Paused</Text>
                <Pressable
                  accessibilityRole="switch"
                  accessibilityLabel="Tower Defense Guide"
                  accessibilityState={{ checked: guideEnabled }}
                  onPress={() => {
                    playSound(buttonClickPlayer);
                    onAudioSettingsChange({ towerDefenseGuide: !guideEnabled });
                  }}
                  style={{
                    minHeight: 42,
                    marginVertical: 6,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.4)',
                    borderRadius: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ color: COLORS.text, fontWeight: '700' }}>Guide</Text>
                  <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{guideEnabled ? 'ON' : 'OFF'}</Text>
                </Pressable>
                <AppButton title="Resume" onPress={togglePause} style={{ minHeight: 42 }} />
                <AppButton title="Retry" onPress={restart} secondary style={{ minHeight: 42 }} />
                <Pressable
                  onPress={() => {
                    playSound(buttonClickPlayer);
                    onNavigate('minigame');
                  }}
                  style={{ padding: 8, alignItems: 'center' }}
                >
                  <Text style={{ color: COLORS.primary }}>Return to menu</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
      {savePromptResult && (
        <AccountSavePrompt
          mode="towerDefense"
          result={savePromptResult}
          onNavigate={onNavigate}
          onDismiss={() => setSavePromptResult(null)}
        />
      )}
    </View>
  );
}

export default TowerDefense;