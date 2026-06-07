import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import type { ChordBeat } from '@/lib/progression';
import type { Voicing } from '@/lib/chord-finder';
import { searchVoicings } from '@/lib/arpeggio-search';
import { VoicingMiniSvg } from './VoicingMiniSvg';
import {
  getScalePositions,
  getScaleOptionsForPosition,
  type ScalePosition,
} from '@/lib/scale-search';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

const SCALE_CATEGORIES = [
  { label: 'Modos Gregos', modes: ['Jônio', 'Dórico', 'Frígio', 'Lídio', 'Mixolídio', 'Eólio', 'Lócrio'] },
  { label: 'Pentatônicas', modes: ['Pentatônica Maior', 'Pentatônica Menor'] },
  { label: 'Blues', modes: ['Blues Maior', 'Blues Menor'] },
] as const;

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
    <div className={`flex flex-1 flex-col items-center rounded p-1 transition-opacity ${
      isHighlighted ? 'border border-primary/40 bg-primary/5' : 'opacity-50'
    }`}>
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
                        isActive ? 'cursor-default text-muted-foreground' : 'cursor-pointer hover:bg-primary/10 hover:text-primary'
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
  }, [selectedScales]);

  const [before, at, after] = useMemo(
    () => getThreeRegions(chordName, tuning, currentStartingFret),
    [chordName, tuning, currentStartingFret],
  );

  return (
    <div className="space-y-1.5">
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
      <div className="flex gap-1">
        <ScaleRegionDiagram label="◀ antes" position={before} chordName={chordName} tuning={tuning} scaleName={activeScale} strCount={strCount} markerColor={markerColor} primaryColor={primaryColor} isHighlighted={false} />
        <ScaleRegionDiagram label="● região" position={at} chordName={chordName} tuning={tuning} scaleName={activeScale} strCount={strCount} markerColor={markerColor} primaryColor={primaryColor} isHighlighted={true} />
        <ScaleRegionDiagram label="depois ▶" position={after} chordName={chordName} tuning={tuning} scaleName={activeScale} strCount={strCount} markerColor={markerColor} primaryColor={primaryColor} isHighlighted={false} />
      </div>
    </div>
  );
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

      {/* Row 2: Scale selector + 3 fretboard regions */}
      <div className="border-t border-dashed border-border/50 pt-2 space-y-2">
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
    </div>
  );
}
