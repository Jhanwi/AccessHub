
import { useEffect, useState } from "react";
import api from "../api";
import "./Employees.css";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

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

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, roleFilter, pageSize]);

  async function loadEmployees() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/employees");
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error(error);
      setError("Unable to load employees. Please try again.");
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

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setFormError("Name, email and password are required.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/employees", {
        name: form.name.trim(),
        email: form.email.trim(),
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
        error.response?.data?.message || "Failed to create employee."
      );
    } finally {
      setSaving(false);
    }
  }

  async function disableEmployee(employeeId) {
    const confirmed = window.confirm(
      "Are you sure you want to disable this employee?"
    );

    if (!confirmed) return;

    try {
      await api.patch(`/employees/${employeeId}/disable`);
      await loadEmployees();
    } catch (error) {
      alert(
        error.response?.data?.message || "Failed to disable employee."
      );
    }
  }

  async function changeRole(employeeId) {
    const roleId = window.prompt("Enter the role ID to assign:");

    if (!roleId) return;

    if (!/^\d+$/.test(roleId)) {
      alert("Please enter a valid numeric role ID.");
      return;
    }

    try {
      await api.patch(`/employees/${employeeId}/role`, {
        roleId: Number(roleId),
      });

      await loadEmployees();
    } catch (error) {
      alert(
        error.response?.data?.message || "Failed to assign role."
      );
    }
  }

  const filteredEmployees = employees.filter((employee) => {
    const searchText = search.trim().toLowerCase();
    const name = (employee.name || "").toLowerCase();
    const email = (employee.email || "").toLowerCase();
    const status = (employee.status || "").toLowerCase();
    const roleName = (employee.role?.name || "").toLowerCase();

    const matchesSearch =
      name.includes(searchText) || email.includes(searchText);

    const matchesStatus =
      statusFilter === "all" || status === statusFilter;

    const matchesRole =
      roleFilter === "all" || roleName === roleFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesRole;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + pageSize
  );

  const activeCount = employees.filter(
    (employee) => employee.status?.toLowerCase() === "active"
  ).length;

  const inactiveCount = employees.filter(
    (employee) => employee.status?.toLowerCase() === "inactive"
  ).length;

  const startRecord = filteredEmployees.length ? startIndex + 1 : 0;
  const endRecord = Math.min(
    startIndex + pageSize,
    filteredEmployees.length
  );

  function openCreateModal() {
    setFormError("");
    setForm({
      name: "",
      email: "",
      password: "",
      roleId: "",
    });
    setShowModal(true);
  }

  function getInitials(name) {
    return (name || "U")
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    <div className="page-container employees-page">

      <div className="employees-banner">
       <div className="employees-banner-content">
         <span className="employees-banner-tag">TEAM DIRECTORY</span>
         <h1>Employee Management</h1>
         <p>
           Manage your team, organize employee roles and control account status
           from one place.
          </p>
        </div>

       <div className="employees-banner-icon">👥</div>
       <button className="employee-add-button" onClick={openCreateModal}>
          <span>＋</span> Add Employee
        </button>
      </div>

      <section className="employee-stats">
        <div className="employee-stat-card">
          <div className="employee-stat-icon total-icon">♙</div>
          <div>
            <span>Total Employees</span>
            <strong>{employees.length}</strong>
            <small>Registered team members</small>
          </div>
        </div>

        <div className="employee-stat-card">
          <div className="employee-stat-icon active-icon">✓</div>
          <div>
            <span>Active Employees</span>
            <strong>{activeCount}</strong>
            <small>Currently active accounts</small>
          </div>
        </div>

        <div className="employee-stat-card">
          <div className="employee-stat-icon inactive-icon">−</div>
          <div>
            <span>Inactive Employees</span>
            <strong>{inactiveCount}</strong>
            <small>Disabled accounts</small>
          </div>
        </div>

        <div className="employee-stat-card">
          <div className="employee-stat-icon roles-icon">◇</div>
          <div>
            <span>Available Roles</span>
            <strong>{roles.length}</strong>
            <small>Organization role types</small>
          </div>
        </div>
      </section>

      <section className="employee-directory-card">
        <div className="employee-directory-card-header">
          <div>
            <h2>All Employees</h2>
            <p>Search and manage your organization's employee records.</p>
          </div>

          <span className="employee-count-label">
            {filteredEmployees.length} employee
            {filteredEmployees.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="employee-filters">
          <div className="employee-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>

          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.name.toLowerCase()}>
                {role.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            className="employee-reset-button"
            onClick={() => {
              setSearch("");
              setRoleFilter("all");
              setStatusFilter("all");
            }}
          >
            Reset
          </button>
        </div>

        {loading && (
          <div className="employee-message">
            <div className="employee-loader" />
            Loading employees...
          </div>
        )}

        {error && !loading && (
          <div className="employee-message employee-error">
            {error}
            <button onClick={loadEmployees}>Retry</button>
          </div>
        )}

        {!loading && !error && filteredEmployees.length === 0 && (
          <div className="employee-empty-state">
            <div className="employee-empty-icon">♙</div>
            <h3>No employees found</h3>
            <p>
              {employees.length === 0
                ? "Add your first employee to get started."
                : "Try changing your search or filter settings."}
            </p>
            {employees.length === 0 && (
              <button className="employee-add-button" onClick={openCreateModal}>
                ＋ Add Employee
              </button>
            )}
          </div>
        )}

        {!loading && !error && filteredEmployees.length > 0 && (
          <>
            <div className="employee-table-wrap">
              <table className="employee-directory-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Email Address</th>
                    <th>Assigned Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <div className="employee-person">
                          <div className="employee-avatar">
                            {getInitials(employee.name)}
                          </div>
                          <div>
                            <strong>{employee.name}</strong>
                            <small>Employee ID: {employee.id}</small>
                          </div>
                        </div>
                      </td>

                      <td className="employee-email">{employee.email}</td>

                      <td>
                        <span className="employee-role-label">
                          {employee.role?.name || "No role"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`employee-status ${
                            employee.status?.toLowerCase() === "active"
                              ? "is-active"
                              : "is-inactive"
                          }`}
                        >
                          <span />
                          {employee.status || "Unknown"}
                        </span>
                      </td>

                      <td>
                        <div className="employee-row-actions">
                          <button
                            className="employee-change-role"
                            onClick={() => changeRole(employee.id)}
                          >
                            Change Role
                          </button>

                          {employee.status?.toLowerCase() === "active" && (
                            <button
                              className="employee-disable"
                              onClick={() => disableEmployee(employee.id)}
                            >
                              Disable
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="employee-pagination">
              <div className="employee-pagination-info">
                Showing <strong>{startRecord}–{endRecord}</strong> of{" "}
                <strong>{filteredEmployees.length}</strong> employees
              </div>

              <div className="employee-pagination-controls">
                <label>
                  Rows:
                  <select
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </label>

                <button
                  className="employee-page-arrow"
                  disabled={currentPage === 1}
                  onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                >
                  ‹ Previous
                </button>

                <div className="employee-page-numbers">
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter(
                      (number) =>
                        number === 1 ||
                        number === totalPages ||
                        Math.abs(number - currentPage) <= 1
                    )
                    .map((number, index, visiblePages) => (
                      <span key={number} className="employee-page-number-wrap">
                        {index > 0 && number - visiblePages[index - 1] > 1 && (
                          <span className="employee-page-dots">…</span>
                        )}
                        <button
                          className={
                            currentPage === number
                              ? "employee-page-number current"
                              : "employee-page-number"
                          }
                          onClick={() => setPage(number)}
                        >
                          {number}
                        </button>
                      </span>
                    ))}
                </div>

                <button
                  className="employee-page-arrow"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setPage((previous) => Math.min(totalPages, previous + 1))
                  }
                >
                  Next ›
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {showModal && (
        <div
          className="employee-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowModal(false);
            }
          }}
        >
          <div className="employee-modal">
            <div className="employee-modal-header">
              <div>
                <span>TEAM MANAGEMENT</span>
                <h2>Add New Employee</h2>
                <p>Create an account and assign an organization role.</p>
              </div>

              <button
                type="button"
                className="employee-modal-close"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateEmployee}>
              <label htmlFor="employee-name">Full Name</label>
              <input
                id="employee-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter employee name"
                required
              />

              <label htmlFor="employee-email">Email Address</label>
              <input
                id="employee-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="employee@example.com"
                required
              />

              <label htmlFor="employee-password">Temporary Password</label>
              <input
                id="employee-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter temporary password"
                required
              />

              <label htmlFor="employee-role">Organization Role</label>
              <select
                id="employee-role"
                name="roleId"
                value={form.roleId}
                onChange={handleChange}
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>

              {formError && (
                <div className="employee-form-error">{formError}</div>
              )}

              <div className="employee-modal-actions">
                <button
                  type="button"
                  className="employee-cancel-button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="employee-submit-button"
                  disabled={saving}
                >
                  {saving ? "Creating..." : "Create Employee"}
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
