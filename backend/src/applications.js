const express = require("express");

const pool = require("./db");

const {
  authenticateToken,
  requirePermission,
} = require("./middleware");

const router = express.Router();

// ==========================================
// Get Applications
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
           applications.id,
           applications.name,
           applications.description,
           applications.created_at
         FROM applications
         WHERE applications.organization_id = $1
         ORDER BY applications.name`,
        [organizationId]
      );

      const data =
        result.rows.map(
          (row) => ({
            id: row.id,
            name: row.name,
            description:
              row.description,
            createdAt:
              row.created_at,
          })
        );

      res.json({
        data,
      });
    } catch (error) {
      console.error(
        "Get applications error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load applications",
      });
    }
  }
);

// ==========================================
// Get Single Application
// ==========================================

router.get(
  "/:id",
  authenticateToken,
  requirePermission("applications:read"),
  async (req, res) => {
    const applicationId =
      req.params.id;

    const organizationId =
      req.user.organizationId;

    try {
      const result =
        await pool.query(
          `SELECT
             id,
             name,
             description,
             created_at
           FROM applications
           WHERE id = $1
           AND organization_id = $2`,
          [
            applicationId,
            organizationId,
          ]
        );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      const application =
        result.rows[0];

      res.json(
        application
      );
    } catch (error) {
      console.error(
        "Get application error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load application",
      });
    }
  }
);

// ==========================================
// Create Application
// ==========================================

router.post(
  "/",
  authenticateToken,
  requirePermission("applications:create"),
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const organizationId = req.user.organizationId;

      if (!name || !name.trim()) {
        return res.status(400).json({
          message: "Application name is required",
        });
      }

      const result = await pool.query(
        `INSERT INTO applications
          (organization_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, created_at`,
        [organizationId, name.trim(), description || null]
      );

      const application = result.rows[0];

      // Create audit log
      await pool.query(
        `INSERT INTO audit_logs
          (organization_id, user_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          organizationId,
          req.user.userId,
          "APPLICATION_CREATED",
          "application",
          application.id,
          JSON.stringify({
            applicationName: application.name,
            description: application.description,
          }),
        ]
      );

      res.status(201).json({
        message: "Application created successfully",
        application,
      });
    } catch (error) {
      console.error("Create application error:", error);

      res.status(500).json({
        message: "Failed to create application",
      });
    }
  }
);

module.exports = router;
