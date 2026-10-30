/* iOS Web Push self-test: opt-in, device-bound, no account or secrets in source. */
(function(){
'use strict';
const status=document.getElementById('push-status');
const register=document.getElementById('push-register');
const send=document.getElementById('push-send');
if(!status||!register||!send)return;
const endpoint='https://qoensghjemruqafrbmjd.supabase.co/functions/v1/camino-push-device';
const storageKey='camino-iphone-push-test-token-v1';
const report=message=>{status.textContent=message;};
const keyBytes=str=>{
 const binary=atob((str+'='.repeat((4-str.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/'));
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
};
function getToken(){
 let token=localStorage.getItem(storageKey);
 if(token&&/^[A-Za-z0-9_-]{43}$/.test(token))return token;
 if(!window.crypto?.getRandomValues)throw new Error('Sichere Gerätekennung ist nicht verfügbar.');
 const bytes=new Uint8Array(32);
 window.crypto.getRandomValues(bytes);
 token=btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 localStorage.setItem(storageKey,token);
 return token;
}
async function request(action,extra={}){
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,token:getToken(),...extra}),cache:'no-store'});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){
  const messages={vapid_not_configured:'Der Server-Schlüssel ist noch nicht bereit.',device_not_registered:'Bitte zuerst dieses iPhone aktivieren.',wait_two_minutes:'Bitte zwei Minuten bis zum nächsten Test warten.',daily_limit:'Das Tageslimit von drei Testnachrichten ist erreicht.',push_provider_rejected:'Der Push-Dienst hat die Nachricht abgelehnt. Bitte Gerät erneut aktivieren.',unsupported_push_endpoint:'Diese Registrierung unterstützt derzeit iPhone-Web-Push.',registration_failed:'Registrierung am Server fehlgeschlagen.'};
  throw new Error(messages[data.error]||'Serverfehler ('+response.status+').');
 }
 return data;
}
register.addEventListener('click',async()=>{
 register.disabled=true;
 try{
  if(!('Notification' in window)||!('PushManager' in window)||!('serviceWorker' in navigator))throw new Error('Bitte die Camino-App über das Home-Bildschirm-Symbol öffnen.');
  const permission=Notification.permission==='default'?await Notification.requestPermission():Notification.permission;
  if(permission!=='granted')throw new Error('Bitte Mitteilungen in den iPhone-Einstellungen erlauben.');
  const {publicKey}=await request('config');
  if(!publicKey)throw new Error('Push-Schlüssel fehlt.');
  const sw=await navigator.serviceWorker.ready;
  let subscription=await sw.pushManager.getSubscription();
  if(!subscription)subscription=await sw.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(publicKey)});
  await request('register',{subscription:subscription.toJSON()});
  report('iPhone registriert. Du kannst jetzt den Server-Push senden und die App schliessen.');
 }catch(e){report(e.message||'Registrierung fehlgeschlagen.');}
 finally{register.disabled=false;}
});
send.addEventListener('click',async()=>{
 send.disabled=true;
 try{
  await request('test');
  report('Server-Test geplant. Schliesse Camino jetzt: In etwa 12 Sekunden sollte die Push-Mitteilung eintreffen.');
 }catch(e){report(e.message||'Push-Test fehlgeschlagen.');}
 finally{send.disabled=false;}
});
try{if(localStorage.getItem(storageKey))report('Gerätekennung vorhanden. Falls bereits registriert: Server-Push senden.');}catch{}
})();