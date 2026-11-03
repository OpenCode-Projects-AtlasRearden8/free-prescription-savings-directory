#!/usr/bin/env node
// Build script: renders site/index.html from data/cards.json (no dependencies).
// Copyright (c) 2026 Asdale Dynamics, LLC — MIT licensed.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const DATA = resolve(ROOT, "data/cards.json");
const OUT_DIR = resolve(ROOT, "site");
const OUT = resolve(OUT_DIR, "index.html");

const data = JSON.parse(readFileSync(DATA, "utf8"));

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function card(c) {
  return `      <article class="card" id="${esc(c.id)}">
        <h3>${esc(c.name)}</h3>
        <p class="what">${esc(c.what_it_is)}</p>
        <div class="field"><span class="label">Eligibility, in plain English</span><p>${esc(c.eligibility_notes)}</p></div>
        <div class="field"><span class="label">Cost</span><p>${esc(c.cost)}</p></div>
        <div class="field recheck"><span class="label">Recheck by</span><p><strong>${esc(c.recheck_by)}</strong> &mdash; ${esc(c.recheck_how)}</p></div>
        <p class="visit"><a href="${esc(c.url)}" rel="noopener noreferrer" target="_blank">${esc(c.url)}</a></p>
      </article>`;
}

const categorySections = data.categories
  .map(
    (cat) => `    <section class="category" id="cat-${esc(cat.id)}">
      <h2>${esc(cat.name)}</h2>
      <p class="intro">${esc(cat.intro)}</p>
      <div class="cards">
${cat.cards.map(card).join("\n")}
      </div>
    </section>`
  )
  .join("\n");

const tocItems = data.categories
  .map((cat) => `        <li><a href="#cat-${esc(cat.id)}">${esc(cat.name)}</a> <span class="count">(${cat.cards.length})</span></li>`)
  .join("\n");

const notes = Object.entries(data.notes)
  .map(([k, v]) => `<div class="note"><span class="label">${esc(k.replace(/_/g, " "))}</span><p>${esc(v)}</p></div>`)
  .join("\n");

const builtDate = new Date().toISOString().slice(0, 10);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(data.meta.site_title)}</title>
<meta name="description" content="${esc(data.meta.tagline)} Information and navigation only. Never medical advice.">
<meta name="author" content="${esc(data.meta.publisher)}">
<style>
  :root {
    --ink: #1f2a37; --muted: #5b6472; --paper: #fdfaf6; --card: #ffffff;
    --teal: #0f766e; --teal-soft: #e0f2f1; --amber: #92400e; --amber-soft: #fef3c7;
    --line: #e5e1d8; --focus: #b45309;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--paper); color: var(--ink);
    font-family: Georgia, "Times New Roman", serif; line-height: 1.6; }
  header.site { background: var(--teal); color: #fff; padding: 2rem 1rem 1.5rem; text-align: center; }
  header.site h1 { margin: 0 0 .3rem; font-size: 1.9rem; }
  header.site p { margin: 0 auto; max-width: 46rem; opacity: .92; }
  .disclaimer { background: var(--amber-soft); color: var(--amber); border: 1px solid #fcd34d;
    margin: 1.2rem auto; max-width: 60rem; border-radius: .6rem; padding: .9rem 1.2rem; font-size: .98rem; }
  .disclaimer strong { font-weight: 700; }
  main { max-width: 60rem; margin: 0 auto; padding: 1rem 1rem 3rem; }
  nav.toc { background: var(--card); border: 1px solid var(--line); border-radius: .6rem;
    padding: 1rem 1.4rem; margin: 0 0 2rem; }
  nav.toc h2 { margin: 0 0 .5rem; font-size: 1.05rem; color: var(--muted); }
  nav.toc ol { margin: 0; padding-left: 1.4rem; }
  section.category { margin: 0 0 3rem; }
  section.category h2 { font-size: 1.45rem; border-bottom: 2px solid var(--teal);
    padding-bottom: .3rem; margin: 0 0 .4rem; }
  p.intro { color: var(--muted); margin: 0 0 1.2rem; max-width: 56rem; }
  .cards { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr)); }
  article.card { background: var(--card); border: 1px solid var(--line); border-radius: .7rem;
    padding: 1.1rem 1.3rem; box-shadow: 0 1px 3px rgba(0,0,0,.05); }
  article.card h3 { margin: 0 0 .5rem; font-size: 1.15rem; color: var(--teal); }
  p.what { margin: 0 0 .8rem; }
  .field { margin: 0 0 .6rem; }
  .label { display: block; font-family: "Helvetica Neue", Arial, sans-serif;
    font-size: .72rem; text-transform: uppercase; letter-spacing: .08em;
    color: var(--muted); margin-bottom: .15rem; }
  .field p { margin: 0; }
  .field.recheck p strong { color: var(--focus); }
  .field.recheck { background: var(--teal-soft); border-radius: .4rem; padding: .5rem .7rem; }
  p.visit { margin: .8rem 0 0; font-family: "Helvetica Neue", Arial, sans-serif; font-size: .85rem; word-break: break-all; }
  p.visit a { color: var(--teal); font-weight: 600; }
  section.notes { background: var(--card); border: 1px solid var(--line); border-radius: .7rem; padding: 1.1rem 1.3rem; }
  section.notes h2 { margin: 0 0 .8rem; font-size: 1.25rem; }
  .note { margin: 0 0 1rem; }
  .note p { margin: 0; }
  footer.site { border-top: 1px solid var(--line); margin-top: 2rem; padding: 1.5rem 1rem 2.5rem;
    text-align: center; color: var(--muted); font-size: .9rem; }
  footer.site a { color: var(--teal); }
  a:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  @media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
</style>
</head>
<body>
  <header class="site">
    <h1>${esc(data.meta.site_title)}</h1>
    <p>${esc(data.meta.tagline)} Built like a friend would explain it: plain English, step by step, never condescending.</p>
  </header>

  <main>
    <div class="disclaimer" role="note">
      <strong>Not medical advice.</strong> This is an information and navigation directory, nothing more.
      We list programs; we do not diagnose, treat, prescribe, or recommend any medicine or treatment for anyone.
      Your prescriber and licensed pharmacist are the right places for questions about your care. Program rules,
      prices, and links change without notice &mdash; always confirm on the official site before you depend on it.
    </div>

    <nav class="toc" aria-label="Directory sections">
      <h2>What's in this directory</h2>
      <ol>
${tocItems}
      </ol>
    </nav>

${categorySections}

    <section class="notes" id="notes">
      <h2>Good-to-know notes</h2>
${notes}
    </section>
  </main>

  <footer class="site">
    <p><strong>${esc(data.meta.publisher)}</strong> &middot; <a href="${esc(data.meta.publisher_url)}" rel="noopener noreferrer" target="_blank">${esc(data.meta.publisher_url)}</a></p>
    <p>${esc(data.meta.generated_note)} Last built ${esc(builtDate)}. MIT License &mdash; see LICENSE.</p>
    <p>Made with care by ${esc(data.meta.publisher)}. Information and navigation only &mdash; never medical advice.</p>
  </footer>
</body>
</html>
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, html, "utf8");
process.stdout.write(`Built ${OUT} (${html.length} bytes) from ${cat_count(data)} cards.\n`);

function cat_count(d) {
  return d.categories.reduce((n, c) => n + c.cards.length, 0);
}
