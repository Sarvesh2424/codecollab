import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import NavBar from "./NavBar";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { SearchIcon } from "lucide-react";

export default function FriendsScreen() {
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [name, setName] = useState(null);
  const [email, setEmail] = useState(null);
  const auth = getAuth();
  const navigate = useNavigate();

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
      <div className="mt-20 p-8">
        <h1 className="text-4xl text-center p-8 font-medium">Friends</h1>
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-1/2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
              onChange={(e) => setSearch(e.target.value)}
              type="search"
              className="w-full pl-10 p-4 border-2 border-gray-300 rounded-xl"
              placeholder="Enter your friend's email to add them..."
            />
          </div>
          <div className="mt-10 w-1/2 flex items-center">
            <button className="w-1/2 bg-blue-500  text-white px-4 py-2 rounded-l-xl border border-r-white">
              Your Friends
            </button>
            <button className="w-1/2 bg-blue-500 text-white px-4 py-2 rounded-r-xl border border-l-white">
              Pending Requests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
