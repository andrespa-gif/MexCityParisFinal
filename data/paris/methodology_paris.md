# Paris UQI methodology (capstone)

Source file: `data/paris/uqi-by-arrondissement.json` (revised 2026 panel).  
Web maps and line charts read pre-scored components from `data/capstone/uqi-methodology-index.json` (built by `scripts/build_methodology_uqi_index.py`).

## Five scored components (equal weight)

Min–max normalized **within each decade across 20 arrondissements** (0–100 per component).  
**UQI** = mean of the five component scores.

| Index key | Raw variable | Direction | Notes |
|-----------|--------------|-----------|--------|
| **transit** | `transit_access` | higher better | Cumulative métro stations **per km²** (not per capita) |
| **infrastructure** | `hospital_access` | higher better | Major hospitals per 100k; **utilities excluded** from composite |
| **parks** | `green_space` | higher better | m² public green space per resident |
| **thirdspace** | `third_spaces` | higher better | Libraries + museums per 100k |
| **density** | `persons_per_dwelling` | lower better | Crowding proxy (stored in `density` slot for web compatibility) |

## Excluded from default UQI (retained in JSON)

`electricity`, `piped_water`, and `drainage` are near-uniform across arrondissements after ~1900–1930 and do not differentiate neighborhoods in cross-section. They remain in the JSON for transparency.

## Years

1870, 1880, …, 2020 (16 decades).

## Sources

See `sourceNotes` in `data/paris/uqi-by-arrondissement.json` (RATP/Wikidata, Paris Open Data parks, BNF/museums, INSEE crowding and population).

## HDI

`data/paris/hdi-by-arrondissement.json` — UN HDR 2022 geometric mean (INSEE Filosofi, education, ORS life expectancy). 2000/2010 are documented backcasts from 2020.

## Regenerate

```bash
python scripts/build_methodology_uqi_index.py
python scripts/export_uqi_lines_panel.py
```
