import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const GUEST_HISTORY_KEY = 'keystrike-guest-game-history';
const PENDING_RESULTS_KEY = 'keystrike-pending-game-results';
const AUTH_RETURN_SCREEN_KEY = 'keystrike-auth-return-screen';

export const ACHIEVEMENTS = [
  { id: 'first-finish', title: 'First Finish', description: 'Complete a run in any game mode.', target: 1 },
  { id: 'lesson-graduate', title: 'Lesson Graduate', description: 'Complete a Piano Lesson quiz.', target: 1 },
  { id: 'perfect-recital', title: 'Perfect Recital', description: 'Answer every Piano Lesson question correctly.', target: 1 },
  { id: 'song-finisher', title: 'Song Finisher', description: 'Finish a song in Piano Man.', target: 1 },
  { id: 'tower-keeper', title: 'Tower Keeper', description: 'Reach Tower Defense tier 3.', target: 3 },
  { id: 'triple-threat', title: 'Triple Threat', description: 'Complete all three game modes.', target: 3 },
];

function createResultId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function readStoredList(key) {
  const stored = await AsyncStorage.getItem(key);
  if (!stored) return [];
  const parsed = JSON.parse(stored);
  if (!Array.isArray(parsed)) throw new Error(`Stored KeyStrike data for ${key} is invalid.`);
  return parsed;
}

export function getAchievementProgress(id, progress = {}) {
  switch (id) {
    case 'first-finish': return progress.completedRuns || 0;
    case 'lesson-graduate': return progress.lessonsCompleted || 0;
    case 'perfect-recital': return progress.perfectLessons || 0;
    case 'song-finisher': return progress.songsCompleted || 0;
    case 'tower-keeper': return progress.highestTowerTier || 0;
    case 'triple-threat': return Object.values(progress.completedModes || {}).filter(Boolean).length;
    default: return 0;
  }
}

export async function recordGameResult(mode, result, resultId = createResultId()) {
  const user = auth.currentUser;
  if (!user) return null;

  const score = Math.max(0, Number(result.score) || 0);
  const notesPressed = Math.max(0, Number(result.notesPressed) || 0);
  const statsRef = doc(db, 'users', user.uid, 'gameStats', mode);
  const achievementsRef = doc(db, 'users', user.uid, 'achievements', 'progress');
  const resultRef = doc(db, 'users', user.uid, 'gameResults', resultId);

  return runTransaction(db, async (transaction) => {
    const [statsSnapshot, achievementsSnapshot, resultSnapshot] = await Promise.all([
      transaction.get(statsRef),
      transaction.get(achievementsRef),
      transaction.get(resultRef),
    ]);
    if (resultSnapshot.exists()) return [];

    const stats = statsSnapshot.exists() ? statsSnapshot.data() : {};
    const stored = achievementsSnapshot.exists() ? achievementsSnapshot.data() : {};
    const progress = stored.progress || {};
    const songHighScores = { ...(stats.songHighScores || {}) };
    if (mode === 'pianoMan' && result.songTitle && result.difficulty) {
      const songScores = { ...(songHighScores[result.songTitle] || {}) };
      songScores[result.difficulty] = Math.max(
        Number(songScores[result.difficulty]) || 0,
        score
      );
      songHighScores[result.songTitle] = songScores;
    }
    const completedModes = { ...(progress.completedModes || {}), [mode]: true };
    const nextProgress = {
      ...progress,
      completedRuns: (progress.completedRuns || 0) + 1,
      completedModes,
      lessonsCompleted: (progress.lessonsCompleted || 0) + (mode === 'pianoLesson' ? 1 : 0),
      perfectLessons: (progress.perfectLessons || 0) + (mode === 'pianoLesson' && result.perfect ? 1 : 0),
      songsCompleted: (progress.songsCompleted || 0) + (mode === 'pianoMan' ? 1 : 0),
      highestTowerTier: Math.max(
        progress.highestTowerTier || 0,
        mode === 'towerDefense' ? Number(result.highestTier) || 0 : 0
      ),
    };
    const unlocked = new Set(stored.unlocked || []);
    const newlyUnlocked = ACHIEVEMENTS.filter((achievement) => (
      !unlocked.has(achievement.id)
      && getAchievementProgress(achievement.id, nextProgress) >= achievement.target
    ));
    const unlockedAt = { ...(stored.unlockedAt || {}) };
    newlyUnlocked.forEach((achievement) => {
      unlocked.add(achievement.id);
      unlockedAt[achievement.id] = serverTimestamp();
    });

    transaction.set(statsRef, {
      game: mode,
      gamesPlayed: (stats.gamesPlayed || 0) + 1,
      totalScore: (stats.totalScore || 0) + score,
      bestScore: Math.max(stats.bestScore || 0, score),
      lastScore: score,
      notesPressed: (stats.notesPressed || 0) + notesPressed,
      ...(mode === 'pianoLesson' ? { perfectLessons: (stats.perfectLessons || 0) + (result.perfect ? 1 : 0) } : {}),
      ...(mode === 'pianoMan' ? { songsCompleted: (stats.songsCompleted || 0) + 1 } : {}),
      ...(mode === 'towerDefense' ? {
        highestTier: Math.max(stats.highestTier || 0, Number(result.highestTier) || 0),
      } : {}),
      ...(mode === 'pianoMan' ? { songHighScores } : {}),
      lastPlayedAt: serverTimestamp(),
    }, { merge: true });
    transaction.set(achievementsRef, {
      progress: nextProgress,
      unlocked: [...unlocked],
      unlockedAt,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    transaction.set(resultRef, {
      mode,
      score,
      notesPressed,
      result,
      recordedAt: serverTimestamp(),
    });

    return newlyUnlocked.map((achievement) => achievement.id);
  });
}

export async function recordGuestGameResult(mode, result) {
  const id = createResultId();
  const history = await readStoredList(GUEST_HISTORY_KEY);
  history.push({ id, mode, result });
  await AsyncStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(history));
  return id;
}

export async function getGuestGameStats() {
  const history = await readStoredList(GUEST_HISTORY_KEY);
  return history.reduce((statsByMode, entry) => {
    const current = statsByMode[entry.mode] || {
      game: entry.mode,
      gamesPlayed: 0,
      totalScore: 0,
      bestScore: 0,
      notesPressed: 0,
      perfectLessons: 0,
      songsCompleted: 0,
      highestTier: 0,
      songHighScores: {},
    };
    const score = Math.max(0, Number(entry.result.score) || 0);
    const songHighScores = { ...(current.songHighScores || {}) };
    if (entry.mode === 'pianoMan' && entry.result.songTitle && entry.result.difficulty) {
      const songScores = { ...(songHighScores[entry.result.songTitle] || {}) };
      songScores[entry.result.difficulty] = Math.max(
        Number(songScores[entry.result.difficulty]) || 0,
        score
      );
      songHighScores[entry.result.songTitle] = songScores;
    }
    statsByMode[entry.mode] = {
      ...current,
      gamesPlayed: current.gamesPlayed + 1,
      totalScore: current.totalScore + score,
      bestScore: Math.max(current.bestScore, score),
      notesPressed: current.notesPressed + (Number(entry.result.notesPressed) || 0),
      perfectLessons: current.perfectLessons + (entry.mode === 'pianoLesson' && entry.result.perfect ? 1 : 0),
      songsCompleted: current.songsCompleted + (entry.mode === 'pianoMan' ? 1 : 0),
      highestTier: Math.max(current.highestTier, Number(entry.result.highestTier) || 0),
      songHighScores,
    };
    return statsByMode;
  }, {});
}

export async function getPianoManHighScores(songTitle) {
  if (auth.currentUser) {
    const statsSnapshot = await getDoc(doc(db, 'users', auth.currentUser.uid, 'gameStats', 'pianoMan'));
    return statsSnapshot.exists()
      ? statsSnapshot.data().songHighScores?.[songTitle] || {}
      : {};
  }

  const guestStats = await getGuestGameStats();
  return guestStats.pianoMan?.songHighScores?.[songTitle] || {};
}

export async function getTowerDefenseHighScore() {
  if (auth.currentUser) {
    const statsSnapshot = await getDoc(doc(db, 'users', auth.currentUser.uid, 'gameStats', 'towerDefense'));
    return statsSnapshot.exists()
      ? Number(statsSnapshot.data().bestScore) || 0
      : 0;
  }

  const guestStats = await getGuestGameStats();
  return Number(guestStats.towerDefense?.bestScore) || 0;
}

export async function getGuestAchievementData() {
  const history = await readStoredList(GUEST_HISTORY_KEY);
  const completedModes = {};
  history.forEach((entry) => { completedModes[entry.mode] = true; });
  const progress = {
    completedRuns: history.length,
    completedModes,
    lessonsCompleted: history.filter((entry) => entry.mode === 'pianoLesson').length,
    perfectLessons: history.filter((entry) => entry.mode === 'pianoLesson' && entry.result.perfect).length,
    songsCompleted: history.filter((entry) => entry.mode === 'pianoMan').length,
    highestTowerTier: history.reduce((highest, entry) => (
      entry.mode === 'towerDefense' ? Math.max(highest, Number(entry.result.highestTier) || 0) : highest
    ), 0),
  };
  const unlocked = ACHIEVEMENTS
    .filter((achievement) => getAchievementProgress(achievement.id, progress) >= achievement.target)
    .map((achievement) => achievement.id);
  return { progress, unlocked };
}

export async function queueGameResultForSaving(mode, result) {
  const pending = await readStoredList(PENDING_RESULTS_KEY);
  const { guestResultId, ...cleanResult } = result;
  if (!pending.some((entry) => entry.id === guestResultId)) {
    pending.push({ id: guestResultId || createResultId(), mode, result: cleanResult });
  }
  await AsyncStorage.setItem(PENDING_RESULTS_KEY, JSON.stringify(pending));
  await AsyncStorage.setItem(AUTH_RETURN_SCREEN_KEY, 'stats');
}

export async function getAuthReturnScreen() {
  const returnScreen = await AsyncStorage.getItem(AUTH_RETURN_SCREEN_KEY);
  await AsyncStorage.removeItem(AUTH_RETURN_SCREEN_KEY);
  return returnScreen || 'mainmenu';
}

export async function flushPendingGameResults() {
  if (!auth.currentUser) return;
  const [guestHistory, pending] = await Promise.all([
    readStoredList(GUEST_HISTORY_KEY),
    readStoredList(PENDING_RESULTS_KEY),
  ]);
  const results = new Map();
  [...guestHistory, ...pending].forEach((entry) => {
    if (entry?.id && entry?.mode && entry?.result) results.set(entry.id, entry);
  });

  for (const entry of results.values()) {
    await recordGameResult(entry.mode, entry.result, entry.id);
  }

  await AsyncStorage.multiRemove([GUEST_HISTORY_KEY, PENDING_RESULTS_KEY]);
}
