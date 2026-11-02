// Adapted from deployed camino-push-device v5. No secrets; deployment is manual.
export const CAMINO_PROJECT_ID = "45343dda-fa24-4839-ac16-6b111da4ee28";
export function createPushDeviceHandler({
  createClient,
  webpush,
  env,
  waitUntil,
  delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) {
  const origin = "https://mikefaehch.github.io";
  const cors = {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
    "Access-Control-Allow-Headers": "content-type,authorization,apikey",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
  const respond = (status, obj) =>
    new Response(JSON.stringify(obj), { status, headers: cors });
  const encoder = new TextEncoder();
  const validToken = (v) =>
    typeof v === "string" && /^[A-Za-z0-9_-]{43}$/.test(v);
  async function hashToken(token) {
    const bytes = await crypto.subtle.digest("SHA-256", encoder.encode(token));
    return Array.from(new Uint8Array(bytes), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
  }
  return async (req) => {
    try {
      if (req.method === "OPTIONS") {
        return req.headers.get("origin") === origin
          ? new Response(null, { headers: cors })
          : respond(403, { error: "origin_denied" });
      }
      if (req.method !== "POST")
        return respond(405, { error: "method_not_allowed" });
      if (req.headers.get("origin") !== origin)
        return respond(403, { error: "origin_denied" });
      if (!/^Bearer [^\s]+$/i.test(req.headers.get("authorization") || ""))
        return respond(401, { error: "auth_required" });
      const length = Number(req.headers.get("content-length") || 0);
      if (length > 8000) return respond(413, { error: "too_large" });
      let body;
      try {
        body = await req.json();
      } catch {
        return respond(400, { error: "invalid_json" });
      }
      if (!validToken(body?.token))
        return respond(400, { error: "invalid_device_token" });
      const url = env("SUPABASE_URL"),
        key = env("SUPABASE_SERVICE_ROLE_KEY");
      if (!url || !key) return respond(503, { error: "server_unavailable" });
      const admin = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const match = /^Bearer ([^\s]+)$/i.exec(
        req.headers.get("authorization") || "",
      );
      if (!match) return respond(401, { error: "auth_required" });
      const { data: identity, error: authError } = await admin.auth.getUser(
        match[1],
      );
      const user = identity?.user;
      if (authError || !user || user.is_anonymous)
        return respond(401, { error: "invalid_session" });
      const { data: member, error: memberError } = await admin
        .from("project_members")
        .select("user_id")
        .eq("project_id", CAMINO_PROJECT_ID)
        .eq("user_id", user.id)
        .maybeSingle();
      if (memberError) return respond(503, { error: "membership_unavailable" });
      if (!member) return respond(403, { error: "membership_required" });
      const token_hash = await hashToken(body.token);
      if (body.action === "config") {
        const { data: credentials, error } = await admin.rpc(
          "get_push_credentials_for_service",
        );
        if (error || !credentials?.publicKey)
          return respond(503, { error: "vapid_not_configured" });
        return respond(200, { publicKey: credentials.publicKey });
      }
      if (body.action === "status") {
        const { data: device, error } = await admin
          .from("push_test_devices")
          .select(
            "last_delivery_status,last_delivery_updated_at,last_delivery_detail",
          )
          .eq("token_hash", token_hash)
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) return respond(500, { error: "status_unavailable" });
        if (!device) return respond(404, { error: "device_not_registered" });
        return respond(200, {
          status: device.last_delivery_status,
          updatedAt: device.last_delivery_updated_at,
          detail: device.last_delivery_detail,
        });
      }
      if (body.action === "reminder_settings") {
        const { data: device, error } = await admin
          .from("push_test_devices")
          .select("reminders_enabled,morning_time,evening_time,expires_at")
          .eq("token_hash", token_hash)
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) return respond(500, { error: "settings_unavailable" });
        if (!device) return respond(404, { error: "device_not_registered" });
        return respond(200, {
          enabled: device.reminders_enabled,
          morningTime: String(device.morning_time).slice(0, 5),
          eveningTime: String(device.evening_time).slice(0, 5),
          expiresAt: device.expires_at,
          timezone: "Europe/Madrid",
        });
      }
      if (body.action === "save_reminders") {
        const timeOk = (v) =>
          typeof v === "string" && /^(?:0[6-9]|1[0-1]):[0-5][0-9]$/.test(v);
        const eveningOk = (v) =>
          typeof v === "string" && /^(?:1[7-9]|2[0-2]):[0-5][0-9]$/.test(v);
        if (
          typeof body.enabled !== "boolean" ||
          !timeOk(body.morningTime) ||
          !eveningOk(body.eveningTime)
        )
          return respond(400, { error: "invalid_reminder_settings" });
        const { data: updated, error } = await admin
          .from("push_test_devices")
          .update({
            reminders_enabled: body.enabled,
            morning_time: body.morningTime,
            evening_time: body.eveningTime,
            expires_at: body.enabled
              ? "2027-07-01T00:00:00+02:00"
              : new Date(Date.now() + 30 * 86400000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("token_hash", token_hash)
          .eq("user_id", user.id)
          .select("token_hash")
          .maybeSingle();
        if (error) return respond(500, { error: "settings_save_failed" });
        if (!updated) return respond(404, { error: "device_not_registered" });
        return respond(200, {
          saved: true,
          enabled: body.enabled,
          timezone: "Europe/Madrid",
        });
      }
      if (body.action === "register") {
        const sub = body.subscription;
        if (
          !sub ||
          typeof sub.endpoint !== "string" ||
          typeof sub.keys?.p256dh !== "string" ||
          typeof sub.keys?.auth !== "string"
        )
          return respond(400, { error: "invalid_subscription" });
        let endpoint;
        try {
          endpoint = new URL(sub.endpoint);
        } catch {
          return respond(400, { error: "invalid_endpoint" });
        }
        if (
          endpoint.protocol !== "https:" ||
          endpoint.hostname !== "web.push.apple.com" ||
          sub.endpoint.length > 2048 ||
          sub.keys.p256dh.length > 512 ||
          sub.keys.auth.length > 512
        )
          return respond(400, { error: "unsupported_push_endpoint" });
        const { data: existing, error: lookupError } = await admin
          .from("push_test_devices")
          .select("user_id")
          .eq("token_hash", token_hash)
          .maybeSingle();
        if (lookupError) return respond(500, { error: "registration_failed" });
        if (existing?.user_id && existing.user_id !== user.id)
          return respond(403, { error: "device_owner_mismatch" });
        const values = {
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth_secret: sub.keys.auth,
          updated_at: new Date().toISOString(),
          last_delivery_status: "not_tested",
          last_delivery_detail: null,
          last_delivery_updated_at: null,
          expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        };
        if (existing) {
          let query = admin
            .from("push_test_devices")
            .update(values)
            .eq("token_hash", token_hash);
          query = existing.user_id
            ? query.eq("user_id", user.id)
            : query.is("user_id", null);
          const { data: bound, error } = await query
            .select("token_hash")
            .maybeSingle();
          if (error) return respond(500, { error: "registration_failed" });
          if (!bound) return respond(403, { error: "device_owner_mismatch" });
        } else {
          const { error } = await admin
            .from("push_test_devices")
            .insert({ token_hash, ...values });
          if (error) return respond(500, { error: "registration_failed" });
        }
        return respond(200, { registered: true });
      }
      if (body.action !== "test")
        return respond(400, { error: "invalid_action" });
      const { data: device, error: deviceError } = await admin
        .from("push_test_devices")
        .select(
          "endpoint,p256dh,auth_secret,last_sent_at,sends_today,send_day,expires_at",
        )
        .eq("token_hash", token_hash)
        .eq("user_id", user.id)
        .maybeSingle();
      if (deviceError) return respond(500, { error: "lookup_failed" });
      if (!device || Date.parse(device.expires_at) < Date.now())
        return respond(404, { error: "device_not_registered" });
      const now = Date.now(),
        day = new Date().toISOString().slice(0, 10);
      if (device.last_sent_at && now - Date.parse(device.last_sent_at) < 120000)
        return respond(429, { error: "wait_two_minutes" });
      if (device.send_day === day && device.sends_today >= 3)
        return respond(429, { error: "daily_limit" });
      const { data: credentials, error: credentialsError } = await admin.rpc(
        "get_push_credentials_for_service",
      );
      if (
        credentialsError ||
        !credentials?.publicKey ||
        !credentials?.privateKey ||
        !credentials?.subject
      )
        return respond(503, { error: "vapid_not_configured" });
      // One SQL transaction locks both the account quota and its device.
      const { data: claim, error: claimError } = await admin.rpc(
        "claim_camino_push_test",
        { p_user_id: user.id, p_token_hash: token_hash },
      );
      if (claimError) return respond(503, { error: "rate_limit_unavailable" });
      if (!claim?.claimed) {
        const code = claim?.error || "test_already_in_progress";
        return respond(
          code === "membership_required"
            ? 403
            : code === "device_not_registered"
              ? 404
              : 429,
          { error: code },
        );
      }
      const task = (async () => {
        await delay(12000);
        try {
          const { data: stillMember, error: recheckError } = await admin
            .from("project_members")
            .select("user_id")
            .eq("project_id", CAMINO_PROJECT_ID)
            .eq("user_id", user.id)
            .maybeSingle();
          if (recheckError || !stillMember) {
            await admin
              .from("push_test_devices")
              .update({
                last_delivery_status: "rejected",
                last_delivery_detail: "membership_revoked",
                last_delivery_updated_at: new Date().toISOString(),
              })
              .eq("token_hash", token_hash)
              .eq("user_id", user.id);
            return;
          }
          webpush.setVapidDetails(
            credentials.subject,
            credentials.publicKey,
            credentials.privateKey,
          );
          await webpush.sendNotification(
            {
              endpoint: device.endpoint,
              keys: { p256dh: device.p256dh, auth: device.auth_secret },
            },
            JSON.stringify({
              title: "Camino 2027 – echter Push",
              body: "Diese Mitteilung wurde vom Server gesendet, während die App geschlossen war.",
            }),
            { TTL: 120 },
          );
          await admin
            .from("push_test_devices")
            .update({
              last_delivery_status: "accepted",
              last_delivery_detail: null,
              last_delivery_updated_at: new Date().toISOString(),
            })
            .eq("token_hash", token_hash)
            .eq("user_id", user.id);
          console.log("Camino push accepted by provider");
        } catch (e) {
          const statusCode =
            e && typeof e === "object" && "statusCode" in e
              ? Number(e.statusCode)
              : 0;
          await admin
            .from("push_test_devices")
            .update({
              last_delivery_status: "rejected",
              last_delivery_detail: statusCode ? String(statusCode) : "unknown",
              last_delivery_updated_at: new Date().toISOString(),
            })
            .eq("token_hash", token_hash)
            .eq("user_id", user.id);
          console.error("Camino push provider error", statusCode || "unknown");
          if (
            e &&
            typeof e === "object" &&
            "statusCode" in e &&
            [404, 410].includes(Number(e.statusCode))
          )
            await admin
              .from("push_test_devices")
              .delete()
              .eq("token_hash", token_hash)
              .eq("user_id", user.id);
        }
      })();
      waitUntil(task);
      return respond(202, { scheduled: true, delaySeconds: 12 });
    } catch {
      return respond(503, { error: "server_unavailable" });
    }
  };
}
