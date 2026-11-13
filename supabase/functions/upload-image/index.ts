import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Uploads a product photo to the public "products" bucket.
// Auth: the admin session token issued by the admin_login() database function.
// Deployed with verify_jwt = false because it checks that token itself.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const token = req.headers.get("x-admin-token") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(token)) return json({ error: "unauthorized" }, 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: ok, error: authErr } = await supabase.rpc("admin_token_valid", { p_token: token });
  if (authErr || !ok) return json({ error: "unauthorized" }, 401);

  const type = (req.headers.get("content-type") ?? "").split(";")[0].trim();
  const ext = TYPES[type];
  if (!ext) return json({ error: "unsupported_type" }, 415);

  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024) return json({ error: "bad_size" }, 413);

  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("products").upload(path, bytes, { contentType: type, cacheControl: "31536000" });
  if (error) return json({ error: error.message }, 500);

  return json({ url: supabase.storage.from("products").getPublicUrl(path).data.publicUrl });
});
