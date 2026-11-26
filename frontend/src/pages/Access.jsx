import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./Access.css";

function Access() {
  const [access, setAccess] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [applications, setApplications] = useState([]);

  const [employeeId, setEmployeeId] = useState("");
  const [applicationId, setApplicationId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        accessResponse,
        employeeResponse,
        applicationResponse,
      ] = await Promise.all([
        api.get("/access"),
        api.get("/employees"),
        api.get("/applications"),
      ]);

      setAccess(accessResponse.data.data || []);
      setEmployees(employeeResponse.data.data || []);
      setApplications(applicationResponse.data.data || []);
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message ||
          "Failed to load access data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function grantAccess() {
    if (!employeeId || !applicationId) {
      setError("Please select an employee and application.");
      return;
    }

    try {
      setGranting(true);
      setError("");
      setSuccess("");

      await api.post("/access/grant", {
        userId: Number(employeeId),
        applicationId: Number(applicationId),
      });

      setEmployeeId("");
      setApplicationId("");
      setSuccess("Application access granted successfully.");

      await loadData();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to grant access."
      );
    } finally {
      setGranting(false);
    }
  }

  async function revokeAccess(accessId) {
    const confirmed = window.confirm(
      "Are you sure you want to revoke this application access?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.patch(`/access/${accessId}/revoke`);

      setSuccess("Application access revoked successfully.");
      await loadData();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to revoke access."
      );
    }
  }

  const filteredAccess = useMemo(() => {
    return access.filter((item) => {
      const employeeName = item.employee?.name || "";
      const applicationName = item.application?.name || "";

      const matchesSearch =
        `${employeeName} ${applicationName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [access, searchTerm, statusFilter]);

  const activeCount = access.filter(
    (item) => item.status === "active"
  ).length;

  const revokedCount = access.filter(
    (item) => item.status === "revoked"
  ).length;

  return (
    <div className="page-container access-page">

      {/* Page banner */}
      <section className="access-hero">
        <div className="access-hero-icon">🔐</div>

        <div className="access-hero-text">
          <h1>Access Management</h1>
          <p>
            Grant and revoke application access for employees.
          </p>
        </div>

        <div className="access-hero-decoration">
          🛡️
        </div>
      </section>

      {/* Grant access form */}
      <section className="grant-access-card">
        <div className="access-section-heading">
          <span className="heading-icon">+</span>
          <h2>Grant Application Access</h2>
        </div>

        <p className="access-section-subtitle">
          Select an employee and application to grant access.
        </p>

        <div className="grant-access-form">
          <select
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            disabled={loading || granting}
          >
            <option value="">Select employee</option>

            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>

          <select
            value={applicationId}
            onChange={(event) =>
              setApplicationId(event.target.value)
            }
            disabled={loading || granting}
          >
            <option value="">Select application</option>

            {applications.map((application) => (
              <option
                key={application.id}
                value={application.id}
              >
                {application.name}
              </option>
            ))}
          </select>

          <button
            className="grant-access-button"
            onClick={grantAccess}
            disabled={loading || granting}
          >
            {granting ? "Granting..." : "🔒 Grant Access"}
          </button>
        </div>
      </section>

      {/* Feedback messages */}
      {error && (
        <div className="access-alert access-alert-error">
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {success && (
        <div className="access-alert access-alert-success">
          {success}
          <button onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      {/* Summary */}
      <section className="access-summary">
        <div className="access-summary-card">
          <span className="summary-label">Total Records</span>
          <strong>{access.length}</strong>
          <span className="summary-icon">📋</span>
        </div>

        <div className="access-summary-card">
          <span className="summary-label">Active Access</span>
          <strong className="summary-active">{activeCount}</strong>
          <span className="summary-icon">🟢</span>
        </div>

        <div className="access-summary-card">
          <span className="summary-label">Revoked Access</span>
          <strong className="summary-revoked">{revokedCount}</strong>
          <span className="summary-icon">🔴</span>
        </div>
      </section>

      {/* Search and filter */}
      <section className="access-toolbar">
        <div className="access-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Search by employee or application..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <select
          className="access-status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
        </select>

        <button
          className="access-refresh-button"
          onClick={loadData}
          disabled={loading}
        >
          ↻ {loading ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {/* Access records */}
      <section className="access-table-card">
        {loading ? (
          <div className="access-loading">
            Loading access records...
          </div>
        ) : error && access.length === 0 ? (
          <div className="access-empty">
            Unable to load access records.
          </div>
        ) : filteredAccess.length === 0 ? (
          <div className="access-empty">
            <span>📂</span>
            <h3>No access records found</h3>
            <p>Try changing your search or status filter.</p>
          </div>
        ) : (
          <>
            <div className="access-table-wrapper">
              <table className="access-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Application</th>
                    <th>Status</th>
                    <th>Granted By</th>
                    <th>Granted At</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAccess.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="access-employee-cell">
                          <span className="employee-avatar">
                            {(item.employee?.name || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </span>

                          <span>
                            {item.employee?.name || "Unknown"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="application-name">
                          {item.application?.name || "Unknown"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`access-status-badge ${
                            item.status === "active"
                              ? "status-active"
                              : "status-revoked"
                          }`}
                        >
                          <span className="status-dot"></span>
                          {item.status === "active"
                            ? "Active"
                            : "Revoked"}
                        </span>
                      </td>

                      <td>{item.grantedBy || "Unknown"}</td>

                      <td>
                        {item.grantedAt
                          ? new Date(item.grantedAt).toLocaleString()
                          : "—"}
                      </td>

                      <td>
                        {item.status === "active" ? (
                          <button
                            className="revoke-access-button"
                            onClick={() => revokeAccess(item.id)}
                          >
                            ⊘ Revoke
                          </button>
                        ) : (
                          <span className="access-no-action">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="access-table-footer">
              <span>
                Showing {filteredAccess.length} of {access.length} records
              </span>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default Access;