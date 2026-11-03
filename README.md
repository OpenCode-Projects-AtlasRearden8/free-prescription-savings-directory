# FreeRx Finder — Free & Legit Ways to Pay Less for Prescriptions

A warm, plain-English, static directory of free and legitimate ways to lower US prescription cash prices:

- **Manufacturer savings programs** (who qualifies, and the big Medicare/Medicaid copay-card rule)
- **National discount-card programs** (GoodRx, SingleCare, WellRx, and friends)
- **Pharmacy price-comparison tools** (including mail-order cash-price options)
- **$4 generics & flat-price lists** (Walmart, Kroger, Publix, Albertsons/Safeway)
- **Clinic & assistance databases** (NeedyMeds, RxAssist, HRSA health centers, PAN, 211)

Every card includes **plain-English eligibility notes** and a **recheck date** so the directory stays honest about when each fact was last planned for review.

**This is information and navigation only. It is never medical advice, and it never diagnoses, treats, or prescribes.** Your prescriber and licensed pharmacist are the right people for questions about your care. Program rules, prices, and links change without notice — always confirm on the official site.

Published by **Asdale Dynamics, LLC** — explaining AI and life admin "like a friend would" at [dylanasdale.github.io](https://dylanasdale.github.io).

## How it works

- `data/cards.json` — the source of truth: every program, plain-English note, and recheck date
- `build.mjs` — a zero-dependency Node script that renders `site/index.html` from the cards
- `tests/test.mjs` — validates the JSON, rebuilds the site, and tests the output (link presence, disclaimer language, escaping, structure, no-secrets checks)

No frameworks, no build dependencies, no tracking, no secrets, no personal data. The generated site is a single static HTML file that works offline.

## Run it

```bash
npm run build     # regenerates site/index.html from data/cards.json
npm test          # validates data, rebuilds, and runs all offline tests
npm run test:live # optional: also re-fetches each program URL over the network
```

To view the site, open `site/index.html` in any browser — double-click it, or:

```bash
node build.mjs && (python3 -m http.server 8080 --directory site)
# then visit http://localhost:8080
```

## Recheck policy

Each card carries a `recheck_by` date (YYYY-MM-DD). When you recheck a program, update the `recheck_by` date and any changed details in `data/cards.json`, run `npm test`, and rebuild. The tests fail if any card's recheck date is in the past, so stale entries surface themselves.

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Asdale Dynamics, LLC.
