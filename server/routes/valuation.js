// server/routes/valuation.js
const express    = require("express");
const { body, validationResult } = require("express-validator");
const { getValuation, getNeighborhoods } = require("../controllers/valuationController");

const router = express.Router();

const validateValuation = [
  body("neighborhood").isString().notEmpty().withMessage("neighborhood is required"),
  body("square_feet").isNumeric().withMessage("square_feet must be a number"),
  body("bedrooms").isNumeric().withMessage("bedrooms must be a number"),
  body("bathrooms").isNumeric().withMessage("bathrooms must be a number"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

router.post("/",            validateValuation, getValuation);
router.get("/neighborhoods", getNeighborhoods);

module.exports = router;
