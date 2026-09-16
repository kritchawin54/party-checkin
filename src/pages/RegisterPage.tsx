import { useState } from "react";
import GuestForm from "../components/GuestForm";
import { useAppState } from "../hooks";
import { registerGuest } from "../store";
import { guestLabel } from "../types";

export default function RegisterPage() {
  const { settings } = useAppState();
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState("");

  return (
    <div className="kiosk">
      <div className="topbar">
        <div>
          <h2>กรอกแทนแขก</h2>
          <p>{settings.eventName} · ใช้เมื่อแขกไม่มีมือถือหรือสแกนไม่ได้</p>
        </div>
      </div>
      <div className="card">
        {done ? (
          <div className="winner-banner flash">
            <h3>ยินดีต้อนรับ</h3>
            <p style={{ fontSize: 28, margin: "8px 0" }}>{done}</p>
            <p>เช็คอินเรียบร้อย พร้อมร่วมวงล้อ จับกลุ่ม และจับฉลาก</p>
            <button className="btn" onClick={() => setDone(null)}>
              ลงทะเบียนคนถัดไป
            </button>
          </div>
        ) : (
          <>
            {error ? <p className="poster-warn">{error}</p> : null}
            <GuestForm
              variant="guest"
              submitLabel="ร่วมงาน / เช็คอิน"
              onSubmit={async (data) => {
                setError("");
                try {
                  const guest = await registerGuest({ ...data, source: "onsite" });
                  setDone(guestLabel(guest));
                } catch (err) {
                  setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
                }
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
