import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RoxStar</Text>
      <Text style={styles.text}>Voice drafts, live rooms, and spin events.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1120', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, color: '#fff', fontWeight: '700' },
  text: { color: '#e2e8f0', marginTop: 8 },
});
