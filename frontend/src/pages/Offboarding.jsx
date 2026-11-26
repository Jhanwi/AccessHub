
import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./Offboarding.css";

function Offboarding() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadEmployees = async () => {
    try {
      setError("");
      const response = await api.get("/employees");
      setEmployees(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const activeCount = employees.filter(
    (employee) => employee.status === "active"
  ).length;

  const inactiveCount = employees.filter(
    (employee) => employee.status !== "active"
  ).length;

  const filteredEmployees = useMemo(() => {
    const query = search.toLowerCase().trim();

    return employees.filter((employee) => {
      const name = employee.name || "";
      const email = employee.email || "";

      return (
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query)
      );
    });
  }, [employees, search]);

  const handleOffboarding = async () => {
    if (!selectedEmployee) return;

    const employee = selectedEmployee;

    try {
      setProcessingId(employee.id);
      setError("");
      setMessage("");

      const response = await api.patch(`/offboarding/${employee.id}`);

      setMessage(
        `${response.data.message}. ${response.data.revokedAccessCount ?? 0} application access grant(s) revoked.`
      );

      setSelectedEmployee(null);
      await loadEmployees();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to offboard employee"
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="offboarding-page">
      <div className="offboarding-header">
        <div>
          <h1>Employee Offboarding</h1>
          <p>
            Manage employee exits and automatically revoke application access.
          </p>
        </div>

        <div className="offboarding-header-icon">↗</div>
      </div>

      {message && (
        <div className="offboarding-alert success">{message}</div>
      )}

      {error && (
        <div className="offboarding-alert error">{error}</div>
      )}

      <div className="offboarding-stats">
        <div className="offboarding-stat">
          <div className="offboarding-stat-label">Total Employees</div>
          <div className="offboarding-stat-value">{employees.length}</div>
        </div>

        <div className="offboarding-stat">
          <div className="offboarding-stat-label">Active Employees</div>
          <div className="offboarding-stat-value">{activeCount}</div>
        </div>

        <div className="offboarding-stat">
          <div className="offboarding-stat-label">Offboarded Employees</div>
          <div className="offboarding-stat-value">{inactiveCount}</div>
        </div>
      </div>

      {selectedEmployee && (
        <div className="offboarding-confirm">
          <strong>Confirm employee offboarding</strong>
          <p>
            Are you sure you want to offboard {selectedEmployee.name}?
            This will deactivate the employee account and revoke all active
            application access. This action cannot be undone from this page.
          </p>

          <div className="offboarding-confirm-actions">
            <button
              className="offboarding-confirm-yes"
              onClick={handleOffboarding}
              disabled={processingId === selectedEmployee.id}
            >
              {processingId === selectedEmployee.id
                ? "Processing..."
                : "Confirm Offboarding"}
            </button>

            <button
              className="offboarding-confirm-no"
              onClick={() => setSelectedEmployee(null)}
              disabled={processingId !== null}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="offboarding-card">
        <div className="offboarding-card-heading">
          <div>
            <h2>Employee Directory</h2>
            <p>Review employee status and manage offboarding.</p>
          </div>

          <input
            className="offboarding-search"
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <div className="offboarding-empty">Loading employees...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="offboarding-empty">
            No employees found.
          </div>
        ) : (
          <div className="offboarding-table-wrap">
            <table className="offboarding-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <div className="offboarding-employee">
                        <div className="offboarding-avatar">
                          {(employee.name || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="offboarding-employee-name">
                          {employee.name}
                        </div>
                      </div>
                    </td>

                    <td>{employee.email}</td>

                    <td>
                      <span
                        className={`offboarding-status ${
                          employee.status !== "active" ? "inactive" : ""
                        }`}
                      >
                        {employee.status || "Unknown"}
                      </span>
                    </td>

                    <td>
                      {employee.status === "active" ? (
                        <button
                          className="offboarding-button"
                          disabled={processingId !== null}
                          onClick={() => {
                            setMessage("");
                            setError("");
                            setSelectedEmployee(employee);
                          }}
                        >
                          Offboard
                        </button>
                      ) : (
                        <span className="offboarding-disabled-label">
                          Already inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Offboarding;
