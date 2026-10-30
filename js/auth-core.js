/* Reusable Supabase auth adapter. No app-specific permissions are inferred from login. */
(function(root){
  'use strict';
  const PROVIDERS=Object.freeze(['google','apple','azure']);
  function createAuth({url,publishableKey,projectId,redirectPath,clientFactory}){
    if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url||''))throw new Error('Invalid Supabase URL');
    if(!publishableKey||!projectId||!redirectPath||redirectPath[0]!=='/'||redirectPath.startsWith('//'))throw new Error('Incomplete auth configuration');
    if(typeof clientFactory!=='function')throw new Error('Supabase client unavailable');
    const client=clientFactory(url,publishableKey,{auth:{storageKey:'shared-auth-'+new URL(url).hostname,flowType:'pkce',detectSessionInUrl:true}});
    async function signIn(provider){
      if(!PROVIDERS.includes(provider))throw new Error('Unsupported provider');
      const redirectTo=new URL(redirectPath,root.location.origin);
      if(redirectTo.origin!==root.location.origin)throw new Error('Unsafe redirect');
      const {error}=await client.auth.signInWithOAuth({provider,options:{redirectTo:redirectTo.href}});
      if(error)throw error;
    }
    async function signOut(){const {error}=await client.auth.signOut();if(error)throw error;}
    async function currentUser(){const {data,error}=await client.auth.getUser();if(error&&error.name!=='AuthSessionMissingError')throw error;return data?.user||null;}
    async function membership(table='camino_members'){
      const user=await currentUser();if(!user)return null;
      const {data,error}=await client.from(table).select('user_id,display_name,role').eq('user_id',user.id).maybeSingle();
      if(error)throw error;
      return data||null;
    }
    return Object.freeze({projectId,client,signIn,signOut,currentUser,membership});
  }
  root.CaminoAuth=Object.freeze({createAuth,PROVIDERS});
})(typeof window!=='undefined'?window:globalThis);
