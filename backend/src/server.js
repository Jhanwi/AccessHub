const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const authRoutes = require("./auth");

const { authenticateToken } = require("./middleware");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "AccessHub API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "accesshub-api",
  });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name FROM applications ORDER BY id"
    );

    res.json({
      status: "connected",
      applications: result.rows,
    });
  } catch (error) {
    console.error("Database connection error:", error.message);

    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({
    message: "You accessed a protected route",
    user: req.user,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});