import { useStore } from "./store";
import { useMemo } from "react";

import abbeyExteriorBg from "@assets/generated_images/abbey_exterior_parallax_background.png";
import abbeyInteriorBg from "@assets/generated_images/abbey_interior_parallax_background.png";
import dungeonBg from "@assets/generated_images/dungeon_parallax_background.png";
import courtyardBg from "@assets/generated_images/courtyard_parallax_background.png";
import rooftopsBg from "@assets/generated_images/rooftops_parallax_background.png";
import outerRuinsBg from "@assets/generated_images/outer_ruins_parallax_background.png";

const BIOME_BACKGROUNDS = [
  abbeyExteriorBg,
  abbeyInteriorBg,
  dungeonBg,
  courtyardBg,
  rooftopsBg,
  outerRuinsBg,
];

export function ParallaxBackground() {
  const playerX = useStore((s) => s.playerX);
  const biomeIndex = useStore((s) => s.biomeIndex);
  
  const backgroundImage = useMemo(() => {
    return BIOME_BACKGROUNDS[biomeIndex % BIOME_BACKGROUNDS.length];
  }, [biomeIndex]);

  const parallaxOffset = useMemo(() => {
    return (playerX * 0.1) % 100;
  }, [playerX]);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: -1 }}
      data-testid="parallax-background"
    >
      {/* Deep background layer - slowest parallax */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundPositionX: `${-parallaxOffset * 0.3}%`,
          filter: "blur(2px) brightness(0.7)",
          transform: "scale(1.1)",
        }}
      />
      
      {/* Mid background layer - medium parallax */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-80"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundPositionX: `${-parallaxOffset * 0.6}%`,
          filter: "brightness(0.85)",
        }}
      />

      {/* Atmospheric overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </div>
  );
}
