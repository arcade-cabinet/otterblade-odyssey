/**
 * CinematicPlayer - Full-screen video player for intro/outro/chapter cinematics
 *
 * Handles:
 * - Intro cinematic before StartMenu
 * - Outro cinematic after final boss
 * - Chapter opening cinematics (future)
 * - Boss arrival cinematics (future)
 */

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useRef, useState } from 'react';
import { hapticMedium } from '@/lib/capacitor';
import { brandColors } from '@/lib/theme';

// Import cinematics
import introVideo from '@/assets/videos/intro_cinematic_otter\'s_journey.mp4';
import outroVideo from '@/assets/videos/outro_victory_sunrise_scene.mp4';

export type CinematicType = 'intro' | 'outro' | 'chapter' | 'boss' | null;

interface CinematicPlayerProps {
  /** Type of cinematic to play */
  type: CinematicType;
  /** Optional chapter ID for chapter/boss cinematics */
  chapterId?: number;
  /** Callback when cinematic ends or is skipped */
  onComplete: () => void;
  /** Whether the cinematic can be skipped */
  skippable?: boolean;
}

/** Map cinematic types to video sources */
const CINEMATIC_SOURCES: Record<string, string> = {
  intro: introVideo,
  outro: outroVideo,
  // Chapter and boss cinematics would be added here
  // These would be dynamically loaded based on chapterId
};

export default function CinematicPlayer({
  type,
  chapterId,
  onComplete,
  skippable = true,
}: CinematicPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Get video source based on type
  const videoSrc = type ? CINEMATIC_SOURCES[type] : null;

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    setFadeOut(true);
    setTimeout(() => {
      onComplete();
    }, 500);
  }, [onComplete]);

  // Handle skip
  const handleSkip = useCallback(async () => {
    await hapticMedium();
    handleVideoEnd();
  }, [handleVideoEnd]);

  // Play video on mount
  useEffect(() => {
    if (!videoSrc || !videoRef.current) return;

    const video = videoRef.current;

    const playVideo = async () => {
      try {
        video.currentTime = 0;
        await video.play();
        setIsPlaying(true);
      } catch (error) {
        console.warn('Video autoplay blocked, showing skip option:', error);
        setShowSkip(true);
      }
    };

    playVideo();

    // Show skip button after delay
    const skipTimer = setTimeout(() => {
      if (skippable) setShowSkip(true);
    }, 2000);

    return () => {
      clearTimeout(skipTimer);
      video.pause();
    };
  }, [videoSrc, skippable]);

  // Handle keyboard skip
  useEffect(() => {
    if (!skippable || !showSkip) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [skippable, showSkip, handleSkip]);

  if (!type || !videoSrc) return null;

  return (
    <Fade in={!fadeOut} timeout={500}>
      <Box
        data-testid="cinematic-player"
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => showSkip && skippable && handleSkip()}
      >
        {/* Video */}
        <video
          ref={videoRef}
          src={videoSrc}
          onEnded={handleVideoEnd}
          onError={() => {
            console.error('Video failed to load');
            setShowSkip(true);
          }}
          playsInline
          muted={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Skip button */}
        <Fade in={showSkip && skippable}>
          <Box
            sx={{
              position: 'absolute',
              bottom: { xs: 24, sm: 40 },
              right: { xs: 24, sm: 40 },
            }}
          >
            <Button
              variant="outlined"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleSkip();
              }}
              sx={{
                borderColor: brandColors.stoneBeige.main,
                color: brandColors.stoneBeige.main,
                opacity: 0.8,
                fontSize: '0.75rem',
                px: 2,
                py: 0.5,
                '&:hover': {
                  borderColor: brandColors.honeyGold.main,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  opacity: 1,
                },
              }}
            >
              Skip →
            </Button>
          </Box>
        </Fade>

        {/* Loading/error state */}
        {!isPlaying && !showSkip && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: brandColors.stoneBeige.dark,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              Loading...
            </Typography>
          </Box>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
        `}</style>
      </Box>
    </Fade>
  );
}

/**
 * Hook for managing cinematic playback state
 */
export function useCinematicPlayer() {
  const [currentCinematic, setCurrentCinematic] = useState<CinematicType>(null);
  const [chapterId, setChapterId] = useState<number | undefined>();

  const playCinematic = useCallback((type: CinematicType, chapter?: number) => {
    setChapterId(chapter);
    setCurrentCinematic(type);
  }, []);

  const stopCinematic = useCallback(() => {
    setCurrentCinematic(null);
    setChapterId(undefined);
  }, []);

  return {
    currentCinematic,
    chapterId,
    playCinematic,
    stopCinematic,
  };
}
