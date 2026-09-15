import { useEffect, useState } from "react";
import api from "../api";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
  });

  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEmployees();
    loadRoles();
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);

      const response = await api.get("/employees");

      setEmployees(response.data.data || []);
      setError("");
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to load employees"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadRoles() {
    try {
      const response = await api.get("/roles");

      setRoles(response.data.data || []);
    } catch (error) {
      console.error("Failed to load roles:", error);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleCreateEmployee(event) {
    event.preventDefault();

    setFormError("");

    if (
      !form.name ||
      !form.email ||
      !form.password
    ) {
      setFormError(
        "Name, email and password are required"
      );

      return;
    }

    try {
      setSaving(true);

      await api.post("/employees", {
        name: form.name,
        email: form.email,
        password: form.password,
        roleId: form.roleId || null,
      });

      setForm({
        name: "",
        email: "",
        password: "",
        roleId: "",
      });

      setShowModal(false);

      await loadEmployees();
    } catch (error) {
      console.error(error);

      setFormError(
        error.response?.data?.message ||
          "Failed to create employee"
      );
    } finally {
      setSaving(false);
    }
  }

  async function disableEmployee(employeeId) {
    const confirmed = window.confirm(
      "Are you sure you want to disable this employee?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.patch(
        `/employees/${employeeId}/disable`
      );

      await loadEmployees();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to disable employee"
      );
    }
  }

  async function changeRole(employeeId) {
    const roleId = window.prompt(
      "Enter the role ID to assign:"
    );

    if (!roleId) {
      return;
    }

    try {
      await api.patch(
        `/employees/${employeeId}/role`,
        {
          roleId: Number(roleId),
        }
      );

      await loadEmployees();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to assign role"
      );
    }
  }

  const filteredEmployees = employees.filter(
    (employee) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        employee.name
          .toLowerCase()
          .includes(searchText) ||
        employee.email
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        employee.status === statusFilter;

      return matchesSearch && matchesStatus;
    }
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p>
            Manage employees and their access roles.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setFormError("");
            setShowModal(true);
          }}
        >
          + Add Employee
        </button>
      </div>

      <div className="employee-toolbar">
        <input
          type="text"
          placeholder="Search employees..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading && <p>Loading employees...</p>}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        filteredEmployees.length === 0 && (
          <div className="empty-state">
            No employees found.
          </div>
        )}

      {!loading &&
        !error &&
        filteredEmployees.length > 0 && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map(
                  (employee) => (
                    <tr key={employee.id}>
                      <td>{employee.name}</td>

                      <td>{employee.email}</td>

                      <td>
                        {employee.role || "No role"}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${employee.status}`}
                        >
                          {employee.status}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            onClick={() =>
                              changeRole(employee.id)
                            }
                          >
                            Change Role
                          </button>

                          {employee.status ===
                            "active" && (
                            <button
                              onClick={() =>
                                disableEmployee(
                                  employee.id
                                )
                              }
                            >
                              Disable
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add Employee</h2>

              <button
                className="modal-close"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateEmployee}>
              <label>Name</label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Employee name"
              />

              <label>Email</label>

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="employee@example.com"
              />

              <label>Password</label>

              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Temporary password"
              />

              <label>Role</label>

              <select
                name="roleId"
                value={form.roleId}
                onChange={handleChange}
              >
                <option value="">
                  Select role
                </option>

                {roles.map((role) => (
                  <option
                    key={role.id}
                    value={role.id}
                  >
                    {role.name}
                  </option>
                ))}
              </select>

              {formError && (
                <div className="error-message">
                  {formError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Creating..."
                    : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;