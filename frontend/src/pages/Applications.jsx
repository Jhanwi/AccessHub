import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./Applications.css";

const PAGE_SIZE = 6;

function Applications() {
  const [applications, setApplications] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

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

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) =>
      `${application.name || ""} ${application.description || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [applications, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredApplications.length / PAGE_SIZE)
  );

  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleCreateApplication = async (event) => {
    event.preventDefault();

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
      setShowForm(false);
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
      <div className="applications-banner">
        <div className="applications-banner-content">
          <span className="applications-banner-tag">
            APPLICATION DIRECTORY
          </span>
          <h1>Application Management</h1>
          <p>
            Organize your organization's tools and manage the applications
            your team uses every day.
          </p>
        </div>

        <div className="applications-banner-icon">▣</div>
      </div>

      <div className="application-stats">
        <div className="application-stat-card">
          <div className="application-stat-icon blue">▣</div>
          <div>
            <span>Total Applications</span>
            <strong>{applications.length}</strong>
          </div>
        </div>

        <div className="application-stat-card">
          <div className="application-stat-icon purple">⌕</div>
          <div>
            <span>Search Results</span>
            <strong>{filteredApplications.length}</strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="application-message error-message">
          <span>!</span>
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="application-message success-message">
          <span>✓</span>
          {success}
          <button onClick={() => setSuccess("")} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}

      <div className="applications-toolbar">
        <div className="application-search">
          <span>⌕</span>
          <input
            type="search"
            placeholder="Search applications by name or description..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <button
          className="application-add-button"
          onClick={() => {
            setError("");
            setSuccess("");
            setShowForm((previous) => !previous);
          }}
        >
          {showForm ? "× Close Form" : "+ Add Application"}
        </button>
      </div>

      {showForm && (
        <div className="application-create-card">
          <div className="application-create-heading">
            <div className="application-create-icon">+</div>
            <div>
              <h2>Add a New Application</h2>
              <p>Add a tool or service to your organization's directory.</p>
            </div>
          </div>

          <form onSubmit={handleCreateApplication}>
            <div className="application-form-grid">
              <div className="application-form-group">
                <label htmlFor="application-name">Application Name</label>
                <input
                  id="application-name"
                  type="text"
                  placeholder="e.g. Figma"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>

              <div className="application-form-group">
                <label htmlFor="application-description">
                  Description
                </label>
                <textarea
                  id="application-description"
                  placeholder="What is this application used for?"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="application-form-actions">
              <button
                type="button"
                className="application-cancel-button"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="application-add-button"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Application"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="application-list-heading">
        <div>
          <h2>Available Applications</h2>
          <p>Browse the applications registered in your organization.</p>
        </div>

        <span className="application-count">
          {filteredApplications.length}{" "}
          {filteredApplications.length === 1 ? "application" : "applications"}
        </span>
      </div>

      {loading ? (
        <div className="application-loading">
          <div className="application-loader" />
          <p>Loading applications...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="application-empty-state">
          <div className="application-empty-icon">▣</div>
          <h3>{search ? "No matching applications" : "No applications yet"}</h3>
          <p>
            {search
              ? "Try another search term."
              : "Add your first application to start organizing your team's tools."}
          </p>
          {!search && (
            <button
              className="application-add-button"
              onClick={() => setShowForm(true)}
            >
              + Add Application
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="application-grid">
            {paginatedApplications.map((application) => (
              <article key={application.id} className="application-card">
                <div className="application-card-top">
                  <div className="application-card-icon">
                    {(application.name || "A").trim().charAt(0).toUpperCase()}
                  </div>
                  <span className="application-status">
                    <span />
                    Registered
                  </span>
                </div>

                <h3>{application.name}</h3>

                <p className="application-description">
                  {application.description || "No description provided."}
                </p>

                <div className="application-card-footer">
                  <span>APPLICATION ID</span>
                  <strong>#{application.id}</strong>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="application-pagination">
              <span>
                Showing{" "}
                {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filteredApplications.length)}{" "}
                of {filteredApplications.length}
              </span>

              <div className="application-pagination-controls">
                <button
                  onClick={() => setCurrentPage((page) => page - 1)}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>

                <span>
                  Page <strong>{currentPage}</strong> of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((page) => page + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Applications;
