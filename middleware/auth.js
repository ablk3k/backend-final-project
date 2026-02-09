const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_prod";

exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // Attach minimal user info to request
    req.user = {
      id: payload.id,
      role: payload.role
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: admin only" });
  }

  next();
};
