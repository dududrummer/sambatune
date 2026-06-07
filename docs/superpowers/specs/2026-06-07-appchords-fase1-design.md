# Design — appChords Fase 1: Aba Improvisação

**Data:** 2026-06-07  
**Escopo:** Fase 1 de 4 — melhorias na aba Improvisação  
**Status:** Aprovado pelo usuário

---

## Contexto

O projeto appChords (SambaTune) é um SPA React com Supabase, Tone.js e MP3s de percussão. A aba Improvisação já tem grade de acordes com voicings de arpejo, análise harmônica e playback. Este spec define as extensões da Fase 1.

Fases futuras (fora deste spec):
- Fase 2: som de violão em ritmo de samba
- Fase 3: sistema de salvar e comunidade
- Fase 4: login, perfil e avatar

---

## Features da Fase 1

### 1. Ocultar Jazz no seletor de loop

O estilo `"jazz"` deve ser filtrado do seletor de loop **somente na aba Improvisação**. Nas demais abas (progressão, exercícios) continua disponível.

**Localização:** `ProgressionAudio.tsx` — filtrar o array de styles exibidos quando `mode === "improvisation"`.

**Regra:** `styles.filter(s => s !== "jazz")` aplicado condicionalmente ao prop `mode`.

---

### 2. BPM travado ao loop selecionado

Ao selecionar um loop na aba Improvisação, o BPM da progressão de acordes é **forçado ao BPM do loop** e o controle de BPM fica desabilitado.

**Comportamento:**
- Seletor de loop exibe nome + BPM (ex: "🥁 Batucada 90 BPM")
- O campo de BPM exibe `🔒 90 BPM` (read-only, visualmente desabilitado)
- Trocar o loop atualiza o BPM automaticamente e reinicia a reprodução se estiver tocando
- Estilos disponíveis na improvisação: `batucada` (60–120) e `sambaenredo` (125–160)

**Localização:** `ProgressionEditor.tsx` — ao receber evento de troca de loop, extrair o BPM da config (`audio-loops.ts`) e chamar `setBpm()` + atualizar estado local.

**Fonte de dados:** `DEFAULT_BPM` e `BPM_RANGE` em `src/config/audio-loops.ts`.

---

### 3. Cards de acorde sempre expandidos — `ImprovisationCard`

#### 3.1 Novo componente

Criar `src/components/ImprovisationCard.tsx`.

Responsabilidade: renderizar um card completo para um único `ChordBeat` no modo improvisação, incluindo diagrama do acorde, arpejo navegável e seletor de escalas com regiões.

**Props:**
```typescript
interface ImprovisationCardProps {
  chordBeat: ChordBeat
  voicing: Voicing
  instrument: string
  selectedScales: string[]             // até 5 nomes de escala
  onScalesChange: (scales: string[]) => void
  measureIndex: number
  beatIndex: number
}
```

#### 3.2 Layout do card (sempre expandido)

**Linha 1 — Acorde + Arpejo:**
- Lado esquerdo: `VoicingMiniSvg` com o voicing do acorde (borda roxa, label com nome e posição)
- Lado direito: arpejo automático via `searchArpeggioVoicings()`, borda verde, navegação `◀ ▶` e indicador de pontos (ex: "2 de 4")

**Linha 2 — Escalas:**
- Chips de escalas ativas com botão `✕` para remover
- Botão `+ Adicionar (N/5)` que abre dropdown categorizado
- Abas para trocar entre as escalas ativas (quando há mais de uma)
- 3 diagramas de região: antes (opacidade 50%) · região do acorde (destaque, borda colorida) · depois (opacidade 50%)

#### 3.3 Arpejo automático com navegação

- Ao montar o card, busca todos os shapes via `searchArpeggioVoicings(chordName, instrument)`
- Auto-seleciona o shape cuja região (`startingFret`) é mais próxima do `voicing.startingFret`
- Estado local: `arpeggioIndex: number`
- `◀` decrementa, `▶` incrementa (com wrap-around)
- Indicador: `N de Total` + dots

#### 3.4 Seletor de escalas — dropdown categorizado

Abre um dropdown (Popover do shadcn/ui) com grupos colapsáveis:

| Grupo | Escalas |
|---|---|
| Modos Gregos | Jônio, Dórico, Frígio, Lídio, Mixolídio, Eólio, Lócrio |
| Pentatônicas | Pentatônica Maior, Pentatônica Menor |
| Blues | Blues Maior, Blues Menor (somente se existirem em `shapes_escalas.json`) |
| Arpejos | Arpejo do acorde atual (qualidades suportadas pelo `arpeggio-search.ts`) |

- Grupos sem shapes disponíveis para o acorde ativo ficam ocultos no dropdown
- Escala já ativa aparece marcada e não pode ser adicionada novamente
- Ao atingir 5 escalas, botão `+ Adicionar` fica desabilitado
- Usa `getScaleOptionsForPosition()` de `scale-search.ts` para filtrar apenas opções válidas para o acorde

#### 3.5 Regiões de escala

Para cada escala ativa, exibe 3 shapes via `getScalePositions(chordName, tuning)`:

- **Região antes:** o shape com `startingFret` mais próximo e **menor** que o do acorde
- **Região do acorde:** o shape com `startingFret` mais próximo do voicing (pode ser igual)
- **Região depois:** o shape com `startingFret` mais próximo e **maior** que o do acorde

Se não existir shape antes ou depois (ex: acorde na primeira casa), exibe placeholder vazio com texto "—".

Se não existir nenhum shape para o acorde (qualidade não mapeada), a linha 2 exibe mensagem "Nenhuma escala disponível para este acorde" e o botão `+ Adicionar` fica desabilitado.

#### 3.6 Estado de escalas por instância

Estado gerenciado em `ProgressionEditor`:

```typescript
// chave: `${measureIndex}_${beatIndex}`
const [chordScales, setChordScales] = useState<Map<string, string[]>>(new Map())
```

Passado para cada `ImprovisationCard` via props. Persiste no draft de improvisação (`localStorage`) junto com os demais dados da progressão.

---

### 4. Integração com `ProgressionGrid`

Quando `mode === "improvisation"`, o `ProgressionGrid` renderiza `ImprovisationCard` em vez do layout atual de cell.

O grid passa a ter scroll vertical automático quando há muitos acordes (16+). Cada card tem largura mínima de 180px, exibidos em grid responsivo com `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))`.

---

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/components/ImprovisationCard.tsx` | **Novo** — card completo por acorde |
| `src/components/ProgressionGrid.tsx` | Usar `ImprovisationCard` quando `mode="improvisation"` |
| `src/components/ProgressionEditor.tsx` | Estado `chordScales`, BPM sync com loop, persistência no draft |
| `src/components/ProgressionAudio.tsx` | Filtrar jazz, exibir BPM travado |
| `src/lib/scale-search.ts` | Nenhuma mudança (reutilizado) |
| `src/lib/arpeggio-search.ts` | Nenhuma mudança (reutilizado) |

---

## Fora do escopo desta fase

- Som de violão / sample player
- Padrão de comping de samba (Fase 2)
- Botão "Salvar para mim" / "Salvar para a comunidade" na improvisação (Fase 3)
- Login, perfil, avatar (Fase 4)
- Qualquer mudança nas abas Dicionário, Arpejos, Escalas, Exercícios

---

## Critérios de aceitação

1. Jazz não aparece no seletor de loop da aba Improvisação
2. Selecionar um loop define e trava o BPM da progressão
3. Cada card de acorde exibe diagrama + arpejo navegável + até 5 escalas com 3 regiões
4. Escalas selecionadas são independentes por instância (compasso + beat)
5. Estado persiste no localStorage (draft de improvisação)
6. Grade com scroll vertical funciona para 16+ acordes
7. Nenhuma regressão nas outras abas
