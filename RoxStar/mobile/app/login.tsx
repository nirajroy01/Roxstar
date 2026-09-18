import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
// hello
export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to RoxStar</Text>
      <TextInput placeholder="Email" style={styles.input} />
      <TextInput placeholder="Password" secureTextEntry style={styles.input} />
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0f172a' },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 20 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#4f46e5', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
