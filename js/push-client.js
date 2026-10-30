/* Authenticated opt-in Web Push. No device identifiers or secret keys are embedded. */
(function(){
'use strict';
const status=document.getElementById('push-status');
const login=document.getElementById('push-login');
const register=document.getElementById('push-register');
const send=document.getElementById('push-send');
if(!status||!login||!register||!send)return;
const projectId='45343dda-fa24-4839-ac16-6b111da4ee28';
const url='https://qoensghjemruqafrbmjd.supabase.co';
const key='sb_publishable_Qeom38G18vSgrrE5MxoXEw_LhJM1f6S';
const report=(s)=>{status.textContent=s;};
if(!window.supabase?.createClient||!window.CaminoAuth){report('Anmeldedienst konnte nicht geladen werden.');return;}
const auth=window.CaminoAuth.createAuth({url,publishableKey:key,projectId,redirectPath:'/camino/',clientFactory:window.supabase.createClient});
const decodeKey=(str)=>{
 const pad='='.repeat((4-str.length%4)%4);
 const binary=atob((str+pad).replace(/-/g,'+').replace(/_/g,'/'));
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
};
async function member(){
 const m=await auth.membership();
 if(!m)throw new Error('Dein Konto ist noch nicht als Camino-Mitglied freigeschaltet.');
 return m;
}
login.addEventListener('click',async()=>{
 try{await auth.signIn('google');}catch(e){report(e.message||'Anmeldung fehlgeschlagen.');}
});
register.addEventListener('click',async()=>{
 register.disabled=true;
 try{
  if(!('PushManager' in window)||!('serviceWorker' in navigator))throw new Error('Web Push wird hier nicht unterstützt. Bitte die Home-Bildschirm-App öffnen.');
  const m=await member();
  const {data:settings,error:settingsError}=await auth.client.from('push_settings').select('vapid_public_key').eq('project_id',projectId).single();
  if(settingsError||!settings?.vapid_public_key)throw new Error('Öffentlicher Push-Schlüssel nicht verfügbar.');
  const permission=Notification.permission==='default'?await Notification.requestPermission():Notification.permission;
  if(permission!=='granted')throw new Error('Mitteilungen wurden nicht erlaubt.');
  const sw=await navigator.serviceWorker.ready;
  let sub=await sw.pushManager.getSubscription();
  if(!sub)sub=await sw.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeKey(settings.vapid_public_key)});
  const json=sub.toJSON();
  if(!json.endpoint||!json.keys?.p256dh||!json.keys?.auth)throw new Error('Unvollständige Geräte-Registrierung.');
  const {error}=await auth.client.from('push_subscriptions').upsert({project_id:projectId,user_id:m.user_id,endpoint:json.endpoint,p256dh:json.keys.p256dh,auth_secret:json.keys.auth},{onConflict:'project_id,user_id,endpoint',ignoreDuplicates:true});
  if(error)throw error;
  report('Dieses Gerät ist für echte Push-Mitteilungen registriert.');
 }catch(e){report(e.message||'Geräteregistrierung fehlgeschlagen.');}
 finally{register.disabled=false;}
});
send.addEventListener('click',async()=>{
 send.disabled=true;
 try{
  await member();
  const {data,error}=await auth.client.functions.invoke('camino-push-self-test',{body:{}});
  if(error)throw error;
  report('Server-Push angefordert: '+data.delivered+' Gerät(e) erreicht, '+data.failed+' fehlgeschlagen. App schliessen und erneut testen.');
 }catch(e){report(e.message||'Push-Versand fehlgeschlagen.');}
 finally{send.disabled=false;}
});
auth.currentUser().then(user=>{if(user)report('Angemeldet. Gerät registrieren, danach echten Push testen.');}).catch(()=>{});
})();