import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import NavBar from "./NavBar";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  SearchIcon,
  UserPlusIcon,
  UserRoundPlusIcon,
  UserRoundXIcon,
  XIcon,
  UsersIcon,
  BellIcon,
} from "lucide-react";
import { db } from "./firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import toast from "react-hot-toast";

export default function FriendsScreen() {
  const [isFriendsScreen, setIsFriendsScreen] = useState(true);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
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
    const decodedEmail = jwtDecode(token).email;
    setEmail(decodedEmail);
    setName(decodedEmail.split("@")[0]);
    loadUserData(decodedEmail);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const loadUserData = async (userEmail) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", userEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      setFriends(userDoc.data().friends || []);
      setPendingRequests(userDoc.data().pendingRequests || []);
      console.log(userDoc.data());
    } else {
      console.log("No user document found for:", userEmail);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    const querySnapshot = await getDocs(collection(db, "users"));
    const matchedUsers = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (user) =>
          user.email !== email &&
          friends.indexOf(user.email) === -1 &&
          pendingRequests.indexOf(user.email) === -1 &&
          user.email.toLowerCase().includes(search.toLowerCase())
      );
    setUsers(matchedUsers.map((user) => user.email));
    setShowDropdown(matchedUsers.length > 0);
  };

  const sendFriendRequest = async (recipientEmail) => {
    console.log("Sending friend request to:", recipientEmail);

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", recipientEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      toast.error("User does not exist!");
      return;
    }

    const recipientDocRef = querySnapshot.docs[0].ref;
    await updateDoc(recipientDocRef, {
      pendingRequests: arrayUnion(email),
    });

    toast.success("Friend request sent!");
  };

  const acceptFriendReqest = async (requesterEmail) => {
    console.log("Accepting friend request from:", requesterEmail);

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", requesterEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      toast.error("User does not exist!");
      return;
    }

    const requesterDocRef = querySnapshot.docs[0].ref;
    const requesterDoc = await getDoc(requesterDocRef);
    const requesterData = requesterDoc.data();
    const requesterFriends = requesterData.friends || [];
    const requesterPendingRequests = requesterData.pendingRequests || [];
    const updatedFriends = [...requesterFriends, email];
    const updatedPendingRequests = requesterPendingRequests.filter(
      (request) => request !== email
    );
    await updateDoc(requesterDocRef, {
      friends: updatedFriends,
      pendingRequests: updatedPendingRequests,
    });

    const q2 = query(usersRef, where("email", "==", email));
    const querySnapshot2 = await getDocs(q2);

    if (querySnapshot2.empty) {
      toast.error("User does not exist!");
      return;
    }

    const accepterDocRef = querySnapshot2.docs[0].ref;
    const accepterDoc = await getDoc(accepterDocRef);
    const accepterData = accepterDoc.data();
    const accepterFriends = accepterData.friends || [];
    const accepterPendingRequests = accepterData.pendingRequests || [];
    const updatedFriends2 = [...accepterFriends, requesterEmail];
    const updatedPendingRequests2 = accepterPendingRequests.filter(
      (request) => request !== requesterEmail
    );
    await updateDoc(accepterDocRef, {
      friends: updatedFriends2,
      pendingRequests: updatedPendingRequests2,
    });

    toast.success("Friend request accepted!");
    loadUserData(email);
  };

  const rejectFriendRequest = async (requesterEmail) => {
    console.log("Rejecting friend request from:", requesterEmail);

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      toast.error("User does not exist!");
      return;
    }

    const currentUserDocRef = querySnapshot.docs[0].ref;
    const currentUserDoc = await getDoc(currentUserDocRef);
    const currentUserData = currentUserDoc.data();

    const updatedPendingRequests = (
      currentUserData.pendingRequests || []
    ).filter((request) => request !== requesterEmail);

    await updateDoc(currentUserDocRef, {
      pendingRequests: updatedPendingRequests,
    });

    toast.success("Friend request rejected.");
    loadUserData(email);
  };

  const removeFriend = async (friendEmail) => {
    if (!email || !friendEmail) return;

    const usersRef = collection(db, "users");

    const q1 = query(usersRef, where("email", "==", email));
    const snapshot1 = await getDocs(q1);
    if (snapshot1.empty) {
      toast.error("Your user document not found.");
      return;
    }
    const yourDocRef = snapshot1.docs[0].ref;
    const yourData = snapshot1.docs[0].data();
    const updatedYourFriends = (yourData.friends || []).filter(
      (f) => f !== friendEmail
    );

    const q2 = query(usersRef, where("email", "==", friendEmail));
    const snapshot2 = await getDocs(q2);
    if (snapshot2.empty) {
      toast.error("Friend not found.");
      return;
    }
    const friendDocRef = snapshot2.docs[0].ref;
    const friendData = snapshot2.docs[0].data();
    const updatedFriendFriends = (friendData.friends || []).filter(
      (f) => f !== email
    );

    await updateDoc(yourDocRef, {
      friends: updatedYourFriends,
    });
    await updateDoc(friendDocRef, {
      friends: updatedFriendFriends,
    });

    toast.success("Friend removed successfully.");
    loadUserData(email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <NavBar />
      <div className="container mx-auto px-4 py-12 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-indigo-900 mb-2">
              Connect with Friends
            </h1>
            <p className="text-indigo-600 text-lg">
              Manage your connections and discover new friends
            </p>
          </div>

          <div className="mb-10">
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SearchIcon className="w-5 h-5 text-indigo-500" />
              </div>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  handleSearch();
                }}
                onFocus={() => setShowDropdown(!!search)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                type="search"
                className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-indigo-200 bg-white placeholder-indigo-300 text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-md transition-all"
                placeholder="Search for friends by email..."
              />
              {showDropdown && users.length > 0 && (
                <div
                  className="absolute z-10 mt-2 w-full bg-white border border-indigo-100 rounded-xl shadow-xl overflow-hidden"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {users.map((user) => (
                    <div
                      key={user}
                      className="px-4 py-3 flex items-center justify-between hover:bg-indigo-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSearch(user);
                        setShowDropdown(false);
                      }}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-200 rounded-full flex items-center justify-center mr-3">
                          <span className="text-indigo-700 font-semibold">
                            {user.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-indigo-900">{user}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendFriendRequest(user);
                        }}
                        className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 flex items-center justify-center transition-colors cursor-pointer shadow-md"
                      >
                        <UserPlusIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="flex">
              <button
                onClick={() => setIsFriendsScreen(true)}
                className={`flex-1 py-4 px-6 flex items-center hover:cursor-pointer justify-center gap-2 text-lg font-medium transition-all ${
                  isFriendsScreen
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                <UsersIcon className="w-5 h-5" />
                <span>Your Friends</span>
                {friends.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-white text-indigo-600 text-xs font-bold rounded-full">
                    {friends.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsFriendsScreen(false)}
                className={`flex-1 py-4 px-6 flex items-center hover:cursor-pointer justify-center gap-2 text-lg font-medium transition-all ${
                  !isFriendsScreen
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                <BellIcon className="w-5 h-5" />
                <span>Pending Requests</span>
                {pendingRequests.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-white text-indigo-600 text-xs font-bold rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            </div>

            <div className="p-6">
              {isFriendsScreen ? (
                <div className="space-y-4">
                  {friends.length > 0 ? (
                    friends.map((friend) => (
                      <div
                        key={friend}
                        className="flex items-center justify-between p-4 rounded-xl bg-indigo-50 border border-indigo-100 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center mr-4">
                            <span className="text-indigo-700 font-semibold">
                              {friend.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-indigo-900">
                              {friend.split("@")[0]}
                            </div>
                            <div className="text-sm text-indigo-500">
                              {friend}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFriend(friend)}
                          className="p-2 bg-white border border-red-200 text-red-500 rounded-full hover:bg-red-500 hover:text-white hover:border-transparent flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <XIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UsersIcon className="w-10 h-10 text-indigo-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-indigo-900 mb-2">
                        No friends yet
                      </h3>
                      <p className="text-indigo-500 max-w-sm mx-auto">
                        Search for friends by email address to start building
                        your connections.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.length > 0 ? (
                    pendingRequests.map((request) => (
                      <div
                        key={request}
                        className="flex items-center justify-between p-4 rounded-xl bg-indigo-50 border border-indigo-100 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center mr-4">
                            <span className="text-indigo-700 font-semibold">
                              {request.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-indigo-900">
                              {request.split("@")[0]}
                            </div>
                            <div className="text-sm text-indigo-500">
                              {request}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => acceptFriendReqest(request)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 justify-center transition-colors cursor-pointer shadow-sm"
                          >
                            <UserRoundPlusIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Accept</span>
                          </button>
                          <button
                            onClick={() => rejectFriendRequest(request)}
                            className="px-4 py-2 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-600 hover:text-white hover:border-transparent flex items-center gap-2 justify-center transition-colors cursor-pointer"
                          >
                            <UserRoundXIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Decline</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BellIcon className="w-10 h-10 text-indigo-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-indigo-900 mb-2">
                        No pending requests
                      </h3>
                      <p className="text-indigo-500 max-w-sm mx-auto">
                        When someone sends you a friend request, it will appear
                        here for you to accept or decline.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}