import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import { jwtDecode } from "jwt-decode";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";

export default function Profile() {
  const [name, setName] = useState(null);
  const [email, setEmail] = useState(null);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const decodedEmail = jwtDecode(token).email;
    setEmail(jwtDecode(token).email);
    setName(jwtDecode(token).email.split("@")[0]);
    fetchSolvedProblems(decodedEmail);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);
  const token = localStorage.getItem("token");

  async function fetchSolvedProblems(email) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userSolvedProblems = userDoc.data().solvedProblems || [];
      const problemNames = userSolvedProblems.map((problem) => {
        return problem.name;
      });
      setSolvedProblems(problemNames);
      console.log(userDoc.data());
    } else {
      console.log("No user document found for:", email);
    }
  }

  return (
    <div>
      <NavBar />
      <div className="mt-20 p-8 flex flex-col items-center justify-center">
        <h1 className="text-5xl text-center p-8 font-bold">Profile</h1>
        <div className="flex flex-col w-1/3 items-start justify-center p-8 rounded-lg">
          <h2 className="text-3xl text-center p-4 font-bold">Email</h2>
          <p className="text-xl text-center p-4">{email}</p>
        </div>
        <div className="flex flex-col w-1/3 items-start justify-center p-8 rounded-lg">
          <h2 className="text-3xl text-center p-4 font-bold">
            Solved Problems
          </h2>
          <ul className="text-xl text-center p-4">
            {solvedProblems.length > 0 ? (
              solvedProblems.map((problem, index) => (
                <li key={index}>{problem}</li>
              ))
            ) : (
              <p>No problems solved yet.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
