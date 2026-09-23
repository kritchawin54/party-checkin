import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WheelCanvas from "../components/WheelCanvas";
import WinnerCelebration from "../components/WinnerCelebration";
import { useAppState } from "../hooks";
import type { Guest } from "../types";
import {
  playCelebrationSound,
  prepareCelebrationSound,
  startWheelSpinSound,
} from "../utils/celebrationSound";
import { spinToChosenIndex } from "../utils/wheel";

type Pool = "checked" | "all" | "notWon";
type LiveStatus = "connecting" | "live" | "offline";

type WheelSpinEvent = {
  id: string;
  startsAt: number;
  durationMs: number;
  fullTurns: number;
  pool: Pool;
  candidates: Guest[];
  winnerId: string;
};

export default function WheelPage() {
  const { guests, raffleWinners } = useAppState();
  const [pool, setPool] = useState<Pool>("checked");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Guest | null>(null);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const [syncedList, setSyncedList] = useState<Guest[] | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("connecting");
  const [soundReady, setSoundReady] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const rotationRef = useRef(0);
  const activeEventId = useRef("");
  const startTimer = useRef<number | undefined>(undefined);
  const resultTimer = useRef<number | undefined>(undefined);
  const stopSpinSound = useRef<() => void>(() => undefined);

  const list = useMemo(() => {
    const won = new Set(raffleWinners.map((w) => w.guestId));
    return guests.filter((g) => {
      if (removedIds.includes(g.id)) return false;
      if (pool === "checked" && !g.checkedIn) return false;
      if (pool === "notWon" && (won.has(g.id) || !g.checkedIn)) return false;
      return true;
    });
  }, [guests, pool, raffleWinners, removedIds]);

  const activeList = syncedList ?? list;
  const visualLabels = activeList.map((g) => g.nickname || g.name);

  function enableSound() {
    audioRef.current = prepareCelebrationSound(audioRef.current);
    setSoundReady(true);
  }

  const runWheelEvent = useCallback((event: WheelSpinEvent) => {
    if (!event.id || activeEventId.current === event.id || !event.candidates.length) return;
    const winnerIndex = event.candidates.findIndex((guest) => guest.id === event.winnerId);
    if (winnerIndex < 0) return;

    activeEventId.current = event.id;
    window.clearTimeout(startTimer.current);
    window.clearTimeout(resultTimer.current);
    stopSpinSound.current();
    setPool(event.pool);
    setSyncedList(event.candidates);
    setSpinning(true);
    setWinner(null);
    const picked = event.candidates[winnerIndex];
    const { rotation: next } = spinToChosenIndex(
      event.candidates.length,
      rotationRef.current,
      winnerIndex,
      event.fullTurns,
    );
    rotationRef.current = next;
    const delay = Math.max(0, event.startsAt - Date.now());
    stopSpinSound.current = startWheelSpinSound(audioRef.current, delay, event.durationMs);
    startTimer.current = window.setTimeout(() => setRotation(next), delay);
    resultTimer.current = window.setTimeout(() => {
      stopSpinSound.current();
      setWinner(picked);
      setSpinning(false);
      setCelebrationKey((key) => key + 1);
      playCelebrationSound(audioRef.current);
    }, delay + event.durationMs);
  }, []);

  useEffect(() => {
    const events = new EventSource("/api/wheel/events");
    events.onopen = () => setLiveStatus("live");
    events.onerror = () => setLiveStatus("offline");
    const onSpin = (message: MessageEvent<string>) => {
      try {
        runWheelEvent(JSON.parse(message.data) as WheelSpinEvent);
      } catch {
        // ignore malformed events and wait for the next command
      }
    };
    events.addEventListener("wheel-spin", onSpin as EventListener);
    return () => {
      events.close();
      stopSpinSound.current();
      window.clearTimeout(startTimer.current);
      window.clearTimeout(resultTimer.current);
    };
  }, [runWheelEvent]);

  async function spin() {
    if (!activeList.length || spinning || requesting) return;
    enableSound();
    setRequesting(true);
    try {
      const res = await fetch("/api/wheel/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pool, candidateIds: activeList.map((guest) => guest.id) }),
      });
      const body = (await res.json()) as WheelSpinEvent & { error?: string };
      if (!res.ok) throw new Error(body.error || "สั่งหมุนวงล้อไม่สำเร็จ");
      runWheelEvent(body);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setRequesting(false);
    }
  }

  return (
    <>
      {winner ? <WinnerCelebration key={celebrationKey} /> : null}
      <div className="topbar">
        <div>
          <h2>วงล้อสุ่มชื่อ</h2>
          <p>กดจากมือถือหรือเครื่องใดก็ได้ ทุกจอจะหมุนและแสดงผลเดียวกัน</p>
        </div>
      </div>

      <div className="grid cards-2">
        <div className="card wheel-wrap">
          <div className="wheel-pointer" />
          <WheelCanvas labels={visualLabels} rotation={rotation} spinning={spinning} />
          <div className="row wheel-controls wheel-controls-below">
            <select
              value={pool}
              disabled={spinning}
              onChange={(e) => {
                setPool(e.target.value as Pool);
                setSyncedList(null);
              }}
            >
              <option value="checked">เฉพาะคนเช็คอินแล้ว</option>
              <option value="all">รายชื่อทั้งหมด</option>
              <option value="notWon">เช็คอินแล้วยังไม่เคยได้รางวัล</option>
            </select>
            <button
              className="btn wheel-spin-button"
              disabled={spinning || requesting || activeList.length === 0}
              onClick={spin}
            >
              {spinning ? "กำลังหมุนพร้อมกัน..." : requesting ? "กำลังส่งคำสั่ง..." : "หมุนวงล้อทุกจอ"}
            </button>
          </div>
          <div className="wheel-live-row">
            <span className={`wheel-live-status ${liveStatus}`}>
              {liveStatus === "live" ? "● เชื่อมต่อเรียลไทม์แล้ว" : liveStatus === "connecting" ? "● กำลังเชื่อมต่อ..." : "● กำลังเชื่อมต่อใหม่..."}
            </span>
            <button className={`btn secondary sound-enable ${soundReady ? "ready" : ""}`} onClick={enableSound}>
              {soundReady ? "🔊 เปิดเสียงแล้ว" : "🔈 กดเปิดเสียงเครื่องนี้"}
            </button>
          </div>
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
                <button
                  className="btn secondary"
                  onClick={() => {
                    setRemovedIds((ids) => [...ids, winner.id]);
                    setSyncedList((current) => current?.filter((guest) => guest.id !== winner.id) ?? null);
                  }}
                >
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
