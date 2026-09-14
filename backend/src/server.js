const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});