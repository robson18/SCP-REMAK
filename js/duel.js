/* Mesa de duelo do SCP Remake: desenha o estado do motor (engine.js) e anima os eventos. */
(()=>{
const E=CombatEngine,C=CARDS,D=E.DEFS,R=E.RULES;
const $=s=>document.querySelector(s);
const stage=$('#stage'),cardsEl=$('#cards'),fx=$('#fx'),arrow=$('#arrow path');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let S,view,queue=[],busy=false,mode=null,drag=null,hover=null,endArmed=0;
const els=new Map();

/* ---------- escala da mesa ---------- */
let scale=1;
function fit(){scale=Math.min(innerWidth/1600,innerHeight/900);stage.style.transform=`scale(${scale})`}
addEventListener('resize',fit);fit();
function pt(e){const r=stage.getBoundingClientRect();return{x:(e.clientX-r.left)/scale,y:(e.clientY-r.top)/scale}}

/* ---------- geometria (centro de cada carta, base 150x200) ---------- */
const ROW={e:311,p:551},SX=i=>800+(i-2)*172;
const DECK={e:{cx:1520,cy:248},p:{cx:1520,cy:638}};
const HUD={e:{cx:119,cy:225},p:{cx:119,cy:595}};
function handPos(side,i,n,uid){const k=i-(n-1)/2;
 if(side==='e')return{cx:800+k*58,cy:22+k*k*3,rot:180-k*4,s:.7,z:100+i};
 if(uid===hover&&!drag)return{cx:Math.min(1400,Math.max(200,800+k*Math.min(118,620/Math.max(1,n-1)))),cy:706,rot:0,s:1.72,z:700};
 const sp=Math.min(118,620/Math.max(1,n-1));return{cx:800+k*sp,cy:802+Math.abs(k)*Math.abs(k)*6,rot:k*4.5,s:1.1,z:100+i}}
const tf=p=>`translate(${p.cx-75}px,${p.cy-100}px) rotate(${p.rot||0}deg) scale(${p.s||1})`;
function place(el,p){el._pos=p;el.style.transform=tf(p);el.style.zIndex=p.z||10}

/* colunas vazias */
const slotsEl=$('#slots');
for(const s of['e','p'])for(let i=0;i<5;i++){const d=document.createElement('div');d.className='slot';d.dataset.side=s;d.dataset.slot=i;
 d.style.left=SX(i)-75+'px';d.style.top=ROW[s]-100+'px';slotsEl.appendChild(d)}
for(const s of['e','p']){const im=$('#deck-'+s);im.style.left=DECK[s].cx-60+'px';im.style.top=DECK[s].cy-80+'px';
 const n=$('#deckn-'+s);n.style.left=DECK[s].cx-60+'px';n.style.top=DECK[s].cy+70+'px'}

/* ---------- desenho da carta ---------- */
function cardHTML(def,u){const d=D[def];let h='';
 if(C.FULL[def])h+=`<img class="full" src="assets/card_${def}.webp" alt="">`;
 else h+=`<img class="art" src="${C.artOf(def)}" alt=""><img class="frame" src="assets/frame.webp" alt=""><div class="name">${d.name}</div><div class="nick">${d.nick}</div>`;
 const pc=S.sides.p.pc;h+=`<div class="cost${!u&&d.cost>pc?' no':''}">${d.cost}</div>`;
 const lines=C.TEXT[def]||[];
 h+=`<div class="text">${lines.map(x=>`<div><b>${x.n}</b>${x.t?' — '+x.t:''}</div>`).join('')}<div class="cls">${C.CLS[d.cls]||''}</div></div>`;
 const atk=u?u.atk:d.atk,hp=u?u.hp:d.hp,mx=u?u.maxHp:d.hp;
 h+=`<div class="atk ${atk>d.atk?'up':atk<d.atk?'down':''}">${atk}</div><div class="hp ${hp<mx?'down':mx>d.hp?'up':''}">${hp}</div>`;
 if(u&&u.statuses.length){const m={poison:x=>'☠ Veneno '+x.n,weak:x=>'▼ Enfraquecido',silence:()=>'✕ Silenciado',fury:()=>'Fúria',graffiti:()=>'Grafite',plague:()=>'Peste',uncontrolled:()=>'Ruptura'};
  h+=`<div class="st">${[...new Set(u.statuses.map(x=>(m[x.type]||(()=>x.type))(x)))].map(t=>`<span>${t}</span>`).join('')}</div>`}
 return h}
const backHTML='<img class="back" src="assets/back.webp" alt="">';

/* ---------- render do estado ---------- */
function getEl(uid,from){let el=els.get(uid);if(el)return el;
 el=document.createElement('div');el.className='card nt';el.dataset.uid=uid;cardsEl.appendChild(el);els.set(uid,el);
 place(el,Object.assign({rot:0,s:.75,z:50},from));el.getBoundingClientRect();el.classList.remove('nt');return el}
function setFace(el,key,html){if(el._key!==key){el._key=key;el.innerHTML=html}}
function render(){if(!view)return;const seen=new Set(),act=canAct();
 for(const s of['p','e']){const sd=view.sides[s];
  sd.hand.forEach((c,i)=>{seen.add(c.uid);const el=getEl(c.uid,DECK[s]);el.dataset.loc='hand';el.dataset.side=s;el.dataset.def=c.def;
   if(s==='e')setFace(el,'back',backHTML);else setFace(el,c.def+'|'+S.sides.p.pc,cardHTML(c.def,null));
   if(!(drag&&drag.uid===c.uid))place(el,handPos(s,i,sd.hand.length,c.uid));
   el.className='card'+(s==='p'?' hand':'')+(el.classList.contains('nt')?' nt':'');
   if(s==='p'&&act&&D[c.def].cost<=S.sides.p.pc&&S.sides.p.field.some(x=>!x))el.classList.add('playable');
   if(mode&&mode.uid===c.uid)el.classList.add('sel')});
  sd.field.forEach((u,i)=>{if(!u)return;seen.add(u.uid);const el=getEl(u.uid,DECK[s]);el.dataset.loc='field';el.dataset.side=s;el.dataset.def=u.def;
   setFace(el,JSON.stringify([u.def,u.atk,u.hp,u.maxHp,u.statuses]),cardHTML(u.def,u));
   place(el,{cx:SX(i),cy:ROW[s],rot:0,s:1,z:10});
   el.className='card field';
   if(u.sick&&s==='p'&&view.active==='p')el.classList.add('sick');
   if(s==='p'&&act&&!mode&&E.canAttack(S,'p',u.uid).ok)el.classList.add('ready');
   if(mode&&mode.uid===u.uid)el.classList.add('sel');
   if(mode&&mode.type==='attack'&&s==='e')el.classList.add('target');
   if(mode&&mode.type==='target'&&mode.ts.includes(u.uid))el.classList.add('target')})}
 for(const[uid,el]of els)if(!seen.has(uid)){els.delete(uid);
  if(el.dataset.loc==='field'){el.classList.add('dying');setTimeout(()=>el.remove(),550)}else el.remove()}
 for(const s of['p','e']){const sd=view.sides[s];$('#deckn-'+s).textContent=sd.deckN;$('#deck-'+s).style.opacity=sd.deckN?1:.25;
  const h=$('#hud-'+s);h.className='hud'+(view.active===s?' active':'')+(s==='e'&&mode&&mode.type==='attack'&&E.canFace(S,'p',mode.uid)?' target':'');
  h.innerHTML=`<div class="who">${s==='p'?'VOCÊ · DIRETOR':'INIMIGO'}</div><div class="hpv"><i>♥</i>${sd.hp}</div>
   <div class="lbl">PC ${sd.pc}/${sd.pcMax}</div><div class="pcs">${Array.from({length:R.PC_CAP},(_,i)=>`<b class="${i<sd.pc?'on':''}" style="${i>=sd.pcMax?'opacity:.25':''}"></b>`).join('')}</div>
   <div class="lbl">RISCO DE RUPTURA ${sd.rr}/${R.RR_MAX}</div><div class="rr"><div style="width:${sd.rr/R.RR_MAX*100}%"></div></div>
   ${s==='e'?`<div class="hand-n">Cartas na mão: ${sd.hand.length}</div>`:''}`}
 document.querySelectorAll('.slot').forEach(d=>{const ok=d.dataset.side==='p'&&mode&&(mode.type==='select'||mode.type==='drag')&&!S.sides.p.field[+d.dataset.slot];d.classList.toggle('ok',!!ok)});
 const en=$('#end');en.disabled=!act;en.classList.toggle('go',act&&!S.sides.p.field.some(u=>u&&E.canAttack(S,'p',u.uid).ok)&&!S.sides.p.hand.some(c=>D[c.def].cost<=S.sides.p.pc&&S.sides.p.field.some(x=>!x)));
 $('#proto').disabled=!act||!E.canProtocol(S,'p').ok}

/* ---------- efeitos ---------- */
function posOf(uid){const el=els.get(uid);return el&&el._pos}
function float(p,txt,cls){const d=document.createElement('div');d.className='float '+cls;d.textContent=txt;d.style.left=p.cx+'px';d.style.top=p.cy+'px';fx.appendChild(d);setTimeout(()=>d.remove(),1150)}
function boom(p){const d=document.createElement('div');d.className='boom';d.style.left=p.cx+'px';d.style.top=p.cy+'px';fx.appendChild(d);setTimeout(()=>d.remove(),500)}
function shake(el){if(!el)return;el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake')}
let bt;function banner(t,red,ms=1100){const b=$('#banner');b.textContent=t;b.classList.toggle('red',!!red);b.classList.add('on');clearTimeout(bt);bt=setTimeout(()=>b.classList.remove('on'),ms)}
let tt;function toast(t){const b=$('#toast');b.textContent=t;b.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>b.classList.remove('on'),2200)}
function showPreview(def,u){const p=$('#preview');if(!def){p.style.opacity=0;return}p.innerHTML=`<div class="card">${cardHTML(def,u)}</div>`;p.style.opacity=1}

async function playEv(ev){if(ev.snap){view=ev.snap;render()}
 switch(ev.type){
  case'TURN_STARTED':banner(ev.side==='p'?'SEU TURNO':'TURNO DO INIMIGO',ev.side==='e');await wait(1000);break;
  case'CARD_DRAWN':await wait(200);break;
  case'CARD_PLAYED':if(ev.side==='e'){showPreview(ev.def);await wait(900);showPreview(null)}else await wait(380);break;
  case'ATTACK':{const a=els.get(ev.uid),p=a&&a._pos;if(!p)break;
   const t=ev.target!=null?posOf(ev.target):HUD[ev.side==='p'?'e':'p'];
   const dx=(t.cx-p.cx)*.75,dy=(t.cy-p.cy)*.75;
   a.style.zIndex=800;a.animate([{transform:tf(p)},{transform:tf(Object.assign({},p,{cx:p.cx-dx*.08,cy:p.cy-dy*.08,s:1.08}))},{transform:tf(Object.assign({},p,{cx:p.cx+dx,cy:p.cy+dy,s:1.12}))},{transform:tf(p)}],{duration:520,offsets:[0,.3,.55,1],easing:'ease-in-out'});
   await wait(290);boom(t);await wait(260);a.style.zIndex=p.z;break}
  case'UNIT_DAMAGED':{const p=posOf(ev.uid);if(p){float(p,'-'+ev.amount,'dmg');shake(els.get(ev.uid))}await wait(330);break}
  case'PLAYER_DAMAGED':float(HUD[ev.side],'-'+ev.amount,'dmg');shake($('#hud-'+ev.side));await wait(450);break;
  case'UNIT_BUFFED':{const p=posOf(ev.uid);if(p&&ev.heal)float(p,'+'+ev.heal,'heal');await wait(300);break}
  case'UNIT_DESTROYED':await wait(480);break;
  case'UNIT_PROTECTED':{const p=posOf(ev.uid);if(p)float(p,'Sobreviveu!','info');await wait(600);break}
  case'ABILITY':{const p=posOf(ev.uid)||HUD[ev.side];float({cx:p.cx,cy:p.cy-60},ev.name,'info');await wait(650);break}
  case'BREACH_TRIGGERED':case'BREACH_GENERIC':banner('RUPTURA DE CONTENÇÃO',true,1500);await wait(1400);break;
  case'PROTOCOL_USED':float({cx:HUD[ev.side].cx,cy:HUD[ev.side].cy-90},'Protocolo de Emergência','info');await wait(600);break;
  case'UNIT_SENT_TO_POCKET':await wait(450);break;
  case'TOKEN_CREATED':await wait(300);break;
  case'FATIGUE':float(HUD[ev.side],'Fadiga','info');await wait(500);break;
  case'OVERTIME':banner('PRORROGAÇÃO',true);await wait(1000);break;
  case'MATCH_FINISHED':await wait(400);endModal(ev.winner);break;
 }}
function push(evs){queue.push(...evs);if(!busy)pump()}
async function pump(){busy=true;render();while(queue.length)await playEv(queue.shift());busy=false;view=E.snap(S);render();afterQueue()}
function afterQueue(){if(S.winner)return;
 if(S.phase==='scry'&&S.scryOffer){if(S.scryOffer.side==='p')scryModal();else setTimeout(aiStep,500);return}
 if(S.active==='e')setTimeout(aiStep,550)}
function aiStep(){if(busy||S.winner||S.active!=='e')return;let r=E.dispatch(S,E.aiChoose(S,'e'));if(!r.ok)r=E.dispatch(S,{type:'END_TURN',side:'e'});push(r.events)}

/* ---------- ações do jogador ---------- */
const WHY={PC_LOW:'PC insuficiente.',SLOT_OCCUPIED:'Coluna ocupada.',SICK:'Acabou de entrar: só ataca no próximo turno.',USED:'Esta carta já atacou neste turno.',
 FACE_BLOCKED:'Só dá para atacar o inimigo direto com a coluna da frente vazia.',NO_ATK:'Esta carta não tem ataque.',BLOCKED:'Esta carta não pode atacar neste turno.',RR_ZERO:'Risco de Ruptura já está em 0.',BAD_TARGET:'Alvo inválido.'};
const canAct=()=>S&&!busy&&!S.winner&&S.active==='p'&&S.phase==='plan';
function act(a){if(!canAct())return;mode=null;arrowOff();const r=E.dispatch(S,Object.assign({side:'p'},a));
 if(!r.ok){toast(WHY[r.reason]||r.reason);render();return}push(r.events)}
function tryPlay(uid,slot){const c=S.sides.p.hand.find(x=>x.uid===uid);if(!c)return;const v=E.canPlay(S,'p',uid,slot);if(!v.ok){toast(WHY[v.reason]||v.reason);mode=null;render();return}
 if(E.TARGETED[c.def]){const ts=E.targetsFor(S,'p',c.def,slot);if(ts.length>1){mode={type:'target',uid,slot,ts};toast('Escolha o alvo da habilidade.');render();return}
  if(ts.length===1)return act({type:'PLAY',uid,slot,target:ts[0]})}
 act({type:'PLAY',uid,slot})}
function arrowFrom(p,q){arrow.setAttribute('d',`M${p.cx},${p.cy} Q${(p.cx+q.x)/2},${Math.min(p.cy,q.y)-80} ${q.x},${q.y}`)}
function arrowOff(){arrow.setAttribute('d','')}
function slotAt(q){for(let i=0;i<5;i++)if(Math.abs(q.x-SX(i))<86&&Math.abs(q.y-ROW.p)<110)return i;return -1}
const cardAt=e=>{const t=document.elementFromPoint(e.clientX,e.clientY);return t&&t.closest('.card[data-uid]')};
const onHudE=e=>{const t=document.elementFromPoint(e.clientX,e.clientY);return t&&t.closest('#hud-e')};

stage.addEventListener('pointerdown',e=>{if($('#modal').classList.contains('on'))return;const q=pt(e),el=cardAt(e),uid=el&&+el.dataset.uid;
 if(!canAct()){return}
 if(mode&&mode.type==='attack'){
  if(el&&el.dataset.side==='e'&&el.dataset.loc==='field')return act({type:'ATTACK',uid:mode.uid,target:uid});
  if(onHudE(e))return act({type:'ATTACK',uid:mode.uid,target:'face'});
  if(uid===mode.uid){mode.hold=true;return}
  mode=null;arrowOff();render();if(!el)return}
 if(mode&&mode.type==='target'){if(el&&mode.ts.includes(uid))return act({type:'PLAY',uid:mode.uid,slot:mode.slot,target:uid});mode=null;render();return}
 if(mode&&mode.type==='select'){const s=slotAt(q);if(s>=0)return tryPlay(mode.uid,s);if(!el||uid===mode.uid){mode=null;render();return}mode=null}
 if(el&&el.dataset.side==='p'&&el.dataset.loc==='hand'){drag={uid,el,sx:q.x,sy:q.y,moved:false};hover=null;mode={type:'drag',uid};el.classList.add('nt');el.style.zIndex=900;render();stage.setPointerCapture(e.pointerId);return}
 if(el&&el.dataset.side==='p'&&el.dataset.loc==='field'){const v=E.canAttack(S,'p',uid);if(!v.ok){toast(WHY[v.reason]||v.reason);return}
  mode={type:'attack',uid,drag:true};render();arrowFrom(els.get(uid)._pos,q);stage.setPointerCapture(e.pointerId)}});
stage.addEventListener('pointermove',e=>{const q=pt(e);
 if(drag){if(Math.hypot(q.x-drag.sx,q.y-drag.sy)>8)drag.moved=true;if(drag.moved)drag.el.style.transform=tf({cx:q.x,cy:q.y,rot:0,s:1.1});return}
 if(mode&&mode.type==='attack'){arrowFrom(els.get(mode.uid)._pos,q);return}
 const el=cardAt(e);
 if(el&&el.dataset.loc==='field'){const f=E.findUnit(S,+el.dataset.uid);showPreview(el.dataset.def,f&&view&&view.sides[f.side].field[f.slot])}else showPreview(null);
 const h=el&&el.dataset.side==='p'&&el.dataset.loc==='hand'?+el.dataset.uid:null;if(h!==hover){hover=h;render()}});
stage.addEventListener('pointerup',e=>{const q=pt(e);
 if(drag){const d=drag;drag=null;d.el.classList.remove('nt');
  if(d.moved){const s=slotAt(q);mode=null;if(s>=0)tryPlay(d.uid,s);else render()}
  else{mode={type:'select',uid:d.uid};toast('Escolha uma coluna sua para baixar a carta.');render()}return}
 if(mode&&mode.type==='attack'&&mode.drag){const el=cardAt(e);mode.drag=false;
  if(el&&el.dataset.side==='e'&&el.dataset.loc==='field')return act({type:'ATTACK',uid:mode.uid,target:+el.dataset.uid});
  if(onHudE(e))return act({type:'ATTACK',uid:mode.uid,target:'face'});
  if(el&&+el.dataset.uid===mode.uid){toast('Escolha o alvo do ataque.');return}
  mode=null;arrowOff();render()}});
stage.addEventListener('contextmenu',e=>{e.preventDefault();mode=null;arrowOff();render()});

$('#end').onclick=()=>{if(!canAct())return;const left=S.sides.p.field.some(u=>u&&E.canAttack(S,'p',u.uid).ok);
 if(left&&Date.now()-endArmed>3000){endArmed=Date.now();toast('Ainda há cartas que podem atacar. Clique de novo para encerrar.');return}
 endArmed=0;act({type:'END_TURN'})};
$('#proto').onclick=()=>act({type:'PROTOCOL'});
$('#proto').title=`Gasta ${R.EM_COST} PC e reduz o Risco de Ruptura em ${R.EM_RR} (1 vez por turno).`;

/* ---------- janelas ---------- */
function scryModal(){const m=$('#modal');m.innerHTML=`<h2>ESCOLHA UMA CARTA</h2><p>A outra volta para o fundo do baralho.</p><div class="row">${S.scryOffer.cards.map(c=>`<div class="card" data-pick="${c.uid}">${cardHTML(c.def,null)}</div>`).join('')}</div>`;
 m.classList.add('on');m.querySelectorAll('[data-pick]').forEach(d=>d.onclick=()=>{m.classList.remove('on');const r=E.dispatch(S,{type:'SCRY',side:'p',uid:+d.dataset.pick});push(r.events)})}
function endModal(w){const m=$('#modal');m.innerHTML=`<h2>${w==='p'?'CONTENÇÃO BEM-SUCEDIDA':'FALHA DE CONTENÇÃO'}</h2><p>${w==='p'?'Você venceu o duelo.':'O inimigo venceu o duelo.'}</p><button class="btn">JOGAR DE NOVO</button>`;
 m.classList.add('on');m.querySelector('button').onclick=()=>{m.classList.remove('on');newGame()}}

function newGame(){for(const el of els.values())el.remove();els.clear();queue=[];mode=null;drag=null;
 S=E.create({seed:(Math.random()*1e9)|0,decks:{p:C.DECK,e:C.DECK},first:Math.random()<.5?'p':'e'});view=E.snap(S);render();push(E.start(S))}
window.DUEL={get S(){return S},act,newGame};
newGame();
})();
