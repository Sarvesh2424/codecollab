import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import Profile from "./Profile";
import { useState } from "react";
import ProblemScreen from "./ProblemScreen";
import FriendsScreen from "./FriendsScreen";
import NotFoundScreen from "./NotFoundScreen";

function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register setUser={setUser} />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/problem/:id" element={<ProblemScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
        <Route path="/friends" element={<FriendsScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
