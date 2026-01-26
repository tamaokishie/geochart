import { useEffect, useState } from "react";
import "../App.css";
import { countryList } from "../country_list";

import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MenuItem from "@mui/material/MenuItem";
import LogoutIcon from "@mui/icons-material/Logout";

import {
  auth,
  loadVisitedByUid,
  saveVisited,
  logout,
  loadPublicProfile,
} from "../firebase";

import { onAuthStateChanged } from "firebase/auth";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function MapPage() {
  const navigate = useNavigate();
  const { uid } = useParams();

  const [user, setUser] = useState(null);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [openRegions, setOpenRegions] = useState({});
  const [readyToDraw, setReadyToDraw] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ownerName, setOwnerName] = useState("");

  const isOwner = user?.uid === uid;

  useEffect(() => {
    if (!uid) return;

    loadPublicProfile(uid).then((p) => {
      setOwnerName(p?.publicDisplayName || "Someone");
    });
  }, [uid]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest?.(".user-menu-wrap")) setMenuOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 認証監視（URLは書き換えない）
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (!u) {
        setSelectedCountries([]);
        setReadyToDraw(false);
      }
    });
    return () => unsub();
  }, []);

  // Firestoreから訪問国を読む
  useEffect(() => {
    if (!uid) return;

    loadVisitedByUid(uid)
      .then((countries) => setSelectedCountries(countries))
      .catch((e) => {
        console.error(e);
        setSelectedCountries([]);
      })
      .finally(() => setReadyToDraw(true));
  }, [uid]);

  // Google Chartsのロード＋描画：ログイン済み & ready の時だけ描く
  useEffect(() => {
    if (!readyToDraw) return;

    function drawRegionsMap() {
      const data = window.google.visualization.arrayToDataTable([
        ["Country", "Popularity"],
        ...selectedCountries.map((c) => [c, 1000]),
      ]);

      const options = {
        colorAxis: { colors: ["#e0e0e0", "#ff5252"] },
        legend: "none",
      };

      const chart = new window.google.visualization.GeoChart(
        document.getElementById("regions_div")
      );

      window.google.visualization.events.removeAllListeners(chart);

      window.google.visualization.events.addListener(
        chart,
        "regionClick",
        (e) => {
          if (!isOwner) {
            return;
          }
          const clickedCode = e.region;
          setSelectedCountries((prev) => {
            const updated = prev.includes(clickedCode)
              ? prev.filter((c) => c !== clickedCode)
              : [...prev, clickedCode];

            saveVisited(updated);
            return updated;
          });
        }
      );

      chart.draw(data, options);
    }

    if (!window.google) {
      const script = document.createElement("script");
      script.src = "https://www.gstatic.com/charts/loader.js";
      script.onload = () => {
        window.google.charts.load("current", { packages: ["geochart"] });
        window.google.charts.setOnLoadCallback(drawRegionsMap);
      };
      document.body.appendChild(script);
      return () => {
        if (script && script.parentNode) script.parentNode.removeChild(script);
      };
    } else {
      drawRegionsMap();
    }
  }, [readyToDraw, selectedCountries, isOwner, user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      alert("Logout failed");
    }
  };

  const handleCheckboxChange = (code) => {
    if (!isOwner) return;

    setSelectedCountries((prev) => {
      const updated = prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code];

      saveVisited(updated);
      return updated;
    });
  };

  const toggleRegion = (region) => {
    setOpenRegions((prev) => ({
      ...prev,
      [region]: !prev[region],
    }));
  };

  const level = selectedCountries.length;

  return (
    <div className="app-container">
      <div
        className="app-header-row"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div className="app-title-block">
          <h1 className="app-title">
            {ownerName
              ? `${ownerName}'s Visited Countries Map`
              : "Visited Countries Map"}
          </h1>
          <div className="app-level">Level: {level}</div>
        </div>

        <div className="user-menu-wrap">
          {user ? (
            <>
              {user.photoURL && (
                <button
                  className="avatar-btn"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="account menu"
                  type="button"
                >
                  <img
                    src={user.photoURL}
                    alt="profile"
                    referrerPolicy="no-referrer"
                    className="user-avatar"
                  />
                </button>
              )}

              {menuOpen && (
                <div className="user-menu" role="menu">
                  <div className="user-menu-top">
                    <img
                      src={user.photoURL}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="user-menu-avatar"
                    />
                    <div className="user-menu-meta">
                      <div className="user-menu-name">
                        {user.displayName || "Account"}
                      </div>
                      <div className="user-menu-email">{user.email || ""}</div>
                    </div>
                  </div>

                  <div className="user-menu-sep" />

                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                    Sign out
                  </MenuItem>
                </div>
              )}
            </>
          ) : (
            <button
              className="sign-in-btn"
              type="button"
              onClick={() => navigate("/", { replace: true })}
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      <div id="regions_div" className="geo-chart"></div>

      <div className="checkbox-list">
        {Object.entries(countryList).map(([region, countries]) => {
          const expanded = isMobile ? !!openRegions[region] : true;

          // モバイルだけAccordion、PCは従来通り常時表示にしてる。
          if (!isMobile) {
            return (
              <div key={region} className="checkbox-group">
                <h3 className="region-header">
                  <span>{region}</span>
                </h3>

                <div className="region-country-list">
                  {countries.map(({ code, name }) => (
                    <FormControlLabel
                      key={code}
                      className="checkbox-item"
                      control={
                        <Checkbox
                          checked={selectedCountries.includes(code)}
                          onChange={() => handleCheckboxChange(code)}
                          disabled={!isOwner}
                          size="small"
                          sx={{ p: 0.5 }}
                        />
                      }
                      label={name}
                    />
                  ))}
                </div>
              </div>
            );
          }

          // モバイル
          return (
            <Accordion
              key={region}
              expanded={expanded}
              onChange={() => toggleRegion(region)}
              disableGutters
              elevation={0}
              sx={{
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 2,
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                  {region}
                </span>
              </AccordionSummary>

              <AccordionDetails>
                <div className="region-country-list">
                  {countries.map(({ code, name }) => (
                    <FormControlLabel
                      key={code}
                      className="checkbox-item"
                      sx={{ m: 0 }}
                      control={
                        <Checkbox
                          checked={selectedCountries.includes(code)}
                          onChange={() => handleCheckboxChange(code)}
                          disabled={!isOwner}
                          size="small"
                          sx={{ p: 0.5 }}
                        />
                      }
                      label={name}
                    />
                  ))}
                </div>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </div>
    </div>
  );
}

export default MapPage;
