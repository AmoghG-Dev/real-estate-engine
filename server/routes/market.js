// server/routes/market.js
const express = require("express");
const { getMarketTrends, getComparables, getFeatureImportance } = require("../controllers/marketController");

const router = express.Router();

router.get("/trends",             getMarketTrends);
router.get("/comparables",        getComparables);
router.get("/feature-importance", getFeatureImportance);

module.exports = router;
