import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { app } from "./firebase";
import {
  getDoc,
  doc,
  query,
  where,
  getDocs,
  collection,
} from "firebase/firestore";
import { db } from "./firebase";

export const checkUserExists = async (email) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    throw error;
  }
};

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const registerUser = async (email, password) => {
  try {
    const userExists = await checkUserExists(email);
    if (userExists) {
      throw new Error("User already registered. Please login instead.");
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const loginWithGoogle = async (isRegistration = false) => {
  try {
    const result = await signInWithPopup(auth, provider);
    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    if (isRegistration) {
      if (userDoc.exists()) {
        await signOut(auth);
        throw new Error("User already registered. Please login instead.");
      }
    } else {
      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error("User not registered. Please register first.");
      }
    }

    return result.user;
  } catch (error) {
    throw error;
  }
};

export const logout = () => {
  return signOut(auth);
};
