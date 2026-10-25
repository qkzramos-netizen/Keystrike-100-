import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { Text, View } from 'react-native';
import { auth, db } from '../firebase';
import { ACHIEVEMENTS, getAchievementProgress, getGuestAchievementData } from '../achievements';
import { AppButton, BackButton, COLORS, Page, styles } from './native';

const musicBackground = require('../../public/assets/glowing-musical-pentagram-background-with-sound-notes_1017-31220.avif');

function Goal({ onNavigate }) {
  const [achievementData, setAchievementData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      getGuestAchievementData().then(setAchievementData).catch((loadError) => {
        setError(loadError.message || 'Could not load guest achievements.');
      });
      return undefined;
    }

    return onSnapshot(doc(db, 'users', user.uid, 'achievements', 'progress'), (snapshot) => {
      setAchievementData(snapshot.exists() ? snapshot.data() : { progress: {}, unlocked: [] });
      setError('');
    }, (loadError) => {
      setError(loadError.message || 'Could not load achievements.');
    });
  }, []);

  const progress = achievementData?.progress || {};
  const unlocked = new Set(achievementData?.unlocked || []);
  const unlockedCount = ACHIEVEMENTS.filter(({ id }) => unlocked.has(id)).length;

  return (
    <Page
      backgroundImage={musicBackground}
      overlayColor="rgba(2, 10, 34, 0.84)"
      style={{ paddingTop: 72, paddingHorizontal: 14 }}
      contentStyle={{ maxWidth: 760 }}
    >
      <BackButton onPress={() => onNavigate('playmenu')} />
      <Text style={styles.title}>Achievements</Text>
      <Text style={styles.subtitle}>{unlockedCount} of {ACHIEVEMENTS.length} unlocked</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {!achievementData && !error ? <Text style={styles.subtitle}>Loading achievements...</Text> : null}
      {ACHIEVEMENTS.map((achievement) => {
        const current = Math.min(getAchievementProgress(achievement.id, progress), achievement.target);
        const complete = unlocked.has(achievement.id);
        return (
          <View key={achievement.id} style={[styles.card, {
            flexDirection: 'row',
            alignItems: 'center',
            borderColor: complete ? 'rgba(240, 215, 109, 0.65)' : 'rgba(255, 255, 255, 0.18)',
            padding: 16,
          }]}>
            <View style={{ flex: 1, paddingRight: 14 }}>
              <Text style={{ color: COLORS.text, fontFamily: 'Georgia', fontSize: 19, fontWeight: '700' }}>
                {achievement.title}
              </Text>
              <Text style={{ color: COLORS.muted, lineHeight: 20, marginTop: 5 }}>{achievement.description}</Text>
            </View>
            <View style={{ width: 120 }}>
              <Text style={{ color: complete ? COLORS.primary : COLORS.muted, fontSize: 13, textAlign: 'right' }}>
                {complete ? 'Unlocked' : `${current} / ${achievement.target}`}
              </Text>
              <View style={{ height: 7, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, marginTop: 8, overflow: 'hidden' }}>
                <View style={{
                  width: `${achievement.target ? (current / achievement.target) * 100 : 0}%`,
                  height: 7,
                  backgroundColor: COLORS.primary,
                  borderRadius: 6,
                }} />
              </View>
            </View>
          </View>
        );
      })}
      {!auth.currentUser && (
        <AppButton title="Sign in to sync achievements" onPress={() => onNavigate('profile')} secondary />
      )}
    </Page>
  );
}

export default Goal;
