/* ==========================================================================
   MOTOR DE COMBATE — lógica pura (sem DOM). Funciona no navegador e no Node.
   Estado ←→ ações (dispatch) ←→ eventos rastreáveis. A interface só lê eventos.
   ========================================================================== */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CombatEngine=factory()})(typeof self!=='undefined'?self:this,function(){
'use strict';
/* ---------- constantes de regra (um só lugar para balancear) ---------- */
const RULES={SLOTS:5,HAND_MAX:7,START_HAND:5,HP:30,PC_START:2,PC_CAP:10,RR_MAX:10,RR_AFTER_BREACH:5,DECK_SIZE:20,
 EM_COST:2,EM_RR:2,POCKET_TURNS:2,POISON_CAP:5,MICRO_CAP:3,FATIGUE_GRACE:3,OVERTIME_TURN:12,SCP001_CHANCE:0.01,SECOND_EXTRA_CARDS:1,SECOND_FIRST_PC:0,SECOND_HP:2,FIRST_FIRST_PC:-1,BREACH_GENERIC_PC:2,HUNT_DAMAGE:2,TOKEN_CAP:2,TOKEN_KEEP_FREE:1,COUNTER:false};

/* ---------- definições de cartas (orientado a dados) ---------- */
const DEFS={
 '127':{id:'127',name:'SCP-127',nick:'A Arma Viva',cls:'safe',cost:2,atk:3,hp:4,risk:0,
  kw:[{k:'cura',n:2}]},
 '007':{id:'007',name:'SCP-007',nick:'O Planeta Abdominal',cls:'euclid',cost:3,atk:3,hp:6,risk:1,
  kw:[{k:'drenar',n:3}]},
 '106':{id:'106',name:'SCP-106',nick:'O Velho',cls:'keter',cost:7,atk:3,hp:4,risk:3,printed:true,
  kw:[{k:'dim_bolso',n:2}]},
 '074':{id:'074',name:'SCP-074',nick:'O Tatuzinho Quântico',cls:'euclid',cost:2,atk:3,hp:4,risk:1,
  kw:[{k:'enfraquecer',n:2}]},
 '043':{id:'043',name:'SCP-043',nick:'O Álbum Branco',cls:'safe',cost:4,atk:5,hp:6,risk:0,
  kw:[{k:'reforco',n:2}]},
 '049':{id:'049',name:'SCP-049',nick:'O Médico da Peste',cls:'euclid',cost:3,atk:4,hp:3,risk:2,
  kw:[{k:'veneno',n:3}]},
 '682':{id:'682',name:'SCP-682',nick:'O Lagarto Imortal',cls:'euclid',cost:8,atk:9,hp:15,risk:4,
  kw:[{k:'drenar',n:3}],
  breach:{id:'rampage',name:'Fúria Reptiliana',dmg:3,text:'Se escolhido numa ruptura: 3 de dano direto ao controlador e não ataca no próximo turno.'}},
 '3008':{id:'3008',name:'SCP-3008',nick:'A Loja Infinita',cls:'euclid',cost:6,atk:5,hp:11,risk:2,
  kw:[{k:'enfraquecer',n:2}]},
 '096':{id:'096',name:'SCP-096',nick:'O Homem Tímido',cls:'euclid',cost:8,atk:9,hp:8,risk:2,
  kw:[{k:'drenar',n:2}]},
 '001':{id:'001',name:'SCP-001',nick:'O Primeiro',cls:'unique',special:true,cost:0,atk:0,hp:0,risk:0,
  kw:[{k:'fim'}]},
 '158':{id:'158',name:'SCP-158',nick:'O Extrator de Almas',cls:'euclid',cost:1,atk:1,hp:4,risk:1,
  kw:[{k:'silenciar'}]},
 '088':{id:'088',name:'SCP-088',nick:'O Rei Reptiliano',cls:'safe',cost:5,atk:5,hp:8,risk:1,
  kw:[{k:'regeneracao',n:2}]},
 '138':{id:'138',name:'SCP-138',nick:'O Homem que Não Morre',cls:'safe',cost:5,atk:4,hp:11,risk:1,
  kw:[{k:'protecao',n:1},{k:'regeneracao',n:1}]},
 '119':{id:'119',name:'SCP-119',nick:'O Micro-ondas Temporal',cls:'euclid',cost:3,atk:2,hp:6,risk:1,
  kw:[{k:'enfraquecer',n:3}]},
 '075':{id:'075',name:'SCP-075',nick:'O Caracol Corrosivo',cls:'euclid',cost:5,atk:5,hp:7,risk:1,
  kw:[{k:'veneno',n:2}]},
 '072':{id:'072',name:'SCP-072',nick:'Pé de Cama',cls:'euclid',cost:4,atk:5,hp:7,risk:1,
  kw:[{k:'silenciar'}]},
 '082':{id:'082',name:'SCP-082',nick:'Fernand, o Canibal',cls:'euclid',cost:6,atk:6,hp:8,risk:1,
  kw:[{k:'drenar',n:2}]},
 '054':{id:'054',name:'SCP-054',nick:'A Ninfa de Água',cls:'safe',cost:4,atk:4,hp:6,risk:0,
  kw:[{k:'protecao',n:1}]},
 '060':{id:'060',name:'SCP-060',nick:'O Incêndio Vivo',cls:'keter',cost:7,atk:5,hp:10,risk:2,
  kw:[{k:'incendiar',n:1},{k:'furia_x',n:2}],
  breach:{id:'wildfire',name:'Incêndio Descontrolado',dmg:2,text:'Se escolhido numa ruptura: 2 de dano direto ao controlador e não ataca no próximo turno.'}},
 '008':{id:'008',name:'SCP-008',nick:'A Praga Zumbi',cls:'euclid',cost:1,atk:2,hp:3,risk:1,
  kw:[{k:'veneno',n:1}]},
 '1440':{id:'1440',name:'SCP-1440',nick:'O Velho de Lugar Nenhum',cls:'keter',cost:8,atk:2,hp:8,risk:3,printed:true,
  kw:[{k:'tres_irmaos',n:2}]},
 '1178':{id:'1178',name:'SCP-1178',nick:'ICBM Flutuante',cls:'keter',cost:8,atk:3,hp:7,risk:3,printed:true,
  kw:[{k:'alerta_nuclear',n:3}]},
 '1155':{id:'1155',name:'SCP-1155',nick:'Arte de Rua Predatória',cls:'keter',cost:7,atk:4,hp:5,risk:3,printed:true,
  kw:[{k:'grafite'}]},
 '3812':{id:'3812',name:'SCP-3812',nick:'Uma Voz Atrás de Mim',cls:'keter',cost:10,atk:0,hp:20,risk:4,printed:true,
  kw:[{k:'colapso'}]},
 'T074':{id:'T074',name:'SCP-074-1',nick:'Ficha',cls:'token',token:true,cost:0,atk:2,hp:2,risk:0},
 'T088':{id:'T088',name:'Reptiliano',nick:'Ficha',cls:'token',token:true,cost:0,atk:2,hp:2,risk:0}};
/* ---------- PALAVRAS-CHAVE: o texto de cada carta é gerado a partir delas ---------- */
const GLOSS={
 'Ao entrar':'Acontece quando a carta é jogada no campo.',
 'Abate':'Acontece quando esta carta destrói um inimigo em combate.',
 'Início do turno':'Acontece no começo de cada turno seu.',
 'Ao atacar':'Acontece toda vez que esta carta ataca.',
 'Quando o oponente compra':'Acontece toda vez que o oponente compra uma carta.',
 'Banir':'Manda a unidade para o Bolso por X dos seus turnos; depois ela volta ao campo.',
 'Silenciar':'A unidade perde todas as habilidades.',
 'Enfraquecer':'A unidade perde X de Ataque e X de Vida, permanentemente.',
 'Curar':'Recupera X de Vida, até o máximo.',
 'Invocar':'Cria uma ficha no espaço vazio mais à esquerda. Fichas e cópias só surgem se houver 2 espaços livres, no máximo 2 por lado.',
 'Contagiar':'Invoca do seu lado uma cópia infectada 1/1 do inimigo destruído, com as mesmas habilidades.',
 'Peste':'Escolha até 2 inimigos: cada um sofre 1 de dano por unidade no seu campo, agora e no início do seu próximo turno.',
 'Comprar':'Compre X cartas.',
 'Regenerar':'No fim do seu turno, recupera X de Vida.',
 'Indestrutível':'Efeitos não destroem esta carta; ela só morre em combate.',
 'Guardião':'Enquanto esta carta estiver em campo, suas outras unidades não podem ser destruídas (ficam com 1 de Vida).',
 'Fúria':'Entra em Fúria ao entrar e quando um inimigo é jogado à frente dela. Em Fúria, o próximo ataque vai no inimigo mais próximo, ignorando a coluna.',
 'Imortal':'Na primeira vez que seria destruída, fica com 1 de Vida.',
 'Blindado':'Recebe metade do dano (arredondado para baixo).',
 'Corrosivo':'Ao causar dano a um inimigo, reduz a Vida máxima dele em X.',
 'Incendiar':'Causa X de dano a todas as outras unidades inimigas.',
 'Copiar':'No início do seu turno, copia uma habilidade de um inimigo em campo até o fim do turno.',
 'Ruptura':'Se esta carta for escolhida numa ruptura de contenção, causa dano direto ao dono e não ataca no próximo turno.',
 'Fim da Contenção':'Você vence a partida imediatamente. Só pode ser usada uma vez por Operação de Contenção.'};
/* ---------- BIBLIOTECA DE PALAVRAS-CHAVE POR CLASSE (v0.17) ----------
 Safe: Regeneração, Proteção, Cura, Reforço · Euclid: Veneno, Enfraquecer, Drenar, Silenciar · Keter: Fúria, Devastar, Retaliação, Execução */
Object.assign(GLOSS,{
 'Regeneração':'No fim do seu turno, recupera X de Vida (até o máximo).',
 'Proteção':'Recebe X de dano a menos de cada golpe ou efeito (mínimo 0).',
 'Cura':'Ao entrar, recupera X de Vida do aliado mais ferido.',
 'Reforço':'Ao entrar, dá +X de Vida e +X de Vida máxima ao aliado mais forte, para sempre.',
 'Veneno':'Ao causar dano de combate numa unidade, aplica X de Veneno. No início do turno do dono, a unidade sofre 1 de dano por Veneno e perde 1 Veneno (máximo 5).',
 'Enfraquecer':'Ao entrar, um inimigo à sua escolha perde X de Ataque até o início do seu próximo turno.',
 'Drenar':'Ao causar dano de combate, recupera X de Vida em si mesma (até o máximo).',
 'Silenciar':'Ao entrar, um inimigo à sua escolha perde as habilidades até o início do seu próximo turno.',
 'Fúria':'Com metade da Vida máxima ou menos, ganha +X de Ataque.',
 'Devastar':'Ao atacar, causa X de dano às unidades inimigas nas colunas ao lado do alvo.',
 'Retaliação':'Ao sofrer dano de ataque e sobreviver, causa X de dano ao atacante.',
 'Execução':'Causa +X de dano ao atacar uma unidade inimiga que já está ferida.'});
// exclusivas: habilidade própria da carta (por enquanto, as Keter mantêm a habilidade original)
const EXCLUSIVE={entra_banir:'Corrosão Dimensional',incendiar:'Chamas Persistentes',dim_bolso:'Dimensão de Bolso',tres_irmaos:'Maldição dos Três Irmãos',alerta_nuclear:'Alerta Nuclear',grafite:'Atração do Grafite',colapso:'Colapso de Realidade'};
const CLASS_KW={safe:['regeneracao','protecao','cura','reforco'],euclid:['veneno','enfraquecer','drenar','silenciar'],keter:['furia_x','devastar','retaliacao','execucao']};
const KWNEW={
 regeneracao:{txt:e=>`Regeneração ${e.n}`,terms:['Regeneração']},
 protecao:{txt:e=>`Proteção ${e.n}`,terms:['Proteção']},
 cura:{txt:e=>`Cura ${e.n}`,terms:['Cura']},
 reforco:{txt:e=>`Reforço ${e.n}`,terms:['Reforço']},
 veneno:{txt:e=>`Veneno ${e.n}`,terms:['Veneno']},
 enfraquecer:{txt:e=>`Enfraquecer ${e.n}`,terms:['Enfraquecer'],tgt:'any'},
 drenar:{txt:e=>`Drenar ${e.n}`,terms:['Drenar']},
 silenciar:{txt:()=>'Silenciar',terms:['Silenciar'],tgt:'any'},
 furia_x:{txt:e=>`Fúria ${e.n}`,terms:['Fúria']},
 devastar:{txt:e=>`Devastar ${e.n}`,terms:['Devastar']},
 retaliacao:{txt:e=>`Retaliação ${e.n}`,terms:['Retaliação']},
 execucao:{txt:e=>`Execução ${e.n}`,terms:['Execução']}};
const tokName=f=>f==='T088'?'Reptiliano':'Ficha 074-1';
// k: {txt(e) -> linha da carta, terms: palavras do glossário usadas}
const KW={
 provocar:{txt:()=>'Provocar',terms:['Provocar']},
 investida:{txt:()=>'Investida',terms:['Investida']},
 escudo:{txt:()=>'Escudo Divino',terms:['Escudo Divino']},
 venenoso:{txt:()=>'Venenoso',terms:['Venenoso']},
 furia_vento:{txt:()=>'Fúria dos Ventos',terms:['Fúria dos Ventos']},
 entra_cura_todos:{txt:e=>`Grito de Guerra: Curar ${e.n} todos os aliados`,terms:['Grito de Guerra']},
 us_dano:{txt:e=>`Último Suspiro: ${e.n} de dano a todos os inimigos`,terms:['Último Suspiro']},
 abate_atk:{txt:e=>`Abate: +${e.n} ATQ`,terms:['Abate']},
 abate_cura:{txt:e=>`Abate: Curar ${e.n} (a si mesma)`,sh:e=>`Abate: Curar ${e.n}`,terms:['Abate','Curar']},
 abate_invoca:{txt:e=>`Abate: Invocar ${tokName(e.f)} 2/2`,sh:()=>'Abate: Invocar 2/2',terms:['Abate','Invocar']},
 contagio:{txt:()=>'Abate: Contagiar',terms:['Abate','Contagiar']},
 inicio_cura:{txt:e=>`Início do turno: Curar ${e.n} o aliado mais ferido e +${e.n} Vida máx. (até +3)`,sh:e=>`Início do turno: Curar ${e.n}`,terms:['Início do turno','Curar']},
 inicio_invoca:{txt:e=>`Início do turno: Invocar ${tokName(e.f)} 2/2`,sh:()=>'Início do turno: Invocar 2/2',terms:['Início do turno','Invocar']},
 compra_invoca:{txt:e=>`Quando o oponente compra: Invocar ${tokName(e.f)} 2/2`,sh:()=>'Oponente compra: Invocar 2/2',terms:['Quando o oponente compra','Invocar']},
 copiar:{txt:()=>'Copiar',terms:['Copiar']},
 entra_banir:{txt:e=>`Ao entrar: Banir ${e.n} um inimigo à frente ou ao lado`,sh:e=>`Ao entrar: Banir ${e.n}`,terms:['Ao entrar','Banir'],tgt:'adj'},
 entra_peste:{txt:()=>'Ao entrar: Peste',terms:['Ao entrar','Peste']},
 entra_silenciar_aura:{txt:()=>'Ao entrar: Silenciar um inimigo enquanto esta carta estiver em campo',sh:()=>'Ao entrar: Silenciar',terms:['Ao entrar','Silenciar'],tgt:'any'},
 entra_silenciar:{txt:()=>'Ao entrar: Silenciar um inimigo até o seu próximo turno',sh:()=>'Ao entrar: Silenciar 1 turno',terms:['Ao entrar','Silenciar'],tgt:'any'},
 entra_enfraquecer:{txt:e=>`Ao entrar: Enfraquecer ${e.n} um inimigo`,sh:e=>`Ao entrar: Enfraquecer ${e.n}`,terms:['Ao entrar','Enfraquecer'],tgt:'any'},
 entra_comprar:{txt:e=>`Ao entrar: Comprar ${e.n}`,terms:['Ao entrar','Comprar']},
 regenerar:{txt:e=>`Regenerar ${e.n}`,terms:['Regenerar']},
 indestrutivel:{txt:()=>'Indestrutível',terms:['Indestrutível']},
 guardiao:{txt:()=>'Guardião',terms:['Guardião']},
 furia:{txt:()=>'Fúria',terms:['Fúria']},
 imortal:{txt:()=>'Imortal',terms:['Imortal']},
 blindado:{txt:()=>'Blindado',terms:['Blindado']},
 corrosivo:{txt:e=>`Corrosivo ${e.n}`,terms:['Corrosivo']},
 incendiar:{txt:e=>`Ao atacar: Incendiar ${e.n}`,terms:['Ao atacar','Incendiar']},
 fim:{txt:()=>'Fim da Contenção',terms:['Fim da Contenção']},
 dim_bolso:{txt:()=>'Dimensão de Bolso',terms:[],tgt:'all'},tres_irmaos:{txt:()=>'Maldição dos Três Irmãos',terms:[]},alerta_nuclear:{txt:()=>'Alerta Nuclear',terms:[]},grafite:{txt:()=>'Atração do Grafite',terms:[]},colapso:{txt:()=>'Colapso de Realidade',terms:[]}};
Object.assign(KW,KWNEW);
// validação: toda palavra-chave existe e as numéricas têm X inteiro >= 0
for(const k in DEFS)for(const e of DEFS[k].kw||[]){if(!KW[e.k])throw new Error('palavra-chave desconhecida '+e.k+' em '+k);if(KWNEW[e.k]&&e.k!=='silenciar'&&!(Number.isInteger(e.n)&&e.n>=0))throw new Error('X inválido '+e.k+' em '+k)}
// texto da carta: nome da habilidade (sem número) + resumo com os valores reais desta carta
const KWD={
 provocar:['Provocar',()=>'Os inimigos precisam atacar esta carta primeiro.'],
 investida:['Investida',()=>'Pode atacar no turno em que entra.'],
 escudo:['Escudo Divino',()=>'O primeiro dano que receberia é anulado.'],
 venenoso:['Venenoso',()=>'Destrói qualquer carta que ferir em combate.'],
 furia_vento:['Fúria dos Ventos',()=>'Pode atacar duas vezes por turno.'],
 entra_cura_todos:['Grito de Guerra',n=>`Ao entrar, cura ${n} de Vida de todos os seus aliados.`],
 us_dano:['Último Suspiro',n=>`Ao ser destruída, causa ${n} de dano a todos os inimigos, inclusive ao Diretor.`],
 imortal:['Imortal',()=>'Na primeira vez que seria destruída, sobrevive com 1 de Vida.'],
 regeneracao:['Regeneração',n=>`No fim do seu turno, recupera ${n} de Vida.`],
 protecao:['Proteção',n=>`Recebe ${n} de dano a menos de cada ataque ou efeito.`],
 cura:['Cura',n=>`Ao entrar, recupera ${n} de Vida do aliado mais ferido.`],
 reforco:['Reforço',n=>`Ao entrar, o aliado mais forte ganha +${n} de Vida e +${n} de Vida máxima.`],
 veneno:['Veneno',n=>`Ao ferir um inimigo em combate, aplica ${n} de Veneno: ele perde 1 de Vida por Veneno a cada turno dele.`],
 enfraquecer:['Enfraquecer',n=>`Ao entrar, um inimigo perde ${n} de Ataque até o seu próximo turno.`],
 drenar:['Drenar',n=>`Ao causar dano em combate, recupera ${n} de Vida.`],
 silenciar:['Silenciar',()=>`Ao entrar, um inimigo perde as habilidades até o seu próximo turno.`],
 furia_x:['Fúria',n=>`Com metade da Vida ou menos, ganha +${n} de Ataque.`],
 devastar:['Devastar',n=>`Ao atacar, causa ${n} de dano aos inimigos nas colunas ao lado do alvo.`],
 retaliacao:['Retaliação',n=>`Ao sobreviver a um ataque, causa ${n} de dano ao atacante.`],
 execucao:['Execução',n=>`Causa +${n} de dano em inimigos já feridos.`],
 entra_banir:['Corrosão Dimensional',n=>`Ao entrar, manda um inimigo à frente ou ao lado para o Bolso por ${n} turnos seus; depois ele volta.`],
 incendiar:['Chamas Persistentes',n=>`Ao atacar, causa ${n} de dano a todas as outras cartas inimigas.`],
 fim:['Fim da Contenção',()=>`Você vence a partida na hora. Só pode ser usada uma vez por Operação.`],
 dim_bolso:['Dimensão de Bolso',n=>`Ao entrar, escolha 1 carta em campo: ela vai para a Dimensão de Bolso por ${n} turnos.`],
 tres_irmaos:['Maldição dos Três Irmãos',n=>`A cada ${n} turnos em campo, destrói 1 carta inimiga e 1 aliada aleatórias.`],
 alerta_nuclear:['Alerta Nuclear',n=>`Após 2 turnos em campo, causa ${n} de dano a todas as cartas inimigas.`],
 grafite:['Atração do Grafite',()=>`No fim de cada turno seu, marca 1 carta inimiga: ela não pode atacar no turno seguinte e, se ainda estiver em campo depois, é destruída.`],
 colapso:['Colapso de Realidade',()=>`Após 3 turnos em campo, todas as cartas inimigas são destruídas.`]};
const breachDesc=b=>({n:'Ruptura',t:`Numa ruptura de contenção, causa ${b.dmg} de dano a você e fica um turno sem atacar.`});
// texto pronto de cada carta (compatível com a interface: d.ability.name / d.ability.text)
for(const k in DEFS){const d=DEFS[k];if(!d.kw){d.ability=null;continue}
 d.desc=d.kw.map(e=>KWD[e.k]?{n:KWD[e.k][0],t:KWD[e.k][1](e.n)}:{n:KW[e.k].txt(e),t:''});if(d.breach)d.breachDesc=breachDesc(d.breach);d.exclusive=d.kw.some(e=>EXCLUSIVE[e.k]);
 d.lines=d.desc.map(x=>x.t?x.n+': '+x.t:x.n);d.short=d.desc.map(x=>x.n);d.terms=d.desc.map(x=>x.n);
 d.ability={id:d.kw[0].k,name:d.short.join(' · '),text:d.desc.map(x=>x.t).join(' ')}}
// raridade = cor da moldura da arte (c comum/prata, u incomum/violeta, r rara/verde, e épica/vermelha, l lendária/dourada)
const RARITY={'007':'c','074':'c','049':'c','682':'c','096':'c','075':'c','082':'c','008':'c','3008':'u','119':'u','072':'u','127':'r','043':'r','088':'r','138':'r','054':'r','106':'e','060':'e','158':'l','001':'l','1440':'e','1178':'e','1155':'e','3812':'e'};
for(const k in RARITY)DEFS[k].rar=RARITY[k];
const COLLECTIBLE=Object.keys(DEFS).filter(k=>!DEFS[k].token&&!DEFS[k].special);
const kwE=(def,id)=>((DEFS[def]&&DEFS[def].kw)||[]).find(e=>e.k===id);
const tgtKw=def=>((DEFS[def]&&DEFS[def].kw)||[]).find(e=>KW[e.k].tgt);
const TARGETED={};for(const k in DEFS)if(tgtKw(k))TARGETED[k]=1;
const DECK_TEST=['127','127','127','007','007','106','106','074','074','043','043','049','049','049','682','682','3008','3008','096','096'];
const COPYABLE=['inicio_invoca','regenerar','inicio_cura','abate_atk'];
const abil=d=>{const k=(DEFS[d].kw||[]).map(e=>e.k);return k.find(x=>COPYABLE.includes(x))||k[0]||null};
const silenced=u=>!!(u&&u.statuses&&u.statuses.some(s=>s.type==='silence'));
const hasAb=(u,id)=>!silenced(u)&&(!!kwE(u.def,id)||u.copied===id);
const kwN=(u,id,d)=>{const e=kwE(u.def,id)||(u.copied===id?u.copiedE:null);return e&&e.n!=null?e.n:d};
const kwF=(u,id)=>{const e=kwE(u.def,id)||(u.copied===id?u.copiedE:null);return e&&e.f};
const other=s=>s==='p'?'e':'p';

/* ---------- aleatoriedade determinística (semente) ---------- */
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(arr,rnd){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

/* ---------- criação ---------- */
function mkSide(){return{hp:RULES.HP,pc:0,pcMax:0,rr:0,deck:[],hand:[],discard:[],field:Array(RULES.SLOTS).fill(null),pocket:[],emUsed:false,turns:0,emptyDraws:0,fatigue:0}}
function create(opts){opts=opts||{};
 const S={seed:opts.seed==null?1:opts.seed,uid:0,turn:0,active:null,phase:'init',winner:null,breaching:false,log:[],evBuf:null,
  scp001:{available:!!opts.scp001Available,manifested:false,used:false,force:!!opts.scp001Force},
  sides:{p:mkSide(),e:mkSide()},first:opts.first||'p',profiles:Object.assign({p:'player',e:'aggressive'},opts.profiles||{})};
 const rnd=mulberry(S.seed),decks=Object.assign({p:DECK_TEST,e:DECK_TEST},opts.decks||{});
 for(const s of['p','e']){S.sides[s].deck=shuffle(decks[s],rnd).map(d=>({uid:++S.uid,def:d}))}
 S.hpBonus=opts.hpBonus||null;for(const k of['p','e'])if(opts.scry&&opts.scry[k])S.sides[k].scry=true;for(const k of['p','e'])if(S.hpBonus&&S.hpBonus[k])S.sides[k].hp+=S.hpBonus[k];S.rnd=rnd;S.rnd001=mulberry((S.seed^0x5c001)>>>0);return S}
function start(S){S.evBuf=[];const sec=other(S.first);for(const s of['p','e'])for(let i=0;i<RULES.START_HAND+(s===sec?RULES.SECOND_EXTRA_CARDS:0);i++){const c=S.sides[s].deck.shift();if(c){S.sides[s].hand.push(c)}}
 S.sides[sec].hp+=RULES.SECOND_HP;
 emit(S,'MATCH_STARTED',{first:S.first});beginTurn(S,S.first);return flush(S)}

/* ---------- eventos / snapshots ---------- */
function snap(S){const cp=u=>u&&{uid:u.uid,def:u.def,atk:atkOf(u),batk:u.atk,hp:u.hp,maxHp:u.maxHp,sick:u.sick,owner:u.owner,statuses:u.statuses.map(x=>Object.assign({},x)),bonus:Object.assign({},u.bonus),copied:u.copied||null,infected:!!u.infected,undyingUsed:!!u.undyingUsed,attacked:!!u.attacked,shield:!!u.shield,age:u.age||0};
 const sd=s=>{const x=S.sides[s];return{hp:x.hp,pc:x.pc,pcMax:x.pcMax,rr:x.rr,hand:x.hand.map(c=>({uid:c.uid,def:c.def})),deckN:x.deck.length,discardN:x.discard.length,
  field:x.field.map(cp),pocket:x.pocket.map(p=>({unit:cp(p.unit),by:p.by,ticks:p.ticks,slot:p.slot})),emUsed:x.emUsed,fatigue:x.fatigue,turns:x.turns}};
 return{turn:S.turn,active:S.active,phase:S.phase,winner:S.winner,scry:S.scryOffer?S.scryOffer.cards.map(c=>({uid:c.uid,def:c.def})):null,sides:{p:sd('p'),e:sd('e')}}}
function emit(S,type,data){const ev=Object.assign({type,turn:S.turn},data||{});if(!S.fast)ev.snap=snap(S);(S.evBuf||(S.evBuf=[])).push(ev);if(!S.fast)S.log.push({type:ev.type,turn:ev.turn,side:ev.side,uid:ev.uid,amount:ev.amount});return ev}
function flush(S){const b=S.evBuf||[];S.evBuf=[];return b}

/* ---------- utilidades ---------- */
const unitsOf=(S,s)=>S.sides[s].field.filter(Boolean);
function findUnit(S,uid){for(const s of['p','e']){const i=S.sides[s].field.findIndex(u=>u&&u.uid===uid);if(i>=0)return{unit:S.sides[s].field[i],side:s,slot:i}}return null}
function mkUnit(S,card,owner){const d=DEFS[card.def];return{uid:card.uid,def:card.def,atk:d.atk,hp:d.hp,maxHp:d.hp,sick:true,owner,statuses:[],bonus:{},age:0,attacked:false,shield:!!kwE(card.def,'escudo')}}
const isBlocked=(S,u)=>{const t=S.sides[u.owner].turns;return u.statuses.some(s=>(s.type==='uncontrolled'&&t>=s.fromTurn&&t<=s.toTurn)||(s.type==='graffiti'&&s.hold))};

// ataque efetivo: Enfraquecer (temporário) e Fúria X (com metade da Vida ou menos)
function atkOf(u){let a=u.atk;for(const s of u.statuses)if(s.type==='weak')a-=s.n;if(hasAb(u,'furia_x')&&u.hp*2<=u.maxHp)a+=kwN(u,'furia_x',0);return Math.max(0,a)}
/* ---------- vida do jogador / destruição ---------- */
function damagePlayer(S,side,n,reason){if(S.winner||n<=0)return;const sd=S.sides[side];sd.hp=Math.max(0,sd.hp-n);emit(S,'PLAYER_DAMAGED',{side,amount:n,hp:sd.hp,reason});if(sd.hp===0)finish(S,other(side))}
function finish(S,winner){if(S.winner)return;S.winner=winner;S.phase='over';emit(S,'MATCH_FINISHED',{winner})}
function destroyUnit(S,u){const sd=S.sides[u.owner],i=sd.field.indexOf(u);if(i<0)return;sd.field[i]=null;if(!DEFS[u.def].token&&!u.infected)sd.discard.push({uid:u.uid,def:u.def});emit(S,'UNIT_DESTROYED',{uid:u.uid,def:u.def,side:u.owner,slot:i});purgeSilence(S,u.uid)
 if(hasAb(u,'us_dano')&&!S.winner){const n=kwN(u,'us_dano',1),f=other(u.owner);emit(S,'ABILITY',{side:u.owner,uid:u.uid,name:'Último Suspiro'});
  for(const x of S.sides[f].field.slice())if(x&&S.sides[f].field.includes(x))damageUnit(S,x,n,'deathrattle');damagePlayer(S,f,n,'deathrattle')}}
// silêncio: 158 dura enquanto ele estiver em campo e ativo; 072 dura até o início do próximo turno de quem jogou
function purgeSilence(S,src){for(const s of['p','e'])for(const x of S.sides[s].field){if(!x)continue;const n=x.statuses.length;x.statuses=x.statuses.filter(t=>!(t.type==='silence'&&t.src===src&&!t.round));
 if(x.statuses.length!==n&&!silenced(x))emit(S,'STATUS_REMOVED',{side:x.owner,uid:x.uid,status:'silence'})}}
function applySilence(S,u,src,by,round){const was=silenced(u);u.shield=false;u.statuses=u.statuses.filter(t=>t.type!=='fury');u.statuses.push({type:'silence',src,by,round:!!round});if(u.copied){u.copied=null}
 emit(S,'STATUS_APPLIED',{side:u.owner,uid:u.uid,status:'silence',round:!!round});if(!was&&kwE(u.def,'entra_silenciar_aura'))purgeSilence(S,u.uid)}

const storeActive=(S,side,except)=>S.sides[side].field.some(x=>x&&x!==except&&hasAb(x,'guardiao'));
function guardOf(S,u){if(u.hp>0)return null;if(hasAb(u,'indestrutivel')&&u.lastReason!=='combat')return 'regen';
 if(storeActive(S,u.owner,u))return 'store';
 if(hasAb(u,'imortal')&&!u.undyingUsed){u.undyingUsed=true;return 'undying'}return null}
function checkDeath(S,u){const g=guardOf(S,u);if(g){u.hp=1;emit(S,'UNIT_PROTECTED',{uid:u.uid,side:u.owner,by:g});return false}
 if(u.hp<=0){destroyUnit(S,u);return true}return false}
function damageUnit(S,u,n,reason){if(u.shield&&n>0&&!silenced(u)){u.shield=false;u.lastDmg=0;emit(S,'SHIELD_BROKEN',{uid:u.uid,side:u.owner});return false}
 let half=false;if(hasAb(u,'blindado')&&n>0){n=Math.floor(n/2);half=true}
 if(hasAb(u,'protecao')&&n>0){const p=kwN(u,'protecao',0);if(p){n=Math.max(0,n-p);half=true}}u.lastDmg=n;
 u.lastReason=reason;u.hp-=n;emit(S,'UNIT_DAMAGED',{uid:u.uid,side:u.owner,amount:n,hp:Math.max(0,u.hp),reason,half});
 return checkDeath(S,u)}
// perda permanente de atributos (SCP-119 / SCP-075): não é dano, mas pode destruir
function weaken(S,u,dAtk,dMax,dHp,reason){const a0=u.atk,m0=u.maxHp,h0=u.hp;u.atk=Math.max(0,u.atk-dAtk);u.maxHp=Math.max(1,u.maxHp-dMax);u.hp=Math.min(u.maxHp,u.hp-dHp);
 u.lastReason=reason;emit(S,'UNIT_WEAKENED',{uid:u.uid,side:u.owner,atk:u.atk,hp:Math.max(0,u.hp),maxHp:u.maxHp,dAtk:u.atk-a0,dMax:u.maxHp-m0,dHp:Math.max(0,u.hp)-h0,reason});
 if(u.hp<=0)return checkDeath(S,u);return false}
function createToken(S,side,src,reason,def,infected){def=def||'T074';const sd=S.sides[side],slot=sd.field.findIndex(x=>!x);const free=sd.field.filter(x=>!x).length,summ=sd.field.filter(x=>x&&(DEFS[x.def].token||x.infected)).length;
 if(slot<0||(RULES.TOKEN_KEEP_FREE&&free<2)||(RULES.TOKEN_CAP&&summ>=RULES.TOKEN_CAP)){emit(S,'TOKEN_FAILED',{side,src});return null}
 const d=DEFS[def],st=infected?1:d.atk,hp=infected?1:d.hp,u={uid:++S.uid,def,atk:st,hp,maxHp:hp,sick:true,owner:side,statuses:[],bonus:{}};if(infected)u.infected=true;
 sd.field[slot]=u;emit(S,'TOKEN_CREATED',{side,uid:u.uid,def,slot,src,reason,infected:!!infected});return u}
// Drenar: cura a si mesma ao causar dano de combate
function drain(S,u){if(!hasAb(u,'drenar')||u.hp>=u.maxHp)return;const h0=u.hp;u.hp=Math.min(u.maxHp,u.hp+kwN(u,'drenar',0));if(u.hp!==h0)emit(S,'UNIT_BUFFED',{uid:u.uid,side:u.owner,hp:u.hp,heal:u.hp-h0,reason:'drain'})}
// depois de um golpe de combate que causou dano: Drenar, Veneno, Retaliação (dano de Retaliação não é de combate: sem recursão)
function afterHit(S,u,t,died,me,foe){if(S.winner)return;drain(S,u);
 if(!died&&foe.field.includes(t)&&hasAb(u,'venenoso')){emit(S,'ABILITY',{side:u.owner,uid:u.uid,name:'Venenoso',target:t.uid});t.hp=0;t.lastReason='poisonous';if(checkDeath(S,t))return}
 if(!died&&foe.field.includes(t)&&hasAb(u,'veneno')){const n=kwN(u,'veneno',0),st=t.statuses.find(x=>x.type==='poison');const v=Math.min(RULES.POISON_CAP,(st?st.n:0)+n);
  if(st)st.n=v;else t.statuses.push({type:'poison',n:v});emit(S,'STATUS_APPLIED',{side:t.owner,uid:t.uid,status:'poison',n:v})}
 if(!died&&foe.field.includes(t)&&me.field.includes(u)&&hasAb(t,'retaliacao')){const r=kwN(t,'retaliacao',0);if(r){emit(S,'ABILITY',{side:t.owner,uid:t.uid,name:'Retaliação '+r,target:u.uid});damageUnit(S,u,r,'retaliate')}}}
// efeitos de "ao destruir um inimigo" (combate)
function onKill(S,u,victim){
 if(hasAb(u,'abate_atk')){const n=kwN(u,'abate_atk',1);u.atk+=n;emit(S,'UNIT_BUFFED',{uid:u.uid,side:u.owner,atk:u.atk,dAtk:n,reason:'assimilation'})}
 if(hasAb(u,'abate_cura')&&u.hp<u.maxHp){const h0=u.hp;u.hp=Math.min(u.maxHp,u.hp+kwN(u,'abate_cura',3));emit(S,'UNIT_BUFFED',{uid:u.uid,side:u.owner,hp:u.hp,heal:u.hp-h0,reason:'feast'})}
 if(hasAb(u,'abate_invoca'))createToken(S,u.owner,u.uid,'reptile',kwF(u,'abate_invoca')||'T088');
 if(hasAb(u,'contagio'))createToken(S,u.owner,u.uid,'contagion',victim.def,true)}
function pestTargets(S,side){return S.sides[other(side)].field.filter(Boolean).map(u=>u.uid)}
function autoPest(S,side){return S.sides[other(side)].field.map((u,i)=>u&&{u,i}).filter(Boolean).sort((a,b)=>a.u.hp-b.u.hp||a.i-b.i).slice(0,2).map(x=>x.u.uid)}
function plagueHit(S,side,uids){const n=unitsOf(S,side).length;for(const id of uids){const f=findUnit(S,id);if(f&&f.side!==side)damageUnit(S,f.unit,n,'plague')}}

/* ---------- risco / ruptura ---------- */
function addRisk(S,side,n){const sd=S.sides[side],from=sd.rr;sd.rr=Math.max(0,Math.min(RULES.RR_MAX,sd.rr+n));if(sd.rr!==from)emit(S,'RISK_CHANGED',{side,from,to:sd.rr,delta:sd.rr-from});
 if(sd.rr>=RULES.RR_MAX&&n>0&&!S.breaching)breach(S,side)}
function pickBreachUnit(S,side){let best=null,bi=-1;S.sides[side].field.forEach((u,i)=>{if(!u||!DEFS[u.def].breach)return;
  if(!best||DEFS[u.def].risk>DEFS[best.def].risk){best=u;bi=i}});return best} // empate: mais à esquerda (iteração em ordem)
function breach(S,side){S.breaching=true;const sd=S.sides[side],u=pickBreachUnit(S,side);
 emit(S,'BREACH_TRIGGERED',{side,uid:u?u.uid:null,def:u?u.def:null,effect:u?DEFS[u.def].breach.id:'generic'});
 if(u){ // Caçada Descontrolada
  damagePlayer(S,side,DEFS[u.def].breach.dmg||RULES.HUNT_DAMAGE,'breach');
  const st={type:'uncontrolled',fromTurn:sd.turns+1,toTurn:sd.turns+1,src:'breach'};u.statuses.push(st);emit(S,'STATUS_APPLIED',{side,uid:u.uid,status:'uncontrolled'})}
 else{sd.pc=Math.max(0,sd.pc-RULES.BREACH_GENERIC_PC);emit(S,'BREACH_GENERIC',{side,pc:sd.pc})}
 const from=sd.rr;sd.rr=RULES.RR_AFTER_BREACH;emit(S,'RISK_CHANGED',{side,from,to:sd.rr,delta:sd.rr-from,reason:'breach'});S.breaching=false}

function setFury(S,u){if(u.statuses.some(s=>s.type==='fury'))return;u.statuses.push({type:'fury',src:'096'});emit(S,'STATUS_APPLIED',{side:u.owner,uid:u.uid,status:'fury'})}
function attackTarget(S,u,i){const foe=S.sides[other(u.owner)].field;
 if(u.statuses.some(s=>s.type==='fury')){let b=null,bd=9;foe.forEach((x,j)=>{if(x&&Math.abs(j-i)<bd){bd=Math.abs(j-i);b=x}});return b}
 return foe[i]}
// prévia do combate: simula a fase de ataque sem mudar o estado (mesmas regras do endTurn)
function previewCombat(S,side){const me=S.sides[side],foe=S.sides[other(side)],hp=new Map(),und=new Set(),out=[];let face=0;
 foe.field.forEach(u=>{if(u)hp.set(u,u.hp)});
 const alive=u=>u&&hp.get(u)>0,store=t=>foe.field.some(x=>x&&x!==t&&hasAb(x,'guardiao')&&alive(x));
 const hit=(t,n,combat)=>{if(hasAb(t,'blindado'))n=Math.floor(n/2);if(hasAb(t,'protecao'))n=Math.max(0,n-kwN(t,'protecao',0));let h=hp.get(t)-n,prot=false;
  if(h<=0&&!combat&&hasAb(t,'indestrutivel')){h=1;prot=true}else if(h<=0&&store(t)){h=1;prot=true}else if(h<=0&&hasAb(t,'imortal')&&!t.undyingUsed&&!und.has(t)){und.add(t);h=1;prot=true}
  hp.set(t,h);return{dmg:n,kills:h<=0,prot}};
 for(let i=0;i<RULES.SLOTS;i++){const u=me.field[i];if(!u||u.sick||isBlocked(S,u))continue;
  let t;if(u.statuses.some(s=>s.type==='fury')&&!silenced(u)){let bd=9;foe.field.forEach((x,j)=>{if(alive(x)&&Math.abs(j-i)<bd){bd=Math.abs(j-i);t=x}})}else t=alive(foe.field[i])?foe.field[i]:null;
  const A=atkOf(u),tsl=t?foe.field.indexOf(t):i;
  if(!t){face+=A;out.push({slot:i,target:null,tslot:i,dmg:A})}
  else{const ex=hasAb(u,'execucao')&&hp.get(t)<t.maxHp?kwN(u,'execucao',0):0;const r=hit(t,A+ex,true);out.push(Object.assign({slot:i,target:t.uid,tslot:tsl},r))}
  if(hasAb(u,'devastar')){const dv=kwN(u,'devastar',0);[tsl-1,tsl+1].forEach(j=>{const x=foe.field[j];if(dv&&alive(x)){const r=hit(x,dv,false);out.push(Object.assign({slot:i,target:x.uid,tslot:j,splash:true},r))}})}
  if(hasAb(u,'incendiar'))foe.field.forEach((x,j)=>{if(x&&x!==t&&alive(x)){const r=hit(x,kwN(u,'incendiar',1),false);out.push(Object.assign({slot:i,target:x.uid,tslot:j,splash:true},r))}})}
 return{attacks:out,face}}
/* ---------- bolso ---------- */
function sendToPocket(S,u,by){const sd=S.sides[u.owner],i=sd.field.indexOf(u);if(i<0)return;sd.field[i]=null;purgeSilence(S,u.uid);u.statuses=u.statuses.filter(t=>t.type!=='silence');
 sd.pocket.push({unit:u,by,ticks:RULES.POCKET_TURNS,slot:i});emit(S,'UNIT_SENT_TO_POCKET',{uid:u.uid,def:u.def,side:u.owner,slot:i,by})}
function tickPocket(S,side){for(const s of['p','e']){const sd=S.sides[s];for(const p of sd.pocket.slice()){if(p.by!==side)continue;if(p.ticks>0)p.ticks--;
  if(p.ticks>0)continue;let slot=sd.field[p.slot]?sd.field.findIndex(x=>!x):p.slot;if(slot<0)continue; // sem espaço: espera o próximo início de turno
  sd.pocket.splice(sd.pocket.indexOf(p),1);p.unit.sick=false;sd.field[slot]=p.unit;emit(S,'UNIT_RETURNED_FROM_POCKET',{uid:p.unit.uid,def:p.unit.def,side:s,slot})}}}
function targetsFor(S,side,def,slot){const tk=tgtKw(def);if(!tk)return[];if(KW[tk.k].tgt==='adj')return corrosionTargets(S,side,slot);if(KW[tk.k].tgt==='all')return['p','e'].flatMap(s=>S.sides[s].field.filter(Boolean).map(u=>u.uid));if(TARGETED[def])return S.sides[other(side)].field.filter(Boolean).map(u=>u.uid);return[]}
const ONGOING=['regeneracao','protecao','veneno','drenar','furia_x','devastar','retaliacao','execucao','abate_atk','inicio_cura','inicio_invoca','compra_invoca','copiar','regenerar','indestrutivel','guardiao','furia','abate_invoca','imortal','corrosivo','abate_cura','blindado','incendiar','contagio'];
function targetValue(S,side,def,uid){const t=findUnit(S,uid).unit;
 const tk=(tgtKw(def)||{}).k;
 if(tk==='enfraquecer')return Math.min(atkOf(t),(tgtKw(def)||{}).n||0)*3+(foe_faces(S,side,t)?2:0)+t.hp*.1;
 if(tk==='entra_banir')return t.atk*2+t.hp;
 if(tk==='dim_bolso')return (t.owner===side?-1:1)*(atkOf(t)*2+t.hp);
 if(tk==='entra_enfraquecer')return (t.hp<=2&&!(hasAb(t,'indestrutivel'))?20+t.atk*2+t.hp:0)+Math.min(2,t.atk)*2+(t.hp<=2?0:1);
 const ks=(DEFS[t.def].kw||[]).map(e=>e.k),on=!silenced(t)&&(ks.some(k=>ONGOING.includes(k))||ONGOING.includes(t.copied));return (on?10:0)+(ks.some(k=>k==='regenerar'||k==='regeneracao'||k==='guardiao'||k==='furia'||k==='retaliacao'||k==='protecao')?6:0)+t.atk+t.hp*.3+(tk==='entra_silenciar'&&ks.includes('blindado')?3:0)}
function foe_faces(S,side,t){const i=S.sides[other(side)].field.indexOf(t);return !S.sides[side].field[i]}
function autoTarget(S,side,def,slot){const ts=targetsFor(S,side,def,slot);if(!ts.length)return null;let b=ts[0],bv=-1e9;for(const id of ts){const v=targetValue(S,side,def,id);if(v>bv){bv=v;b=id}}return b}
function corrosionTargets(S,side,slot){const foe=S.sides[other(side)].field,out=[];for(let i=Math.max(0,slot-1);i<=Math.min(RULES.SLOTS-1,slot+1);i++)if(foe[i])out.push(foe[i].uid);return out}

/* ---------- início de turno (Fase A) ---------- */
function beginTurn(S,side){S.turn++;S.active=side;const sd=S.sides[side];sd.turns++;
 sd.pcMax=Math.min(RULES.PC_CAP,RULES.PC_START-1+sd.turns);sd.pc=sd.pcMax;sd.emUsed=false;
 if(sd.turns===1){const b=side===S.first?RULES.FIRST_FIRST_PC:RULES.SECOND_FIRST_PC;if(b){sd.pc=Math.max(0,sd.pc+b);if(b>0)emit(S,'BONUS_PC',{side,amount:b})}}
 emit(S,'TURN_STARTED',{side,pcMax:sd.pcMax});
 for(const o of['p','e'])for(const x of S.sides[o].field){if(!x)continue;const n=x.statuses.length;x.statuses=x.statuses.filter(t=>!(t.type==='silence'&&t.round&&t.by===side));if(x.statuses.length!==n&&!silenced(x))emit(S,'STATUS_REMOVED',{side:o,uid:x.uid,status:'silence'})}
 for(const o of['p','e'])for(const x of S.sides[o].field){if(!x)continue;const n=x.statuses.length;x.statuses=x.statuses.filter(t=>!(t.type==='weak'&&t.by===side));if(x.statuses.length!==n)emit(S,'STATUS_REMOVED',{side:o,uid:x.uid,status:'weak'})}
 sd.field.forEach(u=>{if(u){u.sick=false;u.attacked=false;u.atkCount=0;u.age=(u.age||0)+1}});
 for(const o of['p','e'])for(const x of S.sides[o].field)if(x&&o!==side)x.statuses.forEach(st=>{if(st.type==='graffiti'&&st.by!==side)st.hold=false});
 keterStart(S,side);if(S.winner)return;
 tickPocket(S,side);
 // Veneno: 1 de dano por acúmulo no início do turno do dono, depois perde 1
 for(const u of sd.field.slice()){if(!u)continue;const st=u.statuses.find(x=>x.type==='poison');if(!st)continue;const n=st.n;st.n--;if(st.n<=0)u.statuses=u.statuses.filter(x=>x!==st);
  damageUnit(S,u,n,'poison');if(S.winner)return}
 // Pestilência em andamento (estado aplicado pelo SCP-049 deste lado)
 for(const o of['p','e'])for(const u of S.sides[o].field.slice()){if(!u)continue;const st=u.statuses.find(x=>x.type==='plague'&&x.by===side);if(!st)continue;
  st.ticks--;u.statuses=u.statuses.filter(x=>!(x.type==='plague'&&x.ticks<=0));const n=unitsOf(S,side).length;damageUnit(S,u,n,'plague');if(S.winner)return}
 // Efeito de Composição (SCP-043): copia uma habilidade inimiga até o fim do turno
 for(let i=0;i<RULES.SLOTS;i++){const u=sd.field[i];if(!u||!kwE(u.def,'copiar')||silenced(u))continue;let best=null,bp=99;
  S.sides[other(side)].field.forEach(x=>{if(!x||silenced(x))return;const id=abil(x.def),p=COPYABLE.indexOf(id);if(p>=0&&p<bp){bp=p;best=x}});
  if(best){u.copied=abil(best.def);u.copiedE=kwE(best.def,u.copied);emit(S,'ABILITY_COPIED',{side,uid:u.uid,from:best.uid,ability:u.copied,name:KW[u.copied].txt(u.copiedE)})}}
 // efeitos de início de turno, da esquerda para a direita
 for(let i=0;i<RULES.SLOTS;i++){const u=sd.field[i];if(!u)continue;
  if(hasAb(u,'inicio_invoca'))createToken(S,side,u.uid,'turn',kwF(u,'inicio_invoca')||'T074');
  if(!hasAb(u,'inicio_cura'))continue;const hn=kwN(u,'inicio_cura',1);
  let t=null,tr=2;sd.field.forEach(x=>{if(x&&x!==u){const r=x.hp/x.maxHp;if(r<tr){tr=r;t=x}}});if(!t)continue;
  const b=t.bonus[u.uid]||0,h0=t.hp,m0=t.maxHp;if(b<RULES.MICRO_CAP){const g=Math.min(hn,RULES.MICRO_CAP-b);t.bonus[u.uid]=b+g;t.maxHp+=g}t.hp=Math.min(t.maxHp,t.hp+hn);
  if(t.hp!==h0||t.maxHp!==m0)emit(S,'UNIT_BUFFED',{uid:t.uid,side,hp:t.hp,maxHp:t.maxHp,dMax:t.maxHp-m0,heal:t.hp-h0,src:u.uid,reason:'microcosm'})}
 draw(S,side,S.turn===1,true);
 check001(S,side);
 // Colapso da Contenção: impede partidas infinitas quando mão e campo travam (sem fadiga)
 if(!S.winner&&sd.turns>=RULES.OVERTIME_TURN){const n=sd.turns-RULES.OVERTIME_TURN+1;emit(S,'OVERTIME',{side,amount:n});damagePlayer(S,side,n,'overtime')}
 if(!S.winner)S.phase=S.scryOffer?'scry':'plan'}
const handCount=sd=>sd.hand.filter(c=>c.def!=='001').length;
// SCP-001: uma única verificação de 1% no início de cada turno do jogador (só em combate)
function check001(S,side){const z=S.scp001;if(side!=='p'||!z.available||z.used||S.winner)return;if(S.sides.p.hand.some(c=>c.def==='001'))return;
 z.checks=(z.checks||0)+1;const roll=S.rnd001();emit(S,'SCP001_CHECK',{side,roll});if(!(z.force||roll<RULES.SCP001_CHANCE))return;
 const c={uid:++S.uid,def:'001',temp:true};S.sides.p.hand.push(c);z.manifested=true;emit(S,'SCP001_MANIFEST',{side,uid:c.uid})}
function use001(S,side,uid){if(S.winner)return{ok:false,reason:'MATCH_OVER'};if(S.active!==side||S.phase!=='plan')return{ok:false,reason:'NOT_ACTIVE'};
 const z=S.scp001,sd=S.sides[side],i=sd.hand.findIndex(c=>c.uid===uid&&c.def==='001');if(i<0)return{ok:false,reason:'NO_CARD'};if(z.used)return{ok:false,reason:'USED'};
 z.used=true;sd.hand.splice(i,1);emit(S,'SCP001_USED',{side,uid});finish(S,side);return{ok:true}}
function draw(S,side,skip,turnDraw){if(skip)return;const sd=S.sides[side];
 // Autorização de Arquivo: na compra do turno, escolhe entre as 2 cartas do topo
 if(turnDraw&&sd.scry&&sd.deck.length>=2&&handCount(sd)<RULES.HAND_MAX){S.scryOffer={side,cards:[sd.deck[0],sd.deck[1]]};
  emit(S,'SCRY_OFFER',{side,uids:[sd.deck[0].uid,sd.deck[1].uid],defs:[sd.deck[0].def,sd.deck[1].def]});return}
 if(handCount(sd)>=RULES.HAND_MAX){emit(S,'DRAW_BLOCKED',{side});return}
 if(!sd.deck.length){sd.emptyDraws++;if(sd.emptyDraws>RULES.FATIGUE_GRACE){sd.fatigue++;emit(S,'FATIGUE',{side,amount:sd.fatigue});damagePlayer(S,side,sd.fatigue,'fatigue')}else emit(S,'DRAW_EMPTY',{side,tries:sd.emptyDraws});return}
 const c=sd.deck.shift();sd.hand.push(c);emit(S,'CARD_DRAWN',{side,uid:c.uid,def:c.def});
 for(const u of S.sides[other(side)].field.slice())if(u&&hasAb(u,'compra_invoca'))createToken(S,other(side),u.uid,'draw',kwF(u,'compra_invoca')||'T074')}

/* ---------- Keter de habilidade única ---------- */
function rndPick(S,arr){return arr.length?arr[Math.floor(S.rnd()*arr.length)]:null}
function keterStart(S,side){const sd=S.sides[side],foe=S.sides[other(side)];
 // Atração do Grafite: quem foi marcado e continua em campo é destruído
 for(const x of foe.field.slice())if(x&&x.statuses.some(st=>st.type==='graffiti'&&st.by===side)){emit(S,'ABILITY',{side:x.owner,uid:x.uid,name:'Atração do Grafite'});destroyUnit(S,x)}
 for(const u of sd.field.slice()){if(!u||!sd.field.includes(u))continue;
  if(hasAb(u,'tres_irmaos')){const n=kwN(u,'tres_irmaos',2);if(u.age>0&&u.age%n===0){emit(S,'ABILITY',{side,uid:u.uid,name:'Maldição dos Três Irmãos'});
   const e=rndPick(S,foe.field.filter(Boolean));if(e)destroyUnit(S,e);const a=rndPick(S,sd.field.filter(x=>x&&x!==u));if(a)destroyUnit(S,a)}}
  if(hasAb(u,'alerta_nuclear')&&!u.fired&&u.age>=2){u.fired=true;emit(S,'ABILITY',{side,uid:u.uid,name:'Alerta Nuclear'});const n=kwN(u,'alerta_nuclear',3);for(const x of foe.field.slice())if(x)damageUnit(S,x,n,'blaze')}
  if(hasAb(u,'colapso')&&!u.fired&&u.age>=3){u.fired=true;emit(S,'ABILITY',{side,uid:u.uid,name:'Colapso de Realidade'});for(const x of foe.field.slice())if(x)destroyUnit(S,x)}}}
function grafiteEnd(S,side){const sd=S.sides[side],foe=S.sides[other(side)];
 for(const u of sd.field){if(!u||!hasAb(u,'grafite'))continue;let t=null;
  for(const x of foe.field)if(x&&!x.statuses.some(st=>st.type==='graffiti')&&(!t||atkOf(x)*2+x.hp>atkOf(t)*2+t.hp))t=x;
  if(t){t.statuses.push({type:'graffiti',by:side,hold:true});emit(S,'ABILITY',{side,uid:u.uid,name:'Atração do Grafite',target:t.uid});emit(S,'STATUS_APPLIED',{side:t.owner,uid:t.uid,status:'graffiti'})}}}
/* ---------- ataque escolhido pelo jogador (estilo Hearthstone) ---------- */
const taunts=(S,side)=>S.sides[other(side)].field.filter(x=>x&&hasAb(x,'provocar'));
const canFace=(S,side,uid)=>{const f=findUnit(S,uid);return!!f&&!S.sides[other(side)].field[f.slot]&&!taunts(S,side).length};
// alvos válidos de um ataque: com Provocar no campo inimigo, só elas
function attackOptions(S,side,uid){const tt=taunts(S,side),units=(tt.length?tt:S.sides[other(side)].field.filter(Boolean)).map(x=>x.uid);return{units,face:canFace(S,side,uid)}}
function canAttack(S,side,uid){if(S.winner)return{ok:false,reason:'MATCH_OVER'};if(S.active!==side||S.phase!=='plan')return{ok:false,reason:'NOT_ACTIVE'};
 const f=findUnit(S,uid);if(!f||f.side!==side)return{ok:false,reason:'NO_UNIT'};const u=f.unit;
 if(u.sick)return{ok:false,reason:'SICK'};if(u.attacked)return{ok:false,reason:'USED'};if(atkOf(u)<=0)return{ok:false,reason:'NO_ATK'};if(isBlocked(S,u))return{ok:false,reason:'BLOCKED'};return{ok:true}}
function attack(S,side,uid,target){const v=canAttack(S,side,uid);if(!v.ok)return v;const me=S.sides[side],foe=S.sides[other(side)],u=findUnit(S,uid).unit,i=me.field.indexOf(u);
 let t=null;if(target!=='face'&&target!=null){const tf=findUnit(S,target);if(!tf||tf.side===side)return{ok:false,reason:'BAD_TARGET'};t=tf.unit}
 else if(foe.field[i])return{ok:false,reason:'FACE_BLOCKED'};
 {const tt=taunts(S,side);if(tt.length&&!tt.includes(t))return{ok:false,reason:'TAUNT'}}   // PV só com a coluna da frente vazia
 u.atkCount=(u.atkCount||0)+1;u.attacked=!(hasAb(u,'furia_vento')&&u.atkCount<2);if(u.statuses.some(s=>s.type==='fury')){u.statuses=u.statuses.filter(s=>s.type!=='fury');emit(S,'FURY_END',{side,uid:u.uid})}
 if(!t){emit(S,'ATTACK',{side,slot:i,uid:u.uid,target:null,tslot:i});const a=atkOf(u);damagePlayer(S,other(side),a,'attack');if(a>0&&!S.winner)drain(S,u);
  // Devastar (nas colunas ao lado da sua) e Incendiar também valem no ataque direto
  if(!S.winner&&hasAb(u,'devastar')){const dv=kwN(u,'devastar',0),adj=[i-1,i+1].map(k=>foe.field[k]).filter(Boolean);if(dv&&adj.length){emit(S,'ABILITY',{side,uid:u.uid,name:'Devastar '+dv});for(const x of adj)if(foe.field.includes(x))damageUnit(S,x,dv,'devastate')}}
  if(!S.winner&&hasAb(u,'incendiar')){const n=kwN(u,'incendiar',1);emit(S,'ABILITY',{side,uid:u.uid,name:'Ao atacar: Incendiar '+n});for(const x of foe.field.slice())if(x)damageUnit(S,x,n,'blaze')}
  return{ok:true}}
 const j=foe.field.indexOf(t);emit(S,'ATTACK',{side,slot:i,uid:u.uid,target:t.uid,tslot:j});
 const h0=t.hp,ex=hasAb(u,'execucao')&&t.hp<t.maxHp?kwN(u,'execucao',0):0,back=atkOf(t);if(ex)emit(S,'ABILITY',{side,uid:u.uid,name:'Execução '+ex,target:t.uid});
 const died=damageUnit(S,t,atkOf(u)+ex,'combat'),dealt=t.lastDmg||0;
 if(died)onKill(S,u,t);else if(hasAb(u,'corrosivo')&&t.hp<h0&&me.field.includes(u)&&foe.field.includes(t))weaken(S,t,0,kwN(u,'corrosivo',2),0,'caustic');
 if(dealt>0)afterHit(S,u,t,died,me,foe);
 // o defensor revida ao mesmo tempo
 if(RULES.COUNTER&&back>0&&me.field.includes(u)&&!S.winner){const d2=damageUnit(S,u,back,'combat');if(d2&&foe.field.includes(t))onKill(S,t,u)}
 if(!S.winner&&me.field.includes(u)&&hasAb(u,'devastar')){const dv=kwN(u,'devastar',0),adj=[j-1,j+1].map(k=>foe.field[k]).filter(Boolean);if(dv&&adj.length){emit(S,'ABILITY',{side,uid:u.uid,name:'Devastar '+dv});for(const x of adj)if(foe.field.includes(x))damageUnit(S,x,dv,'devastate')}}
 if(!S.winner&&me.field.includes(u)&&hasAb(u,'incendiar')){const n=kwN(u,'incendiar',1);emit(S,'ABILITY',{side,uid:u.uid,name:'Ao atacar: Incendiar '+n});for(const x of foe.field.slice())if(x&&x!==t)damageUnit(S,x,n,'blaze')}
 return{ok:true}}
/* ---------- validações ---------- */
function canPlay(S,side,uid,slot){if(S.winner)return{ok:false,reason:'MATCH_OVER'};if(S.active!==side)return{ok:false,reason:'NOT_ACTIVE'};if(S.phase!=='plan')return{ok:false,reason:'PHASE'};
 const sd=S.sides[side],c=sd.hand.find(x=>x.uid===uid);if(!c)return{ok:false,reason:'NO_CARD'};if(DEFS[c.def].special)return{ok:false,reason:'SPECIAL'};
 if(!Number.isInteger(slot)||slot<0||slot>=RULES.SLOTS)return{ok:false,reason:'SLOT_RANGE'};if(sd.field[slot])return{ok:false,reason:'SLOT_OCCUPIED'};
 if(sd.pc<DEFS[c.def].cost)return{ok:false,reason:'PC_LOW'};return{ok:true}}
function canProtocol(S,side){if(S.winner)return{ok:false,reason:'MATCH_OVER'};if(S.active!==side||S.phase!=='plan')return{ok:false,reason:'NOT_ACTIVE'};const sd=S.sides[side];
 if(sd.emUsed)return{ok:false,reason:'USED'};if(sd.pc<RULES.EM_COST)return{ok:false,reason:'PC_LOW'};if(sd.rr<=0)return{ok:false,reason:'RR_ZERO'};return{ok:true}}

/* ---------- ações ---------- */
function playCard(S,side,uid,slot,target,targets){const v=canPlay(S,side,uid,slot);if(!v.ok)return v;
 const sd=S.sides[side],ci=sd.hand.findIndex(x=>x.uid===uid),card=sd.hand[ci],d=DEFS[card.def];
 let tg=null;if(TARGETED[card.def]){const ts=targetsFor(S,side,card.def,slot);if(target!=null&&!ts.includes(target))return{ok:false,reason:'BAD_TARGET'};
  if(ts.length)tg=target!=null?target:autoTarget(S,side,card.def,slot)}
 let pt=null;if(kwE(card.def,'entra_peste')){const ok=pestTargets(S,side);if(targets!=null){if(!Array.isArray(targets)||targets.length>2||new Set(targets).size!==targets.length||!targets.every(t=>ok.includes(t)))return{ok:false,reason:'BAD_TARGET'};pt=targets}else pt=autoPest(S,side)}
 sd.hand.splice(ci,1);sd.pc-=d.cost;emit(S,'PC_SPENT',{side,amount:d.cost,pc:sd.pc});
 sd.field[slot]=mkUnit(S,card,side);emit(S,'CARD_PLAYED',{side,uid:card.uid,def:card.def,slot});
 const nu=sd.field[slot];if(kwE(card.def,'investida'))nu.sick=false;
 {const e=kwE(card.def,'entra_cura_todos');if(e){emit(S,'ABILITY',{side,uid:nu.uid,name:'Grito de Guerra: Curar '+e.n});
  for(const x of sd.field)if(x&&x!==nu&&x.hp<x.maxHp){const h0=x.hp;x.hp=Math.min(x.maxHp,x.hp+e.n);emit(S,'UNIT_BUFFED',{uid:x.uid,side,hp:x.hp,heal:x.hp-h0,src:nu.uid,reason:'heal'})}}}
 if(tg!=null){const f=findUnit(S,tg);if(f){
  const tk=tgtKw(card.def),nm=(KW[tk.k].sh||KW[tk.k].txt)(tk);
  if(tk.k==='entra_banir'||tk.k==='dim_bolso'){if(tk.k==='dim_bolso')emit(S,'ABILITY',{side,uid:nu.uid,name:'Dimensão de Bolso',target:tg});sendToPocket(S,f.unit,side,tk.n)}
  else if(tk.k==='entra_silenciar_aura'){emit(S,'ABILITY',{side,uid:nu.uid,name:nm,target:tg});applySilence(S,f.unit,nu.uid,side,false)}
  else if(tk.k==='entra_silenciar'){emit(S,'ABILITY',{side,uid:nu.uid,name:nm,target:tg});applySilence(S,f.unit,nu.uid,side,true)}
  else if(tk.k==='silenciar'){emit(S,'ABILITY',{side,uid:nu.uid,name:nm,target:tg});applySilence(S,f.unit,nu.uid,side,true)}
  else if(tk.k==='enfraquecer'){emit(S,'ABILITY',{side,uid:nu.uid,name:nm,target:tg});f.unit.statuses.push({type:'weak',n:tk.n,by:side});emit(S,'STATUS_APPLIED',{side:f.side,uid:tg,status:'weak',n:tk.n})}
  else if(tk.k==='entra_enfraquecer'){emit(S,'ABILITY',{side,uid:nu.uid,name:nm,target:tg});weaken(S,f.unit,tk.n,tk.n,tk.n,'age')}}}
 {const e=kwE(card.def,'cura');if(e){let t=null;for(const x of sd.field)if(x&&x!==nu&&x.hp<x.maxHp&&(!t||x.maxHp-x.hp>t.maxHp-t.hp))t=x;
  if(t){const h0=t.hp;t.hp=Math.min(t.maxHp,t.hp+e.n);emit(S,'ABILITY',{side,uid:nu.uid,name:'Cura '+e.n,target:t.uid});emit(S,'UNIT_BUFFED',{uid:t.uid,side,hp:t.hp,heal:t.hp-h0,src:nu.uid,reason:'heal'})}}}
 {const e=kwE(card.def,'reforco');if(e){let t=null;for(const x of sd.field)if(x&&x!==nu&&(!t||atkOf(x)*2+x.hp>atkOf(t)*2+t.hp))t=x;
  if(t){t.maxHp+=e.n;t.hp+=e.n;emit(S,'ABILITY',{side,uid:nu.uid,name:'Reforço '+e.n,target:t.uid});emit(S,'UNIT_BUFFED',{uid:t.uid,side,hp:t.hp,maxHp:t.maxHp,dMax:e.n,heal:e.n,src:nu.uid,reason:'reinforce'})}}}
 if(kwE(card.def,'furia'))setFury(S,nu);
 {const opp=S.sides[other(side)].field[slot];if(opp&&hasAb(opp,'furia'))setFury(S,opp)}
 {const dk=kwE(card.def,'entra_comprar');if(dk){emit(S,'ABILITY',{side,uid:nu.uid,name:KW.entra_comprar.txt(dk),draw:dk.n});for(let q=0;q<dk.n;q++)draw(S,side)}}
 if(pt&&pt.length){const unitIds=pt.slice();for(const id of unitIds){const f=findUnit(S,id);if(f){f.unit.statuses.push({type:'plague',by:side,ticks:1,src:card.uid});emit(S,'STATUS_APPLIED',{side:f.side,uid:id,status:'plague'})}}plagueHit(S,side,unitIds)}
 if(d.risk)addRisk(S,side,d.risk);
 return{ok:true}}
function useProtocol(S,side){const v=canProtocol(S,side);if(!v.ok)return v;const sd=S.sides[side];sd.pc-=RULES.EM_COST;sd.emUsed=true;
 emit(S,'PC_SPENT',{side,amount:RULES.EM_COST,pc:sd.pc});emit(S,'PROTOCOL_USED',{side,id:'emergency'});addRisk(S,side,-RULES.EM_RR);return{ok:true}}
function endTurn(S,side){if(S.winner)return{ok:false,reason:'MATCH_OVER'};if(S.active!==side||S.phase!=='plan')return{ok:false,reason:'NOT_ACTIVE'};
 const me=S.sides[side],foe=S.sides[other(side)];
 grafiteEnd(S,side);
 if(S.winner)return{ok:true};
 // Fase D — fim do turno: regeneração do SCP-682
 me.field.forEach(u=>{const rk=u&&(hasAb(u,'regeneracao')?'regeneracao':hasAb(u,'regenerar')?'regenerar':null);if(rk&&u.hp<u.maxHp){const h0=u.hp;u.hp=Math.min(u.maxHp,u.hp+kwN(u,rk,3));emit(S,'UNIT_BUFFED',{uid:u.uid,side,hp:u.hp,heal:u.hp-h0,reason:'regen'})}});
 // expirar estados temporários
 me.field.forEach(u=>{if(u){u.statuses=u.statuses.filter(s=>s.type!=='uncontrolled'||me.turns<s.toTurn);if(u.copied){u.copied=null;emit(S,'COPY_ENDED',{side,uid:u.uid})}}});
 emit(S,'TURN_ENDED',{side});beginTurn(S,other(side));return{ok:true}}

function scryPick(S,side,uid){const o=S.scryOffer;if(S.winner)return{ok:false,reason:'MATCH_OVER'};if(S.phase!=='scry'||!o||o.side!==side||S.active!==side)return{ok:false,reason:'PHASE'};
 const i=o.cards.findIndex(c=>c.uid===uid);if(i<0)return{ok:false,reason:'NO_CARD'};const sd=S.sides[side],keep=o.cards[i],rest=o.cards[1-i];
 sd.deck=sd.deck.filter(c=>c.uid!==keep.uid&&c.uid!==rest.uid);sd.hand.push(keep);sd.deck.push(rest);S.scryOffer=null;S.phase='plan';
 emit(S,'CARD_DRAWN',{side,uid:keep.uid,def:keep.def,scry:true});emit(S,'SCRY_DONE',{side,uid:keep.uid,bottom:rest.uid});
 for(const u of S.sides[other(side)].field.slice())if(u&&hasAb(u,'compra_invoca'))createToken(S,other(side),u.uid,'draw',kwF(u,'compra_invoca')||'T074');
 return{ok:true}}
function dispatch(S,a){S.evBuf=[];let r;
 if(S.winner)r={ok:false,reason:'MATCH_OVER'};
 else if(a.type==='PLAY')r=playCard(S,a.side||S.active,a.uid,a.slot,a.target,a.targets);
 else if(a.type==='PROTOCOL')r=useProtocol(S,a.side||S.active);
 else if(a.type==='USE_001')r=use001(S,a.side||S.active,a.uid);
 else if(a.type==='END_TURN')r=endTurn(S,a.side||S.active);
 else if(a.type==='ATTACK')r=attack(S,a.side||S.active,a.uid,a.target);
 else if(a.type==='SCRY')r=scryPick(S,a.side||S.active,a.uid);
 else r={ok:false,reason:'UNKNOWN_ACTION'};
 return Object.assign({},r,{events:flush(S)})}

/* ---------- ações legais (a IA só escolhe entre estas) ---------- */
function legalActions(S,side){const out=[];if(!S.winner&&S.active===side&&S.phase==='scry'&&S.scryOffer)return S.scryOffer.cards.map(c=>({type:'SCRY',side,uid:c.uid}));if(S.winner||S.active!==side||S.phase!=='plan')return out;const sd=S.sides[side];
 for(const c of sd.hand)for(let s=0;s<RULES.SLOTS;s++){if(!canPlay(S,side,c.uid,s).ok)continue;
  if(TARGETED[c.def]){const ts=targetsFor(S,side,c.def,s);if(ts.length){for(const t of ts)out.push({type:'PLAY',side,uid:c.uid,slot:s,target:t});continue}}
  out.push({type:'PLAY',side,uid:c.uid,slot:s})}
 for(const u of sd.field)if(u&&canAttack(S,side,u.uid).ok){const o=attackOptions(S,side,u.uid);if(o.face)out.push({type:'ATTACK',side,uid:u.uid,target:'face'});for(const t of o.units)out.push({type:'ATTACK',side,uid:u.uid,target:t})}
 if(canProtocol(S,side).ok)out.push({type:'PROTOCOL',side});for(const c of sd.hand)if(c.def==='001'&&!S.scp001.used)out.push({type:'USE_001',side,uid:c.uid});out.push({type:'END_TURN',side});return out}

/* ---------- IA: três perfis, mesmas regras do jogador, sem ver o baralho ---------- */
// valor das palavras-chave para a IA comum (genérico: nenhuma regra por carta)
function kwPlayValue(S,side,def,a,opp,profile){const me=S.sides[side],foe=S.sides[other(side)];let v=0;
 for(const e of DEFS[def].kw||[]){const n=e.n||0;
  if(e.k==='provocar')v+=2.5+(profile==='defensive'?1.5:0);
  else if(e.k==='investida')v+=DEFS[def].atk*(foe.field.some(Boolean)?.6:1.1);
  else if(e.k==='escudo')v+=DEFS[def].atk*.8+1;
  else if(e.k==='venenoso')v+=3+foe.field.filter(Boolean).length*.6;
  else if(e.k==='furia_vento')v+=DEFS[def].atk*.9;
  else if(e.k==='us_dano')v+=n*1.2;
  else if(e.k==='entra_cura_todos'){for(const x of me.field)if(x)v+=Math.min(n,x.maxHp-x.hp)*.8}
  else if(e.k==='regeneracao')v+=n*1.2+(profile==='defensive'?1:0);
  else if(e.k==='protecao')v+=n*2+(profile==='defensive'?1:0);
  else if(e.k==='cura'){let m=0;for(const x of me.field)if(x)m=Math.max(m,Math.min(n,x.maxHp-x.hp));v+=m*1.1}
  else if(e.k==='reforco')v+=me.field.some(Boolean)?n*1.6:0;
  else if(e.k==='veneno')v+=n*.9+(opp?1:0);
  else if(e.k==='drenar')v+=n*.7;
  else if(e.k==='furia_x')v+=n*.5;
  else if(e.k==='devastar')v+=n*foe.field.filter(Boolean).length*.9;
  else if(e.k==='retaliacao')v+=n*1.2;
  else if(e.k==='execucao')v+=n*(foe.field.some(x=>x&&x.hp<x.maxHp)?1.2:.5);
  else if(e.k==='entra_banir'){if(a.target!=null){const t=findUnit(S,a.target).unit;v+=t.atk*2+t.hp+4}else v-=5}
  else if(e.k==='incendiar')v+=n*foe.field.filter(Boolean).length*1.6;
  else if(e.k==='enfraquecer'||e.k==='silenciar'){if(a.target!=null)v+=targetValue(S,side,def,a.target)*(e.k==='silenciar'?.35:.6);else v-=3}}
 return v}
function aiScore(S,side,a,profile){
 const me=S.sides[side],foe=S.sides[other(side)];
 if(a.type==='END_TURN')return 0;
 if(a.type==='USE_001')return 1000;
 if(a.type==='ATTACK'){const u=findUnit(S,a.uid).unit,A=atkOf(u);
  if(a.target==='face')return A>=foe.hp?900:1+A*(profile==='aggressive'?1.5:.8);
  const t=findUnit(S,a.target).unit,ex=hasAb(u,'execucao')&&t.hp<t.maxHp?kwN(u,'execucao',0):0,kill=t.hp<=A+ex,die=atkOf(t)>=u.hp,val=x=>atkOf(x)*2+x.hp*.6;
  return (kill?val(t)+3:(A+ex)*.35)-(die?val(u):atkOf(t)*.3)+(profile==='defensive'?1:0)}
 if(a.type==='PROTOCOL'){const th=profile==='defensive'?4:profile==='aggressive'?7:9;return me.rr>=th?20+me.rr:-1}
 const card=me.hand.find(c=>c.uid===a.uid),d=DEFS[card.def],opp=foe.field[a.slot];
 let s=d.atk*1.2+d.hp*.7+d.cost*.5;
 if(!opp)s+=d.atk*(profile==='aggressive'?1.8:.8);else s+=profile==='defensive'?2.2:.4;
 s+=kwPlayValue(S,side,card.def,a,opp,profile);
 const after=me.rr+d.risk;
 if(profile==='defensive')s-=d.risk*2.2+(after>=7?6:0);
 else if(profile==='aggressive')s-=d.risk*.6;
 else s+=d.risk*.5; // instável: aceita risco
 if(after>=RULES.RR_MAX&&profile!=='unstable')s-=60;
 if(after>=RULES.RR_MAX&&profile==='unstable'&&!unitsOf(S,side).some(u=>DEFS[u.def].breach)&&card.def!=='106')s-=8;
 return s}
function scryValue(S,side,def){const d=DEFS[def],pc=S.sides[side].pcMax;return d.atk*1.2+d.hp*.7+(d.cost<=pc?2:0)-Math.max(0,d.cost-pc)*1.5}
function aiChoose(S,side){if(S.phase==='scry'&&S.scryOffer&&S.active===side){const c=S.scryOffer.cards.slice().sort((a,b)=>scryValue(S,side,b.def)-scryValue(S,side,a.def))[0];return{type:'SCRY',side,uid:c.uid}}
 const profile=S.profiles[side]||'aggressive',acts=legalActions(S,side);let best=null,bs=-1e9;
 for(const a of acts){const sc=aiScore(S,side,a,profile);if(sc>bs){bs=sc;best=a}}
 return best&&bs>0?best:{type:'END_TURN',side}}

return{KWDESC:Object.fromEntries(Object.entries(KWD).map(([k,v])=>[k,v[1]])),canFace,attackOptions,canAttack,kwE,EXCLUSIVE,CLASS_KW,atkOf,RARITY,COLLECTIBLE,TARGETED,targetsFor,autoTarget,silenced,handCount,previewCombat,attackTarget,RULES,DEFS,GLOSS,KW,DECK_TEST,pestTargets,autoPest,hasAb,create,start,dispatch,legalActions,canPlay,canProtocol,corrosionTargets,aiChoose,aiScore,snap,findUnit,isBlocked,other}
});
