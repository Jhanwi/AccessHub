import { useEffect, useState } from "react";
import api from "../api";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/audit-logs"
      );

      const data = Array.isArray(
        response.data
      )
        ? response.data
        : response.data.data || [];

      setLogs(data);
    } catch (error) {
      console.error(
        "Failed to load audit logs:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date) {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString();
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1>Audit Logs</h1>

          <p>
            Track important security and access
            activities in your organization.
          </p>
        </div>

        <button
          onClick={loadLogs}
          style={styles.refreshButton}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={styles.card}>
          <p>Loading audit logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div style={styles.card}>
          <h3>No audit logs found</h3>

          <p style={styles.emptyText}>
            Important activities will appear here
            when they are recorded.
          </p>
        </div>
      ) : (
        <div style={styles.card}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    Date
                  </th>

                  <th style={styles.th}>
                    User
                  </th>

                  <th style={styles.th}>
                    Action
                  </th>

                  <th style={styles.th}>
                    Entity
                  </th>

                  <th style={styles.th}>
                    Details
                  </th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={styles.td}>
                      {formatDate(
                        log.createdAt
                      )}
                    </td>

                    <td style={styles.td}>
                      <strong>
                        {log.user?.name ||
                          "System"}
                      </strong>

                      {log.user?.email && (
                        <div
                          style={
                            styles.email
                          }
                        >
                          {log.user.email}
                        </div>
                      )}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={
                          styles.action
                        }
                      >
                        {log.action}
                      </span>
                    </td>

                    <td style={styles.td}>
                      {log.entityType || "-"}
                    </td>

                    <td style={styles.td}>
                      <pre
                        style={
                          styles.details
                        }
                      >
                        {log.details
                          ? JSON.stringify(
                              log.details,
                              null,
                              2
                            )
                          : "-"}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "30px",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: "25px",
    borderRadius: "10px",
    boxShadow:
      "0 2px 8px rgba(0, 0, 0, 0.08)",
  },

  refreshButton: {
    padding: "10px 18px",
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

  emptyText: {
    color: "#6b7280",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom:
      "2px solid #e5e7eb",
    fontSize: "13px",
    color: "#374151",
  },

  td: {
    padding: "14px 12px",
    borderBottom:
      "1px solid #e5e7eb",
    verticalAlign: "top",
    fontSize: "14px",
  },

  email: {
    marginTop: "3px",
    fontSize: "12px",
    color: "#6b7280",
  },

  action: {
    display: "inline-block",
    padding: "5px 8px",
    borderRadius: "5px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "600",
  },

  details: {
    margin: 0,
    whiteSpace: "pre-wrap",
    fontSize: "12px",
    color: "#4b5563",
    maxWidth: "300px",
  },
};

export default AuditLogs;
