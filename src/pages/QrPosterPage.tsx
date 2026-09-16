import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Link } from "react-router-dom";
import EventTitle from "../components/EventTitle";
import PrizeShowcase from "../components/PrizeShowcase";

type HostInfo = {
  eventName: string;
  guestCount: number;
  urls: { name: string; url: string }[];
};

export default function QrPosterPage() {
  const [info, setInfo] = useState<HostInfo | null>(null);
  const [joinUrl, setJoinUrl] = useState("");
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [posterOpen, setPosterOpen] = useState(false);

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const res = await fetch("/api/info");
        if (!res.ok) throw new Error("โหลดข้อมูลโฮสต์ไม่ได้");
        const data = (await res.json()) as HostInfo;
        if (stop) return;
        setInfo(data);
        setError("");
        setJoinUrl((current) => {
          if (current && data.urls.some((item) => item.url === current)) return current;
          return data.urls[0]?.url || `${window.location.origin}/join`;
        });
      } catch {
        if (!stop) {
          setJoinUrl((current) => current || `${window.location.origin}/join`);
          setError("ยังเปิดเซิร์ฟเวอร์ไม่ได้ รัน npm run dev แล้วรีเฟรช");
        }
      }
    }
    void load();
    const t = window.setInterval(load, 3000);
    return () => {
      stop = true;
      window.clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (!joinUrl) return;
    void QRCode.toDataURL(joinUrl, { margin: 1, width: 720, color: { dark: "#140c10", light: "#fff8e7" } }).then(setQr);
  }, [joinUrl]);

  useEffect(() => {
    if (!posterOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPosterOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [posterOpen]);

  const isPublic = /^https:\/\//.test(joinUrl) && !/localhost|127\.0\.0\.1|192\.168\.|10\./.test(joinUrl);

  return (
    <div className="poster">
      <div className="poster-sheet">
        <div className="poster-cast">
          <img src="/party/mask.svg" alt="" />
          <img src="/party/mascot.png" alt="ด้วงปาร์ตี้" />
          <img src="/party/bowtie.svg" alt="" />
        </div>
        <div className="poster-top">
          <EventTitle />
          <div className="hero-banner">
            <span className="hero-line">สวมหน้ากาก แล้วเข้างานเลย</span>
            <span className="hero-line accent">🎳 โบว์ลิ่ง  🎡 วงล้อ  🎁 จับฉลาก</span>
            <span className="hero-line gold">รางวัลใหญ่รอคุณอยู่</span>
          </div>
        </div>

        <div className="poster-qr gala-ticket">
          <div className="ticket-seal">บัตรเข้างาน</div>
          {qr ? <img src={qr} alt="QR ลงทะเบียนร่วมงาน" /> : <div className="empty">กำลังสร้าง QR...</div>}
          <strong>สแกนแล้วเข้าปาร์ตี้เลย</strong>
          <div className="poster-count">{info?.guestCount ?? 0} คนอยู่ในงานแล้ว</div>
        </div>
        <div className="poster-prizes">
          <PrizeShowcase mode="teaser" />
        </div>
      </div>

      <div className="poster-meta">
        {info?.urls.length ? (
          <div className="field">
            <label>ลิงก์ที่แขกจะเปิด</label>
            <select value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)}>
              {info.urls.map((item) => (
                <option key={item.url} value={item.url}>
                  {item.name} · {item.url}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <code className="poster-url">{joinUrl}</code>
        {error ? (
          <p className="poster-warn">{error}</p>
        ) : (
          <p>
            {isPublic
              ? "ลิงก์นี้เปิดจากอินเทอร์เน็ตได้ ส่งให้แขกหรือตั้ง QR ไว้ได้เลย"
              : "ถ้าต้องการให้ใช้เน็ตมือถือได้ รัน npm run public แล้วเลือกลิงก์อินเทอร์เน็ต"}
          </p>
        )}
        <div className="row" style={{ justifyContent: "center" }}>
          <button
            className="btn secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(joinUrl);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
          </button>
          <button className="btn secondary" onClick={() => document.documentElement.requestFullscreen?.()}>
            เต็มจอ
          </button>
          <button className="btn" disabled={!qr} onClick={() => setPosterOpen(true)}>
            พิมพ์โปสเตอร์
          </button>
          <Link className="btn secondary" to="/sponsor">
            สนับสนุนของรางวัล
          </Link>
          <Link className="btn" to="/admin">
            สำหรับเจ้าหน้าที่
          </Link>
        </div>
      </div>

      {posterOpen ? (
        <div className="poster-popup-back" onClick={() => setPosterOpen(false)}>
          <div className="poster-popup flash" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" type="button" onClick={() => setPosterOpen(false)}>
              ปิด
            </button>
            <div className="popup-cast">
              <img src="/party/mask.svg" alt="" />
              <img src="/party/mascot.png" alt="" />
              <img src="/party/bowtie.svg" alt="" />
            </div>
            <EventTitle size="compact" />
            <div className="popup-qr">
              <div className="ticket-seal">สแกนเข้างาน</div>
              <img src={qr} alt="QR เข้าปาร์ตี้" />
              <strong>สแกนแล้วเข้าปาร์ตี้เลย</strong>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
