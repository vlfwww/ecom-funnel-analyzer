const pool = require("../config/db");

const getOrders = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY id DESC");
    return res.json(result.rows);
  } catch (err) {
    console.error("Order list request failed:", err);
    return res.status(500).json({
      success: false,
      message: "Не удалось загрузить список заказов",
    });
  }
};

const createOrder = async (req, res) => {
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
};

module.exports = { createOrder, getOrders };
