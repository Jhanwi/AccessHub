import { useEffect, useState } from "react";

import api from "../api";

function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  async function loadRoles() {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/roles");

      setRoles(response.data.data);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to load roles"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
  }, []);

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          Loading roles...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="error-state">
          <p>{error}</p>

          <button onClick={loadRoles}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">

      <div className="page-header">

        <div>
          <h1>Roles</h1>

          <p>
            Manage roles and permissions.
          </p>
        </div>

        <button className="primary-button">
          Create Role
        </button>

      </div>


      <div className="roles-grid">

        {roles.map((role) => (
          <div
            className="role-card"
            key={role.id}
          >

            <div className="role-card-header">
              <h2>{role.name}</h2>

              <span>
                {role.employeeCount} employees
              </span>
            </div>

            <p>
              Permissions assigned to this
              role can be managed from the
              role details.
            </p>

            <button className="secondary-button">
              View Permissions
            </button>

          </div>
        ))}

      </div>

    </div>
  );
}

export default Roles;