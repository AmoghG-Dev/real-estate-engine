// src/services/api.js
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Request failed");
  return data;
};

export const api = {
  predict: (payload) =>
    request("/valuation", { method: "POST", body: JSON.stringify(payload) }),
  getNeighborhoods: () => request("/valuation/neighborhoods"),
  getMarketTrends: (neighborhood) =>
    request(`/market/trends${neighborhood ? `?neighborhood=${neighborhood}` : ""}`),
  getComparables: (neighborhood, price) =>
    request(`/market/comparables?neighborhood=${neighborhood}&price=${price}`),
  getFeatureImportance: () => request("/market/feature-importance"),
};