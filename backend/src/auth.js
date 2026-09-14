const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("./db");
const { authenticateToken } = require("./middleware");

const router = express.Router();


// ===============================
// Register
// ===============================

router.post("/register", async (req, res) => {
  const { name, email, password, organizationName } = req.body;

  if (!name || !email || !password || !organizationName) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters",
    });
  }

  try {
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const organizationResult = await pool.query(
      "INSERT INTO organizations (name) VALUES ($1) RETURNING id",
      [organizationName]
    );

    const organizationId = organizationResult.rows[0].id;

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      `INSERT INTO users
        (organization_id, name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, organization_id, status`,
      [
        organizationId,
        name,
        email,
        passwordHash,
      ]
    );

    const user = userResult.rows[0];

    const roleResult = await pool.query(
      `INSERT INTO roles
        (organization_id, name)
       VALUES ($1, $2)
       RETURNING id`,
      [organizationId, "Admin"]
    );

    const roleId = roleResult.rows[0].id;

    await pool.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)`,
      [user.id, roleId]
    );

    const token = jwt.sign(
      {
        userId: user.id,
        organizationId: user.organization_id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user,
    });

  } catch (error) {
    console.error("Registration error:", error.message);

    res.status(500).json({
      message: "Registration failed",
    });
  }
});


// ===============================
// Login
// ===============================

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    const result = await pool.query(
      `SELECT
        id,
        name,
        email,
        password_hash,
        organization_id,
        status
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Your account is inactive",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        organizationId: user.organization_id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: user.organization_id,
        status: user.status,
      },
    });

  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      message: "Login failed",
    });
  }
});


// ===============================
// Current User
// ===============================

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        name,
        email,
        organization_id,
        status,
        created_at
       FROM users
       WHERE id = $1
       AND organization_id = $2`,
      [
        req.user.userId,
        req.user.organizationId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      user: result.rows[0],
    });

  } catch (error) {
    console.error("Get current user error:", error.message);

    res.status(500).json({
      message: "Could not get current user",
    });
  }
});


// ===============================
// Logout
// ===============================

router.post("/logout", authenticateToken, (req, res) => {
  res.json({
    message: "Logout successful",
  });
});


module.exports = router;