import { GoogleLogin } from "@react-oauth/google";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "./firebaseAuth";

export default function Login({ setUser }) {
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

  const handleLogin = async (e) => {
    try {
      e.preventDefault();
      const token = await loginUser(email, password);
      localStorage.setItem("token", token);
      setUser(email);
      navigate("/");
    } catch (error) {
      setMessage("Invalid email or password.");
    }
  };

  return (
    <div className="w-full bg-gray-950 flex justify-center items-center h-screen">
      <div className="w-96 mx-auto p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-black text-center mb-6 text-4xl font-bold">
          Login
        </h1>
        <form onSubmit={handleLogin}>
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
          <button className="w-full p-2 bg-blue-500 text-white rounded-lg hover:cursor-pointer hover:bg-blue-600 transition-colors duration-200 mb-4">
            Login
          </button>
          {message && (
            <p className="text-red-500 text-center text-sm mb-2">{message}</p>
          )}
        </form>
        <h3 className="text-center text-gray-700 mb-4">OR</h3>
        <div className="flex justify-center">
          <GoogleLogin clientId="202469683498-0hf0bgijnv67do9hvj7idh6aijkdgg9b.apps.googleusercontent.com">
            Login with Google
          </GoogleLogin>
        </div>
        <div className="flex justify-center mt-3">
          <div className="flex text-center gap-1 text-sm">
            New user? Click here to{" "}
            <Link to="/register">
              <p className="text-blue-500 text-sm">Register</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
