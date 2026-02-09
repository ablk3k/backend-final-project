module.exports = (err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;

  // keep client message clean
  const message =
    status >= 500
      ? "Server error"
      : err.message || "Request error";

  res.status(status).json({ error: message });
};
