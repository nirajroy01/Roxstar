import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AuthUser, getCurrentUser, login, logout } from './services/authService';
import { createDraft, deleteDraft, listDrafts, shareDraft } from './services/draftService';
import type { Draft } from './types/draft';
import { createRoom, getRoom, joinRoom, Room } from './services/roomService';
import { getSpinState, startSpin } from './services/spinService';
import { connectSocket, disconnectSocket } from './services/socketService';
import {
  cancelRecording,
  deleteLocalRecording,
  isRecording,
  playLocalDraft,
  startRecording,
  stopLocalPlayback,
  stopRecording,
} from './services/recordingService';

// ─── Recording state machine ──────────────────────────────────────────────────
type RecordState = 'idle' | 'recording' | 'stopping';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [spinStatus, setSpinStatus] = useState('Ready');
  const [busy, setBusy] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Recording
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentPathRef = useRef<string | null>(null);

  // ─── Session restore ────────────────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const result = await getCurrentUser();
        setUser(result.user);
        setDrafts(await listDrafts());
      } catch {
        setUser(null);
      } finally {
        setBusy(false);
      }
    };
    void restoreSession();
  }, []);

  // ─── Socket subscription ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !room) return;
    let active = true;
    let roomSocket: Awaited<ReturnType<typeof connectSocket>> | null = null;

    const subscribe = async () => {
      roomSocket = await connectSocket();
      if (!active || !roomSocket) return;
      const restoreRoomState = () => {
        roomSocket?.emit('join_room', room.code);
        roomSocket?.emit('join_room_id', room._id);
        void getRoom(room._id).then((nextRoom) => active && setRoom(nextRoom)).catch(() => undefined);
      };
      restoreRoomState();
      roomSocket.on('connect', restoreRoomState);
      roomSocket.on('draft_shared', (payload: { draft?: Draft }) => {
        if (payload.draft?.userId === user.userId) {
          setDrafts((current) => current.map((draft) => draft._id === payload.draft!._id ? { ...draft, roomId: room._id } : draft));
        }
      });
      roomSocket.on('user_eliminated', () => setSpinStatus('A participant was eliminated'));
      roomSocket.on('winner_announced', (payload: { winnerUserId?: string }) =>
        setSpinStatus(`Winner: ${payload.winnerUserId || 'announced'}`),
      );
    };

    void subscribe();
    return () => {
      active = false;
      roomSocket?.off('user_eliminated');
      roomSocket?.off('winner_announced');
      roomSocket?.off('draft_shared');
      roomSocket?.off('connect', restoreRoomState);
      roomSocket?.emit('leave_room', room.code);
      disconnectSocket();
    };
  }, [user, room]);

  // ─── Recording timer ────────────────────────────────────────────────────────
  const startTimer = () => {
    setRecordSeconds(0);
    recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
  };

  const stopTimer = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ─── Recording actions ──────────────────────────────────────────────────────
  const handleStartRecording = async () => {
    setError('');
    try {
      const path = await startRecording();
      currentPathRef.current = path;
      setRecordState('recording');
      startTimer();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (recordState !== 'recording') return;
    setRecordState('stopping');
    stopTimer();
    try {
      const ok = await stopRecording();
      if (!ok || !currentPathRef.current) {
        setError('Recording could not be saved');
        setRecordState('idle');
        return;
      }

      const localUri = currentPathRef.current;
      const durationSec = recordSeconds || 1;
      const draftName = `Take ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

      // Save metadata to MongoDB — fileUrl stays null (local phase)
      const draft = await createDraft({ name: draftName, duration: durationSec, effect: 'clean' });
      // Attach local URI client-side only
      const draftWithLocal: Draft = { ...draft, localFileUri: localUri };
      setDrafts((prev) => [draftWithLocal, ...prev]);
      currentPathRef.current = null;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save draft');
    } finally {
      setRecordState('idle');
      setRecordSeconds(0);
    }
  };

  const handleCancelRecording = async () => {
    stopTimer();
    await cancelRecording();
    currentPathRef.current = null;
    setRecordState('idle');
    setRecordSeconds(0);
  };

  // ─── Playback ───────────────────────────────────────────────────────────────
  const handlePlayDraft = async (draft: Draft) => {
    if (!draft.localFileUri) {
      setError('No local audio file for this draft.');
      return;
    }
    if (playingId === draft._id) {
      stopLocalPlayback();
      setPlayingId(null);
      return;
    }
    stopLocalPlayback();
    setPlayingId(draft._id);
    await playLocalDraft(draft.localFileUri);
  };

  // ─── Draft delete ────────────────────────────────────────────────────────────
  const handleDeleteDraft = (draft: Draft) => {
    Alert.alert('Delete draft?', `"${draft.name}" will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (playingId === draft._id) {
              stopLocalPlayback();
              setPlayingId(null);
            }
            await deleteDraft(draft._id);
            if (draft.localFileUri) {
              await deleteLocalRecording(draft.localFileUri);
            }
            setDrafts((prev) => prev.filter((d) => d._id !== draft._id));
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Delete failed');
          }
        },
      },
    ]);
  };

  // ─── Auth actions ───────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setSubmitting(true);
    setError('');
    try {
      const result = await login(email.trim(), password);
      setUser(result.user);
      setDrafts(await listDrafts());
      setPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    stopLocalPlayback();
    await logout();
    setUser(null);
    setDrafts([]);
    setRoom(null);
  };

  // ─── Room actions ───────────────────────────────────────────────────────────
  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      setRoom(await createRoom(roomName.trim()));
      setRoomName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      setRoom(await joinRoom(roomCode.trim()));
      setRoomCode('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to join room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareDraft = async (draft: Draft) => {
    if (!room) return;
    setSubmitting(true);
    setError('');
    try {
      await shareDraft(room._id, draft._id);
      setDrafts((current) => current.map((item) => item._id === draft._id ? { ...item, roomId: room._id } : item));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to share draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartSpin = async () => {
    if (!room) return;
    setSubmitting(true);
    setError('');
    try {
      await startSpin(room._id);
      setSpinStatus('Spin running');
      const state = await getSpinState(room._id);
      if (state?.spin.status === 'COMPLETED')
        setSpinStatus(`Winner: ${state.spin.winnerId || 'announced'}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to start spin');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (busy) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#fbbf24" />
      </View>
    );
  }

  // ─── Auth screen ──────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.authPanel}>
          <Text style={styles.eyebrow}>ROXSTAR</Text>
          <Text style={styles.title}>Make the take count.</Text>
          <Text style={styles.subtitle}>Sign in to record voice drafts and enter live rooms.</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="#64748b"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            secureTextEntry
            placeholder="Password"
            placeholderTextColor="#64748b"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            disabled={submitting || !email || !password}
            onPress={() => void handleLogin()}
            style={styles.primaryButton}
          >
            {submitting ? (
              <ActivityIndicator color="#101828" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign in</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main screen ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.eyebrow}>ROXSTAR</Text>

        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Your studio</Text>
            <Text style={styles.subtitle}>Welcome back, {user.name}.</Text>
          </View>
          <Pressable onPress={() => void handleLogout()}>
            <Text style={styles.logout}>Log out</Text>
          </Pressable>
        </View>

        {/* Stats grid */}
        <View style={styles.grid}>
          <View style={[styles.card, { borderColor: '#60a5fa' }]}>
            <Text style={[styles.cardLabel, { color: '#60a5fa' }]}>Drafts</Text>
            <Text style={styles.cardValue}>{drafts.length}</Text>
          </View>
          <View style={[styles.card, { borderColor: '#34d399' }]}>
            <Text style={[styles.cardLabel, { color: '#34d399' }]}>Rooms</Text>
            <Text style={styles.cardValue}>0</Text>
          </View>
          <View style={[styles.card, { borderColor: '#fbbf24' }]}>
            <Text style={[styles.cardLabel, { color: '#fbbf24' }]}>Spin wins</Text>
            <Text style={styles.cardValue}>0</Text>
          </View>
        </View>

        {/* ── Recording panel ──────────────────────────────────────────────── */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>🎙 Record a take</Text>

          {recordState === 'idle' && (
            <>
              <Text style={styles.panelBody}>Tap record to capture a voice draft locally.</Text>
              <Pressable onPress={() => void handleStartRecording()} style={styles.recordButton}>
                <Text style={styles.recordButtonText}>⏺  Record</Text>
              </Pressable>
            </>
          )}

          {recordState === 'recording' && (
            <>
              <Text style={styles.recordingTimer}>{formatTime(recordSeconds)}</Text>
              <Text style={[styles.panelBody, { color: '#fda4af', marginBottom: 12 }]}>
                Recording…
              </Text>
              <View style={styles.recordingActions}>
                <Pressable onPress={() => void handleStopRecording()} style={styles.stopButton}>
                  <Text style={styles.primaryButtonText}>⏹  Stop &amp; Save</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleCancelRecording()}
                  style={styles.cancelButton}
                >
                  <Text style={styles.secondaryButtonText}>✕ Cancel</Text>
                </Pressable>
              </View>
            </>
          )}

          {recordState === 'stopping' && (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <ActivityIndicator color="#fbbf24" />
              <Text style={[styles.panelBody, { marginTop: 8 }]}>Saving…</Text>
            </View>
          )}
        </View>

        {/* ── Room panel ───────────────────────────────────────────────────── */}
        <View style={[styles.panel, { marginTop: 12 }]}>
          <Text style={styles.panelTitle}>Room play</Text>
          {room ? (
            <>
              <Text style={styles.roomCode}>
                {room.name} · {room.code}
              </Text>
              <Text style={styles.panelBody}>
                {room.members?.length || 1} members · Spin: {spinStatus}
              </Text>
              <Pressable
                disabled={submitting}
                onPress={() => void handleStartSpin()}
                style={[styles.primaryButton, { marginTop: 10 }]}
              >
                <Text style={styles.primaryButtonText}>Start spin</Text>
              </Pressable>
            </>
          ) : (
            <>
              <TextInput
                placeholder="New room name"
                placeholderTextColor="#64748b"
                value={roomName}
                onChangeText={setRoomName}
                style={styles.input}
              />
              <Pressable
                disabled={submitting || !roomName.trim()}
                onPress={() => void handleCreateRoom()}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Create room</Text>
              </Pressable>
              <TextInput
                autoCapitalize="characters"
                placeholder="Join code"
                placeholderTextColor="#64748b"
                value={roomCode}
                onChangeText={setRoomCode}
                style={[styles.input, { marginTop: 10 }]}
              />
              <Pressable
                disabled={submitting || !roomCode.trim()}
                onPress={() => void handleJoinRoom()}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Join room</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* ── Draft list ───────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Voice drafts</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {drafts.length === 0 ? (
          <Text style={styles.empty}>No drafts yet. Hit Record above to start.</Text>
        ) : (
          drafts.map((draft) => (
            <View key={draft._id} style={styles.draftRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.draftName}>{draft.name}</Text>
                <Text style={styles.draftMeta}>
                  {draft.duration}s · {draft.effect}
                  {!draft.localFileUri ? '  ·  no local file' : ''}
                </Text>
              </View>
              <View style={styles.draftActions}>
                {draft.localFileUri && (
                  <Pressable
                    onPress={() => void handlePlayDraft(draft)}
                    style={styles.iconButton}
                  >
                    <Text style={styles.iconButtonText}>
                      {playingId === draft._id ? '⏸' : '▶'}
                    </Text>
                  </Pressable>
                )}
                {room && !draft.roomId && (
                  <Pressable disabled={submitting} onPress={() => void handleShareDraft(draft)} style={styles.iconButton}>
                    <Text style={styles.iconButtonText}>↗</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => handleDeleteDraft(draft)} style={styles.iconButton}>
                  <Text style={[styles.iconButtonText, { color: '#fda4af' }]}>🗑</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1120' },
  scrollContent: { padding: 24, paddingTop: 48 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b1120' },
  authPanel: { flex: 1, justifyContent: 'center', padding: 24 },
  eyebrow: { color: '#a5b4fc', fontSize: 12, letterSpacing: 2, fontWeight: '700', marginBottom: 10 },
  title: { color: '#f8fafc', fontSize: 34, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#cbd5e1', fontSize: 16, marginBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  logout: { color: '#fbbf24', fontSize: 13, fontWeight: '700', paddingTop: 8 },
  input: {
    backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 10, borderWidth: 1,
    color: '#f8fafc', fontSize: 15, marginBottom: 12, padding: 13,
  },
  primaryButton: {
    alignItems: 'center', backgroundColor: '#fbbf24', borderRadius: 10,
    minHeight: 46, justifyContent: 'center', paddingHorizontal: 18,
  },
  primaryButtonText: { color: '#101828', fontSize: 15, fontWeight: '800' },
  secondaryButton: {
    alignItems: 'center', borderColor: '#64748b', borderRadius: 10,
    borderWidth: 1, minHeight: 46, justifyContent: 'center',
  },
  secondaryButtonText: { color: '#e2e8f0', fontSize: 15, fontWeight: '700' },
  roomCode: { color: '#fbbf24', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  error: { color: '#fda4af', fontSize: 13, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  card: { width: '31%', minWidth: 100, backgroundColor: '#111827', borderWidth: 1, borderRadius: 16, padding: 16 },
  cardLabel: { fontSize: 12, fontWeight: '700', marginBottom: 10 },
  cardValue: { color: '#f8fafc', fontSize: 28, fontWeight: '700' },
  panel: {
    backgroundColor: '#111827', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: '#334155',
  },
  panelTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  panelBody: { color: '#cbd5e1', fontSize: 14, lineHeight: 22 },
  recordButton: {
    marginTop: 12, alignItems: 'center', backgroundColor: '#ef4444',
    borderRadius: 10, minHeight: 46, justifyContent: 'center',
  },
  recordButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  recordingTimer: { color: '#fbbf24', fontSize: 36, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  recordingActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  stopButton: {
    flex: 1, alignItems: 'center', backgroundColor: '#fbbf24',
    borderRadius: 10, minHeight: 46, justifyContent: 'center',
  },
  cancelButton: {
    alignItems: 'center', borderColor: '#64748b', borderRadius: 10,
    borderWidth: 1, minHeight: 46, justifyContent: 'center', paddingHorizontal: 18,
  },
  sectionTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', marginBottom: 10, marginTop: 26 },
  empty: { color: '#94a3b8', fontSize: 14 },
  draftRow: {
    backgroundColor: '#111827', borderColor: '#334155', borderRadius: 10,
    borderWidth: 1, marginBottom: 8, padding: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  draftName: { color: '#f8fafc', fontSize: 15, fontWeight: '700' },
  draftMeta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  draftActions: { flexDirection: 'row', gap: 8 },
  iconButton: { padding: 8 },
  iconButtonText: { fontSize: 18, color: '#fbbf24' },
});
