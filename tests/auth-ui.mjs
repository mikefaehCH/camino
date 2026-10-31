import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/auth-ui.js',import.meta.url),'utf8').replace(/^import .*;$/m,'const createClient=()=>{};');
async function setup(){
 let user=null,member=null,expired=false,loads=0,reloads=0;
 const nodes=new Map();const node=()=>({hidden:false,textContent:'',querySelectorAll:()=>[],addEventListener(){}});
 const document={getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);}};
 const auth={projectId:'test',client:{auth:{onAuthStateChange(){}}},currentUser:async()=>{if(expired)throw Error('expired');return user;},membership:async()=>member};
 const context={document,window:{CaminoAuth:{createAuth:()=>auth},initTravelExpenses:async()=>{loads++;}},location:{reload(){reloads++;}},fetch:async()=>({ok:false}),setTimeout};
 vm.runInNewContext(source,context);await new Promise(r=>setImmediate(r));
 return {nodes,refresh:()=>vm.runInNewContext('refresh()',context),set(u,m,e=false){user=u;member=m;expired=e;},get loads(){return loads;},get reloads(){return reloads;}};
}
let t=await setup();assert.equal(t.nodes.get('expense-private').hidden,true);assert.equal(t.loads,0);
t.set({id:'test-user'},null);await t.refresh();assert.equal(t.nodes.get('expense-private').hidden,true);assert.equal(t.loads,0);
t.set({id:'test-user'},{});await t.refresh();assert.equal(t.nodes.get('expense-private').hidden,false);assert.equal(t.loads,1);
// Entzogene Mitgliedschaft sperrt die Ansicht; erneut freigegeben braucht frischen Zustand.
t.set({id:'test-user'},null);await t.refresh();assert.equal(t.nodes.get('expense-private').hidden,true);
t.set({id:'test-user'},{});await t.refresh();assert.equal(t.reloads,1);assert.equal(t.nodes.get('expense-private').hidden,true);
t=await setup();t.set({id:'test-user'},{});await t.refresh();
t.set(null,null,true);await t.refresh();assert.equal(t.nodes.get('expense-private').hidden,true);
t.set({id:'test-user'},{});await t.refresh();assert.equal(t.reloads,1);
t=await setup();t.set({id:'test-user'},{});await t.refresh();t.set({id:'other-user'},{});await t.refresh();assert.equal(t.reloads,1);
console.log('PASS: UI-Sperre abgemeldet, ohne/entzogene Mitgliedschaft, abgelaufene Session; Reload bei Wiederanmeldung/Kontowechsel (Mocks, kein RLS-Livenachweis)');
