import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync(new URL('../js/auth-core.js',import.meta.url),'utf8');
const calls=[];
const user={id:'test-user'};
const client={
 auth:{
  signInWithOAuth:async args=>{calls.push(args);return {error:null};},
  signOut:async()=>({error:null}),
  getUser:async()=>({data:{user},error:null})
 },
 from:table=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{user_id:user.id,display_name:'Test',role:'member'},error:null})})})})
};
const sandbox={window:{location:{origin:'https://mikefaehch.github.io'},URL},URL};
vm.runInNewContext(code,sandbox);
const auth=sandbox.window.CaminoAuth.createAuth({
 url:'https://example.supabase.co',publishableKey:'public-key',
 projectId:'camino',redirectPath:'/camino/login.html',
 clientFactory:()=>client
});
assert.equal((await auth.currentUser()).id,'test-user');
assert.equal((await auth.membership()).display_name,'Test');
await auth.signIn('google');
assert.equal(calls[0].options.redirectTo,'https://mikefaehch.github.io/camino/login.html');
await assert.rejects(()=>auth.signIn('github'),/Unsupported provider/);
await auth.signOut();
assert.equal(calls.length,1);
console.log('PASS: reusable auth adapter contract');
