import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const source=app.slice(app.indexOf('window.initTravelExpenses='),app.indexOf('/* Calendar handoff:'));
// Ausschliesslich synthetische Testdaten, kein Kontakt zur produktiven Datenbank.
async function scenario({accept=true,error=false,kind='expense'}={}){
 const entry=kind==='expense'?{id:'test-delete',description:'Testausgabe',cents:100,currency:'EUR',payer:'Mike',members:['Ante']}:{id:'test-delete',kind:'settlement',from:'Ante',to:'Mike',cents:100,currency:'EUR'};
 let rows=[{payload:entry}],deletes=0,reads=0;
 class Node{constructor(){this.children=[];this.listeners={};this.textContent='';}append(...n){this.children.push(...n);}appendChild(n){this.append(n);}replaceChildren(){this.children=[];this.textContent='';}setAttribute(){}addEventListener(k,f){this.listeners[k]=f;}}
 const nodes=new Map();
 const document={createElement:()=>new Node(),getElementById(id){if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);}};
 const table={select(){reads++;return this;},order(){return this;},eq(k,v){if(this.deleting)this.filters.push([k,v]);return this;},async limit(){return {data:rows,error:null};},delete(){this.deleting=true;this.filters=[];return {eq:(k,v)=>{this.filters.push([k,v]);return {eq:async(k,v)=>{this.filters.push([k,v]);deletes++;assert.deepEqual(this.filters,[['project_id','test-project'],['entry_id',entry.id]]);if(!error)rows=[];return {error:error?Error('denied'):null};}};}};}};
 const context={window:{},document,localStorage:{getItem:()=>null},confirm:()=>accept};
 vm.runInNewContext(source,context);
 await context.window.initTravelExpenses({from:name=>{assert.equal(name,'camino_ledger_entries');return table;}},'test-project');
 const row=nodes.get('expense-list').children[0];
 assert.equal(row.children[0].className,'expense-entry-info');
 assert.equal(row.children[1].className,'expense-entry-amount');
 const actions=row.children[2];assert.equal(actions.className,'expense-entry-actions');
 const del=actions.children.find(n=>n.textContent==='Löschen');
 await del.listeners.click();
 assert.equal(deletes,accept?1:0);
 assert.equal(reads,accept&&!error?2:1);
 assert.equal(rows.length,accept&&!error?0:1);
 assert.equal(nodes.get('expense-feedback').textContent,error&&accept?'Löschen fehlgeschlagen.':'');
 if(accept&&!error)assert.equal(nodes.get('expense-list').textContent,'Noch keine Ausgaben erfasst.');
}
await scenario();await scenario({kind:'settlement'});await scenario({accept:false});await scenario({error:true});
console.log('PASS: Löschklick für Ausgabe und Rückzahlung, Abbruch, Fehler und exakter Projekt-/Eintrag-Filter');
