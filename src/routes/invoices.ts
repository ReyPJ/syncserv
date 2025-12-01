import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { createTenantPrismaClient } from "../middleware/tenantFilter";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET all invoices
router.get("/", async (req: AuthRequest, res) => {
  try {
    const prisma = createTenantPrismaClient(req.user!.tenantId);
    const invoices = await prisma.invoice.findMany({
      include: {
        case: {
          include: {
            cliente: true,
          },
        },
        items: true,
      },
      orderBy: { issueDate: "desc" },
    });
    res.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// GET invoice by ID
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const prisma = createTenantPrismaClient(req.user!.tenantId);

    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        case: {
          include: {
            cliente: true,
          },
        },
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// POST create invoice
router.post("/", async (req: AuthRequest, res) => {
  try {
    const prisma = createTenantPrismaClient(req.user!.tenantId);
    const { items, ...invoiceData } = req.body;

    const invoice = await prisma.invoice.create({
      data: {
        ...invoiceData,
        items: items
          ? {
              create: items,
            }
          : undefined,
      },
      include: {
        case: {
          include: {
            cliente: true,
          },
        },
        items: true,
      },
    });
    res.json(invoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// PUT update invoice by ID (uses upsert for sync compatibility)
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const prisma = createTenantPrismaClient(req.user!.tenantId);
    const { items, ...invoiceData } = req.body;

    const invoice = await prisma.invoice.upsert({
      where: { id: parseInt(id) },
      update: invoiceData,
      create: { id: parseInt(id), ...invoiceData },
      include: {
        case: {
          include: {
            cliente: true,
          },
        },
        items: true,
      },
    });

    res.json(invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

// DELETE invoice by ID
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const prisma = createTenantPrismaClient(req.user!.tenantId);

    await prisma.invoice.delete({
      where: { id: parseInt(id) },
    });

    res.json({ success: true, message: "Invoice deleted" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

export default router;
