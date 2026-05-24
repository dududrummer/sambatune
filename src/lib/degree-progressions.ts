/**
 * Pre-defined progression templates in Roman numeral degrees,
 * organized by category, with transposition logic.
 */

// ── Templates ───────────────────────────────────────────────────────────────
export interface ProgressionTemplate {
  id: string;
  name: string;
  category:
    | "Quadradas Maiores"
    | "Quadradas Menores"
    | "Progressões Maiores"
    | "Progressões Menores"
    | "Empréstimo Modal"
    | "Diminutos"
    | "Dissonante Maior"
    | "Dissonante Menor";
  degreesClean: string;
  degrees: string;
}

export const CATEGORIES = [
  "Quadradas Maiores",
  "Quadradas Menores",
  "Progressões Maiores",
  "Progressões Menores",
  "Empréstimo Modal",
  "Diminutos",
  "Dissonante Maior",
  "Dissonante Menor",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const PROGRESSION_TEMPLATES: ProgressionTemplate[] = [
  // ── Quadradas Maiores ───────────────────────────────────────────────────
  {
    id: "q-maior-1",
    category: "Quadradas Maiores",
    name: "I | V7(VIm) | VIm | V7(IIm)",
    degreesClean: "I | V7(VIm) | VIm | V7(IIm)",
    degrees: "I | % | III7 | % | VIm | % | IIm | V7",
  },
  {
    id: "q-maior-2",
    category: "Quadradas Maiores",
    name: "I | IIIm | IV | V7",
    degreesClean: "I | IIIm | IV | V7",
    degrees: "I | % | IIIm | % | IV | % | V7 | %",
  },
  {
    id: "q-maior-3",
    category: "Quadradas Maiores",
    name: "I | I7(IV) | IV | V7",
    degreesClean: "I | I7(IV) | IV | V7",
    degrees: "I | % | I7 | % | IV | % | V7 | %",
  },

  // ── Quadradas Menores ───────────────────────────────────────────────────
  {
    id: "q-menor-1",
    category: "Quadradas Menores",
    name: "Im | I7 | IVm | V7",
    degreesClean: "Im | I7 | IVm | V7",
    degrees: "Im | I7 | IVm | V7",
  },

  // ── Progressões Maiores ─────────────────────────────────────────────────
  {
    id: "mai-1",
    category: "Progressões Maiores",
    name: "I7M | V7",
    degreesClean: "I7M | V7",
    degrees: "I7M | V7",
  },
  {
    id: "mai-2",
    category: "Progressões Maiores",
    name: "I7M | IV7M",
    degreesClean: "I7M | IV7M",
    degrees: "I7M | IV7M",
  },
  {
    id: "mai-3",
    category: "Progressões Maiores",
    name: "I | IV | V7",
    degreesClean: "I | IV | V7",
    degrees: "I | IV | V7",
  },
  {
    id: "mai-4",
    category: "Progressões Maiores",
    name: "I | IV | IVm6",
    degreesClean: "I | IV | IVm6",
    degrees: "I | IV | IVm6",
  },
  {
    id: "mai-5",
    category: "Progressões Maiores",
    name: "I | V/3ª | IV/3ª | IVm/b3",
    degreesClean: "I | V/3ª | IV/3ª | IVm/b3",
    degrees: "I | V/VII | IV/VI | IVm/bVI",
  },
  {
    id: "mai-6",
    category: "Progressões Maiores",
    name: "I | IIIm7 | II7 | IV7M | IVm6 | IIIm7 | IIm7 | V7 | I7M",
    degreesClean: "I | IIIm7 | II7 | IV7M | IVm6 | IIIm7 | IIm7 | V7 | I7M",
    degrees: "I | IIIm7 | II7 | IV7M | IVm6 | IIIm7 | IIm7 | V7 | I7M",
  },
  {
    id: "mai-7",
    category: "Progressões Maiores",
    name: "I | V/3ª | VIm7 | VIm/b7 | #IVø | V7 | I | IIm7 | V7 | I",
    degreesClean: "I | V/3ª | VIm7 | VIm/b7 | #IVm7(b5) | V7 | I | IIm7 | V7 | I",
    degrees: "I | V/VII | VIm7 | VIm/V | #IVm7(b5) | V7 | I | IIm7 | V7 | I",
  },
  {
    id: "mai-8",
    category: "Progressões Maiores",
    name: "Linha interna 1º — I7M | I7M/7M | I7 | IV7M",
    degreesClean: "I7M | I7M/7M | I7 | IV7M",
    degrees: "I7M | I7M/VII | I7 | IV7M",
  },
  {
    id: "mai-9",
    category: "Progressões Maiores",
    name: "Linha interna 5º — I7M | III7 | VIm7 | IIm7 | V7 | I",
    degreesClean: "I7M | III7 | VIm7 | IIm7 | V7 | I",
    degrees: "I7M | III7 | VIm7 | IIm7 | V7 | I",
  },
  {
    id: "mai-10",
    category: "Progressões Maiores",
    name: "I7 | IV7",
    degreesClean: "I7 | IV7",
    degrees: "I7 | IV7",
  },
  {
    id: "mai-11",
    category: "Progressões Maiores",
    name: "I | IIm7 | V7",
    degreesClean: "I | IIm7 | V7",
    degrees: "I | IIm7 | V7",
  },
  {
    id: "mai-12",
    category: "Progressões Maiores",
    name: "I | VIm7 | IIm7 | V7",
    degreesClean: "I | VIm7 | IIm7 | V7",
    degrees: "I | VIm7 | IIm7 | V7",
  },
  {
    id: "mai-13",
    category: "Progressões Maiores",
    name: "I | IIIm7 | IV | V",
    degreesClean: "I | IIIm7 | IV | V",
    degrees: "I | IIIm7 | IV | V",
  },
  {
    id: "mai-14",
    category: "Progressões Maiores",
    name: "IV7M | IIIm7 | IIm7 | I7M",
    degreesClean: "IV7M | IIIm7 | IIm7 | I7M",
    degrees: "IV7M | IIIm7 | IIm7 | I7M",
  },
  {
    id: "mai-15",
    category: "Progressões Maiores",
    name: "I | II7 | IIm7 | V7",
    degreesClean: "I | II7 | IIm7 | V7",
    degrees: "I | II7 | IIm7 | V7",
  },

  // ── Progressões Menores ─────────────────────────────────────────────────
  {
    id: "men-1",
    category: "Progressões Menores",
    name: "Im7 | V7 | IIm7(b5) | V7 | Im7",
    degreesClean: "Im7 | V7 | IIm7(b5) | V7 | Im7",
    degrees: "Im7 | V7 | IIm7(b5) | V7 | Im7",
  },
  {
    id: "men-2",
    category: "Progressões Menores",
    name: "Im7 | IVm7 | bVII7 | bIII7M | bVI7M | IIm7(b5) | V7",
    degreesClean: "Im7 | IVm7 | bVII7 | bIII7M | bVI7M | IIm7(b5) | V7",
    degrees: "Im7 | IVm7 | bVII7 | bIII7M | bVI7M | IIm7(b5) | V7",
  },
  {
    id: "men-3",
    category: "Progressões Menores",
    name: "Im7 | IV7",
    degreesClean: "Im7 | IV7",
    degrees: "Im7 | IV7",
  },
  {
    id: "men-4",
    category: "Progressões Menores",
    name: "Im7 | II7 | IIm7(b5) | V7 | Im7 | V7",
    degreesClean: "Im7 | II7 | IIm7(b5) | V7 | Im7 | V7",
    degrees: "Im7 | II7 | IIm7(b5) | V7 | Im7 | V7",
  },
  {
    id: "men-5",
    category: "Progressões Menores",
    name: "Im7 | bVII7 | bVI7M | bVI7M/bVII | IIm7(b5) | V7 | Im7 | V7",
    degreesClean: "Im7 | bVII7 | bVI7M | bVI/b7 | IIm7(b5) | V7 | Im7 | V7",
    degrees: "Im7 | bVII7 | bVI7M | bVI7M/bVII | IIm7(b5) | V7 | Im7 | V7",
  },
  {
    id: "men-6",
    category: "Progressões Menores",
    name: "IVm7 | #IVdim | Im7/5ª | bVI7M | IIm7(b5) | V7 | Im7",
    degreesClean: "IVm7 | #IVdim | Im7/5ª | bVI7M | IIm7(b5) | V7 | Im7",
    degrees: "IVm7 | #IVdim | Im7/V | bVI7M | IIm7(b5) | V7 | Im7",
  },
  {
    id: "men-7",
    category: "Progressões Menores",
    name: "Linha interna 1º/5º — Im7 | Im7/b7 | IVm7 | V7 | Im7",
    degreesClean: "Im7 | Im7/b7 | IVm7 | V7 | Im7",
    degrees: "Im7 | Im7/bVII | IVm7 | V7 | Im7",
  },
  {
    id: "men-8",
    category: "Progressões Menores",
    name: "Im7 | IVm7 | IVm/b7 | IIm7(b5) | V7 | Im7 | V7",
    degreesClean: "Im7 | IVm7 | IVm/b7 | IIm7(b5) | V7 | Im7 | V7",
    degrees: "Im7 | IVm7 | IVm7/bIII | IIm7(b5) | V7 | Im7 | V7",
  },
  {
    id: "men-9",
    category: "Progressões Menores",
    name: "Im7 | Im/b7 | SubV (bII7) | V7",
    degreesClean: "Im7 | Im/b7 | bII7 | V7",
    degrees: "Im7 | Im7/bVII | bII7 | V7",
  },
  {
    id: "men-10",
    category: "Progressões Menores",
    name: "Im7 | Im/b7 | VIm7(b5) | bVI7M",
    degreesClean: "Im7 | Im/b7 | VIm7(b5) | bVI7M",
    degrees: "Im7 | Im7/bVII | VIm7(b5) | bVI7M",
  },

  // ── Empréstimo Modal ────────────────────────────────────────────────────
  {
    id: "aem-1",
    category: "Empréstimo Modal",
    name: "I7M | I6 | IVm7 | bVII7 | bIII7M | bVI7M | IIm7(b5) | V7",
    degreesClean: "I7M | I6 | IVm7 | bVII7 | bIII7M | bVI7M | IIm7(b5) | V7",
    degrees: "I7M | I6 | IVm7 | bVII7 | bIII7M | bVI7M | IIm7(b5) | V7",
  },
  {
    id: "aem-2",
    category: "Empréstimo Modal",
    name: "#IVm7(b5) | IVm6 | IIIm7 | bIIIdim | IIm7 | V7 | I",
    degreesClean: "#IVm7(b5) | IVm6 | IIIm7 | bIIIdim | IIm7 | V7 | I",
    degrees: "#IVm7(b5) | IVm6 | IIIm7 | bIIIdim | IIm7 | V7 | I",
  },
  {
    id: "aem-3",
    category: "Empréstimo Modal",
    name: "bVI7M | bVII7M | I7M",
    degreesClean: "bVI7M | bVII7M | I7M",
    degrees: "bVI7M | bVII7M | I7M",
  },
  {
    id: "aem-4",
    category: "Empréstimo Modal",
    name: "I7M | Im7",
    degreesClean: "I7M | Im7",
    degrees: "I7M | Im7",
  },
  {
    id: "aem-5",
    category: "Empréstimo Modal",
    name: "I7M | bVI7M | bII7M | IIm7(b5) | V7",
    degreesClean: "I7M | bVI7M | bII7M | IIm7(b5) | V7",
    degrees: "I7M | bVI7M | bII7M | IIm7(b5) | V7",
  },
  {
    id: "aem-6",
    category: "Empréstimo Modal",
    name: "I7M | IVm6 | I7M | IIm7(b5)",
    degreesClean: "I7M | IVm6 | I7M | IIm7(b5)",
    degrees: "I7M | IVm6 | I7M | IIm7(b5)",
  },
  {
    id: "aem-7",
    category: "Empréstimo Modal",
    name: "Im7 | % | bII7M | % | IIm7(b5) | V7",
    degreesClean: "Im7 | % | bII7M | % | IIm7(b5) | V7",
    degrees: "Im7 | % | bII7M | % | IIm7(b5) | V7",
  },
  {
    id: "aem-8",
    category: "Empréstimo Modal",
    name: "I7M | bVII7M",
    degreesClean: "I7M | bVII7M",
    degrees: "I7M | bVII7M",
  },

  // ── Diminutos ───────────────────────────────────────────────────────────
  {
    id: "dim-1",
    category: "Diminutos",
    name: "IV | #IVdim | I/5ª | IIm7 | V7",
    degreesClean: "IV | #IVdim | I/5ª | IIm7 | V7",
    degrees: "IV | #IVdim | I/V | IIm7 | V7",
  },
  {
    id: "dim-2",
    category: "Diminutos",
    name: "IIm7 | #IIdim | I/3ª | IIm7 | V7",
    degreesClean: "IIm7 | #IIdim | I/3ª | IIm7 | V7",
    degrees: "IIm7 | #IIdim | I/III | IIm7 | V7",
  },
  {
    id: "dim-3",
    category: "Diminutos",
    name: "I | V | #Vdim | VIm7 | IV | V",
    degreesClean: "I | V | #Vdim | VIm7 | IV | V",
    degrees: "I | V | #Vdim | VIm7 | IV | V",
  },
  {
    id: "dim-4",
    category: "Diminutos",
    name: "I7M | Idim | I7M",
    degreesClean: "I7M | Idim | I7M",
    degrees: "I7M | Idim | I7M",
  },
  {
    id: "dim-5",
    category: "Diminutos",
    name: "I | #Idim | IIm7 | #IIdim | IIIm7 | III7 | IV7M",
    degreesClean: "I | #Idim | IIm7 | #IIdim | IIIm7 | III7 | IV7M",
    degrees: "I | #Idim | IIm7 | #IIdim | IIIm7 | III7 | IV7M",
  },
  {
    id: "dim-6",
    category: "Diminutos",
    name: "IV | #IVdim | I7 | bII7 | bII7",
    degreesClean: "IV | #IVdim | I7 | bII7 | bII7",
    degrees: "IV | #IVdim | I7 | bII7 | bII7",
  },
  {
    id: "dim-7",
    category: "Diminutos",
    name: "I | bIIIdim | IIm7 | V7 | I",
    degreesClean: "I | bIIIdim | IIm7 | V7 | I",
    degrees: "I | bIIIdim | IIm7 | V7 | I",
  },

  // ── Dissonantes ─────────────────────────────────────────────────────────
  {
    id: "diss-maior",
    category: "Dissonante Maior",
    name: "I6/9 | I7(13) | IV7M | V7(9) | Vm7 | I7(9) | #IVm7(b5) | IVm7(9) | IIIm7(9) | VI7(9) | II7 | V7(4) | V7",
    degreesClean:
      "I6/9 | I7(13) | IV7M | V7(9) | Vm7 | I7(9) | #IVm7(b5) | IVm7(9) | IIIm7(9) | VI7(9) | II7 | V7(4) | V7",
    degrees:
      "I6/9 | I7(13) | IV7M | V7(9) | Vm7 | I7(9) | #IVm7(b5) | % | IVm7(9) | % | IIIm7(9) | % | VI7(9) | % | II7 | % | V7(4) | V7",
  },
  {
    id: "diss-menor",
    category: "Dissonante Menor",
    name: "Im7(9) | I7 | IVm7(9) | VII7 | III7M | VI7M | IIm7(b5) | V7(13)",
    degreesClean: "Im7(9) | I7 | IVm7(9) | VII7 | III7M | VI7M | IIm7(b5) | V7(13)",
    degrees: "Im7(9) | I7 | IVm7(9) | VII7 | III7M | VI7M | IIm7(b5) | V7(13)",
  },
];

// ── Key options ─────────────────────────────────────────────────────────────
export interface KeyOption {
  label: string;
  value: string;
  isMinor: boolean;
}

export const KEY_OPTIONS: KeyOption[] = [
  { label: "C  (Dó maior)", value: "C", isMinor: false },
  { label: "Db (Réb maior)", value: "Db", isMinor: false },
  { label: "D  (Ré maior)", value: "D", isMinor: false },
  { label: "Eb (Mib maior)", value: "Eb", isMinor: false },
  { label: "E  (Mi maior)", value: "E", isMinor: false },
  { label: "F  (Fá maior)", value: "F", isMinor: false },
  { label: "F# (Fá# maior)", value: "F#", isMinor: false },
  { label: "G  (Sol maior)", value: "G", isMinor: false },
  { label: "Ab (Láb maior)", value: "Ab", isMinor: false },
  { label: "A  (Lá maior)", value: "A", isMinor: false },
  { label: "Bb (Sib maior)", value: "Bb", isMinor: false },
  { label: "B  (Si maior)", value: "B", isMinor: false },
  { label: "Cm  (Dó menor)", value: "Cm", isMinor: true },
  { label: "C#m (Dó# menor)", value: "C#m", isMinor: true },
  { label: "Dm  (Ré menor)", value: "Dm", isMinor: true },
  { label: "Ebm (Mib menor)", value: "Ebm", isMinor: true },
  { label: "Em  (Mi menor)", value: "Em", isMinor: true },
  { label: "Fm  (Fá menor)", value: "Fm", isMinor: true },
  { label: "F#m (Fá# menor)", value: "F#m", isMinor: true },
  { label: "Gm  (Sol menor)", value: "Gm", isMinor: true },
  { label: "G#m (Sol# menor)", value: "G#m", isMinor: true },
  { label: "Am  (Lá menor)", value: "Am", isMinor: true },
  { label: "Bbm (Sib menor)", value: "Bbm", isMinor: true },
  { label: "Bm  (Si menor)", value: "Bm", isMinor: true },
];

// ── Scale degree notes per key ──────────────────────────────────────────────
const SCALE_NOTES: Record<string, string[]> = {
  C: ["C", "D", "E", "F", "G", "A", "B"],
  Db: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
  D: ["D", "E", "F#", "G", "A", "B", "C#"],
  Eb: ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
  E: ["E", "F#", "G#", "A", "B", "C#", "D#"],
  F: ["F", "G", "A", "Bb", "C", "D", "E"],
  "F#": ["F#", "G#", "A#", "B", "C#", "D#", "F"],
  G: ["G", "A", "B", "C", "D", "E", "F#"],
  Ab: ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
  A: ["A", "B", "C#", "D", "E", "F#", "G#"],
  Bb: ["Bb", "C", "D", "Eb", "F", "G", "A"],
  B: ["B", "C#", "D#", "E", "F#", "G#", "A#"],
  Cm: ["C", "D", "Eb", "F", "G", "Ab", "Bb"],
  "C#m": ["C#", "D#", "E", "F#", "G#", "A", "B"],
  Dm: ["D", "E", "F", "G", "A", "Bb", "C"],
  Ebm: ["Eb", "F", "Gb", "Ab", "Bb", "B", "Db"],
  Em: ["E", "F#", "G", "A", "B", "C", "D"],
  Fm: ["F", "G", "Ab", "Bb", "C", "Db", "Eb"],
  "F#m": ["F#", "G#", "A", "B", "C#", "D", "E"],
  Gm: ["G", "A", "Bb", "C", "D", "Eb", "F"],
  "G#m": ["G#", "A#", "B", "C#", "D#", "E", "F#"],
  Am: ["A", "B", "C", "D", "E", "F", "G"],
  Bbm: ["Bb", "C", "Db", "Eb", "F", "Gb", "Ab"],
  Bm: ["B", "C#", "D", "E", "F#", "G", "A"],
};

// ── Transposition ───────────────────────────────────────────────────────────
const ROMAN_TO_INDEX: Record<string, number> = {
  I: 0,
  II: 1,
  III: 2,
  IV: 3,
  V: 4,
  VI: 5,
  VII: 6,
};
const DEGREE_RE = /^([b#]?)(VII|VI|IV|V|III|II|I)(.*)$/;
const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const ENHARMONIC: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Fb: "E",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
  Cb: "B",
};

function getParallelMajorKey(minorKey: string): string {
  const maj = minorKey.slice(0, -1);
  if (maj === "C#") return "Db";
  if (maj === "G#") return "Ab";
  if (maj === "D#") return "Eb";
  if (maj === "A#") return "Bb";
  return maj;
}

function transposeSingleDegree(degree: string, key: string): string {
  const m = degree.match(DEGREE_RE);
  if (!m) return degree;
  const [, acc, roman, quality] = m;

  const isMinorKey = key.endsWith("m");
  const refKey = isMinorKey ? getParallelMajorKey(key) : key;

  const notes = SCALE_NOTES[refKey];
  if (!notes) return degree;
  const idx = ROMAN_TO_INDEX[roman];
  if (idx === undefined) return degree;

  let note = notes[idx];
  if (acc === "b" || acc === "#") {
    const norm = ENHARMONIC[note] ?? note;
    const ci = CHROMATIC.indexOf(norm);
    if (ci !== -1) {
      const shift = acc === "b" ? -1 : 1;
      const ni = (ci + shift + 12) % 12;
      note = acc === "b" ? FLAT_NAMES[ni] : CHROMATIC[ni];
    }
  }

  if (isMinorKey) {
    // Map the transposed note to the minor key's spelling
    const minorNotes = SCALE_NOTES[key];
    if (minorNotes) {
      // Find a note in minorNotes that is enharmonically equivalent to `note`
      const targetCi = CHROMATIC.indexOf(ENHARMONIC[note] ?? note);
      const matched = minorNotes.find((mn) => CHROMATIC.indexOf(ENHARMONIC[mn] ?? mn) === targetCi);
      if (matched) {
        note = matched;
      }
    }
  }

  return note + quality;
}

function transposeDegree(degree: string, key: string): string {
  // Handle slash chords: ROMAN/ROMAN (e.g. V/VII, IVm/bVI, Im7/bVII)
  const slashIdx = degree.lastIndexOf("/");
  if (slashIdx > 0) {
    const main = degree.slice(0, slashIdx);
    const bass = degree.slice(slashIdx + 1);
    if (DEGREE_RE.test(bass)) {
      return transposeSingleDegree(main, key) + "/" + transposeSingleDegree(bass, key);
    }
  }
  return transposeSingleDegree(degree, key);
}

export function transposeDegrees(degreesStr: string, key: string): string {
  let lastChord = "";
  return degreesStr
    .split(/(\s*\|\s*)/)
    .map((part) => {
      const trimmed = part.trim();
      if (trimmed === "|" || trimmed === "||" || trimmed === "") return part;
      return trimmed
        .split(/\s+/)
        .map((t) => {
          if (t === "%") {
            return lastChord || "%";
          }
          const transposed = transposeDegree(t, key);
          lastChord = transposed;
          return transposed;
        })
        .join(" ");
    })
    .join("");
}
