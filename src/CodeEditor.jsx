import { useState } from "react";
import { Editor } from "@monaco-editor/react";

export default function CodeEditor() {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");

  return (
    <div className="flex flex-col w-1/2 items-center">
      <select
        className="mb-2 p-2 border rounded"
        onChange={(e) => setLanguage(e.target.value)}
        value={language}
      >
        <option value="cpp">C++</option>
        <option value="java">Java</option>
        <option value="python">Python</option>
      </select>

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
