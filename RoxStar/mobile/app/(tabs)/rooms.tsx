import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function RoomsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rooms</Text>
      <Text style={styles.text}>Join or create a room.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#111827' },
  title: { fontSize: 28, color: '#fff', fontWeight: '700' },
  text: { color: '#dbeafe', marginTop: 8 },
});
