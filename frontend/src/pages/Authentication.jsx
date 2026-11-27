
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./Authentication.css";

function Authentication() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [loginType, setLoginType] = useState("employee");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");

  const isAdminLogin = loginType === "admin";
  const isAdminRegistration = !isLogin && isAdminLogin;

  const checkAdminRole = (user) => {
    const roles = [
      user?.role,
      user?.userRole,
      user?.accountType,
    ];

    if (user?.isAdmin === true) {
      return true;
    }

    if (
      roles.some((role) =>
        ["admin", "administrator"].includes(
          String(role || "").toLowerCase()
        )
      )
    ) {
      return true;
    }

    if (Array.isArray(user?.roles)) {
      return user.roles.some((role) => {
        const roleName =
          typeof role === "string"
            ? role
            : role?.name || role?.role;

        return ["admin", "administrator"].includes(
          String(roleName || "").toLowerCase()
        );
      });
    }

    return false;
  };

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    setIsLogin(true);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (isLogin) {
        const response = await api.post("/auth/login", {
          email,
          password,
        });

        const { token, user } = response.data;

        const isAdmin = checkAdminRole(user);

        if (isAdminLogin && !isAdmin) {
          setMessage(
            "This account does not have administrator access."
 
          );
          return;
        }

        if (!isAdminLogin && isAdmin) {
          setMessage(
            "Administrator account detected. Please select Admin login."
 
          );
          return;
        }

        localStorage.setItem("accesshub_token", token);
        localStorage.setItem(
          "accesshub_user",
          JSON.stringify(user)
        );

        navigate(
          isAdmin ? "/admin/dashboard" : "/dashboard",
          { replace: true }
        );
      } else {
        if (password !== confirmPassword) {
          setMessage("Passwords do not match.");
          return;
        }

        const response = await api.post("/auth/register", {
          name,
          email,
          password,
          organizationName: organization,
        });

        const { token, user } = response.data;

        localStorage.setItem("accesshub_token", token);
        localStorage.setItem(
          "accesshub_user",
          JSON.stringify(user)
        );

        navigate("/admin/dashboard", { replace: true });
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Something went wrong. Please try again."
      );
    }
  };

  return (
    <div className="auth-container">
      {/* LEFT PANEL */}
      <section className="auth-info-panel">
        <div className="auth-brand">
          <div className="auth-brand-icon">✦</div>
          <span>AccessHub</span>
        </div>

        <div className="auth-left-content">
          <span className="auth-eyebrow">
            IDENTITY & ACCESS MANAGEMENT
          </span>

          <h1>
            Identity. Access.
            <br />
            <span>Made simple.</span>
          </h1>

          <p>
            Secure access. Greater productivity.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span className="auth-feature-icon">✓</span>
              <span>Centralized access management</span>
            </div>

            <div className="auth-feature">
              <span className="auth-feature-icon">✓</span>
              <span>Role-based permissions</span>
            </div>

            <div className="auth-feature">
              <span className="auth-feature-icon">✓</span>
              <span>Secure employee lifecycle</span>
            </div>
          </div>
        </div>

        <div className="auth-left-footer">
          Secure identity. Smarter access.
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className="auth-form-panel">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h2>{isLogin ? "Welcome back" : "Create account"}</h2>
            <p>
              {isLogin
                ? "Sign in to continue to AccessHub"
                : "Get started with your AccessHub account"}
            </p>
          </div>

          {/* EMPLOYEE / ADMIN SELECTOR */}
          <div className="login-type-selector">
            <button
              type="button"
              className={`login-type-btn ${
                loginType === "employee" ? "active" : ""
              }`}
              onClick={() => handleLoginTypeChange("employee")}
            >
              Employee
            </button>

            <button
              type="button"
              className={`login-type-btn ${
                loginType === "admin" ? "active" : ""
              }`}
              onClick={() => handleLoginTypeChange("admin")}
            >
              Admin
            </button>
          </div>

          

          {!isLogin && isAdminLogin && (
            <div className="auth-form-switch">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setMessage("");
                }}
              >
                Sign in
              </button>
            </div>
          )}

          {isAdminLogin && isLogin && (
            <div className="auth-admin-notice">
              <span>ⓘ</span>
              Admin access is restricted to authorized administrators.
            </div>
          )}

          {message && (
            <div className="auth-message">
              {message}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="auth-field">
                  <label htmlFor="auth-name">Full name</label>
                  <input
                    id="auth-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="auth-organization">
                    Organization
                  </label>
                  <input
                    id="auth-organization"
                    type="text"
                    placeholder="Enter organization name"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">Work email</label>
              <input
                id="auth-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>

              <div className="auth-password-wrapper">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    isLogin ? "current-password" : "new-password"
                  }
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="auth-field">
                <label htmlFor="auth-confirm-password">
                  Confirm password
                </label>

                <div className="auth-password-wrapper">
                  <input
                    id="auth-confirm-password"
                    type={
                      showConfirmPassword ? "text" : "password"
                    }
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            )}

            {isLogin && (
              <div className="auth-options">
                <label className="auth-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(e.target.checked)
                    }
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="auth-forgot"
                  onClick={() =>
                    setMessage(
                      "Password reset is not available yet."
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" className="auth-submit-btn">
              {isLogin
                ? isAdminLogin
                  ? "Sign in as Admin"
                  : "Sign In"
                : "Create Account"}
            </button>
          </form>

          {isAdminLogin && isLogin && (
            <div className="auth-create-account">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setMessage("");
                }}
              >
                Create account
              </button>
            </div>
          )}

          <div className="auth-security-footer">
            <span>🔒</span>
            Secure authentication · Protected access
          </div>
        </div>
      </section>
    </div>
  );
}

export default Authentication;
