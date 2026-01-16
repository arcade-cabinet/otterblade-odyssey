/**
 * Heads-Up Display overlay
 * Health, warmth, shards, chapter info
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '../store/gameStore';

export function HUD() {
  const health = useStore((s) => s.health);
  const maxHealth = useStore((s) => s.maxHealth);
  const warmth = useStore((s) => s.warmth);
  const maxWarmth = useStore((s) => s.maxWarmth);
  const shards = useStore((s) => s.shards);
  const bladeLevel = useStore((s) => s.bladeLevel);
  const currentChapter = useStore((s) => s.currentChapter);

  return (
    <View style={styles.container}>
      {/* Chapter */}
      <Text style={styles.chapter}>Chapter {currentChapter}</Text>

      {/* Health Hearts */}
      <View style={styles.healthRow}>
        {Array.from({ length: maxHealth }).map((_, i) => (
          <Text key={i} style={styles.heart}>
            {i < health ? '❤️' : '🖤'}
          </Text>
        ))}
      </View>

      {/* Warmth Bar */}
      <View style={styles.warmthContainer}>
        <Text style={styles.label}>Warmth</Text>
        <View style={styles.warmthBar}>
          <View
            style={[
              styles.warmthFill,
              {
                width: `${(warmth / maxWarmth) * 100}%`,
                backgroundColor: warmth > 50 ? '#FF6B35' : '#E67E22',
              },
            ]}
          />
        </View>
        <Text style={styles.warmthText}>{warmth}/{maxWarmth}</Text>
      </View>

      {/* Shards & Blade */}
      <View style={styles.statsRow}>
        <Text style={styles.shards}>✨ {shards}</Text>
        <Text style={styles.blade}>⚔️ Lv.{bladeLevel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 12,
    minWidth: 180,
  },
  chapter: {
    color: '#E67E22',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  healthRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  heart: {
    fontSize: 18,
    marginRight: 4,
  },
  warmthContainer: {
    marginBottom: 12,
  },
  label: {
    color: '#F4D03F',
    fontSize: 12,
    marginBottom: 4,
  },
  warmthBar: {
    width: 120,
    height: 14,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#F4D03F',
    borderRadius: 3,
    overflow: 'hidden',
  },
  warmthFill: {
    height: '100%',
  },
  warmthText: {
    color: '#F4D03F',
    fontSize: 11,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shards: {
    color: '#F4D03F',
    fontSize: 16,
  },
  blade: {
    color: '#C0C0C0',
    fontSize: 14,
  },
});
