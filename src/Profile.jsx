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
        return [problem.id, problem.title, problem.date];
      });
      setSolvedProblems(problemNames);
      console.log(userDoc.data());
    } else {
      console.log("No user document found for:", email);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white">
      <NavBar />
      <div className="mt-20 p-8 flex flex-col items-center justify-center space-y-10">
        <h1 className="text-5xl text-center font-extrabold text-gray-900 drop-shadow-md">
          Profile
        </h1>
        <div className="flex flex-col w-full max-w-md items-start justify-center p-8 rounded-xl bg-white shadow-xl">
          <h2 className="text-3xl text-center p-4 font-bold text-gray-900 border-b border-blue-300 w-full">
            Email
          </h2>
          <p className="text-xl text-center p-4 text-gray-700">{email}</p>
        </div>
        <div className="flex flex-col w-full max-w-md items-start justify-center p-8 rounded-xl bg-white shadow-xl">
          <h2 className="text-3xl text-center p-4 font-bold text-gray-900 border-b border-blue-300 w-full">
            Solved Problems
          </h2>
          <ul className="text-xl text-gray-700 p-4 w-full space-y-3">
            {solvedProblems.length > 0 ? (
              solvedProblems.map((problem, index) => (
                <div
                  className="flex justify-between items-center border-b border-gray-200 pb-2"
                  key={index}
                >
                  <li className="font-medium">{problem[1]}</li>
                  <li className="text-sm text-gray-500">{problem[2]}</li>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No problems solved yet.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
