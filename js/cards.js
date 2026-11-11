/* Cartas do Remake: ajustes sobre o motor original (mesmas regras) e artes. */
(function(E){
const D=E.DEFS;
// cartas com arte nova: os valores seguem o que está impresso na arte
Object.assign(D['682'],{cost:9,atk:12,hp:16,kw:[{k:'imortal'},{k:'drenar',n:3}]});
Object.assign(D['3812'],{cost:10,atk:9,hp:13,kw:[{k:'colapso'}]});

const EXTRA={
 imortal:['Imortal','Na primeira vez que seria destruído, sobrevive com 1 de Vida.'],
 colapso:['Colapso de Realidade','Após 3 turnos em campo, todas as cartas inimigas são destruídas.'],
};
const TEXT={};for(const k in D)TEXT[k]=(D[k].desc||[]).slice();
const DRAIN=n=>`Ao causar dano em combate, recupera ${n} de Vida.`;
for(const k of['682','3812'])TEXT[k]=D[k].kw.map(e=>EXTRA[e.k]?{n:EXTRA[e.k][0],t:EXTRA[e.k][1]}:e.k==='drenar'?{n:'Drenar',t:DRAIN(e.n)}:{n:E.KW[e.k].txt(e),t:''});

const FULL={'682':1,'3812':1}; // artes completas (moldura inclusa)
const A=p=>(window.ASSETS&&window.ASSETS[p])||p; // no build, as imagens vêm embutidas
const artOf=def=>{const b=def==='T074'?'074':def==='T088'?'088':def;return FULL[b]?null:A(`assets/art/card_${b}.webp`)};
const CLS={safe:'Seguro',euclid:'Euclid',keter:'Keter',token:'Ficha',unique:'Único'};
const DECK=['127','127','007','007','106','074','074','043','043','049','049','682','3812','3008','3008','096','054','138','088','075'];
window.CARDS={A,TEXT,FULL,artOf,CLS,DECK};
})(CombatEngine);
