import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import clientesRoutes from "./routes/clientes";
import casesRoutes from "./routes/cases";
import invoicesRoutes from "./routes/invoices";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/cases", casesRoutes);
app.use("/api/invoices", invoicesRoutes);

// Health check
app.get("/health", async (req, res) => {
  try {
    const { prisma } = await import("./middleware/tenantFilter");
    await prisma.$connect();
    res.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
