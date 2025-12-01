import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../middleware/tenantFilter";

const router = Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existing = await prisma.tenant.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Generate token
    const token = jwt.sign(
      { id: tenant.id, email: tenant.email, tenantId: tenant.id },
      JWT_SECRET,
      { expiresIn: "30d" },
    );

    res.json({
      success: true,
      user: {
        id: tenant.id,
        email: tenant.email,
        name: tenant.name,
        tenantId: tenant.id,
        token,
      },
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find tenant
    const tenant = await prisma.tenant.findUnique({ where: { email } });
    if (!tenant) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Verify password
    const valid = await bcrypt.compare(password, tenant.password);
    if (!valid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { id: tenant.id, email: tenant.email, tenantId: tenant.id },
      JWT_SECRET,
      { expiresIn: "30d" },
    );

    res.json({
      success: true,
      user: {
        id: tenant.id,
        email: tenant.email,
        name: tenant.name,
        tenantId: tenant.id,
        token,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

// Verify token
router.get("/verify", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ valid: false });
  }

  const token = authHeader.substring(7);
  try {
    jwt.verify(token, JWT_SECRET);
    res.json({ valid: true });
  } catch {
    res.status(401).json({ valid: false });
  }
});

export default router;
