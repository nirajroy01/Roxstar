import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthUser, getCurrentUser, login, logout } from './services/authService';
import { createDraft, Draft, listDrafts } from './services/draftService';
import { createRoom, joinRoom, Room } from './services/roomService';
import { getSpinState, startSpin } from './services/spinService';
import { connectSocket, disconnectSocket } from './services/socketService';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [draftName, setDraftName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [spinStatus, setSpinStatus] = useState('Ready');
  const [busy, setBusy] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (!user || !room) return;
    let active = true;
    let roomSocket: Awaited<ReturnType<typeof connectSocket>> | null = null;

    const subscribe = async () => {
      roomSocket = await connectSocket();
      if (!active || !roomSocket) return;
      roomSocket.emit('join_room', room.code);
      roomSocket.emit('join_room_id', room._id);
      roomSocket.on('user_eliminated', () => setSpinStatus('A participant was eliminated'));
      roomSocket.on('winner_announced', (payload: { winnerUserId?: string }) => setSpinStatus(`Winner: ${payload.winnerUserId || 'announced'}`));
    };

    void subscribe();
    return () => {
      active = false;
      roomSocket?.off('user_eliminated');
      roomSocket?.off('winner_announced');
      roomSocket?.emit('leave_room', room.code);
      disconnectSocket();
    };
  }, [user, room]);

  const handleLogin = async () => {
    setSubmitting(true);
    setError('');
    try {
      const result = await login(email.trim(), password);
      setUser(result.user);
      setDrafts(await listDrafts());
      setPassword('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!draftName.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const draft = await createDraft({ name: draftName.trim(), duration: 30, effect: 'clean' });
      setDrafts((current) => [draft, ...current]);
      setDraftName('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setDrafts([]);
    setRoom(null);
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      setRoom(await createRoom(roomName.trim()));
      setRoomName('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create room');
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
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to join room');
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
      if (state?.spin.status === 'COMPLETED') setSpinStatus(`Winner: ${state.spin.winnerId || 'announced'}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to start spin');
    } finally {
      setSubmitting(false);
    }
  };

  if (busy) {
    return <View style={styles.loading}><ActivityIndicator color="#fbbf24" /></View>;
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.authPanel}>
          <Text style={styles.eyebrow}>ROXSTAR</Text>
          <Text style={styles.title}>Make the take count.</Text>
          <Text style={styles.subtitle}>Sign in to manage voice drafts and enter live rooms.</Text>
          <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} style={styles.input} />
          <TextInput secureTextEntry placeholder="Password" placeholderTextColor="#64748b" value={password} onChangeText={setPassword} style={styles.input} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable disabled={submitting || !email || !password} onPress={() => void handleLogin()} style={styles.primaryButton}>
            {submitting ? <ActivityIndicator color="#101828" /> : <Text style={styles.primaryButtonText}>Sign in</Text>}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.eyebrow}>ROXSTAR</Text>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Your studio</Text>
            <Text style={styles.subtitle}>Welcome back, {user.name}.</Text>
          </View>
          <Pressable onPress={() => void handleLogout()}><Text style={styles.logout}>Log out</Text></Pressable>
        </View>

        <View style={styles.grid}>
          <View style={[styles.card, { borderColor: '#60a5fa' }]}><Text style={[styles.cardLabel, { color: '#60a5fa' }]}>Voice drafts</Text><Text style={styles.cardValue}>{drafts.length}</Text></View>
          <View style={[styles.card, { borderColor: '#34d399' }]}><Text style={[styles.cardLabel, { color: '#34d399' }]}>Rooms</Text><Text style={styles.cardValue}>0</Text></View>
          <View style={[styles.card, { borderColor: '#fbbf24' }]}><Text style={[styles.cardLabel, { color: '#fbbf24' }]}>Spin wins</Text><Text style={styles.cardValue}>0</Text></View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>New voice draft</Text>
          <TextInput placeholder="Draft name" placeholderTextColor="#64748b" value={draftName} onChangeText={setDraftName} style={styles.input} />
          <Pressable disabled={submitting || !draftName.trim()} onPress={() => void handleCreateDraft()} style={styles.primaryButton}>
            {submitting ? <ActivityIndicator color="#101828" /> : <Text style={styles.primaryButtonText}>Create draft</Text>}
          </Pressable>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Room play</Text>
          {room ? (
            <>
              <Text style={styles.roomCode}>{room.name} · {room.code}</Text>
              <Text style={styles.panelBody}>{room.members?.length || 1} active members · Spin: {spinStatus}</Text>
              <Pressable disabled={submitting} onPress={() => void handleStartSpin()} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Start spin</Text>
              </Pressable>
            </>
          ) : (
            <>
              <TextInput placeholder="New room name" placeholderTextColor="#64748b" value={roomName} onChangeText={setRoomName} style={styles.input} />
              <Pressable disabled={submitting || !roomName.trim()} onPress={() => void handleCreateRoom()} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Create room</Text>
              </Pressable>
              <TextInput autoCapitalize="characters" placeholder="Join code" placeholderTextColor="#64748b" value={roomCode} onChangeText={setRoomCode} style={styles.input} />
              <Pressable disabled={submitting || !roomCode.trim()} onPress={() => void handleJoinRoom()} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Join room</Text>
              </Pressable>
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Recent drafts</Text>
        {drafts.length === 0 ? <Text style={styles.empty}>No drafts yet. Create your first take above.</Text> : drafts.map((draft) => (
          <View key={draft._id} style={styles.draftRow}><Text style={styles.draftName}>{draft.name}</Text><Text style={styles.draftMeta}>{draft.duration}s · {draft.effect}</Text></View>
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1120',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 48,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1120',
  },
  authPanel: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  eyebrow: {
    color: '#a5b4fc',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 10,
  },
  title: {
    color: '#f8fafc',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  logout: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
    paddingTop: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 10,
    borderWidth: 1,
    color: '#f8fafc',
    fontSize: 15,
    marginBottom: 12,
    padding: 13,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    borderRadius: 10,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#101828',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#64748b',
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
  },
  roomCode: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  error: {
    color: '#fda4af',
    fontSize: 13,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: '31%',
    minWidth: 100,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  cardValue: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
  },
  panel: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  panelTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  panelBody: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 26,
  },
  empty: {
    color: '#94a3b8',
    fontSize: 14,
  },
  draftRow: {
    backgroundColor: '#111827',
    borderColor: '#334155',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    padding: 14,
  },
  draftName: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  draftMeta: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
});
