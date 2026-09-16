import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useAppState } from "../hooks";
import { guestQrPayload } from "../store";

export default function QrPage() {
  const { guests, settings } = useAppState();
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const g of guests) {
        next[g.id] = await QRCode.toDataURL(guestQrPayload(g), { margin: 1, width: 280 });
      }
      if (!cancelled) setImages(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [guests]);

  return (
    <>
      <div className="topbar">
        <div>
          <h2>QR Code ผู้ร่วมงาน</h2>
          <p>พิมพ์หน้านี้แล้วติดบัตร หรือส่งให้สแกนตอนเข้างาน</p>
        </div>
        <button className="btn" onClick={() => window.print()}>
          พิมพ์
        </button>
      </div>
      {guests.length === 0 ? (
        <div className="card empty">ยังไม่มีรายชื่อ</div>
      ) : (
        <div className="qr-grid">
          {guests.map((g) => (
            <div className="qr-card" key={g.id}>
              {images[g.id] ? <img src={images[g.id]} alt={g.name} /> : <div>กำลังสร้าง...</div>}
              <strong>{g.nickname ? `${g.nickname} · ${g.name}` : g.name}</strong>
              <div>{g.rank}</div>
              <small>{settings.eventName}</small>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
