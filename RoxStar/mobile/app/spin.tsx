import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SpinScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spin Arena</Text>
      <Text style={styles.subtitle}>Backend-controlled winner and elimination cycle.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 24 },
  title: { color: '#fff', fontSize: 30, fontWeight: '700' },
  subtitle: { color: '#d1d5db', marginTop: 8 },
});
