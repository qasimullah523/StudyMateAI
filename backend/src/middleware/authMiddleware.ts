import jwt from "jsonwebtoken";
import User from "../models/User";
import { env } from "../config/env";
import type { Request, Response, NextFunction } from "express";

interface AuthPayload {
  id: string;
}

function getToken(req: Request) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
}

async function attachUser(
  req: Request,
  res: Response,
  next: NextFunction,
  required: boolean,
) {
  const token = getToken(req);
  if (!token) {
    if (required) {
      return res.status(401).json({ error: "Authentication required" });
    }
    return next();
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
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

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  return attachUser(req, res, next, true);
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  return attachUser(req, res, next, false);
}
