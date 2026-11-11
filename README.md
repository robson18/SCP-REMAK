# SCP Remake

Jogo de cartas da Fundação SCP com gráficos novos. As regras são as mesmas do SCP Card Game original
(`js/engine.js` é o mesmo motor de combate).

Nesta primeira etapa só existe a **mesa de duelo** contra a IA.

## Como jogar

Abra `index.html` no navegador (não precisa de build).

- **Baixar carta:** arraste da mão para uma coluna sua (ou clique na carta e depois na coluna).
- **Atacar:** arraste (ou clique) uma carta sua com brilho verde até uma carta inimiga. Para atacar o inimigo direto, a coluna da frente precisa estar vazia; aí é só soltar no painel do inimigo.
- **Ver carta:** passe o mouse sobre ela.
- **Protocolo de Emergência:** gasta 2 PC e reduz em 2 o Risco de Ruptura.
- Botão direito cancela a ação.

## Estrutura

| Arquivo | O que tem |
|---|---|
| `index.html`, `style.css` | Mesa, HUD e estilos |
| `js/engine.js` | Motor de regras (cópia do jogo original) |
| `js/cards.js` | Ajustes das cartas com arte nova, textos e baralho |
| `js/duel.js` | Desenho da mesa, animações, controles e IA |
| `assets/src/` | Artes originais enviadas (carta, verso/baralho, mesa) |
| `tools/prep_assets.py` | Recorta as artes e apaga os números impressos (o jogo escreve ATQ/Vida por cima) |

## Cartas com arte nova

| Carta | Custo | ATQ / Vida | Habilidades |
|---|---|---|---|
| SCP-682 — O Lagarto Imortal | 9 | 12 / 16 | **Imortal** (na primeira vez que seria destruído, fica com 1 de Vida) · **Drenar 3** |
| SCP-3812 — Uma Voz Atrás de Mim | 10 | 9 / 13 | **Colapso de Realidade** (após 3 turnos em campo, destrói todas as cartas inimigas) |

As outras cartas usam a arte do jogo antigo dentro da moldura nova até receberem arte própria.

## Licença

Conteúdo da Fundação SCP sob CC BY-SA 3.0 (scp-wiki.wikidot.com).
