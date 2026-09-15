import { NavLink } from "react-router-dom";

function Sidebar() {
  const links = [
    {
      name: "Dashboard",
      path: "/dashboard",
    },
    {
      name: "Employees",
      path: "/employees",
    },
    {
      name: "Roles",
      path: "/roles",
    },
    {
      name: "Applications",
      path: "/applications",
    },
    {
      name: "Access Management",
      path: "/access",
    },
    {
      name: "Onboarding",
      path: "/onboarding",
    },
    {
      name: "Offboarding",
      path: "/offboarding",
    },
    {
      name: "Audit Logs",
      path: "/audit-logs",
    },
  ];

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        backgroundColor: "#111827",
        color: "white",
        padding: "24px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: "22px",
          fontWeight: "700",
          marginBottom: "30px",
          paddingLeft: "8px",
        }}
      >
        AccessHub
      </div>

      <nav>
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            style={({ isActive }) => ({
              display: "block",
              padding: "12px 14px",
              marginBottom: "6px",
              borderRadius: "8px",
              textDecoration: "none",
              color: isActive ? "#ffffff" : "#9ca3af",
              backgroundColor: isActive
                ? "#2563eb"
                : "transparent",
              fontWeight: isActive ? "600" : "400",
              transition: "0.2s",
            })}
          >
            {link.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;