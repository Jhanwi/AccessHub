const jwt = require("jsonwebtoken");
const pool = require("./db");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    return res.status(401).json({
      message: "Access token required",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

function requirePermission(permissionName) {
  return async (req, res, next) => {
    try {
      const result = await pool.query(
        `SELECT permissions.name
         FROM user_roles
         JOIN roles
           ON user_roles.role_id = roles.id
         JOIN role_permissions
           ON roles.id = role_permissions.role_id
         JOIN permissions
           ON role_permissions.permission_id = permissions.id
         WHERE user_roles.user_id = $1
         AND roles.organization_id = $2
         AND permissions.name = $3`,
        [
          req.user.userId,
          req.user.organizationId,
          permissionName,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          message:
            "You do not have permission to perform this action",
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:");
      console.error(error);

      return res.status(500).json({
        message: "Failed to check permission",
        error: error.message,
      });
    }
  };
}

module.exports = {
  authenticateToken,
  requirePermission,
};