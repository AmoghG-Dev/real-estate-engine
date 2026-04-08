// server/index.js
require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const compression = require("compression");
const rateLimit  = require("express-rate-limit");

const config               = require("./config");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const logger               = require("./middleware/logger");
const valuationRoutes      = require("./routes/valuation");
const marketRoutes         = require("./routes/market");

const app = express();

// ── Global middleware ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors(config.cors));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny", { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Rate limiter
app.use(
  "/api",
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max:      config.rateLimit.max,
    message:  { error: "Too many requests, please try again later." },
  })
);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "api-gateway", timestamp: new Date().toISOString() })
);

app.use("/api/valuation", valuationRoutes);
app.use("/api/market",    marketRoutes);

// ── Error handling ─────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  logger.info(`🏠 API Gateway running on http://localhost:${config.port}`);
  logger.info(`   ML Service → ${config.mlServiceUrl}`);
  logger.info(`   Environment: ${config.nodeEnv}`);
});

module.exports = app;   // for testing
