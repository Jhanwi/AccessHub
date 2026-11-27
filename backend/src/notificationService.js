const pool = require("./db");

async function notifyAdmins(
  organizationId,
  title,
  message,
  type = "general",
  entityType = null,
  entityId = null
) {
  try {
    await pool.query(
      `INSERT INTO notifications
       (
         organization_id,
         recipient_user_id,
         title,
         message,
         type,
         entity_type,
         entity_id
       )
       SELECT
         $1,
         u.id,
         $2,
         $3,
         $4,
         $5,
         $6
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       WHERE u.organization_id = $1
       AND LOWER(r.name) = 'admin'
       AND u.status = 'active'`,
      [
        organizationId,
        title,
        message,
        type,
        entityType,
        entityId,
      ]
    );
  } catch (error) {
    console.error("Admin notification error:", error.message);
  }
}

async function notifyUser(
  organizationId,
  userId,
  title,
  message,
  type = "general",
  entityType = null,
  entityId = null
) {
  try {
    await pool.query(
      `INSERT INTO notifications
       (
         organization_id,
         recipient_user_id,
         title,
         message,
         type,
         entity_type,
         entity_id
       )
       SELECT $1, u.id, $3, $4, $5, $6, $7
       FROM users u
       WHERE u.id = $2
       AND u.organization_id = $1`,
      [
        organizationId,
        userId,
        title,
        message,
        type,
        entityType,
        entityId,
      ]
    );
  } catch (error) {
    console.error("User notification error:", error.message);
  }
}

module.exports = {
  notifyAdmins,
  notifyUser,
};
