import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useSearchParams } from "react-router-dom";

import { auth, loadPublicProfile, savePublicProfile } from "../firebase";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import MenuItem from "@mui/material/MenuItem";

// ゆるいバリデーション（厳しくしすぎない）
function validateDisplayName(name) {
  const v = (name || "").trim();
  if (v.length < 3) return "3文字以上にしてください";
  if (v.length > 20) return "20文字以内にしてください";
  if (/\s/.test(v)) {
    return "スペースは使用できません";
  }
  // 許可する文字：英数、._-
  if (!/^[a-zA-Z0-9._-]+$/.test(v)) {
    return "使えるのは英数字・._- です";
  }
  return null;
}

const COUNTRY_OPTIONS = [
  { code: "JP", label: "Japan" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Germany" },
];

export default function SetupProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get("mode") === "edit";

  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const countryName = useMemo(() => {
    return COUNTRY_OPTIONS.find((c) => c.code === countryCode)?.label;
  }, [countryCode]);

  // 1) ログイン状態の確定
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  // 2) 未ログインならHomeへ
  useEffect(() => {
    if (!checking && !user) {
      navigate("/", { replace: true });
    }
  }, [checking, user, navigate]);

  // プロフィール読み込み
  useEffect(() => {
    if (checking || !user) return;

    (async () => {
      try {
        const p = await loadPublicProfile(user.uid);

        const currentName = p?.publicDisplayName;

        // 初回のみ：既に登録済みなら地図へ
        if (!isEdit && currentName && currentName.trim().length > 0) {
          navigate(`/u/${user.uid}`, { replace: true });
          return;
        }

        // 編集モード：既存値をフォームに反映
        if (isEdit) {
          setDisplayName(currentName ? String(currentName) : "");
          if (p?.countryCode) setCountryCode(p.countryCode);
          setTouched(false);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [checking, user, isEdit, navigate]);

  const validationMsg = useMemo(() => {
    if (!touched) return null;
    if (displayName.length === 0) return null;
    return validateDisplayName(displayName);
  }, [displayName, touched]);

  const isValid = touched && displayName.length > 0 && !validationMsg;
  const isInvalid = touched && displayName.length > 0 && !!validationMsg;

  const canSubmit =
    !saving &&
    displayName.trim().length >= 3 &&
    !validateDisplayName(displayName) &&
    !!countryCode;

  const onSubmit = async () => {
    const msg = validateDisplayName(displayName);
    if (msg || !countryCode) return;

    setSaving(true);
    try {
      await savePublicProfile(user.uid, {
        publicDisplayName: displayName.trim(),
        countryCode,
        country: countryName,
      });

      navigate(`/u/${user.uid}`, { replace: true });
    } finally {
      setSaving(false);
    }
  };

  if (checking || !user) return null;

  return (
    <div
      className="app-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#fff",
      }}
    >
      <div style={{ width: "min(560px, 100%)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>
            {isEdit ? "Edit profile" : "Create your account"}
          </h1>

          {isEdit && (
            <button
              onClick={() => navigate(-1)}
              type="button"
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                fontSize: 14,
                fontWeight: 600,
                color: "rgba(0,0,0,0.45)",
                cursor: "pointer",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.color = "rgba(0,0,0,0.65)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.color = "rgba(0,0,0,0.35)")
              }
            >
              ✖
            </button>
          )}
        </div>

        <div style={{ marginTop: 8, color: "rgba(0,0,0,0.65)", fontSize: 14 }}>
          {isEdit
            ? "Update your public profile."
            : "This is your in-app profile, please register."}
        </div>

        <div
          style={{
            marginTop: 18,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.10)",
            borderRadius: 14,
            padding: 18,
          }}
        >
          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800 }}>
              Email
            </label>
            <div style={{ marginTop: 6 }}>
              <input
                value={user.email || ""}
                disabled
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.14)",
                  background: "rgba(0,0,0,0.04)",
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {/* Username */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800 }}>
              Username
            </label>
            <div style={{ marginTop: 6 }}>
              <TextField
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (!touched) setTouched(true);
                }}
                onBlur={() => setTouched(true)}
                fullWidth
                size="small"
                error={isInvalid} // 枠が赤になる
                InputProps={{
                  endAdornment:
                    isValid || isInvalid ? (
                      <InputAdornment position="end">
                        {isValid ? (
                          <CheckCircleIcon sx={{ color: "success.main" }} />
                        ) : (
                          <Tooltip title={validationMsg ?? ""} arrow>
                            <CancelIcon
                              sx={{ color: "error.main", cursor: "help" }}
                            />
                          </Tooltip>
                        )}
                      </InputAdornment>
                    ) : null,
                }}
              />
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "rgba(0,0,0,0.55)",
              }}
            ></div>
          </div>

          {/* Country/Region */}
          <div style={{ marginTop: 18 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800 }}>
              Your Country / Region
            </label>
            <TextField
              select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              fullWidth
              size="small"
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) return "";
                  const found = COUNTRY_OPTIONS.find(
                    (c) => c.code === selected,
                  );
                  return found ? found.label : selected;
                },
              }}
            >
              <MenuItem value="" sx={{ display: "none" }} />

              {COUNTRY_OPTIONS.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
          </div>

          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            style={{
              marginTop: 30,
              width: "100%",
              height: 46,
              borderRadius: 12,
              border: "none",
              fontWeight: 900,
              fontSize: 14,
              cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: canSubmit ? 1 : 0.5,
              background: "#111",
              color: "#fff",
            }}
          >
            {saving
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save"
                : "Create account"}
          </button>
        </div>
      </div>
    </div>
  );
}
