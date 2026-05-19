/**
 * Shared voicing-search utility.
 * Used by ChordSearch, ChordDictionary AND ProgressionEditor for auto-voicing.
 * 
 * Priority system: dictionary voicings (from diagramas/jsons) come first,
 * sorted by lowest position. Algorithmic fallback for chords not in dictionary.
 */
import { parseChord, INSTRUMENT_PRESETS, getNoteIndex, noteIndexAtFret } from './music-theory';
import { findVoicings, type Voicing } from './chord-finder';

type DictEntry = { chordName: string; frets: number[], arpeggioFrets?: number[][] };
type DictType = Record<string, DictEntry[]>;

import chordDictRaw from '@/config/cavaquinho-dictionary.json';
import shapeDictRaw from '@/config/arpeggio-shapes.json';

const CHORD_DICT: Record<string, DictType> = {
  cavaquinho: chordDictRaw as DictType,
};

// Maps parsed.qualityName (Portuguese, as returned by parseChord) → quality key in arpeggio-shapes.json
const QUALITY_MAP: Record<string, string> = {
  'Maior':           '',
  'Maior b5':        '(b5)',
  'Maior #5':        '+',
  'Aumentado':       '+',
  'Menor':           'm',
  'Menor b5':        'm(b5)',
  'Dominante 7':     '7',
  'Maior 7':         '7M',
  'Maior 7M #5':     '7M#5',
  'Maior 7M b5':     '7Mb5',
  'Menor 7':         'm7',
  'Menor com Maior 7': 'm7M',
  'Menor 7b5 (ø)':  'm7b5',
  'Diminuto':        'dim',
};

/**
 * Determine chord direction relative to root.
 * Returns 'frente' if more chord notes fall ABOVE the root fret,
 * 'tras' if more fall below, 'neutral' if balanced.
 */
function chordDirection(v: Voicing): 'frente' | 'tras' | 'neutral' {
  if (v.rootFret === undefined) return 'neutral';
  let above = 0, below = 0;
  for (let s = 0; s < v.frets.length; s++) {
    if (s === v.rootString) continue; // skip root string itself
    const f = v.frets[s];
    if (f <= 0) continue; // open or muted
    if (f > v.rootFret!) above++;
    else if (f < v.rootFret!) below++;
  }
  if (above > below) return 'frente';
  if (below > above) return 'tras';
  return 'neutral';
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function getRegion(sf: number): number {
  if (sf <= 3) return 1;
  if (sf <= 6) return 2;
  if (sf <= 9) return 3;
  return 4;
}

const TUNING_MIDI = [62, 67, 71, 74]; // D G B D (cavaquinho)

function dictEntryToVoicing(c: DictEntry, isPriority = false, tuning?: string[], rootNoteIdx?: number): Voicing {
  const pressed = c.frets.filter(f => f > 0);
  const startingFret = pressed.length > 0 ? Math.min(...pressed) : 1;
  
  let rootString: number | undefined;
  let rootFret: number | undefined;
  
  if (tuning && rootNoteIdx !== undefined) {
    // Find which string has the root note at the fret pressed
    for (let s = 0; s < c.frets.length; s++) {
      const f = c.frets[s];
      if (f < 0) continue;
      const openIdx = getNoteIndex(tuning[s]);
      if (openIdx !== -1 && noteIndexAtFret(openIdx, f) === rootNoteIdx) {
        rootString = s;
        rootFret = f;
        break;
      }
    }
  }
  
  return {
    frets: c.frets,
    startingFret,
    barres: [],
    mutedStrings: c.frets.map((f, i) => (f === -1 ? i : -1)).filter(i => i !== -1),
    omitted: [],
    fingerCount: pressed.length,
    isPriority,
    arpeggioFrets: c.arpeggioFrets,
    rootString,
    rootFret,
  };
}

/** Calculate distance between two voicings for voice leading (minimal movement) */
function calculateVoicingDistance(v1: Voicing, v2: Voicing): number {
  let distance = 0;
  // Compare fret by fret
  for (let i = 0; i < v1.frets.length; i++) {
    const f1 = v1.frets[i];
    const f2 = v2.frets[i];
    
    if (f1 === -1 || f2 === -1) {
      if (f1 === f2) continue;
      distance += 4; // Penalty for changing string active/muted status
    } else {
      distance += Math.abs(f1 - f2);
    }
  }
  // Weight starting fret movement
  distance += Math.abs(v1.startingFret - v2.startingFret) * 1.5;
  return distance;
}

/** Look up chord in dictionary, trying multiple name variants */
function lookupDict(dict: DictType, chordName: string, normalizedName?: string): DictEntry[] | null {
  // Try exact match first
  if (dict[chordName]) return dict[chordName];
  // Try normalized name (from parseChord displayName)
  if (normalizedName && dict[normalizedName]) return dict[normalizedName];
  return null;
}

function mergeAndGroupByRegion(
  dictVoicings: Voicing[],
  baseResults: Voicing[],
  maxPerRegion = 4,
): Voicing[] {
  const dictFretStrings = new Set(dictVoicings.map(v => v.frets.join(',')));
  const others = baseResults.filter(v => !dictFretStrings.has(v.frets.join(',')));
  const allVoicings = [...dictVoicings, ...others];

  const regionMap: Record<number, Voicing[]> = { 1: [], 2: [], 3: [], 4: [] };
  allVoicings.forEach(v => {
    const reg = getRegion(v.startingFret);
    if (regionMap[reg] && regionMap[reg].length < maxPerRegion) {
      regionMap[reg].push(v);
    }
  });
  return [...regionMap[1], ...regionMap[2], ...regionMap[3], ...regionMap[4]];
}

// ── Public: get all voicings for a chord name ───────────────────────────────
export interface SearchVoicingsOptions {
  instrument: string;
  tuning: string[];
  maxPerRegion?: number;
}

export function searchVoicings(
  chordName: string,
  opts: SearchVoicingsOptions,
): Voicing[] {
  const { instrument, tuning, maxPerRegion = 4 } = opts;
  const parsed = parseChord(chordName);
  if (!parsed) return [];

  const smallInstrument = (INSTRUMENT_PRESETS[instrument]?.strings ?? 6) <= 4;

  const baseResults = findVoicings(parsed.noteIndices, tuning, {
    maxFret: 12,
    maxResults: smallInstrument ? 48 : 24,
    maxInternalResults: smallInstrument ? 150 : 200,
    allowOmissions: smallInstrument,
    allowMuted: !smallInstrument,
    rootNoteIndex: parsed.noteIndices[0],
    bassNoteIndex: smallInstrument
      ? parsed.bassNoteIndex
      : (parsed.bassNoteIndex ?? parsed.noteIndices[0]),
    minBarreStrings: smallInstrument ? 3 : 4,
  });

  const normalizedName = parsed.displayName;
  const activeDict = CHORD_DICT[instrument];

  // Look up dictionary entries (tries exact name + normalized name)
  const dictEntries = activeDict ? lookupDict(activeDict, chordName, normalizedName) : null;

  let finalVoicings: Voicing[] = [];

  if (dictEntries) {
    // Dictionary voicings ONLY — no mixing with algorithmic results
    finalVoicings = dictEntries.map(entry => dictEntryToVoicing(entry, true, tuning, parsed.noteIndices[0]));
  } else {
    // Fallback: algorithmic results only — compute rootString for each
    finalVoicings = mergeAndGroupByRegion([], baseResults, maxPerRegion).map(v => {
      let rootString: number | undefined;
      let rootFret: number | undefined;
      for (let s = 0; s < v.frets.length; s++) {
        const f = v.frets[s];
        if (f < 0) continue;
        const openIdx = getNoteIndex(tuning[s]);
        if (openIdx !== -1 && noteIndexAtFret(openIdx, f) === parsed.noteIndices[0]) {
          rootString = s;
          rootFret = f;
          break;
        }
      }
      return { ...v, rootString, rootFret };
    });
  }

  // ATTACH ARPEGGIOS using the shape dictionary with direction logic
  // 1. Map quality name → shape key
  // 2. Filter by rootString match (which string has the fundamental)
  // 3. Prefer shape direction that matches the chord's note distribution
  const qKey = QUALITY_MAP[parsed.qualityName];
  const shapes: any[] = qKey !== undefined ? (shapeDictRaw as Record<string, any[]>)[qKey] || [] : [];

  finalVoicings = finalVoicings.map(v => {
    let bestArp: number[][] | null = null;

    if (shapes.length > 0) {
      const dir = chordDirection(v);

      // Resolve root anchor: prefer voicing's detected root, else estimate from startingFret
      const chordRootString = v.rootString;
      const chordRootFret   = v.rootFret ?? v.startingFret;

      let pool: any[];
      if (chordRootString !== undefined) {
        // Anchored by root string + direction priority
        const byRoot = shapes.filter(s => s.rootString === chordRootString);
        pool = [
          ...byRoot.filter(s => s.direction === dir),
          ...byRoot.filter(s => s.direction !== dir),
          ...shapes.filter(s => s.rootString !== chordRootString && s.direction === dir),
          ...shapes.filter(s => s.rootString !== chordRootString),
        ];
      } else {
        // No root found: fallback — best proximity by starting fret
        pool = [
          ...shapes.filter(s => s.direction === dir),
          ...shapes,
        ];
      }

      let minDiff = 999;

      for (const shape of pool) {
        const arpeggioFrets: number[][] = shape.relativeFrets.map(
          (arr: number[]) => arr.map((f: number) => f + chordRootFret)
        );
        const hasNeg = arpeggioFrets.some((arr: number[]) => arr.some((f: number) => f < 0));
        if (hasNeg) continue;

        let diff = 0;
        for (let s = 0; s < 4; s++) {
          if (arpeggioFrets[s].length === 0) continue;
          diff += Math.abs(v.startingFret - Math.min(...arpeggioFrets[s]));
        }
        if (diff < minDiff) { minDiff = diff; bestArp = arpeggioFrets; }
        if (bestArp) break;
      }
    }

    if (!bestArp) {
      // Fallback arpeggio: build from chord frets and mirror strings 0 and 3 (the D strings)
      const fallbackArp: number[][] = [[], [], [], []];
      const dFrets = new Set<number>();
      
      if (v.frets[0] >= 0) dFrets.add(v.frets[0]);
      if (v.frets[3] >= 0) dFrets.add(v.frets[3]);
      
      const dArr = Array.from(dFrets).sort((a, b) => a - b);
      
      fallbackArp[0] = [...dArr];
      if (v.frets[1] >= 0) fallbackArp[1] = [v.frets[1]];
      if (v.frets[2] >= 0) fallbackArp[2] = [v.frets[2]];
      fallbackArp[3] = [...dArr];
      
      bestArp = fallbackArp;
    }

    return { ...v, arpeggioFrets: bestArp };
  });

  return finalVoicings;
}

// ── Public: pick the best default voicing (lowest position priority) ────────
export function pickDefaultVoicing(
  chordName: string,
  opts: SearchVoicingsOptions,
): Voicing | null {
  const all = searchVoicings(chordName, opts);
  if (all.length === 0) return null;

  // Prefer dictionary voicings (isPriority), pick the one with lowest startingFret
  const priority = all.filter(v => v.isPriority);
  if (priority.length > 0) {
    return priority.reduce((a, b) => a.startingFret <= b.startingFret ? a : b);
  }

  // Fallback: prefer region 1 (frets 1-3)
  const region1 = all.filter(v => getRegion(v.startingFret) === 1);
  if (region1.length > 0) return region1[0];

  return all[0];
}

// ── Public: resolve auto-voicings for a list of chord names ─────────────────
export function resolveAutoVoicings(
  chordNames: string[],
  opts: SearchVoicingsOptions,
): Record<string, Voicing> {
  const result: Record<string, Voicing> = {};
  let lastVoicing: Voicing | null = null;

  for (const name of chordNames) {
    const all = searchVoicings(name, opts);
    if (all.length === 0) continue;

    let best: Voicing;

    if (!lastVoicing) {
      // First chord: pick the lowest position (priority first)
      const priority = all.filter(v => v.isPriority);
      if (priority.length > 0) {
        best = priority.reduce((a, b) => a.startingFret <= b.startingFret ? a : b);
      } else {
        const region1 = all.filter(v => getRegion(v.startingFret) === 1);
        best = region1.length > 0 ? region1[0] : all[0];
      }
    } else {
      // Subsequent chords: pick closest to last voicing (minimal movement)
      const priority = all.filter(v => v.isPriority);

      if (priority.length > 0) {
        best = priority.reduce((prev, curr) => {
          const prevDist = calculateVoicingDistance(prev, lastVoicing!);
          const currDist = calculateVoicingDistance(curr, lastVoicing!);
          return currDist < prevDist ? curr : prev;
        });
      } else {
        best = all.reduce((prev, curr) => {
          const prevDist = calculateVoicingDistance(prev, lastVoicing!);
          const currDist = calculateVoicingDistance(curr, lastVoicing!);
          return currDist < prevDist ? curr : prev;
        });
      }
    }

    result[name] = best;
    lastVoicing = best;
  }
  return result;
}
