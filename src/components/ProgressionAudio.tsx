import { useState, useCallback, useEffect } from "react";
import { Play, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  startPlayback,
  stopPlayback,
  setBpm,
  DEFAULT_BPM,
  BPM_RANGE,
  hasLoopFor,
  type Style,
  type AudioMode,
} from "@/lib/audio";
import type { Measure } from "@/lib/progression";
import type { Voicing } from "@/lib/chord-finder";
import { availableBpms, type LoopStyle } from "@/config/audio-loops";

interface StoredVoicing extends Voicing {
  tuning: string[];
}
interface Props {
  measures: Measure[];
  voicings: Record<string, StoredVoicing>;
  onMeasureChange: (idx: number | null) => void;
  mode?: "progression" | "improvisation";
}

const STYLES: { value: Style; label: string; desc: string; bpmLabel: string }[] = [
  { value: "batucada", label: "🥁 Batucada", desc: "Samba / Pagode", bpmLabel: "60–120 BPM" },
  { value: "sambaenredo", label: "🎺 Samba Enredo", desc: "Carnaval", bpmLabel: "125–160 BPM" },
  { value: "jazz", label: "🎷 Jazz", desc: "Swing", bpmLabel: "150–200 BPM" },
  { value: "bossanova", label: "🎸 Bossa Nova", desc: "Bossa Nova", bpmLabel: "70–150 BPM" },
];

const MODES: { value: AudioMode; label: string }[] = [
  { value: "both", label: "🎵 + 🥁  Harmonia & Percussão" },
  { value: "harmony", label: "🎵  Só Harmonia" },
  { value: "percussion", label: "🥁  Só Percussão" },
];

export function ProgressionAudio({
  measures,
  voicings,
  onMeasureChange,
  mode = "progression",
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [style, setStyle] = useState<Style>("batucada");
  const [audioMode, setAudioMode] = useState<AudioMode>("both");
  const [bpm, setBpmState] = useState<number>(DEFAULT_BPM.batucada);
  const [metronome, setMetronome] = useState(false);
  const [loop, setLoop] = useState(true);

  const visibleStyles =
    mode === "improvisation"
      ? STYLES.filter((s) => s.value === "batucada" || s.value === "sambaenredo")
      : STYLES;

  useEffect(
    () => () => {
      stopPlayback();
    },
    [],
  );

  useEffect(() => {
    if (mode === "improvisation" && style !== "batucada" && style !== "sambaenredo") {
      const defaultStyle: Style = "batucada";
      setStyle(defaultStyle);
      const firstBpm = availableBpms(defaultStyle as LoopStyle)[0] ?? DEFAULT_BPM[defaultStyle];
      setBpmState(firstBpm);
    }
  }, [mode, style]);

  const handleStyleChange = useCallback(
    (s: Style) => {
      setStyle(s);
      const newBpm =
        mode === "improvisation"
          ? (availableBpms(s as LoopStyle)[0] ?? DEFAULT_BPM[s])
          : DEFAULT_BPM[s];
      setBpmState(newBpm);
      if (isPlaying) setBpm(newBpm);
    },
    [isPlaying, mode],
  );

  const handlePlay = useCallback(async () => {
    if (measures.length === 0) return;
    const vm: Record<string, { frets: number[]; tuning: string[] }> = {};
    for (const [k, v] of Object.entries(voicings)) vm[k] = { frets: v.frets, tuning: v.tuning };
    await startPlayback(
      measures,
      style,
      bpm,
      metronome,
      audioMode,
      vm,
      (idx) => onMeasureChange(idx),
      loop,
    );
    setIsPlaying(true);
  }, [measures, style, bpm, metronome, audioMode, voicings, loop, onMeasureChange]);

  const handleStop = useCallback(() => {
    stopPlayback();
    setIsPlaying(false);
    onMeasureChange(null);
  }, [onMeasureChange]);

  const handleBpm = useCallback(
    (val: number[]) => {
      setBpmState(val[0]);
      if (isPlaying) setBpm(val[0]);
    },
    [isPlaying],
  );

  const [min, max] = BPM_RANGE[style];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Estilo rítmico</Label>
        <div className="grid grid-cols-2 gap-2">
          {visibleStyles.map((s) => (
            <button
              key={s.value}
              onClick={() => handleStyleChange(s.value)}
              className={`rounded-lg border-2 p-3 text-left transition-all ${
                style === s.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="font-semibold text-sm">{s.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</div>
              <div className="text-[10px] text-primary/70 font-mono mt-1">{s.bpmLabel}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">O que tocar</Label>
        <ToggleGroup
          type="single"
          value={audioMode}
          onValueChange={(v) => v && setAudioMode(v as AudioMode)}
          className="flex flex-wrap gap-2"
        >
          {MODES.map((m) => (
            <ToggleGroupItem key={m.value} value={m.value} className="flex-1 text-xs">
              {m.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {audioMode === "percussion" && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            💡 Ideal para improvisação — toque por cima da levada sem ouvir os acordes.
          </p>
        )}
      </div>

      {mode === "improvisation" ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-semibold">Andamento</Label>
            <span className="font-mono font-bold tabular-nums text-lg">
              🔒 {bpm} <span className="text-xs font-normal text-muted-foreground">BPM</span>
            </span>
          </div>
          <select
            value={bpm}
            onChange={(e) => {
              const v = Number(e.target.value);
              setBpmState(v);
              if (isPlaying) setBpm(v);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {availableBpms(style as LoopStyle).map((b) => (
              <option key={b} value={b}>
                {b} BPM
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">
            BPM travado ao loop — escolha o andamento da batucada
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-semibold">Andamento</Label>
            <span className="font-mono font-bold tabular-nums text-lg">
              {bpm} <span className="text-xs font-normal text-muted-foreground">BPM</span>
            </span>
          </div>
          <Slider min={min} max={max} step={1} value={[bpm]} onValueChange={handleBpm} />
          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
            <span>{min} lento</span>
            <span className="text-primary font-medium">{DEFAULT_BPM[style]} padrão</span>
            <span>{max} rápido</span>
          </div>
          {/* Loop source indicator */}
          {audioMode !== "harmony" && (
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
      )}

      <div className="flex flex-wrap gap-5">
        <div className="flex items-center gap-2">
          <Switch id="metro" checked={metronome} onCheckedChange={setMetronome} />
          <Label htmlFor="metro" className="cursor-pointer flex items-center gap-1 text-sm">
            <Volume2 className="h-4 w-4" /> Metrônomo
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="loop" checked={loop} onCheckedChange={setLoop} />
          <Label htmlFor="loop" className="cursor-pointer text-sm">
            Loop
          </Label>
        </div>
      </div>

      <Button
        onClick={isPlaying ? handleStop : handlePlay}
        disabled={measures.length === 0}
        className="w-full text-base py-5"
        variant={isPlaying ? "destructive" : "default"}
        size="lg"
      >
        {isPlaying ? (
          <>
            <Square className="h-5 w-5 mr-2" />
            Parar
          </>
        ) : (
          <>
            <Play className="h-5 w-5 mr-2" />
            Reproduzir
          </>
        )}
      </Button>

      {isPlaying && (
        <div className="text-center space-y-0.5">
          <p className="text-sm font-medium animate-pulse">
            {STYLES.find((s) => s.value === style)?.label} · {bpm} BPM
          </p>
          <p className="text-xs text-muted-foreground">
            {MODES.find((m) => m.value === audioMode)?.label}
          </p>
        </div>
      )}
    </div>
  );
}
