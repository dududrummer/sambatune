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
