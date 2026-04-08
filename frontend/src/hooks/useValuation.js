// src/hooks/useValuation.js
import { useState, useCallback } from "react";
import { api } from "../services/api";

const INITIAL_FORM = {
  neighborhood:  "Midtown",
  square_feet:   1800,
  bedrooms:      3,
  bathrooms:     2,
  age_years:     10,
  garage_spaces: 1,
  lot_size:      7500,
  floors:        1,
  has_pool:      0,
  has_fireplace: 0,
  has_basement:  0,
  renovated:     0,
  school_rating: 7,
  crime_index:   4,
  walk_score:    65,
};

export const useValuation = () => {
  const [form,       setForm]       = useState(INITIAL_FORM);
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const submit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.predict(form);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [form]);

  const reset = useCallback(() => {
    setForm(INITIAL_FORM);
    setResult(null);
    setError(null);
  }, []);

  return { form, result, loading, error, updateField, submit, reset };
};
