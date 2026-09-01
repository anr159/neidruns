
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/sequences.mjs
import { getStore } from "@netlify/blobs";
var KEY = "library";
var MAX_SEQUENCES = 300;
var MAX_BODY = 200 * 1024;
var json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store" }
});
var sequences_default = async (req) => {
  let store;
  try {
    store = getStore("neidruns");
  } catch (e) {
    return json({ error: "blob store unavailable: " + e.message }, 500);
  }
  const read = async () => await store.get(KEY, { type: "json" }) || {};
  try {
    if (req.method === "GET") {
      return json(await read());
    }
    if (req.method === "POST") {
      const raw = await req.text();
      if (raw.length > MAX_BODY) return json({ error: "sequence too large" }, 413);
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return json({ error: "bad json" }, 400);
      }
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
    return json({ error: String(e && e.message || e) }, 500);
  }
};
var config = { path: "/api/sequences" };
export {
  config,
  sequences_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvc2VxdWVuY2VzLm1qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgZ2V0U3RvcmUgfSBmcm9tIFwiQG5ldGxpZnkvYmxvYnNcIjtcclxuXHJcbi8qIFRoZSB3aG9sZSBsaWJyYXJ5IGxpdmVzIHVuZGVyIG9uZSBibG9iIGtleS4gU2VxdWVuY2VzIGFyZSBhIGZldyBodW5kcmVkIGJ5dGVzXHJcbiAgIGVhY2gsIHNvIGEgc2luZ2xlIHJlYWQvd3JpdGUgcGVyIHJlcXVlc3QgaXMgY2hlYXBlciBhbmQgc2ltcGxlciB0aGFuIGEga2V5XHJcbiAgIHBlciBzZXF1ZW5jZSwgYW5kIGl0IGtlZXBzIHRoZSBsaXN0aW5nIGF0b21pYy4gKi9cclxuY29uc3QgS0VZID0gXCJsaWJyYXJ5XCI7XHJcbmNvbnN0IE1BWF9TRVFVRU5DRVMgPSAzMDA7XHJcbmNvbnN0IE1BWF9CT0RZID0gMjAwICogMTAyNDtcclxuXHJcbmNvbnN0IGpzb24gPSAoYm9keSwgc3RhdHVzID0gMjAwKSA9PlxyXG4gIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeShib2R5KSwge1xyXG4gICAgc3RhdHVzLFxyXG4gICAgaGVhZGVyczogeyBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiwgXCJjYWNoZS1jb250cm9sXCI6IFwibm8tc3RvcmVcIiB9LFxyXG4gIH0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgKHJlcSkgPT4ge1xyXG4gIGxldCBzdG9yZTtcclxuICB0cnkge1xyXG4gICAgc3RvcmUgPSBnZXRTdG9yZShcIm5laWRydW5zXCIpO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJldHVybiBqc29uKHsgZXJyb3I6IFwiYmxvYiBzdG9yZSB1bmF2YWlsYWJsZTogXCIgKyBlLm1lc3NhZ2UgfSwgNTAwKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHJlYWQgPSBhc3luYyAoKSA9PiAoYXdhaXQgc3RvcmUuZ2V0KEtFWSwgeyB0eXBlOiBcImpzb25cIiB9KSkgfHwge307XHJcblxyXG4gIHRyeSB7XHJcbiAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJHRVRcIikge1xyXG4gICAgICByZXR1cm4ganNvbihhd2FpdCByZWFkKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZXEubWV0aG9kID09PSBcIlBPU1RcIikge1xyXG4gICAgICBjb25zdCByYXcgPSBhd2FpdCByZXEudGV4dCgpO1xyXG4gICAgICBpZiAocmF3Lmxlbmd0aCA+IE1BWF9CT0RZKSByZXR1cm4ganNvbih7IGVycm9yOiBcInNlcXVlbmNlIHRvbyBsYXJnZVwiIH0sIDQxMyk7XHJcblxyXG4gICAgICBsZXQgYm9keTtcclxuICAgICAgdHJ5IHsgYm9keSA9IEpTT04ucGFyc2UocmF3KTsgfSBjYXRjaCB7IHJldHVybiBqc29uKHsgZXJyb3I6IFwiYmFkIGpzb25cIiB9LCA0MDApOyB9XHJcblxyXG4gICAgICBjb25zdCBuYW1lID0gdHlwZW9mIGJvZHkubmFtZSA9PT0gXCJzdHJpbmdcIiA/IGJvZHkubmFtZS50cmltKCkgOiBcIlwiO1xyXG4gICAgICBpZiAoIW5hbWUpIHJldHVybiBqc29uKHsgZXJyb3I6IFwibmFtZSByZXF1aXJlZFwiIH0sIDQwMCk7XHJcbiAgICAgIGlmIChuYW1lLmxlbmd0aCA+IDYwKSByZXR1cm4ganNvbih7IGVycm9yOiBcIm5hbWUgdG9vIGxvbmdcIiB9LCA0MDApO1xyXG4gICAgICBpZiAoIWJvZHkuc2VxdWVuY2UgfHwgdHlwZW9mIGJvZHkuc2VxdWVuY2UgIT09IFwib2JqZWN0XCIpIHtcclxuICAgICAgICByZXR1cm4ganNvbih7IGVycm9yOiBcInNlcXVlbmNlIHJlcXVpcmVkXCIgfSwgNDAwKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbGliID0gYXdhaXQgcmVhZCgpO1xyXG4gICAgICBpZiAoIShuYW1lIGluIGxpYikgJiYgT2JqZWN0LmtleXMobGliKS5sZW5ndGggPj0gTUFYX1NFUVVFTkNFUykge1xyXG4gICAgICAgIHJldHVybiBqc29uKHsgZXJyb3I6IFwibGlicmFyeSBpcyBmdWxsXCIgfSwgNDA5KTtcclxuICAgICAgfVxyXG4gICAgICBsaWJbbmFtZV0gPSB7IC4uLmJvZHkuc2VxdWVuY2UsIHNhdmVkQXQ6IERhdGUubm93KCkgfTtcclxuICAgICAgYXdhaXQgc3RvcmUuc2V0SlNPTihLRVksIGxpYik7XHJcbiAgICAgIHJldHVybiBqc29uKHsgb2s6IHRydWUsIG5hbWVzOiBPYmplY3Qua2V5cyhsaWIpIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZXEubWV0aG9kID09PSBcIkRFTEVURVwiKSB7XHJcbiAgICAgIGNvbnN0IG5hbWUgPSBuZXcgVVJMKHJlcS51cmwpLnNlYXJjaFBhcmFtcy5nZXQoXCJuYW1lXCIpO1xyXG4gICAgICBpZiAoIW5hbWUpIHJldHVybiBqc29uKHsgZXJyb3I6IFwibmFtZSByZXF1aXJlZFwiIH0sIDQwMCk7XHJcbiAgICAgIGNvbnN0IGxpYiA9IGF3YWl0IHJlYWQoKTtcclxuICAgICAgaWYgKCEobmFtZSBpbiBsaWIpKSByZXR1cm4ganNvbih7IG9rOiB0cnVlLCBuYW1lczogT2JqZWN0LmtleXMobGliKSB9KTtcclxuICAgICAgZGVsZXRlIGxpYltuYW1lXTtcclxuICAgICAgYXdhaXQgc3RvcmUuc2V0SlNPTihLRVksIGxpYik7XHJcbiAgICAgIHJldHVybiBqc29uKHsgb2s6IHRydWUsIG5hbWVzOiBPYmplY3Qua2V5cyhsaWIpIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBqc29uKHsgZXJyb3I6IFwibWV0aG9kIG5vdCBhbGxvd2VkXCIgfSwgNDA1KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXR1cm4ganNvbih7IGVycm9yOiBTdHJpbmcoKGUgJiYgZS5tZXNzYWdlKSB8fCBlKSB9LCA1MDApO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBjb25maWcgPSB7IHBhdGg6IFwi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
