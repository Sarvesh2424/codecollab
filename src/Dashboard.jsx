import NavBar from "./NavBar";
import { useEffect, useState } from "react";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function Dashboard() {
  const [problems, setProblems] = useState([]);
  const [email, setEmail] = useState(null);
  const [name, setName] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchProblems = async () => {
      const querySnapshot = await getDocs(collection(db, "codingProblems"));
      setProblems(
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };

    fetchProblems();
  }, []);

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
      <h1 className="mt-20 px-8 pt-8 text-4xl font-medium">Welcome, {name}!</h1>
      <h2 className="px-8 text-xl">Ready to collab and code some problems?</h2>
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Problems</h1>
        {problems.length === 0 ? (
          <p className="text-center py-20">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="mt-5 w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-black text-white">
                  <th className="px-4 py-2 font-normal text-left">Title</th>
                  <th className="px-4 py-2 font-normal text-left">
                    Difficulty
                  </th>
                  <th className="px-4 py-2 font-normal text-left">Tags</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((problem) => (
                  <tr
                    key={problem.id}
                    className="hover:bg-gray-100 transition-colors"
                  >
                    <td className="border border-gray-300 px-4 py-2">
                      <Link
                        to={`/problem/${problem.id}`}
                        className="text-black hover:text-blue-500 transition-colors" 
                      >
                        {problem.title}
                      </Link>
                    </td>
                    <td
                      className={`border border-gray-300 px-4 py-2 text-sm ${
                        problem.difficulty === "Easy"
                          ? "text-green-500"
                          : problem.difficulty === "Medium"
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}
                    >
                      {problem.difficulty}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {problem.tags ? problem.tags.join(", ") : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
