import { useMemo, useState } from "react";
import WheelCanvas from "../components/WheelCanvas";
import { useAppState } from "../hooks";
import type { Guest } from "../types";
import { SPIN_DURATION_MS, spinToIndex } from "../utils/wheel";

type Pool = "checked" | "all" | "notWon";

export default function WheelPage() {
  const { guests, raffleWinners } = useAppState();
  const [pool, setPool] = useState<Pool>("checked");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Guest | null>(null);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const list = useMemo(() => {
    const won = new Set(raffleWinners.map((w) => w.guestId));
    return guests.filter((g) => {
      if (removedIds.includes(g.id)) return false;
      if (pool === "checked" && !g.checkedIn) return false;
      if (pool === "notWon" && (won.has(g.id) || !g.checkedIn)) return false;
      return true;
    });
  }, [guests, pool, raffleWinners, removedIds]);

  const visualLabels = list.map((g) => g.nickname || g.name);

  function spin() {
    if (!list.length || spinning) return;
    setSpinning(true);
    setWinner(null);
    const { index, rotation: next } = spinToIndex(list.length, rotation);
    const picked = list[index];
    setRotation(next);
    window.setTimeout(() => {
      setWinner(picked);
      setSpinning(false);
    }, SPIN_DURATION_MS);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>วงล้อสุ่มชื่อ</h2>
          <p>ใช้สุ่มคนเล่นเกม จับกลุ่มทีละคน หรือสุ่มเรียกขึ้นเวที</p>
        </div>
        <div className="row">
          <select value={pool} onChange={(e) => setPool(e.target.value as Pool)}>
            <option value="checked">เฉพาะคนเช็คอินแล้ว</option>
            <option value="all">รายชื่อทั้งหมด</option>
            <option value="notWon">เช็คอินแล้วยังไม่เคยได้รางวัล</option>
          </select>
          <button className="btn" disabled={spinning || list.length === 0} onClick={spin}>
            {spinning ? "กำลังหมุน..." : "หมุนวงล้อ"}
          </button>
        </div>
      </div>

      <div className="grid cards-2">
        <div className="card wheel-wrap">
          <div className="wheel-pointer" />
          <WheelCanvas labels={visualLabels} rotation={rotation} spinning={spinning} />
        </div>
        <div className="card">
          {winner ? (
            <div className="winner-banner flash">
              <div className="brand-kicker">ได้แก่</div>
              <h3 style={{ fontSize: 34, margin: "8px 0" }}>{winner.nickname || winner.name}</h3>
              <p>
                {winner.name}
                {winner.rank ? ` · ${winner.rank}` : ""}
              </p>
              <div className="row" style={{ justifyContent: "center" }}>
                <button className="btn secondary" onClick={() => setRemovedIds((ids) => [...ids, winner.id])}>
                  เอาออกจากวงล้อรอบนี้
                </button>
                <button className="btn" onClick={spin} disabled={spinning}>
                  หมุนต่อ
                </button>
              </div>
            </div>
          ) : (
            <p className="empty">มี {list.length} ชื่อในวงล้อ กดหมุนเพื่อสุ่ม</p>
          )}
        </div>
      </div>
    </>
  );
}
