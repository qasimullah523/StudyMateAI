const jwt = require("jsonwebtoken");
const User = require("../models/User");

const jwtSecret = process.env.JWT_SECRET || "dev_secret";

function getToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
}

async function attachUser(req, res, next, required) {
  const token = getToken(req);
  if (!token) {
    if (required) {
      return res.status(401).json({ error: "Authentication required" });
    }
    return next();
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.id).select("-passwordHash");
    if (!user) {
      if (required) {
        return res.status(401).json({ error: "User not found" });
      }
      return next();
    }
    req.user = user;
    return next();
  } catch (error) {
    if (required) {
      return res.status(401).json({ error: "Invalid token" });
    }
    return next();
  }
}

function requireAuth(req, res, next) {
  return attachUser(req, res, next, true);
}

function optionalAuth(req, res, next) {
  return attachUser(req, res, next, false);
}

module.exports = { requireAuth, optionalAuth };
