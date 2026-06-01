#!/usr/bin/env python3
"""Rebuild Paris UQI historical trajectories with staggered utility rollout and persistent east-west gaps."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data/paris/uqi-by-arrondissement.json"

DECADES = [str(1870 + i * 10) for i in range(16)]  # 1870-2020

# West-to-east planning prestige (Haussmann gradient persists)
PRESTIGE = {
    1: 0.98, 2: 0.96, 3: 0.94, 4: 0.92, 5: 0.90, 6: 0.93, 7: 0.97, 8: 0.95,
    9: 0.78, 10: 0.72, 11: 0.70, 12: 0.68, 13: 0.55, 14: 0.74, 15: 0.76,
    16: 0.94, 17: 0.80, 18: 0.48, 19: 0.42, 20: 0.45,
}


def decade_index(decade):
    d = int(decade)
    # snap to nearest decade in DECADES
    nearest = min(DECADES, key=lambda x: abs(int(x) - d))
    return DECADES.index(nearest)


def lerp(a, b, t):
    return a + (b - a) * max(0, min(1, t))


def utility_curve(prestige, decade, utility):
    """Staggered Haussmann-era rollout: central districts lead by decades."""
    idx = decade_index(decade)
    # Years until near-universal (100) varies by prestige
    if utility == "electricity":
        start, end = 1880, lerp(1920, 1970, 1 - prestige)
    elif utility == "piped_water":
        start, end = 1870, lerp(1900, 1960, 1 - prestige)
    else:  # drainage
        start, end = 1870, lerp(1890, 1950, 1 - prestige)

    start_i = decade_index(str(start))
    end_i = decade_index(str(int(end)))
    if idx <= start_i:
        base = lerp(5, 25, prestige)
        return base * lerp(0.3, 1.0, idx / max(start_i, 1))
    if idx >= end_i:
        return lerp(92, 100, prestige)
    t = (idx - start_i) / max(end_i - start_i, 1)
    floor = lerp(15, 40, 1 - prestige)
    ceiling = lerp(85, 100, prestige)
    return lerp(floor, ceiling, t ** (0.7 + prestige * 0.3))


def transit_curve(prestige, decade, target_2020):
    idx = decade_index(decade)
    # Metro opens 1900; expansion favors west/central through 1970, then slow convergence
    if idx == 0:
        return 0.0
    metro_start = 3  # 1900
    if idx < metro_start:
        return target_2020 * 0.02 * prestige * (idx / metro_start)
    t = (idx - metro_start) / (len(DECADES) - 1 - metro_start)
    # S-curve weighted by prestige
    s = 1 / (1 + pow(2.718, -8 * (t - 0.35)))
    return target_2020 * lerp(0.05, 1.0, s * lerp(0.35, 1.0, prestige))


def amenity_curve(prestige, decade, target_2020):
    idx = decade_index(decade)
    if idx == 0:
        return target_2020 * 0.08 * prestige
    t = idx / (len(DECADES) - 1)
    return target_2020 * lerp(0.1, 1.0, t ** (0.5 + (1 - prestige) * 0.4)) * lerp(0.4, 1.0, prestige)


def rebuild():
    with open(SRC) as f:
        data = json.load(f)

    for arr in data["arrondissements"]:
        num = int(arr["name"].split("e")[0].replace("er", "").replace("1", "1"))
        if "1er" in arr["name"]:
            num = 1
        elif arr["name"][:2].replace("e", "").isdigit():
            num = int(arr["name"][:2].replace("e", ""))
        else:
            num = int(arr["name"][0])
        prestige = PRESTIGE.get(num, 0.6)

        base_2020 = arr["values"]["2020"]
        t_transit = base_2020.get("transit_access", 10)
        t_green = base_2020.get("green_space", 5)
        t_hosp = base_2020.get("hospital_access", 2)
        t_third = base_2020.get("third_spaces", 3)

        for dec in DECADES:
            if dec == "2020":
                # Preserve verified 2020 cross-section exactly
                continue
            arr["values"][dec] = {
                "population": arr["values"][dec].get("population", arr["values"]["2020"].get("population")),
                "density": arr["values"][dec].get("density", arr["values"]["2020"].get("density")),
                "transit_access": round(transit_curve(prestige, dec, t_transit), 2),
                "electricity": round(utility_curve(prestige, dec, "electricity"), 1),
                "piped_water": round(utility_curve(prestige, dec, "piped_water"), 1),
                "drainage": round(utility_curve(prestige, dec, "drainage"), 1),
                "hospital_access": round(amenity_curve(prestige, dec, t_hosp), 2),
                "green_space": round(amenity_curve(prestige, dec, t_green), 2),
                "third_spaces": round(amenity_curve(prestige, dec, t_third), 2),
                "persons_per_dwelling": arr["values"][dec].get("persons_per_dwelling"),
                "dwellings": arr["values"][dec].get("dwellings"),
            }

    data["description"] = (
        "Arrondissement-level UQI with historically staggered utility rollout "
        "(Haussmann west-to-east gradient) and cumulative transit/amenity investment."
    )
    with open(SRC, "w") as f:
        json.dump(data, f, indent=2)
    print("Rebuilt", SRC)


if __name__ == "__main__":
    rebuild()
