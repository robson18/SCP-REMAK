# SCP Remake

Jogo de cartas da Fundação SCP com gráficos novos. As regras são as mesmas do SCP Card Game original
(`js/engine.js` é o mesmo motor de combate).

Tem o **menu inicial** (Iniciar Jogo, Baralho, Enciclopédia, Configurações, Créditos, Sair) e a **mesa de duelo** contra a IA.

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
| `js/menu.js` | Menu inicial, montagem de baralho, enciclopédia, configurações e créditos |
| `assets/src/` | Artes originais enviadas (carta, verso/baralho, mesa) |
| `tools/prep_assets.py` | Recorta as artes e apaga os números impressos (o jogo escreve ATQ/Vida por cima) |

## Cartas com arte nova

Os símbolos de ATQ (espada) e Vida (coração) são apagados da arte por `tools/prep_assets.py` e desenhados pelo jogo,
iguais em todas as cartas. A cor da moldura indica a classe: verde = Seguro, prata = Euclid, vermelho = Keter.

| Carta | Classe | Custo | ATQ / Vida | Habilidades (inspiradas no Hearthstone) |
|---|---|---|---|---|
| SCP-127 — A Arma Viva | Seguro | 3 | 3 / 4 | **Investida** |
| SCP-074 — O Tatuzinho Quântico | Euclid | 3 | 2 / 7 | **Provocar** |
| SCP-075 — O Caracol Corrosivo | Euclid | 4 | 3 / 5 | **Venenoso** |
| SCP-054 — A Ninfa de Água | Seguro | 5 | 3 / 6 | **Escudo Divino** · **Grito de Guerra:** cura 3 de todos os aliados |
| SCP-682 — O Lagarto Imortal | Keter | 9 | 12 / 16 | **Imortal** · **Drenar 3** |
| SCP-3812 — Uma Voz Atrás de Mim | Keter | 10 | 9 / 13 | **Colapso de Realidade** · **Último Suspiro:** 3 de dano a todos os inimigos |

Palavras-chave novas no motor: Provocar, Investida, Escudo Divino, Venenoso, Fúria dos Ventos, Grito de Guerra, Último Suspiro
(testes em `node tools/rules.test.js`). As outras cartas usam a arte do jogo antigo dentro da moldura nova até receberem arte própria.

Para adicionar uma carta com arte nova: salve a imagem como `assets/src/card_<número>.webp`, rode
`python3 tools/prep_assets.py <pasta assets do jogo antigo>` e configure a carta em `NEW` e `FULL` (`js/cards.js`).

## Licença

Conteúdo da Fundação SCP sob CC BY-SA 3.0 (scp-wiki.wikidot.com).

## Versão jogável (Release)

A cada envio para a `main`, o GitHub Actions monta o jogo e publica na Release **Versão de teste** (aba Releases):

- `scp_remake.html`: arquivo único, abra no navegador.
- `SCP_Remake_Windows.zip`: executável para Windows.
- `SCP_Remake_Android.apk`: aplicativo Android.

Para montar o HTML localmente: `python3 tools/build.py`.
