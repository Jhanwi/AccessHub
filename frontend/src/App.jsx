
import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Authentication from "./pages/Authentication";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import Employees from "./pages/Employees";
import Roles from "./pages/Roles";
import Applications from "./pages/Applications";
import Access from "./pages/Access";
import Onboarding from "./pages/Onboarding";
import Offboarding from "./pages/Offboarding";
import AuditLogs from "./pages/AuditLogs";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";

function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  function toggleSidebar() {
    if (window.innerWidth <= 700) {
      setMobileSidebarOpen((open) => !open);
    } else {
      setSidebarCollapsed((collapsed) => !collapsed);
    }
  }

  function closeMobileSidebar() {
    setMobileSidebarOpen(false);
  }

  return (
    <div
      className={`app-layout ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      } ${mobileSidebarOpen ? "mobile-sidebar-open" : ""}`}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onClose={closeMobileSidebar}
      />

      {mobileSidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={closeMobileSidebar}
        />
      )}

      <div className="main-area">
        <Navbar onMenuClick={toggleSidebar} />
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Authentication />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/employee/login" element={<Navigate to="/login" replace />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="employee">
              <DashboardLayout><Dashboard /></DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <DashboardLayout><Dashboard /></DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout><Profile /></DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <DashboardLayout><Notifications /></DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/employees" element={<ProtectedRoute requiredRole="admin"><DashboardLayout><Employees /></DashboardLayout></ProtectedRoute>} />
        <Route path="/roles" element={<ProtectedRoute requiredRole="admin"><DashboardLayout><Roles /></DashboardLayout></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute requiredRole="admin"><DashboardLayout><Applications /></DashboardLayout></ProtectedRoute>} />
        <Route path="/access" element={<ProtectedRoute requiredRole="admin"><DashboardLayout><Access /></DashboardLayout></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute requiredRole="admin"><DashboardLayout><Onboarding /></DashboardLayout></ProtectedRoute>} />
        <Route path="/offboarding" element={<ProtectedRoute requiredRole="admin"><DashboardLayout><Offboarding /></DashboardLayout></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute requiredRole="admin"><DashboardLayout><AuditLogs /></DashboardLayout></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
