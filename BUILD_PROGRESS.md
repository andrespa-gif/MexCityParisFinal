# Build progress

## Completed
- Phase 0: CDMX data moved to `data/cdmx/urban-index-data.json` and `data/cdmx/alcaldias.geojson`
- Phase 1: Paris GeoJSON fetched from opendata.paris.fr (20 arrondissements)
- Phase 2: Paris UQI JSON built at `data/paris/uqi-by-arrondissement.json`
- Phase 3: Paris page at `/paris/`, CDMX timeline at `/cdmx/`
- Phase 4: HDI embedded in both city datasets; Paris HDI computed with UN geometric mean
- Phase 5: Comparison landing page at `/`
- Phase 6: `vercel.json` added for static deployment

## Fallbacks / notes
- WhatsApp CSV filenames were mislabeled; population panel used from `paris_transit.csv`, cross-section from `paris_third_spaces.csv`, income from `paris_population.csv`
- Pre-1968 Paris population uses documented historical arrondissement estimates
- Paris HDI education sub-indices use income-rank proxy where arrondissement diploma tables were unavailable in provided files
- CDMX page uses `fetch()` to `data/cdmx/` (works on Vercel; no embedded `data.js` required)
