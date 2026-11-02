import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
import { createPushDeviceHandler } from "./handler.mjs";
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };
Deno.serve(
  createPushDeviceHandler({
    createClient,
    webpush,
    env: (name: string) => Deno.env.get(name),
    waitUntil: (task: Promise<unknown>) => EdgeRuntime.waitUntil(task),
  }),
);
