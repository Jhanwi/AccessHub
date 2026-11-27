const express = require("express");
const pool = require("./db");
const { authenticateToken } = require("./middleware");

const router = express.Router();

router.use(authenticateToken);

// Get latest notifications and unread count
router.get("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;

    const result = await pool.query(
      `SELECT id, title, message, type, entity_type,
              entity_id, is_read, created_at
       FROM notifications
       WHERE recipient_user_id = $1
       AND organization_id = $2
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId, organizationId]
    );

    const count = await pool.query(
      `SELECT COUNT(*)::int AS unread_count
       FROM notifications
       WHERE recipient_user_id = $1
       AND organization_id = $2
       AND is_read = FALSE`,
      [userId, organizationId]
    );

    res.json({
      data: result.rows,
      unreadCount: count.rows[0].unread_count,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      message: "Failed to load notifications",
    });
  }
});

// Get notification history
router.get("/history", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, message, type, entity_type,
              entity_id, is_read, created_at
       FROM notifications
       WHERE recipient_user_id = $1
       AND organization_id = $2
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.userId, req.user.organizationId]
    );

    res.json({ data: result.rows });
  } catch (error) {
    console.error("Notification history error:", error);
    res.status(500).json({
      message: "Failed to load notification history",
    });
  }
});

// Mark all notifications as read
router.patch("/read-all", async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE recipient_user_id = $1
       AND organization_id = $2
       AND is_read = FALSE`,
      [req.user.userId, req.user.organizationId]
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({
      message: "Failed to update notifications",
    });
  }
});

// Mark one notification as read
router.patch("/:id/read", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1
       AND recipient_user_id = $2
       AND organization_id = $3
       RETURNING id`,
      [
        req.params.id,
        req.user.userId,
        req.user.organizationId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({
      message: "Failed to update notification",
    });
  }
});

module.exports = router;
