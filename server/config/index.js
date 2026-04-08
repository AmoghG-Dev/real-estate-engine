// server/config/index.js
require("dotenv").config();

// Support comma-separated list of allowed origins for production
// e.g. ALLOWED_ORIGIN="https://your-app.vercel.app,https://your-custom-domain.com"
const rawOrigins = process.env.ALLOWED_ORIGIN || "http://localhost:3000";
const allowedOrigins = rawOrigins.split(",").map((o) => o.trim());

module.exports = {
  port:         process.env.PORT            || 4000,
  mlServiceUrl: process.env.ML_SERVICE_URL  || "http://localhost:5001",
  mlApiKey:     process.env.ML_API_KEY      || "dev-secret-key",
  nodeEnv:      process.env.NODE_ENV        || "development",
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max:      100,
  },
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods:          ["GET", "POST", "OPTIONS"],
    allowedHeaders:   ["Content-Type", "Authorization"],
    credentials:      true,
  },
};
