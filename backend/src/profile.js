
const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("./db");
const { authenticateToken } = require("./middleware");

const router = express.Router();

// ==========================================
// Get current user's profile
// ==========================================

router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;

    const profileResult = await pool.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.phone,
         u.profile_picture,
         u.status,
         u.created_at,
         o.name AS organization_name,
         COALESCE(
           ARRAY_AGG(DISTINCT r.name)
           FILTER (WHERE r.name IS NOT NULL),
           ARRAY[]::text[]
         ) AS roles
       FROM users u
       JOIN organizations o
         ON o.id = u.organization_id
       LEFT JOIN user_roles ur
         ON ur.user_id = u.id
       LEFT JOIN roles r
         ON r.id = ur.role_id
         AND r.organization_id = u.organization_id
       WHERE u.id = $1
         AND u.organization_id = $2
       GROUP BY u.id, o.name`,
      [userId, organizationId]
    );

    if (!profileResult.rows.length) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    const applicationsResult = await pool.query(
      `SELECT
         a.id,
         a.name,
         a.description,
         ag.status,
         ag.granted_at,
         ag.revoked_at
       FROM access_grants ag
       JOIN applications a
         ON a.id = ag.application_id
         AND a.organization_id = $2
       WHERE ag.user_id = $1
       ORDER BY ag.granted_at DESC`,
      [userId, organizationId]
    );

    const permissionsResult = await pool.query(
      `SELECT DISTINCT
         p.id,
         p.name,
         p.description
       FROM user_roles ur
       JOIN roles r
         ON r.id = ur.role_id
       JOIN role_permissions rp
         ON rp.role_id = r.id
       JOIN permissions p
         ON p.id = rp.permission_id
       WHERE ur.user_id = $1
         AND r.organization_id = $2
       ORDER BY p.name`,
      [userId, organizationId]
    );

    const activityResult = await pool.query(
      `SELECT
         id,
         action,
         entity_type,
         entity_id,
         details,
         created_at
       FROM audit_logs
       WHERE user_id = $1
         AND organization_id = $2
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId, organizationId]
    );

    res.json({
      profile: profileResult.rows[0],
      applications: applicationsResult.rows,
      permissions: permissionsResult.rows,
      activities: activityResult.rows,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);

    res.status(500).json({
      message: "Failed to load profile",
    });
  }
});

// ==========================================
// Update personal information
// ==========================================

router.patch("/", authenticateToken, async (req, res) => {
  const { name, phone, profilePicture } = req.body;

  if (profilePicture !== undefined && profilePicture !== null) {
    const validImage =
     typeof profilePicture === "string" &&
     /^data:image\/(png|jpeg|webp);base64,/.test(profilePicture);

   if (!validImage || profilePicture.length > 2800000) {
     return res.status(400).json({
       message: "Use a PNG, JPG, or WEBP image under 2 MB",
      });
    }
  }

  if (!name || !name.trim()) {
    return res.status(400).json({
      message: "Name is required",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = $1,
           phone = $2,
           profile_picture = COALESCE($3, profile_picture)
       WHERE id = $4
         AND organization_id = $5
       RETURNING id, name, email, phone, profile_picture, status`,
      [
        name.trim(),
        phone?.trim() || null,
        profilePicture || null,
        req.user.userId,
        req.user.organizationId,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    await pool.query(
      `INSERT INTO audit_logs
       (organization_id, user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.organizationId,
        req.user.userId,
        "PROFILE_UPDATED",
        "user",
        req.user.userId,
        JSON.stringify({ name: result.rows[0].name }),
      ]
    );

    res.json({
      message: "Profile updated successfully",
      profile: result.rows[0],
    });
  } catch (error) {
    console.error("Profile update error:", error);

    res.status(500).json({
      message: "Failed to update profile",
    });
  }
});

// ==========================================
// Change password
// ==========================================

router.patch("/password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Current and new passwords are required",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "New password must contain at least 8 characters",
    });
  }

  try {
    const userResult = await pool.query(
      `SELECT password_hash
       FROM users
       WHERE id = $1
         AND organization_id = $2`,
      [req.user.userId, req.user.organizationId]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password_hash
    );

    if (!passwordMatches) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2
         AND organization_id = $3`,
      [
        passwordHash,
        req.user.userId,
        req.user.organizationId,
      ]
    );

    await pool.query(
      `INSERT INTO audit_logs
       (organization_id, user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.organizationId,
        req.user.userId,
        "PASSWORD_CHANGED",
        "user",
        req.user.userId,
        JSON.stringify({}),
      ]
    );

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);

    res.status(500).json({
      message: "Failed to change password",
    });
  }
});

module.exports = router;
