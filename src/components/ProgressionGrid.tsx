import { useState } from 'react';
import type { Measure } from '@/lib/progression';
import type { HarmonicAnalysis } from '@/lib/harmony';
import type { Voicing } from '@/lib/chord-finder';
import { VoicingMiniSvg } from './VoicingMiniSvg';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface StoredVoicing extends Voicing { tuning: string[] }

const FUNC_COLORS: Record<string, string> = {
  blue:   'bg-blue-100 border-blue-400 text-blue-900 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-200',
  yellow: 'bg-yellow-50 border-yellow-400 text-yellow-900 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-200',
  red:    'bg-red-100 border-red-400 text-red-900 dark:bg-red-900/30 dark:border-red-600 dark:text-red-200',
  orange: 'bg-orange-100 border-orange-400 text-orange-900 dark:bg-orange-900/30 dark:border-orange-500 dark:text-orange-200',
  purple: 'bg-purple-100 border-purple-400 text-purple-900 dark:bg-purple-900/30 dark:border-purple-500 dark:text-purple-200',
  zinc:   'bg-zinc-100 border-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-300',
};

const FUNC_BADGE: Record<string, string> = {
  blue: 'bg-blue-500', yellow: 'bg-yellow-500', red: 'bg-red-500',
  orange: 'bg-orange-500', purple: 'bg-purple-500', zinc: 'bg-zinc-400',
};

interface Props {
  measures: Measure[];
  analysis: HarmonicAnalysis | null;
  activeMeasure: number | null;
  voicings?: Record<string, StoredVoicing>;
  stringCount?: number;
  markerColor?: string;
  primaryColor?: string;
  /** Provides all available voicings for a chord name (for the picker) */
  getVoicingsForChord?: (chordName: string) => Voicing[];
  /** Called when user selects a new voicing in the picker */
  onVoicingSelect?: (chordName: string, voicing: Voicing) => void;
  showImprovisationOptions?: boolean;
}

// ── Voicing Picker Popover ──────────────────────────────────────────────────
function VoicingPicker({
  chordName, current, allVoicings, stringCount, markerColor, primaryColor, onSelect,
}: {
  chordName: string;
  current: StoredVoicing;
  allVoicings: Voicing[];
  stringCount: number;
  markerColor: string;
  primaryColor: string;
  onSelect: (v: Voicing) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="mt-1 rounded overflow-hidden bg-white/60 dark:bg-black/30 cursor-pointer
                     ring-1 ring-transparent hover:ring-primary/50 transition-all hover:scale-105"
          title={`Clique para trocar posição de ${chordName}`}
        >
          <VoicingMiniSvg
            voicing={current}
            stringCount={current.tuning?.length ?? stringCount}
            markerColor={markerColor}
            primaryColor={primaryColor}
            renderMode="chord"
            width={58}
            height={104}
          />
          <div className="text-[7px] text-center opacity-50 pb-0.5">
            {current.frets.map(f => f === -1 ? 'X' : f).join(' ')}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-[360px] p-3"
        align="center"
        side="bottom"
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="space-y-2">
          <div className="text-sm font-bold">{chordName}</div>
          <p className="text-[10px] text-muted-foreground">
            Selecione uma posição diferente:
          </p>
          <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
            {allVoicings.map((v, i) => {
              const isSelected = current.frets.join(',') === v.frets.join(',');
              return (
                <button
                  key={i}
                  onClick={() => { onSelect(v); setOpen(false); }}
                  className={`rounded-lg border-2 transition-all hover:scale-105 cursor-pointer bg-white dark:bg-zinc-900 ${
                    isSelected ? 'border-primary shadow-md scale-105' : 'border-border'
                  }`}
                  title={`Traste ${v.startingFret}: ${v.frets.map(f => f === -1 ? 'X' : f).join('-')}`}
                >
                  <VoicingMiniSvg
                    voicing={v}
                    stringCount={current.tuning?.length ?? stringCount}
                    markerColor={markerColor}
                    primaryColor={primaryColor}
                    renderMode="chord"
                    width={64}
                    height={110}
                  />
                  <div className="text-[8px] text-center text-muted-foreground pb-1 px-1">
                    {v.frets.map(f => f === -1 ? 'X' : f).join(' ')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Main Grid ───────────────────────────────────────────────────────────────
export function ProgressionGrid({
  measures, analysis, activeMeasure,
  voicings = {}, stringCount = 6,
  markerColor = '#000', primaryColor = '#000',
  getVoicingsForChord, onVoicingSelect,
  showImprovisationOptions = false,
}: Props) {
  const hasVoicings = Object.keys(voicings).length > 0;

  if (measures.length === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm py-8">
        Digite uma progressão acima para visualizar.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Key + legend */}
      {analysis && (
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span className="font-semibold">Tom:</span>
          <span className="rounded-full bg-primary text-primary-foreground px-3 py-0.5 font-bold text-sm">
            {analysis.keyName}
          </span>
          <span className="flex gap-1.5 ml-1 flex-wrap">
            {[
              { color: 'blue',   label: 'T' },
              { color: 'yellow', label: 'SD' },
              { color: 'red',    label: 'D' },
              { color: 'orange', label: 'Dom.Sec' },
              { color: 'purple', label: 'Modal' },
            ].map(({ color, label }) => (
              <span key={color} className={`rounded px-1.5 py-0.5 text-[9px] font-bold text-white ${FUNC_BADGE[color]}`}>
                {label}
              </span>
            ))}
          </span>
        </div>
      )}

      {/* Measures grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {measures.map((measure) => {
          const isActive = activeMeasure === measure.index;
          return (
            <div key={measure.index}
              className={`rounded-lg border-2 p-2 transition-all bg-card ${
                isActive ? 'ring-2 ring-primary ring-offset-1 scale-105' : ''
              }`}
            >
              <div className="text-[9px] text-muted-foreground mb-1 font-mono">c.{measure.index + 1}</div>
              <div className="flex gap-1 flex-wrap">
                {measure.beats.map((beat, bi) => {
                  const a = analysis?.analyses[beat.chordName];
                  const color = a?.color ?? 'zinc';
                  const voicing = voicings[beat.chordName];

                  // Get all voicings for the picker
                  const allVoicings = getVoicingsForChord
                    ? getVoicingsForChord(beat.chordName)
                    : [];

                  return (
                    <div key={bi}
                      className={`flex-1 min-w-0 rounded border px-1.5 py-1 flex flex-col items-center ${FUNC_COLORS[color]}`}
                      style={{ minWidth: showImprovisationOptions ? '78px' : '44px' }}
                    >
                      {/* Roman numeral */}
                      {a && (
                        <div className="text-[9px] font-bold opacity-70 leading-none mb-0.5 self-start">
                          {a.romanNumeral}
                        </div>
                      )}
                      {/* Chord name */}
                      <div className="text-xs font-bold truncate w-full leading-tight text-center">
                        {beat.chordName}
                      </div>
                      {/* Mini voicing diagram — clickable */}
                      {voicing && getVoicingsForChord && onVoicingSelect ? (
                        <VoicingPicker
                          chordName={beat.chordName}
                          current={voicing}
                          allVoicings={allVoicings}
                          stringCount={voicing.tuning?.length ?? stringCount}
                          markerColor={markerColor}
                          primaryColor={primaryColor}
                          onSelect={(v) => onVoicingSelect(beat.chordName, v)}
                        />
                      ) : voicing ? (
                        <div className="mt-1.5 rounded overflow-hidden bg-white/60 dark:bg-black/30">
                          <VoicingMiniSvg
                            voicing={voicing}
                            stringCount={voicing.tuning?.length ?? stringCount}
                            markerColor={markerColor}
                            primaryColor={primaryColor}
                            renderMode={showImprovisationOptions ? 'chord' : 'combined'}
                            width={58}
                            height={104}
                          />
                          <div className="text-[7px] text-center opacity-50 pb-0.5">
                            {voicing.frets.map(f => f === -1 ? 'X' : f).join(' ')}
                          </div>
                        </div>
                      ) : (
                        hasVoicings && (
                          <div className="mt-1.5 text-[8px] opacity-40 text-center">
                            sem diagrama
                          </div>
                        )
                      )}
                      {showImprovisationOptions && voicing?.arpeggioFrets && (
                        <div className="mt-2 rounded-md overflow-hidden bg-orange-50/90 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                          <div className="text-[8px] uppercase tracking-wide text-center font-black text-orange-700 dark:text-orange-300 pt-1">
                            Arpejo
                          </div>
                          <VoicingMiniSvg
                            voicing={voicing}
                            stringCount={voicing.tuning?.length ?? stringCount}
                            markerColor={markerColor}
                            primaryColor={primaryColor}
                            arpeggioColor="#f97316"
                            renderMode="arpeggio"
                            width={58}
                            height={104}
                          />
                        </div>
                      )}
                      {/* Function label */}
                      {a && (
                        <div className="text-[8px] opacity-55 leading-none mt-1 self-start">
                          {a.harmonicFunction}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
