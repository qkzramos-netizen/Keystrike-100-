import React, { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const SOUND_FILES = {
  C: require('../../public/sounds/c.mp3'),
  D: require('../../public/sounds/d.mp3'),
  E: require('../../public/sounds/e.mp3'),
  F: require('../../public/sounds/f.mp3'),
  G: require('../../public/sounds/g.mp3'),
  A: require('../../public/sounds/a.mp3'),
  B: require('../../public/sounds/b.mp3'),
  'C#': require('../../public/sounds/c-sharp.mp3'),
  'D#': require('../../public/sounds/d-sharp.mp3'),
  'F#': require('../../public/sounds/f-sharp.mp3'),
  'G#': require('../../public/sounds/g-sharp.mp3'),
  'A#': require('../../public/sounds/a-sharp.mp3'),
};

const SHARP_KEYS = [
  { note: 'C#', left: '9.8%' },
  { note: 'D#', left: '24.1%' },
  { note: 'F#', left: '52.7%' },
  { note: 'G#', left: '67.0%' },
  { note: 'A#', left: '81.2%' },
];

const PianoKey = React.memo(function PianoKey({
  note,
  onPress,
  onPressOrigin,
  highlighted,
  disabled = false,
  soundEnabled = true,
  volume = 1,
  blackKey = false,
  height = 142,
  sharpHeight = 84,
  gameLayout = false,
}) {
  const player = useAudioPlayer(soundEnabled ? SOUND_FILES[note] : null);
  const keyRef = useRef(null);
  const playerMounted = useRef(false);
  const keyActive = highlighted;

  // When a sound finishes, stop it AND rewind, so seeking can't auto-restart it.
  useEffect(() => {
    playerMounted.current = true;
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (playerMounted.current && status.didJustFinish) {
        player.pause();
        player.seekTo(0);
      }
    });
    return () => {
      playerMounted.current = false;
      subscription.remove();
    };
  }, [player]);

  useEffect(() => {
    player.volume = volume;
  }, [player, volume]);

  // Stop sound when disabled (pause / game over). No seeking here.
  useEffect(() => {
    if (disabled) player.pause();
  }, [disabled, player]);

const handlePress = () => {
  if (disabled) return;
  if (soundEnabled) {
    // Key still sounding (spam press): rewind, but don't wait for it
    if (player.playing) {
      player.seekTo(0);
    }
    player.play();
  }
  const projectile = onPress?.(note);
  if (projectile && onPressOrigin) {
    if (typeof keyRef.current?.measureInWindow === 'function') {
      keyRef.current.measureInWindow((x, y, width, height) => {
        onPressOrigin(projectile, { x: x + width / 2, y: y + height / 2 });
      });
    } else {
      onPressOrigin(projectile, null);
    }
  }
};

  return (
    <Pressable
      ref={keyRef}
      accessibilityLabel={`Play ${note}`}
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={handlePress}
      style={({ pressed }) => ({
        flex: blackKey ? undefined : 1,
        width: blackKey ? '100%' : undefined,
        minWidth: blackKey ? undefined : gameLayout ? 0 : 38,
        height: blackKey ? sharpHeight : height,
        alignItems: 'center',
        justifyContent: gameLayout ? 'center' : 'flex-end',
        paddingBottom: gameLayout ? 0 : blackKey ? 9 : 16,
        borderWidth: gameLayout ? 1 : blackKey ? 0 : 1,
        borderColor: gameLayout ? '#777' : '#ccd1e0',
        backgroundColor: gameLayout
          ? keyActive ? '#fff' : '#000'
          : highlighted || pressed ? '#64dcf4' : blackKey ? '#111735' : '#f8f9ff',
        ...(blackKey ? { position: 'absolute', top: 0, left: '0%', zIndex: 1 } : {}),
      })}
    >
      <Text
        style={{
          color: gameLayout ? keyActive ? '#000' : '#fff' : blackKey ? '#fff' : '#131a36',
          fontSize: blackKey ? 12 : gameLayout ? 24 : 19,
          fontWeight: '800',
        }}
      >
        {note}
      </Text>
    </Pressable>
  );
});

function Keyboard({
  highlightedNote,
  onPress,
  disabled = false,
  includeSharps = false,
  height = 142,
  sharpHeight = 84,
  gameLayout = false,
  soundEnabled = true,
  volume = 1,
  onPressOrigin,
}) {
  return (
    <View
      accessibilityLabel="Piano keyboard"
      style={{
        flexDirection: 'row',
        width: '100%',
        height,
        overflow: 'hidden',
        borderRadius: gameLayout ? 0 : 12,
        borderWidth: gameLayout ? 0 : 1,
        borderColor: '#ccd1e0',
      }}
    >
      {NOTES.map((note) => (
        <PianoKey
          key={note}
          note={note}
          onPress={disabled ? undefined : onPress}
          highlighted={note === highlightedNote}
          disabled={disabled}
          soundEnabled={soundEnabled}
          volume={volume}
          onPressOrigin={onPressOrigin}
          height={height}
          gameLayout={gameLayout}
        />
      ))}
      {includeSharps && SHARP_KEYS.map(({ note, left }) => (
        <View key={note} pointerEvents="box-none" style={{ position: 'absolute', left, top: 0, width: '9%', height: sharpHeight, zIndex: 2 }}>
          <PianoKey
            note={note}
            onPress={disabled ? undefined : onPress}
            highlighted={note === highlightedNote}
            disabled={disabled}
            soundEnabled={soundEnabled}
            volume={volume}
            onPressOrigin={onPressOrigin}
            sharpHeight={sharpHeight}
            blackKey
          />
        </View>
      ))}
    </View>
  );
}

export default Keyboard;