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

const CHORD_DICT: Record<string, DictType> = {
  cavaquinho: chordDictRaw as DictType,
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function getRegion(sf: number): number {
  if (sf <= 3) return 1;
  if (sf <= 6) return 2;
  if (sf <= 9) return 3;
  return 4;
}

const TUNING_MIDI = [62, 67, 71, 74]; // D G B D (cavaquinho)

/**
 * For each string, returns the frets (within a 4-fret window starting at
 * startingFret) that produce a note belonging to the chord.
 * This guarantees arpeggios only contain actual chord tones.
 */
function computeArpeggioFrets(
  noteIndices: number[],
  tuning: string[],
  startingFret: number,
): number[][] {
  const chordTones = new Set(noteIndices.map(n => ((n % 12) + 12) % 12));
  const windowStart = startingFret;
  const windowEnd   = startingFret + 3;

  return tuning.map(openNote => {
    const openIdx = getNoteIndex(openNote);
    if (openIdx === -1) return [];
    const frets: number[] = [];
    for (let f = windowStart; f <= windowEnd; f++) {
      if (chordTones.has(noteIndexAtFret(openIdx, f))) frets.push(f);
    }
    return frets;
  });
}

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

  // ATTACH ARPEGGIOS: compute from chord tones and tuning.
  // Each string gets the frets (within a 4-fret window at startingFret)
  // that produce a note belonging to the chord — no wrong notes possible.
  finalVoicings = finalVoicings.map(v => ({
    ...v,
    arpeggioFrets: computeArpeggioFrets(parsed.noteIndices, tuning, v.startingFret),
  }));

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
