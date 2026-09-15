import { useNavigate } from "react-router-dom";


function Navbar() {

  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("accesshub_user")
  );


  function handleLogout() {

    localStorage.removeItem(
      "accesshub_token"
    );

    localStorage.removeItem(
      "accesshub_user"
    );

    navigate("/login");
  }


  return (
    <header className="navbar">

      <div className="navbar-title">
        Access Management
      </div>


      <div className="navbar-right">

        <span className="user-name">
          {user?.name || "User"}
        </span>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </header>
  );
}


export default Navbar;