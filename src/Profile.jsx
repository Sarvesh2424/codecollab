import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import { jwtDecode } from "jwt-decode";

export default function Profile() {
  const [name, setName] = useState(null);
  const [email, setEmail] = useState(null);
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
  const token = localStorage.getItem("token");

  return (
    <div>
      <NavBar />
      <h1 className="text-4xl text-center p-8 font-medium">Profile</h1>
      <p>Email: {email}</p>
    </div>
  );
}
