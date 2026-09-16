import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EventTitle from "../components/EventTitle";
import SponsorForm from "../components/SponsorForm";
import { registerPrize } from "../store";

type PublicPrize = {
  id: string;
  name: string;
  quantity: number;
  sponsorName: string;
  sponsorOrg: string;
  note: string;
};

export default function SponsorPage() {
  const [prizes, setPrizes] = useState<PublicPrize[]>([]);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const prizeRes = await fetch("/api/prizes");
      if (prizeRes.ok) {
        setPrizes((await prizeRes.json()) as PublicPrize[]);
      }
    } catch {
      // keep last list
    }
  }

  useEffect(() => {
    void load();
    const t = window.setInterval(load, 4000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="join sponsor-page">
      <div className="join-hero">
        <img src="/party/mask.svg" alt="" />
        <EventTitle size="compact" />
        <div className="hero-banner compact">
          <span className="hero-line">สนับสนุน ของรางวัล</span>
          <span className="hero-line gold">บอกได้เลยว่าใครให้อะไร</span>
        </div>
      </div>
      <div className="card">
        {done ? (
          <div className="winner-banner flash">
            <div className="brand-kicker">ขอบคุณมาก!</div>
            <h3>รับของรางวัลแล้ว</h3>
            <p style={{ fontSize: 22, margin: "8px 0" }}>{done}</p>
            <p>ของรางวัลนี้จะขึ้นในรายการจับฉลากบนเวที</p>
            <button className="btn" onClick={() => setDone(null)}>
              เพิ่มของรางวัลอีกชิ้น
            </button>
          </div>
        ) : (
          <>
            <p className="sponsor-lead">ผู้สนับสนุนกรอกเองได้ หรือให้เจ้าหน้าที่ช่วยกรอกก็ได้</p>
            {error ? <p className="poster-warn">{error}</p> : null}
            <SponsorForm
              submitLabel="ส่งของรางวัล"
              onSubmit={async (data) => {
                setError("");
                try {
                  const prize = await registerPrize({ ...data, source: "sponsor" });
                  setDone(`${prize.name} จาก ${prize.sponsorName}`);
                  void load();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
                }
              }}
            />
          </>
        )}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>ของรางวัลที่ได้รับแล้ว {prizes.filter((p) => p.sponsorName).length ? `(${prizes.filter((p) => p.sponsorName).length})` : ""}</h3>
        {prizes.filter((p) => p.sponsorName).length === 0 ? (
          <div className="empty">ยังไม่มีของรางวัล เป็นคนแรกได้เลย</div>
        ) : (
          <ul className="sponsor-list">
            {prizes
              .filter((p) => p.sponsorName)
              .map((p) => (
                <li key={p.id}>
                  <strong>{p.name}</strong>
                  <span>จำนวน {p.quantity}</span>
                  <em>
                    สนับสนุนโดย {p.sponsorName}
                    {p.sponsorOrg ? ` · ${p.sponsorOrg}` : ""}
                  </em>
                  {p.note ? <small>{p.note}</small> : null}
                </li>
              ))}
          </ul>
        )}
      </div>
      <p className="sponsor-back">
        <Link to="/">กลับหน้า QR</Link>
        {" · "}
        <Link to="/join">ลงทะเบียนเข้าปาร์ตี้</Link>
      </p>
    </div>
  );
}
