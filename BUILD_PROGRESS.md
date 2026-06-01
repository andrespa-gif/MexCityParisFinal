# Build Progress — Final Rebuild

## Phase 0 — Data audit (complete)

| File | Status |
|------|--------|
| `data/cdmx/uqi-by-alcaldia.json` | **Real** — copied from `urban-index-data.json` |
| `data/cdmx/urban-index-data.json` | **Real** — original CDMX UQI + embedded HDI |
| `data/cdmx/alcaldias.geojson` | **Real** — 16 features |
| `data/cdmx/hdi-by-alcaldia.json` | **[PLACEHOLDER]** — extracted from embedded HDI in UQI file |
| `data/paris/uqi-by-arrondissement.json` | **Real** — built from INSEE/opendata sources |
| `data/paris/arrondissements.geojson` | **Real** — 20 features from opendata.paris.fr |
| `data/paris/hdi-by-arrondissement.json` | **[PLACEHOLDER]** — extracted from embedded HDI in UQI file |

## Phases 1–10 — Website rebuild (complete)

- `index.html` — all 10 sections in scroll order
- `styles.css` — archival parchment visual identity
- `js/opening.js` — Section 0 crossfade (4 phases, 5s hold, 1.8s fade)
- `js/timeline-data.js` — 20 timeline entries with full detail text
- `js/timeline.js` — scrollable timelines, overlay, watch mode
- `js/page.js` — UQI/HDI/scatter/line charts with per-section toolbars
- `js/glossary.js` — inline dotted-underline glossary tooltips
- `js/city-lab.js` — enhanced with R², reference line, hover highlight, component tooltips
- `styles-legacy.css` — preserved for `/cdmx/` and `/paris/` subpages

## Fallbacks / notes

- Paris opening images use Unsplash placeholders (comments note Wikimedia replacements)
- HDI separate JSON files marked `[PLACEHOLDER]` — HDI values come from embedded data in UQI files
- Subpages (`cdmx/`, `paris/`) use `styles-legacy.css` to preserve prior styling

## Still needs real data / assets

- [ ] Verified Paris UQI from primary sources (currently real but education proxy noted in prior build)
- [ ] Standalone verified HDI JSONs for both cities
- [ ] Archival neighborhood photos for opening crossfade (Paris 7e, 19e, 8e; CDMX Reforma, Iztapalapa, Zócalo)
- [ ] Wikimedia Commons images for Paris timeline entries
- [ ] Phase 11: push `final-rebuild` branch and verify Vercel preview

## Local preview

```bash
cd "Desktop/MexCity Timeline"
python3 -m http.server 8765
# Open http://localhost:8765/
```
