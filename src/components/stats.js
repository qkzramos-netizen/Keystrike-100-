import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { Text, View, useWindowDimensions } from 'react-native';
import { ACHIEVEMENTS, getGuestAchievementData, getGuestGameStats } from '../achievements';
import { auth, db } from '../firebase';
import { AppButton, BackButton, COLORS, Page, styles } from './native';

const GAME_MODES = [
  { id: 'pianoLesson', label: 'Piano Lesson' },
  { id: 'pianoMan', label: 'Piano Man' },
  { id: 'towerDefense', label: 'Tower Defense' },
];
const musicBackground = require('../../public/assets/glowing-musical-pentagram-background-with-sound-notes_1017-31220.avif');

function Stats({ onNavigate }) {
  const { width } = useWindowDimensions();
  const [modeStats, setModeStats] = useState({});
  const [unlockedIds, setUnlockedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      Promise.all([getGuestGameStats(), getGuestAchievementData()])
        .then(([stats, achievements]) => {
          setModeStats(stats);
          setUnlockedIds(achievements.unlocked);
          setError('Guest progress is stored on this device until you connect an account.');
          setLoading(false);
        })
        .catch((loadError) => {
          setError(loadError.message || 'Could not load guest statistics.');
          setLoading(false);
        });
      return undefined;
    }

    const stopStats = onSnapshot(collection(db, 'users', user.uid, 'gameStats'), (snapshot) => {
      const records = {};
      snapshot.forEach((entry) => { records[entry.id] = entry.data(); });
      setModeStats(records);
      setLoading(false);
      setError('');
    }, (loadError) => {
      setError(loadError.message || 'Could not load account statistics.');
      setLoading(false);
    });
    const stopAchievements = onSnapshot(doc(db, 'users', user.uid, 'achievements', 'progress'), (snapshot) => {
      setUnlockedIds(snapshot.exists() ? snapshot.data().unlocked || [] : []);
    }, (loadError) => {
      setError(loadError.message || 'Could not load account achievements.');
    });

    return () => {
      stopStats();
      stopAchievements();
    };
  }, []);

  const records = Object.values(modeStats);
  const totals = records.reduce((aggregate, stats) => ({
    score: aggregate.score + (Number(stats.totalScore) || 0),
    bestScore: Math.max(aggregate.bestScore, Number(stats.bestScore) || 0),
    notesPressed: aggregate.notesPressed + (Number(stats.notesPressed) || 0),
    gamesPlayed: aggregate.gamesPlayed + (Number(stats.gamesPlayed) || 0),
  }), { score: 0, bestScore: 0, notesPressed: 0, gamesPlayed: 0 });
  const unlockedCount = ACHIEVEMENTS.filter(({ id }) => unlockedIds.includes(id)).length;
  const summary = [
    ['Total score', totals.score],
    ['Best run', totals.bestScore],
    ['Notes pressed', totals.notesPressed],
    ['Achievements', `${unlockedCount} / ${ACHIEVEMENTS.length}`],
  ];

  return (
    <Page
      backgroundImage={musicBackground}
      overlayColor="rgba(2, 10, 34, 0.86)"
      style={{ paddingTop: 72, paddingHorizontal: 14 }}
      contentStyle={{ maxWidth: 820 }}
    >
      <BackButton onPress={() => onNavigate('mainmenu')} />
      <Text style={styles.title}>Account Stats</Text>
      <Text style={styles.subtitle}>Your progress across every game mode</Text>
      {loading && <Text style={styles.subtitle}>Loading statistics...</Text>}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {!auth.currentUser && (
        <AppButton title="Connect account to sync progress" onPress={() => onNavigate('profile')} secondary />
      )}
      <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {summary.map(([label, value]) => (
          <View key={label} style={[styles.card, { width: width < 600 ? '48%' : '23%', minHeight: 84, justifyContent: 'center', padding: 12 }]}>
            <Text style={{ color: COLORS.muted }}>{label}</Text>
            <Text style={{ color: COLORS.primary, fontFamily: 'Georgia', fontSize: 22, fontWeight: '700', marginTop: 6 }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[styles.title, { fontSize: 24 }]}>Game Modes</Text>
      {GAME_MODES.map((mode) => {
        const stats = modeStats[mode.id] || {};
        return (
          <View key={mode.id} style={styles.card}>
            <Text style={{ color: COLORS.primary, fontFamily: 'Georgia', fontSize: 19, fontWeight: '700', marginBottom: 10 }}>
              {mode.label}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[
                ['Runs', Number(stats.gamesPlayed) || 0],
                ['Total score', Number(stats.totalScore) || 0],
                ['Best score', Number(stats.bestScore) || 0],
                ['Notes pressed', Number(stats.notesPressed) || 0],
              ].map(([label, value]) => (
                <View key={label} style={{ width: width < 600 ? '48%' : '23%', paddingVertical: 4 }}>
                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>{label}</Text>
                  <Text style={{ color: COLORS.text, fontWeight: '600', marginTop: 4 }}>{value.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
      <Text style={{ color: COLORS.muted, fontFamily: 'Georgia', marginTop: 12 }}>
        Completed runs: {totals.gamesPlayed.toLocaleString()}
      </Text>
    </Page>
  );
}

export default Stats;
