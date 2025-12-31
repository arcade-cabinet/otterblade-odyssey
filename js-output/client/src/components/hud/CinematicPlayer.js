/**
 * CinematicPlayer - Immersive storybook-style cinematic player
 *
 * Designed to feel like a natural part of the game world:
 * - Storybook page frame with decorative corners
 * - Warm vignette matching brand aesthetic
 * - Firefly motes for magical atmosphere
 * - Smooth page-turn style transitions
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useRef, useState } from 'react';
// Import cinematics
import introVideo from '@/assets/videos/intro_cinematic_otters_journey.mp4';
import outroVideo from '@/assets/videos/outro_victory_sunrise_scene.mp4';
import { hapticLight } from '@/lib/capacitor';
import { brandColors } from '@/lib/theme';
/** Pre-computed firefly configurations for stable keys */
const FIREFLY_CONFIGS = Array.from({ length: 12 }).map((_, i) => ({
    id: `firefly-${i}`,
    left: `${10 + ((i * 7) % 80)}%`,
    top: `${10 + ((i * 11) % 80)}%`,
    animation: `fireflyFloat${i % 4}`,
    duration: 8 + (i % 6),
    delay: (i * 0.4) % 4,
}));
const CINEMATIC_SOURCES = {
    intro: introVideo,
    outro: outroVideo,
};
const CINEMATIC_TITLES = {
    intro: { title: 'Otterblade Odyssey', subtitle: 'A Tale Begins...' },
    outro: { title: 'Victory', subtitle: 'The Everember Rekindled' },
};
/** Decorative corner component */
function StoryCorner({ position }) {
    const positionStyles = {
        tl: { top: 0, left: 0 },
        tr: { top: 0, right: 0 },
        bl: { bottom: 0, left: 0 },
        br: { bottom: 0, right: 0 },
    };
    const borderStyles = {
        tl: {
            borderTop: '2px solid',
            borderLeft: '2px solid',
            borderBottom: 'none',
            borderRight: 'none',
        },
        tr: {
            borderTop: '2px solid',
            borderRight: '2px solid',
            borderBottom: 'none',
            borderLeft: 'none',
        },
        bl: {
            borderBottom: '2px solid',
            borderLeft: '2px solid',
            borderTop: 'none',
            borderRight: 'none',
        },
        br: {
            borderBottom: '2px solid',
            borderRight: '2px solid',
            borderTop: 'none',
            borderLeft: 'none',
        },
    };
    return (React.createElement(Box, { sx: {
            position: 'absolute',
            width: { xs: 24, sm: 40, md: 56 },
            height: { xs: 24, sm: 40, md: 56 },
            ...positionStyles[position],
            ...borderStyles[position],
            borderColor: `${brandColors.honeyGold.main}50`,
            pointerEvents: 'none',
        } }));
}
/** Ambient firefly particles */
function FireflyMotes() {
    return (React.createElement(Box, { sx: {
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            opacity: 0.6,
        } },
        FIREFLY_CONFIGS.map((config) => (React.createElement(Box, { key: config.id, sx: {
                position: 'absolute',
                width: { xs: 2, sm: 3 },
                height: { xs: 2, sm: 3 },
                borderRadius: '50%',
                backgroundColor: brandColors.lanternGlow,
                boxShadow: `0 0 8px ${brandColors.lanternGlow}, 0 0 16px ${brandColors.honeyGold.main}`,
                left: config.left,
                top: config.top,
                animation: `${config.animation} ${config.duration}s ease-in-out infinite`,
                animationDelay: `${config.delay}s`,
            } }))),
        React.createElement("style", null, `
        @keyframes fireflyFloat0 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(20px, -30px) scale(1.2); opacity: 0.8; }
          50% { transform: translate(-10px, -50px) scale(0.8); opacity: 0.5; }
          75% { transform: translate(30px, -20px) scale(1.1); opacity: 0.9; }
        }
        @keyframes fireflyFloat1 {
          0%, 100% { transform: translate(0, 0) scale(0.8); opacity: 0.4; }
          33% { transform: translate(-25px, -40px) scale(1.3); opacity: 0.7; }
          66% { transform: translate(15px, -60px) scale(0.9); opacity: 1; }
        }
        @keyframes fireflyFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1.1); opacity: 0.5; }
          50% { transform: translate(-40px, -35px) scale(0.7); opacity: 0.8; }
        }
        @keyframes fireflyFloat3 {
          0%, 100% { transform: translate(0, 0) scale(0.9); opacity: 0.6; }
          40% { transform: translate(35px, -45px) scale(1.2); opacity: 0.4; }
          80% { transform: translate(-20px, -25px) scale(1); opacity: 0.9; }
        }
      `)));
}
export default function CinematicPlayer({ type, onComplete, skippable = true, }) {
    const videoRef = useRef(null);
    const [phase, setPhase] = useState('enter');
    const [canSkip, setCanSkip] = useState(false);
    const [showTitle, setShowTitle] = useState(true);
    const hasCompletedRef = useRef(false);
    const videoSrc = type ? CINEMATIC_SOURCES[type] : null;
    const titles = type ? CINEMATIC_TITLES[type] : null;
    const completeCinematic = useCallback(() => {
        if (hasCompletedRef.current)
            return;
        hasCompletedRef.current = true;
        setPhase('exit');
        setTimeout(onComplete, 800);
    }, [onComplete]);
    const handleInteraction = useCallback(() => {
        if (!canSkip || !skippable)
            return;
        hapticLight();
        completeCinematic();
    }, [canSkip, skippable, completeCinematic]);
    // Video playback initialization
    useEffect(() => {
        if (!videoSrc || !videoRef.current)
            return;
        const video = videoRef.current;
        hasCompletedRef.current = false;
        const startPlayback = async () => {
            try {
                video.muted = false;
                video.currentTime = 0;
                await video.play();
            }
            catch {
                try {
                    video.muted = true;
                    await video.play();
                }
                catch {
                    console.warn('Video autoplay blocked');
                    setTimeout(completeCinematic, 3000);
                }
            }
        };
        // Sequence: fade in → show title → fade title → play video
        const enterTimer = setTimeout(() => {
            setPhase('playing');
            startPlayback();
        }, 600);
        const titleTimer = setTimeout(() => {
            setShowTitle(false);
        }, 2500);
        const skipTimer = setTimeout(() => {
            if (skippable)
                setCanSkip(true);
        }, 1800);
        return () => {
            clearTimeout(enterTimer);
            clearTimeout(titleTimer);
            clearTimeout(skipTimer);
            video.pause();
        };
    }, [videoSrc, skippable, completeCinematic]);
    // Video events
    useEffect(() => {
        const video = videoRef.current;
        if (!video)
            return;
        const handleEnded = () => completeCinematic();
        const handleError = () => setTimeout(completeCinematic, 1500);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('error', handleError);
        return () => {
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('error', handleError);
        };
    }, [completeCinematic]);
    // Keyboard controls
    useEffect(() => {
        if (!canSkip || !skippable)
            return;
        const handleKeyDown = (e) => {
            if (['Space', 'Enter', 'Escape'].includes(e.code)) {
                e.preventDefault();
                handleInteraction();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canSkip, skippable, handleInteraction]);
    if (!type || !videoSrc)
        return null;
    return (React.createElement(Box, { "data-testid": "cinematic-player", role: "dialog", "aria-modal": "true", "aria-label": `${titles?.title || 'Cinematic'} - ${canSkip ? 'Press Space, Enter, or tap to skip' : 'Playing'}`, tabIndex: 0, onClick: handleInteraction, onTouchEnd: (e) => {
            e.preventDefault();
            handleInteraction();
        }, sx: {
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: brandColors.nightSky,
            cursor: canSkip ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 2, sm: 4, md: 6 },
            opacity: phase === 'enter' ? 0 : phase === 'exit' ? 0 : 1,
            transition: 'opacity 0.8s ease-in-out',
            outline: 'none',
        } },
        React.createElement(Box, { sx: {
                position: 'relative',
                width: '100%',
                height: '100%',
                maxWidth: '1400px',
                maxHeight: '900px',
                border: `1px solid ${brandColors.honeyGold.dark}40`,
                borderRadius: 1,
                overflow: 'hidden',
                boxShadow: `
            inset 0 0 100px ${brandColors.nightSky},
            0 0 60px ${brandColors.nightSky},
            0 0 2px ${brandColors.honeyGold.main}30
          `,
            } },
            React.createElement(Box, { sx: {
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#000',
                } },
                React.createElement("video", { ref: videoRef, src: videoSrc, playsInline: true, preload: "auto", style: {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    } })),
            React.createElement(Box, { sx: {
                    position: 'absolute',
                    inset: 0,
                    background: `
              radial-gradient(ellipse at center, transparent 40%, ${brandColors.nightSky}90 100%),
              linear-gradient(to bottom, ${brandColors.nightSky}40 0%, transparent 15%, transparent 85%, ${brandColors.nightSky}60 100%)
            `,
                    pointerEvents: 'none',
                } }),
            React.createElement(StoryCorner, { position: "tl" }),
            React.createElement(StoryCorner, { position: "tr" }),
            React.createElement(StoryCorner, { position: "bl" }),
            React.createElement(StoryCorner, { position: "br" }),
            React.createElement(FireflyMotes, null),
            titles && (React.createElement(Box, { sx: {
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `radial-gradient(ellipse at center, ${brandColors.nightSky}80 0%, ${brandColors.nightSky}e0 100%)`,
                    opacity: showTitle ? 1 : 0,
                    transition: 'opacity 1.2s ease-out',
                    pointerEvents: 'none',
                } },
                React.createElement(Typography, { variant: "h1", sx: {
                        fontFamily: '"IM Fell English SC", "Times New Roman", serif',
                        fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
                        color: brandColors.honeyGold.light,
                        textShadow: `
                  0 0 40px ${brandColors.lanternGlow}60,
                  0 2px 4px rgba(0,0,0,0.9)
                `,
                        letterSpacing: '0.05em',
                        mb: 2,
                        textAlign: 'center',
                        px: 2,
                    } }, titles.title),
                React.createElement(Typography, { variant: "body1", sx: {
                        fontFamily: '"Crimson Pro", Georgia, serif',
                        fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                        color: brandColors.stoneBeige.main,
                        fontStyle: 'italic',
                        textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                        textAlign: 'center',
                        px: 2,
                    } }, titles.subtitle))),
            React.createElement(Box, { sx: {
                    position: 'absolute',
                    bottom: { xs: 12, sm: 20 },
                    right: { xs: 12, sm: 20 },
                    opacity: canSkip ? 0.4 : 0,
                    transition: 'opacity 0.8s ease',
                    pointerEvents: 'none',
                } },
                React.createElement(Typography, { sx: {
                        fontFamily: '"Crimson Pro", Georgia, serif',
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        color: brandColors.stoneBeige.dark,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                    } }, "tap to continue"))),
        React.createElement(Box, { sx: {
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(ellipse at 50% 120%, ${brandColors.lanternGlow}10 0%, transparent 50%)`,
                pointerEvents: 'none',
            } })));
}
export function useCinematicPlayer() {
    const [currentCinematic, setCurrentCinematic] = useState(null);
    const [chapterId, setChapterId] = useState();
    const playCinematic = useCallback((type, chapter) => {
        setChapterId(chapter);
        setCurrentCinematic(type);
    }, []);
    const stopCinematic = useCallback(() => {
        setCurrentCinematic(null);
        setChapterId(undefined);
    }, []);
    return { currentCinematic, chapterId, playCinematic, stopCinematic };
}
