import { getStore } from "@netlify/blobs";

/* The whole library lives under one blob key. Sequences are a few hundred bytes
   each, so a single read/write per request is cheaper and simpler than a key
   per sequence, and it keeps the listing atomic. */
const KEY = "library";
const MAX_SEQUENCES = 300;
const MAX_BODY = 200 * 1024;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default async (req) => {
  let store;
  try {
    store = getStore("neidruns");
  } catch (e) {
    return json({ error: "blob store unavailable: " + e.message }, 500);
  }

  const read = async () => (await store.get(KEY, { type: "json" })) || {};

  try {
    if (req.method === "GET") {
      return json(await read());
    }

    if (req.method === "POST") {
      const raw = await req.text();
      if (raw.length > MAX_BODY) return json({ error: "sequence too large" }, 413);

      let body;
      try { body = JSON.parse(raw); } catch { return json({ error: "bad json" }, 400); }

      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return json({ error: "name required" }, 400);
      if (name.length > 60) return json({ error: "name too long" }, 400);
      if (!body.sequence || typeof body.sequence !== "object") {
        return json({ error: "sequence required" }, 400);
      }

      const lib = await read();
      if (!(name in lib) && Object.keys(lib).length >= MAX_SEQUENCES) {
        return json({ error: "library is full" }, 409);
      }
      lib[name] = { ...body.sequence, savedAt: Date.now() };
      await store.setJSON(KEY, lib);
      return json({ ok: true, names: Object.keys(lib) });
    }

    if (req.method === "DELETE") {
      const name = new URL(req.url).searchParams.get("name");
      if (!name) return json({ error: "name required" }, 400);
      const lib = await read();
      if (!(name in lib)) return json({ ok: true, names: Object.keys(lib) });
      delete lib[name];
      await store.setJSON(KEY, lib);
      return json({ ok: true, names: Object.keys(lib) });
    }

    return json({ error: "method not allowed" }, 405);
  } catch (e) {
    return json({ error: String((e && e.message) || e) }, 500);
  }
};

export const config = { path: "/api/sequences" };
