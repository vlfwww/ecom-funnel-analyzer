const pool = require("../config/db");

const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, role, created_at
       FROM users
       ORDER BY created_at DESC`,
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("User list request failed:", err);
    return res.status(500).json({
      success: false,
      message: "Не удалось загрузить список пользователей",
    });
  }
};

module.exports = { getUsers };
