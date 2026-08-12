# NCyTE / EPNC — Unified Design System

**AI Fundamentals for Educators** · v1.0 · 2026-08-07

The single source of truth for all 38 pages. `ncyte.css` and `ncyte.js` are the
implementation; `_template.html` is the page contract; this document is the why.

---

## 1 · What this replaces

The site was not one design that drifted. It was **five separately-authored
generations sharing a folder**, each cloned from a different ancestor. They
correlated perfectly across four independent signals:

| Generation | Files | Font URL | Storage key | Dark palette |
|---|---|---|---|---|
| G0 Legacy Navy | module01–10, graphics_gallery | Inter only | — | none |
| G1 Canonical | index, index_tx, evaluation | Inter + Lora | — | none |
| G2 Warm Sepia | 18 resource pages | Inter + Lora | `ai-theme` | `#1a1612` |
| G3 Teal | aiactivities, aiprompts, aitools, assessment, types | Inter 400–700 | `theme` | `#111816` |
| G3b Slate | aiconcepts | Inter + Lora | `sands-ai-theme` | `#14181f` |

**The light palette was already 95% unified** — 24 files carried byte-identical
values to `index.html` under different variable names. Light mode was a rename,
not a recolor. The real work was dark mode (three incompatible palettes, 14
files with none) and component naming.

---

## 2 · Architecture

**Hybrid.** Every page links the shared stylesheet *and* inlines a small
critical block:

```html
<link rel="stylesheet" href="ncyte.css">
<style>/* tokens + reset + header shell only */</style>
<script src="ncyte.js" defer></script>
```

Why not pure external: the module pages embed resources in iframes,
`iframe.html` generates LMS embed codes, and `animation.html` exports
standalone HTML. A page downloaded and dropped into Canvas must still look
intentional. The inline block is a **floor, not a copy** — do not expand it.

**Anti-flash.** A blocking inline script in `<head>` sets `data-theme` before
first paint, mirroring `ncyte.js`'s resolution order. Without it, `defer` means
dark-mode users see a white flash on every navigation.

Savings: ~589 KB of CSS across 38 pages becomes ~30 KB shared + ~5 KB per page.

---

## 3 · Tokens

Vocabulary follows the resource-page convention (`--bg` / `--surface` / `--ink`
/ `--accent`) because 24 of 38 files already used it. The **values** are
`index.html`'s, which is the canonical look.

### Retired

- `--navy` / `--cyan` / `--cyan-bright` / `--text` / `--text-mid` / `--text-muted`
- The entire G0 palette: `#0d2240 #16325e #0099bb #00b4d8 #e8f4fb #111827 #374151 #6b7280 #e2eaf3`
- Five orphan `rgba(0,180,216,…)` rules in `index.html` — the ghost of a cyan
  that file no longer defines
- Four `rgba(13,34,64,…)` shadows in `index.html` — carrying a navy that no
  longer exists there
- `--orange #e8700f` / `--orange-light #f4821f` **as button backgrounds**

### Contrast fixes

Every colour pair is checked. These were failing:

| Token / pair | Was | Now | Why |
|---|---|---|---|
| `--ink-muted` | `#7a8693` @ **3.36:1** | `#616c7a` @ **4.83:1** | Failed AA on *every* surface, and carried real copy (stat labels, subheadings, card taglines) |
| Submit CTA | white on `#f4821f` @ **2.61:1** | white on `--action #c2410c` @ **5.18:1** | The largest CTA on the site |
| Skip link | white on `#e8700f` @ **3.11:1** | `--action` @ **5.18:1** | |
| Module 3 accent | `#22c55e` @ **2.28:1** | `#15803d` @ **5.02:1** | Worst colour in the corpus |
| Module 6 back-link | `#1f2933` on `#4f46e5` @ **2.35:1** | white on `#4338ca` @ **7.90:1** | |
| Form borders | `--border` @ **1.33:1** | `--border-strong #948872` @ **3.49:1** | WCAG 1.4.11 |
| On-navy eyebrows | `rgba(255,255,255,.32)` @ **2.82:1** | `--ink-on-dark-2` @ **7.9:1** | |

`--ink-faint #7a8693` survives for **decorative use only** — never body copy.

`--accent-bright #14b8a6` is **on-dark only**: 5.93:1 on `--panel-invert`, but
2.49:1 on white. Using it as light-mode text is the single easiest way to
reintroduce a failure.

### Dark theme

Three darks disagreed on temperature: sepia (18 files), green-black (5),
blue-slate (1). Settled on a warm graphite that reads as *paper at night*, with
the accent at `#2dd4bf` — the only value clearing 4.5:1 against every dark
surface here (`#14b8a6` is 4.47:1 against `--panel-invert-2`, just under).

Mechanical migration map:

| G2 sepia | G3 teal | G3b slate | → |
|---|---|---|---|
| `#1a1612` | `#111816` | `#14181f` | `#141a17` |
| `#24201a` | `#1a2220` | `#1b212b` | `#1b2320` |
| `#2e2920` | `#1f2d2b` | `#232a36` | `#232d29` |
| `#f0ebe2` | `#f0fdf9` | `#f1ede4` | `#eef2ef` |
| `#c4b89a` | `#a7c5bf` | `#c2c7d0` | `#bcc6c1` |
| `#8b7d6b` | `#6b9e97` | `#8b94a3` | `#8e9a95` |
| `#3a342c` | `#2a3d3a` | `#2d3441` | `#2e3a35` |
| `#14b8a6` | `#2dd4bf` | `#5eead4` | `#2dd4bf` |

Also: `--bg-elev`→`--surface`, `--line`→`--border`, `--ink-mute`→`--ink-muted`
(that missing "d" in `aiconcepts.html` would have failed silently).

### Module accents

Ten hues, two lightness stops (700-level light / 400-level dark), all ≥4.5:1.
Set via `<body data-module="N">`, which tints the whole page in both themes.

**This also fixes a real brand break:** modules 4–10 wore one colour on their
index card and a *different* colour on their own page. One scale now drives
both.

---

## 4 · The six page types

Forcing 26 resources into one mould would destroy what already works. Six
recognizable patterns, marked on-page by `.type-badge`:

| Type | Members | Purpose |
|---|---|---|
| **Concept Lesson** | ai_fundamentals, ai_rationale, ai_tokens, ed_ai | Conceptual grounding |
| **Critical Brief** | integrity, detection, cruch_tool, resistant, remix | Evaluation, belief change |
| **Faculty Workshop** | aiprompts, aiactivities, assessment, aitools | Application; produces an artifact |
| **Walkthrough** | gh_basic, gh_setup, graphics | Procedural skill |
| **Tool** | iframe, animation | Job aid |
| **Reference** | aiconcepts, ai_myths, ai_tools, llm_comp, galery | Lookup and browse |

### Required (●) / optional (○) sections

| Section | Concept | Critical | Workshop | Walkthrough | Tool | Reference |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Context header + breadcrumb | ● | ● | ● | ● | ● | ● |
| Hero + learner metadata | ● | ● | ● | ● | ● | ● |
| Why this matters | ● | ● | ● | ● | ● | ○ |
| Objectives | ● | ● | ● | ● | ○ | ○ |
| *How to use this page* | – | – | – | – | ○ | **●** |
| *Prerequisites* | ○ | – | ○ | **●** | ○ | – |
| *End-state preview* | – | – | ○ | **●** | **●** | – |
| *Key terms glossary* | ○ | ○ | **●** | ○ | – | ○ |
| Roadmap | ● | ● | ● | ● | ○ | ● |
| Core content (≤7 blocks) | ● | ● | ● | ● | ○ | ● |
| *Selection heuristic* | – | ○ | – | – | – | **●** |
| Worked example / contrast case | ● | **●** | ● | ● | **●** | ○ |
| *Troubleshooting* | – | – | ○ | **●** | ○ | – |
| *Quality criteria* | – | – | ● | ○ | **●** | – |
| Knowledge check | ● | **●** | ● | ● | ○ | ○ |
| *Self-assessment checklist* | ○ | **●** | ● | ● | – | – |
| Transfer to your classroom | ○ | **●** | **●** | ● | ○ | ○ |
| *Group discussion* | ○ | ● | **●** | ○ | – | – |
| Key takeaways | ● | ● | ● | ● | ○ | ○ |
| Next steps / back to module | ● | ● | ● | ● | ● | ● |

**Objectives and takeaways must be 1:1** — same count, same order. That makes
alignment auditable on the page itself.

Reference implementations already in the corpus: Concept → `ai_tokens.html`
(analogy-first structure); Critical → `integrity.html` (the only page closing
with both a checklist and concrete next steps); Workshop → `aiprompts.html`;
Walkthrough → `gh_basic.html` (checklist + troubleshooting); Reference →
`ai_myths.html` (card schema + stated evidence standard) and `llm_comp.html`
(six-factor selection framework).

---

## 5 · Class-name canon

Verbose names win — 2:1 in file count and self-documenting. Six files used
abbreviated twins of the *same* component library with byte-identical CSS
values but incompatible selectors.

| Concept | Canonical | Retired |
|---|---|---|
| card | `.lesson-card` | `.lcard`, `.topic-card`, `.concept-card` |
| eyebrow / title / desc / cta | `.card-eyebrow` `.card-title` `.card-desc` `.card-cta` | `.cey` `.ctitle` `.cdesc` `.ccta` |
| detail panel | `.detail-panel` | `.dpanel`, `.panel` |
| detail header | `.detail-header` `.detail-header__left` | `.dhdr` `.dhdr-l` |
| accent bar | `.detail-accent-bar` | `.dbar` |
| number / title / close | `.detail-number` `.detail-title` `.detail-close` | `.dnum` `.dtitle` `.dclose` `.close-btn` |
| body | `.detail-body` | `.dbody` `.dp` `.dh3` |
| example | `.example-box` `.example-label` | `.ebox` `.elbl` `.etxt` |
| brand | `.header-brand__icon` `__text` `__title` `__sub` | `.hbrand*`, `.brand-*` |
| header rules | `.header-sep` `.header-back` `.header-spacer` | `.hsep` `.hback` `.hspacer` `.back-link` `.home-link` |
| toggle | `.theme-toggle` + `data-theme-toggle` | `.htoggle`, `#tt` |
| footer | `.site-footer__inner` | `.fl` `.fr` |
| hero | `.page-lede` | `.lede` |
| stats | `.stat-card` `.stat-value` `.stat-label` | `.scard` `.sval` `.slbl` |
| per-card accent | `--card-accent` | `--ca` `--card-color` `--panel-color` `--mod-accent` |

### Consolidated values

| Thing | Was | Now |
|---|---|---|
| Header height | 62 / 64 / 68px | **64px** |
| Container | 1000 / 1060 / 1100 / 1200px | **1100** shell, **1000** prose |
| Radius | 12px (23 files) / 14px (4) + 9 pill values | **`--r-md 12px`** + `--r-pill` |
| Flip easing | `(.4,.2,.2,1)` @ .55s/.65s vs `(.4,0,.2,1)` @ .55s | **`(.4,0,.2,1)` @ .6s** |
| Storage key | `ai-theme` / `theme` / `sands-ai-theme` | **`ncyte-theme`** |
| Font link | 4 variants | **one** (Inter 400–800 + Lora) |
| Font sizes | 38 distinct values | 11 semantic steps |

---

## 6 · Behaviour

`ncyte.js` is declarative. Markup opts in via `data-*`; there are no inline
`onclick` handlers.

| Widget | Attribute |
|---|---|
| Theme toggle | `data-theme-toggle` |
| Card → panel | `data-card="slug"` + `data-panel="slug"` |
| Flip card | `data-flip` |
| Knowledge check | `data-check`, `data-correct`, `data-feedback-ok` / `-no` |
| Copy to clipboard | `data-copy="#selector"` |
| Lightbox | `data-lightbox data-src data-title` |
| Scroll reveal | `data-reveal` |
| Count-up stat | `data-count-to="97"` |
| Checklist progress | `data-progress` |
| Sidebar | `data-sidebar-toggle` |

**Theme now survives navigation.** One key, plus `storage`-event sync across
tabs and `postMessage` sync between a module shell and the resource in its
iframe. Previously, toggling dark on `detection.html` and clicking through to
`types.html` put you back in light mode.

`localStorage` is guarded — unguarded access throws in Safari private mode and
in sandboxed iframes, which is exactly how the modules embed these pages. Only
1 of 25 theme-bearing files had a `try/catch`.

---

## 7 · Accessibility

Fixed corpus-wide:

- **`role="listitem"` on `<button>`** — 17 files. Overrode the button role, so
  screen readers announced "list item", and `aria-expanded` on a `listitem` is
  invalid and dropped. Now plain `<button>`.
- **Hover-triggered flip cards** — 4 files. Unusable on touch; fails WCAG
  1.4.13. Hover-flip removed; click and Enter/Space only, with `aria-pressed`.
- **Contrast** — see §3.
- **Focus** — one treatment: `3px solid var(--focus)` at `offset: 3px`. The
  2px variants failed WCAG 2.4.13.
- **Skip link** — was missing on 6 files; now on all.
- **`prefers-reduced-motion`** — was missing on the 5 files with 3D flip
  animations. Now global.
- **Panel focus management** — opening a detail panel moves focus into it;
  closing returns focus to the opener; Escape closes.
- **Quiz feedback** is `aria-live`, so results are announced.
- **Lightbox** is a real dialog with focus trap and restore.
- **Print** — was on 12 of 38 files; now global, with panels expanded and flip
  backs unfolded.

---

## 8 · Content conventions

**Controlled vocabulary.** Use *AI assistant*, not *chatbot*, for
ChatGPT/Claude/Gemini/Copilot (the hub used "chatbot" 12 times; the deepest
content page treats it as pejorative). *prompting* for the everyday practice;
*prompt engineering* only when naming the discipline. *faculty* and *students*,
consistently.

**Heading case.** Title Case for `<h1>`/`<h2>`; sentence case below.

**Emoji** as card/section taxonomy only — never inside heading text, never in
prose, never in `<h1>`. One per card.

**Dates.** Every page carries a `Reviewed {Month Year}` stamp. The JS
`toLocaleDateString()` footers are **removed** — they printed today's date
beside content headed "Pricing (2025)", certifying stale content as current.

---

## 9 · Known issues left open

Deliberately out of scope for this pass (style + structure), each recorded so
it is not lost:

1. ~~`ai_fundamentals.html` and `types.html` are the same lesson word-for-word;
   Module 1 links both as separate lessons.~~ **Resolved 2026-08-10.**
   `ai_fundamentals.html` is the single canonical Module 1 concept lesson;
   `types.html` is now a meta-refresh stub pointing at it (GitHub Pages has no
   301s, so the stub is the only way to keep the old URL alive). Module 1's
   duplicate "Types of AI Systems" entry was removed and its lesson indices
   renumbered; `aiconcepts.html`'s next-link was repointed.
2. ~~`galery.html` and `graphics_gallery.html` are the same 23 images;
   `graphics_gallery.html` is orphaned.~~ **Resolved 2026-08-10.**
   `graphics_gallery.html` is now a meta-refresh stub pointing at `galery.html`.
   The misspelled `galery.html` filename is kept deliberately — it is the
   published URL — and its `<title>`/`<h1>` spell "Gallery" correctly.
3. `ai_tokens.html`'s cost calculator has `gpt41:{in:15,out:60}` — roughly 7.5×
   the real price. The page's interactive tool returns wrong dollar figures.
4. `ai_rationale.html`'s four hero stats are unsourced; "97M New Jobs by 2025"
   is an expired forecast, and the unsourced "62%" is the graded answer in a quiz.
5. Stale product claims: Bard (discontinued Feb 2024), OpenAI Plugins
   (deprecated 2024), Smart Sparrow / Knewton (shut down), "GPT-4 Turbo" as
   ChatGPT's current model.
6. Four prompt frameworks compete: index promises CO-STAR and CRAFT,
   `aiprompts.html` teaches O-C-A-F, `aiactivities.html` teaches RCODC.
7. Objective 6 (develop an AI Acceptable Use Policy) has no resource that
   produces one, though it is a listed submission artifact.
8. Modules link resources by absolute `https://jjirik77.github.io/...` URL, so
   local edits are invisible from the module shell until deployed.
9. 23 gallery images hotlink `raw.githubusercontent.com`, which is not a CDN.
10. `index_tx.html` (McLennan fork) points at a different survey and Drive
    folder than `index.html`. Decide which is canonical.
