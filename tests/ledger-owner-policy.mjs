import assert from 'node:assert/strict';
import fs from 'node:fs';
const {PGlite} = await import(process.env.PGLITE_PATH || '@electric-sql/pglite');
const db=new PGlite();const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',other='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const tables=['camino_ledger_entries','expense_entries','expense_settlements'];
try{
 await db.exec(`create role anon; create role authenticated; create schema auth; create schema private;
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to authenticated,anon; create table public.members(user_id uuid primary key); grant select on public.members to authenticated; insert into public.members values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');`);
 for(const table of tables)await db.exec(`create table public.${table}(id text primary key, payload text); grant select,insert,update,delete on public.${table} to authenticated; alter table public.${table} enable row level security; create policy old_member_access on public.${table} for all to authenticated using (exists (select 1 from public.members where user_id = (select auth.uid()))) with check (exists (select 1 from public.members where user_id = (select auth.uid()))); insert into public.${table} values ('existing','synthetic');`);
 const sql=fs.readFileSync(new URL('../supabase/proposals/ledger-owner-only.sql', import.meta.url),'utf8').replaceAll('829dfa95-6722-4b08-aa1b-843e38a06ba7',owner);
 await db.exec(sql);await db.exec('set role authenticated');
 for(const table of tables){
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
  assert.equal((await db.query(`select id from public.${table}`)).rows.length,1);
  assert.equal((await db.query(`update public.${table} set payload='owner' returning id`)).rows.length,1);
  await db.query(`insert into public.${table} values ('owner-new','synthetic')`);
  assert.equal((await db.query(`delete from public.${table} where id='owner-new' returning id`)).rows.length,1);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);
  assert.equal((await db.query(`select id from public.${table}`)).rows.length,0);
  assert.equal((await db.query(`update public.${table} set payload='bad' returning id`)).rows.length,0);
  assert.equal((await db.query(`delete from public.${table} returning id`)).rows.length,0);
  await assert.rejects(db.query(`insert into public.${table} values ('bad','synthetic')`));
 }
 await db.exec("reset role; delete from public.members where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; set role authenticated");
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
 for(const table of tables) assert.equal((await db.query(`select id from public.${table}`)).rows.length,0,'revoked member denied');
 await db.exec('reset role; set role anon');
 for(const table of tables)await assert.rejects(db.query(`select id from public.${table}`));
 console.log('PASS: three tables; owner CRUD; non-owner denied CRUD; anonymous denied');
}finally{await db.close()}
