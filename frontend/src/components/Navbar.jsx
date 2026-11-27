
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../Layout.css";

function Navbar() {
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = JSON.parse(
    localStorage.getItem("accesshub_user") || "{}"
  );

  const initials = (user.name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function loadNotifications() {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data.data || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("Unable to load notifications:", error);
    }
  }

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  async function markAsRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      await loadNotifications();
    } catch (error) {
      console.error("Unable to mark notification as read:", error);
    }
  }

  async function markAllAsRead() {
    try {
      await api.patch("/notifications/read-all");
      await loadNotifications();
    } catch (error) {
      console.error("Unable to mark all notifications as read:", error);
    }
  }

  function handleLogout() {
    localStorage.removeItem("accesshub_token");
    localStorage.removeItem("accesshub_user");
    navigate("/login");
  }

  function formatDate(date) {
    return new Date(date).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <header className="navbar">
      <div className="navbar-heading">
        <span className="navbar-title">Access Management</span>
        <span className="navbar-subtitle">
          Manage your organization's identity and access
        </span>
      </div>

      <div className="navbar-right">
        <div className="navbar-search">
          <span>⌕</span>
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search"
          />
          <span className="search-shortcut">⌘ K</span>
        </div>

        <div className="notification-wrapper">
          <button
            className="notification-button"
            type="button"
            aria-label="Notifications"
            title="Notifications"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
              if (!notificationsOpen) loadNotifications();
            }}
          >
            ♧
            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <strong>Notifications</strong>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllAsRead}>
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    You're all caught up!
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item ${
                        notification.is_read ? "read" : "unread"
                      }`}
                      onClick={() =>
                        !notification.is_read &&
                        markAsRead(notification.id)
                      }
                    >
                      <div className="notification-item-title">
                        <strong>{notification.title}</strong>
                        {!notification.is_read && (
                          <span className="notification-unread-dot"></span>
                        )}
                      </div>
                      <p>{notification.message}</p>
                      <small>{formatDate(notification.created_at)}</small>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                className="notification-history"
                onClick={() => {
                  setNotificationsOpen(false);
                  navigate("/notifications");
                }}
              >
                View notification history
              </button>
            </div>
          )}
        </div>

        <div className="navbar-profile-wrapper">
          <button
            className="navbar-profile"
            type="button"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
          >
            <span className="navbar-avatar">{initials}</span>
            <span className="navbar-user-info">
              <strong>{user.name || "User"}</strong>
              <small>
                {user.roles?.join(", ") || user.role || "Employee"}
              </small>
            </span>
            <span className="profile-chevron">⌄</span>
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-user">{user.email || ""}</div>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/profile");
                }}
                className="dropdown-profile"
              >
                My Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="dropdown-logout"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
