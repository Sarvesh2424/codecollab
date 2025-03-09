import { useState } from "react";
import { Editor } from "@monaco-editor/react";
import { PlayIcon, CheckIcon } from "lucide-react";

export default function CodeEditor() {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");

  return (
    <div className="flex flex-col w-1/2 items-center">
      <div className="flex w-full items-center justify-evenly mb-2 px-4">
        <div className="flex gap-2">
          <button className="p-2 bg-blue-500 text-white rounded-lg hover:cursor-pointer hover:bg-blue-600 transition-colors">
            <div className="flex items-center gap-2">
              <PlayIcon className="w-5 h-5" />
              Run
            </div>
          </button>
          <button className="p-2 bg-green-500 text-white rounded-lg hover:cursor-pointer hover:bg-green-600 transition-colors">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-5 h-5" /> Submit
            </div>
          </button>
        </div>
        <select
        className="p-2 bg-gray-300 hover:cursor-pointer rounded-lg"
          onChange={(e) => setLanguage(e.target.value)}
          value={language}
        >
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
        </select>
      </div>

      <Editor
        className="bg-black p-2 border border-solid rounded-xl"
        height="400px"
        theme="vs-dark"
        language={language}
        value={code}
        onChange={(newValue) => setCode(newValue)}
      />
    </div>
  );
}
