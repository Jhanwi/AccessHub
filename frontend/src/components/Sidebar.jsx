
import { NavLink } from "react-router-dom";
import "../Layout.css";

function Sidebar({ collapsed, mobileOpen, onClose }) {
  const user = JSON.parse(
    localStorage.getItem("accesshub_user") || "{}"
  );

  const links = [
    { name: "Dashboard", path: "/dashboard", icon: "📊" },
    { name: "Employees", path: "/employees", icon: "👥" },
    { name: "Roles", path: "/roles", icon: "🛡️" },
    { name: "Applications", path: "/applications", icon: "⊞" },
    { name: "Access Management", path: "/access", icon: "🔑" },
    { name: "Onboarding", path: "/onboarding", icon: "➕" },
    { name: "Offboarding", path: "/offboarding", icon: "➖" },
    { name: "Audit Logs", path: "/audit-logs", icon: "📋" },
  ];

  const initials = (user.name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={`app-sidebar ${
        collapsed ? "sidebar-is-collapsed" : ""
      } ${mobileOpen ? "sidebar-mobile-open" : ""}`}
    >
      <div className="sidebar-brand">
        <div className="brand-icon">◆</div>
        <div className="brand-text">
          <span className="brand-name">AccessHub</span>
          
        </div>
      </div>

      <div className="sidebar-section-label">MAIN MENU</div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/dashboard"}
            title={collapsed ? link.name : undefined}
            onClick={onClose}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon">{link.icon}</span>
            <span className="sidebar-link-text">{link.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-profile">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-details">
            <span className="profile-name">{user.name || "User"}</span>
            <span className="profile-role">
              {user.roles?.join(", ") || user.role || "Employee"}
            </span>
          </div>
        </div>
        <div className="sidebar-footer">AccessHub © 2026</div>
      </div>
    </aside>
  );
}

export default Sidebar;
