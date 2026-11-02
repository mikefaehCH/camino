// Optional local SQL regression using the already available PGlite test installation.
// PGLITE_PATH=/absolute/path/to/@electric-sql/pglite/dist/index.js node tests/push-membership-sql.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
const { PGlite } = await import(
  process.env.PGLITE_PATH || "@electric-sql/pglite"
);
const db = new PGlite();
const a = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  b = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key);
 create table public.project_members(project_id uuid,user_id uuid);
 grant select on public.project_members to service_role;
 create table public.push_test_devices(token_hash text primary key,last_sent_at timestamptz,send_day date,sends_today int default 0,expires_at timestamptz default now()+interval '1 day',last_delivery_status text,last_delivery_detail text,last_delivery_updated_at timestamptz);
 alter default privileges grant all on tables to anon,authenticated;`);
  for (const id of [a, b]) {
    await db.query("insert into auth.users values($1)", [id]);
    await db.query(
      "insert into project_members values('45343dda-fa24-4839-ac16-6b111da4ee28',$1)",
      [id],
    );
  }
  const migration = fs
    .readdirSync("supabase/migrations")
    .find((f) => f.endsWith("_push_device_membership.sql"));
  await db.exec(fs.readFileSync("supabase/migrations/" + migration, "utf8"));
  for (const [hash, id] of [
    ["one", a],
    ["two", a],
    ["three", b],
  ])
    await db.query(
      "insert into push_test_devices(token_hash,user_id) values($1,$2)",
      [hash, id],
    );
  for (const role of ["anon", "authenticated"]) {
    assert.equal(
      (
        await db.query(
          "select has_function_privilege($1,'public.claim_camino_push_test(uuid,text)','EXECUTE') as ok",
          [role],
        )
      ).rows[0].ok,
      false,
    );
    assert.equal(
      (
        await db.query(
          "select has_table_privilege($1,'public.camino_push_test_limits','SELECT') as ok",
          [role],
        )
      ).rows[0].ok,
      false,
    );
  }
  const claim = async (id, hash) =>
    (
      await db.query("select public.claim_camino_push_test($1,$2) as value", [
        id,
        hash,
      ])
    ).rows[0].value;
  await db.exec("set role service_role");
  assert.deepEqual(await claim(a, "one"), { claimed: true });
  assert.deepEqual(
    await claim(a, "two"),
    { error: "wait_two_minutes" },
    "A different device cannot bypass account cooldown",
  );
  assert.deepEqual(
    await claim(b, "one"),
    { error: "device_not_registered" },
    "Another member cannot use this device",
  );
  assert.deepEqual(
    await claim(b, "three"),
    { claimed: true },
    "Different accounts have independent quotas",
  );
  await db.exec("reset role");
  for (let count = 1; count < 3; count++) {
    await db.exec(
      "update camino_push_test_limits set last_sent_at=now()-interval '3 minutes';update push_test_devices set last_sent_at=now()-interval '3 minutes'",
    );
    await db.exec("set role service_role");
    assert.deepEqual(await claim(a, count === 1 ? "two" : "one"), {
      claimed: true,
    });
    await db.exec("reset role");
  }
  await db.exec(
    "update camino_push_test_limits set last_sent_at=now()-interval '3 minutes';update push_test_devices set last_sent_at=now()-interval '3 minutes';set role service_role",
  );
  assert.deepEqual(
    await claim(a, "two"),
    { error: "daily_limit" },
    "Three sends across devices exhaust the account limit",
  );
  await db.exec(
    "reset role;update camino_push_test_limits set send_day=current_date-1;update push_test_devices set send_day=current_date-1;set role service_role",
  );
  assert.deepEqual(
    await claim(a, "two"),
    { claimed: true },
    "A new day resets the account quota",
  );
  await db.exec("reset role");
  await db.query("delete from project_members where user_id=$1", [a]);
  await db.exec("set role service_role");
  assert.deepEqual(await claim(a, "one"), { error: "membership_required" });
  console.log(
    "PASS: SQL grants, ownership, account/device cooldown, three-per-day quota across rotated devices, daily reset and revoked membership",
  );
} finally {
  await db.close();
}
