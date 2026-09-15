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


function ComingSoon() {

  return (
    <div className="page-content">

      <h1>Coming Soon</h1>

      <p>
        This section will be implemented in a
        later AccessHub phase.
      </p>

    </div>
  );
}


function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/login"
          element={<Authentication />}
        />


        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ComingSoon />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/roles"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ComingSoon />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ComingSoon />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/access"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ComingSoon />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ComingSoon />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/offboarding"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ComingSoon />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ComingSoon />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;