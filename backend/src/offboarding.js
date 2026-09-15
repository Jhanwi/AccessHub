const express = require("express");
const pool = require("./db");

const {
  authenticateToken,
  requirePermission,
} = require("./middleware");

const router = express.Router();

router.patch(
  "/:id",
  authenticateToken,
  requirePermission("users:update"),
  async (req, res) => {
    const employeeId = req.params.id;
    const organizationId = req.user.organizationId;

    try {
      // 1. Check employee belongs
      // to current organization
      const employeeResult = await pool.query(
        `SELECT
           id,
           name,
           email,
           status
         FROM users
         WHERE id = $1
         AND organization_id = $2`,
        [employeeId, organizationId]
      );

      if (employeeResult.rows.length === 0) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      const employee = employeeResult.rows[0];

      // 2. Disable employee
      const updateResult = await pool.query(
        `UPDATE users
         SET status = 'inactive'
         WHERE id = $1
         AND organization_id = $2
         RETURNING
           id,
           name,
           email,
           status`,
        [employeeId, organizationId]
      );

      // 3. Find active application access
      const accessResult = await pool.query(
        `SELECT
           id,
           application_id
         FROM access_grants
         WHERE user_id = $1
         AND status = 'active'`,
        [employeeId]
      );

      // 4. Revoke all active access
      await pool.query(
        `UPDATE access_grants
         SET
           status = 'revoked',
           revoked_at = CURRENT_TIMESTAMP
         WHERE user_id = $1
         AND status = 'active'`,
        [employeeId]
      );

      // 5. Create employee offboarding audit log
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
          "EMPLOYEE_OFFBOARDED",
          "user",
          employeeId,
          JSON.stringify({
            revokedAccessCount:
              accessResult.rows.length,
          }),
        ]
      );

      // 6. Create audit log for each revoked application
      for (const access of accessResult.rows) {
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
            "ACCESS_REVOKED",
            "access_grant",
            access.id,
            JSON.stringify({
              employeeId,
              applicationId:
                access.application_id,
              reason: "employee_offboarding",
            }),
          ]
        );
      }

      res.json({
        message:
          "Employee offboarded successfully",
        employee: updateResult.rows[0],
        revokedAccessCount:
          accessResult.rows.length,
      });
    } catch (error) {
      console.error(
        "Offboarding error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to offboard employee",
      });
    }
  }
);

module.exports = router;