import prologuePlate from "../assets/images/chapter-plates/prologue_village_chapter_plate.png";
import abbeyApproachPlate from "../assets/images/chapter-plates/abbey_approach_chapter_plate.png";
import gatehousePlate from "../assets/images/chapter-plates/gatehouse_bridge_chapter_plate.png";
import greatHallPlate from "../assets/images/chapter-plates/great_hall_oath_chapter_plate.png";
import libraryPlate from "../assets/images/chapter-plates/library_map_table_chapter_plate.png";
import dungeonPlate from "../assets/images/chapter-plates/dungeon_descent_chapter_plate.png";
import courtyardPlate from "../assets/images/chapter-plates/courtyard_rally_chapter_plate.png";
import rooftopPlate from "../assets/images/chapter-plates/rooftop_wind_chapter_plate.png";
import finalAscentPlate from "../assets/images/chapter-plates/final_ascent_chapter_plate.png";
import epiloguePlate from "../assets/images/chapter-plates/epilogue_victory_chapter_plate.png";

import abbeyExteriorBg from "../assets/images/parallax/abbey_exterior_parallax_background.png";
import abbeyInteriorBg from "../assets/images/parallax/abbey_interior_parallax_background.png";
import dungeonBg from "../assets/images/parallax/dungeon_parallax_background.png";
import courtyardBg from "../assets/images/parallax/courtyard_parallax_background.png";
import rooftopsBg from "../assets/images/parallax/rooftops_parallax_background.png";
import outerRuinsBg from "../assets/images/parallax/outer_ruins_parallax_background.png";

import introVideo from "../assets/videos/intro_cinematic_otter's_journey.mp4";
import outroVideo from "../assets/videos/outro_victory_sunrise_scene.mp4";

export const CHAPTER_PLATES: Record<number, string> = {
  0: prologuePlate,
  1: abbeyApproachPlate,
  2: gatehousePlate,
  3: greatHallPlate,
  4: libraryPlate,
  5: dungeonPlate,
  6: courtyardPlate,
  7: rooftopPlate,
  8: finalAscentPlate,
  9: epiloguePlate,
};

export const PARALLAX_BACKGROUNDS: Record<string, string> = {
  abbey_exterior_parallax_background: abbeyExteriorBg,
  abbey_interior_parallax_background: abbeyInteriorBg,
  dungeon_parallax_background: dungeonBg,
  courtyard_parallax_background: courtyardBg,
  rooftops_parallax_background: rooftopsBg,
  outer_ruins_parallax_background: outerRuinsBg,
};

export const VIDEOS = {
  intro: introVideo,
  outro: outroVideo,
};

export function getChapterPlate(chapterId: number): string {
  return CHAPTER_PLATES[chapterId] || prologuePlate;
}

export function getParallaxBackground(filename: string): string {
  const key = filename.replace(".png", "");
  return PARALLAX_BACKGROUNDS[key] || abbeyExteriorBg;
}

export {
  prologuePlate,
  abbeyApproachPlate,
  gatehousePlate,
  greatHallPlate,
  libraryPlate,
  dungeonPlate,
  courtyardPlate,
  rooftopPlate,
  finalAscentPlate,
  epiloguePlate,
  abbeyExteriorBg,
  abbeyInteriorBg,
  dungeonBg,
  courtyardBg,
  rooftopsBg,
  outerRuinsBg,
  introVideo,
  outroVideo,
};
