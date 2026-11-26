
import { useEffect, useState } from "react";
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

  async function loadRoles() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/roles");
      setRoles(response.data.data);
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

  const filteredRoles = roles.filter((role) =>
    `${role.name} ${role.id}`
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
  );

  function closeModal() {
    setModal("");
    setRoleName("");
    setSelectedRole(null);
    setModalError("");
    setRoleDescription("");
  }

  async function createRole(event) {
    event.preventDefault();

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
    } finally {
      setModalLoading(false);
    }
  }

  async function openPermissions(role) {
    try {
      setModal("permissions");
      setSelectedRole(role);
      setModalLoading(true);
      setModalError("");

      const [roleResponse, permissionsResponse] = await Promise.all([
        api.get(`/roles/${role.id}`),
        api.get("/roles/permissions"),
      ]);

      setPermissions(permissionsResponse.data.data || []);
      setSelectedPermissions(
        roleResponse.data.permissions.map((permission) => permission.id)
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
       error.response?.data?.message ||
        "Failed to load employees"
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
    } finally {
      setModalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-content roles-page">
        <div className="loading-state">Loading roles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content roles-page">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadRoles}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content roles-page">
      <div className="page-header">
        <div>
          <h1>Roles</h1>
          <p>Manage roles and permissions.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setModal("create");
            setModalError("");
          }}
        >
          Create Role
        </button>
      </div>

      <div className="roles-toolbar">
        <input
         type="text"
         className="role-search"
         placeholder="Search by role name or ID..."
         value={searchTerm}
         onChange={(event) => setSearchTerm(event.target.value)}
       />

       <span className="role-total">
         {filteredRoles.length} roles found
       </span>
      </div>

      <div className="roles-grid">
        {filteredRoles.map((role) => (
          <div className="role-card" key={role.id}>
            <div className="role-card-header">
             <h2>{role.name}</h2>
             <span className="role-id">ID: #{role.id}</span>
            </div>

           <p className="role-description">
             {role.description || "No description available."}
           </p>

           <div className="role-employee-count">
             <span>👥</span>
             <strong>{role.employeeCount}</strong>
             <span>Employees assigned</span>
           </div>
           
            <div className="role-actions">
             <button
                 className="secondary-button"
                 onClick={() => openDetails(role)}
                >
               View Details
              </button>

              <button
                  className="secondary-button"
                  onClick={() => openPermissions(role)}
                >
               View Permissions
              </button>

             <button
                 className="secondary-button"
                 onClick={() => openEmployees(role)}
                >
               View Employees
              </button>
            </div>

          </div>
        ))}
      </div>

      {modal === "create" && (
        <div className="modal-overlay">
          <form className="role-modal" onSubmit={createRole}>
            <h2>Create Role</h2>

            <label htmlFor="role-name">Role Name</label>
            <input
              id="role-name"
              type="text"
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              placeholder="Enter role name"
              required
              autoFocus
            />

            <label htmlFor="role-description">
              Role Description
            </label>

            <textarea
             id="role-description"
             value={roleDescription}
             onChange={(event) => setRoleDescription(event.target.value)}
             placeholder="Describe the responsibilities of this role"
             rows={3}
           />

            {modalError && (
              <p className="modal-error">{modalError}</p>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={modalLoading}
              >
                {modalLoading ? "Creating..." : "Create Role"}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === "permissions" && (
        <div className="modal-overlay">
          <div className="role-modal">
            <h2>
              {selectedRole?.name} Permissions
            </h2>

            {modalLoading && permissions.length === 0 ? (
              <p>Loading permissions...</p>
            ) : (
              <div className="permission-list">
                {permissions.map((permission) => (
                  <label
                    className="permission-item"
                    key={permission.id}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => togglePermission(permission.id)}
                      disabled={modalLoading}
                    />

                    <span>
                      <strong>{permission.name}</strong>
                      <small>{permission.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {modalError && (
              <p className="modal-error">{modalError}</p>
            )}

            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={closeModal}
                disabled={modalLoading}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={savePermissions}
                disabled={modalLoading || permissions.length === 0}
              >
                {modalLoading ? "Saving..." : "Save Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}
      {modal === "employees" && (
        <div className="modal-overlay">
          <div className="role-modal">
            <h2>{selectedRole?.name} Employees</h2>

            {modalLoading ? (
              <p>Loading employees...</p>
            ) : modalError ? null : roleEmployees.length === 0 ? (
              <p>No employees are assigned to this role.</p>
            ) : (
              <div className="role-employee-list">
                {roleEmployees.map((employee) => (
                  <div
                    className="role-employee-item"
                    key={employee.id}
                  >
                    <div className="role-employee-info">
                      <strong>{employee.name}</strong>
                      <small>{employee.email}</small>
                    </div>

                    <span className={`employee-status ${employee.status}`}>
                      {employee.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {modalError && (
              <p className="modal-error">{modalError}</p>
            )}

            <div className="modal-actions">
              <button
                className="cancel-button"
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
          <div className="role-modal">
            <h2>Role Details</h2>

            {selectedRole && (
              <div className="role-details-content">
                <div className="detail-row">
                  <span>Role Name</span>
                  <strong>{selectedRole.name}</strong>
                </div>

                <div className="detail-row">
                  <span>Role ID</span>
                  <strong>#{selectedRole.id}</strong>
                </div>

                <div className="detail-row">
                  <span>Employees</span>
                  <strong>{selectedRole.employeeCount}</strong>
                </div>

                <div className="detail-description">
                  <strong>Description</strong>
                  <p>
                    {selectedRole.description ||
                      "No description available."}
                  </p>
                </div>

                <div className="detail-permissions">
                  <strong>Assigned Permissions</strong>

                  {modalLoading ? (
                    <p>Loading permissions...</p>
                  ) : permissions.length === 0 ? (
                    <p>No permissions assigned.</p>
                  ) : (
                    <ul>
                      {permissions.map((permission) => (
                        <li key={permission.id}>
                          {permission.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {modalError && (
              <p className="modal-error">{modalError}</p>
            )}

            <div className="modal-actions">
              <button
                className="cancel-button"
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
