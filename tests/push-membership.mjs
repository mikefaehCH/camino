import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {
  createPushDeviceHandler,
  CAMINO_PROJECT_ID,
} from "../supabase/functions/camino-push-device/handler.mjs";
const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const token = "a".repeat(43);
function server({
  user = { id: userId },
  member = true,
  claim = { claimed: true },
  deviceOwner = userId,
  revoke = false,
  authError = null,
} = {}) {
  const calls = [],
    tasks = [];
  let memberReads = 0;
  const handler = createPushDeviceHandler({
    env: () => "synthetic-server-only",
    delay: async () => {},
    waitUntil: (task) => tasks.push(task),
    webpush: {
      setVapidDetails() {},
      sendNotification: async () => calls.push({ send: true }),
    },
    createClient: () => ({
      auth: {
        getUser: async (jwt) => {
          calls.push({ jwt });
          return { data: { user }, error: authError };
        },
      },
      from(table) {
        let action = "select",
          values;
        const filters = {};
        const builder = {
          select() {
            return builder;
          },
          eq(k, v) {
            filters[k] = v;
            return builder;
          },
          is(k, v) {
            filters[k] = v;
            return builder;
          },
          update(v) {
            action = "update";
            values = v;
            return builder;
          },
          insert(v) {
            action = "insert";
            values = v;
            return builder;
          },
          delete() {
            action = "delete";
            return builder;
          },
          async then(resolve, reject) {
            try {
              return resolve(await builder.maybeSingle());
            } catch (e) {
              return reject(e);
            }
          },
          async maybeSingle() {
            calls.push({ table, action, filters: { ...filters }, values });
            if (table === "project_members") {
              assert.equal(filters.project_id, CAMINO_PROJECT_ID);
              assert.equal(filters.user_id, userId);
              memberReads++;
              return {
                data:
                  member && !(revoke && memberReads > 1)
                    ? { user_id: userId }
                    : null,
                error: null,
              };
            }
            assert.equal(table, "push_test_devices");
            if (action === "select" && filters.user_id === undefined)
              return { data: { user_id: deviceOwner }, error: null };
            assert.equal(
              filters.user_id,
              userId,
              "Device access must be bound to verified user",
            );
            return {
              data: {
                endpoint: "https://web.push.apple.com/test",
                p256dh: "synthetic",
                auth_secret: "synthetic",
                expires_at: "2099-01-01",
                sends_today: 0,
                last_delivery_status: "not_tested",
                token_hash: "synthetic",
              },
              error: null,
            };
          },
        };
        return builder;
      },
      async rpc(name, args) {
        calls.push({ rpc: name, args });
        if (name === "get_push_credentials_for_service")
          return {
            data: {
              publicKey: "public-only",
              privateKey: "secret-fixture",
              subject: "mailto:test@example.test",
            },
            error: null,
          };
        assert.equal(name, "claim_camino_push_test");
        assert.equal(args.p_user_id, userId);
        return { data: claim, error: null };
      },
    }),
  });
  return {
    calls,
    tasks,
    request: (
      action = "status",
      authorization = "Bearer synthetic-jwt",
      extra = {},
    ) =>
      handler(
        new Request("https://edge.example.test", {
          method: "POST",
          headers: {
            origin: "https://mikefaehch.github.io",
            "content-type": "application/json",
            ...(authorization ? { authorization } : {}),
          },
          body: JSON.stringify({ action, token, ...extra }),
        }),
      ),
  };
}
{
  const h = server();
  assert.equal((await h.request("config", "")).status, 401);
  assert.equal(h.calls.length, 0);
}
for (const options of [
  { user: null },
  { authError: { message: "invalid" } },
  { user: { id: userId, is_anonymous: true } },
]) {
  const h = server(options);
  assert.equal((await h.request()).status, 401);
  assert.equal(
    h.calls.some((c) => c.table || c.rpc),
    false,
  );
}
{
  const h = server({ member: false });
  assert.equal((await h.request("test")).status, 403);
  assert.equal(
    h.calls.some((c) => c.table === "push_test_devices" || c.rpc),
    false,
  );
}
{
  const h = server();
  assert.equal((await h.request()).status, 200);
  const response = await h.request("config");
  assert.deepEqual(await response.json(), { publicKey: "public-only" });
}
{
  const h = server({ deviceOwner: "other-user" });
  assert.equal(
    (
      await h.request("register", "Bearer synthetic-jwt", {
        subscription: {
          endpoint: "https://web.push.apple.com/example",
          keys: { p256dh: "p".repeat(30), auth: "a".repeat(20) },
        },
      })
    ).status,
    403,
  );
  assert.equal(
    h.calls.some((c) => c.action === "insert" || c.action === "update"),
    false,
  );
}
{
  const h = server({ claim: { error: "daily_limit" } });
  assert.equal((await h.request("test")).status, 429);
  assert.equal(h.tasks.length, 0);
}
for (const revoke of [false, true]) {
  const h = server({ revoke });
  assert.equal(
    (await h.request("test", "Bearer synthetic-jwt", { user_id: "forged" }))
      .status,
    202,
  );
  await Promise.all(h.tasks);
  assert.equal(
    h.calls.some((c) => c.send),
    !revoke,
  );
}
// Execute the actual browser IIFE with an isolated DOM and synthetic session.
for (const session of [null, "synthetic-access-token"]) {
  const elements = new Map(),
    requests = [];
  for (const id of ["push-status", "push-register", "push-send", "push-check"])
    elements.set(id, {
      listeners: {},
      addEventListener(name, fn) {
        this.listeners[name] = fn;
      },
    });
  const context = {
    document: { getElementById: (id) => elements.get(id) || null },
    window: {
      crypto: globalThis.crypto,
      getCaminoPushAccessToken: async () => session,
    },
    localStorage: { getItem: () => null, setItem() {} },
    crypto: globalThis.crypto,
    btoa,
    atob,
    fetch: async (url, options) => {
      requests.push(options);
      return { ok: true, json: async () => ({ status: "not_tested" }) };
    },
  };
  vm.runInNewContext(
    fs.readFileSync(new URL("../js/push-client.js", import.meta.url), "utf8"),
    context,
  );
  await elements.get("push-check").listeners.click();
  assert.equal(requests.length, session ? 1 : 0);
  if (session)
    assert.equal(requests[0].headers.Authorization, "Bearer " + session);
  else
    assert.equal(
      elements.get("push-status").textContent,
      "Bitte zuerst anmelden.",
    );
}
console.log(
  "PASS: no-session client/server rejection, verified identity and membership, device ownership, per-user quota call and revoked-member delivery denial",
);

// Exercise the pinned real SDK as well: only its HTTP transport is mocked.
const { createClient: realCreateClient } =
  await import("../vendor/supabase/supabase-js-2.57.0.mjs");
for (const mode of ["missing", "invalid", "nonmember", "member"]) {
  const http = [];
  const handler = createPushDeviceHandler({
    env: (name) =>
      name === "SUPABASE_URL"
        ? "https://fixture.supabase.co"
        : "synthetic-service-key",
    waitUntil() {
      throw Error("config must not schedule a push");
    },
    webpush: {},
    createClient: (url, key, options) =>
      realCreateClient(url, key, {
        ...options,
        global: {
          fetch: async (input, init) => {
            const req = new Request(input, init),
              endpoint = new URL(req.url);
            http.push(endpoint.pathname);
            const json = (value, status = 200) =>
              new Response(JSON.stringify(value), {
                status,
                headers: { "content-type": "application/json" },
              });
            if (endpoint.pathname === "/auth/v1/user") {
              assert.equal(
                req.headers.get("authorization"),
                "Bearer synthetic-access-token",
              );
              return mode === "invalid"
                ? json({ message: "Invalid JWT" }, 401)
                : json({ id: userId, is_anonymous: false });
            }
            if (endpoint.pathname === "/rest/v1/project_members") {
              assert.equal(
                endpoint.searchParams.get("user_id"),
                "eq." + userId,
              );
              assert.equal(
                endpoint.searchParams.get("project_id"),
                "eq." + CAMINO_PROJECT_ID,
              );
              return json(mode === "nonmember" ? [] : [{ user_id: userId }]);
            }
            assert.equal(
              endpoint.pathname,
              "/rest/v1/rpc/get_push_credentials_for_service",
            );
            return json({
              publicKey: "public-only",
              privateKey: "server-only-test-secret",
            });
          },
        },
      }),
  });
  const response = await handler(
    new Request("https://edge.example.test", {
      method: "POST",
      headers: {
        origin: "https://mikefaehch.github.io",
        "content-type": "application/json",
        ...(mode === "missing"
          ? {}
          : { authorization: "Bearer synthetic-access-token" }),
      },
      body: JSON.stringify({ action: "config", token }),
    }),
  );
  assert.equal(
    response.status,
    mode === "member" ? 200 : mode === "nonmember" ? 403 : 401,
  );
  if (mode === "missing") assert.equal(http.length, 0);
  if (mode !== "member")
    assert.equal(
      http.includes("/rest/v1/rpc/get_push_credentials_for_service"),
      false,
    );
  else assert.deepEqual(await response.json(), { publicKey: "public-only" });
}
console.log(
  "PASS: real pinned SDK with mocked fetch verifies bearer and membership without network or secret disclosure",
);
