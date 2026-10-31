/* Private Camino ledger access. Authentication is not authorisation:
   only project_members membership unlocks the ledger UI. Login: e-mail code only. */
import {createClient} from '../vendor/supabase/supabase-js-2.57.0.mjs';
const auth=window.CaminoAuth.createAuth({
 url:'https://qoensghjemruqafrbmjd.supabase.co',
 publishableKey:'sb_publishable_Qeom38G18vSgrrE5MxoXEw_LhJM1f6S',
 projectId:'45343dda-fa24-4839-ac16-6b111da4ee28',
 redirectPath:'/camino/',
 clientFactory:createClient
});
const root=document.getElementById('expense-auth');
const privatePanel=document.getElementById('expense-private');
const login=document.getElementById('expense-auth-login');
const member=document.getElementById('expense-auth-member');
const identity=document.getElementById('expense-auth-identity');
const status=document.getElementById('expense-auth-status');
const email=document.getElementById('expense-auth-email');
const code=document.getElementById('expense-auth-code');
const emailForm=document.getElementById('expense-email-form');
const otp=document.getElementById('expense-otp-form');
const sent=document.getElementById('expense-auth-sent');
const resend=document.getElementById('expense-auth-resend');
let initialised=false,initPromise=null,revision=0,authorisedUserId=null,accessInterrupted=false,cooldown=null;
function report(message){status.textContent=message;}
function hideLedger(){privatePanel.hidden=true;member.hidden=true;login.hidden=false;root.hidden=false;}
function mask(address){const [name,domain]=String(address).split('@');if(!domain)return address;return name.slice(0,Math.min(4,name.length))+'…@'+domain;}
async function refresh(){
 const version=++revision;
 hideLedger();
 report('Anmeldestatus wird geprüft …');
 try{
  const user=await auth.currentUser();
  if(version!==revision)return;
  if(!user){accessInterrupted=initialised;report('');return;}
  member.hidden=false;login.hidden=true;
  identity.textContent='Angemeldet als '+(user.email||'Konto');
  const membership=await auth.membership();
  if(version!==revision)return;
  if(!membership){accessInterrupted=initialised;report('Du bist angemeldet, aber noch nicht für die Camino-Kasse freigeschaltet. Bitte Mike um Freischaltung bitten.');return;}
  if(initialised&&(accessInterrupted||authorisedUserId!==user.id)){location.reload();return;}
  if(!initialised&&typeof window.initTravelExpenses==='function'){
    if(!initPromise)initPromise=window.initTravelExpenses(auth.client,auth.projectId,{name:membership.display_name,email:user.email,userId:user.id,signOut:()=>auth.signOut()}).catch(error=>{initPromise=null;throw error;});
    await initPromise;
    initialised=true;
    authorisedUserId=user.id;
  }
  if(version!==revision)return;
  privatePanel.hidden=false;
  root.hidden=true;
  report('');
 }catch(e){if(version===revision){accessInterrupted=initialised;privatePanel.hidden=true;root.hidden=false;report('Die Kasse konnte nicht geladen werden. Bitte Verbindung prüfen und die Seite neu laden.');}}
}
function startCooldown(seconds){
 clearInterval(cooldown);let left=seconds;resend.disabled=true;resend.textContent='Code erneut senden ('+left+' s)';
 cooldown=setInterval(()=>{left--;if(left<=0){clearInterval(cooldown);resend.disabled=false;resend.textContent='Code erneut senden';return;}resend.textContent='Code erneut senden ('+left+' s)';},1000);
}
async function sendCode(){
 const address=email.value.trim();
 const {error}=await auth.client.auth.signInWithOtp({email:address,options:{emailRedirectTo:location.origin+'/camino/',shouldCreateUser:false}});
 if(error)throw error;
 sent.textContent='Code gesendet an '+mask(address)+'.';
 emailForm.hidden=true;otp.hidden=false;code.value='';
 startCooldown(60);
 try{code.focus();}catch{}
}
emailForm.addEventListener('submit',async event=>{
 event.preventDefault();
 const button=event.currentTarget.querySelector('button');
 button.disabled=true;report('');
 try{await sendCode();}
 catch(e){
  const message=String(e.message||'');
  report(/signups not allowed|not found|user not found/i.test(message)
   ?'Diese E-Mail-Adresse ist nicht für die Camino-Kasse eingetragen. Bitte die Adresse prüfen oder Mike fragen.'
   :/rate limit|too many|seconds/i.test(message)?'Bitte einen Moment warten und dann erneut versuchen.'
   :'Der Code konnte nicht gesendet werden. Bitte erneut versuchen.');
 }finally{button.disabled=false;}
});
let verifying=false;
async function verify(){
 if(verifying)return;verifying=true;
 const button=otp.querySelector('button[type="submit"]');button.disabled=true;report('Code wird geprüft …');
 try{
  const {error}=await auth.client.auth.verifyOtp({email:email.value.trim(),token:code.value.trim(),type:'email'});
  if(error)throw error;
  await refresh();
 }catch(e){report('Der Code stimmt nicht oder ist abgelaufen. Bitte erneut eingeben oder einen neuen Code anfordern.');code.select&&code.select();}
 finally{button.disabled=false;verifying=false;}
}
otp.addEventListener('submit',event=>{event.preventDefault();verify();});
code.addEventListener('input',()=>{const digits=code.value.replace(/\D/g,'');if(digits!==code.value)code.value=digits;if(digits.length===6)verify();});
document.getElementById('expense-auth-other').addEventListener('click',()=>{otp.hidden=true;emailForm.hidden=false;report('');try{email.focus();}catch{}});
resend.addEventListener('click',async()=>{try{await sendCode();report('Neuer Code gesendet.');}catch{report('Der Code konnte nicht gesendet werden. Bitte später erneut versuchen.');}});
document.getElementById('expense-auth-signout').addEventListener('click',async()=>{
 try{await auth.signOut();location.reload();}catch{report('Abmelden fehlgeschlagen.');}
});
auth.client.auth.onAuthStateChange(()=>{setTimeout(()=>refresh(),0);});
refresh();
