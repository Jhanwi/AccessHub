import { useEffect, useState } from "react";
import api from "../api";

function Applications() {
  const [applications, setApplications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      setLoading(true);

      const response =
        await api.get("/applications");

      setApplications(
        response.data.data || []
      );

      setError("");
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to load applications"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Applications</h1>

          <p>
            Manage applications available
            to your organization.
          </p>
        </div>
      </div>

      {loading && (
        <p>Loading applications...</p>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        applications.length === 0 && (
          <div className="empty-state">
            No applications found.
          </div>
        )}

      <div className="roles-grid">
        {applications.map(
          (application) => (
            <div
              className="role-card"
              key={application.id}
            >
              <h3>
                {application.name}
              </h3>

              <p>
                {application.description ||
                  "No description available"}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default Applications;