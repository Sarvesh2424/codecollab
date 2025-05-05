import { useState } from "react";
import {
  CircleUserRoundIcon,
  ContactIcon,
  LogOutIcon,
  HomeIcon,
  MenuIcon,
  XIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { logout } from "./firebaseAuth";

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-black via-gray-900 to-blue-900 text-white fixed top-0 w-full z-20 shadow-lg">
      <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center">
          <img src="/icon.png" alt="logo" className="w-10 h-10 shadow-md" />
          <h1 className="ml-4 tracking-tight text-3xl font-extrabold drop-shadow-lg">Codab</h1>
        </Link>
        <div className="hidden md:flex items-center space-x-10">
          <Link
            to="/"
            className="flex items-center gap-2 hover:cursor-pointer hover:text-blue-500 transition-colors duration-300"
          >
            <HomeIcon className="w-6 h-6" />
            <p className="font-semibold text-lg">Home</p>
          </Link>
          <Link
            to="/friends"
            className="flex items-center gap-2 hover:cursor-pointer hover:text-blue-500 transition-colors duration-300"
          >
            <ContactIcon className="w-6 h-6" />
            <p className="font-semibold text-lg">Friends</p>
          </Link>
          <Link to="/profile" className="hover:cursor-pointer hover:text-blue-500 transition-colors duration-300">
            <CircleUserRoundIcon className="w-9 h-9 rounded-full bg-white text-indigo-900 p-1 shadow-md" />
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              logout();
            }}
            className="bg-red-500 px-3 py-1.5 flex items-center gap-2 rounded-lg hover:cursor-pointer hover:bg-red-600 transition-colors duration-300 shadow-md"
          >
            <LogOutIcon className="w-6 h-6" />
            <span className="font-semibold text-lg">Log Out</span>
          </button>
        </div>
        <button
          className="md:hidden flex items-center"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <XIcon className="w-7 h-7" /> : <MenuIcon className="w-7 h-7" />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-gradient-to-b from-black via-gray-900 to-blue-900 px-6 pt-4 pb-6 space-y-4 shadow-lg rounded-b-lg">
          <Link
            to="/"
            className="flex items-center gap-3 hover:cursor-pointer hover:text-blue-500 transition-colors duration-300"
            onClick={() => setMenuOpen(false)}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="font-semibold text-lg">Home</span>
          </Link>
          <Link
            to="/friends"
            className="flex items-center gap-3 hover:cursor-pointer hover:text-blue-500 transition-colors duration-300"
            onClick={() => setMenuOpen(false)}
          >
            <ContactIcon className="w-6 h-6" />
            <span className="font-semibold text-lg">Friends</span>
          </Link>
          <Link
            to="/profile"
            className="block hover:cursor-pointer hover:text-blue-500 transition-colors duration-300"
            onClick={() => setMenuOpen(false)}
          >
            <CircleUserRoundIcon className="w-9 h-9 rounded-full bg-white text-black p-1 shadow-md" />
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              logout();
              setMenuOpen(false);
            }}
            className="bg-red-500 px-3 py-1.5 flex items-center gap-2 rounded-lg hover:bg-red-600 hover:cursor-pointer transition-colors duration-300 w-full shadow-md"
          >
            <LogOutIcon className="w-6 h-6" />
            <span className="font-semibold text-lg">Log Out</span>
          </button>
        </div>
      )}
    </nav>
  );
}
