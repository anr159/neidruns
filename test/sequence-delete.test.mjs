import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

// Run the actual saved-sequences section, without booting the audio editor.
const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const start = html.indexOf("/* ============ saved sequences ============ */");
const end = html.indexOf("let persistT = 0;", start);
assert.ok(start >= 0 && end > start);
const source = html.slice(start, end);
const name = "Neidrūns / retry & delete";
const sequences = { Other: { items: [] }, [name]: { items: [{ id: 1 }] } };

function setup({ shared = true } = {}) {
  const elements = new Map();
  const stored = new Map([["audiotimeline:v1:seqs", JSON.stringify(sequences)]]);
  const requests = [];
  const writes = [];
  const element = id => {
    if (!elements.has(id)) {
      elements.set(id, {
        value: "", textContent: "", options: [], handlers: {},
        addEventListener(type, handler) { this.handlers[type] = handler; },
        appendChild(option) { this.options.push(option); },
        set innerHTML(value) { this.options = [{ value: "" }]; this.value = ""; },
      });
    }
    return elements.get(id);
  };
  const context = vm.createContext({
    window: {},
    document: { getElementById: element, createElement: () => ({}) },
    localStorage: {
      getItem: key => stored.get(key) ?? null,
      setItem: (key, value) => { writes.push(key); stored.set(key, value); },
    },
    fetch: async (url, options) => {
      if (options.method !== "DELETE") {
        return { ok: shared, json: async () => structuredClone(sequences) };
      }
      return new Promise((resolve, reject) => requests.push({ url, options, resolve, reject }));
    },
  });
  vm.runInContext(source, context);
  return {
    context, requests, stored, writes,
    select: element("seqSel"), note: element("storeNote"),
    load: () => vm.runInContext("loadLibrary()", context),
    remove: () => element("del").handlers.click(),
    library: () => JSON.parse(vm.runInContext("JSON.stringify(library)", context)),
  };
}

for (const failure of ["HTTP error", "network rejection"]) {
  test(`shared DELETE: ${failure} preserves selection, then retry succeeds`, async () => {
    const app = setup();
    await app.load();
    app.select.value = name;
    const optionsBefore = app.select.options.map(option => option.value);
    const assertRetained = () => {
      assert.deepEqual(app.library(), sequences);
      assert.equal(app.select.value, name);
      assert.deepEqual(app.select.options.map(option => option.value), optionsBefore);
    };

    const first = app.remove();
    assertRetained(); // The sequence also stays visible while DELETE is pending.
    assert.equal(app.requests.length, 1);
    assert.equal(app.requests[0].url, "/api/sequences?name=" + encodeURIComponent(name));
    if (failure === "HTTP error") app.requests[0].resolve({ ok: false, status: 500 });
    else app.requests[0].reject(new Error("offline"));
    await first;
    assertRetained();
    assert.equal(app.note.textContent, "site delete failed, try again");
    assert.deepEqual(app.writes, []);

    const retry = app.remove();
    assertRetained();
    assert.equal(app.requests.length, 2);
    assert.equal(app.requests[1].url, app.requests[0].url);
    app.requests[1].resolve({ ok: true, status: 200 });
    await retry;
    assert.deepEqual(app.library(), { Other: sequences.Other });
    assert.deepEqual(app.select.options.map(option => option.value), ["", "Other"]);
    assert.equal(app.select.value, "");
    assert.equal(app.note.textContent, "shared with everyone on this site");
    assert.deepEqual(app.writes, []);
  });
}

test("browser-only delete persists the remaining library without a DELETE request", async () => {
  const app = setup({ shared: false });
  await app.load();
  app.select.value = name;
  await app.remove();
  const remaining = { Other: sequences.Other };
  assert.deepEqual(app.library(), remaining);
  assert.deepEqual(JSON.parse(app.stored.get("audiotimeline:v1:seqs")), remaining);
  assert.deepEqual(app.writes, ["audiotimeline:v1:seqs"]);
  assert.equal(app.requests.length, 0);
  assert.deepEqual(app.select.options.map(option => option.value), ["", "Other"]);
  assert.equal(app.select.value, "");
  assert.equal(app.note.textContent, "saved in this browser only");
});
