import { NavLink } from "react-router-dom";


function Sidebar() {

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      label: "Employees",
      path: "/employees",
    },
    {
      label: "Roles",
      path: "/roles",
    },
    {
      label: "Applications",
      path: "/applications",
    },
    {
      label: "Access",
      path: "/access",
    },
    {
      label: "Onboarding",
      path: "/onboarding",
    },
    {
      label: "Offboarding",
      path: "/offboarding",
    },
    {
      label: "Audit Logs",
      path: "/audit-logs",
    },
  ];


  return (
    <aside className="sidebar">

      <div className="sidebar-logo">
        AccessHub
      </div>


      <nav className="sidebar-nav">

        {menuItems.map((item) => (

          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? "sidebar-link active"
                : "sidebar-link"
            }
          >
            {item.label}
          </NavLink>

        ))}

      </nav>

    </aside>
  );
}


export default Sidebar;