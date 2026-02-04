import { useEffect, useState } from "react";
import { auth, loadPublicProfile } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Signin from "./Signin";

export default function EntryGate() {
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
    if (checking || !user) return;

    (async () => {
      try {
        const p = await loadPublicProfile(user.uid);
        const name = p?.publicDisplayName;

        if (name && String(name).trim().length > 0) {
          navigate(`/u/${user.uid}`, { replace: true });
        } else {
          navigate("/setup-profile", { replace: true });
        }
      } catch (e) {
        console.error(e);
        // 取れない時はセットアップに倒す（安全側）
        navigate("/setup-profile", { replace: true });
      }
    })();
  }, [checking, user, navigate]);

  if (checking) return null;
  if (user) return null; // リダイレクトするので表示不要
  return <Signin />;
}
