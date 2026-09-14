-- ==========================================
-- AccessHub Seed Data
-- ==========================================


-- Create demo organization
INSERT INTO organizations (name)
VALUES ('AccessHub Demo');


-- Create permissions
INSERT INTO permissions (name, description)
VALUES
(
    'users:read',
    'View organization users'
),
(
    'users:create',
    'Create organization users'
),
(
    'users:update',
    'Update organization users'
),
(
    'users:delete',
    'Delete organization users'
),
(
    'roles:read',
    'View roles'
),
(
    'roles:create',
    'Create roles'
),
(
    'roles:update',
    'Update roles'
),
(
    'applications:read',
    'View applications'
),
(
    'applications:create',
    'Create applications'
),
(
    'access:grant',
    'Grant application access'
),
(
    'access:revoke',
    'Revoke application access'
),
(
    'audit:read',
    'View audit logs'
);


-- Create default roles
INSERT INTO roles (organization_id, name)
VALUES
(
    1,
    'Admin'
),
(
    1,
    'Manager'
),
(
    1,
    'Developer'
),
(
    1,
    'Employee'
);


-- Create applications
INSERT INTO applications
    (organization_id, name, description)
VALUES
(
    1,
    'GitHub',
    'Source code and repository management'
),
(
    1,
    'Slack',
    'Team communication and messaging'
),
(
    1,
    'Jira',
    'Project and issue management'
),
(
    1,
    'Google Workspace',
    'Email, documents and collaboration'
),
(
    1,
    'Notion',
    'Documentation and knowledge management'
);