
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

function DashboardLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Navbar />
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login page opens first */}
        <Route path="/login" element={<Authentication />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Old login URLs */}
        <Route path="/employee/login" element={<Navigate to="/login" replace />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        {/* Employee Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="employee">
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* My Profile - Available to Admin and Employee */}
        <Route
         path="/profile"
         element={
           <ProtectedRoute>
             <DashboardLayout>
               <Profile />
             </DashboardLayout>
           </ProtectedRoute>
          }
        />

        {/* Admin Pages */}
        <Route path="/employees" element={<ProtectedRoute requiredRole="admin"><DashboardLayout><Employees /></DashboardLayout></ProtectedRoute>} />
        <Route path="/roles" element={<ProtectedRoute requiredRole="admin"><DashboardLayout><Roles /></DashboardLayout></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute requiredRole="admin"><DashboardLayout><Applications /></DashboardLayout></ProtectedRoute>} />
        <Route path="/access" element={<ProtectedRoute requiredRole="admin"><DashboardLayout><Access /></DashboardLayout></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute requiredRole="admin"><DashboardLayout><Onboarding /></DashboardLayout></ProtectedRoute>} />
        <Route path="/offboarding" element={<ProtectedRoute requiredRole="admin"><DashboardLayout><Offboarding /></DashboardLayout></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute requiredRole="admin"><DashboardLayout><AuditLogs /></DashboardLayout></ProtectedRoute>} />

        {/* Unknown routes go to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
