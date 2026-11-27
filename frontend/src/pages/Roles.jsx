import { useEffect, useMemo, useState } from "react";
import "./Roles.css";
import api from "../api";

function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState("");
  const [roleName, setRoleName] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [roleEmployees, setRoleEmployees] = useState([]);
  const [roleDescription, setRoleDescription] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rolesPerPage = 6;

  async function loadRoles() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/roles");
      setRoles(response.data.data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message || "Failed to load roles"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
  }, []);

  const filteredRoles = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return roles.filter((role) =>
      `${role.name || ""} ${role.id} ${role.description || ""}`
        .toLowerCase()
        .includes(search)
    );
  }, [roles, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRoles.length / rolesPerPage)
  );

  const visibleRoles = filteredRoles.slice(
    (currentPage - 1) * rolesPerPage,
    currentPage * rolesPerPage
  );

  const totalEmployees = roles.reduce(
    (total, role) => total + (Number(role.employeeCount) || 0),
    0
  );

  function closeModal() {
    setModal("");
    setRoleName("");
    setSelectedRole(null);
    setModalError("");
    setRoleDescription("");
    setPermissions([]);
    setSelectedPermissions([]);
    setRoleEmployees([]);
    setModalLoading(false);
  }

  async function createRole(event) {
    event.preventDefault();

    if (!roleName.trim()) {
      setModalError("Role name is required.");
      return;
    }

    try {
      setModalLoading(true);
      setModalError("");

      await api.post("/roles", {
        name: roleName.trim(),
        description: roleDescription.trim(),
      });

      closeModal();
      await loadRoles();
    } catch (error) {
      setModalError(
        error.response?.data?.message || "Failed to create role"
      );
      setModalLoading(false);
    }
  }

  async function openPermissions(role) {
    try {
      setModal("permissions");
      setSelectedRole(role);
      setModalLoading(true);
      setModalError("");
      setPermissions([]);
      setSelectedPermissions([]);

      const [roleResponse, permissionsResponse] = await Promise.all([
        api.get(`/roles/${role.id}`),
        api.get("/roles/permissions"),
      ]);

      setPermissions(permissionsResponse.data.data || []);
      setSelectedPermissions(
        (roleResponse.data.permissions || []).map(
          (permission) => permission.id
        )
      );
    } catch (error) {
      setModalError(
        error.response?.data?.message || "Failed to load permissions"
      );
    } finally {
      setModalLoading(false);
    }
  }

  async function openEmployees(role) {
    try {
      setModal("employees");
      setSelectedRole(role);
      setModalLoading(true);
      setModalError("");
      setRoleEmployees([]);

      const response = await api.get(
        `/roles/${role.id}/employees`
      );

      setRoleEmployees(response.data.data || []);
    } catch (error) {
      setModalError(
        error.response?.data?.message || "Failed to load employees"
      );
    } finally {
      setModalLoading(false);
    }
  }

  async function openDetails(role) {
    try {
      setModal("details");
      setSelectedRole(role);
      setModalLoading(true);
      setModalError("");
      setPermissions([]);

      const response = await api.get(`/roles/${role.id}`);
      setPermissions(response.data.permissions || []);
    } catch (error) {
      setModalError(
        error.response?.data?.message || "Failed to load role details"
      );
    } finally {
      setModalLoading(false);
    }
  }

  function togglePermission(permissionId) {
    setSelectedPermissions((previous) =>
      previous.includes(permissionId)
        ? previous.filter((id) => id !== permissionId)
        : [...previous, permissionId]
    );
  }

  async function savePermissions() {
    try {
      setModalLoading(true);
      setModalError("");

      await api.put(`/roles/${selectedRole.id}/permissions`, {
        permissionIds: selectedPermissions,
      });

      closeModal();
    } catch (error) {
      setModalError(
        error.response?.data?.message || "Failed to save permissions"
      );
      setModalLoading(false);
    }
  }

  function getInitials(name) {
    return (name || "R")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("");
  }

  if (loading) {
    return (
      <div className="page-content roles-page">
        <div className="roles-loading">
          <span className="roles-spinner" />
          <p>Loading your roles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content roles-page">
        <div className="roles-error">
          <span className="roles-error-icon">!</span>
          <h2>Unable to load roles</h2>
          <p>{error}</p>
          <button className="roles-primary-button" onClick={loadRoles}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content roles-page">
      <section className="roles-banner">
        <div className="roles-banner-content">
          <span className="roles-eyebrow">
            <span className="roles-eyebrow-dot" />
            ACCESS CONTROL
          </span>
          <h1>Define roles. Manage access.</h1>
          <p>
            Organize responsibilities across your workspace and control
            what each role can access.
          </p>
          <button
            className="roles-banner-button"
            onClick={() => {
              setModal("create");
              setModalError("");
            }}
          >
            <span>＋</span> Create a role
          </button>
        </div>

        <div className="roles-banner-visual" aria-hidden="true">
          <div className="roles-orbit orbit-one" />
          <div className="roles-orbit orbit-two" />
          <div className="roles-visual-card visual-card-main">
            <span className="visual-card-icon">♙</span>
            <div>
              <strong>Role management</strong>
              <small>Organized access</small>
            </div>
            <span className="visual-check">✓</span>
          </div>
          <div className="roles-visual-card visual-card-small">
            <span className="visual-small-icon">⌘</span>
            <div>
              <strong>Permissions</strong>
              <small>Controlled access</small>
            </div>
          </div>
          <div className="roles-visual-dot dot-one" />
          <div className="roles-visual-dot dot-two" />
        </div>
      </section>

      <section className="roles-stats">
        <div className="roles-stat-card">
          <div className="roles-stat-icon stat-blue">♙</div>
          <div>
            <span className="roles-stat-label">Total roles</span>
            <strong>{roles.length}</strong>
            <small>Roles in your organization</small>
          </div>
        </div>

        <div className="roles-stat-card">
          <div className="roles-stat-icon stat-purple">♧</div>
          <div>
            <span className="roles-stat-label">Assigned employees</span>
            <strong>{totalEmployees}</strong>
            <small>Across all listed roles</small>
          </div>
        </div>

        <div className="roles-stat-card">
          <div className="roles-stat-icon stat-green">⌕</div>
          <div>
            <span className="roles-stat-label">Search results</span>
            <strong>{filteredRoles.length}</strong>
            <small>Matching roles</small>
          </div>
        </div>
      </section>

      <section className="roles-list-section">
        <div className="roles-section-heading">
          <div>
            <h2>Organization roles</h2>
            <p>Review roles and manage their access settings.</p>
          </div>
          <span className="roles-count-pill">
            {roles.length} {roles.length === 1 ? "role" : "roles"}
          </span>
        </div>

        <div className="roles-toolbar">
          <div className="roles-search-wrap">
            <span className="roles-search-icon">⌕</span>
            <input
              type="search"
              className="role-search"
              placeholder="Search by role name, ID or description..."
              aria-label="Search roles"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
            />
            {searchTerm && (
              <button
                className="roles-clear-search"
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <span className="roles-results-label">
            Showing {filteredRoles.length}{" "}
            {filteredRoles.length === 1 ? "result" : "results"}
          </span>
        </div>

        {roles.length === 0 ? (
          <div className="roles-empty-state">
            <div className="roles-empty-icon">♙</div>
            <h3>No roles created yet</h3>
            <p>Create your first role to start organizing workspace access.</p>
            <button
              className="roles-primary-button"
              onClick={() => {
                setModal("create");
                setModalError("");
              }}
            >
              Create your first role
            </button>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="roles-empty-state">
            <div className="roles-empty-icon">⌕</div>
            <h3>No matching roles</h3>
            <p>Try another search term or clear your search.</p>
            <button
              className="roles-secondary-button"
              onClick={() => setSearchTerm("")}
            >
              Clear search
            </button>
          </div>
        ) : (
          <>
            <div className="roles-grid">
              {visibleRoles.map((role, index) => (
                <article className="role-card" key={role.id}>
                  <div className="role-card-top">
                    <div className={`role-avatar role-avatar-${index % 4}`}>
                      {getInitials(role.name)}
                    </div>
                    <span className="role-id">ID #{role.id}</span>
                  </div>

                  <div className="role-card-title">
                    <h3>{role.name}</h3>
                    <p>
                      {role.description || "No description available."}
                    </p>
                  </div>

                  <div className="role-card-members">
                    <div className="role-members-icon">♧</div>
                    <div>
                      <strong>{Number(role.employeeCount) || 0}</strong>
                      <span>
                        {(Number(role.employeeCount) || 0) === 1
                          ? "Employee assigned"
                          : "Employees assigned"}
                      </span>
                    </div>
                    <span className="role-card-arrow">›</span>
                  </div>

                  <div className="role-card-actions">
                    <button
                      className="role-action-button"
                      onClick={() => openDetails(role)}
                    >
                      View details
                    </button>
                    <button
                      className="role-action-button role-action-primary"
                      onClick={() => openPermissions(role)}
                    >
                      Permissions
                    </button>
                    <button
                      className="role-action-button role-action-wide"
                      onClick={() => openEmployees(role)}
                    >
                      View employees
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {filteredRoles.length > rolesPerPage && (
              <div className="roles-pagination">
                <span>
                  Showing{" "}
                  {(currentPage - 1) * rolesPerPage + 1}–
                  {Math.min(currentPage * rolesPerPage, filteredRoles.length)}{" "}
                  of {filteredRoles.length} roles
                </span>
                <div className="roles-pagination-controls">
                  <button
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>
                  <span>
                    Page <strong>{currentPage}</strong> of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {modal === "create" && (
        <div className="modal-overlay">
          <form className="role-modal" onSubmit={createRole}>
            <div className="role-modal-heading">
              <div className="role-modal-icon">＋</div>
              <div>
                <h2>Create a role</h2>
                <p>Add a new role to your organization.</p>
              </div>
              <button
                type="button"
                className="role-modal-close"
                onClick={closeModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <label htmlFor="role-name">Role name</label>
            <input
              id="role-name"
              type="text"
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              placeholder="e.g. Project Manager"
              required
              autoFocus
            />

            <label htmlFor="role-description">Role description</label>
            <textarea
              id="role-description"
              value={roleDescription}
              onChange={(event) => setRoleDescription(event.target.value)}
              placeholder="Describe the responsibilities of this role"
              rows={3}
            />

            {modalError && <p className="modal-error">{modalError}</p>}

            <div className="modal-actions">
              <button
                type="button"
                className="roles-secondary-button"
                onClick={closeModal}
                disabled={modalLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="roles-primary-button"
                disabled={modalLoading}
              >
                {modalLoading ? "Creating..." : "Create role"}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === "permissions" && (
        <div className="modal-overlay">
          <div className="role-modal role-modal-large">
            <div className="role-modal-heading">
              <div className="role-modal-icon">⌘</div>
              <div>
                <h2>{selectedRole?.name} permissions</h2>
                <p>Select the permissions assigned to this role.</p>
              </div>
              <button
                className="role-modal-close"
                onClick={closeModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {modalLoading ? (
              <div className="modal-loading">Loading permissions...</div>
            ) : (
              <>
                <div className="permission-summary">
                  <strong>{selectedPermissions.length}</strong>
                  <span>of {permissions.length} permissions selected</span>
                </div>
                <div className="permission-list">
                  {permissions.map((permission) => (
                    <label className="permission-item" key={permission.id}>
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        disabled={modalLoading}
                      />
                      <span>
                        <strong>{permission.name}</strong>
                        <small>
                          {permission.description || "No description provided."}
                        </small>
                      </span>
                    </label>
                  ))}
                  {permissions.length === 0 && (
                    <p className="modal-muted">No permissions available.</p>
                  )}
                </div>
              </>
            )}

            {modalError && <p className="modal-error">{modalError}</p>}

            <div className="modal-actions">
              <button
                className="roles-secondary-button"
                onClick={closeModal}
                disabled={modalLoading}
              >
                Cancel
              </button>
              <button
                className="roles-primary-button"
                onClick={savePermissions}
                disabled={modalLoading || permissions.length === 0}
              >
                {modalLoading ? "Saving..." : "Save permissions"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "employees" && (
        <div className="modal-overlay">
          <div className="role-modal role-modal-large">
            <div className="role-modal-heading">
              <div className="role-modal-icon">♧</div>
              <div>
                <h2>{selectedRole?.name} employees</h2>
                <p>Employees currently assigned to this role.</p>
              </div>
              <button
                className="role-modal-close"
                onClick={closeModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {modalLoading ? (
              <div className="modal-loading">Loading employees...</div>
            ) : roleEmployees.length === 0 ? (
              <p className="modal-muted">
                No employees are assigned to this role.
              </p>
            ) : (
              <div className="role-employee-list">
                {roleEmployees.map((employee) => (
                  <div className="role-employee-item" key={employee.id}>
                    <div className="role-employee-avatar">
                      {getInitials(employee.name)}
                    </div>
                    <div className="role-employee-info">
                      <strong>{employee.name}</strong>
                      <small>{employee.email}</small>
                    </div>
                    <span
                      className={`employee-status ${employee.status || ""}`}
                    >
                      {employee.status || "Unknown"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {modalError && <p className="modal-error">{modalError}</p>}

            <div className="modal-actions">
              <button
                className="roles-secondary-button"
                onClick={closeModal}
                disabled={modalLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "details" && (
        <div className="modal-overlay">
          <div className="role-modal role-modal-large">
            <div className="role-modal-heading">
              <div className="role-modal-icon">♙</div>
              <div>
                <h2>Role details</h2>
                <p>Overview of this role and its assigned access.</p>
              </div>
              <button
                className="role-modal-close"
                onClick={closeModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {selectedRole && (
              <div className="role-details-content">
                <div className="detail-row">
                  <span>Role name</span>
                  <strong>{selectedRole.name}</strong>
                </div>
                <div className="detail-row">
                  <span>Role ID</span>
                  <strong>#{selectedRole.id}</strong>
                </div>
                <div className="detail-row">
                  <span>Employees assigned</span>
                  <strong>
                    {Number(selectedRole.employeeCount) || 0}
                  </strong>
                </div>
                <div className="detail-description">
                  <strong>Description</strong>
                  <p>
                    {selectedRole.description ||
                      "No description available."}
                  </p>
                </div>
                <div className="detail-permissions">
                  <div className="detail-permissions-heading">
                    <strong>Assigned permissions</strong>
                    {!modalLoading && (
                      <span>{permissions.length} assigned</span>
                    )}
                  </div>
                  {modalLoading ? (
                    <p className="modal-muted">Loading permissions...</p>
                  ) : permissions.length === 0 ? (
                    <p className="modal-muted">No permissions assigned.</p>
                  ) : (
                    <ul>
                      {permissions.map((permission) => (
                        <li key={permission.id}>
                          <span>✓</span>
                          {permission.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {modalError && <p className="modal-error">{modalError}</p>}

            <div className="modal-actions">
              <button
                className="roles-secondary-button"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Roles;
