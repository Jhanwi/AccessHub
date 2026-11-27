import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
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
  const [activityPage, setActivityPage] = useState(1);
  const activitiesPerPage = 5;


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

  const totalActivityPages = Math.max(1, Math.ceil(recentActivity.length / activitiesPerPage));
  const paginatedRecentActivity = recentActivity.slice(
    (activityPage - 1) * activitiesPerPage,
    activityPage * activitiesPerPage
  );

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
         <h1>
            Welcome back, {user.name || "User"}!
          </h1>

         <p> Here's what's happening across your organization today.</p>
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
            <span>Total Employees</span><span className="stat-card-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
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
            <span>Active Employees</span><span className="stat-card-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM16 11l2 2 4-4"/></svg></span>
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
            <span>Applications</span><span className="stat-card-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></span>
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
            <span>Active Access</span><span className="stat-card-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></svg></span>
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
            <span>Revoked Access</span><span className="stat-card-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 9 6 6m0-6-6 6"/></svg></span>
          </div>

          <strong>
            {stats.revokedAccess}
          </strong>

          <p>
            Previously revoked
          </p>

        </div>

      </div>


      {/* Quick Actions */}
      {isAdmin && (
        <section className="quick-actions-section">
          <div className="quick-actions-heading">
            <h2>Quick Actions</h2>
            <p>Common tasks for managing your organization</p>
          </div>

          <div className="quick-actions-grid">
            <button
              className="quick-action-card"
              onClick={() => navigate("/employees")}
            >
              <span className="quick-action-icon employee-icon">+</span>
              <span className="quick-action-content">
                <strong>Add Employee</strong>
                <small>Create a new employee account</small>
              </span>
              <span className="quick-action-arrow">→</span>
            </button>

            <button
              className="quick-action-card"
              onClick={() => navigate("/applications")}
            >
              <span className="quick-action-icon application-icon">▦</span>
              <span className="quick-action-content">
                <strong>Connect Application</strong>
                <small>Register an organization application</small>
              </span>
              <span className="quick-action-arrow">→</span>
            </button>

            <button
              className="quick-action-card"
              onClick={() => navigate("/access")}
            >
              <span className="quick-action-icon access-icon">✓</span>
              <span className="quick-action-content">
                <strong>Manage Access</strong>
                <small>Grant or revoke application access</small>
              </span>
              <span className="quick-action-arrow">→</span>
            </button>
          </div>
        </section>
      )}

      {/* Charts */}

      <div className="dashboard-grid">


        {/* Access Distribution */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>
              <h2><span className="chart-title-icon application-icon">▥</span>Application Access</h2>

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

            <div className="distribution-layout">
              <div className="distribution-chart">
               <ResponsiveContainer width="100%" height={210}>
                 <PieChart>
                   <Pie
                     data={accessDistribution}
                     dataKey="count"
                     nameKey="name"
                     cx="50%"
                     cy="50%"
                     innerRadius={48}
                     outerRadius={78}
                     paddingAngle={4}
                     stroke="#ffffff"
                     strokeWidth={3}
                    >
                   {accessDistribution.map((entry, index) => (
                      <Cell
                       key={`cell-${index}`}
                       fill={["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"][index % 5]}
                      />

                    ))}

                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} grants`, name]} />
               
                </PieChart>
              </ResponsiveContainer>
            </div>

           <div className="distribution-details">
             {accessDistribution.map((entry, index) => {
             const total = accessDistribution.reduce(
             (sum, item) => sum + Number(item.count || 0), 0);
             const percentage = total ? ((Number(entry.count || 0) / total) * 100).toFixed(1) : "0.0";
             const color = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"][index % 5];

             return (
               <div className="distribution-detail" key={`access-detail-${index}`}>
                 <span className="distribution-name">
                   <span className="distribution-dot" style={{ background: color }} />
                   <span title={entry.name}>{entry.name}</span>

                  </span>

                 <strong>{entry.count}</strong>
                 <span className="distribution-percentage">{percentage}%</span>

                </div>
              );
            })}
         </div>
        </div>
      )}

    </div>


        {/* Access Activity */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>
              <h2><span className="chart-title-icon activity-icon">↗</span>Access Activity</h2>

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

            <div className="chart-container access-activity-chart">

             <ResponsiveContainer width="100%" height={230}>
               <LineChart
                   data={accessActivity}
                   margin={{ top: 12, right: 12, left: -15, bottom: 5 }}
                  >

                 <CartesianGrid
                   stroke="#e8eef7"
                    strokeDasharray="4 4"
                   vertical={false}
                  />

                 <XAxis
                   dataKey="date"
                   tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-IN", {
                        day: "2-digit",
                       month: "short",
                     })
                    }
                   axisLine={false}
                   tickLine={false}
                   tick={{ fill: "#94a3b8", fontSize: 11 }}
                   tickMargin={12}
                   minTickGap={20}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    width={35}
                  />

                 <Tooltip
                    labelFormatter={(value) =>
                     new Date(value).toLocaleDateString("en-IN", {
                       day: "numeric",
                       month: "long",
                        year: "numeric",
                      })
                    }
                   formatter={(value) => [`${value} grants`, "Access Activity"]}
                   contentStyle={{
                     background: "#ffffff",
                     border: "1px solid #e2e8f0",
                     borderRadius: "10px",
                     padding: "10px 14px",
                     boxShadow: "0 5px 18px rgba(15, 23, 42, 0.08)",
                     fontSize: "12px",
                    }}
                   cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }}
                  />

                 <Line
                   type="monotone"
                   dataKey="count"
                   name="Access Grants"
                   stroke="#2563eb"
                   strokeWidth={3}
                   dot={false}
                   activeDot={{
                     r: 6,
                     fill: "#2563eb",
                     stroke: "#ffffff",
                     strokeWidth: 3,
                    }}
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
              <h2><span className="chart-title-icon employees-icon">●</span>Employees by Role</h2>

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

            <div className="distribution-layout">
             <div className="distribution-chart">
               <ResponsiveContainer width="100%" height={210}>
                 <PieChart>
                   <Pie
                       data={roleDistribution}
                       dataKey="count"
                       nameKey="name"
                       cx="50%"
                       cy="50%"
                       innerRadius={48}
                       outerRadius={78}
                       paddingAngle={4}
                       stroke="#ffffff"
                       strokeWidth={3}
                      >
                     {roleDistribution.map((entry, index) => (
                       <Cell
                         key={`role-${index}`}
                         fill={["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"][index % 5]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} employees`, name]} />
                  </PieChart>
               </ResponsiveContainer>
              </div>

             <div className="distribution-details">
               {roleDistribution.map((entry, index) => {
                 const total = roleDistribution.reduce(
                 (sum, item) => sum + Number(item.count || 0), 0);
                 const percentage = total ? ((Number(entry.count || 0) / total) * 100).toFixed(1) : "0.0";
                 const color = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"][index % 5];

                 return (
                   <div className="distribution-detail" key={`role-detail-${index}`}>
                     <span className="distribution-name">
                       <span className="distribution-dot" style={{ background: color }} />
                        <span title={entry.name}>{entry.name}</span>
                      </span>
                      <strong>{entry.count}</strong>
                      <span className="distribution-percentage">{percentage}%</span>
                   </div>
                 );
                })}
             </div>
            </div>

          )}

        </div>


        {/* Recent Activity */}

        <div className="dashboard-card">

          <div className="card-header">

            <div>
              <h2><span className="chart-title-icon recent-icon">◷</span>Recent Activity</h2>

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

              {paginatedRecentActivity.map((activity) => (

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

                    <p className="activity-user">
                      {activity.user_name || "System"}
                    </p>

                    <span className="activity-time">
                      {activity.created_at
                        ? new Date(activity.created_at).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Time unavailable"}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

          {recentActivity.length > activitiesPerPage && (
            <div className="activity-pagination">
              <span>
                Page {activityPage} of {totalActivityPages}
              </span>

              <div className="activity-pagination-buttons">
                <button
                  type="button"
                  onClick={() => setActivityPage((page) => Math.max(1, page - 1))}
                  disabled={activityPage === 1}
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => setActivityPage((page) => Math.min(totalActivityPages, page + 1))}
                  disabled={activityPage === totalActivityPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}


export default Dashboard;