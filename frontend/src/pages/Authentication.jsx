import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Authentication() {
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      if (isLogin) {
        const response = await api.post("/auth/login", {
          email: formData.email,
          password: formData.password,
        });

        localStorage.setItem(
          "accesshub_token",
          response.data.token
        );

        localStorage.setItem(
          "accesshub_user",
          JSON.stringify(response.data.user)
        );

        navigate("/dashboard");
      } else {
        const response = await api.post("/auth/register", formData);

        localStorage.setItem(
          "accesshub_token",
          response.data.token
        );

        localStorage.setItem(
          "accesshub_user",
          JSON.stringify(response.data.user)
        );

        navigate("/dashboard");
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <h1>AccessHub</h1>

        <p>
          Startup Access & Permission Management
        </p>

        <h2>
          {isLogin ? "Welcome back" : "Create your account"}
        </h2>

        <form onSubmit={handleSubmit}>

          {!isLogin && (
            <>
              <label>Name</label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
              />

              <label>Organization</label>

              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                placeholder="Enter organization name"
              />
            </>
          )}

          <label>Email</label>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
          />

          {message && (
            <p className="auth-message">
              {message}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isLogin
                ? "Login"
                : "Create account"}
          </button>

        </form>

        <button
          type="button"
          className="switch-auth"
          onClick={() => {
            setIsLogin(!isLogin);
            setMessage("");
          }}
        >
          {isLogin
            ? "Create a new account"
            : "Already have an account? Login"}
        </button>

      </div>
    </div>
  );
}

export default Authentication;