const express = require("express");

const pool = require("./db");
const {
  authenticateToken,
  requirePermission,
} = require("./middleware");

const router = express.Router();


// ==========================================
// Get Roles
// ==========================================

router.get(
  "/",
  authenticateToken,
  requirePermission("roles:read"),
  async (req, res) => {
    const organizationId =
      req.user.organizationId;

    try {
      const result = await pool.query(
        `SELECT
           roles.id,
           roles.name,
           COUNT(user_roles.user_id) AS employee_count
         FROM roles
         LEFT JOIN user_roles
           ON roles.id = user_roles.role_id
         WHERE roles.organization_id = $1
         GROUP BY roles.id, roles.name
         ORDER BY roles.name`,
        [organizationId]
      );

      const data = result.rows.map(
        (row) => ({
          id: row.id,
          name: row.name,
          employeeCount:
            Number(row.employee_count),
        })
      );

      res.json({ data });
    } catch (error) {
      console.error(
        "Get roles error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to load roles",
      });
    }
  }
);


// ==========================================
// Get Role Permissions
// ==========================================

router.get(
  "/:id",
  authenticateToken,
  requirePermission("roles:read"),
  async (req, res) => {
    const roleId = req.params.id;
    const organizationId =
      req.user.organizationId;

    try {
      const result = await pool.query(
        `SELECT
           roles.id,
           roles.name,
           permissions.id AS permission_id,
           permissions.name AS permission_name,
           permissions.description
         FROM roles
         LEFT JOIN role_permissions
           ON roles.id = role_permissions.role_id
         LEFT JOIN permissions
           ON role_permissions.permission_id =
              permissions.id
         WHERE roles.id = $1
         AND roles.organization_id = $2
         ORDER BY permissions.name`,
        [
          roleId,
          organizationId,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Role not found",
        });
      }

      const role = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        permissions:
          result.rows
            .filter(
              (row) =>
                row.permission_id !== null
            )
            .map((row) => ({
              id: row.permission_id,
              name: row.permission_name,
              description:
                row.description,
            })),
      };

      res.json(role);
    } catch (error) {
      console.error(
        "Get role error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to load role",
      });
    }
  }
);


// ==========================================
// Create Role
// ==========================================

router.post(
  "/",
  authenticateToken,
  requirePermission("roles:create"),
  async (req, res) => {
    const { name } = req.body;

    const organizationId =
      req.user.organizationId;

    if (!name) {
      return res.status(400).json({
        message: "Role name is required",
      });
    }

    try {
      const result = await pool.query(
        `INSERT INTO roles
         (
           organization_id,
           name
         )
         VALUES ($1, $2)
         RETURNING id, name`,
        [
          organizationId,
          name,
        ]
      );

      res.status(201).json({
        message: "Role created successfully",
        role: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Create role error:",
        error.message
      );

      res.status(500).json({
        message: "Failed to create role",
      });
    }
  }
);


// ==========================================
// Update Role Permissions
// ==========================================

router.put(
  "/:id/permissions",
  authenticateToken,
  requirePermission("roles:update"),
  async (req, res) => {
    const roleId = req.params.id;
    const { permissionIds } = req.body;

    const organizationId =
      req.user.organizationId;

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({
        message:
          "permissionIds must be an array",
      });
    }

    try {
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
        `DELETE FROM role_permissions
         WHERE role_id = $1`,
        [roleId]
      );

      for (const permissionId of permissionIds) {
        await pool.query(
          `INSERT INTO role_permissions
           (
             role_id,
             permission_id
           )
           VALUES ($1, $2)`,
          [
            roleId,
            permissionId,
          ]
        );
      }

      res.json({
        message:
          "Role permissions updated successfully",
      });
    } catch (error) {
      console.error(
        "Update role permissions error:",
        error.message
      );

      res.status(500).json({
        message:
          "Failed to update role permissions",
      });
    }
  }
);


module.exports = router;