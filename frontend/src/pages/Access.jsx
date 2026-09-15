import { useEffect, useState } from "react";
import api from "../api";

function Access() {
  const [access, setAccess] = useState([]);
  const [employees, setEmployees] =
    useState([]);
  const [applications, setApplications] =
    useState([]);

  const [employeeId, setEmployeeId] =
    useState("");

  const [applicationId, setApplicationId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [
        accessResponse,
        employeeResponse,
        applicationResponse,
      ] = await Promise.all([
        api.get("/access"),
        api.get("/employees"),
        api.get("/applications"),
      ]);

      setAccess(
        accessResponse.data.data || []
      );

      setEmployees(
        employeeResponse.data.data || []
      );

      setApplications(
        applicationResponse.data.data || []
      );

      setError("");
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to load access data"
      );
    } finally {
      setLoading(false);
    }
  }

  async function grantAccess() {
    if (!employeeId || !applicationId) {
      alert(
        "Select an employee and application"
      );

      return;
    }

    try {
      await api.post("/access/grant", {
        userId: Number(employeeId),
        applicationId: Number(
          applicationId
        ),
      });

      setEmployeeId("");
      setApplicationId("");

      await loadData();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to grant access"
      );
    }
  }

  async function revokeAccess(accessId) {
    const confirmed = window.confirm(
      "Revoke this application access?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.patch(
        `/access/${accessId}/revoke`
      );

      await loadData();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to revoke access"
      );
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Access Management</h1>

          <p>
            Grant and revoke application
            access for employees.
          </p>
        </div>
      </div>

      <div className="access-form">
        <select
          value={employeeId}
          onChange={(event) =>
            setEmployeeId(
              event.target.value
            )
          }
        >
          <option value="">
            Select employee
          </option>

          {employees.map(
            (employee) => (
              <option
                key={employee.id}
                value={employee.id}
              >
                {employee.name}
              </option>
            )
          )}
        </select>

        <select
          value={applicationId}
          onChange={(event) =>
            setApplicationId(
              event.target.value
            )
          }
        >
          <option value="">
            Select application
          </option>

          {applications.map(
            (application) => (
              <option
                key={application.id}
                value={application.id}
              >
                {application.name}
              </option>
            )
          )}
        </select>

        <button
          className="primary-button"
          onClick={grantAccess}
        >
          Grant Access
        </button>
      </div>

      {loading && (
        <p>Loading access records...</p>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        access.length === 0 && (
          <div className="empty-state">
            No access records found.
          </div>
        )}

      {!loading &&
        !error &&
        access.length > 0 && (
          <div className="table-container">
            <table>
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
                {access.map(
                  (item) => (
                    <tr key={item.id}>
                      <td>
                        {item.employee_name}
                      </td>

                      <td>
                        {item.application_name}
                      </td>

                      <td>
                        {item.status}
                      </td>

                      <td>
                        {item.granted_by ||
                          "Unknown"}
                      </td>

                      <td>
                        {new Date(
                          item.granted_at
                        ).toLocaleString()}
                      </td>

                      <td>
                        {item.status ===
                          "active" && (
                          <button
                            onClick={() =>
                              revokeAccess(
                                item.id
                              )
                            }
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

export default Access;