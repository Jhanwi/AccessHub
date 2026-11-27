import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/notifications/history");
      setNotifications(response.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load notifications."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAsRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      await loadNotifications();
    } catch (err) {
      setError("Unable to mark notification as read.");
    }
  }

  async function markAllAsRead() {
    try {
      await api.patch("/notifications/read-all");
      await loadNotifications();
    } catch (err) {
      setError("Unable to mark notifications as read.");
    }
  }

  const filteredNotifications = useMemo(() => {
    const query = search.toLowerCase().trim();

    return notifications.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !item.is_read) ||
        (filter === "read" && item.is_read);

      const matchesSearch =
        `${item.title} ${item.message} ${item.type || ""}`
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [notifications, filter, search]);

  const unreadCount = notifications.filter(
    (item) => !item.is_read
  ).length;

  function formatDate(date) {
    return date ? new Date(date).toLocaleString() : "-";
  }

  return (
    <main className="notifications-page">
      <div className="notifications-page-header">
        <div>
          <h1>Notifications</h1>
          <p>View updates and important activity from AccessHub.</p>
        </div>

        <button
          className="notifications-refresh"
          type="button"
          onClick={loadNotifications}
        >
          ↻ Refresh
        </button>
      </div>

      {error && <div className="notifications-error">{error}</div>}

      <div className="notifications-summary">
        <div className="notifications-summary-card">
          <span>Total Notifications</span>
          <strong>{notifications.length}</strong>
        </div>

        <div className="notifications-summary-card">
          <span>Unread</span>
          <strong>{unreadCount}</strong>
        </div>

        <div className="notifications-summary-card">
          <span>Read</span>
          <strong>{notifications.length - unreadCount}</strong>
        </div>
      </div>

      <section className="notifications-history-card">
        <div className="notifications-history-heading">
          <div>
            <h2>Notification History</h2>
            <p>Your latest 100 notifications.</p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              className="notifications-mark-all"
              onClick={markAllAsRead}
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="notifications-controls">
          <input
            type="search"
            placeholder="Search notifications..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All notifications</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>

        {loading ? (
          <div className="notifications-empty">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notifications-empty">
            {notifications.length === 0
              ? "No notifications yet."
              : "No notifications match your search or filter."}
          </div>
        ) : (
          <div className="notifications-history-list">
            {filteredNotifications.map((item) => (
              <article
                key={item.id}
                className={`notifications-history-item ${
                  item.is_read ? "is-read" : "is-unread"
                }`}
              >
                <div className="notifications-history-icon">
                  {item.is_read ? "✓" : "●"}
                </div>

                <div className="notifications-history-content">
                  <div className="notifications-history-title">
                    <strong>{item.title}</strong>
                    {!item.is_read && (
                      <span className="notifications-unread-label">
                        Unread
                      </span>
                    )}
                  </div>

                  <p>{item.message}</p>

                  <small>{formatDate(item.created_at)}</small>
                </div>

                {!item.is_read && (
                  <button
                    type="button"
                    className="notifications-read-button"
                    onClick={() => markAsRead(item.id)}
                  >
                    Mark read
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Notifications;
