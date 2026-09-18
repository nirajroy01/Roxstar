import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RoxStar Tabs</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
});
