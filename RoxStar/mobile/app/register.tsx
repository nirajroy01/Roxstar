import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <TextInput placeholder="Name" style={styles.input} />
      <TextInput placeholder="Email" style={styles.input} />
      <TextInput placeholder="Password" secureTextEntry style={styles.input} />
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Register</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#111827' },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 20 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#10b981', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
