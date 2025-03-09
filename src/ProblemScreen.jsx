import { useNavigate, useParams } from "react-router-dom";
import CodeEditor from "./CodeEditor";
import NavBar from "./NavBar";
import { useEffect, useState } from "react";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { jwtDecode } from "jwt-decode";

export default function ProblemScreen() {
  const [problem, setProblem] = useState(null);
  const [email, setEmail] = useState(null);
  const [name, setName] = useState(null);
  const { id } = useParams();
  const db = getFirestore();
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProblem = async () => {
      const docRef = doc(db, "codingProblems", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProblem(docSnap.data());
      }
    };

    fetchProblem();
  }, [id]);

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
      {problem === null ? (
        <p className="mt-20 text-center py-20">Loading...</p>
      ) : (
        <div className="mt-20 p-8 flex justify-between">
          <div>
            <h1 className="text-4xl font-semibold">{problem.title}</h1>
            <p className="mt-8 text-xl">{problem.description}</p>
            <div className="mt-8 flex items-center gap-2">
              Difficulty:{" "}
              <p
                className={`${
                  problem.difficulty === "Easy"
                    ? "text-green-500"
                    : problem.difficulty === "Medium"
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
              >
                {problem.difficulty}
              </p>
            </div>
            <p className="mt-8 ">Tags: {problem.tags.join(", ")}</p>
            <div>
              <h2 className="mt-8 text-2xl font-medium">Test cases:</h2>
              <ul className="mt-4">
                {problem.testCases.map((testCase, index) => (
                  <li key={index} className="mb-2">
                    <p>
                      Input:{" "}
                      <span className="font-medium">{testCase.input}</span>
                    </p>
                    <p>
                      Output:{" "}
                      <span className="font-medium">{testCase.expectedOutput}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <CodeEditor />
        </div>
      )}
    </div>
  );
}
