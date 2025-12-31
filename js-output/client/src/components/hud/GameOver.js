/**
 * GameOver Menu - Brand-aligned game over screen
 *
 * Follows BRAND.md guidelines:
 * - Warm, woodland-epic aesthetic (NOT neon sci-fi)
 * - Storybook art style
 */
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Fade from '@mui/material/Fade';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useStore } from '@/game/store';
import { hapticError, hapticMedium } from '@/lib/capacitor';
import { brandColors } from '@/lib/theme';
export default function GameOverMenu() {
    const gameOver = useStore((s) => s.gameOver);
    const score = useStore((s) => s.score);
    const distance = useStore((s) => s.distance);
    const bankedShards = useStore((s) => s.bankedShards);
    const checkpointSeen = useStore((s) => s.checkpointSeen);
    const respawn = useStore((s) => s.respawnFromCheckpoint);
    const startGame = useStore((s) => s.startGame);
    if (!gameOver)
        return null;
    const canRespawn = checkpointSeen >= 0;
    const handleRespawn = async () => {
        await hapticMedium();
        respawn();
    };
    const handleNewRun = async () => {
        await hapticError(); // Intentional - emphasizes starting fresh
        startGame();
    };
    return (React.createElement(Fade, { in: true, timeout: 500 },
        React.createElement(Box, { "data-testid": "game-over-menu", sx: {
                position: 'absolute',
                inset: 0,
                backgroundColor: `${brandColors.nightSky}f0`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                px: 3,
            } },
            React.createElement(Container, { maxWidth: "sm", sx: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                } },
                React.createElement(Typography, { variant: "h2", component: "h1", sx: {
                        fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                        textAlign: 'center',
                        color: brandColors.crimson,
                        textShadow: `
                0 0 20px ${brandColors.crimson}80,
                0 2px 4px rgba(0,0,0,0.8)
              `,
                        mb: 1,
                    } }, "Blade Broken"),
                React.createElement(Typography, { variant: "body1", sx: {
                        color: brandColors.stoneBeige.main,
                        textAlign: 'center',
                        mb: 1,
                    } }, "The otter warrior has fallen. Will you rise again?"),
                React.createElement(Typography, { variant: "caption", sx: {
                        color: brandColors.stoneBeige.dark,
                        letterSpacing: '0.2em',
                        mb: 3,
                    } }, "Journey Complete"),
                React.createElement(Paper, { elevation: 0, sx: {
                        px: 3,
                        py: 2.5,
                        backgroundColor: `${brandColors.darkStone}90`,
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${brandColors.stoneBeige.dark}40`,
                        borderRadius: 2,
                        width: '100%',
                        maxWidth: '24rem',
                        mb: 4,
                    } },
                    React.createElement(Box, { sx: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 1.5,
                        } },
                        React.createElement(Typography, { variant: "body2", sx: { color: brandColors.stoneBeige.main } }, "Score"),
                        React.createElement(Typography, { variant: "body2", sx: {
                                color: brandColors.honeyGold.main,
                                fontWeight: 600,
                            } }, score.toLocaleString())),
                    React.createElement(Box, { sx: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 1.5,
                        } },
                        React.createElement(Typography, { variant: "body2", sx: { color: brandColors.stoneBeige.main } }, "Distance Traveled"),
                        React.createElement(Typography, { variant: "body2", sx: {
                                color: brandColors.honeyGold.main,
                                fontWeight: 600,
                            } },
                            Math.floor(distance),
                            "m")),
                    React.createElement(Box, { sx: { display: 'flex', justifyContent: 'space-between' } },
                        React.createElement(Typography, { variant: "body2", sx: { color: brandColors.stoneBeige.main } }, "Shards Preserved"),
                        React.createElement(Typography, { variant: "body2", sx: {
                                color: brandColors.lanternGlow,
                                fontWeight: 600,
                            } }, bankedShards))),
                React.createElement(Box, { sx: {
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                    } },
                    canRespawn && (React.createElement(Button, { variant: "contained", onClick: handleRespawn, "data-testid": "button-respawn", sx: {
                            px: 4,
                            py: 1.5,
                            backgroundColor: brandColors.forestGreen.main,
                            borderColor: brandColors.forestGreen.light,
                            '&:hover': {
                                backgroundColor: brandColors.forestGreen.light,
                                boxShadow: `0 0 20px ${brandColors.forestGreen.main}60`,
                            },
                        } }, "Return to Shrine")),
                    React.createElement(Button, { variant: "outlined", onClick: handleNewRun, "data-testid": "button-restart", sx: {
                            px: 4,
                            py: 1.5,
                            borderColor: brandColors.honeyGold.main,
                            color: brandColors.honeyGold.main,
                            '&:hover': {
                                borderColor: brandColors.honeyGold.light,
                                backgroundColor: `${brandColors.honeyGold.main}15`,
                                boxShadow: `0 0 20px ${brandColors.honeyGold.main}40`,
                            },
                        } }, "Begin Anew")),
                canRespawn && (React.createElement(Typography, { variant: "caption", sx: {
                        mt: 3,
                        color: brandColors.crimson,
                        opacity: 0.8,
                    } }, "Shrine restoration costs 900 score"))))));
}
