import { useState } from "react";
import { Link } from "react-router-dom";
import EventTitle from "../components/EventTitle";
import GuestForm from "../components/GuestForm";
import PrizeShowcase from "../components/PrizeShowcase";
import { registerGuest } from "../store";
import { guestLabel } from "../types";

export default function JoinPage() {
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="join">
      <div className="join-hero">
        <div className="join-mascot">
          <img src="/party/mascot.png" alt="ด้วงปาร์ตี้" />
          <img className="join-mask" src="/party/mask.svg" alt="" />
        </div>
        <EventTitle size="compact" />
        <div className="hero-banner compact">
          <span className="hero-line">สวมหน้ากาก แล้วเข้างานเลย</span>
          <span className="hero-line gold">รางวัลใหญ่รอคุณอยู่</span>
        </div>
      </div>
      <div className="card">
        {done ? (
          <PrizeShowcase mode="jackpot" winnerName={done} />
        ) : (
          <>
            <PrizeShowcase mode="teaser" />
            {error ? <p className="poster-warn">{error}</p> : null}
            <GuestForm
              variant="guest"
              submitLabel={busy ? "กำลังบันทึก..." : "เข้างานเลย!"}
              onSubmit={async (data) => {
                setBusy(true);
                setError("");
                try {
                  const guest = await registerGuest({ ...data, source: "scan", unit: data.unit });
                  setDone(guestLabel(guest));
                } catch (err) {
                  setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
                } finally {
                  setBusy(false);
                }
              }}
            />
          </>
        )}
      </div>
      <p className="sponsor-back">
        <Link to="/sponsor">มีของรางวัลจะสนับสนุน?</Link>
      </p>
    </div>
  );
}
