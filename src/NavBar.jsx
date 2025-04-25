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
    <nav className="bg-gray-950 text-white fixed top-0 w-full z-10 shadow-2xl">
      <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center">
          <img src="/icon.png" alt="logo" className="w-8 h-8" />
          <h1 className="ml-4 tracking-tighter text-2xl font-bold">Codab</h1>
        </Link>
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="flex items-center gap-2 hover:cursor-pointer">
            <HomeIcon className="w-5 h-5" />
            <p>Home</p>
          </Link>
          <Link to="/friends" className="flex items-center gap-2 hover:cursor-pointer">
            <ContactIcon className="w-5 h-5" />
            <p>Friends</p>
          </Link>
          <Link to="/profile" className="hover:cursor-pointer">
            <CircleUserRoundIcon className="w-8 h-8" />
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              logout();
            }}
            className="bg-red-500 px-2 py-1 flex items-center gap-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOutIcon className="w-5 h-5" />
            Log Out
          </button>
        </div>
        <button
          className="md:hidden flex items-center"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-gray-900 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 hover:cursor-pointer"
            onClick={() => setMenuOpen(false)}
          >
            <HomeIcon className="w-5 h-5" />
            Home
          </Link>
          <Link
            to="/friends"
            className="flex items-center gap-2 hover:cursor-pointer"
            onClick={() => setMenuOpen(false)}
          >
            <ContactIcon className="w-5 h-5" />
            Friends
          </Link>
          <Link
            to="/profile"
            className="block hover:cursor-pointer"
            onClick={() => setMenuOpen(false)}
          >
            <CircleUserRoundIcon className="w-8 h-8" />
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              logout();
              setMenuOpen(false);
            }}
            className="bg-red-500 px-2 py-1 flex items-center gap-2 rounded-lg hover:bg-red-600 transition-colors w-full"
          >
            <LogOutIcon className="w-5 h-5" />
            Log Out
          </button>
        </div>
      )}
    </nav>
  );
}
