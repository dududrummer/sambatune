# appChords Fase 1 — Aba Improvisação Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Improvisation tab with jazz hidden, BPM locked to the selected loop, and each chord card always expanded showing chord diagram + navigable arpeggio + per-instance scale selector with 3 fretboard regions.

**Architecture:** New `ImprovisationCard` component renders per-chord beat; `ProgressionGrid` delegates to it when `showImprovisationOptions` is true; `ProgressionEditor` holds per-chord scale state keyed by `${measureIndex}_${beatIndex}`; `ProgressionAudio` gains a `mode` prop to filter jazz and lock BPM to loop BPMs.

**Tech Stack:** React 19, TypeScript, Tone.js, shadcn/ui Popover, Lucide icons, existing `searchVoicings` (arpeggio-search.ts), `getScalePositions` / `getScaleOptionsForPosition` / `voicingToScalePosition` (scale-search.ts), `availableBpms` (audio-loops.ts), `VoicingMiniSvg`.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/components/ProgressionAudio.tsx` | Modify | Add `mode` prop, filter jazz/bossanova, replace BPM slider with select |
| `src/components/ImprovisationCard.tsx` | **Create** | Full card per ChordBeat: chord + arpejo nav + scale selector + 3 regions |
| `src/components/ProgressionGrid.tsx` | Modify | Pass `chordScales` + `onChordScalesChange` + `instrument`; render `ImprovisationCard` |
| `src/components/ProgressionEditor.tsx` | Modify | Add `chordScales` state, persist in draft, pass `mode` to ProgressionAudio |

---

## Task 1: ProgressionAudio — `mode` prop, hide jazz, lock BPM to loop

**Files:**
- Modify: `src/components/ProgressionAudio.tsx`

- [ ] **Step 1: Add import for `availableBpms`**

At the top of `ProgressionAudio.tsx`, add to the existing imports:

```typescript
import { availableBpms, type LoopStyle } from '@/config/audio-loops';
```

- [ ] **Step 2: Add `mode` to Props interface and function signature**

Change the `Props` interface (currently ends at line 16) to:

```typescript
interface Props {
  measures: Measure[];
  voicings: Record<string, StoredVoicing>;
  onMeasureChange: (idx: number | null) => void;
  mode?: 'progression' | 'improvisation';
}
```

Update the function signature:

```typescript
export function ProgressionAudio({ measures, voicings, onMeasureChange, mode = 'progression' }: Props) {
```

- [ ] **Step 3: Filter styles for improvisation mode**

Inside the component body, after the `const [loop, setLoop]` state line, add:

```typescript
const visibleStyles = mode === 'improvisation'
  ? STYLES.filter(s => s.value === 'batucada' || s.value === 'sambaenredo')
  : STYLES;
```

In the JSX, replace `{STYLES.map(s => (` with `{visibleStyles.map(s => (`.

- [ ] **Step 4: Lock BPM to loop BPM in improvisation mode — update `handleStyleChange`**

Replace the existing `handleStyleChange`:

```typescript
const handleStyleChange = useCallback((s: Style) => {
  setStyle(s);
  const newBpm = DEFAULT_BPM[s];
  setBpmState(newBpm);
  if (isPlaying) setBpm(newBpm);
}, [isPlaying]);
```

- [ ] **Step 5: Replace the BPM slider section with a conditional**

Find the `<div className="space-y-2">` block that contains the `<Slider>`. Wrap it in a conditional so improvisation mode shows a `<select>` instead:

```typescript
{mode === 'improvisation' ? (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <Label className="text-sm font-semibold">Andamento</Label>
      <span className="font-mono font-bold tabular-nums text-lg">
        🔒 {bpm} <span className="text-xs font-normal text-muted-foreground">BPM</span>
      </span>
    </div>
    <select
      value={bpm}
      onChange={e => {
        const v = Number(e.target.value);
        setBpmState(v);
        if (isPlaying) setBpm(v);
      }}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {availableBpms(style as LoopStyle).map(b => (
        <option key={b} value={b}>{b} BPM</option>
      ))}
    </select>
    <p className="text-[11px] text-muted-foreground">
      BPM travado ao loop — escolha o andamento da batucada
    </p>
  </div>
) : (
  <div className="space-y-2">
    {/* KEEP the existing slider section here exactly as-is */}
    ...
  </div>
)}
```

- [ ] **Step 6: Start dev server and verify Task 1**

```bash
npm run dev
```

Open the Improvisation tab. Confirm:
- Only Batucada and Samba Enredo appear in the style grid
- BPM section shows `🔒 90 BPM` with a `<select>` dropdown
- Selecting "120 BPM" in the dropdown updates the displayed BPM
- Switching to Samba Enredo changes the BPM options to 125–160
- Opening the Progression tab still shows Jazz and Bossa Nova in the style selector

- [ ] **Step 7: Commit**

```bash
git add src/components/ProgressionAudio.tsx
git commit -m "feat: hide jazz and lock BPM to loop in improvisation mode"
```

---

## Task 2: Create `ImprovisationCard` — Row 1 (chord + arpejo navigation)

**Files:**
- Create: `src/components/ImprovisationCard.tsx`

- [ ] **Step 1: Create the file with Row 1 only**

Create `src/components/ImprovisationCard.tsx` with:

```typescript
import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ChordBeat } from '@/lib/progression';
import type { Voicing } from '@/lib/chord-finder';
import { searchVoicings } from '@/lib/arpeggio-search';
import { VoicingMiniSvg } from './VoicingMiniSvg';

interface StoredVoicing extends Voicing { tuning: string[] }

export interface ImprovisationCardProps {
  chordBeat: ChordBeat;
  voicing: StoredVoicing;
  instrument: string;
  tuning: string[];
  selectedScales: string[];
  onScalesChange: (scales: string[]) => void;
  stringCount: number;
  markerColor: string;
  primaryColor: string;
  measureIndex: number;
  beatIndex: number;
}

export function ImprovisationCard({
  chordBeat, voicing, instrument, tuning,
  selectedScales, onScalesChange,
  stringCount, markerColor, primaryColor,
}: ImprovisationCardProps) {
  // ── Arpejo navigation ──────────────────────────────────────────────────
  const allVoicings = useMemo(
    () => searchVoicings(chordBeat.chordName, { instrument, tuning, maxPerRegion: 3 }),
    [chordBeat.chordName, instrument, tuning],
  );

  const [arpeggioIndex, setArpeggioIndex] = useState(0);

  // Auto-select arpejo closest to the chord's fret region
  useEffect(() => {
    if (allVoicings.length === 0) return;
    let bestIdx = 0;
    let minDiff = Infinity;
    allVoicings.forEach((v, i) => {
      const diff = Math.abs(v.startingFret - voicing.startingFret);
      if (diff < minDiff) { minDiff = diff; bestIdx = i; }
    });
    setArpeggioIndex(bestIdx);
  }, [allVoicings, voicing.startingFret]);

  const arpVoicing = allVoicings[arpeggioIndex];
  const strCount = voicing.tuning?.length ?? stringCount;

  return (
    <div className="flex flex-col gap-2 rounded-lg border-2 border-border bg-card p-2 min-w-[180px]">
      {/* Row 1: Chord + Arpejo side-by-side */}
      <div className="flex gap-2 justify-center">
        {/* Chord diagram */}
        <div className="flex flex-col items-center rounded-md border-2 border-primary bg-primary/5 p-1">
          <span className="text-[10px] font-bold text-primary leading-tight">
            {chordBeat.chordName}
          </span>
          <VoicingMiniSvg
            voicing={voicing}
            stringCount={strCount}
            markerColor={markerColor}
            primaryColor={primaryColor}
            renderMode="chord"
            width={52}
            height={94}
          />
        </div>

        {/* Arpejo with ◀ ▶ navigation */}
        {arpVoicing ? (
          <div className="flex flex-col items-center rounded-md border-2 border-emerald-500 bg-emerald-500/5 p-1">
            <div className="flex items-center w-full justify-between">
              <button
                onClick={() =>
                  setArpeggioIndex(i => (i - 1 + allVoicings.length) % allVoicings.length)
                }
                disabled={allVoicings.length <= 1}
                className="text-emerald-500 hover:text-emerald-400 disabled:opacity-30"
                aria-label="Arpejo anterior"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                ARPEJO
              </span>
              <button
                onClick={() => setArpeggioIndex(i => (i + 1) % allVoicings.length)}
                disabled={allVoicings.length <= 1}
                className="text-emerald-500 hover:text-emerald-400 disabled:opacity-30"
                aria-label="Próximo arpejo"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <VoicingMiniSvg
              voicing={arpVoicing}
              stringCount={strCount}
              markerColor={markerColor}
              primaryColor={primaryColor}
              arpeggioColor="#10b981"
              renderMode="arpeggio"
              width={52}
              height={94}
            />
            {/* Position dots */}
            <div className="flex gap-1 mt-0.5">
              {allVoicings.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    i === arpeggioIndex ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-md border-2 border-dashed border-muted p-2 min-w-[60px]">
            <span className="text-[9px] text-muted-foreground">sem arpejo</span>
          </div>
        )}
      </div>

      {/* Row 2: Scale selector — added in Task 3 */}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run dev
```

Check the terminal for type errors. The most likely issue: `ChordBeat` may not be exported from `@/lib/progression` — verify the import. Fix before proceeding.

- [ ] **Step 3: Commit Row 1**

```bash
git add src/components/ImprovisationCard.tsx
git commit -m "feat: ImprovisationCard with chord diagram and arpejo navigation (Row 1)"
```

---

## Task 3: Add Row 2 to `ImprovisationCard` — scale dropdown + 3 regions

**Files:**
- Modify: `src/components/ImprovisationCard.tsx`

- [ ] **Step 1: Add scale-related imports and category definitions**

At the top of `ImprovisationCard.tsx`, add imports:

```typescript
import { Plus, X } from 'lucide-react';
import {
  getScalePositions,
  getScaleOptionsForPosition,
  type ScalePosition,
} from '@/lib/scale-search';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
```

After the imports, add the scale category config (outside the component):

```typescript
const SCALE_CATEGORIES = [
  {
    label: 'Modos Gregos',
    modes: ['Jônio', 'Dórico', 'Frígio', 'Lídio', 'Mixolídio', 'Eólio', 'Lócrio'],
  },
  {
    label: 'Pentatônicas',
    modes: ['Pentatônica Maior', 'Pentatônica Menor'],
  },
  {
    label: 'Blues',
    modes: ['Blues Maior', 'Blues Menor'],
  },
] as const;
```

- [ ] **Step 2: Add `getThreeRegions` helper (outside the component)**

```typescript
/** Returns [beforePos, atPos, afterPos] scale positions relative to a chord's fret. */
function getThreeRegions(
  chordName: string,
  tuning: string[],
  currentStartingFret: number,
): [ScalePosition | null, ScalePosition | null, ScalePosition | null] {
  const all = getScalePositions(chordName, tuning);
  if (all.length === 0) return [null, null, null];

  const sorted = [...all].sort((a, b) => a.lowestFret - b.lowestFret);

  let atIdx = 0;
  let minDiff = Infinity;
  sorted.forEach((pos, i) => {
    const d = Math.abs(pos.lowestFret - currentStartingFret);
    if (d < minDiff) { minDiff = d; atIdx = i; }
  });

  return [
    atIdx > 0 ? sorted[atIdx - 1] : null,
    sorted[atIdx] ?? null,
    atIdx < sorted.length - 1 ? sorted[atIdx + 1] : null,
  ];
}
```

- [ ] **Step 3: Add `ScaleRegionDiagram` sub-component (outside the component)**

```typescript
function ScaleRegionDiagram({
  label, position, chordName, tuning, scaleName,
  strCount, markerColor, primaryColor, isHighlighted,
}: {
  label: string;
  position: ScalePosition | null;
  chordName: string;
  tuning: string[];
  scaleName: string;
  strCount: number;
  markerColor: string;
  primaryColor: string;
  isHighlighted: boolean;
}) {
  const scaleOption = useMemo(() => {
    if (!position) return null;
    const options = getScaleOptionsForPosition(chordName, tuning, position);
    return (
      options.find(o => o.name.toLowerCase().includes(scaleName.toLowerCase())) ??
      options.find(o => o.description?.toLowerCase().includes(scaleName.toLowerCase())) ??
      null
    );
  }, [position, chordName, tuning, scaleName]);

  return (
    <div
      className={`flex flex-1 flex-col items-center rounded p-1 transition-opacity ${
        isHighlighted ? 'border border-primary/40 bg-primary/5' : 'opacity-50'
      }`}
    >
      <span className="text-[8px] text-muted-foreground mb-0.5 truncate w-full text-center">
        {label}
      </span>
      {scaleOption ? (
        <VoicingMiniSvg
          voicing={scaleOption.voicing}
          stringCount={strCount}
          markerColor={markerColor}
          primaryColor={primaryColor}
          arpeggioColor="#8b5cf6"
          renderMode="arpeggio"
          width={46}
          height={82}
        />
      ) : (
        <div className="flex h-[82px] w-[46px] items-center justify-center text-[10px] text-muted-foreground">
          —
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add `ScaleDropdown` sub-component (outside the component)**

```typescript
function ScaleDropdown({
  selectedScales,
  onAdd,
}: {
  selectedScales: string[];
  onAdd: (scale: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-muted-foreground/40 px-2 py-0.5 text-[9px] text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-30"
          disabled={selectedScales.length >= 5}
        >
          <Plus className="h-2.5 w-2.5" />
          {selectedScales.length}/5
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start" side="bottom">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {SCALE_CATEGORIES.map(cat => (
            <div key={cat.label}>
              <div className="mb-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                {cat.label}
              </div>
              <div className="space-y-0.5 pl-1">
                {cat.modes.map(mode => {
                  const isActive = selectedScales.includes(mode);
                  return (
                    <button
                      key={mode}
                      disabled={isActive}
                      onClick={() => { onAdd(mode); setOpen(false); }}
                      className={`w-full rounded px-2 py-0.5 text-left text-[10px] transition-colors ${
                        isActive
                          ? 'cursor-default text-muted-foreground'
                          : 'cursor-pointer hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      {isActive ? `✓ ${mode}` : mode}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 5: Add `ScaleRegionsDisplay` sub-component (outside the component)**

```typescript
function ScaleRegionsDisplay({
  selectedScales, chordName, tuning,
  currentStartingFret, strCount, markerColor, primaryColor,
}: {
  selectedScales: string[];
  chordName: string;
  tuning: string[];
  currentStartingFret: number;
  strCount: number;
  markerColor: string;
  primaryColor: string;
}) {
  const [activeScale, setActiveScale] = useState(selectedScales[0] ?? '');

  useEffect(() => {
    if (!selectedScales.includes(activeScale) && selectedScales.length > 0) {
      setActiveScale(selectedScales[0]);
    }
  }, [selectedScales, activeScale]);

  const [before, at, after] = useMemo(
    () => getThreeRegions(chordName, tuning, currentStartingFret),
    [chordName, tuning, currentStartingFret],
  );

  return (
    <div className="space-y-1.5">
      {/* Scale tabs — only shown when more than 1 scale is active */}
      {selectedScales.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {selectedScales.map(scale => (
            <button
              key={scale}
              onClick={() => setActiveScale(scale)}
              className={`rounded px-2 py-0.5 text-[9px] transition-colors ${
                scale === activeScale
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {scale}
            </button>
          ))}
        </div>
      )}

      {/* 3 fretboard regions */}
      <div className="flex gap-1">
        <ScaleRegionDiagram
          label="◀ antes"
          position={before}
          chordName={chordName}
          tuning={tuning}
          scaleName={activeScale}
          strCount={strCount}
          markerColor={markerColor}
          primaryColor={primaryColor}
          isHighlighted={false}
        />
        <ScaleRegionDiagram
          label="● região"
          position={at}
          chordName={chordName}
          tuning={tuning}
          scaleName={activeScale}
          strCount={strCount}
          markerColor={markerColor}
          primaryColor={primaryColor}
          isHighlighted={true}
        />
        <ScaleRegionDiagram
          label="depois ▶"
          position={after}
          chordName={chordName}
          tuning={tuning}
          scaleName={activeScale}
          strCount={strCount}
          markerColor={markerColor}
          primaryColor={primaryColor}
          isHighlighted={false}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Wire Row 2 into `ImprovisationCard` (replace the `{/* Row 2 */}` comment)**

```typescript
{/* Row 2: Scale selector + 3 fretboard regions */}
<div className="border-t border-dashed border-border/50 pt-2 space-y-2">
  {/* Chips + add button */}
  <div className="flex flex-wrap gap-1 items-center min-h-[20px]">
    {selectedScales.map(scale => (
      <span
        key={scale}
        className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-medium text-primary"
      >
        {scale}
        <button
          onClick={() => onScalesChange(selectedScales.filter(s => s !== scale))}
          aria-label={`Remover ${scale}`}
          className="hover:text-destructive"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </span>
    ))}
    <ScaleDropdown
      selectedScales={selectedScales}
      onAdd={scale => onScalesChange([...selectedScales, scale])}
    />
  </div>

  {selectedScales.length > 0 ? (
    <ScaleRegionsDisplay
      selectedScales={selectedScales}
      chordName={chordBeat.chordName}
      tuning={tuning}
      currentStartingFret={voicing.startingFret}
      strCount={strCount}
      markerColor={markerColor}
      primaryColor={primaryColor}
    />
  ) : (
    <p className="text-center text-[9px] text-muted-foreground">
      Adicione escalas para ver os shapes
    </p>
  )}
</div>
```

- [ ] **Step 7: Start dev server and verify Row 2**

```bash
npm run dev
```

We'll do full verification after wiring in Task 5, but confirm no TypeScript errors here first. Common issue: `getScaleOptionsForPosition` signature — check its actual signature by reading lines 657–680 of `scale-search.ts` and adjust the call if needed (it may take 2 args, not 3).

- [ ] **Step 8: Commit**

```bash
git add src/components/ImprovisationCard.tsx
git commit -m "feat: add scale selector and 3-region display to ImprovisationCard (Row 2)"
```

---

## Task 4: Wire `ProgressionGrid` to use `ImprovisationCard`

**Files:**
- Modify: `src/components/ProgressionGrid.tsx`

- [ ] **Step 1: Add new props to the `Props` interface**

In `ProgressionGrid.tsx`, add to the `Props` interface:

```typescript
interface Props {
  // ... all existing props unchanged ...
  chordScales?: Record<string, string[]>;
  onChordScalesChange?: (key: string, scales: string[]) => void;
  instrument?: string;
}
```

Update the destructuring in the function signature to include the new props:

```typescript
export function ProgressionGrid({
  measures, analysis, activeMeasure,
  voicings = {}, stringCount = 6,
  markerColor = '#000', primaryColor = '#000',
  getVoicingsForChord, onVoicingSelect,
  showImprovisationOptions = false,
  tuning = ['D', 'G', 'B', 'D'],
  chordScales = {},
  onChordScalesChange,
  instrument = 'cavaquinho',
}: Props) {
```

- [ ] **Step 2: Import `ImprovisationCard`**

At the top of `ProgressionGrid.tsx`:

```typescript
import { ImprovisationCard } from './ImprovisationCard';
```

- [ ] **Step 3: Replace existing cell content with `ImprovisationCard` when in improvisation mode**

Inside the `measure.beats.map((beat, bi) => { ... })`, find the outermost `<div key={bi} ...>`. Add a conditional immediately after its opening tag — before the roman numeral and chord name:

```typescript
{/* Improvisation mode: full ImprovisationCard */}
{showImprovisationOptions && voicing ? (
  <ImprovisationCard
    chordBeat={beat}
    voicing={voicing}
    instrument={instrument}
    tuning={tuning}
    selectedScales={chordScales[`${measure.index}_${bi}`] ?? []}
    onScalesChange={scales =>
      onChordScalesChange?.(`${measure.index}_${bi}`, scales)
    }
    stringCount={voicing.tuning?.length ?? stringCount}
    markerColor={markerColor}
    primaryColor={primaryColor}
    measureIndex={measure.index}
    beatIndex={bi}
  />
) : (
  <>
    {/* Existing content: roman numeral, chord name, VoicingPicker, scales */}
    {/* Keep ALL the existing JSX here unchanged */}
  </>
)}
```

The outer `<div key={bi}>` wrapper stays — only its children are replaced conditionally.

- [ ] **Step 4: Remove `scaleOptionsMap` computation when in improvisation mode (optional optimization)**

The existing `useMemo` that computes `scaleOptionsMap` runs even in improvisation mode. Add an early-return guard:

```typescript
const scaleOptionsMap = useMemo(() => {
  if (!showImprovisationOptions) return {} as Record<string, ScaleOptionResult[]>;
  // ... rest of existing logic ...
}, [showImprovisationOptions, measures, voicings, tuning]);
```

This is already there — confirm it has the `!showImprovisationOptions` guard. If not, add it.

- [ ] **Step 5: Start dev server and verify end-to-end**

```bash
npm run dev
```

Open the Improvisation tab. Enter: `Am7 | Dm7 | G7 | C7M`

Verify:
- Each chord card shows chord diagram + arpejo with ◀ ▶ dots
- Clicking ◀ ▶ navigates between arpejo shapes
- Clicking `+ 0/5` opens the scale dropdown with Modos Gregos, Pentatônicas, Blues
- Selecting "Dórico" shows 3 scale region diagrams (◀ antes · ● região · depois ▶)
- Selecting a 2nd scale shows tabs to switch between them
- The Progression tab is unchanged

- [ ] **Step 6: Commit**

```bash
git add src/components/ProgressionGrid.tsx
git commit -m "feat: use ImprovisationCard per chord beat in improvisation mode"
```

---

## Task 5: Wire `ProgressionEditor` — chordScales state, persistence, mode prop

**Files:**
- Modify: `src/components/ProgressionEditor.tsx`

- [ ] **Step 1: Read the file to understand current state structure**

Read `src/components/ProgressionEditor.tsx` in full. Look for:
1. The `IMPROVISATION_DRAFT_KEY` constant and where the draft is saved/loaded from localStorage
2. Where `<ProgressionAudio` is rendered — check what props it currently receives
3. Where `<ProgressionGrid` is rendered — check what props it currently receives
4. What the `instrument` state/prop is called

- [ ] **Step 2: Add `chordScales` state**

After the existing state declarations, add:

```typescript
const [chordScales, setChordScales] = useState<Record<string, string[]>>({});
```

- [ ] **Step 3: Load `chordScales` from the improvisation draft**

Find the localStorage load logic (likely near the `useState` for `progressionInput` or in a `useEffect`). Add:

```typescript
// In the draft parse section:
const draft = JSON.parse(localStorage.getItem(IMPROVISATION_DRAFT_KEY) ?? '{}');
// ... existing draft field loading ...
if (draft.chordScales && typeof draft.chordScales === 'object') {
  setChordScales(draft.chordScales as Record<string, string[]>);
}
```

- [ ] **Step 4: Save `chordScales` to the improvisation draft**

Find the `useEffect` that saves to localStorage. Add `chordScales` to the saved object:

```typescript
localStorage.setItem(
  IMPROVISATION_DRAFT_KEY,
  JSON.stringify({
    // ... existing fields ...
    chordScales,
  }),
);
```

Add `chordScales` to the effect's dependency array.

- [ ] **Step 5: Pass `mode="improvisation"` to `ProgressionAudio`**

Find `<ProgressionAudio` in ProgressionEditor. Add the prop:

```typescript
<ProgressionAudio
  measures={measures}
  voicings={voicings}
  onMeasureChange={setActiveMeasure}
  mode="improvisation"
/>
```

- [ ] **Step 6: Pass `chordScales`, `onChordScalesChange`, and `instrument` to `ProgressionGrid`**

Find `<ProgressionGrid` in ProgressionEditor. Add:

```typescript
<ProgressionGrid
  {/* ... all existing props ... */}
  chordScales={chordScales}
  onChordScalesChange={(key, scales) =>
    setChordScales(prev => ({ ...prev, [key]: scales }))
  }
  instrument={instrument}  // use whatever the instrument variable/state is called
/>
```

- [ ] **Step 7: Run TypeScript check**

```bash
npx tsc --noEmit
```

Fix any type errors. Common issues:
- `ChordBeat` not exported from `@/lib/progression` — add `export` to the interface in `progression.ts`
- `instrument` prop name mismatch — check what ProgressionGrid expects vs what ProgressionEditor has

- [ ] **Step 8: Full end-to-end test**

```bash
npm run dev
```

Run through all 7 acceptance criteria from the spec:

1. ☐ Jazz and Bossa Nova absent from improvisation style selector
2. ☐ Selecting "Batucada 90 BPM" shows `🔒 90 BPM`, selecting "120 BPM" plays at 120
3. ☐ Every chord card shows: diagram + arpejo nav (◀ dots ▶) + scale selector + 3 regions
4. ☐ Am7 at measure 1 can have "Dórico" while Am7 at measure 3 has "Eólio" (independent)
5. ☐ Reload page → selected scales persist per chord
6. ☐ Enter 16 chords — grid scrolls, all cards render without error
7. ☐ Progression, Dictionary, Arpejos, Scales, Exercises tabs are unchanged

- [ ] **Step 9: Commit**

```bash
git add src/components/ProgressionEditor.tsx
git commit -m "feat: chordScales state, persistence, and mode prop in ProgressionEditor"
```

---

## Task 6: Final cleanup and tag

**Files:** None

- [ ] **Step 1: Run TypeScript check one last time**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Test 16-chord progression**

Enter in the Improvisation tab:
```
Am7 | Dm7 | G7 | C7M | Em7 | Am7 | F7M | G7 | Am7 | Dm7 | E7 | Am7 | F7M | C7M | G7 | Am7
```

Confirm: grid scrolls vertically, all 16 cards render with arpejo + scale controls, no layout overflow.

- [ ] **Step 3: Final commit**

```bash
git add -p
git commit -m "feat: complete Phase 1 — improvisation tab with arpejo nav, scale regions, BPM lock"
```
