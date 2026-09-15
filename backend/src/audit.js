const express = require("express");

const pool = require("./db");

const {
  authenticateToken,
  requirePermission,
} = require("./middleware");

const router = express.Router();

// ==========================================
// Get Audit Logs
// ==========================================

router.get(
  "/",
  authenticateToken,
  requirePermission("audit:read"),
  async (req, res) => {
    const organizationId =
      req.user.organizationId;

    try {
      const result = await pool.query(
        `SELECT
           audit_logs.id,
           audit_logs.action,
           audit_logs.entity_type,
           audit_logs.entity_id,
           audit_logs.details,
           audit_logs.created_at,
           users.name AS user_name,
           users.email AS user_email
         FROM audit_logs
         LEFT JOIN users
           ON audit_logs.user_id = users.id
         WHERE audit_logs.organization_id = $1
         ORDER BY audit_logs.created_at DESC`,
        [organizationId]
      );

      const data = result.rows.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        details: row.details,
        createdAt: row.created_at,
        user: {
          name: row.user_name,
          email: row.user_email,
        },
      }));

      res.json({
        data,
      });
    } catch (error) {
      console.error(
        "Get audit logs error:",
        error
      );

      res.status(500).json({
        message: "Failed to load audit logs",
      });
    }
  }
);

module.exports = router;
