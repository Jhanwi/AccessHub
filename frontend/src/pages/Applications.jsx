import { useEffect, useState } from "react";
import api from "../api";

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
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Applications</h1>
          <p style={styles.subtitle}>
            Manage applications available in your organization.
          </p>
        </div>
      </div>

      <div style={styles.createCard}>
        <h2 style={styles.sectionTitle}>Add Application</h2>

        <form onSubmit={handleCreateApplication}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Application Name</label>
            <input
              type="text"
              placeholder="e.g. Figma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              placeholder="e.g. UI design and collaboration"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              style={styles.textarea}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={styles.button}
          >
            {submitting ? "Creating..." : "Create Application"}
          </button>
        </form>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.listSection}>
        <h2 style={styles.sectionTitle}>Available Applications</h2>

        {loading ? (
          <p>Loading applications...</p>
        ) : applications.length === 0 ? (
          <p style={styles.empty}>No applications found.</p>
        ) : (
          <div style={styles.grid}>
            {applications.map((application) => (
              <div key={application.id} style={styles.card}>
                <h3 style={styles.cardTitle}>{application.name}</h3>

                <p style={styles.cardDescription}>
                  {application.description || "No description provided."}
                </p>

                <span style={styles.id}>
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

const styles = {
  page: {
    padding: "24px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
  },

  subtitle: {
    marginTop: "6px",
    color: "#666",
  },

  createCard: {
    background: "#fff",
    padding: "24px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    marginBottom: "24px",
    maxWidth: "700px",
  },

  sectionTitle: {
    marginTop: 0,
    marginBottom: "18px",
    fontSize: "20px",
  },

  formGroup: {
    marginBottom: "16px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontWeight: "600",
  },

  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    boxSizing: "border-box",
    fontSize: "14px",
  },

  textarea: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    boxSizing: "border-box",
    fontSize: "14px",
    resize: "vertical",
  },

  button: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
  },

  error: {
    padding: "12px",
    marginBottom: "18px",
    borderRadius: "6px",
    background: "#ffe5e5",
  },

  success: {
    padding: "12px",
    marginBottom: "18px",
    borderRadius: "6px",
    background: "#e5f7e9",
  },

  listSection: {
    marginTop: "24px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "16px",
  },

  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #ddd",
  },

  cardTitle: {
    marginTop: 0,
    marginBottom: "8px",
  },

  cardDescription: {
    color: "#666",
    minHeight: "40px",
  },

  id: {
    fontSize: "12px",
    color: "#888",
  },

  empty: {
    color: "#777",
  },
};

export default Applications;

