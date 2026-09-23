import { useAppState } from "../hooks";
import { downloadJson, importJson, resetForNewEvent, setState } from "../store";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { guests, teams, raffleWinners, settings, prizes } = useAppState();
  const checked = guests.filter((g) => g.checkedIn).length;
  const companions = guests.reduce((sum, g) => sum + (g.companionCount || 0), 0);
  const totalPeople = guests.length + companions;
  const adults = guests.filter((g) => g.category === "adult").length;

  return (
    <>
      <div className="topbar">
        <div>
          <h2>ภาพรวมงาน</h2>
          <p>
            {settings.eventName}
            {settings.venue ? ` · ${settings.venue}` : ""}
            {settings.eventDate ? ` · ${settings.eventDate}` : ""}
          </p>
          <p>รายชื่อถูกเก็บในฐานข้อมูล จะไม่หายตอนเว็บหลับ ถ้าจะเริ่มงานใหม่ กดปุ่มชมพูด้านขวา</p>
        </div>
        <div className="row">
          <button
            className="btn wine"
            onClick={() => {
              if (
                !confirm(
                  `สำรองข้อมูลเมื่อวาน แล้วลบรายชื่อ ${guests.length} คน เพื่อลงทะเบียนงานใหม่?\n\nทีมโบว์ลิ่งและผลจับฉลากจะถูกล้าง ของรางวัลยังอยู่`,
                )
              ) {
                return;
              }
              downloadJson();
              resetForNewEvent({ clearPrizes: false })
                .then(() => alert("เริ่มงานใหม่แล้ว พร้อมลงทะเบียนแขกชุดใหม่"))
                .catch((err) => alert(String(err)));
            }}
          >
            เริ่มงานใหม่
          </button>
          <button className="btn secondary" onClick={downloadJson}>
            สำรองข้อมูล
          </button>
          <label className="btn secondary">
            นำเข้าไฟล์สำรอง
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importJson(file).catch((err) => alert(String(err)));
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <div className="grid stats">
        <div className="card">
          <div className="stat-value">{guests.length}</div>
          <div className="stat-label">ผู้ลงทะเบียน</div>
        </div>
        <div className="card">
          <div className="stat-value">{companions}</div>
          <div className="stat-label">ผู้ติดตาม</div>
        </div>
        <div className="card">
          <div className="stat-value">{totalPeople}</div>
          <div className="stat-label">รวมทุกคนที่มา</div>
        </div>
        <div className="card">
          <div className="stat-value">{checked}</div>
          <div className="stat-label">เช็คอินแล้ว</div>
        </div>
      </div>

      <div className="grid cards-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>ตั้งชื่องาน</h3>
          <div className="guest-form">
            <div className="field">
              <label>ชื่องาน</label>
              <input
                value={settings.eventName}
                onChange={(e) => setState({ settings: { ...settings, eventName: e.target.value } })}
              />
            </div>
            <div className="field">
              <label>ลิงก์สาธารณะ (ถ้ามี)</label>
              <input
                value={settings.publicUrl ?? ""}
                placeholder="https://...."
                onChange={(e) => setState({ settings: { ...settings, publicUrl: e.target.value } })}
              />
            </div>
            <div className="row">
              <div className="field">
                <label>วันที่</label>
                <input
                  type="date"
                  value={settings.eventDate}
                  onChange={(e) => setState({ settings: { ...settings, eventDate: e.target.value } })}
                />
              </div>
              <div className="field">
                <label>สถานที่</label>
                <input
                  value={settings.venue}
                  onChange={(e) => setState({ settings: { ...settings, venue: e.target.value } })}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>สรุปสั้นๆ</h3>
          <p>ผู้ใหญ่ {adults} คน · เยาวชน {guests.length - adults} คน · ทีมโบว์ลิ่ง {teams.length} ทีม</p>
          <p>
            ของรางวัลจากผู้สนับสนุน {prizes.length} รายการ · จับฉลากไปแล้ว {raffleWinners.length} รางวัล
          </p>
          <p>
            <Link className="btn secondary" to="/prizes">
              ไปหน้าสนับสนุน ของรางวัล
            </Link>
          </p>
          <p style={{ color: "var(--muted)" }}>
            แนะนำลำดับงาน: ตั้ง QR หน้าแรกให้แขกสแกน → ดูรายชื่อ → จับกลุ่มโบว์ลิ่ง → วงล้อ / จับฉลาก
          </p>
        </div>
      </div>
    </>
  );
}
