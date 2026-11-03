#!/usr/bin/env node
// Test suite: validates cards.json, runs the build, and tests the generated site.
// No dependencies. Run: npm test  (or: node tests/test.mjs)
// Live network checks are OFF by default; enable with --live.
// Copyright (c) 2026 Asdale Dynamics, LLC — MIT licensed.

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = resolve(ROOT, "data/cards.json");
const SITE_INDEX = resolve(ROOT, "site/index.html");

let passed = 0;
let failed = 0;
let warn = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    process.stdout.write(`  ok  ${name}\n`);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    process.stdout.write(`FAIL  ${name}\n      ${err.message}\n`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Same escaping as build.mjs, so tests compare what the build actually renders.
function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ---------- load data ----------
assert(existsSync(DATA), "data/cards.json does not exist");
const data = JSON.parse(readFileSync(DATA, "utf8"));

const REQUIRED_CARD_FIELDS = [
  "id", "name", "url", "what_it_is", "eligibility_notes", "cost", "recheck_by", "recheck_how",
];
const seenIds = new Set();

// ---------- tests: JSON structure ----------
test("cards.json: site_title and tagline exist", () => {
  assert(typeof data.meta?.site_title === "string" && data.meta.site_title.length > 0, "missing meta.site_title");
  assert(typeof data.meta?.tagline === "string" && data.meta.tagline.length > 0, "missing meta.tagline");
});

test("cards.json: publisher is Asdale Dynamics, LLC", () => {
  assert(data.meta?.publisher?.includes("Asdale Dynamics, LLC"), "publisher must credit Asdale Dynamics, LLC");
});

test("cards.json: has categories with cards", () => {
  assert(Array.isArray(data.categories) && data.categories.length >= 4, "expected >= 4 categories");
  for (const cat of data.categories) {
    assert(cat.id && cat.name && typeof cat.intro === "string", `category ${cat.id} missing name/intro`);
    assert(Array.isArray(cat.cards) && cat.cards.length >= 1, `category ${cat.id} has no cards`);
  }
});

test("cards.json: every card has required fields", () => {
  for (const cat of data.categories) {
    for (const card of cat.cards) {
      for (const field of REQUIRED_CARD_FIELDS) {
        assert(
          typeof card[field] === "string" && card[field].trim().length > 0,
          `card '${card.id}' missing field '${field}'`
        );
      }
    }
  }
});

test("cards.json: card ids are unique kebab-case", () => {
  for (const cat of data.categories) {
    for (const card of cat.cards) {
      assert(/^[a-z0-9-]+$/.test(card.id), `card id '${card.id}' is not kebab-case`);
      assert(!seenIds.has(card.id), `duplicate card id '${card.id}'`);
      seenIds.add(card.id);
    }
  }
});

test("cards.json: urls are https; no duplicate url within a category", () => {
  const perCategory = new Set();
  for (const cat of data.categories) {
    perCategory.clear();
    for (const card of cat.cards) {
      assert(/^https:\/\/[^\s"<>]+$/.test(card.url), `card '${card.id}' url is not a clean https URL: ${card.url}`);
      assert(!perCategory.has(card.url), `duplicate url '${card.url}' within category '${cat.id}'`);
      perCategory.add(card.url);
    }
  }
});

test("cards.json: recheck dates are valid and in the future", () => {
  const today = new Date().toISOString().slice(0, 10);
  for (const cat of data.categories) {
    for (const card of cat.cards) {
      assert(/^\d{4}-\d{2}-\d{2}$/.test(card.recheck_by), `card '${card.id}' recheck_by must be YYYY-MM-DD`);
      assert(!Number.isNaN(Date.parse(card.recheck_by)), `card '${card.id}' recheck_by is not a real date`);
      assert(card.recheck_by >= today, `card '${card.id}' recheck date ${card.recheck_by} is in the past`);
    }
  }
});

test("cards.json: \"no medical advice\" language is present somewhere", () => {
  const blob = JSON.stringify(data).toLowerCase();
  assert(
    blob.includes("not medical advice") || blob.includes("never medical advice"),
    "data must carry the no-medical-advice message"
  );
});

// ---------- build ----------
process.stdout.write("\nRunning build...\n");
execFileSync(process.execPath, [resolve(ROOT, "build.mjs")], { cwd: ROOT, stdio: "inherit" });
assert(existsSync(SITE_INDEX), "build did not produce site/index.html");
const html = readFileSync(SITE_INDEX, "utf8");

// ---------- tests: generated site ----------
test("site/index.html: contains every card link", () => {
  for (const cat of data.categories) {
    for (const card of cat.cards) {
      assert(html.includes(card.url), `generated HTML is missing link ${card.url}`);
    }
  }
});

test("site/index.html: contains every card name and recheck date", () => {
  for (const cat of data.categories) {
    for (const card of cat.cards) {
      assert(html.includes(esc(card.name)), `generated HTML is missing card name '${card.name}'`);
      assert(html.includes(card.recheck_by), `generated HTML is missing recheck date for '${card.id}'`);
    }
  }
});

test("site/index.html: hard disclaimer is present", () => {
  assert(/not medical advice/i.test(html), "site must say 'not medical advice'");
  assert(/diagnos/i.test(html), "site must explicitly mention it does not diagnose");
});

test("site/index.html: credits Asdale Dynamics, LLC", () => {
  assert(html.includes("Asdale Dynamics, LLC"), "site must credit Asdale Dynamics, LLC");
});

test("site/index.html: no unescaped raw HTML from data (injection check)", () => {
  // Every data string must appear only in escaped form, exactly as build should render it.
  for (const cat of data.categories) {
    for (const card of cat.cards) {
      for (const field of ["name", "what_it_is", "eligibility_notes"]) {
        const raw = card[field];
        if (esc(raw) !== raw) {
          assert(html.includes(esc(raw)), `field '${field}' of card '${card.id}' not properly escaped`);
        }
        if (raw.includes("<") && html.includes(raw)) {
          throw new Error(`raw '<' from card '${card.id}' leaked into HTML unescaped`);
        }
      }
    }
  }
});

test("site/index.html: links are safe (rel noopener noreferrer on external links)", () => {
  const anchors = html.match(/<a [^>]*href="https?:[^"]*"[^>]*>/g) || [];
  assert(anchors.length > 0, "expected external anchor tags");
  for (const a of anchors) {
    assert(a.includes('rel="noopener noreferrer"'), `external anchor missing safe rel: ${a}`);
  }
});

test("site/index.html: valid basic structure", () => {
  assert(html.startsWith("<!DOCTYPE html>"), "missing doctype");
  assert(/<html lang="en">/.test(html), "missing lang attribute");
  assert(html.includes("</html>"), "unclosed html document");
  assert(/<meta name="viewport"/.test(html), "missing viewport meta");
  assert((html.match(/<article class="card"/g) || []).length === seenIds.size, "article count does not match card count");
});

test("site/index.html: no secrets or personal data patterns", () => {
  assert(!/(api[_-]?key|secret|password|token)\s*[:=]/i.test(html), "suspicious secret-like string in HTML");
  assert(!/\b\d{3}-\d{2}-\d{4}\b/.test(html), "SSN-like pattern found in HTML");
});

// ---------- optional live link test ----------
if (process.argv.includes("--live")) {
  process.stdout.write("\nLive network checks enabled (--live)...\n");
  const urls = new Map(); // url -> [cardIds]
  for (const cat of data.categories) {
    for (const card of cat.cards) {
      if (!urls.has(card.url)) urls.set(card.url, []);
      urls.get(card.url).push(card.id);
    }
  }
  for (const [url, ids] of urls) {
    let ok = false;
    let res403 = false;
    let detail = "";
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 FreeRxFinder-link-check/1.0" } });
      clearTimeout(timer);
      ok = res.status < 400;
      res403 = res.status === 403;
      detail = `HTTP ${res.status}`;
      if (!ok) detail += ` (redirects to ${res.url})`;
    } catch (err) {
      detail = `network error: ${err.message}`;
    }
    if (ok) {
      passed++;
      process.stdout.write(`  ok  live: ${ids.join(",")} -> ${detail}\n`);
    } else if (res403) {
      warn++;
      process.stdout.write(`warn  live: ${ids.join(",")} -> ${detail} (site reachable but blocked automated access; verify in a browser before relying on the link)\n`);
    } else {
      failed++;
      failures.push({ name: `live: ${url}`, err: new Error(detail) });
      process.stdout.write(`FAIL  live: ${ids.join(",")} -> ${detail}\n`);
    }
  }
}

// ---------- summary ----------
process.stdout.write(`\n${passed} passed, ${failed} failed, ${warn} warnings\n`);
if (failed > 0) {
  process.exit(1);
}
