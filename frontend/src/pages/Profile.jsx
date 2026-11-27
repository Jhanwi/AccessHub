
import { useEffect, useState } from "react";
import api from "../api";
import "./Profile.css";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const activitiesPerPage = 5;

  const totalActivityPages = Math.ceil(
   activities.length / activitiesPerPage
  );

 const paginatedActivities = activities.slice(
   (activityPage - 1) * activitiesPerPage,
   activityPage * activitiesPerPage
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [editing, setEditing] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    try {
      setLoading(true);
      const response = await api.get("/profile");

      const data = response.data;

      setProfile(data.profile);
      setApplications(data.applications || []);
      setPermissions(data.permissions || []);
      setActivities(data.activities || []);

      setName(data.profile.name || "");
      setPhone(data.profile.phone || "");
      setProfilePicture(data.profile.profile_picture || "");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load profile"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function handlePictureChange(e) {
   const file = e.target.files?.[0];

   if (!file) return;

   const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

   if (!allowedTypes.includes(file.type)) {
     setError("Please select a PNG, JPG, or WEBP image.");
     return;
    }

   if (file.size > 2 * 1024 * 1024) {
     setError("Image size must be under 2 MB.");
     return;
    }

   const reader = new FileReader();

   reader.onload = () => {
     setProfilePicture(reader.result);
     setError("");
     setMessage("Profile picture selected. Save Changes to upload it.");
    };

   reader.onerror = () => {
     setError("Unable to read the selected image.");
   };

   reader.readAsDataURL(file);
  }

  async function handleProfileUpdate(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await api.patch("/profile", {
        name,
        phone,
        profilePicture,
      });

      setProfile((prev) => ({
        ...prev,
        ...response.data.profile,
      }));

      setEditing(false);
      setMessage("Profile updated successfully");
      loadProfile();
    } catch (err) {
      setError(
        err.response?.data?.message || "Profile update failed"
      );
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters");
      return;
    }

    try {
      const response = await api.patch("/profile/password", {
        currentPassword,
        newPassword,
      });

      setMessage(response.data.message);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Password change failed"
      );
    }
  }

  if (loading) {
    return <div className="profile-page">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <p className="profile-error">
          {error || "Profile information unavailable"}
        </p>
      </div>
    );
  }

  const initials = (profile.name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="profile-page">
      <div className="profile-heading">
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal information and account security.</p>
        </div>

        <button
          className="profile-refresh"
          onClick={loadProfile}
          type="button"
        >
          ↻ Refresh
        </button>
      </div>

      {message && <div className="profile-success">{message}</div>}
      {error && <div className="profile-error">{error}</div>}

      <section className="profile-hero">
        <div className="profile-avatar-wrapper">
         <div className="profile-avatar">
           {profilePicture ? (
             <img src={profilePicture} alt="Profile" />
             ) : (
             initials
           )}
          </div>

          <label className="profile-picture-upload">
          Change Photo
          <input
           type="file"
           accept="image/png,image/jpeg,image/webp"
           onChange={handlePictureChange}
           hidden
          />
        </label>
      </div>

        <div className="profile-hero-info">
          <h2>{profile.name}</h2>
          <p>{profile.email}</p>
          <p className="profile-employee-id">
           Employee ID: EMP-{String(profile.id).padStart(4, "0")}
          </p>
          <div className="profile-tags">
            {(profile.roles || []).map((role) => (
              <span key={role}>{role}</span>
            ))}
            <span className="profile-status">{profile.status}</span>
          </div>
        </div>
      </section>

      <div className="profile-grid">
        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Personal Information</h2>
              <p>Your account details</p>
            </div>

            {!editing && (
              <button
                className="profile-edit-button"
                onClick={() => setEditing(true)}
                type="button"
              >
                Edit Details
              </button>
            )}
          </div>

          <form onSubmit={handleProfileUpdate}>
            <div className="profile-fields">
              <label>
                Full Name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!editing}
                  required
                />
              </label>

              <label>
                Email Address
                <input value={profile.email} disabled />
              </label>

              <label>
                Contact Number
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!editing}
                  placeholder="Add your contact number"
                  maxLength={20}
                />
              </label>

              <label>
                Organisation
                <input
                  value={profile.organization_name || ""}
                  disabled
                />
              </label>

              <label>
                Account Status
                <input value={profile.status || ""} disabled />
              </label>

              <label>
                Member Since
                <input
                  value={
                    profile.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : "—"
                  }
                  disabled
                />
              </label>
            </div>

            {editing && (
              <div className="profile-form-actions">
                <button className="profile-save" type="submit">
                  Save Changes
                </button>
                <button
                  className="profile-cancel"
                  type="button"
                  onClick={() => {
                    setName(profile.name || "");
                    setPhone(profile.phone || "");
                    setEditing(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </section>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Application Access</h2>
              <p>Applications assigned to your account</p>
            </div>
            <span className="profile-count">{applications.length}</span>
          </div>

          {applications.length === 0 ? (
            <p className="profile-empty">No application access found.</p>
          ) : (
            <div className="profile-list">
              {applications.map((app) => (
                <div className="profile-list-item" key={app.id}>
                  <div>
                    <strong>{app.name}</strong>
                    <small>
                      Granted:{" "}
                      {app.granted_at
                        ? new Date(app.granted_at).toLocaleDateString()
                        : "—"}
                    </small>
                  </div>
                  <span
                    className={
                      app.status === "active"
                        ? "profile-status"
                        : "profile-revoked"
                    }
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Available Permissions</h2>
              <p>Permissions assigned through your roles</p>
            </div>
            <span className="profile-count">{permissions.length}</span>
          </div>

          {permissions.length === 0 ? (
            <p className="profile-empty">No permissions assigned.</p>
          ) : (
            <div className="profile-permissions">
              {permissions.map((permission) => (
                <div key={permission.id}>
                  <strong>{permission.name}</strong>
                  <small>
                    {permission.description || "Account permission"}
                  </small>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div>
              <h2>Change Password</h2>
              <p>Keep your account secure</p>
            </div>
          </div>

          <form
            className="profile-password-form"
            onSubmit={handlePasswordChange}
          >
            <label className="profile-password-field">
              Current Password
             <div className="profile-password-input">
               <input
                 type={showCurrentPassword ? "text" : "password"}
                 value={currentPassword}
                 onChange={(e) => setCurrentPassword(e.target.value)}
                 required
               />
               <button
                   type="button"
                   onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                 {showCurrentPassword ? "Hide" : "Show"}
                </button>
             </div>
           </label>

           <label className="profile-password-field">
             New Password
             <div className="profile-password-input">
               <input
                 type={showNewPassword ? "text" : "password"}
                 value={newPassword}
                 onChange={(e) => setNewPassword(e.target.value)}
                 minLength={8}
                 required
               />
               <button
                   type="button"
                   onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                 {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
           </label>
           <label className="profile-password-field">
              Confirm New Password
              <div className="profile-password-input">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button className="profile-save" type="submit">
              Update Password
            </button>
          </form>
        </section>

        <section className="profile-card profile-activity-card">
          <div className="profile-card-heading">
            <div>
              <h2>Recent Account Activity</h2>
              <p>Your latest account events</p>
            </div>
          </div>

          {activities.length === 0 ? (
            <p className="profile-empty">No recent activity found.</p>
          ) : (
            <div className="profile-list">
              {paginatedActivities.map((activity) => (
                <div className="profile-list-item" key={activity.id}>
                  <div>
                    <strong>{activity.action.replaceAll("_", " ")}</strong>
                    <small>
                      {activity.entity_type || "Account"} ·{" "}
                      {activity.created_at
                        ? new Date(activity.created_at).toLocaleString()
                        : ""}
                    </small>
                  </div>
                  <span className="profile-activity-dot">●</span>
                </div>
              ))}
            </div>
          )}
          {totalActivityPages > 1 && (
           <div className="profile-pagination">
              <button
                 type="button"
                 onClick={() => setActivityPage((page) => Math.max(1, page - 1))}
                 disabled={activityPage === 1}
                >
               Previous
              </button>

             <span>
               Page {activityPage} of {totalActivityPages}
             </span>

             <button
                 type="button"
                 onClick={() =>
                   setActivityPage((page) =>
                     Math.min(totalActivityPages, page + 1)
                    )
                  }
                 disabled={activityPage === totalActivityPages}
                >
               Next
             </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Profile;
