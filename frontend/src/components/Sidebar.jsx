
import { NavLink } from "react-router-dom";
import "../Layout.css";

function Sidebar() {
  const links = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Employees", path: "/employees" },
    { name: "Roles", path: "/roles" },
    { name: "Applications", path: "/applications" },
    { name: "Access Management", path: "/access" },
    { name: "Onboarding", path: "/onboarding" },
    { name: "Offboarding", path: "/offboarding" },
    { name: "Audit Logs", path: "/audit-logs" },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">AccessHub</div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
