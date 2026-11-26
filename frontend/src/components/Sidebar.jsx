
import { NavLink } from "react-router-dom";
import "../Layout.css";

function Sidebar() {
  const user = JSON.parse(
    localStorage.getItem("accesshub_user") || "{}"
  );

  const links = [
    { name: "Dashboard", path: "/dashboard", icon: "▦" },
    { name: "Employees", path: "/employees", icon: "♙" },
    { name: "Roles", path: "/roles", icon: "♧" },
    { name: "Applications", path: "/applications", icon: "▣" },
    { name: "Access Management", path: "/access", icon: "⚿" },
    { name: "Onboarding", path: "/onboarding", icon: "↗" },
    { name: "Offboarding", path: "/offboarding", icon: "↙" },
    { name: "Audit Logs", path: "/audit-logs", icon: "◷" },
  ];

  const initials = (user.name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">◆</div>
        <div>
          <span className="brand-name">AccessHub</span>
          <span className="brand-caption">IDENTITY MANAGEMENT</span>
        </div>
      </div>

      <div className="sidebar-section-label">MAIN MENU</div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/dashboard"}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon">{link.icon}</span>
            <span>{link.name}</span>
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
