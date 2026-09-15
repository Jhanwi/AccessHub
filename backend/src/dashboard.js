const express = require("express");

const pool = require("./db");
const { authenticateToken } = require("./middleware");

const router = express.Router();


// ==========================================
// Dashboard Statistics
// ==========================================

router.get("/stats", authenticateToken, async (req, res) => {
  const organizationId = req.user.organizationId;

  try {

    const totalEmployeesResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM users
       WHERE organization_id = $1`,
      [organizationId]
    );

    const activeEmployeesResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM users
       WHERE organization_id = $1
       AND status = 'active'`,
      [organizationId]
    );

    const applicationsResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM applications
       WHERE organization_id = $1`,
      [organizationId]
    );

    const activeAccessResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM access_grants
       JOIN users
         ON access_grants.user_id = users.id
       WHERE users.organization_id = $1
       AND access_grants.status = 'active'`,
      [organizationId]
    );

    const revokedAccessResult = await pool.query(
      `SELECT COUNT(*) AS count
       FROM access_grants
       JOIN users
         ON access_grants.user_id = users.id
       WHERE users.organization_id = $1
       AND access_grants.status = 'revoked'`,
      [organizationId]
    );

    res.json({
      totalEmployees: Number(
        totalEmployeesResult.rows[0].count
      ),

      activeEmployees: Number(
        activeEmployeesResult.rows[0].count
      ),

      applications: Number(
        applicationsResult.rows[0].count
      ),

      activeAccess: Number(
        activeAccessResult.rows[0].count
      ),

      revokedAccess: Number(
        revokedAccessResult.rows[0].count
      ),
    });

  } catch (error) {

    console.error(
      "Dashboard statistics error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to load dashboard statistics",
    });
  }
});


// ==========================================
// Access Distribution by Application
// ==========================================

router.get(
  "/access-distribution",
  authenticateToken,
  async (req, res) => {

    const organizationId = req.user.organizationId;

    try {

      const result = await pool.query(
        `SELECT
           applications.name,
           COUNT(access_grants.id) AS count
         FROM applications
         LEFT JOIN access_grants
           ON applications.id = access_grants.application_id
           AND access_grants.status = 'active'
         WHERE applications.organization_id = $1
         GROUP BY applications.id, applications.name
         ORDER BY count DESC`,
        [organizationId]
      );

      const data = result.rows.map((row) => ({
        name: row.name,
        count: Number(row.count),
      }));

      res.json({
        data,
      });

    } catch (error) {

      console.error(
        "Access distribution error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to load access distribution",
      });
    }
  }
);


// ==========================================
// Employees by Role
// ==========================================

router.get(
  "/employees-by-role",
  authenticateToken,
  async (req, res) => {

    const organizationId = req.user.organizationId;

    try {

      const result = await pool.query(
        `SELECT
           roles.name,
           COUNT(user_roles.user_id) AS count
         FROM roles
         LEFT JOIN user_roles
           ON roles.id = user_roles.role_id
         LEFT JOIN users
           ON user_roles.user_id = users.id
           AND users.organization_id = $1
         WHERE roles.organization_id = $1
         GROUP BY roles.id, roles.name
         ORDER BY count DESC`,
        [organizationId]
      );

      const data = result.rows.map((row) => ({
        name: row.name,
        count: Number(row.count),
      }));

      res.json({
        data,
      });

    } catch (error) {

      console.error(
        "Employees by role error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to load employees by role",
      });
    }
  }
);


// ==========================================
// Access Activity
// ==========================================

router.get(
  "/access-activity",
  authenticateToken,
  async (req, res) => {

    const organizationId = req.user.organizationId;

    try {

      const result = await pool.query(
        `SELECT
           DATE(access_grants.granted_at) AS date,
           COUNT(*) AS count
         FROM access_grants
         JOIN users
           ON access_grants.user_id = users.id
         WHERE users.organization_id = $1
         GROUP BY DATE(access_grants.granted_at)
         ORDER BY date`,
        [organizationId]
      );

      const data = result.rows.map((row) => ({
        date: row.date,
        count: Number(row.count),
      }));

      res.json({
        data,
      });

    } catch (error) {

      console.error(
        "Access activity error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to load access activity",
      });
    }
  }
);


// ==========================================
// Recent Activity
// ==========================================

router.get(
  "/recent-activity",
  authenticateToken,
  async (req, res) => {

    const organizationId = req.user.organizationId;

    try {

      const result = await pool.query(
        `SELECT
           audit_logs.id,
           audit_logs.action,
           audit_logs.entity_type,
           audit_logs.details,
           audit_logs.created_at,
           users.name AS user_name
         FROM audit_logs
         LEFT JOIN users
           ON audit_logs.user_id = users.id
         WHERE audit_logs.organization_id = $1
         ORDER BY audit_logs.created_at DESC
         LIMIT 8`,
        [organizationId]
      );

      res.json({
        data: result.rows,
      });

    } catch (error) {

      console.error(
        "Recent activity error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to load recent activity",
      });
    }
  }
);


module.exports = router;