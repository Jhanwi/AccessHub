const express = require("express");

const pool = require("./db");

const {
  authenticateToken,
  requirePermission,
} = require("./middleware");

const router = express.Router();

// ==========================================
// GET ALL ACCESS GRANTS
// ==========================================

router.get(
  "/",
  authenticateToken,
  requirePermission("applications:read"),
  async (req, res) => {
    const organizationId =
      req.user.organizationId;

    try {
      const result = await pool.query(
        `SELECT
           access_grants.id,
           users.id AS user_id,
           users.name AS employee_name,
           users.email,
           applications.id AS application_id,
           applications.name AS application_name,
           access_grants.status,
           access_grants.granted_at,
           access_grants.revoked_at,
           grantor.name AS granted_by
         FROM access_grants
         JOIN users
           ON access_grants.user_id = users.id
         JOIN applications
           ON access_grants.application_id =
              applications.id
         LEFT JOIN users grantor
           ON access_grants.granted_by =
              grantor.id
         WHERE users.organization_id = $1
         AND applications.organization_id = $1
         ORDER BY access_grants.granted_at DESC`,
        [organizationId]
      );

      res.json({
        data: result.rows,
      });
    } catch (error) {
      console.error(
        "Get access grants error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to load access grants",
      });
    }
  }
);

// ==========================================
// GRANT APPLICATION ACCESS
// ==========================================

router.post(
  "/grant",
  authenticateToken,
  requirePermission("access:grant"),
  async (req, res) => {
    const {
      userId,
      applicationId,
    } = req.body;

    const organizationId =
      req.user.organizationId;

    if (!userId || !applicationId) {
      return res.status(400).json({
        message:
          "User ID and application ID are required",
      });
    }

    try {
      // Check employee belongs to organization
      const userResult = await pool.query(
        `SELECT id
         FROM users
         WHERE id = $1
         AND organization_id = $2`,
        [
          userId,
          organizationId,
        ]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      // Check application belongs to organization
      const applicationResult =
        await pool.query(
          `SELECT id
           FROM applications
           WHERE id = $1
           AND organization_id = $2`,
          [
            applicationId,
            organizationId,
          ]
        );

      if (
        applicationResult.rows.length === 0
      ) {
        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      // Check existing access
      const existingResult =
        await pool.query(
          `SELECT id, status
           FROM access_grants
           WHERE user_id = $1
           AND application_id = $2`,
          [
            userId,
            applicationId,
          ]
        );

      if (
        existingResult.rows.length > 0 &&
        existingResult.rows[0].status ===
          "active"
      ) {
        return res.status(409).json({
          message:
            "Access is already active",
        });
      }

      let result;

      if (
        existingResult.rows.length > 0
      ) {
        result = await pool.query(
          `UPDATE access_grants
           SET
             status = 'active',
             granted_by = $1,
             granted_at = CURRENT_TIMESTAMP,
             revoked_at = NULL
           WHERE id = $2
           RETURNING *`,
          [
            req.user.userId,
            existingResult.rows[0].id,
          ]
        );
      } else {
        result = await pool.query(
          `INSERT INTO access_grants
           (
             user_id,
             application_id,
             granted_by,
             status
           )
           VALUES ($1, $2, $3, 'active')
           RETURNING *`,
          [
            userId,
            applicationId,
            req.user.userId,
          ]
        );
      }

      res.status(201).json({
        message:
          "Application access granted",
        access: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Grant access error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to grant application access",
      });
    }
  }
);

// ==========================================
// REVOKE APPLICATION ACCESS
// ==========================================

router.patch(
  "/:id/revoke",
  authenticateToken,
  requirePermission("access:revoke"),
  async (req, res) => {
    const accessId = req.params.id;

    const organizationId =
      req.user.organizationId;

    try {
      const result = await pool.query(
        `UPDATE access_grants
         SET
           status = 'revoked',
           revoked_at = CURRENT_TIMESTAMP
         WHERE id = $1
         AND user_id IN (
           SELECT id
           FROM users
           WHERE organization_id = $2
         )
         AND application_id IN (
           SELECT id
           FROM applications
           WHERE organization_id = $2
         )
         RETURNING *`,
        [
          accessId,
          organizationId,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            "Access grant not found",
        });
      }

      res.json({
        message:
          "Application access revoked",
        access: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Revoke access error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to revoke application access",
      });
    }
  }
);

module.exports = router;