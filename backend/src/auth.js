const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("./db");

const {
  authenticateToken,
} = require("./middleware");

const router = express.Router();

// ==========================================
// Register
// ==========================================

router.post(
  "/register",
  async (req, res) => {
    const {
      name,
      email,
      password,
      organizationName,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !organizationName
    ) {
      return res.status(400).json({
        message:
          "Name, email, password and organization name are required",
      });
    }

    try {
      // --------------------------------------
      // Create organization
      // --------------------------------------

      const organizationResult =
        await pool.query(
          `INSERT INTO organizations
           (name)
           VALUES ($1)
           RETURNING id, name`,
          [organizationName]
        );

      const organization =
        organizationResult.rows[0];

      // --------------------------------------
      // Hash password
      // --------------------------------------

      const passwordHash =
        await bcrypt.hash(
          password,
          10
        );

      // --------------------------------------
      // Create user
      // --------------------------------------

      const userResult =
        await pool.query(
          `INSERT INTO users
           (
             organization_id,
             name,
             email,
             password_hash,
             status
           )
           VALUES
           ($1, $2, $3, $4, 'active')
           RETURNING
             id,
             name,
             email,
             organization_id,
             status`,
          [
            organization.id,
            name,
            email,
            passwordHash,
          ]
        );

      const user =
        userResult.rows[0];

      // --------------------------------------
      // Create Admin role
      // --------------------------------------

      const roleResult =
        await pool.query(
          `INSERT INTO roles
           (
             organization_id,
             name
           )
           VALUES
           ($1, 'Admin')
           RETURNING id`,
          [organization.id]
        );

      const adminRoleId =
        roleResult.rows[0].id;

      // --------------------------------------
      // Assign Admin role
      // --------------------------------------

      await pool.query(
        `INSERT INTO user_roles
         (
           user_id,
           role_id
         )
         VALUES
         ($1, $2)`,
        [
          user.id,
          adminRoleId,
        ]
      );

      // --------------------------------------
      // Audit registration
      // --------------------------------------

      await pool.query(
        `INSERT INTO audit_logs
         (
           organization_id,
           user_id,
           action,
           entity_type,
           entity_id,
           details
         )
         VALUES
         ($1, $2, $3, $4, $5, $6)`,
        [
          organization.id,
          user.id,
          "USER_REGISTERED",
          "user",
          user.id,
          JSON.stringify({
            email: user.email,
          }),
        ]
      );

      // --------------------------------------
      // Create JWT
      // --------------------------------------

      const token =
        jwt.sign(
          {
            userId: user.id,
            organizationId:
              user.organization_id,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "2h",
          }
        );

      res.status(201).json({
        message:
          "Registration successful",
        token,
        user,
      });
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to register user",
      });
    }
  }
);

// ==========================================
// Login
// ==========================================

router.post(
  "/login",
  async (req, res) => {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    try {
      const result =
        await pool.query(
          `SELECT
             id,
             name,
             email,
             password_hash,
             organization_id,
             status
           FROM users
           WHERE email = $1
           ORDER BY id
           LIMIT 1`,
          [email]
        );

      if (result.rows.length === 0) {
        return res.status(401).json({
          message:
            "Invalid email or password",
        });
      }

      const user =
        result.rows[0];

      // --------------------------------------
      // Check account status
      // --------------------------------------

      if (user.status !== "active") {
        return res.status(403).json({
          message:
            "Your account is inactive",
        });
      }

      // --------------------------------------
      // Check password
      // --------------------------------------

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password_hash
        );

      if (!passwordMatch) {
        // Log failed login
        await pool.query(
          `INSERT INTO audit_logs
           (
             organization_id,
             user_id,
             action,
             entity_type,
             entity_id,
             details
           )
           VALUES
           ($1, $2, $3, $4, $5, $6)`,
          [
            user.organization_id,
            user.id,
            "LOGIN_FAILED",
            "user",
            user.id,
            JSON.stringify({
              email:
                user.email,
              reason:
                "invalid_password",
            }),
          ]
        );

        return res.status(401).json({
          message:
            "Invalid email or password",
        });
      }

      // --------------------------------------
      // Create JWT
      // --------------------------------------

      const token =
        jwt.sign(
          {
            userId: user.id,
            organizationId:
              user.organization_id,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "2h",
          }
        );

      // --------------------------------------
      // Log successful login
      // --------------------------------------

      await pool.query(
        `INSERT INTO audit_logs
         (
           organization_id,
           user_id,
           action,
           entity_type,
           entity_id,
           details
         )
         VALUES
         ($1, $2, $3, $4, $5, $6)`,
        [
          user.organization_id,
          user.id,
          "LOGIN_SUCCESS",
          "user",
          user.id,
          JSON.stringify({
            email:
              user.email,
          }),
        ]
      );

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        organization_id:
          user.organization_id,
        status: user.status,
      };

      res.json({
        message:
          "Login successful",
        token,
        user: safeUser,
      });
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to login",
      });
    }
  }
);

// ==========================================
// Current User
// ==========================================

router.get(
  "/me",
  authenticateToken,
  async (req, res) => {
    try {
      const result =
        await pool.query(
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
          message:
            "User not found",
        });
      }

      res.json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "Get current user error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load current user",
      });
    }
  }
);

// ==========================================
// Logout
// ==========================================

router.post(
  "/logout",
  authenticateToken,
  async (req, res) => {
    try {
      await pool.query(
        `INSERT INTO audit_logs
         (
           organization_id,
           user_id,
           action,
           entity_type,
           entity_id,
           details
         )
         VALUES
         ($1, $2, $3, $4, $5, $6)`,
        [
          req.user.organizationId,
          req.user.userId,
          "LOGOUT",
          "user",
          req.user.userId,
          JSON.stringify({}),
        ]
      );

      res.json({
        message:
          "Logout successful",
      });
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to logout",
      });
    }
  }
);

module.exports = router;
