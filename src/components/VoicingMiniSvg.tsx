import type { Voicing } from '@/lib/chord-finder';

interface Props {
  voicing: Voicing;
  stringCount: number;
  markerColor?: string;
  primaryColor?: string;
  arpeggioColor?: string;
  rootColor?: string;
  renderMode?: 'combined' | 'chord' | 'arpeggio';
  width?: number;
  height?: number;
}

export function VoicingMiniSvg({
  voicing, stringCount,
  markerColor = '#000', primaryColor = '#000', arpeggioColor = '#f97316', rootColor = '#dc2626',
  renderMode = 'combined',
  width = 64, height = 110,
}: Props) {
  const ml = 13, mr = 13, mt = 14, mb = 5;
  const iW = width - ml - mr, iH = height - mt - mb;
  const sf = voicing.startingFret;
  const showNut = sf === 1;

  // Dynamically calculate the required number of frets (at least 6)
  const pressedFrets = voicing.frets.filter(f => f > 0);
  const maxChordFret = pressedFrets.length > 0 ? Math.max(...pressedFrets) : sf;
  let maxArpFret = sf;
  if (voicing.arpeggioFrets && renderMode !== 'chord') {
    for (const stringFrets of voicing.arpeggioFrets) {
      if (!stringFrets) continue;
      for (const fret of stringFrets) {
        if (fret > 0 && fret > maxArpFret) {
          maxArpFret = fret;
        }
      }
    }
  }
  const maxFret = Math.max(maxChordFret, maxArpFret);
  const requiredFrets = maxFret - sf + 1;
  const FRETS = Math.max(6, requiredFrets);
  
  const fretH = iH / FRETS;
  const strSp = stringCount > 1 ? iW / (stringCount - 1) : iW;
  const sx = (s: number) => ml + s * strSp;
  const r = Math.min(fretH, strSp) * 0.35; // 70% diameter
  const isRootMarker = (stringIndex: number, fret: number) =>
    (voicing.rootFrets?.[stringIndex]?.includes(fret) ?? false) ||
    (stringIndex === voicing.rootString && fret === voicing.rootFret);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{display:'block'}}>
      {/* Frets */}
      {Array.from({ length: FRETS + 1 }, (_, f) => (
        <line key={f} x1={ml} y1={mt + f * fretH} x2={ml + iW} y2={mt + f * fretH}
          stroke={primaryColor} strokeWidth={f === 0 && showNut ? 3 : 0.8} />
      ))}
      {/* Strings */}
      {Array.from({ length: stringCount }, (_, s) => (
        <line key={s} x1={sx(s)} y1={mt} x2={sx(s)} y2={mt + iH}
          stroke={primaryColor} strokeWidth={0.7} />
      ))}
      {/* Fret label */}
      {sf > 1 && (
        <text x={ml - r - 1.5} y={mt + fretH * 0.55} textAnchor="end" dominantBaseline="middle"
          fill={primaryColor} fontSize={6} fontWeight="bold">{sf}ª</text>
      )}
      {/* Barres */}
      {renderMode !== 'arpeggio' && voicing.barres.map((b, i) => {
        const rel = b.fret - sf + 1;
        if (rel < 1 || rel > FRETS) return null;
        const cy = mt + (rel - 0.5) * fretH;
        return <rect key={i} x={sx(b.startString) - r} y={cy - r}
          width={sx(b.endString) - sx(b.startString) + r * 2} height={r * 2} rx={r} fill={markerColor} />;
      })}
      {/* Arpeggio Notes (Drawn under base chord) */}
      {renderMode !== 'chord' && voicing.arpeggioFrets && voicing.arpeggioFrets.map((stringFrets, s) => {
        if (!stringFrets) return null;
        return stringFrets.map((fret) => {
          if (fret === 0) {
            return <circle key={`arp-0-${s}`} cx={sx(s)} cy={mt - 4} r={2.5} fill={isRootMarker(s, fret) ? rootColor : arpeggioColor} stroke="none" />;
          }
          const rel = fret - sf + 1;
          if (rel < 1 || rel > FRETS) return null;
          const isRoot = isRootMarker(s, fret);
          return <circle key={`arp-${fret}-${s}`} cx={sx(s)} cy={mt + (rel - 0.5) * fretH} r={r} fill={isRoot ? rootColor : arpeggioColor} />;
        });
      })}
      {/* Markers (Chord Notes) */}
      {renderMode !== 'arpeggio' && voicing.frets.map((fret, s) => {
        if (fret === -1) return (
          <text key={s} x={sx(s)} y={mt - 4} textAnchor="middle" fill={primaryColor} fontSize={7} fontWeight="bold">✕</text>
        );
        if (fret === 0) {
          const isRoot = isRootMarker(s, fret);
          return isRoot
            ? <circle key={s} cx={sx(s)} cy={mt - 4} r={3} fill={rootColor} />
            : <circle key={s} cx={sx(s)} cy={mt - 4} r={2.5} fill="none" stroke={primaryColor} strokeWidth={0.8} />;
        }
        const rel = fret - sf + 1;
        if (rel < 1 || rel > FRETS) return null;
        const isRoot = isRootMarker(s, fret);
        return <circle key={s} cx={sx(s)} cy={mt + (rel - 0.5) * fretH} r={r} fill={isRoot ? rootColor : markerColor} />;
      })}
    </svg>
  );
}
