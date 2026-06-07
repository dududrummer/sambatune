import { useState, useCallback, useEffect } from 'react';
import { Play, Square, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { startPlayback, stopPlayback, setBpm, DEFAULT_BPM, BPM_RANGE, hasLoopFor, type Style, type AudioMode } from '@/lib/audio';
import type { Measure } from '@/lib/progression';
import type { Voicing } from '@/lib/chord-finder';

interface StoredVoicing extends Voicing { tuning: string[] }
interface Props {
  measures: Measure[];
  voicings: Record<string, StoredVoicing>;
  onMeasureChange: (idx: number | null) => void;
}

const STYLES: { value: Style; label: string; desc: string; bpmLabel: string }[] = [
  { value: 'batucada',    label: '🥁 Batucada',    desc: 'Samba / Pagode',  bpmLabel: '60–120 BPM' },
  { value: 'sambaenredo', label: '🎺 Samba Enredo', desc: 'Carnaval',        bpmLabel: '125–160 BPM' },
  { value: 'jazz',        label: '🎷 Jazz',         desc: 'Swing',           bpmLabel: '150–200 BPM' },
  { value: 'bossanova',   label: '🎸 Bossa Nova',   desc: 'Bossa Nova',      bpmLabel: '70–150 BPM' },
];


const MODES: { value: AudioMode; label: string }[] = [
  { value: 'both',       label: '🎵 + 🥁  Harmonia & Percussão' },
  { value: 'harmony',    label: '🎵  Só Harmonia' },
  { value: 'percussion', label: '🥁  Só Percussão' },
];

export function ProgressionAudio({ measures, voicings, onMeasureChange }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [style, setStyle]         = useState<Style>('batucada');
  const [mode, setMode]           = useState<AudioMode>('both');
  const [bpm, setBpmState]        = useState<number>(DEFAULT_BPM.batucada);
  const [metronome, setMetronome] = useState(false);
  const [loop, setLoop]           = useState(true);

  useEffect(() => () => { stopPlayback(); }, []);

  const handleStyleChange = useCallback((s: Style) => {
    setStyle(s);
    if (!isPlaying) setBpmState(DEFAULT_BPM[s]);
  }, [isPlaying]);

  const handlePlay = useCallback(async () => {
    if (measures.length === 0) return;
    const vm: Record<string, { frets: number[]; tuning: string[] }> = {};
    for (const [k, v] of Object.entries(voicings)) vm[k] = { frets: v.frets, tuning: v.tuning };
    await startPlayback(measures, style, bpm, metronome, mode, vm, idx => onMeasureChange(idx), loop);
    setIsPlaying(true);
  }, [measures, style, bpm, metronome, mode, voicings, loop, onMeasureChange]);

  const handleStop = useCallback(() => {
    stopPlayback(); setIsPlaying(false); onMeasureChange(null);
  }, [onMeasureChange]);

  const handleBpm = useCallback((val: number[]) => {
    setBpmState(val[0]); if (isPlaying) setBpm(val[0]);
  }, [isPlaying]);

  const [min, max] = BPM_RANGE[style];

  return (
    <div className="space-y-5">

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Estilo rítmico</Label>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map(s => (
            <button key={s.value} onClick={() => handleStyleChange(s.value)}
              className={`rounded-lg border-2 p-3 text-left transition-all ${
                style === s.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
              }`}>
              <div className="font-semibold text-sm">{s.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</div>
              <div className="text-[10px] text-primary/70 font-mono mt-1">{s.bpmLabel}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">O que tocar</Label>
        <ToggleGroup type="single" value={mode} onValueChange={v => v && setMode(v as AudioMode)} className="flex flex-wrap gap-2">
          {MODES.map(m => (
            <ToggleGroupItem key={m.value} value={m.value} className="flex-1 text-xs">{m.label}</ToggleGroupItem>
          ))}
        </ToggleGroup>
        {mode === 'percussion' && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            💡 Ideal para improvisação — toque por cima da levada sem ouvir os acordes.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-semibold">Andamento</Label>
          <span className="font-mono font-bold tabular-nums text-lg">{bpm} <span className="text-xs font-normal text-muted-foreground">BPM</span></span>
        </div>
        <Slider min={min} max={max} step={1} value={[bpm]} onValueChange={handleBpm} />
        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
          <span>{min} lento</span>
          <span className="text-primary font-medium">{DEFAULT_BPM[style]} padrão</span>
          <span>{max} rápido</span>
        </div>
        {/* Loop source indicator */}
        {mode !== 'harmony' && (
          <div className="flex items-center gap-1.5 mt-1">
            {hasLoopFor(style, bpm) ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 text-[10px] font-medium">
                ✓ Áudio real carregado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 text-[10px]">
                ⚙ Percussão sintetizada (adicione arquivos em public/audio/loops/)
              </span>
            )}
          </div>
        )}
      </div>


      <div className="flex flex-wrap gap-5">
        <div className="flex items-center gap-2">
          <Switch id="metro" checked={metronome} onCheckedChange={setMetronome} />
          <Label htmlFor="metro" className="cursor-pointer flex items-center gap-1 text-sm">
            <Volume2 className="h-4 w-4" /> Metrônomo
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="loop" checked={loop} onCheckedChange={setLoop} />
          <Label htmlFor="loop" className="cursor-pointer text-sm">Loop</Label>
        </div>
      </div>

      <Button onClick={isPlaying ? handleStop : handlePlay} disabled={measures.length === 0}
        className="w-full text-base py-5" variant={isPlaying ? 'destructive' : 'default'} size="lg">
        {isPlaying
          ? <><Square className="h-5 w-5 mr-2" />Parar</>
          : <><Play   className="h-5 w-5 mr-2" />Reproduzir</>}
      </Button>

      {isPlaying && (
        <div className="text-center space-y-0.5">
          <p className="text-sm font-medium animate-pulse">{STYLES.find(s => s.value === style)?.label} · {bpm} BPM</p>
          <p className="text-xs text-muted-foreground">{MODES.find(m => m.value === mode)?.label}</p>
        </div>
      )}
    </div>
  );
}
