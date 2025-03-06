import { createRoot } from "react-dom/client";
import "./index.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="202469683498-0hf0bgijnv67do9hvj7idh6aijkdgg9b.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
