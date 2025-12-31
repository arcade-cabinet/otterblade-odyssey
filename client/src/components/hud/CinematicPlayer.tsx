/**
 * CinematicPlayer - Seamless full-screen video player for cinematics
 *
 * Features:
 * - Autoplay with muted fallback (browser policy)
 * - Smooth fade transitions
 * - Tap/click anywhere to skip (after brief delay)
 * - No ugly play buttons or loading states
 */

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useRef, useState } from 'react';
import { hapticLight } from '@/lib/capacitor';
import { brandColors } from '@/lib/theme';

// Import cinematics
import introVideo from '@/assets/videos/intro_cinematic_otter\'s_journey.mp4';
import outroVideo from '@/assets/videos/outro_victory_sunrise_scene.mp4';

export type CinematicType = 'intro' | 'outro' | 'chapter' | 'boss' | null;

interface CinematicPlayerProps {
  type: CinematicType;
  chapterId?: number;
  onComplete: () => void;
  skippable?: boolean;
}

const CINEMATIC_SOURCES: Record<string, string> = {
  intro: introVideo,
  outro: outroVideo,
};

export default function CinematicPlayer({
  type,
  onComplete,
  skippable = true,
}: CinematicPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'fade-in' | 'playing' | 'fade-out'>('fade-in');
  const [canSkip, setCanSkip] = useState(false);
  const hasCompletedRef = useRef(false);

  const videoSrc = type ? CINEMATIC_SOURCES[type] : null;

  // Complete the cinematic with fade out
  const completeCinematic = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    setPhase('fade-out');
    setTimeout(() => {
      onComplete();
    }, 600);
  }, [onComplete]);

  // Handle skip interaction
  const handleSkip = useCallback(() => {
    if (!canSkip || !skippable) return;
    hapticLight();
    completeCinematic();
  }, [canSkip, skippable, completeCinematic]);

  // Initialize video playback
  useEffect(() => {
    if (!videoSrc || !videoRef.current) return;

    const video = videoRef.current;
    hasCompletedRef.current = false;

    const startPlayback = async () => {
      try {
        // Try unmuted first for full experience
        video.muted = false;
        video.currentTime = 0;
        await video.play();
      } catch {
        // Browser blocked unmuted autoplay - try muted
        try {
          video.muted = true;
          await video.play();
        } catch {
          // Video completely blocked - just complete after showing the frame
          console.warn('Video autoplay blocked, skipping cinematic');
          setTimeout(completeCinematic, 2000);
        }
      }
    };

    // Fade in first, then start video
    const fadeInTimer = setTimeout(() => {
      setPhase('playing');
      startPlayback();
    }, 100);

    // Enable skip after 1.5 seconds (enough to see something)
    const skipTimer = setTimeout(() => {
      if (skippable) setCanSkip(true);
    }, 1500);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(skipTimer);
      video.pause();
    };
  }, [videoSrc, skippable, completeCinematic]);

  // Handle video end
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => completeCinematic();
    const handleError = () => {
      console.error('Video playback error');
      setTimeout(completeCinematic, 1000);
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [completeCinematic]);

  // Keyboard skip
  useEffect(() => {
    if (!canSkip || !skippable) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'Enter', 'Escape'].includes(e.code)) {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canSkip, skippable, handleSkip]);

  if (!type || !videoSrc) return null;

  return (
    <Box
      ref={containerRef}
      data-testid="cinematic-player"
      onClick={handleSkip}
      onTouchEnd={handleSkip}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: '#000',
        cursor: canSkip ? 'pointer' : 'default',
        opacity: phase === 'fade-in' ? 0 : phase === 'fade-out' ? 0 : 1,
        transition: 'opacity 0.6s ease-in-out',
      }}
    >
      {/* Video - fills screen */}
      <video
        ref={videoRef}
        src={videoSrc}
        playsInline
        preload="auto"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Subtle vignette overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Skip hint - subtle, appears after delay */}
      <Box
        sx={{
          position: 'absolute',
          bottom: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          opacity: canSkip ? 0.5 : 0,
          transition: 'opacity 0.5s ease',
          pointerEvents: 'none',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: brandColors.stoneBeige.dark,
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Tap to skip
        </Typography>
      </Box>
    </Box>
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
