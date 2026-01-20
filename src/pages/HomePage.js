// src/pages/HomePage.js
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import LoginGate from "./LoginGate";

export default function HomePage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!checking && user) {
      navigate(`/u/${user.uid}`, { replace: true });
    }
  }, [checking, user, navigate]);

  if (checking) return null;
  if (user) return null;
  return <LoginGate />;
}
