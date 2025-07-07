import { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import "./AuthForm.css"; // ✅ import the CSS file
import { useNavigate } from "react-router-dom";

function AuthForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const DOMAIN = "@yourapp.com";
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const email = `${username}${DOMAIN}`;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      navigate("/scheduler");
    } catch (err) {
        if (isLogin) {
          switch (err.code) {
              case "auth/user-not-found":
                setError("Account not found. Please sign up first.");
                break;
              case "auth/wrong-password":
                setError("Incorrect password. Please try again.");
                break;
              case "auth/invalid-email":
                setError("Invalid username format.");
                break;
              case "auth/invalid-credential":
                setError("Incorrect username or password."); // ✅ NEW: more generic message
                break;
              default:
                setError("Login failed: " + err.message);
          }
        } else {
          switch (err.code) {
            case "auth/email-already-in-use":
              setError("This username is already taken.");
              break;
            case "auth/weak-password":
              setError("Password should be at least 6 characters.");
              break;
            case "auth/invalid-email":
              setError("Invalid username format.");
              break;
            default:
              setError("Sign up failed: " + err.message);
          }
        }
      }
    };

  return (
    <div className="auth-wrapper">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{isLogin ? "Login" : "Sign Up"}</h2>

        <input
          type="text"
          placeholder="Username"
          className="auth-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="auth-button">
          {isLogin ? "Login" : "Sign Up"}
        </button>

        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="auth-button"
        >
          Switch to {isLogin ? "Sign Up" : "Login"}
        </button>

        {error && <p className="auth-error">{error}</p>}
      </form>
    </div>
  );
}

export default AuthForm;
