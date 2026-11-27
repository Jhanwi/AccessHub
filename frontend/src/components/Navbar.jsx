
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Layout.css";

function Navbar() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const user = JSON.parse(
    localStorage.getItem("accesshub_user") || "{}"
  );

  const initials = (user.name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleLogout() {
    localStorage.removeItem("accesshub_token");
    localStorage.removeItem("accesshub_user");
    navigate("/login");
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

        <button
          className="notification-button"
          type="button"
          aria-label="Notifications"
          title="Notifications"
        >
          ♧
          <span className="notification-dot"></span>
        </button>

        <div className="navbar-profile-wrapper">
          <button
            className="navbar-profile"
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
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
              <div className="dropdown-user">
                {user.email || ""}
              </div>
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
