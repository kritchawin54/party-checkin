import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import WheelCanvas from "../components/WheelCanvas";
import { useAppState } from "../hooks";
import { setState, uid } from "../store";
import { downloadText } from "../utils/csv";
import { SPIN_DURATION_MS, spinToIndex } from "../utils/wheel";
import { prizeLabel, type Prize } from "../types";

export default function RafflePage() {
  const { guests, prizes, raffleWinners } = useAppState();
  const [prizeId, setPrizeId] = useState(prizes[0]?.id ?? "");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [lastWinner, setLastWinner] = useState<string | null>(null);

  const remainingOf = (p: Prize) => p.quantity - raffleWinners.filter((w) => w.prizeId === p.id).length;
  const selected = prizes.find((p) => p.id === prizeId) ?? prizes[0];
  const pool = useMemo(() => {
    const won = new Set(raffleWinners.map((w) => w.guestId));
    return guests.filter((g) => g.checkedIn && !won.has(g.id));
  }, [guests, raffleWinners]);
  const visualLabels =
    pool.length <= 18 ? pool.map((g) => g.nickname || g.name) : Array.from({ length: 12 }, (_, i) => `สุ่ม ${i + 1}`);

  function spin() {
    if (!selected || remainingOf(selected) <= 0 || !pool.length || spinning) return;
    setSpinning(true);
    setLastWinner(null);
    const pick = Math.floor(Math.random() * pool.length);
    const { rotation: next } = spinToIndex(visualLabels.length, rotation);
    setRotation(next);
    window.setTimeout(() => {
      const guest = pool[pick];
      setState({
        raffleWinners: [
          {
            id: uid(),
            guestId: guest.id,
            prizeId: selected.id,
            prizeName: selected.name,
            drawnAt: new Date().toISOString(),
          },
          ...raffleWinners,
        ],
      });
      setLastWinner(guest.nickname || guest.name);
      setSpinning(false);
    }, SPIN_DURATION_MS);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>จับฉลากมอบรางวัล</h2>
          <p>สุ่มจากคนที่เช็คอินแล้ว คนที่ถูกรางวัลแล้วจะไม่ซ้ำ</p>
        </div>
        <button
          className="btn secondary"
          onClick={() => {
            const lines = ["รางวัล,ผู้ได้รับ,ยศ,เวลา"];
            raffleWinners.forEach((w) => {
              const g = guests.find((x) => x.id === w.guestId);
              lines.push([w.prizeName, g?.name ?? "", g?.rank ?? "", w.drawnAt].join(","));
            });
            downloadText("ผู้โชคดี.csv", lines.join("\n"));
          }}
        >
          ดาวน์โหลดผู้โชคดี
        </button>
      </div>

      <div className="grid cards-2">
        <div className="card wheel-wrap">
          <div className="wheel-pointer" />
          <WheelCanvas labels={visualLabels} rotation={rotation} spinning={spinning} />
        </div>
        <div className="card">
          <div className="field">
            <label>รางวัลที่จับ</label>
            <select value={selected?.id ?? ""} onChange={(e) => setPrizeId(e.target.value)}>
              {prizes.map((p) => (
                <option key={p.id} value={p.id}>
                  {prizeLabel(p)} · เหลือ {remainingOf(p)}/{p.quantity}
                </option>
              ))}
            </select>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={spin} disabled={spinning || !pool.length || !selected || remainingOf(selected) <= 0}>
              {spinning ? "กำลังจับฉลาก..." : "จับฉลาก"}
            </button>
            <Link className="btn secondary" to="/prizes">
              จัดการผู้สนับสนุน
            </Link>
          </div>
          {!prizes.length ? <p className="poster-warn">ยังไม่มีของรางวัล ไปหน้าสนับสนุน ของรางวัลเพื่อกรอกก่อน</p> : null}
          {lastWinner ? (
            <div className="winner-banner flash" style={{ marginTop: 16 }}>
              <div className="brand-kicker">{selected ? prizeLabel(selected) : ""}</div>
              <h3 style={{ fontSize: 32 }}>{lastWinner}</h3>
            </div>
          ) : null}

          <h3 style={{ marginTop: 24 }}>ของรางวัลจากผู้สนับสนุน</h3>
          {prizes.length === 0 ? (
            <p className="empty">ยังไม่มีรายการ</p>
          ) : (
            <ul className="sponsor-list compact">
              {prizes.map((p) => (
                <li key={p.id}>
                  <strong>{p.name}</strong>
                  <span>เหลือ {remainingOf(p)}/{p.quantity}</span>
                  <em>สนับสนุนโดย {p.sponsorName || "ยังไม่ระบุ"}</em>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>รายชื่อผู้โชคดี</h3>
        {raffleWinners.length === 0 ? (
          <div className="empty">ยังไม่จับฉลาก</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>รางวัล</th>
                <th>ผู้ได้รับ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {raffleWinners.map((w) => {
                const g = guests.find((x) => x.id === w.guestId);
                return (
                  <tr key={w.id}>
                    <td>{w.prizeName}</td>
                    <td>
                      {g?.name} {g?.rank ? `· ${g.rank}` : ""}
                    </td>
                    <td>
                      <button
                        className="btn secondary"
                        onClick={() => setState({ raffleWinners: raffleWinners.filter((x) => x.id !== w.id) })}
                      >
                        ยกเลิก
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
