import { useEffect, useState } from "react";
import { Editor } from "@monaco-editor/react";
import {
  CheckIcon,
  PlayIcon,
  SendHorizontalIcon,
  XIcon,
  AlertTriangleIcon,
  FileCodeIcon,
} from "lucide-react";
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
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

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
            const response = await axios.post(
              "https://jdoodle-backend.onrender.com/execute",
              {
                script: code,
                language: "python3",
                input: testCase.input
                  .replace(/],?\s?(\d+)$/, "]\n$1")
                  .replace(/\\n/g, "\n"),
              }
            );

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
    <div className="flex flex-col w-full items-center space-y-4">
      <div className="flex gap-3">
        <button
          disabled={loading}
          className={`px-4 py-2 flex items-center gap-2 ${
            loading ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
          } text-white rounded-lg transition-colors hover:cursor-pointer shadow-md`}
          onClick={handleRun}
        >
          <PlayIcon className="w-5 h-5" />
          {loading ? "Running..." : "Run Code"}
        </button>
        <button
          disabled={loading || !allPassed}
          className={`px-4 py-2 flex items-center gap-2 ${
            loading || !allPassed
              ? "bg-gray-500"
              : "bg-green-600 hover:bg-green-700"
          } text-white rounded-lg transition-colors hover:cursor-pointer shadow-md`}
          onClick={handleSubmit}
        >
          <SendHorizontalIcon className="w-5 h-5" />
          Submit
        </button>
      </div>

      <div className="w-full rounded-lg overflow-hidden border border-gray-700 shadow-lg">
        <Editor
          height="400px"
          theme="vs-dark"
          language="python"
          value={code}
          onChange={(newValue) => setCode(newValue)}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            scrollBeyondLastLine: false,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: true,
            smoothScrolling: true,
            padding: { top: 10 },
          }}
        />
      </div>

      <div className="w-full p-5 bg-gray-800 text-white rounded-lg shadow-md border border-gray-700">
        <h3 className="text-lg font-medium flex items-center gap-2 mb-4 border-b border-gray-700 pb-2">
          <span className="bg-blue-600 p-1 rounded">
            <AlertTriangleIcon className="w-4 h-4" />
          </span>
          Output
        </h3>
        <div className="mb-4">
          <pre className="bg-gray-900 p-3 rounded text-gray-300 text-sm font-mono overflow-x-auto">
            {output || "Run your code to see output..."}
          </pre>
        </div>
        {testResults.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium mb-4 border-b border-gray-700 pb-2">
              Test Results
            </h4>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.passed
                      ? "bg-green-900/30 border-green-700"
                      : "bg-red-900/30 border-red-700"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium text-lg">
                      Test Case {index + 1}
                    </div>
                    <div
                      className={`flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${
                        result.passed
                          ? "bg-green-800 text-green-200"
                          : "bg-red-800 text-red-200"
                      }`}
                    >
                      {result.passed ? (
                        <>
                          <CheckIcon className="w-4 h-4" /> Passed
                        </>
                      ) : (
                        <>
                          <XIcon className="w-4 h-4" /> Failed
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="bg-gray-900 p-2 rounded">
                      <span className="text-gray-400 font-medium">Input:</span>
                      <pre className="mt-1 text-gray-300 overflow-x-auto">
                        {result.input.replace("\\n", ", ")}
                      </pre>
                    </div>
                    <div className="bg-gray-900 p-2 rounded">
                      <span className="text-gray-400 font-medium">
                        Expected Output:
                      </span>
                      <pre className="mt-1 text-gray-300 overflow-x-auto">
                        {result.expectedOutput}
                      </pre>
                    </div>
                    <div className="bg-gray-900 p-2 rounded">
                      <span className="text-gray-400 font-medium">
                        Actual Output:
                      </span>
                      <pre className="mt-1 text-gray-300 overflow-x-auto">
                        {result.actualOutput}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {allPassed && (
              <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <CheckIcon className="w-5 h-5" />
                  <span className="font-medium">
                    All test cases passed! Ready to submit.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
