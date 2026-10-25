
import React from 'react';
import { Text, View } from 'react-native';
import { AppButton, BackButton, Page } from './native';

export default function TrebleClefMenu({
  onBack,
  onLesson,
  onPractice,
  onQuiz,
}) {
  return (
    <Page
      backgroundImage={require('../../public/assets/glowing-musical-pentagram-background-with-sound-notes_1017-31220.avif')}
      overlayColor="rgba(1, 1, 58, 0.8)"
      style={{ justifyContent: 'center' }}
      contentStyle={{ maxWidth: 420 }}
    >
      <BackButton onPress={onBack} />

      <View style={{ width: '100%', paddingHorizontal: 12 }}>
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 28,
            fontWeight: '800',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Treble Clef
        </Text>

        <Text
          style={{
            color: '#D5D9E8',
            fontSize: 15,
            textAlign: 'center',
            marginBottom: 28,
          }}
        >
          What would you like to do?
        </Text>

        <View style={{ marginBottom: 14 }}>
          <AppButton
            title="Lesson"
            onPress={onLesson}
          />
          <Text
            style={{
              color: '#D5D9E8',
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            Review the lesson
          </Text>
        </View>

        <View style={{ marginBottom: 14 }}>
          <AppButton
            title="Practice"
            onPress={onPractice}
          />
          <Text
            style={{
              color: '#D5D9E8',
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            Practice notes one at a time
          </Text>
        </View>

        <View>
          <AppButton
            title="Quiz"
            onPress={onQuiz}
          />
          <Text
            style={{
              color: '#D5D9E8',
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            Test what you have learned
          </Text>
        </View>
      </View>
    </Page>
  );
}
