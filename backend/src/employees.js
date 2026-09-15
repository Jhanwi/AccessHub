const express = require("express");
const bcrypt = require("bcrypt");

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
    const organizationId =
      req.user.organizationId;

    try {
      const result = await pool.query(
        `SELECT
           users.id,
           users.name,
           users.email,
           users.status,
           users.created_at,

           roles.id AS role_id,
           roles.name AS role_name

         FROM users

         LEFT JOIN user_roles
           ON users.id = user_roles.user_id

         LEFT JOIN roles
           ON user_roles.role_id = roles.id

         WHERE users.organization_id = $1

         ORDER BY users.created_at DESC`,
        [organizationId]
      );

      const data = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        status: row.status,
        createdAt: row.created_at,
        role: row.role_id
          ? {
              id: row.role_id,
              name: row.role_name,
            }
          : null,
      }));

      res.json({
        data,
      });
    } catch (error) {
      console.error(
        "Get employees error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load employees",
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
    const employeeId = req.params.id;

    const organizationId =
      req.user.organizationId;

    try {
      const result = await pool.query(
        `SELECT
           users.id,
           users.name,
           users.email,
           users.status,
           users.created_at,

           roles.id AS role_id,
           roles.name AS role_name

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

      const row = result.rows[0];

      res.json({
        id: row.id,
        name: row.name,
        email: row.email,
        status: row.status,
        createdAt: row.created_at,
        role: row.role_id
          ? {
              id: row.role_id,
              name: row.role_name,
            }
          : null,
      });
    } catch (error) {
      console.error(
        "Get employee error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load employee",
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

    if (
      !name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    try {
      // --------------------------------------
      // Check duplicate email
      // --------------------------------------

      const existingUser =
        await pool.query(
          `SELECT id
           FROM users
           WHERE email = $1
           AND organization_id = $2`,
          [
            email,
            organizationId,
          ]
        );

      if (
        existingUser.rows.length > 0
      ) {
        return res.status(409).json({
          message:
            "An employee with this email already exists",
        });
      }

      // --------------------------------------
      // Hash password
      // --------------------------------------

      const passwordHash =
        await bcrypt.hash(
          password,
          10
        );

      // --------------------------------------
      // Create employee
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
             status,
             organization_id,
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

      // --------------------------------------
      // Assign role if provided
      // --------------------------------------

      let role = null;

      if (roleId) {
        const roleResult =
          await pool.query(
            `SELECT id, name
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
            message:
              "Role not found",
          });
        }

        role = roleResult.rows[0];

        await pool.query(
          `INSERT INTO user_roles
           (user_id, role_id)
           VALUES ($1, $2)`,
          [
            employee.id,
            roleId,
          ]
        );
      }

      // --------------------------------------
      // Audit log
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
          organizationId,
          req.user.userId,
          "EMPLOYEE_CREATED",
          "user",
          employee.id,
          JSON.stringify({
            employeeName:
              employee.name,
            employeeEmail:
              employee.email,
            roleId:
              role?.id || null,
            roleName:
              role?.name || null,
          }),
        ]
      );

      res.status(201).json({
        message:
          "Employee created successfully",
        employee,
      });
    } catch (error) {
      console.error(
        "Create employee error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to create employee",
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
    const employeeId =
      req.params.id;

    const {
      name,
      email,
    } = req.body;

    const organizationId =
      req.user.organizationId;

    if (!name || !email) {
      return res.status(400).json({
        message:
          "Name and email are required",
      });
    }

    try {
      const result =
        await pool.query(
          `UPDATE users
           SET
             name = $1,
             email = $2
           WHERE id = $3
           AND organization_id = $4
           RETURNING
             id,
             name,
             email,
             status`,
          [
            name,
            email,
            employeeId,
            organizationId,
          ]
        );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            "Employee not found",
        });
      }

      const employee =
        result.rows[0];

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
          organizationId,
          req.user.userId,
          "EMPLOYEE_UPDATED",
          "user",
          employeeId,
          JSON.stringify({
            name: employee.name,
            email: employee.email,
          }),
        ]
      );

      res.json({
        message:
          "Employee updated successfully",
        employee,
      });
    } catch (error) {
      console.error(
        "Update employee error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update employee",
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
    const employeeId =
      req.params.id;

    const organizationId =
      req.user.organizationId;

    try {
      const result =
        await pool.query(
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
          message:
            "Employee not found",
        });
      }

      const employee =
        result.rows[0];

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
          organizationId,
          req.user.userId,
          "EMPLOYEE_DISABLED",
          "user",
          employeeId,
          JSON.stringify({
            employeeName:
              employee.name,
            employeeEmail:
              employee.email,
          }),
        ]
      );

      res.json({
        message:
          "Employee disabled successfully",
        employee,
      });
    } catch (error) {
      console.error(
        "Disable employee error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to disable employee",
      });
    }
  }
);

// ==========================================
// Change Employee Role
// ==========================================

router.patch(
  "/:id/role",
  authenticateToken,
  requirePermission("users:update"),
  async (req, res) => {
    const employeeId =
      req.params.id;

    const { roleId } = req.body;

    const organizationId =
      req.user.organizationId;

    if (!roleId) {
      return res.status(400).json({
        message:
          "Role ID is required",
      });
    }

    try {
      // --------------------------------------
      // Check employee
      // --------------------------------------

      const employeeResult =
        await pool.query(
          `SELECT id, name, email
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
          message:
            "Employee not found",
        });
      }

      // --------------------------------------
      // Check role
      // --------------------------------------

      const roleResult =
        await pool.query(
          `SELECT id, name
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
          message:
            "Role not found",
        });
      }

      // --------------------------------------
      // Get previous role
      // --------------------------------------

      const previousRoleResult =
        await pool.query(
          `SELECT
             roles.id,
             roles.name
           FROM user_roles
           JOIN roles
             ON user_roles.role_id =
                roles.id
           WHERE user_roles.user_id = $1
           AND roles.organization_id = $2`,
          [
            employeeId,
            organizationId,
          ]
        );

      const previousRole =
        previousRoleResult.rows[0] ||
        null;

      // --------------------------------------
      // Replace role
      // --------------------------------------

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

      const employee =
        employeeResult.rows[0];

      const newRole =
        roleResult.rows[0];

      // --------------------------------------
      // Audit log
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
          organizationId,
          req.user.userId,
          "ROLE_CHANGED",
          "user",
          employeeId,
          JSON.stringify({
            employeeName:
              employee.name,
            previousRoleId:
              previousRole?.id || null,
            previousRoleName:
              previousRole?.name || null,
            newRoleId:
              newRole.id,
            newRoleName:
              newRole.name,
          }),
        ]
      );

      res.json({
        message:
          "Employee role updated successfully",
        role: newRole,
      });
    } catch (error) {
      console.error(
        "Change employee role error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update employee role",
      });
    }
  }
);

module.exports = router;
