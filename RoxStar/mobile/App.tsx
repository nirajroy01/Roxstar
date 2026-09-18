import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const dashboardSections = [
    { title: 'Voice Drafts', value: '12', tint: '#60a5fa' },
    { title: 'Active Rooms', value: '04', tint: '#34d399' },
    { title: 'Spin Wins', value: '02', tint: '#fbbf24' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.eyebrow}>ROXSTAR</Text>
        <Text style={styles.title}>Voice Draft, Rooms & Spins</Text>
        <Text style={styles.subtitle}>Realtime creativity with room-based collaboration.</Text>

        <View style={styles.grid}>
          {dashboardSections.map((section) => (
            <View key={section.title} style={[styles.card, { borderColor: section.tint }]}>
              <Text style={[styles.cardLabel, { color: section.tint }]}>{section.title}</Text>
              <Text style={styles.cardValue}>{section.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Current focus</Text>
          <Text style={styles.panelBody}>Audio drafts, room sharing, and backend-authoritative spin elimination.</Text>
        </View>
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
});
