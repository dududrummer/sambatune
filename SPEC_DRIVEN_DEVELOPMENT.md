# SambaTune - Spec Driven Development

Ultima revisao: 2026-05-19

Este documento descreve o estado atual do SambaTune, como o projeto esta organizado e quais contratos tecnicos devem ser preservados em evolucoes futuras. Use como referencia antes de implementar novas features, refatoracoes ou alteracoes de produto.

## 1. Visao Do Produto

SambaTune e uma aplicacao web para estudo de cavaquinho e banjo com foco em samba, pagode, sequencias harmonicas, dicionario de acordes, arpejos por regiao, diagramas personalizados, treino com ritmo e comunidade.

O produto combina:

- Landing page publica para aquisicao e apresentacao do produto.
- Area autenticada em `/app` para ferramentas musicais.
- Autenticacao via Supabase.
- Dicionario interativo de acordes.
- Dicionario de arpejos por regiao do braco.
- Editor de sequencias harmonicas com templates e encadeamento de voicings.
- Aba de improvisacao baseada em sequencias, combinando acorde e arpejo por acorde.
- Criador de diagramas personalizados exportaveis.
- Construtor de exercicios.
- Salvamento privado local por usuario, com exclusao pela UI.
- Publicacao publica na comunidade via Supabase.
- Exclusao de publicacoes proprias na comunidade.
- Abertura de criacoes salvas/publicadas de volta na ferramenta de origem.
- Curtidas e comentarios publicos em criacoes da comunidade.
- Playback de sequencias com sintetizador, metronomo e loops de percussao.

## 2. Stack Tecnica

- React 19.
- Vite 7.
- TypeScript.
- TanStack Router.
- Tailwind CSS v4.
- Radix UI primitives via componentes locais em `src/components/ui`.
- Lucide React para icones.
- Tone.js para audio sintetizado.
- Supabase para autenticacao, perfis e comunidade.
- GitHub Actions para build e deploy.
- Hostinger via FTP como hosting de producao.

Scripts principais:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## 3. Estrutura De Pastas

```txt
src/routes
  __root.tsx      Provider global e Outlet
  index.tsx       Landing page publica
  login.tsx       Login
  register.tsx    Cadastro
  app.tsx         Aplicacao autenticada

src/components
  ArpeggioDictionary.tsx
  ArpeggioDictionaryPage.tsx
  ChordDictionaryPage.tsx
  ChordSearch.tsx
  CommunityTab.tsx
  CreationSavePanel.tsx
  DiagramLegend.tsx
  ExercisesTab.tsx
  PercussionPlayers.tsx
  ProfileTab.tsx
  ProgressionAudio.tsx
  ProgressionEditor.tsx
  ProgressionGrid.tsx
  ScaleDictionaryPage.tsx
  UserMenu.tsx
  VoicingMiniSvg.tsx
  WelcomeTour.tsx

src/lib
  arpeggio-search.ts
  audio.ts
  auth-context.tsx
  chord-finder.ts
  creations.ts
  degree-progressions.ts
  harmony.ts
  music-theory.ts
  progression.ts
  scale-search.ts
  supabase.ts
  voicing-search.ts

src/config
  arpeggio-dictionary-user.json
  arpeggio-dictionary.json
  arpeggio-shapes.json
  audio-loops.ts
  cavaquinho-dictionary.json
  ukulele-dictionary.json
  violao-dictionary.json

public
  hero-cavaquinho.png
  audio/loops/*.mp3

.github/workflows
  deploy.yml
  extract-chords.yml
```

## 4. Rotas E Acesso

### `/`

Landing page publica. O visual atual segue o modelo editorial/HQ usado como referencia em `www.cristianofigueiredo.com.br`, limitado a landing page.

Mostra:

- Header publico com marca e `UserMenu`.
- Hero com wordmark SambaTune em duas cores.
- Frase de topo: `Menos teoria solta, mais pratica organizada.`
- Blocos comerciais sobre dicionario, sequencias, arpejos, diagramas, ritmo e comunidade.
- CTAs para cadastro/entrada.

### `/login`

Tela publica de login.

Fluxos:

- Login por email e senha.
- Login com Google via Supabase OAuth.
- Redireciona para `/app` apenas quando `isAuthenticated` estiver confirmado no contexto.
- Exibe erro amigavel para credenciais invalidas ou email nao confirmado.

### `/register`

Tela publica de cadastro em etapas.

Campos principais:

- Nome completo.
- Email.
- Senha e confirmacao.
- Foto/avatar opcional.
- Nome artistico.
- WhatsApp.
- Idade.
- Sexo.
- Instrumento principal.
- Como conheceu o SambaTune.

Regras:

- Email e normalizado com `trim().toLowerCase()`.
- Cadastro por email exige confirmacao de email.
- Mesmo que Supabase crie sessao automaticamente, o app faz logout e mostra mensagem de confirmacao.
- Cadastro salva perfil na tabela `profiles`.
- Usuario so entra depois de confirmar email e fazer login.

### `/app`

Area autenticada.

Regras:

- Se `isLoading`, mostra tela de carregamento.
- Se nao autenticado, redireciona para `/`.
- Qualquer URL direta como `/app?tab=dictionary` deve ser bloqueada sem sessao.
- A tab inicial pode vir de `tab` na query string.
- A troca manual pela sidebar atualiza estado local de pagina; abertura de criacoes tambem troca a pagina de destino.

Tabs atuais:

- `dictionary`: Dicionario Interativo.
- `arpeggio`: Dicionario de Arpejos.
- `scales`: Dicionario de Escalas.
- `progression`: Sequencias Harmonicas.
- `improvisation`: Improvisacao.
- `diagram`: Criador de Diagramas.
- `exercises`: Escalas e Arpejos.
- `plan`: Plano de Estudos.
- `community`: Comunidade.
- `profile`: Meu Perfil.

## 5. Autenticacao E Perfil

Arquivo central: `src/lib/auth-context.tsx`.

Estado exposto:

```ts
user: UserProfile | null
supabaseUser: User | null
session: Session | null
isAuthenticated: boolean
isLoading: boolean
```

Operacoes:

- `login(email, password)`
- `loginWithGoogle()`
- `register(data)`
- `logout()`
- `updateProfile(data)`

Tabela esperada: `profiles`.

Campos usados:

- `id`
- `email`
- `name`
- `artistic_name`
- `phone_whatsapp`
- `age`
- `gender`
- `instrument`
- `avatar_url`
- `how_did_you_find_us`
- `created_at`
- `updated_at`

Storage esperado:

- Bucket `avatars`.
- Upload em `avatars/{userId}.{ext}`.
- O codigo usa URL publica do arquivo quando houver avatar.

Regras importantes:

- `mapSupabaseUser` monta o `UserProfile` usando perfil do banco e fallback para metadata/email.
- `fetchProfile` usa `maybeSingle()`.
- `logout` limpa tambem o estado local, nao depende apenas do evento do Supabase.
- Rotas internas nao devem usar apenas UI escondida para seguranca; devem checar autenticacao.
- `ProfileTab` edita dados basicos; o botao de upload de foto ainda nao implementa upload ali.

## 6. Landing Page

Arquivo: `src/routes/index.tsx`.

Objetivo:

- Apresentar SambaTune de forma comercial e convidativa.
- Destacar sequencias de samba, dicionario interativo, arpejos, diagramas, ritmo e comunidade.
- Evitar promessa de gratuidade permanente.
- Usar linguagem de experimentacao e entrada no app.

Elementos visuais atuais:

- Estilo editorial/HQ inspirado na referencia `cristianofigueiredo.com.br`.
- Fontes carregadas localmente na pagina por Google Fonts: `Bowlby One`, `Anton` e `DM Sans`.
- Wordmark gigante: `Samba` preto com sombra laranja; `Tune` laranja com sombra preta.
- Badge de frase com fundo laranja e sombra preta: `Menos teoria solta, mais pratica organizada.`
- Frase complementar: `Por que funciona`.
- Layout de alto contraste, com bordas fortes, sombras deslocadas, faixas e secoes cheias.
- A landing possui CSS local proprio e nao deve forcar a mesma estetica para a aplicacao interna.

## 7. Aplicacao Interna

Arquivo: `src/routes/app.tsx`.

Responsabilidades:

- Shell autenticado da aplicacao.
- Sidebar.
- Header.
- Modo escuro/claro.
- Protecao de acesso.
- Alternancia de abas.
- Estado global do criador de diagramas.
- Abertura de criacoes salvas ou publicadas.

Modo escuro:

- Aplica no container principal.
- Aplica em sidebar, header, brand area e user menu.
- Usa classes condicionais em vez de `bg-white` fixo no shell.

Alinhamento:

- Header e topo da sidebar usam altura fixa de `72px`.
- Bordas do topo usam a mesma espessura e variavel de tema.

Pontos tecnicos:

- `app.tsx` concentra muita logica de shell e do criador de diagramas.
- Ao abrir criacao, `dictionary`, `progression` e `exercise` sao roteados para suas ferramentas correspondentes; ainda nao ha tipo persistido separado para arpejos.
- A aba `improvisation` reaproveita `ProgressionEditor` em modo proprio e nao possui tipo de criacao separado.
- A aba `scales` fica abaixo de arpejos na sidebar e usa `shapes_escalas.json` como dicionario de escalas.

## 8. Dicionario Interativo

Arquivos:

- `src/components/ChordDictionaryPage.tsx`
- `src/components/VoicingMiniSvg.tsx`
- `src/components/DiagramLegend.tsx`
- `src/lib/arpeggio-search.ts`
- `src/lib/voicing-search.ts`
- `src/config/cavaquinho-dictionary.json`

Fluxo:

1. Usuario escolhe instrumento.
2. Digita acorde.
3. `parseChord` interpreta o acorde.
4. `searchVoicings` busca shapes.
5. Resultados aparecem como mini diagramas.
6. Usuario pode salvar no perfil ou publicar na comunidade.

Estado atual:

- A pagina de acordes usa a busca de `arpeggio-search.ts` como fonte e remove os dados de arpejo antes de renderizar diagramas de acorde.
- `VoicingMiniSvg` renderiza a fundamental em vermelho.
- `DiagramLegend` exibe apenas a legenda relevante para acorde quando `showArpeggio={false}`.

Regras:

- Instrumentos atuais: cavaquinho e banjo, ambos DGBD.
- Dicionario real existe para cavaquinho.
- Banjo usa a mesma afinacao e pode cair no fallback algoritmico quando nao houver dicionario especifico.
- Se acorde esta no dicionario, a busca retorna voicings do dicionario.
- Se nao esta no dicionario, usa algoritmo de fallback.

## 9. Dicionario De Arpejos

Arquivos:

- `src/components/ArpeggioDictionaryPage.tsx`
- `src/components/ArpeggioDictionary.tsx`
- `src/lib/arpeggio-search.ts`
- `src/config/arpeggio-shapes.json`
- `src/config/arpeggio-dictionary.json`
- `src/config/arpeggio-dictionary-user.json`
- `src/components/VoicingMiniSvg.tsx`
- `src/components/DiagramLegend.tsx`

Funcionalidades atuais:

- Aba propria em `/app`: `arpeggio`.
- Busca por acorde/qualidade.
- Sugestao de shapes de acorde com notas de arpejo por regiao.
- Suporte a direcao de arpejo (`frente`, `tras` ou neutro) conforme configuracao.
- Legenda com fundamental vermelha, arpejo laranja e shape preto.
- Mini diagramas expandem a regiao de trastes quando o arpejo passa do shape base.

Observacoes:

- `ArpeggioDictionaryPage` e a pagina atualmente ligada no shell.
- `ArpeggioDictionary.tsx` permanece como componente secundario/legado para a mesma familia de funcionalidade.
- Criacoes de arpejo ainda nao possuem `SavedCreation.type` proprio; quando necessario, a comunidade classifica arpejos por conteudo de exercicio.

## 10. Dicionario De Escalas

Arquivos:

- `src/components/ScaleDictionaryPage.tsx`
- `src/lib/scale-search.ts`
- `diagramas/Shapes e arpejos/shapes_escalas.json`
- `src/components/VoicingMiniSvg.tsx`
- `src/components/DiagramLegend.tsx`

Funcionalidades atuais:

- Aba propria em `/app`: `scales`.
- Entrada na sidebar logo abaixo de `Dicionario de Arpejos`.
- Busca por acorde/qualidade, por exemplo `C7M`.
- Depois da busca, o usuario escolhe a posicao do acorde que sera usada como referencia.
- `parseChord` identifica raiz e qualidade do acorde; `arpeggio-search.ts` fornece as posicoes do acorde.
- `scale-search.ts` cruza a qualidade do acorde com possibilidades modais compativeis.
- As opcoes sao mostradas em funcao da nota mais grave do shape escolhido, nao por rotulos genericos como aberto/baixo/medio/alto.
- Exemplo: em `C7M`, se a posicao escolhida tem `E` como nota mais grave, o modo jonio de C aparece como forma de `E Frigio`, porque usa as mesmas notas da escala de Do.
- O mini-diagrama usa `VoicingMiniSvg` em `renderMode="arpeggio"` para desenhar varias notas por corda, com cor verde para escala e fundamental em vermelho.
- Em escalas, o shape exibido e limpo para ficar sequencial: evita corda solta quando ha alternativa no proprio desenho e remove repeticoes da mesma altura entre cordas.
- Toda ocorrencia da fundamental dentro do shape de escala deve ficar vermelha, nao apenas a primeira.

Fonte de dados:

- O arquivo `diagramas/Shapes e arpejos/shapes_escalas.json` define possibilidades por qualidade de acorde e shapes modais estritos.
- O sistema deve respeitar os desenhos do JSON sem acrescentar notas fora do shape definido; a limpeza apenas remove duplicacoes/cordas soltas indesejadas.
- Para `C7M`, o resultado esperado inclui opcoes compativeis com acordes maiores/7M, como jonio e lidio.

Observacoes:

- Ainda nao ha salvamento/publicacao propria para escalas.
- Se o dicionario crescer com shapes manuais especificos, manter o contrato de `modesByChordQuality` e `modeShapes`.

## 11. Parser Musical

Arquivo: `src/lib/music-theory.ts`.

Responsabilidades:

- Normalizar notas enarmonicas.
- Definir formulas de acordes.
- Aceitar notacoes brasileiras e alternativas.
- Interpretar acordes com barra.
- Retornar `ParsedChord`.

Exemplos suportados:

- `C`
- `Am`
- `G7`
- `F#m7`
- `C7b9`
- `m6/9`
- `7M`
- `7/9`
- `7(13)`
- `C/G`

Pontos tecnicos:

- `parseQualityModular` cobre combinacoes nao listadas diretamente.
- `parseChord` converte notacoes como `11#` para `#11` e `-` para menor ou bemol conforme contexto.

## 12. Busca E Encadeamento De Voicings

Arquivos:

- `src/lib/voicing-search.ts`
- `src/lib/arpeggio-search.ts`
- `src/lib/chord-finder.ts`

`findVoicings`:

- Faz backtracking por corda/traste.
- Considera afinacao ativa.
- Limita traste maximo.
- Detecta pestanas.
- Conta dedos.
- Remove duplicados.
- Ordena por completude, cordas mudas, dedos e regiao.

`voicing-search.searchVoicings`:

- Tenta dicionario antes do algoritmo.
- Agrupa fallback por regioes do braco.
- Para instrumentos pequenos permite omitir quinta/fundamental em alguns casos.

`arpeggio-search.searchVoicings`:

- Reaproveita a logica de voicing e adiciona dados de arpejo.
- Usa `arpeggio-shapes.json` para mapear qualidade, corda raiz, traste raiz, direcao e frets de arpejo.
- Possui fallback de arpejo quando nao ha shape configurado.

`resolveAutoVoicings`:

- Resolve voicings para uma sequencia.
- No primeiro acorde prefere posicao baixa.
- Nos proximos acordes escolhe menor movimento em relacao ao shape anterior.

## 13. Sequencias Harmonicas

Arquivos:

- `src/components/ProgressionEditor.tsx`
- `src/components/ProgressionGrid.tsx`
- `src/components/PercussionPlayers.tsx`
- `src/lib/progression.ts`
- `src/lib/harmony.ts`
- `src/lib/degree-progressions.ts`

Funcionalidades:

- Escolha de categoria de sequencia.
- Escolha de template.
- Escolha de tom.
- Transposicao de graus para acordes reais.
- Edicao livre de progressao.
- Separacao por compassos usando `|`.
- `||` repete o compasso anterior.
- Analise harmonica por tonalidade detectada.
- Grade visual de compassos e acordes.
- Selecao manual de voicings por acorde.
- Auto-voicing com encadeamento.
- Playback com metronomo/sintese/loops.
- Salvamento privado e publicacao na comunidade.

Persistencia local da tela:

- O rascunho da sequencia usa `sessionStorage`.
- Chave: `sambatune:progression-draft`.
- Guarda categoria, template, tom, input, BPM e voicings.
- Ao desmontar a tela, `ProgressionEditor` chama `stopPlayback()` para evitar audio sintetizado tocando fora da tela.

Analise harmonica:

- `src/lib/harmony.ts` detecta a tonalidade antes de gerar graus romanos e funcoes.
- A deteccao usa pontuacao hibrida: perfil Krumhansl-Schmuckler, raizes dos acordes, encaixe diatonico, qualidade esperada do grau, dominantes resolvendo e peso de primeiro/ultimo acorde.
- A rotacao do perfil tonal deve preservar a raiz candidata como centro.
- Casos claros em do maior como `C | F | G | C`, `C7M | Dm7 G7 | C7M` e `C | Am | F | G` devem retornar `C maior`.
- Casos de referencia: `F | Bb | C7 | F` deve retornar `F maior`; `Am | Dm | E7 | Am` deve retornar `A menor`.

Categorias atuais:

- Quadradas Maiores.
- Quadradas Menores.
- Maiores.
- Menores.
- Dissonante Maior.
- Dissonante Menor.

### Modo Improvisacao

A aba `improvisation` usa o mesmo `ProgressionEditor`, com `mode="improvisation"`.

Comportamento atual:

- Mantem selecao de categoria, sequencia, tom, input livre, analise harmonica, playback e loops.
- Usa rascunho proprio em `sessionStorage`: `sambatune:improvisation-draft`.
- Usa `src/lib/arpeggio-search.ts` para resolver os voicings, anexando `arpeggioFrets`.
- Cada acorde na grade mostra o shape do acorde e uma segunda miniatura rotulada `Arpejo`.
- `VoicingMiniSvg` aceita `renderMode`: `combined`, `chord` ou `arpeggio`.
- A estrutura foi preparada para futuramente adicionar pentatonica e diatonica como novas opcoes de improviso ao redor do acorde.

## 14. Audio E Ritmo

Arquivos:

- `src/lib/audio.ts`
- `src/config/audio-loops.ts`
- `src/components/PercussionPlayers.tsx`
- `src/components/ProgressionAudio.tsx`
- `public/audio/loops`

Audio sintetizado:

- Tone.js.
- PolySynth FMSynth.
- Pad/comping harmonico por acorde.
- Metronomo com MembraneSynth.
- Funcoes principais: `startPlayback`, `stopPlayback`, `setBpm`, `hasLoopFor`.

Loops:

- Batucada.
- Samba-enredo.
- Outros estilos previstos no codigo: jazz, bossanova, metronome.

Estado atual:

- O botao principal de `ProgressionEditor` chama `startPlayback` com estilo `"metronome"` e modo `"harmony"`.
- `PercussionPlayers` oferece players separados para loops reais de percussao.
- `PercussionPlayers` cria seus proprios elementos `Audio`, pausa e limpa `src` no unmount para nao deixar batucada tocando ao trocar de tela.
- `ProgressionAudio.tsx` existe como painel mais completo de modos (`both`, `harmony`, `percussion`), mas nao esta ligado atualmente no `ProgressionEditor`.

## 15. Criador De Diagramas

Arquivo principal: `src/routes/app.tsx`.

Funcionalidades:

- Renderiza SVG editavel.
- Permite definir titulo.
- Traste inicial.
- Quantidade de trastes.
- Quantidade de cordas.
- Afinacao/string names.
- Orientacao vertical/horizontal.
- Conicidade.
- Tamanho de nota.
- Espessura de linha.
- Tamanho de fonte.
- Tamanho de marcador.
- Formas: circulo, quadrado, triangulo.
- Cores: principal, marcador, fundo.
- Marcadores por clique.
- Pestanas por drag.
- Cordas abertas/mudas no nut.
- Exporta SVG.
- Exporta PNG via canvas.

Dependencias internas:

- `ChordSearch` permite buscar acorde e carregar um voicing no diagrama principal.

Regra importante de orientacao:

- Na orientacao horizontal, o traste zero/nut permanece a esquerda.
- A ordem visual das cordas e invertida para preservar a afinacao correta de baixo para cima: `DGBD`.
- Essa regra evita o erro de mostrar `DBGD` quando o braco esta deitado.

## 16. Exercicios, Escalas E Arpejos

Arquivo: `src/components/ExercisesTab.tsx`.

Estado atual:

- Area com abas internas: Digitacao, Acordes, Frases, Arpejos e Mecanicos.
- Modulos de estudo ainda aparecem como conteudo em desenvolvimento.
- Construtor simples de rotina.

Campos do construtor:

- Titulo.
- Foco.
- Roteiro de pratica.
- BPM.
- Minutos.

Fluxos:

- Permite salvar no perfil.
- Permite publicar na comunidade.

Direcao de produto:

- Evoluir para aplicar arpejos e escalas por regiao do acorde.
- Integrar com sequencias e dicionario para treino contextual.
- Integrar com metronomo/batucada.

## 17. Comunidade

Arquivos:

- `src/components/CommunityTab.tsx`
- `src/lib/creations.ts`
- `supabase-community-creations.sql`

Tabelas esperadas:

- `community_creations`
- `community_creation_likes`
- `community_creation_comments`

Campos:

- `id`
- `type`
- `title`
- `description`
- `payload`
- `author_id`
- `author_name`
- `created_at`

Tipos persistidos:

- `dictionary`
- `progression`
- `exercise`

Secoes de dashboard:

- `progression`
- `dictionary`
- `scales`
- `arpeggios`

Fluxo:

1. Usuario cria algo em Dicionario, Sequencias ou Exercicios.
2. Pode salvar localmente no perfil.
3. Pode publicar na comunidade.
4. Publicacao publica usa `author_name`, derivado de nome artistico, nome, prefixo do email ou fallback `Musico`.
5. Comunidade abre em dashboard responsivo por assunto.
6. Cada cartao mostra quantidade de publicacoes, total de curtidas, total de comentarios e publicacao mais quente da secao.
7. Ao clicar em uma secao, a comunidade exibe as publicacoes em lista.
8. Publicacoes de `exercise` sao exibidas como Escalas ou Arpejos conforme conteudo salvo.
9. Usuario pode abrir uma publicacao na ferramenta de origem dentro da propria area `/app`.
10. Ao clicar no icone de comentario, os comentarios e a caixa de resposta aparecem abaixo da publicacao.
11. Comentarios feitos em publicacoes publicas ficam visiveis para a comunidade.
12. Autor pode excluir suas proprias publicacoes publicas pela UI.

Seguranca RLS esperada:

- Usuarios autenticados podem ler todos os itens.
- Usuarios autenticados podem inserir apenas com `author_id = auth.uid()`.
- Usuarios autenticados podem excluir apenas os proprios itens.
- Usuarios autenticados podem ler curtidas e comentarios.
- Usuarios autenticados podem curtir apenas como `user_id = auth.uid()`.
- Usuarios autenticados podem comentar apenas como `author_id = auth.uid()`.
- Usuarios autenticados podem excluir apenas as proprias curtidas/comentarios.

SQL esta em:

```txt
supabase-community-creations.sql
```

## 18. Salvamento Privado

Arquivo: `src/lib/creations.ts`.

O salvamento privado usa `localStorage`, separado por usuario:

```txt
sambatune_creations:{userId}
```

Operacoes:

- `loadLocalCreations(userId)`
- `saveLocalCreation(userId, creation)`
- `deleteLocalCreation(userId, creationId)`

UI:

- `CreationSavePanel` lista criacoes locais recentes do usuario.
- A lista mostra ate quatro itens recentes.
- Cada item pode ser aberto ou excluido.
- A exclusao pede confirmacao por `window.confirm`.

Consequencias:

- Funciona sem criar tabelas extras.
- Fica no navegador/dispositivo atual.
- Nao sincroniza entre dispositivos.
- Nao aparece para outros usuarios.

Para sincronizar privado entre dispositivos no futuro, criar tabela `user_creations` no Supabase.

## 19. Deploy

Arquivo: `.github/workflows/deploy.yml`.

Fluxo:

1. Push na branch `main`.
2. GitHub Actions baixa codigo.
3. Configura Node 20.
4. Roda `npm install`.
5. Roda `npm run build`.
6. Usa secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `FTP_SERVER`
   - `FTP_USERNAME`
   - `FTP_PASSWORD`
7. Envia `./dist/` por FTP para:

```txt
/public_html/
```

Dominio atual:

```txt
sambatune.com
```

Repositorio atual:

```txt
https://github.com/dududrummer/sambatune.git
```

Preferencia operacional do projeto:

- Ao finalizar alteracoes, commitar e enviar para GitHub.
- O deploy de producao acontece pelo workflow apos o push em `main`.

## 20. Configuracoes Externas Necessarias

### GitHub Secrets

Obrigatorios:

```txt
FTP_SERVER
FTP_USERNAME
FTP_PASSWORD
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### Supabase Auth

Configuracoes esperadas:

```txt
Site URL:
https://sambatune.com

Redirect URLs:
https://sambatune.com/**
https://www.sambatune.com/**
```

Cadastro por email:

- Confirmacao de email deve estar ativa se o produto exigir verificacao.
- O app ja mostra mensagem para confirmar email.

### Supabase SQL

Necessario para comunidade:

```txt
supabase-community-creations.sql
```

Necessario para perfis:

- Tabela `profiles`.
- Bucket `avatars`, se avatar for usado.

## 21. Design System

Arquivo global: `src/styles.css`.

Base:

- Tailwind CSS v4.
- Variaveis OKLCH.
- Variantes dark.
- Fonte interna principal: Inter.
- UI interna mais sobria, utilitaria e profissional.

Direcao visual atual:

- A aplicacao autenticada usa superficie clara/escura, botoes consistentes, sombras suaves e cards funcionais.
- A landing page tem identidade visual propria, com fontes `Bowlby One`, `Anton` e `DM Sans`, sombras fortes e alto contraste.
- Alteracoes visuais da landing nao devem vazar para o app interno sem decisao explicita.

## 22. Requisitos Funcionais

### RF-001 Autenticacao

O sistema deve permitir login por email/senha e Google.

### RF-002 Confirmacao de email

O sistema deve exigir confirmacao de email antes do acesso por conta criada manualmente.

### RF-003 Protecao da aplicacao

O sistema deve impedir acesso a `/app` para usuarios sem sessao.

### RF-004 Perfil

O usuario deve poder visualizar e editar dados basicos de perfil.

### RF-005 Dicionario interativo

O usuario deve poder buscar acordes e visualizar posicoes.

### RF-006 Dicionario de arpejos

O usuario deve poder buscar arpejos por acorde/regiao e visualizar as notas no diagrama.

### RF-007 Dicionario de escalas

O usuario deve poder digitar um acorde e visualizar escalas compativeis por regiao do braco.

### RF-008 Sequencias harmonicas

O usuario deve poder montar sequencias por templates ou texto livre.

### RF-009 Improvisacao

O usuario deve poder montar uma base harmonica e visualizar, para cada acorde, o shape do acorde e o arpejo correspondente.

### RF-010 Encadeamento de voicings

O sistema deve sugerir voicings com movimento reduzido entre acordes.

### RF-011 Diagramas personalizados

O usuario deve poder criar e exportar diagramas em SVG/PNG.

### RF-012 Audio

O usuario deve poder praticar com metronomo, sintese harmonica e loops.

### RF-013 Salvamento privado

O usuario deve poder salvar criacoes localmente no proprio perfil/navegador e remover itens salvos.

### RF-014 Publicacao publica

O usuario deve poder publicar criacoes na comunidade com nickname.

### RF-015 Comunidade

Usuarios autenticados devem poder visualizar criacoes publicas.

### RF-016 Interacao social

Usuarios autenticados devem poder curtir e comentar publicacoes da comunidade.

### RF-017 Exclusao de publicacoes proprias

Usuarios autenticados devem poder excluir publicacoes publicas proprias.

## 23. Requisitos Nao Funcionais

- O build de producao deve passar com `npm run build`.
- O deploy deve ser automatico em push para `main`.
- A aplicacao deve funcionar como SPA publicada em Hostinger.
- Dados sensiveis devem vir de secrets/env vars.
- O app nao deve expor service keys no frontend.
- Rotas privadas devem validar sessao.
- UI deve funcionar em desktop e mobile.
- O modo escuro deve cobrir shell, header, sidebar, user menu e conteudo.
- Textos devem permanecer em UTF-8; validar com uma busca por marcadores comuns de mojibake quando houver suspeita de encoding.

## 24. Contratos De Dados

### UserProfile

```ts
interface UserProfile {
  id: string;
  email: string;
  name: string;
  artisticName?: string;
  phoneWhatsapp?: string;
  age?: number;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  instrument?: string;
  avatarUrl?: string;
  howDidYouFindUs?: string;
  createdAt: string;
}
```

### SavedCreation

```ts
interface SavedCreation {
  id: string;
  type: "dictionary" | "progression" | "exercise";
  title: string;
  description?: string;
  payload: Record<string, unknown>;
  visibility: "private" | "public";
  authorId: string;
  authorName: string;
  createdAt: string;
}
```

### CommunityCreation

```ts
interface CommunityCreation extends SavedCreation {
  likesCount: number;
  commentsCount: number;
  viewerHasLiked: boolean;
}
```

### CreationComment

```ts
interface CreationComment {
  id: string;
  creationId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}
```

### Voicing

```ts
interface Voicing {
  frets: number[];
  startingFret: number;
  barres: BarreDef[];
  mutedStrings: number[];
  omitted: string[];
  fingerCount: number;
  isPriority?: boolean;
  rootString?: number;
  rootFret?: number;
  arpeggioFrets?: Array<{ string: number; fret: number }>;
}
```

## 25. Pontos De Atencao

1. O salvamento privado e localStorage, nao banco.
2. Comunidade depende da tabela `community_creations` e tabelas auxiliares de likes/comentarios.
3. `profiles` e bucket `avatars` nao possuem SQL versionado neste repo.
4. O app usa `dist/` para deploy; nao commitar `dist` se nao fizer parte do fluxo.
5. O chunk principal esta acima de 500 kB; Vite pode emitir warning.
6. `ProgressionEditor` e `app.tsx` concentram muita logica e podem ser divididos futuramente.
7. Existem dicionarios `ukulele` e `violao` no repo, mas a UI atual foca em cavaquinho/banjo.
8. Google OAuth depende de configuracao no Supabase e Google Cloud.
9. Recuperacao de senha aparece como link visual, mas ainda nao ha fluxo implementado.
10. `ProgressionAudio.tsx` existe, mas nao esta conectado ao fluxo principal.
11. A aba de arpejos ainda nao tem tipo proprio em `SavedCreation`; isso limita abertura/classificacao de criacoes especificas de arpejo.
12. A query string `tab` define a tab inicial, mas a sidebar trabalha principalmente por estado local.
13. A aba de improvisacao salva como `progression` com `payload.mode = "improvisation"`; se virar fluxo publico proprio, criar tipo dedicado.

## 26. Roadmap Tecnico Recomendado

### Curto prazo

- Criar SQL versionado para `profiles` e bucket/policies de `avatars`.
- Adicionar fluxo real de recuperacao de senha.
- Melhorar mensagens de erro de Supabase na publicacao.
- Criar tipo proprio para criacoes de arpejo, se a aba de arpejos passar a salvar/publicar diretamente.
- Criar tipo proprio para estudos de improvisacao, se a aba passar a publicar conteudo independente.
- Revisar imports/componentes legados da area de arpejos.

### Medio prazo

- Criar tabela `user_creations` para salvar privado no Supabase.
- Adicionar filtros mais granulares na comunidade.
- Adicionar pagina de detalhe para publicacoes.
- Integrar exercicios diretamente com sequencias, dicionario e arpejos.
- Adicionar testes automatizados unitarios para parser musical, busca de voicings e orientacao do diagrama.

### Longo prazo

- Code splitting por abas da aplicacao.
- Editor completo de arpejos e escalas por regiao.
- Sistema de planos de estudo persistente.
- Ranking ou curadoria de sequencias.
- Biblioteca de repertorio/musicas.

## 27. Checklist Antes De Alterar O Projeto

Antes de qualquer mudanca relevante:

1. Identificar qual fluxo sera afetado.
2. Verificar se a rota e publica ou autenticada.
3. Verificar se dados ficam em localStorage ou Supabase.
4. Verificar se precisa de nova tabela/policy RLS.
5. Preservar `npm run build`.
6. Evitar quebrar o deploy em `.github/workflows/deploy.yml`.
7. Atualizar este documento se a mudanca alterar comportamento ou contrato.

## 28. Definicao De Pronto

Uma feature esta pronta quando:

- Funciona no fluxo principal.
- Respeita autenticacao quando aplicavel.
- Exibe erro ou estado vazio claro.
- Funciona em modo claro e escuro.
- Passa em `npm run build`.
- Nao exige secrets hardcoded.
- Tem SQL/policies documentados quando altera Supabase.
- Este spec foi atualizado quando necessario.
