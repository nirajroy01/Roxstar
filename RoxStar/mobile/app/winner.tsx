import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function WinnerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Winner</Text>
      <Text style={styles.subtitle}>Awaiting authoritative backend result.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fef3c7', fontSize: 40, fontWeight: '800' },
  subtitle: { color: '#f8fafc', marginTop: 12 },
});
