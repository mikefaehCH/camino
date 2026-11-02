/* iOS Web Push self-test: opt-in, member-authorised, device-bound; no secrets in source. */
(function(){
'use strict';
const status=document.getElementById('push-status');
const register=document.getElementById('push-register');
const send=document.getElementById('push-send');
const check=document.getElementById('push-check');
if(!status||!register||!send||!check)return;
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
async function accessToken(){
 const token=await window.getCaminoPushAccessToken?.();
 if(!token)throw new Error('Bitte zuerst anmelden.');
 return token;
}
async function request(action,extra={}){
 const bearer=await accessToken();
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+bearer},body:JSON.stringify({action,token:getToken(),...extra}),cache:'no-store'});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){
  const messages={origin_denied:'Diese Website darf den Push-Test nicht verwenden.',method_not_allowed:'Diese Anfrage wird nicht unterstützt.',too_large:'Die Anfrage ist zu gross.',invalid_json:'Die Anfrage konnte nicht verarbeitet werden.',invalid_device_token:'Die Gerätekennung ist ungültig. Bitte das Gerät erneut aktivieren.',invalid_subscription:'Die Geräteregistrierung ist ungültig.',invalid_endpoint:'Die Push-Adresse ist ungültig.',status_unavailable:'Der Versandstatus ist derzeit nicht verfügbar.',settings_unavailable:'Die Erinnerungen konnten nicht geladen werden.',settings_save_failed:'Die Erinnerungen konnten nicht gespeichert werden.',invalid_reminder_settings:'Bitte gültige Erinnerungszeiten wählen.',invalid_action:'Diese Push-Aktion wird nicht unterstützt.',lookup_failed:'Das Gerät konnte nicht geprüft werden.',auth_required:'Bitte zuerst anmelden.',invalid_session:'Die Anmeldung ist abgelaufen. Bitte erneut anmelden.',membership_required:'Du bist für Camino noch nicht freigeschaltet. Bitte Mike fragen.',membership_unavailable:'Die Freischaltung konnte nicht geprüft werden. Bitte später erneut versuchen.',device_owner_mismatch:'Dieses Gerät gehört zu einem anderen Konto. Bitte mit dem bisherigen Konto anmelden.',rate_limit_unavailable:'Das Testlimit konnte nicht geprüft werden. Bitte später erneut versuchen.',test_already_in_progress:'Ein Push-Test läuft bereits. Bitte kurz warten.',server_unavailable:'Der Server ist derzeit nicht verfügbar.',vapid_not_configured:'Der Server-Schlüssel ist noch nicht bereit.',device_not_registered:'Bitte zuerst dieses iPhone aktivieren.',wait_two_minutes:'Bitte zwei Minuten bis zum nächsten Test warten.',daily_limit:'Das Tageslimit von drei Testnachrichten ist erreicht.',push_provider_rejected:'Der Push-Dienst hat die Nachricht abgelehnt. Bitte Gerät erneut aktivieren.',unsupported_push_endpoint:'Diese Registrierung unterstützt derzeit iPhone-Web-Push.',registration_failed:'Registrierung am Server fehlgeschlagen.'};
  throw new Error(messages[data.error]||'Serverfehler ('+response.status+').');
 }
 return data;
}
async function checkStatus(){
 const result=await request('status');
 const messages={not_tested:'Registriert. Noch kein Server-Test ausgeführt.',scheduled:'Server-Test läuft. In Kürze nochmals prüfen.',accepted:'Apple hat den Push angenommen. Bitte Anzeige auf dem iPhone prüfen.',rejected:'Apple hat den Push abgelehnt. Gerät bitte erneut registrieren.'};
 report(messages[result.status]||'Status nicht verfügbar.');
}
check.addEventListener('click',async()=>{
 check.disabled=true;
 try{await checkStatus();}catch(e){report(e.message||'Statusprüfung fehlgeschlagen.');}
 finally{check.disabled=false;}
});
register.addEventListener('click',async()=>{
 register.disabled=true;
 try{
  await accessToken();
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
  loadReminders().catch(()=>{});
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
const remindersEnabled=document.getElementById('push-reminders-enabled');
const morningTime=document.getElementById('push-morning-time');
const eveningTime=document.getElementById('push-evening-time');
const saveReminders=document.getElementById('push-reminders-save');
const remindersFeedback=document.getElementById('push-reminders-feedback');
async function loadReminders(){
 if(!remindersEnabled||!remindersFeedback)return;
 const settings=await request('reminder_settings');
 remindersEnabled.checked=Boolean(settings.enabled);
 morningTime.value=settings.morningTime||'07:00';
 eveningTime.value=settings.eveningTime||'19:00';
 remindersFeedback.textContent=settings.enabled
  ?'Automatische Erinnerungen aktiviert: Vorabend '+eveningTime.value+', morgens '+morningTime.value+' (spanische Ortszeit).'
  :'Automatische Erinnerungen sind ausgeschaltet.';
}
if(saveReminders){
 saveReminders.addEventListener('click',async()=>{
  saveReminders.disabled=true;
  try{
   if(remindersEnabled.checked&&(!('Notification' in window)||Notification.permission!=='granted'))
    throw new Error('Bitte zuerst Mitteilungen auf diesem iPhone erlauben.');
   const settings=await request('save_reminders',{enabled:remindersEnabled.checked,morningTime:morningTime.value,eveningTime:eveningTime.value});
   remindersFeedback.textContent=settings.enabled
    ?'Gespeichert und aktiviert: Vorabend '+eveningTime.value+', morgens '+morningTime.value+' (spanische Ortszeit).'
    :'Gespeichert: Automatische Erinnerungen sind ausgeschaltet.';
  }catch(e){remindersFeedback.textContent=e.message||'Einstellungen konnten nicht gespeichert werden.';}
  finally{saveReminders.disabled=false;}
 });
}
try{if(localStorage.getItem(storageKey))checkStatus().catch(e=>report(e.message||'Gerätekennung vorhanden. Bitte iPhone aktivieren.'));}catch{}
try{if(localStorage.getItem(storageKey))loadReminders().catch(e=>{if(remindersFeedback)remindersFeedback.textContent=e.message||'Bitte das iPhone für Push aktivieren.';});}catch{}
})();