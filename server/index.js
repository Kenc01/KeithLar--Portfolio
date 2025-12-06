const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const crypto = require("crypto");
const { Pool } = require("pg");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        user: process.env.PGUSER || process.env.DB_USER || "postgres",
        password: process.env.PGPASSWORD || process.env.DB_PASSWORD || "password",
        host: process.env.PGHOST || process.env.DB_HOST || "localhost",
        port: process.env.PGPORT || process.env.DB_PORT || 5432,
        database: process.env.PGDATABASE || process.env.DB_NAME || "portfolio",
      }
);

pool
  .query(
    `
  CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    mobile VARCHAR(20),
    subject VARCHAR(200),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`
  )
  .catch((err) => console.error("Error creating table:", err));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "portfolio-admin-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(express.static(path.join(__dirname, "..")));

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

const isAdminAuthenticated = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ success: false, error: "Unauthorized" });
};

const safeCompare = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

app.post("/api/admin/login", async (req, res) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error("ADMIN_PASSWORD environment variable not set");
      return res.status(500).json({
        success: false,
        error: "Admin password not configured",
      });
    }

    if (safeCompare(password, adminPassword)) {
      req.session.isAdmin = true;
      return res.json({ success: true, message: "Login successful" });
    }

    return res.status(401).json({
      success: false,
      error: "Invalid password",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

app.get("/api/admin/check", (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.isAdmin) });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: "Logout failed" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});

app.get("/api/admin/contacts", isAdminAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM contacts ORDER BY created_at DESC"
    );
    res.json({ success: true, contacts: result.rows });
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ success: false, error: "Failed to fetch contacts" });
  }
});

app.get("/api/admin/contacts/:id", isAdminAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM contacts WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Contact not found" });
    }

    res.json({ success: true, contact: result.rows[0] });
  } catch (err) {
    console.error("Error fetching contact:", err);
    res.status(500).json({ success: false, error: "Failed to fetch contact" });
  }
});

app.delete("/api/admin/contacts/:id", isAdminAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM contacts WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Contact not found" });
    }

    res.json({ success: true, message: "Contact deleted successfully" });
  } catch (err) {
    console.error("Error deleting contact:", err);
    res.status(500).json({ success: false, error: "Failed to delete contact" });
  }
});

app.post("/api/contact", async (req, res) => {
  try {
    const { fullName, email, mobile, subject, message } = req.body;

    if (!fullName || !email || !message) {
      return res.status(400).json({
        success: false,
        error: "Full name, email, and message are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address",
      });
    }

    const sanitize = (str) => (str ? String(str).trim().slice(0, 1000) : "");

    const sql = `
      INSERT INTO contacts (full_name, email, mobile, subject, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const result = await pool.query(sql, [
      sanitize(fullName).slice(0, 100),
      sanitize(email).slice(0, 100),
      sanitize(mobile).slice(0, 20),
      sanitize(subject).slice(0, 200),
      sanitize(message),
    ]);

    console.log(
      `New contact submission from: ${sanitize(fullName)} (${sanitize(email)})`
    );

    res.json({
      success: true,
      message: "Your message has been sent successfully!",
    });
  } catch (error) {
    console.error("Error saving contact:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save your message. Please try again.",
    });
  }
});

app.get("/api/contact", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM contacts ORDER BY created_at DESC"
    );
    res.json({ success: true, contacts: result.rows });
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ success: false, error: "Failed to fetch contacts" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Portfolio server running on http://localhost:${PORT}`);
});
