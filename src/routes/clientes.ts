import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { createTenantPrismaClient } from "../middleware/tenantFilter";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET all clientes
router.get("/", async (req: AuthRequest, res) => {
  try {
    const prisma = createTenantPrismaClient(req.user!.tenantId);
    const clientes = await prisma.cliente.findMany({
      orderBy: { nombre: "asc" },
    });
    res.json(clientes);
  } catch (error) {
    console.error("Error fetching clientes:", error);
    res.status(500).json({ error: "Failed to fetch clientes" });
  }
});

// GET cliente by ID
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const prisma = createTenantPrismaClient(req.user!.tenantId);

    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(id) },
    });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente not found" });
    }

    res.json(cliente);
  } catch (error) {
    console.error("Error fetching cliente:", error);
    res.status(500).json({ error: "Failed to fetch cliente" });
  }
});

// POST create cliente
router.post("/", async (req: AuthRequest, res) => {
  try {
    const prisma = createTenantPrismaClient(req.user!.tenantId);
    const cliente = await prisma.cliente.create({
      data: req.body,
    });
    res.json(cliente);
  } catch (error) {
    console.error("Error creating cliente:", error);
    res.status(500).json({ error: "Failed to create cliente" });
  }
});

// PUT update cliente by ID (uses upsert for sync compatibility)
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const prisma = createTenantPrismaClient(req.user!.tenantId);

    const cliente = await prisma.cliente.upsert({
      where: { id: parseInt(id) },
      update: req.body,
      create: { id: parseInt(id), ...req.body },
    });

    res.json(cliente);
  } catch (error) {
    console.error("Error updating cliente:", error);
    res.status(500).json({ error: "Failed to update cliente" });
  }
});

// DELETE cliente by ID
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const prisma = createTenantPrismaClient(req.user!.tenantId);

    await prisma.cliente.delete({
      where: { id: parseInt(id) },
    });

    res.json({ success: true, message: "Cliente deleted" });
  } catch (error) {
    console.error("Error deleting cliente:", error);
    res.status(500).json({ error: "Failed to delete cliente" });
  }
});

export default router;
