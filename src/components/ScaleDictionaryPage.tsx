import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INSTRUMENT_PRESETS, parseChord } from '@/lib/music-theory';
import {
  getScaleOptionsForPosition,
  getScalePositions,
  type ScaleOptionResult,
  type ScalePosition,
} from '@/lib/scale-search';
import { VoicingMiniSvg } from './VoicingMiniSvg';
import { DiagramLegend } from './DiagramLegend';
import { CreationSavePanel } from './CreationSavePanel';
import type { SavedCreation } from '@/lib/creations';

interface Props {
  instrument: string;
  stringCount: number;
  stringNames: string[];
  markerColor: string;
  primaryColor: string;
  onInstrumentChange: (instrument: string) => void;
  openedCreation?: SavedCreation | null;
}

export function ScaleDictionaryPage({
  instrument,
  stringNames,
  stringCount,
  markerColor,
  primaryColor,
  onInstrumentChange,
  openedCreation,
}: Props) {
  const [query, setQuery] = useState('');
  const [positions, setPositions] = useState<ScalePosition[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState('');
  const [scaleOptions, setScaleOptions] = useState<ScaleOptionResult[]>([]);
  const [parsedName, setParsedName] = useState('');
  const [error, setError] = useState('');

  const getActiveTuning = useCallback((): string[] => {
    const filled = stringNames.slice(0, stringCount).filter((n) => n.trim());
    if (filled.length === stringCount) return stringNames.slice(0, stringCount);
    return INSTRUMENT_PRESETS[instrument]?.tuning ?? INSTRUMENT_PRESETS.cavaquinho.tuning;
  }, [instrument, stringCount, stringNames]);

  const activeTuning = useMemo(() => getActiveTuning(), [getActiveTuning]);

  const selectedPosition = useMemo(
    () => positions.find((position) => position.id === selectedPositionId) ?? null,
    [positions, selectedPositionId],
  );

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      setError('');
      setScaleOptions([]);

      if (!value.trim()) {
        setPositions([]);
        setSelectedPositionId('');
        setParsedName('');
        return;
      }

      const parsed = parseChord(value);
      if (!parsed) {
        setError(`Acorde "${value}" não reconhecido. Ex: C, C7M, Am, G7, F#m7`);
        setPositions([]);
        setSelectedPositionId('');
        setParsedName('');
        return;
      }

      const nextPositions = getScalePositions(value.trim(), getActiveTuning());
      setParsedName(`${parsed.displayName} - ${parsed.qualityName}`);

      if (nextPositions.length === 0) {
        setError('Nenhuma posição de acorde encontrada para guiar os shapes de escala.');
        setPositions([]);
        setSelectedPositionId('');
        return;
      }

      setPositions(nextPositions);
      setSelectedPositionId((current) =>
        nextPositions.some((position) => position.id === current) ? current : nextPositions[0].id,
      );
    },
    [getActiveTuning],
  );

  useEffect(() => {
    if (!selectedPosition || !query.trim()) {
      setScaleOptions([]);
      return;
    }

    const options = getScaleOptionsForPosition(query.trim(), activeTuning, selectedPosition);
    setScaleOptions(options);

    if (options.length === 0) {
      setError('Nenhuma possibilidade modal encontrada para essa posição no dicionário atual.');
    } else {
      setError('');
    }
  }, [activeTuning, query, selectedPosition]);

  useEffect(() => {
    if (!openedCreation || openedCreation.type !== 'dictionary') return;
    if (openedCreation.payload?.mode !== 'scales') return;
    const payload = openedCreation.payload;
    if (typeof payload.instrument === 'string') onInstrumentChange(payload.instrument);
    if (typeof payload.query === 'string') handleSearch(payload.query);
  }, [handleSearch, onInstrumentChange, openedCreation]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-600" />
          <CardTitle>Dicionário de Escalas</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {openedCreation?.type === 'dictionary' && openedCreation.payload?.mode === 'scales' && (
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
            <span className="font-bold">{openedCreation.title}</span>
            <span className="text-muted-foreground"> por {openedCreation.authorName}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <Label>Instrumento</Label>
            <Select value={instrument} onValueChange={(value) => onInstrumentChange(value)}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INSTRUMENT_PRESETS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Afinação ativa</Label>
            <div className="flex gap-1">
              {activeTuning.map((note, index) => (
                <span key={index} className="rounded bg-muted px-2 py-1 text-xs font-mono font-bold">
                  {note}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1 flex-1 min-w-48">
            <Label>Nome do acorde</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ex: C7M, C, Am, G7, F#m7..."
                value={query}
                onChange={(event) => handleSearch(event.target.value)}
                className="pl-9 font-mono text-base"
              />
            </div>
          </div>
        </div>

        {parsedName && (
          <p className="text-sm font-medium text-primary">
            {parsedName} - escolha abaixo a posição do acorde
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {positions.length > 0 && (
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">
              Posição do acorde usada como referência da escala
            </Label>
            <div className="flex flex-wrap gap-4">
              {positions.map((position) => {
                const selected = position.id === selectedPositionId;
                return (
                  <button
                    key={position.id}
                    type="button"
                    onClick={() => setSelectedPositionId(position.id)}
                    className={`rounded-lg border-2 bg-white dark:bg-zinc-900 transition-all hover:scale-105 ${
                      selected ? 'border-emerald-500 shadow-md scale-105' : 'border-border hover:border-emerald-500/60'
                    }`}
                    title={`${parsedName} - nota mais grave ${position.lowestNote}`}
                  >
                    <div className="px-2 pt-2 text-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      {position.lowestNote} no baixo
                    </div>
                    <VoicingMiniSvg
                      voicing={position.voicing}
                      stringCount={activeTuning.length}
                      markerColor={markerColor}
                      primaryColor={primaryColor}
                      renderMode="chord"
                      width={88}
                      height={126}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {scaleOptions.length > 0 && selectedPosition && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Possibilidades para essa posição
              </Label>
              <DiagramLegend showArpeggio arpeggioLabel="Escala" arpeggioColor="#10b981" />
            </div>

            {scaleOptions.map((scale) => (
              <section key={scale.id} className="rounded-lg border bg-card p-3 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold">{scale.name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {scale.description} Escala/shape: {scale.parentScaleName}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {scale.noteNames.join(' - ')}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {scale.formLabel}
                  </span>
                </div>

                <div className="inline-flex rounded-lg border-2 border-border bg-white dark:bg-zinc-900">
                  <VoicingMiniSvg
                    voicing={scale.voicing}
                    stringCount={activeTuning.length}
                    markerColor={markerColor}
                    primaryColor={primaryColor}
                    arpeggioColor="#10b981"
                    renderMode="arpeggio"
                    width={108}
                    height={146}
                  />
                </div>
              </section>
            ))}
          </div>
        )}

        <CreationSavePanel
          type="dictionary"
          defaultTitle={parsedName || query || 'Minhas escalas'}
          defaultDescription="Escalas salvas a partir do dicionário de escalas."
          disabled={scaleOptions.length === 0}
          payload={{
            mode: 'scales',
            query,
            parsedName,
            instrument,
            tuning: activeTuning,
            selectedPositionId,
            scaleOptions,
          }}
        />
      </CardContent>
    </Card>
  );
}
