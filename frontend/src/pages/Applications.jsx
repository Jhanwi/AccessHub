import { useEffect, useState } from "react";
import api from "../api";
import "./Applications.css";

function Applications() {
  const [applications, setApplications] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/applications");
      setApplications(response.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load applications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleCreateApplication = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Application name is required.");
      setSuccess("");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await api.post("/applications", {
        name: name.trim(),
        description: description.trim() || null,
      });

      setName("");
      setDescription("");
      setSuccess("Application created successfully.");

      await loadApplications();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="applications-page">
      <div className="page-header">
        <h1>Applications</h1>
        <p>Manage applications available in your organization.</p>
      </div>

      <div className="create-card">
        <h2 className="section-title">Add Application</h2>

        <form onSubmit={handleCreateApplication}>
          <div className="form-group">
            <label>Application Name</label>
            <input
              type="text"
              placeholder="e.g. Figma"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="e.g. UI design and collaboration"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create Application"}
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="list-section">
        <h2 className="section-title">Available Applications</h2>

        {loading ? (
          <p>Loading applications...</p>
        ) : applications.length === 0 ? (
          <p className="empty-state">No applications found.</p>
        ) : (
          <div className="application-grid">
            {applications.map((application) => (
              <div key={application.id} className="application-card">
                <h3>{application.name}</h3>

                <p className="application-description">
                  {application.description || "No description provided."}
                </p>

                <span className="application-id">
                  Application ID: {application.id}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Applications;