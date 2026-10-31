import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
const source=app.slice(app.indexOf('window.initTravelExpenses='),app.indexOf('/* Calendar handoff:'));
const entry={id:'legacy-test',description:'Test',cents:100,currency:'EUR',payer:'Mike',members:['Mike']};
async function run({accept=true,uploadError=false,legacy=true}={}){
 let backup=legacy?JSON.stringify([entry]):null,uploads=0,inserts=0,prompts=0;
 const node=()=>({replaceChildren(){},addEventListener(){},textContent:''});
 const nodes=new Map();
 const document={getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);}};
 const table={select(){return this;},eq(){return this;},order(){return this;},async limit(){return {data:[],error:null};},async upsert(rows,options){uploads++;assert.equal(rows[0].entry_id,entry.id);assert.equal(options.ignoreDuplicates,true);return {error:uploadError?Error('network'):null};},async insert(){inserts++;return {error:null};}};
 const context={window:{},document,localStorage:{getItem:()=>backup,removeItem:()=>{backup=null;}},confirm:()=>{prompts++;return accept;}};
 vm.runInNewContext(source,context);
 let failed=false;try{await context.window.initTravelExpenses({from:()=>table},'project');}catch{failed=true;}
 return {backup,uploads,inserts,prompts,failed};
}
let r=await run({accept:false});assert.ok(r.backup);assert.equal(r.uploads,0);
r=await run({uploadError:true});assert.ok(r.backup);assert.equal(r.failed,true);
r=await run();assert.equal(r.backup,null);assert.equal(r.uploads,1);assert.equal(r.prompts,1);
r=await run({legacy:false});assert.equal(r.inserts,0);assert.equal(r.prompts,0);
console.log('PASS: migration requires consent, preserves failed/cancelled backups, and never seeds financial data');
