import { getNoteIndex, noteIndexAtFret } from './music-theory';

export interface Voicing {
  frets: number[];
  startingFret: number;
  barres: BarreDef[];
  mutedStrings: number[];
  omitted: string[];
  fingerCount: number;
  isPriority?: boolean;
  arpeggioFrets?: number[][];
  rootFrets?: number[][];
  rootString?: number; // which string (0-indexed) carries the root note
  rootFret?: number;   // fret of the root note on rootString
}

export interface BarreDef {
  fret: number;
  startString: number;
  endString: number;
}

interface FindOptions {
  maxFret?: number;
  allowMuted?: boolean;
  maxSpan?: number;
  maxResults?: number;
  maxInternalResults?: number; // limite interno do backtracking
  allowOmissions?: boolean;
  rootNoteIndex?: number;
  bassNoteIndex?: number;
  minBarreStrings?: number; // 2=violão (default), 3=cavaquinho
}

// ── Barre detection ───────────────────────────────────────────────────────────
function detectBarres(frets: number[], minBarreStrings = 2): BarreDef[] {
  // For each candidate fret value (lowest first), check if a barre is possible:
  // A barre at fretVal from `start` to `end` is valid when:
  //   - Both start and end strings play exactly fretVal
  //   - All strings between play fretVal or HIGHER (they're pressed above the barre)
  //   - No muted string between start and end
  //   - Span (end-start+1) >= minBarreStrings
  const fretValues = [...new Set(frets.filter(f => f > 0))].sort((a, b) => a - b);

  for (const fretVal of fretValues) {
    const stringsAtFret = frets
      .map((f, i) => (f === fretVal ? i : -1))
      .filter(i => i !== -1);
    if (stringsAtFret.length < 2) continue;

    const start = stringsAtFret[0];
    const end   = stringsAtFret[stringsAtFret.length - 1];
    if (end - start + 1 < minBarreStrings) continue;

    const slice = frets.slice(start, end + 1);
    if (slice.some(f => f === -1)) continue;        // muted in range → invalid
    if (!slice.every(f => f >= fretVal)) continue;  // some below barre fret → invalid

    return [{ fret: fretVal, startString: start, endString: end }];
  }
  return [];
}



// Group adjacent same-fret strings → 1 finger each group (regardless of barre display)
function countFingers(frets: number[], barres: BarreDef[]): number {
  const barredKeys = new Set<string>();
  for (const b of barres) {
    for (let s = b.startString; s <= b.endString; s++) barredKeys.add(`${s},${b.fret}`);
  }
  let count = barres.length;
  let i = 0;
  while (i < frets.length) {
    if (frets[i] <= 0) { i++; continue; }
    if (barredKeys.has(`${i},${frets[i]}`)) { i++; continue; }
    // Count this run of adjacent strings at the same non-barred fret as ONE finger
    const f = frets[i];
    while (i < frets.length && frets[i] === f && !barredKeys.has(`${i},${f}`)) i++;
    count++;
  }
  return count;
}

// ── Core search ───────────────────────────────────────────────────────────────
function findVoicingsForNotes(
  required: number[],
  tuning: string[],
  opts: Omit<FindOptions, 'allowOmissions' | 'rootNoteIndex'>,
  omitted: string[]
): Voicing[] {
  const { maxFret = 12, allowMuted = false, maxSpan = 4, minBarreStrings = 2, maxInternalResults = 200 } = opts;
  const n = tuning.length;

  const validFrets: number[][] = tuning.map(note => {
    const base = getNoteIndex(note);
    if (base === -1) return [];
    const v: number[] = [];
    if (allowMuted) v.push(-1);
    for (let f = 0; f <= maxFret; f++) {
      if (required.includes(noteIndexAtFret(base, f))) v.push(f);
    }
    return v;
  });

  const collected: Voicing[] = [];

  function bt(si: number, cur: number[], cov: Set<number>) {
    if (collected.length >= maxInternalResults) return;
    if (si === n) {
      if (!required.every(x => cov.has(x))) return;
      const pressed = cur.filter(f => f > 0);
      if (pressed.length >= 2 && Math.max(...pressed) - Math.min(...pressed) > maxSpan) return;
      const barres = detectBarres(cur, minBarreStrings);
      const fingers = countFingers(cur, barres);
      if (fingers > 4) return; // physically impossible
      const sf = pressed.length > 0 ? Math.min(...pressed) : 1;
      collected.push({
        frets: [...cur], startingFret: sf, barres,
        mutedStrings: cur.reduce<number[]>((a, f, i) => f === -1 ? [...a, i] : a, []),
        omitted, fingerCount: fingers,
      });
      return;
    }
    for (const f of validFrets[si]) {
      const pressed = [...cur.filter(x => x > 0), ...(f > 0 ? [f] : [])];
      if (pressed.length >= 2 && Math.max(...pressed) - Math.min(...pressed) > maxSpan) continue;
      const nc = new Set(cov);
      if (f >= 0) {
        const base = getNoteIndex(tuning[si]);
        if (base !== -1) nc.add(noteIndexAtFret(base, f));
      }
      cur.push(f); bt(si + 1, cur, nc); cur.pop();
    }
  }

  bt(0, [], new Set());
  return collected;
}

// ── Public API ────────────────────────────────────────────────────────────────
export function findVoicings(
  noteIndices: number[],
  tuning: string[],
  options: FindOptions = {}
): Voicing[] {
  const { allowOmissions = false, rootNoteIndex, bassNoteIndex, maxResults = 12, ...rest } = options;
  const allRaw: Voicing[] = [];

  allRaw.push(...findVoicingsForNotes(noteIndices, tuning, rest, []));

  if (allowOmissions && rootNoteIndex !== undefined) {
    const fifth = (rootNoteIndex + 7) % 12;
    const hasFifth = noteIndices.includes(fifth);
    const isBassRoot = bassNoteIndex === rootNoteIndex;
    const isBassFifth = bassNoteIndex === fifth;

    if (hasFifth && !isBassFifth) {
      const noFifth = noteIndices.filter(n => n !== fifth);
      allRaw.push(...findVoicingsForNotes(noFifth, tuning, rest, ['s/ 5ª']));
      const noFifthNoRoot = noFifth.filter(n => n !== rootNoteIndex);
      if (noFifthNoRoot.length > 0 && !isBassRoot)
        allRaw.push(...findVoicingsForNotes(noFifthNoRoot, tuning, rest, ['s/ 5ª', 's/ fund.']));
    }
    if (!isBassRoot) {
      const noRoot = noteIndices.filter(n => n !== rootNoteIndex);
      if (noRoot.length > 0)
        allRaw.push(...findVoicingsForNotes(noRoot, tuning, rest, ['s/ fund.']));
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  let unique = allRaw.filter(v => {
    const k = v.frets.join(',');
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });

  // Filter by bass note
  if (bassNoteIndex !== undefined) {
    unique = unique.filter(v => {
      const li = v.frets.findIndex(f => f !== -1);
      if (li === -1) return false;
      const base = getNoteIndex(tuning[li]);
      return base !== -1 && noteIndexAtFret(base, v.frets[li]) === bassNoteIndex;
    });
  }

  // Sort: full chord > fewer muted strings > fewer fingers > lower fret
  unique.sort((a, b) => {
    if (a.omitted.length !== b.omitted.length) return a.omitted.length - b.omitted.length;
    // Prefer shapes with fewer muted strings (more notes sounding)
    const aMuted = a.frets.filter(f => f === -1).length;
    const bMuted = b.frets.filter(f => f === -1).length;
    if (aMuted !== bMuted) return aMuted - bMuted;
    if (a.fingerCount !== b.fingerCount) return a.fingerCount - b.fingerCount;
    return a.startingFret - b.startingFret;
  });

  return unique.slice(0, maxResults);
}
