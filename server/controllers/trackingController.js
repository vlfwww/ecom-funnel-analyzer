const pool = require("../config/db");

const trackStep = async (req, res) => {
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
};

const getFunnelAnalytics = async (req, res) => {
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
};

module.exports = { trackStep, getFunnelAnalytics };
