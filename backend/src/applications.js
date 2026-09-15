const express = require("express");

const pool = require("./db");

const {
  authenticateToken,
  requirePermission,
} = require("./middleware");

const router = express.Router();

// ==========================================
// GET ALL APPLICATIONS
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
           id,
           name,
           description,
           created_at
         FROM applications
         WHERE organization_id = $1
         ORDER BY name`,
        [organizationId]
      );

      res.json({
        data: result.rows,
      });
    } catch (error) {
      console.error(
        "Get applications error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to load applications",
      });
    }
  }
);

// ==========================================
// GET APPLICATION BY ID
// ==========================================

router.get(
  "/:id",
  authenticateToken,
  requirePermission("applications:read"),
  async (req, res) => {
    const applicationId = req.params.id;
    const organizationId =
      req.user.organizationId;

    try {
      const result = await pool.query(
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
          message: "Application not found",
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(
        "Get application error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to load application",
      });
    }
  }
);

// ==========================================
// CREATE APPLICATION
// ==========================================

router.post(
  "/",
  authenticateToken,
  requirePermission("applications:create"),
  async (req, res) => {
    const {
      name,
      description,
    } = req.body;

    const organizationId =
      req.user.organizationId;

    if (!name) {
      return res.status(400).json({
        message: "Application name is required",
      });
    }

    try {
      const result = await pool.query(
        `INSERT INTO applications
         (organization_id, name, description)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, created_at`,
        [
          organizationId,
          name,
          description || null,
        ]
      );

      res.status(201).json({
        message:
          "Application created successfully",
        application: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Create application error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to create application",
      });
    }
  }
);

module.exports = router;