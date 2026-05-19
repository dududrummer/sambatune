import scaleShapesRaw from '../../diagramas/Shapes e arpejos/shapes_escalas.json';
import {
  CHROMATIC_NOTES,
  getNoteIndex,
  noteIndexAtFret,
  parseChord,
} from './music-theory';
import type { Voicing } from './chord-finder';

interface ScaleDefinition {
  id: string;
  name: string;
  shortName: string;
  intervals: number[];
  qualities: string[];
}

interface ScaleRegion {
  id: string;
  label: string;
  startFret: number;
  endFret: number;
}

interface ScaleShapesConfig {
  regions: ScaleRegion[];
  scales: ScaleDefinition[];
}

export interface ScaleShapeResult {
  id: string;
  name: string;
  shortName: string;
  root: string;
  noteNames: string[];
  intervals: number[];
  shapes: Array<{
    region: ScaleRegion;
    voicing: Voicing;
  }>;
}

const SCALE_CONFIG = scaleShapesRaw as ScaleShapesConfig;

function normalizeInterval(interval: number): number {
  return ((interval % 12) + 12) % 12;
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function scaleMatchesChord(scale: ScaleDefinition, chordIntervals: number[], qualityName: string) {
  if (scale.qualities.includes(qualityName)) return true;
  return chordIntervals.every((interval) => scale.intervals.includes(interval));
}

function buildScaleVoicing(
  scale: ScaleDefinition,
  rootIndex: number,
  tuning: string[],
  region: ScaleRegion,
): Voicing | null {
  const scaleNotes = new Set(scale.intervals.map((interval) => (rootIndex + interval) % 12));
  const scaleFrets = tuning.map((openNote) => {
    const openIndex = getNoteIndex(openNote);
    if (openIndex === -1) return [];

    const frets: number[] = [];
    for (let fret = region.startFret; fret <= region.endFret; fret++) {
      if (scaleNotes.has(noteIndexAtFret(openIndex, fret))) {
        frets.push(fret);
      }
    }
    return frets;
  });

  if (!scaleFrets.some((stringFrets) => stringFrets.length > 0)) return null;

  let rootString: number | undefined;
  let rootFret: number | undefined;

  for (let stringIndex = 0; stringIndex < scaleFrets.length; stringIndex++) {
    const fret = scaleFrets[stringIndex].find((candidate) => {
      const openIndex = getNoteIndex(tuning[stringIndex]);
      return openIndex !== -1 && noteIndexAtFret(openIndex, candidate) === rootIndex;
    });
    if (fret !== undefined) {
      rootString = stringIndex;
      rootFret = fret;
      break;
    }
  }

  const fallbackFrets = scaleFrets.map((stringFrets) => stringFrets[0] ?? -1);
  const pressed = fallbackFrets.filter((fret) => fret > 0);
  const startingFret = region.startFret === 0 ? 1 : region.startFret;

  return {
    frets: fallbackFrets,
    startingFret,
    barres: [],
    mutedStrings: fallbackFrets
      .map((fret, index) => (fret === -1 ? index : -1))
      .filter((index) => index !== -1),
    omitted: [],
    fingerCount: pressed.length,
    arpeggioFrets: scaleFrets,
    rootString,
    rootFret,
  };
}

export function searchScaleShapes(chordName: string, tuning: string[]): ScaleShapeResult[] {
  const parsed = parseChord(chordName);
  if (!parsed) return [];

  const rootIndex = getNoteIndex(parsed.root);
  if (rootIndex === -1) return [];

  const chordIntervals = uniqueSorted(
    parsed.noteIndices.map((noteIndex) => normalizeInterval(noteIndex - rootIndex)),
  );

  return SCALE_CONFIG.scales
    .filter((scale) => scaleMatchesChord(scale, chordIntervals, parsed.qualityName))
    .map((scale) => {
      const noteNames = scale.intervals.map(
        (interval) => CHROMATIC_NOTES[(rootIndex + interval) % 12],
      );
      const shapes = SCALE_CONFIG.regions
        .map((region) => {
          const voicing = buildScaleVoicing(scale, rootIndex, tuning, region);
          return voicing ? { region, voicing } : null;
        })
        .filter((shape): shape is { region: ScaleRegion; voicing: Voicing } => shape !== null);

      return {
        id: scale.id,
        name: `${parsed.root} ${scale.name}`,
        shortName: scale.shortName,
        root: parsed.root,
        noteNames,
        intervals: scale.intervals,
        shapes,
      };
    })
    .filter((result) => result.shapes.length > 0);
}
