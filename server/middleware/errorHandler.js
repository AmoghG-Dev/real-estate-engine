// server/middleware/errorHandler.js
const logger = require("./logger");

// 404 handler
const notFound = (req, res, next) => {
  const err = new Error(`Not Found – ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  logger.error(`${status} ${err.message}`);
  res.status(status).json({
    success: false,
    error: {
      message: err.message || "Internal Server Error",
      status,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};

module.exports = { notFound, errorHandler };
