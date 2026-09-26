const express = require("express");
const cors = require("cors");
require("dotenv").config();

const apiRoutes = require("./routes/api");

const app = express();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CLIENT_ORIGIN,
].filter(Boolean));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api", apiRoutes);

const PORT = process.env.PORT || 5000;
if (
  !process.env.JWT_ACCESS_SECRET ||
  Buffer.byteLength(process.env.JWT_ACCESS_SECRET) < 32
) {
  throw new Error("Set JWT_ACCESS_SECRET to a random value of at least 32 bytes");
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
