import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import { jwtDecode } from "jwt-decode";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { UserIcon, BookOpenIcon, CheckCircleIcon, CalendarIcon, MailIcon } from "lucide-react";

export default function Profile() {
  const [name, setName] = useState(null);
  const [email, setEmail] = useState(null);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const decodedEmail = jwtDecode(token).email;
    setEmail(jwtDecode(token).email);
    setName(jwtDecode(token).email.split("@")[0]);
    fetchSolvedProblems(decodedEmail);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);
  const token = localStorage.getItem("token");

  async function fetchSolvedProblems(email) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userSolvedProblems = userDoc.data().solvedProblems || [];
      const problemNames = userSolvedProblems.map((problem) => {
        return [problem.id, problem.title, problem.date];
      });
      setSolvedProblems(problemNames);
      console.log(userDoc.data());
    } else {
      console.log("No user document found for:", email);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <NavBar />
      <div className="container mx-auto px-4 py-12 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-indigo-900 mb-2">
              Your Profile
            </h1>
            <p className="text-indigo-600 text-lg">
              View your information and progress
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-indigo-600 py-6 px-6 text-center">
                  <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center mb-4 border-4 border-indigo-200">
                    <UserIcon className="w-12 h-12 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{name}</h2>
                  <p className="text-indigo-200 text-sm mt-1">Member</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-4 pb-4 border-b border-indigo-100">
                    <MailIcon className="w-5 h-5 text-indigo-500 mr-3" />
                    <div>
                      <p className="text-sm text-indigo-500 font-medium">Email</p>
                      <p className="text-indigo-900">{email}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-indigo-500 mr-3" />
                    <div>
                      <p className="text-sm text-indigo-500 font-medium">Problems Solved</p>
                      <p className="text-indigo-900">{solvedProblems.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full">
                <div className="bg-indigo-600 py-4 px-6 flex items-center">
                  <BookOpenIcon className="w-6 h-6 text-white mr-2" />
                  <h2 className="text-xl font-bold text-white">Solved Problems</h2>
                </div>
                <div className="p-6">
                  {solvedProblems.length > 0 ? (
                    <div className="divide-y divide-indigo-100">
                      {solvedProblems.map((problem, index) => (
                        <div key={index} className="py-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                              <CheckCircleIcon className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-indigo-900">{problem[1]}</h3>
                              <p className="text-xs text-indigo-500">Problem ID: {problem[0]}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-indigo-500 text-sm">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            <span>{problem[2]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpenIcon className="w-10 h-10 text-indigo-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-indigo-900 mb-2">
                        No problems solved yet
                      </h3>
                      <p className="text-indigo-500 max-w-sm mx-auto">
                        Start solving problems to track your progress and improve your skills.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}