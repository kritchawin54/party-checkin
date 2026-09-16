import { useEffect } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import BowlingPage from "./pages/BowlingPage";
import CheckinPage from "./pages/CheckinPage";
import DashboardPage from "./pages/DashboardPage";
import GuestsPage from "./pages/GuestsPage";
import JoinPage from "./pages/JoinPage";
import PrizesPage from "./pages/PrizesPage";
import QrPage from "./pages/QrPage";
import QrPosterPage from "./pages/QrPosterPage";
import RafflePage from "./pages/RafflePage";
import RegisterPage from "./pages/RegisterPage";
import SponsorPage from "./pages/SponsorPage";
import WheelPage from "./pages/WheelPage";
import { startAdminSync } from "./store";
import EventTitle from "./components/EventTitle";
import PartyDecor from "./components/PartyDecor";

const links = [
  { to: "/", label: "🎉 QR ปาร์ตี้" },
  { to: "/admin", label: "🏠 ภาพรวม" },
  { to: "/guests", label: "📝 รายชื่อ" },
  { to: "/checkin", label: "✅ เช็คอิน" },
  { to: "/register", label: "✍️ กรอกแทนแขก" },
  { to: "/qr", label: "📷 QR รายคน" },
  { to: "/wheel", label: "🎡 วงล้อ" },
  { to: "/bowling", label: "🎳 จับกลุ่มโบว์ลิ่ง" },
  { to: "/prizes", label: "🎁 สนับสนุน ของรางวัล" },
  { to: "/raffle", label: "🎲 จับฉลากรางวัล" },
];

function AdminShell() {
  useEffect(() => {
    void startAdminSync();
  }, []);

  return (
    <div className="app-shell">
      <PartyDecor vibe="light" />
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-mascot" src="/party/mascot.png" alt="" />
          <EventTitle size="compact" />
        </div>
        <nav className="nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/" || l.to === "/admin"} className={({ isActive }) => (isActive ? "active" : "")}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">รองด้วงใหญ่แล้ว มาฉลองกันที่โบว์ลิ่ง 🎳</div>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/guests" element={<GuestsPage />} />
          <Route path="/checkin" element={<CheckinPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/qr" element={<QrPage />} />
          <Route path="/wheel" element={<WheelPage />} />
          <Route path="/bowling" element={<BowlingPage />} />
          <Route path="/prizes" element={<PrizesPage />} />
          <Route path="/raffle" element={<RafflePage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const isPublic = pathname === "/" || pathname === "/join" || pathname === "/sponsor";

  if (isPublic) {
    return (
      <>
        <PartyDecor />
        <Routes>
          <Route path="/" element={<QrPosterPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/sponsor" element={<SponsorPage />} />
        </Routes>
      </>
    );
  }

  return <AdminShell />;
}
