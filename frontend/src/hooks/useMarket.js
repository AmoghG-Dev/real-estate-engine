// src/hooks/useMarket.js
import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

export const useMarket = (neighborhood = null) => {
  const [trends,          setTrends]          = useState([]);
  const [comparables,     setComparables]     = useState([]);
  const [featureImportance, setFeatureImportance] = useState({});
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState(null);

  const fetchTrends = useCallback(async (nb) => {
    setLoading(true);
    try {
      const data = await api.getMarketTrends(nb);
      setTrends(data.trends || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComparables = useCallback(async (nb, price) => {
    try {
      const data = await api.getComparables(nb, price);
      setComparables(data.comparables || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchFeatureImportance = useCallback(async () => {
    try {
      const data = await api.getFeatureImportance();
      setFeatureImportance(data.feature_importance || {});
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchTrends(neighborhood);
    fetchFeatureImportance();
  }, [neighborhood, fetchTrends, fetchFeatureImportance]);

  return {
    trends, comparables, featureImportance,
    loading, error,
    fetchTrends, fetchComparables,
  };
};
