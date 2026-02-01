import { useEffect, useState } from "react";
import "../App.css";

import { auth, signInWithGoogle, ensurePublicProfile } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Signin() {
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

  if (checking) return null;
  if (user) return null;

  return (
    <div className="signin-page">
      <div className="signin-card" role="dialog" aria-label="Sign in">
        <div className="signin-header">
          <div className="signin-mark" aria-hidden="true">
            🌍
          </div>
          <div className="signin-titles">
            <div className="signin-appname">Visited Countries Map</div>
            <div className="signin-subtitle">Sign in to continue</div>
          </div>
        </div>

        <p className="signin-desc">
          Sign in with your Google account to save your visited countries.
        </p>

        <button
          className="signin-google-btn"
          onClick={async () => {
            const u = await signInWithGoogle();
            await ensurePublicProfile(u.uid);
            navigate("/setup-profile", { replace: true });
          }}
        >
          <img
            className="signin-google-img"
            src="/google/web_light_sq_ctn.svg"
            alt="Continue with Google"
          />
        </button>

        <p className="signin-note">
          We don’t access your location or contacts. Only visited-country data
          is stored.
        </p>
      </div>
    </div>
  );
}

export default Signin;
