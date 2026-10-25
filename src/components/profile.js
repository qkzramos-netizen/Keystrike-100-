import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { Text, TextInput, View } from 'react-native';
import { ACHIEVEMENTS, getGuestAchievementData, getGuestGameStats } from '../achievements';
import { auth, db } from '../firebase';
import { AppButton, BackButton, COLORS, Page, styles } from './native';

const musicBackground = require('../../public/assets/glowing-musical-pentagram-background-with-sound-notes_1017-31220.avif');
const GUEST_NAME_KEY = 'keystrike-guest-name';
const GUEST_ID_KEY = 'keystrike-guest-player-id';

function createGuestId() {
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function Profile({ onNavigate, isAuthenticated }) {
  const [user, setUser] = useState(auth.currentUser);
  const [name, setName] = useState(auth.currentUser?.displayName || 'Player');
  const [nameDraft, setNameDraft] = useState(auth.currentUser?.displayName || 'Player');
  const [guestId, setGuestId] = useState('');
  const [modeStats, setModeStats] = useState({});
  const [achievementData, setAchievementData] = useState({ unlocked: [] });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    let active = true;
    const loadGuestProfile = async () => {
      const storedName = await AsyncStorage.getItem(GUEST_NAME_KEY);
      let storedId = await AsyncStorage.getItem(GUEST_ID_KEY);
      if (!storedId) {
        storedId = createGuestId();
        await AsyncStorage.setItem(GUEST_ID_KEY, storedId);
      }
      const [stats, achievements] = await Promise.all([getGuestGameStats(), getGuestAchievementData()]);
      if (!active) return;
      setGuestId(storedId);
      setName(storedName || auth.currentUser?.displayName || 'Player');
      setNameDraft(storedName || auth.currentUser?.displayName || 'Player');
      if (!auth.currentUser) {
        setModeStats(stats);
        setAchievementData(achievements);
      }
    };

    loadGuestProfile().catch((loadError) => {
      if (active) setError(loadError.message || 'Could not load guest profile.');
    });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const stopStats = onSnapshot(collection(db, 'users', user.uid, 'gameStats'), (snapshot) => {
      const records = {};
      snapshot.forEach((entry) => { records[entry.id] = entry.data(); });
      setModeStats(records);
    }, (loadError) => setError(loadError.message || 'Could not load saved profile statistics.'));
    const stopAchievements = onSnapshot(doc(db, 'users', user.uid, 'achievements', 'progress'), (snapshot) => {
      setAchievementData(snapshot.exists() ? snapshot.data() : { progress: {}, unlocked: [] });
    }, (loadError) => setError(loadError.message || 'Could not load saved achievements.'));
    return () => {
      stopStats();
      stopAchievements();
    };
  }, [user]);

  const saveName = async () => {
    const updatedName = nameDraft.trim();
    if (!updatedName) {
      setError('Enter a display name.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await AsyncStorage.setItem(GUEST_NAME_KEY, updatedName);
      if (user) await updateProfile(user, { displayName: updatedName });
      setName(updatedName);
      setMessage('Name updated successfully.');
    } catch (saveError) {
      setError(saveError.message || 'Could not update your profile name.');
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    setError('');
    try {
      await signOut(auth);
      setMessage('Signed out. Guest play is still available.');
    } catch (signOutError) {
      setError(signOutError.message || 'Could not sign out.');
    } finally {
      setBusy(false);
    }
  };

  const totals = Object.values(modeStats).reduce((result, stats) => ({
    score: result.score + (Number(stats.totalScore) || 0),
    notes: result.notes + (Number(stats.notesPressed) || 0),
    games: result.games + (Number(stats.gamesPlayed) || 0),
  }), { score: 0, notes: 0, games: 0 });
  const unlockedCount = ACHIEVEMENTS.filter(({ id }) => achievementData.unlocked?.includes(id)).length;

  return (
    <Page
      backgroundImage={musicBackground}
      overlayColor="rgba(2, 10, 34, 0.86)"
      style={{ paddingTop: 72, paddingHorizontal: 14 }}
      contentStyle={{ maxWidth: 780 }}
    >
      <BackButton onPress={() => onNavigate('mainmenu')} />
      <Text style={styles.title}>Player Profile</Text>
      <Text style={styles.subtitle}>{user ? 'Account connected' : 'Guest profile'}</Text>
      <View style={styles.card}>
        <Text style={{ color: COLORS.primary, fontFamily: 'Georgia', fontSize: 20, fontWeight: '700' }}>Player ID</Text>
        <Text selectable style={{ color: COLORS.muted, marginVertical: 8 }}>{user?.uid || guestId || 'Loading...'}</Text>
        <Text style={{ color: COLORS.muted, marginBottom: 6 }}>Display name</Text>
        <TextInput
          accessibilityLabel="Display name"
          maxLength={40}
          onChangeText={setNameDraft}
          placeholder="Display name"
          placeholderTextColor="#6f7790"
          style={styles.field}
          value={nameDraft}
        />
        <AppButton title={busy ? 'Please wait...' : 'Save name'} onPress={saveName} disabled={busy} />
        {message ? <Text style={{ color: COLORS.primary, marginTop: 10 }}>{message}</Text> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      </View>
      <View style={styles.card}>
        <Text style={{ color: COLORS.primary, fontFamily: 'Georgia', fontSize: 20, fontWeight: '700', marginBottom: 10 }}>Progress</Text>
        {[
          ['Total score', totals.score],
          ['Notes pressed', totals.notes],
          ['Achievements', `${unlockedCount} / ${ACHIEVEMENTS.length}`],
          ['Completed runs', totals.games],
        ].map(([label, value]) => (
          <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
            <Text style={{ color: COLORS.muted }}>{label}</Text>
            <Text style={{ color: COLORS.text, fontWeight: '700' }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Text>
          </View>
        ))}
      </View>
      {user || isAuthenticated ? (
        <AppButton title="Sign out" onPress={handleSignOut} secondary disabled={busy} />
      ) : (
        <View style={styles.card}>
          <Text style={{ color: COLORS.primary, fontFamily: 'Georgia', fontSize: 20, fontWeight: '700' }}>Save and sync progress</Text>
          <Text style={{ color: COLORS.muted, marginVertical: 9, lineHeight: 21 }}>
            Guest progress is kept on this device. Connect an account whenever you want to sync it.
          </Text>
          <AppButton title="Sign in" onPress={() => onNavigate('login')} />
          <AppButton title="Create account" onPress={() => onNavigate('signup')} secondary />
        </View>
      )}
    </Page>
  );
}

export default Profile;
