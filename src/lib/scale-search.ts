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

const MODE_FORMULAS: Record<string, number[]> = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  'lydian-dominant': [0, 2, 4, 6, 7, 9, 10],
  altered: [0, 1, 3, 4, 6, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  diminished: [0, 2, 3, 5, 6, 8, 9, 11],
  'major-pentatonic': [0, 2, 4, 7, 9],
  'minor-pentatonic': [0, 3, 5, 7, 10],
};

const DIATONIC_MODE_BY_INTERVAL: Record<number, string> = {
  0: 'Jonio',
  2: 'Dorico',
  4: 'Frigio',
  5: 'Lidio',
  7: 'Mixolidio',
  9: 'Eolio',
  11: 'Locrio',
};

function normalizeInterval(interval: number): number {
  return ((interval % 12) + 12) % 12;
}

function noteName(index: number): string {
  return CHROMATIC_NOTES[normalizeInterval(index)] ?? 'C';
}

function getApproxMidiBases(tuning: string[]): number[] {
  let previous = 48 + getNoteIndex(tuning[0]);
  const bases = [previous];

  for (let index = 1; index < tuning.length; index++) {
    const noteIndex = getNoteIndex(tuning[index]);
    let midi = 48 + noteIndex;
    while (midi <= previous) midi += 12;
    bases.push(midi);
    previous = midi;
  }

  return bases;
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

function cleanSequentialScaleFrets(scaleFrets: number[][], tuning: string[]): number[][] {
  const midiBases = getApproxMidiBases(tuning);
  const seenPitches = new Set<number>();

  return scaleFrets.map((rawStringFrets, stringIndex) => {
    const sorted = [...new Set(rawStringFrets)].sort((a, b) => a - b);
    const withoutOpen = sorted.length > 1 ? sorted.filter((fret) => fret !== 0) : sorted;
    const clean: number[] = [];

    for (const fret of withoutOpen) {
      if (clean.length >= 3) break;
      const pitch = midiBases[stringIndex] + fret;
      if (seenPitches.has(pitch)) continue;
      seenPitches.add(pitch);
      clean.push(fret);
    }

    return clean;
  });
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
  const rawScaleFrets = [
    modeShape.shape['1'].map((fret) => fret + anchorFret),
    modeShape.shape['2'].map((fret) => fret + anchorFret),
    modeShape.shape['3'].map((fret) => fret + anchorFret),
    modeShape.shape['4'].map((fret) => fret + anchorFret),
  ].map((stringFrets) => stringFrets.filter((fret) => fret >= 0));
  const scaleFrets = cleanSequentialScaleFrets(rawScaleFrets, tuning);

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

function getFormModeForLowestNote(option: ModeOptionDefinition, lowestNoteIndex: number, chordRootIndex: number) {
  const formula = MODE_FORMULAS[option.id];
  if (!formula) return option.formMode;

  const intervalFromChordRoot = normalizeInterval(lowestNoteIndex - chordRootIndex);
  if (formula.includes(intervalFromChordRoot)) {
    if (formula.length === 7 && DIATONIC_MODE_BY_INTERVAL[intervalFromChordRoot]) {
      return DIATONIC_MODE_BY_INTERVAL[intervalFromChordRoot];
    }
    return option.name;
  }

  return option.formMode;
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
  const lowestOpenIndex = getNoteIndex(tuning[position.lowestString]);
  const lowestNoteIndex =
    lowestOpenIndex === -1 ? chordRootIndex : noteIndexAtFret(lowestOpenIndex, position.lowestFret);

  return options
    .map((option) => {
      const formMode = getFormModeForLowestNote(option, lowestNoteIndex, chordRootIndex);
      const modeShape = getModeShape(formMode) ?? getModeShape(option.formMode);
      if (!modeShape) return null;

      const voicing = buildStrictScaleVoicing(
        modeShape,
        position.lowestFret,
        tuning,
        chordRootIndex,
        position.voicing,
      );
      if (!voicing) return null;

      const formula = MODE_FORMULAS[option.id] ?? modeShape.formula;
      const noteNames = formula.map((interval) => noteName(chordRootIndex + interval));
      const parentScaleRoot = noteName(chordRootIndex + option.parentScaleOffset);

      return {
        id: `${option.id}-${position.id}`,
        name: `${parsed.root} ${option.name}`,
        parentScaleName: `${parentScaleRoot} maior`,
        formLabel: `Forma de ${position.lowestNote} ${formMode}`,
        description: option.description,
        noteNames,
        voicing,
      };
    })
    .filter((result): result is ScaleOptionResult => result !== null);
}
