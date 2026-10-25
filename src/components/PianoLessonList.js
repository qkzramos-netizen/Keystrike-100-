import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackButton, Page } from './native';

const LESSONS = [
  { id: 1, title: 'Basic Introduction', description: 'Learn the clef, staff lines, spaces, and piano-note relationships.', available: true },
  { id: 2, title: 'Reading Notes on the Staff', description: 'Learn to identify notes by their positions on the staff.', available: false },
  { id: 3, title: 'Practice and Recognition', description: 'Build confidence recognizing notes more quickly.', available: false },
];

export default function PianoLessonList({ clef = 'Treble', onBack, onSelectLesson }) {
  const clefName = clef === 'Bass' ? 'Bass Clef' : 'Treble Clef';

  return (
    <Page
      backgroundImage={require('../../public/assets/glowing-musical-pentagram-background-with-sound-notes_1017-31220.avif')}
      overlayColor="rgba(1, 1, 58, 0.8)"
      style={{ justifyContent: 'flex-start' }}
      contentStyle={{ maxWidth: 420 }}
    >
      <BackButton onPress={onBack} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={lessonStyles.container}>
        <Text style={lessonStyles.eyebrow}>PIANO LESSONS</Text>
        <Text style={lessonStyles.heading}>{clefName}</Text>
        <Text style={lessonStyles.subtitle}>Choose a lesson to begin learning. More lessons will be added in future updates.</Text>

        <View style={lessonStyles.lessonList}>
          {LESSONS.map(lesson => (
            <Pressable
              key={lesson.id}
              disabled={!lesson.available}
              onPress={() => onSelectLesson?.(clef)}
              style={({ pressed }) => [
                lessonStyles.lessonCard,
                !lesson.available && lessonStyles.lockedCard,
                pressed && lesson.available && lessonStyles.pressedCard,
              ]}
            >
              <View style={[lessonStyles.numberCircle, !lesson.available && lessonStyles.lockedNumber]}>
                <Text style={lessonStyles.number}>{lesson.available ? lesson.id : '🔒'}</Text>
              </View>

              <View style={lessonStyles.lessonText}>
                <Text style={lessonStyles.lessonNumber}>LESSON {lesson.id}</Text>
                <Text style={[lessonStyles.lessonTitle, !lesson.available && lessonStyles.mutedText]}>{lesson.title}</Text>
                <Text style={lessonStyles.description}>{lesson.description}</Text>
                {!lesson.available && <Text style={lessonStyles.comingSoon}>COMING SOON</Text>}
              </View>

              {lesson.available && <Text style={lessonStyles.arrow}>›</Text>}
            </Pressable>
          ))}
        </View>

        <Text style={lessonStyles.footer}>Complete the available lesson to build your music-reading skills.</Text>
      </ScrollView>
    </Page>
  );
}

const lessonStyles = StyleSheet.create({
  container: { flexGrow: 1, paddingTop: 24, paddingBottom: 28 },
  eyebrow: { color: '#A9B9FF', fontSize: 11, fontWeight: '800', letterSpacing: 2.5, textAlign: 'center', marginBottom: 10 },
  heading: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  subtitle: { color: '#D0D5F2', fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 28, paddingHorizontal: 8 },
  lessonList: { gap: 14 },
  lessonCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(25, 34, 91, 0.94)', borderColor: '#6679D9', borderWidth: 1, borderRadius: 18, padding: 16, minHeight: 112 },
  lockedCard: { backgroundColor: 'rgba(25, 30, 58, 0.72)', borderColor: 'rgba(151, 160, 195, 0.25)' },
  pressedCard: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  numberCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#7789F2', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  lockedNumber: { backgroundColor: '#383D56' },
  number: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  lessonText: { flex: 1 },
  lessonNumber: { color: '#AEBBFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  lessonTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginBottom: 5 },
  mutedText: { color: '#A0A5BC' },
  description: { color: '#D0D5E9', fontSize: 12, lineHeight: 17 },
  comingSoon: { color: '#A0A5BC', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 8 },
  arrow: { color: '#FFFFFF', fontSize: 30, marginLeft: 8 },
  footer: { color: '#B8C0E4', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 24 },
});