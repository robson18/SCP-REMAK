/* Cartas do Remake: ajustes sobre o motor (habilidades inspiradas no Hearthstone), textos, artes e baralhos. */
(function(E){
const D=E.DEFS;
// cartas com arte nova (classe = cor da moldura: verde Seguro, prata Euclid, vermelho Keter)
const NEW={
 '127':{cls:'safe',cost:3,atk:3,hp:4,risk:0,kw:[{k:'investida'}]},
 '074':{cls:'euclid',cost:3,atk:2,hp:7,risk:1,kw:[{k:'provocar'}]},
 '075':{cls:'euclid',cost:4,atk:3,hp:5,risk:1,kw:[{k:'venenoso'}]},
 '054':{cls:'safe',cost:5,atk:3,hp:6,risk:0,kw:[{k:'escudo'},{k:'entra_cura_todos',n:3}]},
 '682':{cls:'keter',cost:9,atk:12,hp:16,kw:[{k:'imortal'},{k:'drenar',n:3}]},
 '3812':{cls:'keter',cost:10,atk:9,hp:13,kw:[{k:'colapso'},{k:'us_dano',n:3}]},
};
for(const k in NEW)Object.assign(D[k],NEW[k]);
// recalcula quais cartas pedem alvo ao entrar
for(const k in E.TARGETED)delete E.TARGETED[k];
for(const k in D)if((D[k].kw||[]).some(e=>E.KW[e.k]&&E.KW[e.k].tgt))E.TARGETED[k]=1;

const KWD={drenar:n=>['Drenar',`Ao causar dano em combate, recupera ${n} de Vida.`]};
const TEXT={};
for(const k in D){const d=D[k];if(!d.kw){TEXT[k]=[];continue}
 TEXT[k]=NEW[k]?d.kw.map(e=>{const g=E.GLOSS_KWD&&E.GLOSS_KWD[e.k];if(KWD[e.k]){const[n,t]=KWD[e.k](e.n);return{n,t}}
   return{n:E.KW[e.k].txt(e).replace(/^Grito de Guerra:.*/,'Grito de Guerra').replace(/^Último Suspiro:.*/,'Último Suspiro'),t:(E.KWDESC[e.k]||(()=>''))(e.n)}}):(d.desc||[]).slice()}

const A=p=>(window.ASSETS&&window.ASSETS[p])||p; // no build, as imagens vêm embutidas
const FULL={'682':1,'3812':1,'127':1,'074':1,'075':1,'054':1}; // artes completas (moldura inclusa)
const artOf=def=>{const b=def==='T074'?'074':def==='T088'?'088':def;return FULL[b]?A(`assets/card_${b}.webp`):A(`assets/art/card_${b}.webp`)};
const CLS={safe:'Seguro',euclid:'Euclid',keter:'Keter',token:'Ficha',unique:'Único'};
const COLLECTION=E.COLLECTIBLE.filter(k=>!D[k].special);
const MAX_COPIES=d=>D[d].cls==='keter'?1:2;
const DECK=['127','127','074','074','075','075','054','054','682','3812','007','007','049','049','043','043','088','138','3008','096'];
// baralho do jogador (salvo no navegador)
function loadDeck(){try{const d=JSON.parse(localStorage.getItem('scpremake.deck'));if(validDeck(d))return d}catch(e){}return DECK.slice()}
function saveDeck(d){try{localStorage.setItem('scpremake.deck',JSON.stringify(d))}catch(e){}}
function validDeck(d){if(!Array.isArray(d)||d.length!==E.RULES.DECK_SIZE)return false;const c={};for(const x of d){if(!D[x]||!COLLECTION.includes(x))return false;c[x]=(c[x]||0)+1;if(c[x]>MAX_COPIES(x))return false}return true}
window.CARDS={A,TEXT,FULL,artOf,CLS,DECK,COLLECTION,MAX_COPIES,loadDeck,saveDeck,validDeck,NEW};
})(CombatEngine);
