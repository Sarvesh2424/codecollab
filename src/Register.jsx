import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginWithGoogle, registerUser } from "./firebaseAuth";
import { FaGoogle } from "react-icons/fa";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function Register({ setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    try {
      const token = await registerUser(email, password);
      localStorage.setItem("token", token.accessToken);
      await setDoc(doc(db, "users", token.uid), {
        email: token.email,
        createdAt: new Date(),
      });
      navigate("/");
    } catch (error) {
      console.log(error);
      setMessage("Invalid email or password");
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const token = await loginWithGoogle();
      localStorage.setItem("token", token.accessToken);
      await setDoc(doc(db, "users", token.uid), {
        email: token.email,
        createdAt: new Date(),
      });
      navigate("/");
    } catch (error) {
      setMessage("Error registering with Google.");
    }
  };

  return (
    <div className="w-full bg-gray-950 flex justify-center items-center h-screen">
      <div className="w-1/2">
        <h1 className="text-white text-7xl flex gap-2 justify-center tracking-tight font-bold text-center mb-4">
          Welcome to <div className="text-blue-500">Codab</div>
        </h1>
        <p className="text-white text-center">
          where coding and collaboration meet to create MAGIC.
        </p>
      </div>
      <div className="w-96 mx-auto p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-black text-center mb-6 text-4xl font-bold">
          Register
        </h1>
        <form onSubmit={handleRegister}>
          <label className="block text-gray-700 mb-2">Email:</label>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="block text-gray-700 mb-2">Password:</label>
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label className="block text-gray-700 mb-2">Confirm Password:</label>
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button className="w-full p-2 bg-blue-500 text-white rounded-lg hover:cursor-pointer hover:bg-blue-600 transition duration-200 mb-4">
            Register
          </button>
          {message && (
            <p className="text-red-500 text-center text-sm mb-2">{message}</p>
          )}
        </form>
        <h3 className="text-center text-gray-700 mb-4">OR</h3>
        <div className="flex justify-center">
          <button
            onClick={handleGoogleRegister}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:cursor-pointer hover:bg-red-600 transition-colors"
          >
            <FaGoogle /> Continue with Google
          </button>
        </div>
        <div className="flex justify-center mt-3">
          <div className="flex text-center gap-1 text-sm">
            Have an account? Click here to
            <Link to="/login">
              <p className="text-blue-500 text-sm">Login</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
