"""
Synthetic Housing Dataset Generator
Generates realistic property data for model training
"""

import numpy as np
import pandas as pd
from pathlib import Path

def generate_housing_data(n_samples: int = 5000, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)

    # ── Location tiers ─────────────────────────────────────────────────────────
    neighborhoods = {
        "Downtown":       {"base": 850_000, "multiplier": 1.40},
        "Midtown":        {"base": 620_000, "multiplier": 1.20},
        "Suburbs_North":  {"base": 480_000, "multiplier": 1.05},
        "Suburbs_South":  {"base": 420_000, "multiplier": 0.95},
        "East_Side":      {"base": 380_000, "multiplier": 0.90},
        "West_End":       {"base": 550_000, "multiplier": 1.10},
        "Historic":       {"base": 700_000, "multiplier": 1.25},
        "Industrial":     {"base": 260_000, "multiplier": 0.70},
    }
    neighborhood_names = list(neighborhoods.keys())
    neighborhood_probs = [0.10, 0.15, 0.18, 0.15, 0.12, 0.12, 0.08, 0.10]

    selected_neighborhoods = np.random.choice(
        neighborhood_names, size=n_samples, p=neighborhood_probs
    )

    # ── Property features ──────────────────────────────────────────────────────
    square_feet   = np.random.normal(1800, 600, n_samples).clip(400, 6000)
    bedrooms      = np.random.choice([1, 2, 3, 4, 5, 6], n_samples,
                                     p=[0.08, 0.22, 0.35, 0.22, 0.10, 0.03])
    bathrooms     = np.random.choice([1, 1.5, 2, 2.5, 3, 3.5, 4], n_samples,
                                     p=[0.10, 0.12, 0.30, 0.18, 0.18, 0.08, 0.04])
    age_years     = np.random.choice(range(0, 80), n_samples)
    garage_spaces = np.random.choice([0, 1, 2, 3], n_samples,
                                     p=[0.15, 0.30, 0.40, 0.15])
    lot_size      = np.random.normal(7500, 3000, n_samples).clip(1000, 40000)
    floors        = np.random.choice([1, 1.5, 2, 3], n_samples,
                                     p=[0.30, 0.10, 0.45, 0.15])

    # Boolean amenities
    has_pool       = np.random.choice([0, 1], n_samples, p=[0.75, 0.25])
    has_fireplace  = np.random.choice([0, 1], n_samples, p=[0.55, 0.45])
    has_basement   = np.random.choice([0, 1], n_samples, p=[0.40, 0.60])
    renovated      = np.random.choice([0, 1], n_samples, p=[0.60, 0.40])

    school_rating  = np.random.uniform(1, 10, n_samples)
    crime_index    = np.random.uniform(1, 10, n_samples)
    walk_score     = np.random.randint(10, 100, n_samples)

    # ── Price computation ──────────────────────────────────────────────────────
    prices = []
    for i in range(n_samples):
        nb   = neighborhoods[selected_neighborhoods[i]]
        base = nb["base"] * nb["multiplier"]

        price = (
            base
            + square_feet[i]      * 185
            + bedrooms[i]         * 18_000
            + bathrooms[i]        * 14_000
            - age_years[i]        * 2_200
            + garage_spaces[i]    * 12_000
            + lot_size[i]         * 4.5
            + floors[i]           * 8_000
            + has_pool[i]         * 35_000
            + has_fireplace[i]    * 8_500
            + has_basement[i]     * 22_000
            + renovated[i]        * 28_000
            + school_rating[i]    * 9_500
            - crime_index[i]      * 7_000
            + walk_score[i]       * 420
        )

        noise = np.random.normal(0, price * 0.07)
        prices.append(max(price + noise, 50_000))

    df = pd.DataFrame({
        "neighborhood":   selected_neighborhoods,
        "square_feet":    square_feet.astype(int),
        "bedrooms":       bedrooms,
        "bathrooms":      bathrooms,
        "age_years":      age_years,
        "garage_spaces":  garage_spaces,
        "lot_size":       lot_size.astype(int),
        "floors":         floors,
        "has_pool":       has_pool,
        "has_fireplace":  has_fireplace,
        "has_basement":   has_basement,
        "renovated":      renovated,
        "school_rating":  school_rating.round(1),
        "crime_index":    crime_index.round(1),
        "walk_score":     walk_score,
        "price":          np.array(prices).astype(int),
    })

    output_path = Path(__file__).parent / "housing_data.csv"
    df.to_csv(output_path, index=False)
    print(f"[✓] Generated {n_samples} samples → {output_path}")
    return df


if __name__ == "__main__":
    df = generate_housing_data()
    print(df.describe())
