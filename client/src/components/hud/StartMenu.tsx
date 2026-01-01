/**
 * StartMenu - Brand-aligned main menu for Otterblade Odyssey
 *
 * Follows BRAND.md guidelines:
 * - Warm, woodland-epic aesthetic (NOT neon sci-fi)
 * - Storybook art style with lantern glow
 * - Practical, grounded materials
 * - FULLSCREEN immersion on game start
 */

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Fade from '@mui/material/Fade';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
// Import the prologue chapter plate as splash image
import splashImage from '@/assets/images/chapter-plates/prologue_village_chapter_plate.png';
import { useStore } from '@/game/store';
import { hapticMedium } from '@/lib/capacitor';
import { enterImmersiveMode, isFullscreenSupported } from '@/lib/fullscreen';
import { brandColors } from '@/lib/theme';

export default function StartMenu() {
  const gameStarted = useStore((s) => s.gameStarted);
  const bestScore = useStore((s) => s.bestScore);
  const bestDistance = useStore((s) => s.bestDistance);
  const startGame = useStore((s) => s.startGame);

  const [showContent, setShowContent] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    // Fade in content after a short delay
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (gameStarted) return null;

  const handleStartGame = async () => {
    if (isStarting) return;
    setIsStarting(true);

    await hapticMedium();

    // Enter fullscreen immersive mode - MUST be triggered by user interaction
    if (isFullscreenSupported()) {
      await enterImmersiveMode();
    }

    // Small delay for fullscreen transition to feel smooth
    setTimeout(() => {
      startGame();
    }, 100);
  };

  return (
    <Box
      data-testid="start-menu"
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 20,
        overflow: 'hidden',
      }}
    >
      {/* Background Image - Prologue Chapter Plate */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${splashImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.7)',
          zIndex: 0,
        }}
      />

      {/* Vignette overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse at center, transparent 30%, ${brandColors.nightSky}90 100%),
            linear-gradient(to bottom, transparent 40%, ${brandColors.nightSky}e0 100%)
          `,
          zIndex: 1,
        }}
      />

      {/* Content Container */}
      <Fade in={showContent} timeout={1000}>
        <Container
          maxWidth="sm"
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pb: { xs: 4, sm: 6 },
            px: { xs: 2, sm: 4 },
          }}
        >
          {/* Title */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
              textAlign: 'center',
              color: brandColors.honeyGold.light,
              textShadow: `
                0 0 30px ${brandColors.lanternGlow}60,
                0 2px 4px rgba(0,0,0,0.8),
                0 4px 8px rgba(0,0,0,0.4)
              `,
              mb: 1,
              lineHeight: 1.1,
            }}
          >
            Otterblade Odyssey
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="caption"
            sx={{
              color: brandColors.stoneBeige.main,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              letterSpacing: '0.25em',
              mb: 3,
              opacity: 0.9,
            }}
          >
            Zephyros Rising
          </Typography>

          {/* Description */}
          <Typography
            variant="body1"
            sx={{
              color: brandColors.stoneBeige.light,
              textAlign: 'center',
              maxWidth: '36rem',
              mb: 4,
              fontSize: { xs: '0.95rem', sm: '1.1rem' },
              lineHeight: 1.7,
              textShadow: '0 2px 4px rgba(0,0,0,0.6)',
              px: 2,
            }}
          >
            A woodland-epic adventure awaits. Play as Finn, a brave otter warrior wielding the
            legendary Otterblade, defending Willowmere Hearthhold against the storm hawk Zephyros.
          </Typography>

          {/* Start Button */}
          <Button
            variant="outlined"
            size="large"
            onClick={handleStartGame}
            data-testid="button-start-game"
            sx={{
              px: { xs: 4, sm: 6 },
              py: 1.5,
              fontSize: { xs: '1rem', sm: '1.125rem' },
              borderColor: brandColors.honeyGold.main,
              color: brandColors.honeyGold.light,
              borderWidth: 2,
              borderRadius: 1,
              backgroundColor: 'rgba(26, 26, 46, 0.6)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderWidth: 2,
                borderColor: brandColors.honeyGold.light,
                backgroundColor: `${brandColors.honeyGold.main}20`,
                boxShadow: `0 0 30px ${brandColors.lanternGlow}50`,
                transform: 'scale(1.02)',
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
            }}
          >
            Begin Your Odyssey
          </Button>

          {/* Best Score Display */}
          {bestScore > 0 && (
            <Fade in timeout={500}>
              <Paper
                elevation={0}
                sx={{
                  mt: 4,
                  px: 3,
                  py: 2,
                  backgroundColor: `${brandColors.darkStone}90`,
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${brandColors.stoneBeige.dark}40`,
                  borderRadius: 2,
                  width: '100%',
                  maxWidth: '20rem',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'center',
                    color: brandColors.stoneBeige.dark,
                    mb: 1.5,
                    letterSpacing: '0.15em',
                  }}
                >
                  Previous Journey
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ color: brandColors.stoneBeige.main }}>
                    Best Score
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: brandColors.honeyGold.main,
                      fontWeight: 600,
                    }}
                  >
                    {bestScore.toLocaleString()}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: brandColors.stoneBeige.main }}>
                    Furthest Distance
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: brandColors.honeyGold.main,
                      fontWeight: 600,
                    }}
                  >
                    {Math.floor(bestDistance)}m
                  </Typography>
                </Box>
              </Paper>
            </Fade>
          )}

          {/* Version tag */}
          <Typography
            variant="caption"
            sx={{
              mt: 3,
              color: brandColors.stoneBeige.dark,
              fontSize: '0.7rem',
              opacity: 0.7,
            }}
          >
            Alpha Build · v1.0.0
          </Typography>
        </Container>
      </Fade>
    </Box>
  );
}
