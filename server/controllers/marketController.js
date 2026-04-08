// server/controllers/marketController.js
const axios  = require("axios");
const config = require("../config");
const logger = require("../middleware/logger");

const mlClient = axios.create({
  baseURL: config.mlServiceUrl,
  headers: { "X-API-Key": config.mlApiKey },
  timeout: 10_000,
});

// GET /api/market/trends
const getMarketTrends = async (req, res, next) => {
  try {
    const { neighborhood } = req.query;
    const params = neighborhood ? { neighborhood } : {};
    const { data } = await mlClient.get("/market/trends", { params });
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

// GET /api/market/comparables
const getComparables = async (req, res, next) => {
  try {
    const { neighborhood = "Midtown", price = 500000 } = req.query;
    const { data } = await mlClient.get("/market/comparables", {
      params: { neighborhood, price },
    });
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

// GET /api/market/feature-importance
const getFeatureImportance = async (req, res, next) => {
  try {
    const { data } = await mlClient.get("/model/importance");
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMarketTrends, getComparables, getFeatureImportance };
