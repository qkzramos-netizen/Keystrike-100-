
import React from 'react';
import { Switch, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { BackButton, COLORS, Page, styles } from './native';

function Settings({ onNavigate, audioSettings, onAudioSettingsChange }) {
  const updateSetting = (key, value) => {
    let nextValue = value;
    if (key === 'musicVolume' || key === 'soundEffectsVolume') {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) return;
      nextValue = Math.max(0, Math.min(100, numericValue));
    }

    onAudioSettingsChange({ [key]: nextValue });
  };
  const renderToggle = (label, description, value, onValueChange) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        gap: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '600' }}>
          {label}
        </Text>
        <Text
          style={{
            color: COLORS.text,
            fontSize: 12,
            opacity: 0.7,
            marginTop: 3,
          }}
        >
          {description}
        </Text>
      </View>

      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? COLORS.primary : '#a9b1d2'}
        trackColor={{ false: '#3a4261', true: '#24566a' }}
      />
    </View>
  );

  const renderVolume = (label, value, onValueChange, disabled = false) => (
    <View style={{ paddingVertical: 12, opacity: disabled ? 0.45 : 1 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '600' }}>
          {label}
        </Text>
        <Text style={{ color: COLORS.text, fontSize: 14 }}>
          {Math.round(value)}%
        </Text>
      </View>

      <Slider
        accessibilityLabel={label}
        minimumValue={0}
        maximumValue={100}
        step={5}
        value={value}
        onValueChange={(nextValue) =>
          onValueChange(Math.round(nextValue / 5) * 5)
        }
        disabled={disabled}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor="#3a4261"
        thumbTintColor={COLORS.primary}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: COLORS.text, fontSize: 11, opacity: 0.65 }}>
          0%
        </Text>
        <Text style={{ color: COLORS.text, fontSize: 11, opacity: 0.65 }}>
          100%
        </Text>
      </View>
    </View>
  );

  return (
    <Page>
      <BackButton onPress={() => onNavigate('mainmenu')} />

      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text
          style={{
            color: COLORS.primary,
            fontSize: 13,
            fontWeight: '700',
            letterSpacing: 1.5,
            marginBottom: 4,
          }}
        >
          AUDIO
        </Text>

        {renderToggle(
          'Sound Effects',
          'Button clicks and game sounds',
          audioSettings.soundEffects,
          (value) => updateSetting('soundEffects', value)
        )}

        {renderVolume(
          'Sound Effects Volume',
          audioSettings.soundEffectsVolume,
          (value) => updateSetting('soundEffectsVolume', value),
          !audioSettings.soundEffects
        )}

        <View
          style={{
            height: 1,
            backgroundColor: '#3a4261',
            marginVertical: 8,
          }}
        />

        {renderToggle(
          'Background Music',
          'Music played in the menus',
          audioSettings.music,
          (value) => updateSetting('music', value)
        )}

        {renderVolume(
          'Music Volume',
          audioSettings.musicVolume,
          (value) => updateSetting('musicVolume', value),
          !audioSettings.music
        )}
      </View>

      <View style={styles.card}>
        <Text
          style={{
            color: COLORS.primary,
            fontSize: 13,
            fontWeight: '700',
            letterSpacing: 1.5,
            marginBottom: 4,
          }}
        >
          GAMEPLAY
        </Text>

        {renderToggle(
          'Tower Defense Guide',
          'Show which piano key to play during Tower Defense',
          audioSettings.towerDefenseGuide !== false,
          (value) => updateSetting('towerDefenseGuide', value)
        )}
      </View>
    </Page>
  );
}

export default Settings;
