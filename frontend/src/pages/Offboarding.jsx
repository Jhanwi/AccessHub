import { useEffect, useState } from "react";
import api from "../api";

function Offboarding() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] =
    useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    try {
      setLoading(true);

      const response =
        await api.get("/employees");

      setEmployees(
        response.data.data || []
      );
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

  async function handleOffboarding(
    employee
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to offboard ${employee.name}? This will disable the employee and revoke active application access.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(employee.id);
      setError("");
      setMessage("");

      const response =
        await api.patch(
          `/offboarding/${employee.id}`
        );

      setMessage(
        response.data.message
      );

      loadEmployees();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to offboard employee"
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return <p>Loading employees...</p>;
  }

  return (
    <div className="page">
      <h1>Employee Offboarding</h1>

      <p>
        Disable employees and revoke their
        active application access.
      </p>

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {employees.length === 0 ? (
        <p>No employees found.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {employees.map(
                (employee) => (
                  <tr key={employee.id}>
                    <td>
                      {employee.name}
                    </td>

                    <td>
                      {employee.email}
                    </td>

                    <td>
                      {employee.status}
                    </td>

                    <td>
                      {employee.status ===
                      "active" ? (
                        <button
                          onClick={() =>
                            handleOffboarding(
                              employee
                            )
                          }
                          disabled={
                            processingId ===
                            employee.id
                          }
                        >
                          {processingId ===
                          employee.id
                            ? "Processing..."
                            : "Offboard"}
                        </button>
                      ) : (
                        <span>
                          Already inactive
                        </span>
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

export default Offboarding;