import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Authentication from "./pages/Authentication";
import ProtectedRoute from "./components/ProtectedRoute";

function Dashboard() {
  const user = JSON.parse(
    localStorage.getItem("accesshub_user")
  );

  return (
    <div style={{ padding: "30px" }}>
      <h1>AccessHub Dashboard</h1>

      <p>
        Welcome, {user?.name}
      </p>

      <p>
        You are successfully logged in.
      </p>

      <button
        onClick={() => {
          localStorage.removeItem("accesshub_token");
          localStorage.removeItem("accesshub_user");

          window.location.href = "/login";
        }}
      >
        Logout
      </button>
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
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;