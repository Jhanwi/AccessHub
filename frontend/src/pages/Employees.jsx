import { useEffect, useState } from "react";

import api from "../api";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadEmployees() {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/employees");

      setEmployees(response.data.data);
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

  useEffect(() => {
    loadEmployees();
  }, []);

  const filteredEmployees =
    employees.filter((employee) => {
      const matchesSearch =
        employee.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        employee.email
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        employee.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          Loading employees...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="error-state">
          <p>{error}</p>

          <button onClick={loadEmployees}>
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
          <h1>Employees</h1>

          <p>
            Manage employees and their
            assigned roles.
          </p>
        </div>

        <button className="primary-button">
          Add Employee
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
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Status
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>
        </select>

      </div>


      <div className="employee-table-card">

        {filteredEmployees.length === 0 ? (
          <div className="empty-state">
            No employees found.
          </div>
        ) : (
          <div className="table-wrapper">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>

                {filteredEmployees.map(
                  (employee) => (
                    <tr key={employee.id}>

                      <td>
                        <strong>
                          {employee.name}
                        </strong>
                      </td>

                      <td>
                        {employee.email}
                      </td>

                      <td>
                        {employee.role ||
                          "No role"}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${employee.status}`}
                        >
                          {employee.status}
                        </span>
                      </td>

                      <td>
                        {new Date(
                          employee.created_at
                        ).toLocaleDateString()}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default Employees;