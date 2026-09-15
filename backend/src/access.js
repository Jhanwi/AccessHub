const express = require("express");

const pool = require("./db");

const {
  authenticateToken,
  requirePermission,
} = require("./middleware");

const router = express.Router();

// ==========================================
// Get Access Grants
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
           access_grants.status,
           access_grants.granted_at,
           access_grants.revoked_at,

           users.id AS user_id,
           users.name AS user_name,
           users.email AS user_email,

           applications.id AS application_id,
           applications.name AS application_name,

           granted_by_user.name AS granted_by_name

         FROM access_grants

         JOIN users
           ON access_grants.user_id = users.id

         JOIN applications
           ON access_grants.application_id =
              applications.id

         LEFT JOIN users AS granted_by_user
           ON access_grants.granted_by =
              granted_by_user.id

         WHERE users.organization_id = $1
         AND applications.organization_id = $1

         ORDER BY access_grants.granted_at DESC`,
        [organizationId]
      );

      const data = result.rows.map((row) => ({
        id: row.id,

        employee: {
          id: row.user_id,
          name: row.user_name,
          email: row.user_email,
        },

        application: {
          id: row.application_id,
          name: row.application_name,
        },

        status: row.status,
        grantedAt: row.granted_at,
        revokedAt: row.revoked_at,
        grantedBy: row.granted_by_name,
      }));

      res.json({
        data,
      });
    } catch (error) {
      console.error(
        "Get access grants error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load access grants",
      });
    }
  }
);

// ==========================================
// Grant Application Access
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
          "User and application are required",
      });
    }

    try {
      // --------------------------------------
      // Check employee
      // --------------------------------------

      const userResult = await pool.query(
        `SELECT id, name, email
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

      // --------------------------------------
      // Check application
      // --------------------------------------

      const applicationResult =
        await pool.query(
          `SELECT id, name
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

      const employee =
        userResult.rows[0];

      const application =
        applicationResult.rows[0];

      // --------------------------------------
      // Check existing access
      // --------------------------------------

      const existingResult =
        await pool.query(
          `SELECT
             id,
             status
           FROM access_grants
           WHERE user_id = $1
           AND application_id = $2`,
          [
            userId,
            applicationId,
          ]
        );

      let accessGrant;

      if (
        existingResult.rows.length > 0
      ) {
        const existing =
          existingResult.rows[0];

        // Already active
        if (existing.status === "active") {
          return res.status(409).json({
            message:
              "Employee already has access",
          });
        }

        // Reactivate previously revoked access
        const updateResult =
          await pool.query(
            `UPDATE access_grants
             SET
               status = 'active',
               granted_by = $1,
               granted_at =
                 CURRENT_TIMESTAMP,
               revoked_at = NULL
             WHERE id = $2
             RETURNING *`,
            [
              req.user.userId,
              existing.id,
            ]
          );

        accessGrant =
          updateResult.rows[0];
      } else {
        // Create new access grant
        const insertResult =
          await pool.query(
            `INSERT INTO access_grants
             (
               user_id,
               application_id,
               granted_by,
               status
             )
             VALUES
             ($1, $2, $3, 'active')
             RETURNING *`,
            [
              userId,
              applicationId,
              req.user.userId,
            ]
          );

        accessGrant =
          insertResult.rows[0];
      }

      // --------------------------------------
      // Create audit log
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
          "ACCESS_GRANTED",
          "access_grant",
          accessGrant.id,
          JSON.stringify({
            employeeId: employee.id,
            employeeName: employee.name,
            applicationId:
              application.id,
            applicationName:
              application.name,
          }),
        ]
      );

      res.status(201).json({
        message:
          "Application access granted successfully",
        access: accessGrant,
      });
    } catch (error) {
      console.error(
        "Grant access error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to grant application access",
      });
    }
  }
);

// ==========================================
// Revoke Application Access
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
      // --------------------------------------
      // Find access grant
      // --------------------------------------

      const accessResult =
        await pool.query(
          `SELECT
             access_grants.id,
             access_grants.user_id,
             access_grants.application_id,
             access_grants.status,

             users.name AS user_name,
             users.email AS user_email,

             applications.name AS application_name

           FROM access_grants

           JOIN users
             ON access_grants.user_id =
                users.id

           JOIN applications
             ON access_grants.application_id =
                applications.id

           WHERE access_grants.id = $1
           AND users.organization_id = $2
           AND applications.organization_id = $2`,
          [
            accessId,
            organizationId,
          ]
        );

      if (
        accessResult.rows.length === 0
      ) {
        return res.status(404).json({
          message:
            "Access grant not found",
        });
      }

      const access =
        accessResult.rows[0];

      if (access.status === "revoked") {
        return res.status(409).json({
          message:
            "Access is already revoked",
        });
      }

      // --------------------------------------
      // Revoke access
      // --------------------------------------

      const updateResult =
        await pool.query(
          `UPDATE access_grants
           SET
             status = 'revoked',
             revoked_at =
               CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING *`,
          [accessId]
        );

      const revokedAccess =
        updateResult.rows[0];

      // --------------------------------------
      // Create audit log
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
          "ACCESS_REVOKED",
          "access_grant",
          accessId,
          JSON.stringify({
            employeeId:
              access.user_id,
            employeeName:
              access.user_name,
            applicationId:
              access.application_id,
            applicationName:
              access.application_name,
          }),
        ]
      );

      res.json({
        message:
          "Application access revoked successfully",
        access: revokedAccess,
      });
    } catch (error) {
      console.error(
        "Revoke access error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to revoke application access",
      });
    }
  }
);

module.exports = router;
