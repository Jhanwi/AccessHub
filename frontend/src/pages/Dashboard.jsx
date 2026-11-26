import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import api from "../api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("accesshub_user") || "{}");
  const isAdmin = user.roles?.some(role => role.toLowerCase() === "admin") || user.role?.toLowerCase() === "admin";

  const [stats, setStats] = useState(null);

  const [accessDistribution, setAccessDistribution] =
    useState([]);

  const [roleDistribution, setRoleDistribution] =
    useState([]);

  const [accessActivity, setAccessActivity] =
    useState([]);

  const [recentActivity, setRecentActivity] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  useEffect(() => {
    loadDashboard();
  }, []);

  
  async function loadDashboard() {

    try {

      setLoading(true);
      setError("");


      const [
        statsResponse,
        accessResponse,
        roleResponse,
        activityResponse,
        recentResponse,
      ] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/access-distribution"),
        api.get("/dashboard/employees-by-role"),
        api.get("/dashboard/access-activity"),
        api.get("/dashboard/recent-activity"),
      ]);


      setStats(statsResponse.data);

      setAccessDistribution(
        accessResponse.data.data
      );

      setRoleDistribution(
        roleResponse.data.data
      );

      setAccessActivity(
        activityResponse.data.data
      );

      setRecentActivity(
        recentResponse.data.data
      );

    } catch (error) {

      console.error(
        "Dashboard loading error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Failed to load dashboard"
      );

    } finally {

      setLoading(false);
    }
  }

  function handleCardKeyDown(event, path) {
    if (event.key === "Enter" || event.key === " ") {
     event.preventDefault();
     if (isAdmin) navigate(path);
    }
  }

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-state">
          Loading dashboard...
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="page-content">

        <div className="error-state">
          <h2>Unable to load dashboard</h2>

          <p>{error}</p>

          <button onClick={loadDashboard}>
            Try again
          </button>
        </div>

      </div>
    );
  }


  return (
    <div className="page-content">

      {/* Page Header */}

      <div className="page-header">

        <div>
          <h1>Dashboard</h1>

          <p>
            Overview of your organization's access
            and permissions.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadDashboard}
        >
          Refresh
        </button>

      </div>


      {/* Statistics Cards */}

      <div className="stats-grid">

        <div
           className={`stat-card ${isAdmin ? "clickable-card" : ""}`}
           onClick={() => isAdmin && navigate("/employees")}
           role={isAdmin ? "button" : undefined}
           tabIndex={isAdmin ? 0 : undefined}
           onKeyDown={(event) => handleCardKeyDown(event, "/employees")}
          >

          <div className="stat-card-header">
            <span>Total Employees</span>
          </div>

          <strong>
            {stats.totalEmployees}
          </strong>

          <p>
            All organization employees
          </p>

        </div>


        <div
           className={`stat-card ${isAdmin ? "clickable-card" : ""}`}
           onClick={() => isAdmin && navigate("/employees")}
           role={isAdmin ? "button" : undefined}
           tabIndex={isAdmin ? 0 : undefined}
           onKeyDown={(event) => handleCardKeyDown(event, "/employees")}
          >

          <div className="stat-card-header">
            <span>Active Employees</span>
          </div>

          <strong>
            {stats.activeEmployees}
          </strong>

          <p>
            Currently active
          </p>

        </div>


        <div
           className={`stat-card ${isAdmin ? "clickable-card" : ""}`}
           onClick={() => isAdmin && navigate("/applications")}
           role={isAdmin ? "button" : undefined}
           tabIndex={isAdmin ? 0 : undefined}
           onKeyDown={(event) => handleCardKeyDown(event, "/applications")}
          >

          <div className="stat-card-header">
            <span>Applications</span>
          </div>

          <strong>
            {stats.applications}
          </strong>

          <p>
            Connected applications
          </p>

        </div>


        <div
           className={`stat-card ${isAdmin ? "clickable-card" : ""}`}
           onClick={() => isAdmin && navigate("/access")}
           role={isAdmin ? "button" : undefined}
           tabIndex={isAdmin ? 0 : undefined}
           onKeyDown={(event) => handleCardKeyDown(event, "/access")}
          >

          <div className="stat-card-header">
            <span>Active Access</span>
          </div>

          <strong>
            {stats.activeAccess}
          </strong>

          <p>
            Current application access
          </p>

        </div>


        <div
           className={`stat-card ${isAdmin ? "clickable-card" : ""}`}
           onClick={() => isAdmin && navigate("/access")}
           role={isAdmin ? "button" : undefined}
           tabIndex={isAdmin ? 0 : undefined}
           onKeyDown={(event) => handleCardKeyDown(event, "/access")}
          >

          <div className="stat-card-header">
            <span>Revoked Access</span>
          </div>

          <strong>
            {stats.revokedAccess}
          </strong>

          <p>
            Previously revoked
          </p>

        </div>

      </div>


      {/* Charts */}

      <div className="dashboard-grid">


        {/* Access Distribution */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>
              <h2>Application Access</h2>

              <p>
                Active access by application
              </p>
            </div>

          </div>


          {accessDistribution.length === 0 ? (

            <div className="empty-state">
              No application data available.
            </div>

          ) : (

            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={280}
              >

                <PieChart>

                  <Pie
                    data={accessDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label
                  >

                    {accessDistribution.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"][index % 5]}
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>

            </div>

          )}

        </div>


        {/* Access Activity */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>
              <h2>Access Activity</h2>

              <p>
                Access grants over time
              </p>
            </div>

          </div>


          {accessActivity.length === 0 ? (

            <div className="empty-state">
              No access activity yet.
            </div>

          ) : (

            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={280}
              >

                <LineChart
                  data={accessActivity}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })
                    }
                  />

                  <YAxis
                    allowDecimals={false}
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#2563eb" }}
                    activeDot={{ r: 6 }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          )}

        </div>


        {/* Employees by Role */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>
              <h2>Employees by Role</h2>

              <p>
                Current role distribution
              </p>
            </div>

          </div>


          {roleDistribution.length === 0 ? (

            <div className="empty-state">
              No role data available.
            </div>

          ) : (

            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={280}
              >

                <PieChart>

                  <Pie
                    data={roleDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label
                  >

                    {roleDistribution.map(
                      (entry, index) => (
                        <Cell
                          key={`role-${index}`}
                          fill={["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"][index % 5]}
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>

            </div>

          )}

        </div>


        {/* Recent Activity */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>
              <h2>Recent Activity</h2>

              <p>
                Latest organization actions
              </p>
            </div>

          </div>


          {recentActivity.length === 0 ? (

            <div className="empty-state">
              No recent activity.
            </div>

          ) : (

            <div className="activity-list">

              {recentActivity.map((activity) => (

                <div
                  className="activity-item"
                  key={activity.id}
                >

                  <div className="activity-dot">
                    •
                  </div>

                  <div>

                    <strong>
                      {activity.action}
                    </strong>

                    <p>
                      {activity.user_name ||
                        "System"}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>
  );
}


export default Dashboard;