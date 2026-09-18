import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function RecordingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recording Studio</Text>
      <Text style={styles.subtitle}>Start, stop, cancel, and save a draft.</Text>
      <View style={styles.row}>
        <Pressable style={[styles.button, styles.primary]}><Text style={styles.buttonText}>Start</Text></Pressable>
        <Pressable style={[styles.button, styles.secondary]}><Text style={styles.buttonText}>Stop</Text></Pressable>
      </View>
      <View style={styles.row}>
        <Pressable style={[styles.button, styles.warning]}><Text style={styles.buttonText}>Cancel</Text></Pressable>
        <Pressable style={[styles.button, styles.success]}><Text style={styles.buttonText}>Save</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#020617' },
  title: { color: '#fff', fontSize: 30, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#cbd5e1', fontSize: 16, marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  button: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', marginHorizontal: 6 },
  primary: { backgroundColor: '#3b82f6' },
  secondary: { backgroundColor: '#8b5cf6' },
  warning: { backgroundColor: '#f59e0b' },
  success: { backgroundColor: '#10b981' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
