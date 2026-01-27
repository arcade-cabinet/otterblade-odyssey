/**
 * Otterblade Odyssey - React Native + Babylon.js
 * Mobile-first 2.5D platformer
 */

import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HUD } from './src/components/HUD';
import { GameScene } from './src/scene/GameScene';
import { useStore } from './src/store/gameStore';

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.startScreen}>
      <Text style={styles.title}>Otterblade Odyssey</Text>
      <Text style={styles.subtitle}>A Redwall-inspired woodland epic</Text>
      <TouchableOpacity style={styles.startButton} onPress={onStart}>
        <Text style={styles.startButtonText}>Begin Journey</Text>
      </TouchableOpacity>
    </View>
  );
}

function GameOverScreen({ onRestart }: { onRestart: () => void }) {
  const score = useStore((s) => s.score);
  const bestScore = useStore((s) => s.bestScore);

  return (
    <View style={styles.gameOverScreen}>
      <Text style={styles.gameOverTitle}>Journey Ended</Text>
      <Text style={styles.scoreText}>Score: {score}</Text>
      <Text style={styles.bestScoreText}>Best: {bestScore}</Text>
      <TouchableOpacity style={styles.restartButton} onPress={onRestart}>
        <Text style={styles.startButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  const gameStarted = useStore((s) => s.gameStarted);
  const gameOver = useStore((s) => s.gameOver);
  const startGame = useStore((s) => s.startGame);
  const resetGame = useStore((s) => s.resetGame);

  const handleStart = () => {
    startGame();
  };

  const handleRestart = () => {
    resetGame();
    startGame();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {!gameStarted && <StartScreen onStart={handleStart} />}

      {gameStarted && !gameOver && (
        <>
          <GameScene />
          <HUD />
        </>
      )}

      {gameOver && <GameOverScreen onRestart={handleRestart} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a24',
  },
  startScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a24',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#E67E22',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#F4D03F',
    marginBottom: 50,
  },
  startButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    backgroundColor: '#E67E22',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  gameOverScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 26, 36, 0.95)',
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E67E22',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 24,
    color: '#F4D03F',
    marginBottom: 10,
  },
  bestScoreText: {
    fontSize: 18,
    color: '#8B6F47',
    marginBottom: 40,
  },
  restartButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    backgroundColor: '#E67E22',
    borderRadius: 10,
  },
});
