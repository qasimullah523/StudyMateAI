import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import User, { type UserDocument } from "../models/User";
import { env } from "../config/env";

function signToken(user: UserDocument) {
  return jwt.sign({ id: user._id }, env.jwtSecret, {
    expiresIn: env.jwtExpires,
  });
}

function sanitizeUser(user: UserDocument) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    preferences: user.preferences || { theme: "light" },
  };
}

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }
    if (!isEmailValid(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Registration failed" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Login failed" });
  }
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  return res.json({ user: sanitizeUser(req.user) });
}

export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { name, email, password, preferences } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      preferences?: Record<string, unknown>;
    };

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (email && email.toLowerCase() !== user.email) {
      if (!isEmailValid(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(409).json({ error: "Email already registered" });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name) {
      user.name = name.trim();
    }

    if (password) {
      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    if (preferences && typeof preferences === "object") {
      user.preferences = {
        ...user.preferences,
        ...preferences,
      };
    }

    await user.save();
    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Update failed" });
  }
}
