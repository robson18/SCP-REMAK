/* Menu inicial: Iniciar Jogo, Baralho, Enciclopédia, Configurações, Créditos e Sair. */
(()=>{
const E=CombatEngine,C=CARDS,D=E.DEFS;
const $=s=>document.querySelector(s);
const menu=$('#menu'),panel=$('#panel');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);

/* ---------- configurações (salvas no navegador) ---------- */
const DEF={speed:'normal',first:'random'};
let saved={};try{saved=JSON.parse(localStorage.getItem('scpremake.settings'))||{}}catch(e){}
window.SETTINGS=Object.assign({},DEF,saved);
const saveSettings=()=>{try{localStorage.setItem('scpremake.settings',JSON.stringify(SETTINGS))}catch(e){}};

const card=(def,cls='')=>`<div class="card ${cls}">${DUEL.cardHTML(def,null)}</div>`;
const byCost=(a,b)=>D[a].cost-D[b].cost||D[a].name.localeCompare(D[b].name,undefined,{numeric:true});
let tt;function toast(t){const b=$('#toast');b.textContent=t;b.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>b.classList.remove('on'),2200)}
function open(title,sub,body){panel.innerHTML=`<h2>${title}</h2>${sub?`<div class="sub">${sub}</div>`:''}<button class="btn close">VOLTAR</button><div class="body">${body}</div>`;
 panel.classList.add('on');panel.querySelector('.close').onclick=()=>panel.classList.remove('on')}

/* ---------- Baralho ---------- */
function deckScreen(){let deck=C.loadDeck();const N=E.RULES.DECK_SIZE;
 function draw(){const cnt={};deck.forEach(d=>cnt[d]=(cnt[d]||0)+1);
  open('BARALHO',`Clique numa carta para colocá-la no baralho; clique na lista para tirar. ${N} cartas, até 2 cópias de cada (Keter: 1).`,
   `<div class="grid">${C.COLLECTION.slice().sort(byCost).map(d=>`<div class="gc${cnt[d]>=C.MAX_COPIES(d)?' dim':''}" data-add="${d}">${card(d)}${cnt[d]?`<b class="n">${cnt[d]}</b>`:''}</div>`).join('')}</div>
    <div class="side"><div class="count${deck.length!==N?' bad':''}">${deck.length} / ${N} cartas</div>
     <div class="list">${Object.keys(cnt).sort(byCost).map(d=>`<div class="li" data-rm="${d}"><span class="c">${D[d].cost}</span>${esc(D[d].name)}<span class="x">×${cnt[d]}</span></div>`).join('')}</div>
     <button class="btn" id="dsave">SALVAR BARALHO</button><button class="btn" id="dreset">BARALHO PADRÃO</button></div>`);
  panel.querySelectorAll('[data-add]').forEach(x=>x.onclick=()=>{const d=x.dataset.add;
   if(deck.length>=N)return toast(`O baralho já tem ${N} cartas.`);if((cnt[d]||0)>=C.MAX_COPIES(d))return toast('Limite de cópias desta carta.');deck.push(d);draw()});
  panel.querySelectorAll('[data-rm]').forEach(x=>x.onclick=()=>{deck.splice(deck.indexOf(x.dataset.rm),1);draw()});
  $('#dsave').onclick=()=>{if(!C.validDeck(deck))return toast(`O baralho precisa ter exatamente ${N} cartas.`);C.saveDeck(deck);toast('Baralho salvo!')};
  $('#dreset').onclick=()=>{deck=C.DECK.slice();draw()}}
 draw()}

/* ---------- Enciclopédia ---------- */
const GLOSS=[['Provocar','Os inimigos precisam atacar esta carta primeiro.'],['Investida','Pode atacar no turno em que entra.'],['Escudo Divino','O primeiro dano que receberia é anulado.'],
 ['Venenoso','Destrói qualquer carta que ferir em combate.'],['Fúria dos Ventos','Pode atacar duas vezes por turno.'],['Grito de Guerra','Efeito que acontece quando a carta entra em campo.'],
 ['Último Suspiro','Efeito que acontece quando a carta é destruída.'],['Imortal','Na primeira vez que seria destruída, sobrevive com 1 de Vida.'],
 ['Risco de Ruptura','Cartas perigosas aumentam o seu Risco. Ao chegar a '+E.RULES.RR_MAX+', acontece uma Ruptura de Contenção.'],['Protocolo de Emergência',`Gasta ${E.RULES.EM_COST} PC e reduz o Risco em ${E.RULES.EM_RR}.`]];
function encScreen(){const all=C.COLLECTION.slice().sort(byCost);
 function detail(d){const x=D[d];return`${card(d)}<p><b>${esc(x.name)} — ${esc(x.nick)}</b><br>Classe: ${C.CLS[x.cls]} · Custo: ${x.cost} PC · Risco: +${x.risk||0}${C.NEW[d]?'<br><i>Arte nova</i>':''}</p>`}
 open('ENCICLOPÉDIA','Todas as cartas da Fundação. Clique numa carta para ver os detalhes.',
  `<div class="grid">${all.map(d=>`<div class="gc" data-d="${d}">${card(d)}</div>`).join('')}</div>
   <div class="detail" id="encd"><div class="gloss">${GLOSS.map(([n,t])=>`<div><b>${n}</b> — ${t}</div>`).join('')}</div></div>`);
 panel.querySelectorAll('[data-d]').forEach(x=>x.onclick=()=>{$('#encd').innerHTML=detail(x.dataset.d)+`<div class="gloss">${GLOSS.map(([n,t])=>`<div><b>${n}</b> — ${t}</div>`).join('')}</div>`})}

/* ---------- Configurações ---------- */
function cfgScreen(){const opt=(k,v,l)=>`<button class="btn${SETTINGS[k]===v?' sel':''}" data-k="${k}" data-v="${v}">${l}</button>`;
 open('CONFIGURAÇÕES','',`<div class="opts">
  <div class="row"><span>Velocidade das animações</span>${opt('speed','normal','Normal')}${opt('speed','fast','Rápida')}</div>
  <div class="row"><span>Quem começa o duelo</span>${opt('first','random','Sorteio')}${opt('first','p','Você')}${opt('first','e','Inimigo')}</div>
  <div class="row"><span>Tela</span><button class="btn" id="fs">TELA CHEIA</button></div>
  <div class="row"><span>Baralho</span><button class="btn" id="rdeck">VOLTAR AO BARALHO PADRÃO</button></div></div>`);
 panel.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{SETTINGS[b.dataset.k]=b.dataset.v;saveSettings();cfgScreen()});
 $('#fs').onclick=()=>{const d=document;if(d.fullscreenElement)d.exitFullscreen();else d.documentElement.requestFullscreen&&d.documentElement.requestFullscreen().catch(()=>{})};
 $('#rdeck').onclick=()=>{C.saveDeck(C.DECK.slice());toast('Baralho padrão restaurado.')}}

/* ---------- Créditos ---------- */
function credScreen(){open('CRÉDITOS','',`<div class="credits">
 <h3>SCP Remake</h3>Jogo de cartas feito por fãs, baseado na Fundação SCP. Mesmas regras do SCP Card Game, com gráficos novos.
 <h3>Fundação SCP</h3>O conteúdo da Fundação SCP é licenciado sob Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0).
 Cada carta é baseada no artigo correspondente em scp-wiki.wikidot.com, escrito pelos autores da comunidade. Este jogo segue a mesma licença.
 <h3>Cartas</h3>${C.COLLECTION.slice().sort(byCost).map(d=>`${esc(D[d].name)} — ${esc(D[d].nick)}`).join(' · ')}
 <h3>Fontes</h3>Merriweather e Roboto Condensed (Google Fonts, SIL Open Font License).</div>`)}

/* ---------- navegação ---------- */
const GO={play:()=>{menu.classList.remove('on');DUEL.newGame()},deck:deckScreen,enc:encScreen,cfg:cfgScreen,cred:credScreen,
 quit:()=>{window.close();setTimeout(()=>toast('Para sair, feche a aba do navegador.'),300)}};
menu.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>GO[b.dataset.go]());
window.MENU={show(){panel.classList.remove('on');menu.classList.add('on')}};
})();
