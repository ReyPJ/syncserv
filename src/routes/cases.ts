import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { createTenantPrismaClient } from "../middleware/tenantFilter";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET all cases
router.get("/", async (req: AuthRequest, res) => {
  try {
    const prisma = createTenantPrismaClient(req.user!.tenantId);
    const cases = await prisma.case.findMany({
      include: {
        cliente: true,
      },
      orderBy: { startDate: "desc" },
    });
    res.json(cases);
  } catch (error) {
    console.error("Error fetching cases:", error);
    res.status(500).json({ error: "Failed to fetch cases" });
  }
});

// GET case by ID
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const prisma = createTenantPrismaClient(req.user!.tenantId);

    const caseRecord = await prisma.case.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        invoices: true,
      },
    });

    if (!caseRecord) {
      return res.status(404).json({ error: "Case not found" });
    }

    res.json(caseRecord);
  } catch (error) {
    console.error("Error fetching case:", error);
    res.status(500).json({ error: "Failed to fetch case" });
  }
});

// POST create case
router.post("/", async (req: AuthRequest, res) => {
  try {
    const prisma = createTenantPrismaClient(req.user!.tenantId);
    const caseRecord = await prisma.case.create({
      data: req.body,
      include: {
        cliente: true,
      },
    });
    res.json(caseRecord);
  } catch (error) {
    console.error("Error creating case:", error);
    res.status(500).json({ error: "Failed to create case" });
  }
});

// PUT update case by ID (uses upsert for sync compatibility)
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const prisma = createTenantPrismaClient(req.user!.tenantId);

    const caseRecord = await prisma.case.upsert({
      where: { id: parseInt(id) },
      update: req.body,
      create: { id: parseInt(id), ...req.body },
      include: {
        cliente: true,
      },
    });

    res.json(caseRecord);
  } catch (error) {
    console.error("Error updating case:", error);
    res.status(500).json({ error: "Failed to update case" });
  }
});

// DELETE case by ID
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const prisma = createTenantPrismaClient(req.user!.tenantId);

    await prisma.case.delete({
      where: { id: parseInt(id) },
    });

    res.json({ success: true, message: "Case deleted" });
  } catch (error) {
    console.error("Error deleting case:", error);
    res.status(500).json({ error: "Failed to delete case" });
  }
});

export default router;
