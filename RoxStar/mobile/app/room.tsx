import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function RoomScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Room Lobby</Text>
      <Text style={styles.subtitle}>Connected members appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24 },
  title: { color: '#fff', fontSize: 30, fontWeight: '700' },
  subtitle: { color: '#cbd5e1', marginTop: 8 },
});
