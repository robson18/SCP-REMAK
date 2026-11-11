// Testes das habilidades inspiradas no Hearthstone (node tools/rules.test.js)
const E=require('../js/engine.js');global.CombatEngine=E;global.window={};global.localStorage={getItem(){return null},setItem(){}};require('../js/cards.js');
const assert=require('assert');let n=0;const t=(name,f)=>{f();n++;console.log('ok -',name)};
// mesa montada à mão: p ataca, e defende
function setup(pf,ef){const S=E.create({seed:1,decks:{p:Array(20).fill('007'),e:Array(20).fill('007')}});E.start(S);S.active='p';S.phase='plan';
 const mk=(side,def,i)=>{const d=E.DEFS[def];const u={uid:++S.uid,def,atk:d.atk,hp:d.hp,maxHp:d.hp,sick:false,owner:side,statuses:[],bonus:{},age:1,attacked:false,shield:!!E.kwE(def,'escudo')};S.sides[side].field[i]=u;return u};
 S.sides.p.field.fill(null);S.sides.e.field.fill(null);const P=pf.map((d,i)=>d&&mk('p',d,i)),Q=ef.map((d,i)=>d&&mk('e',d,i));return{S,P,Q}}
t('Provocar obriga a atacar a carta com Provocar',()=>{const{S,P,Q}=setup(['007'],[null,'049','074']);
 assert.equal(E.dispatch(S,{type:'ATTACK',side:'p',uid:P[0].uid,target:Q[1].uid}).reason,'TAUNT');
 assert.equal(E.dispatch(S,{type:'ATTACK',side:'p',uid:P[0].uid,target:'face'}).reason,'TAUNT');
 assert.ok(E.dispatch(S,{type:'ATTACK',side:'p',uid:P[0].uid,target:Q[2].uid}).ok)});
t('Escudo Divino anula o primeiro dano',()=>{const{S,P,Q}=setup(['007'],['054']);E.dispatch(S,{type:'ATTACK',side:'p',uid:P[0].uid,target:Q[0].uid});
 assert.equal(Q[0].hp,6);assert.equal(Q[0].shield,false)});
t('Venenoso destrói o alvo ferido',()=>{const{S,P,Q}=setup(['075'],['3008']);E.dispatch(S,{type:'ATTACK',side:'p',uid:P[0].uid,target:Q[0].uid});assert.equal(S.sides.e.field[0],null)});
t('Venenoso não passa pelo Escudo Divino',()=>{const{S,P,Q}=setup(['075'],['054']);E.dispatch(S,{type:'ATTACK',side:'p',uid:P[0].uid,target:Q[0].uid});assert.ok(S.sides.e.field[0])});
t('Investida ataca no turno em que entra',()=>{const{S}=setup([],[]);S.sides.p.pc=10;S.sides.p.hand=[{uid:999,def:'127'}];
 assert.ok(E.dispatch(S,{type:'PLAY',side:'p',uid:999,slot:0}).ok);assert.ok(E.canAttack(S,'p',999).ok)});
t('Fúria dos Ventos ataca duas vezes',()=>{const{S,P}=setup(['007'],[]);E.DEFS['007'].kw.push({k:'furia_vento'});
 assert.ok(E.dispatch(S,{type:'ATTACK',side:'p',uid:P[0].uid,target:'face'}).ok);assert.ok(E.dispatch(S,{type:'ATTACK',side:'p',uid:P[0].uid,target:'face'}).ok);
 assert.equal(E.dispatch(S,{type:'ATTACK',side:'p',uid:P[0].uid,target:'face'}).reason,'USED');E.DEFS['007'].kw.pop()});
t('Último Suspiro do SCP-3812 fere todos os inimigos',()=>{const{S,P,Q}=setup(['682'],['3812','007']);P[0].atk=20;const hp=S.sides.p.hp;
 E.dispatch(S,{type:'ATTACK',side:'p',uid:P[0].uid,target:Q[0].uid});assert.equal(S.sides.e.field[0],null);assert.equal(P[0].hp,16); // 16-3 do Último Suspiro, +3 do Drenar
 assert.equal(S.sides.p.hp,hp-3)});
t('Grito de Guerra do SCP-054 cura os aliados',()=>{const{S,P}=setup(['007'],[]);P[0].hp=2;S.sides.p.pc=10;S.sides.p.hand=[{uid:999,def:'054'}];
 E.dispatch(S,{type:'PLAY',side:'p',uid:999,slot:1});assert.equal(P[0].hp,5)});
console.log(n+' testes ok');
