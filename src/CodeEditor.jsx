import { useEffect, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { CheckIcon, PlayIcon, SendHorizonalIcon, XIcon } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { jwtDecode } from "jwt-decode";
import {
  arrayUnion,
  collection,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export default function CodeEditor({
  testCases,
  id,
  title,
  isSolved,
  setIsSolved,
}) {
  const navigate = useNavigate();
  const auth = getAuth();
  const [email, setEmail] = useState(null);
  const [name, setName] = useState(null);
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

  const languageMap = {
    cpp: "cpp17",
    java: "java",
    python: "python3",
  };

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

  const handleRun = async () => {
    setLoading(true);
    setOutput("Running test cases...");
    setTestResults([]);

    try {
      const results = await Promise.all(
        testCases.map(async (testCase) => {
          try {
            console.log(
              "Sending input to backend:",
              JSON.stringify(testCase.input)
            );
            const response = await axios.post("https://jdoodle-backend.onrender.com/execute", {
              script: code,
              language: languageMap[language],
              input: testCase.input
                .replace(/],?\s?(\d+)$/, "]\n$1")
                .replace(/\\n/g, "\n"),
            });

            const passed =
              response.data.output.trim() === testCase.expectedOutput.trim();
            return {
              input: testCase.input,
              expectedOutput: testCase.expectedOutput,
              actualOutput: response.data.output,
              passed,
            };
          } catch (error) {
            console.error("Test case execution error:", error);
            return {
              input: testCase.input,
              expectedOutput: testCase.expectedOutput,
              actualOutput: "Error occurred while running the test case.",
              passed: false,
            };
          }
        })
      );

      setTestResults(results);
      setOutput("Test cases completed.");
      setAllPassed(results.every((result) => result.passed));
    } catch (error) {
      console.error("Compilation Error:", error);
      setOutput("Error occurred while running the code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setOutput("Submitting your solution...");
    if (!allPassed) {
      setOutput("Please pass all test cases before submitting.");
      setLoading(false);
      return;
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userSolvedProblems = userDoc.data().solvedProblems || [];
      const newProblem = {
        id: id,
        title: title,
        date: new Date().toLocaleDateString(),
      };
      const problemExists = userSolvedProblems.some(
        (problem) => problem.id === id
      );
      if (problemExists) {
        setOutput("You have already solved this problem.");
        setLoading(false);
        return;
      }
      setOutput("Problem solved successfully!");
      setIsSolved(true);
      setLoading(false);
      userSolvedProblems.push(newProblem);
      await updateDoc(userDoc.ref, {
        solvedProblems: arrayUnion(newProblem),
      });
    } else {
      console.log("No user document found for:", email);
    }
  };

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex w-full justify-between items-center mb-2 px-4">
        <select
          className="p-2 bg-gray-300 text-black rounded-lg hover:cursor-pointer"
          onChange={(e) => setLanguage(e.target.value)}
          value={language}
        >
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
        </select>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 flex items-center gap-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors hover:cursor-pointer"
            onClick={handleRun}
          >
            <PlayIcon className="w-5 h-5" />
            Run
          </button>
          <button
            className="px-4 py-2 flex items-center gap-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors hover:cursor-pointer"
            onClick={handleSubmit}
          >
            <SendHorizonalIcon className="w-5 h-5" />
            Submit
          </button>
        </div>
      </div>
      <Editor
        className="bg-black p-2 border border-solid rounded-xl w-full"
        height="400px"
        theme="vs-dark"
        language={language}
        value={code}
        onChange={(newValue) => setCode(newValue)}
      />
      <div className="w-full mt-4 p-4 bg-gray-200 text-black rounded-xl">
        <h3 className="text-lg font-medium">Output:</h3>
        <pre className="mt-2">{output}</pre>
        {testResults.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-medium">Test Results:</h4>
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`my-5 p-2 rounded-lg ${
                  result.passed ? "bg-green-200" : "bg-red-200"
                }`}
              >
                <div className="font-medium">
                  Test Case {index + 1}:{" "}
                  {result.passed ? (<div className="flex items-center text-green-500"><CheckIcon /> Passed</div>) : (<div className="flex items-center text-red-500"><XIcon /> Failed</div>)}
                </div>
                <div className="mt-1">
                  <div>
                    <span className="font-medium">Input:</span> {result.input}
                  </div>
                  <div>
                    <span className="font-medium">Expected Output:</span>{" "}
                    {result.expectedOutput}
                  </div>
                  <div>
                    <span className="font-medium">Actual Output:</span>{" "}
                    {result.actualOutput}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
