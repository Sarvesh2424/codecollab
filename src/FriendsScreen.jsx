import { useEffect } from "react";

export default function FriendsScreen(){
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

      return <div></div>
}