# STATUS.md — FreeRx Finder (free-prescription-savings-directory)

Last updated: 2026-11-03

## What was built

A warm, plain-English, fully self-contained static website and supporting
tooling that catalogs free, legitimate ways to lower US prescription cash
prices:

- `data/cards.json` — the source of truth. 22 program cards in 5 categories:
  - Manufacturer savings programs (Lilly Insulin Value Program, NovoCare,
    Sanofi Patient Connection, HealthWell Foundation)
  - National discount card programs (GoodRx, SingleCare, ScriptSave WellRx,
    America's Pharmacy)
  - Pharmacy price-comparison tools (GoodRx, SingleCare, Cost Plus Drugs,
    Amazon Pharmacy, PharmacyChecker)
  - $4 generics & flat-price lists (Walmart $4/$10 program, Kroger Rx Savings
    Club, Publix Rx Marketplace, Albertsons/Safeway flat-price generics)
  - Clinic & assistance databases (NeedyMeds, RxAssist, HRSA Find a Health
    Center, PAN Foundation, 211)
  - Every card has: URL, plain-English "what it is," eligibility notes,
    cost, and a `recheck_by` date plus plan for each recheck
- `build.mjs` — zero-dependency Node build that renders `site/index.html`
  (single self-contained HTML file: inline CSS, no JS served from anywhere,
  no external assets, works offline from `file://` or any static server)
- `tests/test.mjs` — 16 offline tests + optional live link checks
- `README.md` and `LICENSE` (MIT) crediting **Asdale Dynamics, LLC**
- Tone everywhere: friendly explainer voice, prominent "not medical advice,
  never diagnoses" disclaimer in the header, data, and footer

Content accuracy notes (verified against live sources on 2026-11-03):

- Lilly's old `insulinaffordability.com` URL now points at the Lilly Insulin
  Value Program (`insulins.lilly.com/lilly-insulin-value-program`); card
  updated with the $35/month program and its government-insurance exclusion
- Walmart's $4 page moved to `/cp/4-prescriptions/1078664`; card updated and
  reworded to "starting at $4" pricing with tiers
- Publix retired its free-medications program in 2022; card replaced with
  Publix Rx Marketplace at the confirmed-live savings URL
- Kroger Rx Savings Club card updated with 2026 fee structure ($36/$72) and
  linked to GoodRx's current explainer (Kroger's own enrollment pages were
  unreachable from this environment)
- The PhRMA Medicine Assistance Tool was unreachable from this environment,
  so it was replaced with HealthWell Foundation (verified live)
- PAN Foundation card reflects its 2026 merger with Patient Advocate
  Foundation and TRICARE/Medicaid eligibility expansion

## How to run it

```bash
npm run build      # regenerate site/index.html from data/cards.json
npm test           # validate data, rebuild, run all offline tests
npm run test:live  # optional: + network re-check of every program URL
```

To view: open `site/index.html` in any browser, or
`python3 -m http.server 8080 --directory site` and visit
http://localhost:8080. Requires Node.js (built and tested on v20.19.2); no
dependencies to install.

## Verification results

- `npm test`: **16 passed, 0 failed** (2026-11-03)
  - validates JSON schema, unique kebab-case ids, clean https URLs, future
    recheck dates, building reality-checks every card's name/link/date in the
    generated HTML, escaping/injection check, safe external links
    (`rel="noopener noreferrer"`), doctype/structure, disclaimer language,
    Asdale credit, and no-secrets/no-personal-data patterns
- `npm run test:live`: **30 passed, 0 failed, 6 warnings** (2026-11-03)
  - warnings are HTTP 403 bot-walls, not dead links: Lilly, SingleCare,
    WellRx, America's Pharmacy, Cost Plus Drugs, PAN Foundation — all six
    were confirmed alive and correct in an ordinary browser context during
    content review (and/or are currently indexed/rated live by independent
    checks); HTTP 403 is treated as a warning, not a failure, for exactly
    this reason
- HTML structural check (Python html.parser): 22 `<article>` cards, 5
  category sections + notes, all tags balanced, no markup mismatch,
  rendered text contains the disclaimer and publisher credit
- Git: initialized, single root commit `d3e2479` by the existing git
  identity, no co-author trailers, nothing pushed, no remotes

## Known gaps

- **Automated 403 warnings**: some sites block all non-browser traffic, so
  `npm run test:live` reports them as warnings. The test cannot confirm a
  page's *content*, only reachability — human rechecks listed in each card's
  `recheck_how` remain necessary.
- **Prices drift fast**: GLP-1/savings-program prices and membership fees
  change often (Lilly card expires 12/31/2026, for example). The recheck-date
  system puts maintenance burden where it belongs, but nothing here can
  self-update program prices.
- **Albertsons/Safeway**: no published flat-price list was verifiable at
  build time; the card intentionally says "ask in store" until a recheck
  resolves it.
- **Directory is US-focused by design** (per project scope) and lists the
  most broadly useful free programs only; specialty pharmacy and
  state-specific programs are fair-game future cards.
- **No search/filter UI in the page itself**: the single-page card layout is
  intentionally low-tech; a client-side text filter would be a natural
  small upgrade.
- **Licenses tested only at entry**: the test checks that HTML/JSON contain
  no secret-like strings or SSN patterns; nothing scans git history or other
  file types beyond project files that exist here (there are none beyond
  HTML in `site/`).
