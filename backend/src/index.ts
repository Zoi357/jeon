import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import servicesRouter from "./routes/services";
import bookingsRouter from "./routes/bookings";

const app = express();

const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";

app.use(cors({ origin: clientUrl }));
app.use(express.json());

// Health check (used by hosting platforms and uptime monitors).
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use("/api", servicesRouter);
app.use("/api", bookingsRouter);

// Unknown route.
app.use((_req, res) => res.status(404).json({ error: "Not found." }));

// Centralised error handler (must have all 4 params for Express to detect it).
app.use((err: unknown, _req: Request, _res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  _res.status(500).json({ error: "Internal server error." });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`JEON Engineering API listening on http://localhost:${port}`);
  console.log(`CORS allowed origin: ${clientUrl}`);
});
