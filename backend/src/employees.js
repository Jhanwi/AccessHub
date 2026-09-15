const express = require("express");

const pool = require("./db");
const {
  authenticateToken,
  requirePermission,
} = require("./middleware");

const router = express.Router();


// ==========================================
// Get Employees
// ==========================================

router.get(
  "/",
  authenticateToken,
  requirePermission("users:read"),
  async (req, res) => {
    const organizationId = req.user.organizationId;

    try {
      const result = await pool.query(
        `SELECT
           users.id,
           users.name,
           users.email,
           users.status,
           users.created_at,
           roles.name AS role
         FROM users
         LEFT JOIN user_roles
           ON users.id = user_roles.user_id
         LEFT JOIN roles
           ON user_roles.role_id = roles.id
         WHERE users.organization_id = $1
         ORDER BY users.created_at DESC`,
        [organizationId]
      );

      res.json({
        data: result.rows,
      });
    } catch (error) {
      console.error(
        "Get employees error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to load employees",
      });
    }
  }
);


// ==========================================
// Get Single Employee
// ==========================================

router.get(
  "/:id",
  authenticateToken,
  requirePermission("users:read"),
  async (req, res) => {
    const organizationId = req.user.organizationId;
    const employeeId = req.params.id;

    try {
      const result = await pool.query(
        `SELECT
           users.id,
           users.name,
           users.email,
           users.status,
           users.created_at,
           roles.id AS role_id,
           roles.name AS role
         FROM users
         LEFT JOIN user_roles
           ON users.id = user_roles.user_id
         LEFT JOIN roles
           ON user_roles.role_id = roles.id
         WHERE users.id = $1
         AND users.organization_id = $2`,
        [
          employeeId,
          organizationId,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(
        "Get employee error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to load employee",
      });
    }
  }
);


// ==========================================
// Create Employee
// ==========================================

router.post(
  "/",
  authenticateToken,
  requirePermission("users:create"),
  async (req, res) => {
    const {
      name,
      email,
      password,
      roleId,
    } = req.body;

    const organizationId =
      req.user.organizationId;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    try {
      const bcrypt = require("bcryptjs");

      const existingUser = await pool.query(
        `SELECT id
         FROM users
         WHERE organization_id = $1
         AND email = $2`,
        [
          organizationId,
          email,
        ]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          message:
            "An employee with this email already exists",
        });
      }

      const passwordHash =
        await bcrypt.hash(password, 10);

      const userResult = await pool.query(
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
           status,
           created_at`,
        [
          organizationId,
          name,
          email,
          passwordHash,
        ]
      );

      const employee =
        userResult.rows[0];

      if (roleId) {
        await pool.query(
          `INSERT INTO user_roles
           (user_id, role_id)
           SELECT $1, id
           FROM roles
           WHERE id = $2
           AND organization_id = $3`,
          [
            employee.id,
            roleId,
            organizationId,
          ]
        );
      }

      res.status(201).json({
        message: "Employee created successfully",
        employee,
      });
    } catch (error) {
      console.error(
        "Create employee error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to create employee",
      });
    }
  }
);


// ==========================================
// Update Employee
// ==========================================

router.put(
  "/:id",
  authenticateToken,
  requirePermission("users:update"),
  async (req, res) => {
    const employeeId = req.params.id;
    const organizationId =
      req.user.organizationId;

    const {
      name,
      email,
      status,
    } = req.body;

    try {
      const result = await pool.query(
        `UPDATE users
         SET
           name = COALESCE($1, name),
           email = COALESCE($2, email),
           status = COALESCE($3, status)
         WHERE id = $4
         AND organization_id = $5
         RETURNING
           id,
           name,
           email,
           status`,
        [
          name,
          email,
          status,
          employeeId,
          organizationId,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      res.json({
        message: "Employee updated successfully",
        employee: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Update employee error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to update employee",
      });
    }
  }
);


// ==========================================
// Disable Employee
// ==========================================

router.patch(
  "/:id/disable",
  authenticateToken,
  requirePermission("users:update"),
  async (req, res) => {
    const employeeId = req.params.id;
    const organizationId =
      req.user.organizationId;

    try {
      const result = await pool.query(
        `UPDATE users
         SET status = 'inactive'
         WHERE id = $1
         AND organization_id = $2
         RETURNING
           id,
           name,
           email,
           status`,
        [
          employeeId,
          organizationId,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      res.json({
        message: "Employee disabled successfully",
        employee: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Disable employee error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to disable employee",
      });
    }
  }
);


// ==========================================
// Assign Role
// ==========================================

router.patch(
  "/:id/role",
  authenticateToken,
  requirePermission("users:update"),
  async (req, res) => {
    const employeeId = req.params.id;
    const { roleId } = req.body;
    const organizationId =
      req.user.organizationId;

    if (!roleId) {
      return res.status(400).json({
        message: "Role ID is required",
      });
    }

    try {
      const employeeResult =
        await pool.query(
          `SELECT id
           FROM users
           WHERE id = $1
           AND organization_id = $2`,
          [
            employeeId,
            organizationId,
          ]
        );

      if (
        employeeResult.rows.length === 0
      ) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      const roleResult =
        await pool.query(
          `SELECT id
           FROM roles
           WHERE id = $1
           AND organization_id = $2`,
          [
            roleId,
            organizationId,
          ]
        );

      if (
        roleResult.rows.length === 0
      ) {
        return res.status(404).json({
          message: "Role not found",
        });
      }

      await pool.query(
        `DELETE FROM user_roles
         WHERE user_id = $1`,
        [employeeId]
      );

      await pool.query(
        `INSERT INTO user_roles
         (user_id, role_id)
         VALUES ($1, $2)`,
        [
          employeeId,
          roleId,
        ]
      );

      res.json({
        message: "Role assigned successfully",
      });
    } catch (error) {
      console.error(
        "Assign role error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to assign role",
      });
    }
  }
);


module.exports = router;