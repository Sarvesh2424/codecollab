import { useParams } from "react-router-dom";
import CodeEditor from "./CodeEditor";
import NavBar from "./NavBar";

export default function ProblemScreen() {
  const title = useParams();
  return (
    <div>
      <NavBar />
      <div className="p-8 flex justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{decodeURIComponent(title.title)}</h1>
          <p className="mt-8 mx-4">Here is the problem statement</p>
        </div>
        <CodeEditor />
      </div>
    </div>
  );
}
