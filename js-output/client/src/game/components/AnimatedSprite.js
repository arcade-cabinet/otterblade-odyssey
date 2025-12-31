/**
 * @fileoverview Animated sprite component for sprite sheet rendering.
 * Handles frame-based animation with configurable rows/columns and playback speed.
 */
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
/**
 * Renders an animated sprite from a sprite sheet.
 * Uses UV offset animation for efficient GPU-based frame switching.
 */
export function AnimatedSprite({ texturePath, columns, rows, width, height, position, animation, flipX = false, onAnimationComplete, }) {
    const texture = useTexture(texturePath);
    const materialRef = useRef(null);
    const frameTimeRef = useRef(0);
    const currentFrameRef = useRef(0);
    // Configure texture for sprite sheet rendering
    useEffect(() => {
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.repeat.set(1 / columns, 1 / rows);
    }, [texture, columns, rows]);
    // Calculate UV offset for current frame
    const updateFrame = useCallback((frameIndex) => {
        const globalFrame = animation.startFrame + frameIndex;
        const col = globalFrame % columns;
        const row = Math.floor(globalFrame / columns);
        // UV origin is bottom-left, sprite sheets are typically top-left
        const offsetX = col / columns;
        const offsetY = 1 - (row + 1) / rows;
        texture.offset.set(offsetX, offsetY);
    }, [animation.startFrame, columns, rows, texture]);
    // Track animation name for reset detection
    const lastAnimationRef = useRef(animation.name);
    // Reset frame when animation changes and set initial frame
    useEffect(() => {
        if (lastAnimationRef.current !== animation.name) {
            currentFrameRef.current = 0;
            frameTimeRef.current = 0;
            lastAnimationRef.current = animation.name;
        }
        updateFrame(0);
    }, [updateFrame, animation.name]);
    // Animate frames
    useFrame((_, delta) => {
        if (!animation || animation.frameCount <= 1)
            return;
        frameTimeRef.current += delta;
        const frameDuration = 1 / animation.fps;
        if (frameTimeRef.current >= frameDuration) {
            frameTimeRef.current -= frameDuration;
            currentFrameRef.current++;
            if (currentFrameRef.current >= animation.frameCount) {
                if (animation.loop) {
                    currentFrameRef.current = 0;
                }
                else {
                    currentFrameRef.current = animation.frameCount - 1;
                    onAnimationComplete?.();
                }
            }
            updateFrame(currentFrameRef.current);
        }
    });
    // Handle horizontal flip via scale
    const scale = useMemo(() => {
        return [flipX ? -width : width, height, 1];
    }, [flipX, width, height]);
    return (React.createElement("mesh", { position: position, scale: scale },
        React.createElement("planeGeometry", { args: [1, 1] }),
        React.createElement("meshBasicMaterial", { ref: materialRef, map: texture, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide })));
}
/** Common animation definitions */
export const PLAYER_ANIMATIONS = {
    idle: {
        name: 'idle',
        startFrame: 0,
        frameCount: 4,
        fps: 8,
        loop: true,
    },
    run: {
        name: 'run',
        startFrame: 4,
        frameCount: 6,
        fps: 12,
        loop: true,
    },
    jump: {
        name: 'jump',
        startFrame: 10,
        frameCount: 3,
        fps: 10,
        loop: false,
    },
    fall: {
        name: 'fall',
        startFrame: 13,
        frameCount: 2,
        fps: 8,
        loop: true,
    },
    attack: {
        name: 'attack',
        startFrame: 15,
        frameCount: 4,
        fps: 16,
        loop: false,
    },
    hurt: {
        name: 'hurt',
        startFrame: 19,
        frameCount: 2,
        fps: 10,
        loop: false,
    },
    crouch: {
        name: 'crouch',
        startFrame: 21,
        frameCount: 2,
        fps: 8,
        loop: true,
    },
};
/** Enemy animation definitions */
export const ENEMY_ANIMATIONS = {
    idle: {
        name: 'idle',
        startFrame: 0,
        frameCount: 4,
        fps: 6,
        loop: true,
    },
    walk: {
        name: 'walk',
        startFrame: 4,
        frameCount: 4,
        fps: 8,
        loop: true,
    },
    attack: {
        name: 'attack',
        startFrame: 8,
        frameCount: 3,
        fps: 12,
        loop: false,
    },
    hurt: {
        name: 'hurt',
        startFrame: 11,
        frameCount: 2,
        fps: 10,
        loop: false,
    },
    death: {
        name: 'death',
        startFrame: 13,
        frameCount: 4,
        fps: 8,
        loop: false,
    },
};
