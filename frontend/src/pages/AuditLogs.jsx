
import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./AuditLogs.css";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);

  async function loadLogs() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/audit-logs");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];

      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setError(
        err.response?.data?.message || "Failed to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const actions = useMemo(
    () => [...new Set(logs.map((log) => log.action).filter(Boolean))].sort(),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const query = search.toLowerCase().trim();

    return logs.filter((log) => {
      const matchesAction =
        actionFilter === "all" || log.action === actionFilter;

      const searchableText = [
        log.action,
        log.entityType,
        log.entityId,
        log.user?.name,
        log.user?.email,
        typeof log.details === "string"
          ? log.details
          : JSON.stringify(log.details || {}),
      ]
        .join(" ")
        .toLowerCase();

      return matchesAction && searchableText.includes(query);
    });
  }, [logs, search, actionFilter]);

  const uniqueUsers = new Set(
    logs.map((log) => log.user?.email || log.user?.name || "System")
  ).size;

  const todayCount = logs.filter((log) => {
    if (!log.createdAt) return false;

    const date = new Date(log.createdAt);
    const today = new Date();

    return date.toDateString() === today.toDateString();
  }).length;

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString();
  }

  function getInitial(name) {
    return (name || "S").charAt(0).toUpperCase();
  }

  return (
    <div className="audit-page">
      <div className="audit-header">
        <div>
          <h1>Audit Logs</h1>
          <p>
            Monitor security events and track important organization
            activities.
          </p>
        </div>

        <button className="audit-refresh" onClick={loadLogs}>
          ↻ Refresh
        </button>
      </div>

      {error && <div className="audit-alert error">{error}</div>}

      <div className="audit-stats">
        <div className="audit-stat">
          <div className="audit-stat-label">Total Events</div>
          <div className="audit-stat-value">{logs.length}</div>
        </div>

        <div className="audit-stat">
          <div className="audit-stat-label">Events Today</div>
          <div className="audit-stat-value">{todayCount}</div>
        </div>

        <div className="audit-stat">
          <div className="audit-stat-label">Unique Users / Sources</div>
          <div className="audit-stat-value">{uniqueUsers}</div>
        </div>
      </div>

      <div className="audit-card">
        <div className="audit-card-heading">
          <div>
            <h2>Activity History</h2>
            <p>Review and inspect recorded organization events.</p>
          </div>
        </div>

        <div className="audit-controls">
          <input
            className="audit-search"
            type="text"
            placeholder="Search action, user, email or entity..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="audit-filter"
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
          >
            <option value="all">All Actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="audit-empty">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="audit-empty">
            {logs.length === 0
              ? "No audit events have been recorded yet."
              : "No events match your search or filter."}
          </div>
        ) : (
          <div className="audit-table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="audit-date">
                      {formatDate(log.createdAt)}
                    </td>

                    <td>
                      <div className="audit-user">
                        <div className="audit-avatar">
                          {getInitial(log.user?.name)}
                        </div>

                        <div>
                          <div className="audit-user-name">
                            {log.user?.name || "System"}
                          </div>

                          {log.user?.email && (
                            <div className="audit-email">
                              {log.user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="audit-action">
                        {log.action || "Unknown"}
                      </span>
                    </td>

                    <td className="audit-entity">
                      {log.entityType || "-"}
                      {log.entityId ? ` #${log.entityId}` : ""}
                    </td>

                    <td>
                      <button
                        className="audit-details-button"
                        onClick={() => setSelectedLog(log)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLog && (
        <div
          className="audit-modal-backdrop"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="audit-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="audit-modal-header">
              <h3>Audit Event Details</h3>

              <button
                className="audit-modal-close"
                onClick={() => setSelectedLog(null)}
              >
                ×
              </button>
            </div>

            <div className="audit-detail-row">
              <span className="audit-detail-label">Event ID</span>
              <span className="audit-detail-value">
                {selectedLog.id}
              </span>
            </div>

            <div className="audit-detail-row">
              <span className="audit-detail-label">Action</span>
              <span className="audit-detail-value">
                {selectedLog.action || "-"}
              </span>
            </div>

            <div className="audit-detail-row">
              <span className="audit-detail-label">User</span>
              <span className="audit-detail-value">
                {selectedLog.user?.name || "System"}
                {selectedLog.user?.email
                  ? ` (${selectedLog.user.email})`
                  : ""}
              </span>
            </div>

            <div className="audit-detail-row">
              <span className="audit-detail-label">Entity</span>
              <span className="audit-detail-value">
                {selectedLog.entityType || "-"}
                {selectedLog.entityId
                  ? ` #${selectedLog.entityId}`
                  : ""}
              </span>
            </div>

            <div className="audit-detail-row">
              <span className="audit-detail-label">Date & Time</span>
              <span className="audit-detail-value">
                {formatDate(selectedLog.createdAt)}
              </span>
            </div>

            <div className="audit-detail-row">
              <span className="audit-detail-label">Event Details</span>
              <pre className="audit-json">
                {selectedLog.details
                  ? JSON.stringify(selectedLog.details, null, 2)
                  : "No additional details available."}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogs;
