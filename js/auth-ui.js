/* Private Camino ledger access. Authentication is not authorisation:
   only project_members membership unlocks local ledger UI. */
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
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
const otp=document.getElementById('expense-otp-form');
let initialised=false,revision=0,authorisedUserId=null;
function report(message){status.textContent=message;}
function hideLedger(){privatePanel.hidden=true;member.hidden=true;login.hidden=false;}
async function refresh(){
 const version=++revision;
 hideLedger();
 report('Anmeldestatus wird geprüft …');
 try{
  const user=await auth.currentUser();
  if(version!==revision)return;
  if(!user){report('Bitte anmelden. Nur freigeschaltete Camino-Mitglieder haben Zugriff.');return;}
  member.hidden=false;login.hidden=true;
  identity.textContent='Angemeldet: '+(user.email||'Konto');
  const membership=await auth.membership();
  if(version!==revision)return;
  if(!membership){report('Angemeldet, aber noch nicht als Camino-Mitglied freigeschaltet. Bitte den Administrator um Freischaltung bitten.');return;}
  if(initialised&&authorisedUserId!==user.id){location.reload();return;}
  if(!initialised&&typeof window.initTravelExpenses==='function'){
    await window.initTravelExpenses(auth.client,auth.projectId);
    initialised=true;
    authorisedUserId=user.id;
  }
  if(version!==revision)return;
  privatePanel.hidden=false;
  report('Zugriff freigeschaltet. Die Reisekasse wird sicher für die Camino-Gruppe synchronisiert.');
 }catch(e){if(version===revision){privatePanel.hidden=true;report('Reisekasse konnte nicht sicher geladen werden. Bitte Verbindung und Mitgliedschaft prüfen.');}}
}
root.querySelectorAll('[data-auth-provider]').forEach(button=>{
 button.addEventListener('click',async()=>{
  button.disabled=true;
  try{
   await auth.signIn(button.dataset.authProvider);
  }catch(e){
   const message=String(e.message||'');
   report(/provider is not enabled|unsupported provider|not enabled/i.test(message)
    ?'Dieser Anbieter ist in Supabase noch nicht aktiviert. Bitte vorerst E-Mail verwenden.'
    :'Anmeldung fehlgeschlagen: '+message.slice(0,180));
  }finally{button.disabled=false;}
 });
});
document.getElementById('expense-email-form').addEventListener('submit',async event=>{
 event.preventDefault();
 const button=event.currentTarget.querySelector('button');
 button.disabled=true;
 try{
  const {error}=await auth.client.auth.signInWithOtp({email:email.value.trim(),options:{emailRedirectTo:location.origin+'/camino/',shouldCreateUser:true}});
  if(error)throw error;
  otp.hidden=false;
  report('E-Mail gesendet. Bitte den Login-Code eingeben oder den Link öffnen. Danach ist eine einmalige Mitgliedsfreigabe nötig.');
 }catch(e){report('E-Mail-Anmeldung fehlgeschlagen: '+String(e.message||'Unbekannter Fehler').slice(0,180));}
 finally{button.disabled=false;}
});
otp.addEventListener('submit',async event=>{
 event.preventDefault();
 const button=event.currentTarget.querySelector('button');
 button.disabled=true;
 try{
  const {error}=await auth.client.auth.verifyOtp({email:email.value.trim(),token:code.value.trim(),type:'email'});
  if(error)throw error;
  await refresh();
 }catch(e){report('Code konnte nicht bestätigt werden: '+String(e.message||'Ungültiger Code').slice(0,180));}
 finally{button.disabled=false;}
});
document.getElementById('expense-auth-signout').addEventListener('click',async()=>{
 try{await auth.signOut();location.reload();}catch{report('Abmeldung fehlgeschlagen.');}
});
auth.client.auth.onAuthStateChange(()=>{setTimeout(()=>refresh(),0);});
refresh();
