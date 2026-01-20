// src/pages/LoginGate.js
import { useEffect, useState } from "react";
import "../App.css";

import { auth, signInWithGoogle, savePublicProfile } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function LoginGate() {
  const navigate = useNavigate();
  // ログイン状態が確定するまでのちらつき防止
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  // 読み込み中は何も出さない
  if (checking) return null;

  // すでにログイン済みなら、この画面は出さない（MapPage側で表示を進める想定）
  if (user) return null;

  return (
    <div
      className="app-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "min(520px, 100%)",
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(82, 203, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            🌍
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
              Visited Countries Map
            </h1>
          </div>
        </div>

        <div
          style={{ marginTop: 18, color: "rgba(0,0,0,0.7)", lineHeight: 1.6 }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            ログインが必要です
          </div>
          <div style={{ fontSize: 14 }}>
            Googleアカウントでログインすると、あなたの訪問国データを保存します。
          </div>
        </div>

        <button
          className="google-btn"
          onClick={async () => {
            const u = await signInWithGoogle();
            await savePublicProfile(u);
            navigate(`/u/${u.uid}`, { replace: true });
          }}
        >
          <img src="/google/web_light_sq_ctn.svg" alt="Sign in with Google" />
        </button>

        <div style={{ marginTop: 12, fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
          ※
          位置情報や連絡先にはアクセスしません。保存されるのは訪問国データだけです。
        </div>
      </div>
    </div>
  );
}

export default LoginGate;
