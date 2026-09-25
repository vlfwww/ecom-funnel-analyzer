const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.api = {};
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post("/api/track", async (req, res) => {
  const { sessionUuid, stepName, eventType, timeSpent, userAgent } = req.body;
  try {
    await pool.query(
      `INSERT INTO tracking_sessions (session_uuid, user_agent) 
             VALUES ($1, $2) ON CONFLICT (session_uuid) DO NOTHING`,
      [sessionUuid, userAgent || req.headers["user-agent"]],
    );

    await pool.query(
      `INSERT INTO funnel_events (session_uuid, step_name, event_type, time_spent_seconds) 
             VALUES ($1, $2, $3, $4)`,
      [sessionUuid, stepName, eventType, timeSpent || 0],
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Tracking Error");
  }
});

app.get("/api/analytics/funnel", async (req, res) => {
  try {
    const query = `
            SELECT 
                step_name,
                COUNT(DISTINCT session_uuid) as unique_users
            FROM funnel_events
            GROUP BY step_name
            ORDER BY 
                CASE step_name
                    WHEN 'catalog' THEN 1
                    WHEN 'product' THEN 2
                    WHEN 'cart' THEN 3
                    WHEN 'checkout_delivery' THEN 4
                    WHEN 'checkout_payment' THEN 5
                    WHEN 'success' THEN 6
                    ELSE 7
                END;
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Analytics Error");
  }
});

app.post("/api/order", async (req, res) => {
  const { sessionUuid, totalAmount, customerName, phone, address } = req.body;
  try {
    const newOrder = await pool.query(
      `INSERT INTO orders (session_uuid, total_amount, customer_name, phone, address) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [sessionUuid, totalAmount, customerName, phone, address],
    );
    res.json(newOrder.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Order Error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
