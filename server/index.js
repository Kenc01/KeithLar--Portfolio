const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

require("dotenv").config();

const app = express();
const PORT = 5000;

// PostgreSQL connection pool - Use Replit's DATABASE_URL if available
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

// Create contacts table if it doesn't exist
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

// Serve static files from root directory (not public)
app.use(express.static(path.join(__dirname, "..")));

// Add cache control headers to prevent caching issues in Replit iframe
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
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

// Get all contacts
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
  //console.log("Serving static files from public directory");
});
