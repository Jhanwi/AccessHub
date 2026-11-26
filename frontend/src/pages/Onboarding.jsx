
import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./Onboarding.css";

function Onboarding() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [applicationIds, setApplicationIds] = useState([]);

  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [applications, setApplications] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [employeesResponse, rolesResponse, applicationsResponse] =
        await Promise.all([
          api.get("/employees"),
          api.get("/roles"),
          api.get("/applications"),
        ]);

      const employeesData = Array.isArray(employeesResponse.data)
        ? employeesResponse.data
        : employeesResponse.data.data || [];

      const rolesData = Array.isArray(rolesResponse.data)
        ? rolesResponse.data
        : rolesResponse.data.data || [];

      const applicationsData = Array.isArray(applicationsResponse.data)
        ? applicationsResponse.data
        : applicationsResponse.data.data || [];

      setEmployees(employeesData);
      setRoles(rolesData);
      setApplications(applicationsData);
    } catch (err) {
      console.error("Failed to load onboarding data:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load onboarding data."
      );
      setEmployees([]);
      setRoles([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  function handleApplicationChange(applicationId) {
    setApplicationIds((currentIds) =>
      currentIds.includes(applicationId)
        ? currentIds.filter((id) => id !== applicationId)
        : [...currentIds, applicationId]
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !password || !roleId) {
      setError("Name, email, password and role are required.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post("/onboarding", {
        name: name.trim(),
        email: email.trim(),
        password,
        roleId: Number(roleId),
        applicationIds,
      });

      setSuccess(
        response.data.message || "Employee onboarded successfully."
      );

      setName("");
      setEmail("");
      setPassword("");
      setRoleId("");
      setApplicationIds([]);

      await loadData();
    } catch (err) {
      console.error("Onboarding error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to onboard employee."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const activeEmployees = employees.filter(
    (employee) => employee.status === "active"
  ).length;

  const inactiveEmployees = employees.length - activeEmployees;

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return employees;

    return employees.filter(
      (employee) =>
        employee.name?.toLowerCase().includes(query) ||
        employee.email?.toLowerCase().includes(query) ||
        String(employee.id).includes(query)
    );
  }, [employees, search]);

  if (loading) {
    return (
      <div className="onboarding-page">
        <div className="onboarding-card">
          <p>Loading onboarding data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-header">
        <div>
          <h1>Employee Onboarding</h1>
          <p>
            Add team members, assign roles and manage application access.
          </p>
        </div>

        <div className="onboarding-header-icon">👥</div>
      </div>

      {error && (
        <div className="onboarding-alert error">{error}</div>
      )}

      {success && (
        <div className="onboarding-alert success">{success}</div>
      )}

      <div className="onboarding-stats">
        <div className="onboarding-stat">
          <div className="onboarding-stat-label">Total Employees</div>
          <div className="onboarding-stat-value">{employees.length}</div>
        </div>

        <div className="onboarding-stat">
          <div className="onboarding-stat-label">Active Employees</div>
          <div className="onboarding-stat-value">{activeEmployees}</div>
        </div>

        <div className="onboarding-stat">
          <div className="onboarding-stat-label">Inactive Employees</div>
          <div className="onboarding-stat-value">{inactiveEmployees}</div>
        </div>
      </div>

      <div className="onboarding-content">
        <section className="onboarding-card">
          <div className="onboarding-card-heading">
            <h2>Create Employee</h2>
            <p>Enter employee details and configure their access.</p>
          </div>

          <form className="onboarding-form" onSubmit={handleSubmit}>
            <div className="onboarding-field">
              <label htmlFor="employee-name">Full Name</label>
              <input
                id="employee-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter employee name"
                required
              />
            </div>

            <div className="onboarding-field">
              <label htmlFor="employee-email">Email Address</label>
              <input
                id="employee-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="employee@company.com"
                required
              />
            </div>

            <div className="onboarding-field">
              <label htmlFor="employee-password">Temporary Password</label>
              <input
                id="employee-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter temporary password"
                required
              />
            </div>

            <div className="onboarding-field">
              <label htmlFor="employee-role">Assign Role</label>
              <select
                id="employee-role"
                value={roleId}
                onChange={(event) => setRoleId(event.target.value)}
                required
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="onboarding-field">
              <label>Application Access</label>

              {applications.length === 0 ? (
                <p className="onboarding-empty">
                  No applications available.
                </p>
              ) : (
                <div className="onboarding-application-list">
                  {applications.map((application) => {
                    const selected = applicationIds.includes(application.id);

                    return (
                      <label
                        key={application.id}
                        className={`onboarding-application-item ${
                          selected ? "selected" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            handleApplicationChange(application.id)
                          }
                        />
                        <span>{application.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              <p className="onboarding-selection-count">
                {applicationIds.length} application(s) selected
              </p>
            </div>

            <button
              type="submit"
              className="onboarding-submit"
              disabled={submitting}
            >
              {submitting ? "Creating Employee..." : "+ Onboard Employee"}
            </button>
          </form>
        </section>

        <section className="onboarding-card">
          <div className="onboarding-card-heading">
            <h2>Current Employees</h2>
            <p>View and search employees in your organization.</p>
          </div>

          <div className="onboarding-employee-toolbar">
            <input
              className="onboarding-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or ID..."
            />
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="onboarding-empty">
              {employees.length === 0
                ? "No employees found."
                : "No employees match your search."}
            </div>
          ) : (
            <div className="onboarding-employee-list">
              {filteredEmployees.map((employee) => (
                <div className="onboarding-employee" key={employee.id}>
                  <div className="onboarding-employee-info">
                    <div className="onboarding-avatar">
                      {employee.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div className="onboarding-employee-name">
                        {employee.name}
                      </div>
                      <div className="onboarding-employee-email">
                        {employee.email}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`onboarding-status ${
                      employee.status === "active" ? "" : "inactive"
                    }`}
                  >
                    {employee.status || "Unknown"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Onboarding;
