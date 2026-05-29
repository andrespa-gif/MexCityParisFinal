# Paris HDI methodology

Computed for arrondissement-level HDI (2020, with 2010 estimate) using the UN Human Development Report 2022 formula.

## Sub-indicators

1. **Life expectancy** — ORS Île-de-France / Institut Paris Région per-arrondissement values (2021 study anchors).
2. **Mean years of schooling (MYS)** — Proxy from income rank mapped to 10–18 years where diploma tables were unavailable.
3. **Expected years of schooling (EYS)** — Proxy from baccalauréat+ share approximated via income rank, scaled 12–18 years.
4. **GNI per capita** — INSEE Filosofi 2021 median disposable income converted via PPP factor 0.738 EUR/USD-PPP (OECD).

## Indices (UN HDR 2022 goalposts)

- `life_exp_index = (LE - 20) / (85 - 20)`, clamped [0, 1]
- `eys_index = EYS / 18`, clamped [0, 1]
- `mys_index = MYS / 15`, clamped [0, 1]
- `education_index = (eys_index + mys_index) / 2`
- `income_index = (ln(GNI_pc) - ln(100)) / (ln(75000) - ln(100))`, clamped [0, 1]
- **HDI = geometric mean** `(life_exp_index × education_index × income_index)^(1/3)`

## Verification

Top 2020: 7e (0.990), 8e (0.986), 6e (0.980). Bottom: 19e (0.823), 20e (0.837), 18e (0.845).
