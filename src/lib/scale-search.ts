import scaleShapesRaw from '../../diagramas/Shapes e arpejos/shapes_escalas.json';
import { CHROMATIC_NOTES, getNoteIndex, noteIndexAtFret, parseChord } from './music-theory';
import { searchVoicings } from './arpeggio-search';
import type { Voicing } from './chord-finder';

type ShapeByString = Record<'1' | '2' | '3' | '4', number[]>;

interface ModeOptionDefinition {
  id: string;
  name: string;
  scaleDegree: number;
  parentScaleOffset: number;
  formMode: string;
  formRootOffset: number;
  description: string;
}

interface ModeShapeDefinition {
  id: string;
  mode: string;
  formula: number[];
  shape: ShapeByString;
}

interface ScaleShapesConfig {
  modesByChordQuality: Record<string, ModeOptionDefinition[]>;
  modeShapes: ModeShapeDefinition[];
}

export interface ScalePosition {
  id: string;
  label: string;
  voicing: Voicing;
  lowestString: number;
  lowestFret: number;
  lowestNote: string;
}

export interface ScaleOptionResult {
  id: string;
  name: string;
  parentScaleName: string;
  formLabel: string;
  description: string;
  noteNames: string[];
  voicing: Voicing;
}

const SCALE_CONFIG = scaleShapesRaw as ScaleShapesConfig;

function normalizeInterval(interval: number): number {
  return ((interval % 12) + 12) % 12;
}

function noteName(index: number): string {
  return CHROMATIC_NOTES[normalizeInterval(index)] ?? 'C';
}

function getQualityBucket(qualityName: string): string {
  if (qualityName.includes('Menor 7b5') || qualityName.includes('Menor b5')) return 'halfDiminished';
  if (qualityName.includes('Diminuto')) return 'diminished';
  if (qualityName.includes('Dominante')) return 'dominant';
  if (qualityName.includes('Menor 7')) return 'minor7';
  if (qualityName.includes('Menor')) return 'minor';
  if (qualityName.includes('Maior 7')) return 'major7';
  if (qualityName.includes('Maior') || qualityName === 'Add9') return 'major';
  return 'major';
}

function getModeShape(mode: string): ModeShapeDefinition | undefined {
  return SCALE_CONFIG.modeShapes.find((shape) => shape.mode === mode);
}

function getLowestPlayedNote(voicing: Voicing, tuning: string[]): {
  string: number;
  fret: number;
  noteIndex: number;
} | null {
  for (let stringIndex = 0; stringIndex < voicing.frets.length; stringIndex++) {
    const fret = voicing.frets[stringIndex];
    if (fret < 0) continue;
    const openIndex = getNoteIndex(tuning[stringIndex]);
    if (openIndex === -1) continue;
    return {
      string: stringIndex,
      fret,
      noteIndex: noteIndexAtFret(openIndex, fret),
    };
  }
  return null;
}

function fretListToChordFrets(shape: number[][]): number[] {
  return shape.map((stringFrets) => stringFrets[0] ?? -1);
}

function findAllRootsInShape(scaleFrets: number[][], tuning: string[], rootIndex: number): number[][] {
  return scaleFrets.map((stringFrets, stringIndex) => {
    const openIndex = getNoteIndex(tuning[stringIndex]);
    if (openIndex === -1) return [];
    return stringFrets.filter((fret) => noteIndexAtFret(openIndex, fret) === rootIndex);
  });
}

function findRootInShape(
  scaleFrets: number[][],
  tuning: string[],
  rootIndex: number,
  preferred?: { string?: number; fret?: number },
) {
  const matches: Array<{ string: number; fret: number; distance: number }> = [];

  for (let stringIndex = 0; stringIndex < scaleFrets.length; stringIndex++) {
    const openIndex = getNoteIndex(tuning[stringIndex]);
    if (openIndex === -1) continue;

    for (const fret of scaleFrets[stringIndex]) {
      if (noteIndexAtFret(openIndex, fret) !== rootIndex) continue;
      const distance =
        Math.abs(fret - (preferred?.fret ?? fret)) +
        Math.abs(stringIndex - (preferred?.string ?? stringIndex));
      matches.push({ string: stringIndex, fret, distance });
    }
  }

  return matches.sort((a, b) => a.distance - b.distance)[0];
}

function buildStrictScaleVoicing(
  modeShape: ModeShapeDefinition,
  anchorFret: number,
  tuning: string[],
  chordRootIndex: number,
  selectedChord: Voicing,
): Voicing | null {
  const scaleFrets = [
    modeShape.shape['1'].map((fret) => fret + anchorFret),
    modeShape.shape['2'].map((fret) => fret + anchorFret),
    modeShape.shape['3'].map((fret) => fret + anchorFret),
    modeShape.shape['4'].map((fret) => fret + anchorFret),
  ].map((stringFrets) => stringFrets.filter((fret) => fret >= 0));

  if (!scaleFrets.some((stringFrets) => stringFrets.length > 0)) return null;

  const fallbackFrets = fretListToChordFrets(scaleFrets);
  const pressed = scaleFrets.flat().filter((fret) => fret > 0);
  const minPressed = pressed.length > 0 ? Math.min(...pressed) : 1;
  const root = findRootInShape(scaleFrets, tuning, chordRootIndex, {
    string: selectedChord.rootString,
    fret: selectedChord.rootFret,
  });
  const rootFrets = findAllRootsInShape(scaleFrets, tuning, chordRootIndex);

  return {
    frets: fallbackFrets,
    startingFret: Math.max(1, minPressed),
    barres: [],
    mutedStrings: fallbackFrets
      .map((fret, index) => (fret === -1 ? index : -1))
      .filter((index) => index !== -1),
    omitted: [],
    fingerCount: fallbackFrets.filter((fret) => fret > 0).length,
    arpeggioFrets: scaleFrets,
    rootFrets,
    rootString: root?.string,
    rootFret: root?.fret,
  };
}

export function getScalePositions(chordName: string, tuning: string[]): ScalePosition[] {
  const voicings = searchVoicings(chordName, { instrument: 'cavaquinho', tuning });

  return voicings
    .map((voicing, index) => {
      const lowest = getLowestPlayedNote(voicing, tuning);
      if (!lowest) return null;
      return {
        id: `${voicing.startingFret}-${voicing.frets.join('-')}-${index}`,
        label: `Fundamental ${voicing.rootString !== undefined ? `corda ${voicing.rootString + 1}` : 'detectada'}`,
        voicing,
        lowestString: lowest.string,
        lowestFret: lowest.fret,
        lowestNote: noteName(lowest.noteIndex),
      };
    })
    .filter((position): position is ScalePosition => position !== null);
}

export function getScaleOptionsForPosition(
  chordName: string,
  tuning: string[],
  position: ScalePosition,
): ScaleOptionResult[] {
  const parsed = parseChord(chordName);
  if (!parsed) return [];

  const chordRootIndex = getNoteIndex(parsed.root);
  if (chordRootIndex === -1) return [];

  const qualityBucket = getQualityBucket(parsed.qualityName);
  const options = SCALE_CONFIG.modesByChordQuality[qualityBucket] ?? [];
  return options
    .map((option) => {
      const modeShape = getModeShape(option.formMode);
      if (!modeShape) return null;

      const voicing = buildStrictScaleVoicing(
        modeShape,
        position.lowestFret,
        tuning,
        chordRootIndex,
        position.voicing,
      );
      if (!voicing) return null;

      const noteNames = modeShape.formula.map((interval) => noteName(chordRootIndex + interval));
      const parentScaleRoot = noteName(chordRootIndex + option.parentScaleOffset);

      return {
        id: `${option.id}-${position.id}`,
        name: `${parsed.root} ${option.name}`,
        parentScaleName: `${parentScaleRoot} maior`,
        formLabel: `Forma de ${position.lowestNote} ${option.formMode}`,
        description: option.description,
        noteNames,
        voicing,
      };
    })
    .filter((result): result is ScaleOptionResult => result !== null);
}
