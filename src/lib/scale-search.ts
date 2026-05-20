import scaleShapesRaw from '../../diagramas/Shapes e arpejos/shapes_escalas.json';
import { CHROMATIC_NOTES, getNoteIndex, noteIndexAtFret, parseChord } from './music-theory';
import { searchVoicings } from './arpeggio-search';
import type { Voicing } from './chord-finder';

type JsonStringKey = '1' | '2' | '3' | '4';
type ShapeByJsonString = Record<JsonStringKey, number[]>;

interface ScaleShapeEntry {
  name: string;
  scaleType: string;
  aliases?: string[];
  formula: string[];
  fundamental: {
    code: string;
    string: number;
    fret: number;
  };
  scale: ShapeByJsonString;
  relatedChords?: string[];
  sourceGroup?: string;
  specialDegrees?: string[];
  usageNotes?: string;
}

interface ScaleShapesConfig {
  tuning: Record<JsonStringKey, string>;
  chordScaleRelations: Record<string, string[]>;
  scales: ScaleShapeEntry[];
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

const JSON_STRING_TO_APP_STRING: Record<number, number> = {
  1: 3,
  2: 2,
  3: 1,
  4: 0,
};

const APP_STRING_TO_F_CODE = ['F4', 'F3', 'F2', 'F1'] as const;

function normalizeInterval(interval: number): number {
  return ((interval % 12) + 12) % 12;
}

function noteName(index: number): string {
  return CHROMATIC_NOTES[normalizeInterval(index)] ?? 'C';
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

function getReferenceRootIndex(shape: ScaleShapeEntry): number {
  const jsonString = String(shape.fundamental.string) as JsonStringKey;
  const openNote = SCALE_CONFIG.tuning[jsonString];
  const openIndex = getNoteIndex(openNote);
  if (openIndex === -1) return -1;
  return noteIndexAtFret(openIndex, shape.fundamental.fret);
}

function getNearestTransposeDelta(sourceIndex: number, targetIndex: number, minFret: number): number {
  let delta = normalizeInterval(targetIndex - sourceIndex);
  if (delta > 6) delta -= 12;
  if (minFret + delta < 0) delta += 12;
  return delta;
}

function getGenericChordSymbols(chordName: string): string[] {
  const parsed = parseChord(chordName);
  if (!parsed) return [];

  const displayQuality = parsed.displayName
    .replace(new RegExp(`^${parsed.root.replace('#', '\\#')}`), '')
    .replace(/\/[A-G][b#]?$/, '');

  const symbols = new Set<string>();
  symbols.add(`X${displayQuality}`);

  const byQualityName: Record<string, string[]> = {
    Maior: ['X'],
    'Maior 6': ['X6'],
    'Maior 6/9': ['X6/9'],
    'Maior 7': ['X7M'],
    Add9: ['Xadd9', 'X'],
    Menor: ['Xm'],
    'Menor 7': ['Xm7'],
    'Menor 6': ['Xm6'],
    'Menor com Maior 7': ['Xm7M'],
    'Menor 7b5 (ø)': ['Xm7(b5)'],
    Diminuto: ['Xdim', 'X°'],
    'Diminuto 7': ['Xdim', 'X°'],
    'Dominante 7': ['X7'],
    'Dominante 9': ['X7'],
    'Dominante 13': ['X7'],
    'Dominante 7(#5)': ['X7(#5)'],
    'Dominante 7(b5)': ['X7(b5)'],
    'Dominante 7(b9)': ['X7(b9)'],
    'Dominante 7(#9)': ['X7(#9)'],
    'Dominante 7 Alt': ['X7alt'],
  };

  for (const symbol of byQualityName[parsed.qualityName] ?? []) {
    symbols.add(symbol);
  }

  const normalizedQuality = displayQuality
    .replace(/7#5/g, '7(#5)')
    .replace(/7b5/g, '7(b5)')
    .replace(/7b9/g, '7(b9)')
    .replace(/7#9/g, '7(#9)')
    .replace(/7alt/i, '7alt')
    .replace(/^dim7?$/, 'dim')
    .replace(/^°$/, '°');

  symbols.add(`X${normalizedQuality}`);

  return [...symbols].filter((symbol) => symbol !== 'Xundefined');
}

function getRelatedScalePrefixes(genericSymbols: string[]): string[] {
  const prefixes = new Set<string>();

  for (const symbol of genericSymbols) {
    for (const prefix of SCALE_CONFIG.chordScaleRelations[symbol] ?? []) {
      prefixes.add(prefix);
    }
  }

  return [...prefixes];
}

function isScaleRelatedToChord(
  shape: ScaleShapeEntry,
  genericSymbols: string[],
  relatedScalePrefixes: string[],
): boolean {
  const hasPrefix = relatedScalePrefixes.some((prefix) => shape.name === prefix || shape.name.startsWith(`${prefix}_`));
  const hasRelatedChord = shape.relatedChords?.some((symbol) => genericSymbols.includes(symbol)) ?? false;
  return hasPrefix || hasRelatedChord;
}

function appFretsFromJsonShape(shape: ScaleShapeEntry, delta: number): number[][] {
  return [
    shape.scale['4'] ?? [],
    shape.scale['3'] ?? [],
    shape.scale['2'] ?? [],
    shape.scale['1'] ?? [],
  ].map((stringFrets) => stringFrets.map((fret) => fret + delta).sort((a, b) => a - b));
}

function chordFretsFromScale(scaleFrets: number[][]): number[] {
  return scaleFrets.map((stringFrets) => stringFrets[0] ?? -1);
}

function findRootFrets(scaleFrets: number[][], tuning: string[], targetRootIndex: number): number[][] {
  return scaleFrets.map((stringFrets, stringIndex) => {
    const openIndex = getNoteIndex(tuning[stringIndex]);
    if (openIndex === -1) return [];
    return stringFrets.filter((fret) => noteIndexAtFret(openIndex, fret) === targetRootIndex);
  });
}

function buildScaleVoicing(shape: ScaleShapeEntry, chordRootIndex: number, tuning: string[]): Voicing | null {
  const referenceRootIndex = getReferenceRootIndex(shape);
  if (referenceRootIndex === -1) return null;

  const allFrets = Object.values(shape.scale).flat();
  const minFret = allFrets.length > 0 ? Math.min(...allFrets) : 0;
  const delta = getNearestTransposeDelta(referenceRootIndex, chordRootIndex, minFret);
  const scaleFrets = appFretsFromJsonShape(shape, delta);
  if (scaleFrets.some((stringFrets) => stringFrets.some((fret) => fret < 0))) return null;

  const rootString = JSON_STRING_TO_APP_STRING[shape.fundamental.string];
  const rootFret = shape.fundamental.fret + delta;
  if (rootString === undefined || rootFret < 0) return null;

  const rootFrets = findRootFrets(scaleFrets, tuning, chordRootIndex);
  if (!rootFrets[rootString].includes(rootFret)) {
    rootFrets[rootString] = [...rootFrets[rootString], rootFret].sort((a, b) => a - b);
  }

  const fallbackFrets = chordFretsFromScale(scaleFrets);
  const pressedFrets = scaleFrets.flat().filter((fret) => fret > 0);
  const startingFret = pressedFrets.length > 0 ? Math.max(1, Math.min(...pressedFrets)) : 1;

  return {
    frets: fallbackFrets,
    startingFret,
    barres: [],
    mutedStrings: fallbackFrets
      .map((fret, index) => (fret === -1 ? index : -1))
      .filter((index) => index !== -1),
    omitted: [],
    fingerCount: fallbackFrets.filter((fret) => fret > 0).length,
    arpeggioFrets: scaleFrets,
    rootFrets,
    rootString,
    rootFret,
  };
}

function getPositionRootCode(position: ScalePosition): string | null {
  const rootString = position.voicing.rootString ?? position.lowestString;
  return APP_STRING_TO_F_CODE[rootString] ?? null;
}

function formatDirection(shapeName: string): string {
  if (shapeName.includes('_frente')) return 'frente';
  if (shapeName.includes('_tras')) return 'tras';
  return 'base';
}

export function getScalePositions(chordName: string, tuning: string[]): ScalePosition[] {
  const voicings = searchVoicings(chordName, { instrument: 'cavaquinho', tuning });

  return voicings
    .map((voicing, index) => {
      const lowest = getLowestPlayedNote(voicing, tuning);
      if (!lowest) return null;
      return {
        id: `${voicing.startingFret}-${voicing.frets.join('-')}-${index}`,
        label: `Fundamental ${voicing.rootString !== undefined ? `F${4 - voicing.rootString}` : 'detectada'}`,
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

  const genericSymbols = getGenericChordSymbols(chordName);
  const relatedScalePrefixes = getRelatedScalePrefixes(genericSymbols);
  const positionRootCode = getPositionRootCode(position);

  const relatedShapes = SCALE_CONFIG.scales.filter((shape) =>
    isScaleRelatedToChord(shape, genericSymbols, relatedScalePrefixes),
  );

  const shapesForPosition = positionRootCode
    ? relatedShapes.filter((shape) => shape.fundamental.code === positionRootCode || shape.name.includes(`_${positionRootCode}`))
    : relatedShapes;

  const sourceShapes = shapesForPosition.length > 0 ? shapesForPosition : relatedShapes;

  return sourceShapes
    .map((shape) => {
      const voicing = buildScaleVoicing(shape, chordRootIndex, tuning);
      if (!voicing) return null;

      const alias = shape.aliases?.[0] ?? shape.sourceGroup ?? shape.scaleType;
      const formLabel = `${shape.fundamental.code} ${formatDirection(shape.name)}`;
      const descriptionParts = [
        shape.sourceGroup,
        shape.usageNotes,
        shape.relatedChords?.length ? `Acordes: ${shape.relatedChords.join(', ')}` : null,
      ].filter(Boolean);

      return {
        id: `${shape.name}-${position.id}`,
        name: `${parsed.root} ${alias}`,
        parentScaleName: shape.name,
        formLabel,
        description: descriptionParts.join(' | '),
        noteNames: shape.formula,
        voicing,
      };
    })
    .filter((result): result is ScaleOptionResult => result !== null);
}
