import NavBar from "./NavBar";
import CodeEditor from "./CodeEditor";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { jwtDecode } from "jwt-decode";

export default function Dashboard() {
  const [email, setEmail] = useState(null);
  const [name, setName] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setEmail(jwtDecode(token).email);
    setName(jwtDecode(token).email.split("@")[0]);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  return (
    <div>
      <NavBar />
      <h1 className="p-8 text-4xl font-medium">Welcome, {name}!</h1>
      <Link to={`/problem/${"hello"}`}>hi</Link>
    </div>
  );
}
