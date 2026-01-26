import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MapPage from "./pages/MapPage";
import SetupProfile from "./pages/SetupProfile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/setup-profile" element={<SetupProfile />} />
      <Route path="/u/:uid" element={<MapPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
