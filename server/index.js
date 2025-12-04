import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;
const app = express();
app.use(express.json());
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://festa-f-cil-pro.onrender.com";
const DEV_ORIGINS = ["http://localhost:8080", "http://127.0.0.1:8080"];
const origins = [ALLOWED_ORIGIN, ...DEV_ORIGINS].filter(Boolean);
app.use(cors({ origin: origins }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

let dbReady = false;
let pool = null;
let memory = new Map();

async function init() {
  if (!DATABASE_URL) {
    dbReady = true;
    return;
  }
  pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await pool.query(
    "CREATE TABLE IF NOT EXISTS arrivals (id TEXT PRIMARY KEY, arrived BOOLEAN NOT NULL DEFAULT false)"
  );
  dbReady = true;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, db: !!DATABASE_URL });
});

app.get("/api/arrivals", async (_req, res) => {
  if (!dbReady) await init();
  try {
    if (pool) {
      const r = await pool.query("SELECT id, arrived FROM arrivals");
      const out = {};
      for (const row of r.rows) out[row.id] = !!row.arrived;
      return res.json(out);
    }
    const out = {};
    for (const [id, arrived] of memory.entries()) out[id] = !!arrived;
    return res.json(out);
  } catch (e) {
    return res.status(500).json({ error: "failed", message: String(e?.message || e) });
  }
});

app.put("/api/guests/:id/arrived", async (req, res) => {
  const { id } = req.params;
  const { arrived } = req.body || {};
  if (typeof arrived !== "boolean") return res.status(400).json({ error: "invalid" });
  if (!dbReady) await init();
  try {
    if (pool) {
      await pool.query(
        "INSERT INTO arrivals (id, arrived) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET arrived = EXCLUDED.arrived",
        [id, arrived]
      );
      return res.json({ ok: true });
    }
    memory.set(id, arrived);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "failed", message: String(e?.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

