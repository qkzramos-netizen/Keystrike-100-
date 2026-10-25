
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const NOTE_IMAGE = require('../../public/note/notehead.png');

const STAFF_SPACING = 16;
const BOTTOM_LINE_Y = 88;

const NOTE_STEPS = {
  E4: 0,
  F4: 1,
  G4: 2,
  A4: 3,
  B4: 4,
  C5: 5,
  D5: 6,
  E5: 7,
  F5: 8,
};

export default function NoteOnStaff({
  note = 'E4',
  noteColor = '#171717',
}) {
  const step = NOTE_STEPS[note] ?? 0;
  const noteY = BOTTOM_LINE_Y - step * (STAFF_SPACING / 2);

  return (
    <View style={styles.container}>
      {/* Draw the five staff lines */}
      {[0, 1, 2, 3, 4].map((line) => (
        <View
          key={line}
          style={[
            styles.staffLine,
            {
              top: BOTTOM_LINE_Y - line * STAFF_SPACING,
            },
          ]}
        />
      ))}

      {/* Reuse the same musical note image */}
      <Image
        source={NOTE_IMAGE}
        resizeMode="contain"
        style={[
          styles.noteImage,
          {
            top: noteY - 20,
            tintColor: noteColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 340,
    height: 112,
    alignSelf: 'center',
    position: 'relative',
  },

  staffLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 1.5,
    backgroundColor: '#333333',
  },

  noteImage: {
    position: 'absolute',
    left: '48%',
    width: 28,
    height: 40,
  },
});
