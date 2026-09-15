const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("./db");

const {
  authenticateToken,
  requirePermission,
} = require("./middleware");

const router = express.Router();

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
      applicationIds = [],
    } = req.body;

    const organizationId = req.user.organizationId;

    if (!name || !email || !password || !roleId) {
      return res.status(400).json({
        message:
          "Name, email, password and role are required",
      });
    }

    if (!Array.isArray(applicationIds)) {
      return res.status(400).json({
        message: "applicationIds must be an array",
      });
    }

    try {
      // 1. Check whether the role belongs to
      // the current organization
      const roleResult = await pool.query(
        `SELECT id
         FROM roles
         WHERE id = $1
         AND organization_id = $2`,
        [roleId, organizationId]
      );

      if (roleResult.rows.length === 0) {
        return res.status(404).json({
          message: "Role not found",
        });
      }

      // 2. Check whether selected applications
      // belong to the current organization
      if (applicationIds.length > 0) {
        const applicationResult = await pool.query(
          `SELECT id
           FROM applications
           WHERE id = ANY($1::int[])
           AND organization_id = $2`,
          [applicationIds, organizationId]
        );

        if (
          applicationResult.rows.length !==
          applicationIds.length
        ) {
          return res.status(400).json({
            message:
              "One or more applications are invalid",
          });
        }
      }

      // 3. Check duplicate email
      const existingUser = await pool.query(
        `SELECT id
         FROM users
         WHERE email = $1
         AND organization_id = $2`,
        [email, organizationId]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          message:
            "An employee with this email already exists",
        });
      }

      // 4. Hash password
      const passwordHash = await bcrypt.hash(
        password,
        10
      );

      // 5. Create employee
      const userResult = await pool.query(
        `INSERT INTO users
         (
           organization_id,
           name,
           email,
           password_hash,
           status
         )
         VALUES ($1, $2, $3, $4, 'active')
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

      const employee = userResult.rows[0];

      // 6. Assign role
      await pool.query(
        `INSERT INTO user_roles
         (user_id, role_id)
         VALUES ($1, $2)`,
        [employee.id, roleId]
      );

      // 7. Grant selected applications
      for (const applicationId of applicationIds) {
        await pool.query(
          `INSERT INTO access_grants
           (
             user_id,
             application_id,
             granted_by,
             status
           )
           VALUES ($1, $2, $3, 'active')`,
          [
            employee.id,
            applicationId,
            req.user.userId,
          ]
        );
      }

      // 8. Create onboarding audit log
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
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          organizationId,
          req.user.userId,
          "EMPLOYEE_ONBOARDED",
          "user",
          employee.id,
          JSON.stringify({
            roleId,
            applicationIds,
          }),
        ]
      );

      res.status(201).json({
        message:
          "Employee onboarded successfully",
        employee,
      });
    } catch (error) {
      console.error(
        "Onboarding error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to onboard employee",
      });
    }
  }
);

module.exports = router;