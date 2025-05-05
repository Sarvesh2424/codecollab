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
    <div>
      <NavBar />
      <div className="mt-20 p-8 bg-gradient-to-b from-gray-100 to-white">
        <h1 className="text-5xl text-center font-extrabold text-gray-900 drop-shadow-md">
          Friends
        </h1>
        <div className="mt-10 flex flex-col items-center justify-center">
          <div className="relative w-1/2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-400" />
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
              className="w-full pl-10 p-4 border-2 border-gray-300 rounded-xl"
              placeholder="Enter your friend's email to add them..."
            />
            {showDropdown && users.length > 0 && (
              <div
                className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg"
                onMouseDown={(e) => e.preventDefault()}
              >
                {users.map((user) => (
                  <div
                    key={user}
                    className="px-4 py-2 flex items-center justify-between hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setSearch(user);
                      setShowDropdown(false);
                    }}
                  >
                    {user}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sendFriendRequest(user);
                      }}
                      className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <UserPlusIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-10 w-1/2 flex items-center">
            <button
              onClick={() => setIsFriendsScreen(true)}
              className={`w-1/2 hover:cursor-pointer ${
                isFriendsScreen ? "bg-blue-600" : "bg-blue-500"
              } text-white px-4 py-2 rounded-l-xl border border-r-white`}
            >
              Your Friends
            </button>
            <button
              onClick={() => setIsFriendsScreen(false)}
              className={`w-1/2 hover:cursor-pointer ${
                !isFriendsScreen ? "bg-blue-600" : "bg-blue-500"
              } text-white px-4 py-2 rounded-r-xl border border-l-white`}
            >
              Pending Requests
            </button>
          </div>
          <div className="flex items-center justify-center">
            {isFriendsScreen ? (
              friends.length > 0 ? (
                friends.map((friend) => (
                  <div
                    key={friend}
                    className="m-4 flex items-center justify-between w-full gap-8 p-4 rounded-xl bg-blue-100"
                  >
                    <div>{friend}</div>
                    <button
                      onClick={() => removeFriend(friend)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <XIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center mt-40 text-gray-500">
                  No friends yet.
                </div>
              )
            ) : pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <div
                  key={request}
                  className="m-4 flex items-center justify-between w-full gap-8 p-4 rounded-xl bg-blue-100 "
                >
                  <div>{request}</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => acceptFriendReqest(request)}
                      className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 flex items-center gap-2 justify-center transition-colors cursor-pointer"
                    >
                      <UserRoundPlusIcon />
                      Accept
                    </button>
                    <button
                      onClick={() => rejectFriendRequest(request)}
                      className="p-2 gap-2 bg-red-500 text-white rounded-xl hover:bg-red-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <UserRoundXIcon />
                      Decline
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center mt-40 text-gray-500">
                No pending requests.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
