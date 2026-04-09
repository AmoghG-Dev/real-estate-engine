// server/controllers/valuationController.js
const axios  = require("axios");
const { v4: uuidv4 } = require("uuid");
const config = require("../config");
const logger = require("../middleware/logger");

const mlClient = axios.create({
  baseURL: config.mlServiceUrl,
  headers: { "X-API-Key": config.mlApiKey, "Content-Type": "application/json" },
  timeout: 45000,
});

// POST /api/valuation
const getValuation = async (req, res, next) => {
  const requestId = uuidv4();
  logger.info(`[${requestId}] Valuation request received`);

  try {
    const {
      neighborhood, square_feet, bedrooms, bathrooms,
      age_years = 10, garage_spaces = 1, lot_size = 7500, floors = 1,
      has_pool = 0, has_fireplace = 0, has_basement = 0, renovated = 0,
      school_rating = 5, crime_index = 5, walk_score = 50,
    } = req.body;

    const payload = {
      neighborhood, square_feet: Number(square_feet),
      bedrooms: Number(bedrooms), bathrooms: Number(bathrooms),
      age_years: Number(age_years), garage_spaces: Number(garage_spaces),
      lot_size: Number(lot_size), floors: Number(floors),
      has_pool: Number(has_pool), has_fireplace: Number(has_fireplace),
      has_basement: Number(has_basement), renovated: Number(renovated),
      school_rating: Number(school_rating), crime_index: Number(crime_index),
      walk_score: Number(walk_score),
    };

    let data;

try {
  const res1 = await mlClient.post("/predict", payload);
  data = res1.data;
} catch (err) {
  logger.warn(`[${requestId}] First attempt failed, retrying...`);

  const res2 = await mlClient.post("/predict", payload);
  data = res2.data;
}

    logger.info(`[${requestId}] Valuation complete: $${data.estimated_value?.toLocaleString()}`);

    res.json({
      success:    true,
      requestId,
      timestamp:  new Date().toISOString(),
      input:      payload,
      result:     data,
    });
  } catch (err) {
    logger.error(`[${requestId}] Valuation failed: ${err.message}`);
    res.status(500).json({
  success: false,
  requestId,
  error: "Valuation failed. ML service may be warming up.",
});
  }
};

// GET /api/valuation/neighborhoods
const getNeighborhoods = async (req, res, next) => {
  try {
    const { data } = await mlClient.get("/neighborhoods");
    res.json({ success: true, ...data });
  } catch (err) {
    return res.status(500).json({
    success: false,
    error: "Failed to fetch neighborhoods",
  });
  }
};

module.exports = { getValuation, getNeighborhoods };
