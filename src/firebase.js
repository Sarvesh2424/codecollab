import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyByDQCNMWeZQKIQapHTu0l8E9BKEsk2GDU",
  authDomain: "codecollab-ac443.firebaseapp.com",
  projectId: "codecollab-ac443",
  storageBucket: "codecollab-ac443.firebasestorage.app",
  messagingSenderId: "665464419865",
  appId: "1:665464419865:web:a3fff2e10313638e365c88"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export{ app,db };
