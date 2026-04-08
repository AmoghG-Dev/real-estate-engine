"""
Input validation helpers for the ML service.
"""

from typing import Any

REQUIRED_FIELDS = ["neighborhood", "square_feet", "bedrooms", "bathrooms"]

VALID_NEIGHBORHOODS = [
    "Downtown", "Midtown", "Suburbs_North", "Suburbs_South",
    "East_Side", "West_End", "Historic", "Industrial",
]

FIELD_RANGES: dict[str, tuple[float, float]] = {
    "square_feet":   (400,   6000),
    "bedrooms":      (1,     6),
    "bathrooms":     (1,     4),
    "age_years":     (0,     80),
    "garage_spaces": (0,     3),
    "lot_size":      (1000,  40000),
    "floors":        (1,     3),
    "school_rating": (1,     10),
    "crime_index":   (1,     10),
    "walk_score":    (0,     100),
}

BINARY_FIELDS = ["has_pool", "has_fireplace", "has_basement", "renovated"]


def validate_property(data: dict[str, Any]) -> list[str]:
    """Return a list of validation error messages (empty = valid)."""
    errors: list[str] = []

    # Required presence
    for field in REQUIRED_FIELDS:
        if field not in data:
            errors.append(f"'{field}' is required.")

    if errors:
        return errors

    # Neighborhood enum
    if data.get("neighborhood") not in VALID_NEIGHBORHOODS:
        errors.append(
            f"'neighborhood' must be one of: {', '.join(VALID_NEIGHBORHOODS)}"
        )

    # Numeric ranges
    for field, (lo, hi) in FIELD_RANGES.items():
        val = data.get(field)
        if val is not None:
            try:
                val = float(val)
                if not (lo <= val <= hi):
                    errors.append(f"'{field}' must be between {lo} and {hi}, got {val}.")
            except (TypeError, ValueError):
                errors.append(f"'{field}' must be a number.")

    # Binary fields
    for field in BINARY_FIELDS:
        val = data.get(field)
        if val is not None and val not in (0, 1, True, False):
            errors.append(f"'{field}' must be 0 or 1.")

    return errors
