import { useState } from "react";
import { Editor } from "@monaco-editor/react";
import { PlayIcon, SendHorizonalIcon } from "lucide-react";
import axios from "axios";

export default function CodeEditor() {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const languageMap = {
    cpp: "cpp17",
    java: "java",
    python: "python3",
  };

  const handleRun = async () => {
    setLoading(true);
    setOutput("Running...");

    try {
      const response = await axios.post("http://localhost:5000/execute", {
        script: code,
        language: languageMap[language],
      });

      setOutput(response.data.output || "No Output");
    } catch (error) {
      console.error("Compilation Error:", error);
      setOutput("Error occurred while running the code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-1/2 items-center">
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
          <div
            className="px-4 py-2 flex items-center gap-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors hover:cursor-pointer"
            onClick={handleRun}
          >
            <PlayIcon className="w-5 h-5" />
            <button>Run</button>
          </div>
          <div className="px-4 py-2 flex items-center gap-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors hover:cursor-pointer">
            <SendHorizonalIcon className="w-5 h-5" />
            <button>Submit</button>
          </div>
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
      <div className="w-full mt-4 p-4 bg-gray-300 text-black rounded-xl">
        <h3 className="text-lg font-medium">Output:</h3>
        <pre className="mt-2">{output}</pre>
      </div>
    </div>
  );
}
