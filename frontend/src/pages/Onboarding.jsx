import { useEffect, useState } from "react";
import api from "../api";

function Onboarding() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [applicationIds, setApplicationIds] = useState([]);

  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [applications, setApplications] = useState([]);

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

      const employeesResponse = await api.get("/employees");
      const rolesResponse = await api.get("/roles");
      const applicationsResponse = await api.get(
        "/applications"
      );

      const employeesData = Array.isArray(
        employeesResponse.data
      )
        ? employeesResponse.data
        : employeesResponse.data.employees || [];

      const rolesData = Array.isArray(rolesResponse.data)
       ? rolesResponse.data
       : rolesResponse.data.data || [];

      const applicationsData = Array.isArray(
        applicationsResponse.data
      )
        ? applicationsResponse.data
        : applicationsResponse.data.applications || [];

      setEmployees(employeesData);
      setRoles(rolesData);
      setApplications(applicationsData);
    } catch (error) {
      console.error(
        "Failed to load onboarding data:",
        error
      );

      setError(
        error.response?.data?.message ||
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
    setApplicationIds((currentIds) => {
      if (currentIds.includes(applicationId)) {
        return currentIds.filter(
          (id) => id !== applicationId
        );
      }

      return [...currentIds, applicationId];
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !roleId
    ) {
      setError(
        "Name, email, password and role are required."
      );
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
        response.data.message ||
          "Employee onboarded successfully."
      );

      setName("");
      setEmail("");
      setPassword("");
      setRoleId("");
      setApplicationIds([]);

      await loadData();
    } catch (error) {
      console.error("Onboarding error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to onboard employee."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <h1>Employee Onboarding</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1>Employee Onboarding</h1>
        <p>
          Create a new employee, assign a role and grant
          application access.
        </p>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {success && (
        <div style={styles.success}>
          {success}
        </div>
      )}

      <div style={styles.card}>
        <h2>Create Employee</h2>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label>Name</label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Enter employee name"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter employee email"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter temporary password"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Role</label>

            <select
              value={roleId}
              onChange={(event) =>
                setRoleId(event.target.value)
              }
              style={styles.input}
            >
              <option value="">
                Select a role
              </option>

              {roles.length > 0 ? (
                roles.map((role) => (
                  <option
                    key={role.id}
                    value={role.id}
                  >
                    {role.name}
                  </option>
                ))
              ) : (
                <option disabled>
                  No roles available
                </option>
              )}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label>
              Application Access
            </label>

            {applications.length === 0 ? (
              <p style={styles.noData}>
                No applications available.
              </p>
            ) : (
              <div style={styles.applicationList}>
                {applications.map(
                  (application) => (
                    <label
                      key={application.id}
                      style={styles.applicationItem}
                    >
                      <input
                        type="checkbox"
                        checked={applicationIds.includes(
                          application.id
                        )}
                        onChange={() =>
                          handleApplicationChange(
                            application.id
                          )
                        }
                      />

                      <span>
                        {application.name}
                      </span>
                    </label>
                  )
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.button,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting
              ? "Onboarding..."
              : "Onboard Employee"}
          </button>
        </form>
      </div>

      <div style={styles.card}>
        <h2>Current Employees</h2>

        {employees.length === 0 ? (
          <p>No employees found.</p>
        ) : (
          <div>
            {employees.map((employee) => (
              <div
                key={employee.id}
                style={styles.employee}
              >
                <div>
                  <strong>
                    {employee.name}
                  </strong>

                  <div style={styles.email}>
                    {employee.email}
                  </div>
                </div>

                <span
                  style={{
                    ...styles.status,
                    backgroundColor:
                      employee.status === "active"
                        ? "#dcfce7"
                        : "#fee2e2",
                    color:
                      employee.status === "active"
                        ? "#166534"
                        : "#991b1b",
                  }}
                >
                  {employee.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "30px",
    maxWidth: "1000px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "25px",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: "25px",
    marginBottom: "25px",
    borderRadius: "10px",
    boxShadow:
      "0 2px 8px rgba(0, 0, 0, 0.08)",
  },

  formGroup: {
    marginBottom: "18px",
  },

  input: {
    display: "block",
    width: "100%",
    marginTop: "7px",
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    boxSizing: "border-box",
    fontSize: "14px",
  },

  applicationList: {
    marginTop: "10px",
  },

  applicationItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px",
    marginBottom: "6px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    cursor: "pointer",
  },

  noData: {
    color: "#6b7280",
  },

  button: {
    padding: "11px 20px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
  },

  error: {
    padding: "12px",
    marginBottom: "20px",
    borderRadius: "6px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },

  success: {
    padding: "12px",
    marginBottom: "20px",
    borderRadius: "6px",
    backgroundColor: "#dcfce7",
    color: "#166534",
  },

  employee: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid #e5e7eb",
  },

  email: {
    marginTop: "4px",
    color: "#6b7280",
    fontSize: "13px",
  },

  status: {
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },
};

export default Onboarding;

