import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import servicesRouter from "./routes/services";
import bookingsRouter from "./routes/bookings";
import adminRouter from "./routes/admin";

const app = express();
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";

app.use(
  cors({
    origin: clientUrl,
    credentials: true, // needed for session cookies
  }),
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      // Set secure:true in production (HTTPS only).
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  }),
);

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use("/api", servicesRouter);
app.use("/api", bookingsRouter);
app.use("/api", adminRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found." }));

app.use((err: unknown, _req: Request, _res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  _res.status(500).json({ error: "Internal server error." });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`JEON Engineering API → http://localhost:${port}`);
  console.log(`CORS origin: ${clientUrl}`);
  if (process.env.SMTP_ENABLED !== "true") {
    console.log("Email notifications disabled (SMTP_ENABLED=false).");
  }
});
