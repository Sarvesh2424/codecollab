import { CircleUserRoundIcon, BellIcon, LogOutIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { logout } from "./firebaseAuth";

export default function NavBar() {
  return (
    <div className="flex justify-between w-full bg-gray-950 text-white p-4 shadow-2xl fixed top-0 z-10">
      <Link to="/" className="hover:cursor-pointer">
        <div className="ml-4 flex items-center">
          <img src="/icon.png" alt="logo" className="w-8 h-8" />
          <h1 className="ml-4 text-2xl font-bold">Codab</h1>
        </div>
      </Link>
      <div className="flex items-center space-x-4 mr-4">
        <BellIcon className="w-5 h-5 hover:cursor-pointer" />
        <Link to="/" className="hover:cursor-pointer">
          <p className="hover:cursor-pointer">Home</p>
        </Link>
        <Link to="/profile" className="hover:cursor-pointer">
          <CircleUserRoundIcon className="w-8 h-8 hover:cursor-pointer" />
        </Link>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            logout();
          }}
          className="bg-red-500 px-2 py-1 flex items-center gap-2 rounded-lg hover:bg-red-600 transition-colors hover:cursor-pointer"
        >
          <LogOutIcon className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </div>
  );
}
