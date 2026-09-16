-- ==========================================================
-- AccessHub RBAC test-setup helper
-- ==========================================================
-- Why this file exists:
-- database/seed.sql inserts organizations, permissions, roles and
-- applications, but it never inserts into role_permissions or
-- user_roles, and it seeds no users. POST /api/auth/register also
-- creates a fresh "Admin" role per new org but does NOT attach any
-- permissions to it. Net effect: every requirePermission(...)
-- middleware check will 403 for any account, including a freshly
-- registered "Admin", until role_permissions rows exist.
--
-- Run this after registering a test user (tests/benchmark.js does
-- the registration for you) to grant that org's Admin role every
-- seeded permission, so the permission-gated endpoints can actually
-- be exercised.
--
-- Usage:
--   psql "$DATABASE_URL" -v org_id=<your_org_id> -f tests/rbac-setup.sql

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.organization_id = :org_id
  AND r.name = 'Admin'
ON CONFLICT DO NOTHING;

-- Sanity check: list what the Admin role can now do
SELECT r.name AS role, p.name AS permission
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.organization_id = :org_id
ORDER BY p.name;
