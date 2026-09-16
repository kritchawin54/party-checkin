import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useAppState } from "../hooks";
import { parseGuestQr, setState } from "../store";

export default function CheckinPage() {
  const { guests } = useAppState();
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [scanning, setScanning] = useState(false);
  const boxId = "qr-reader";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const guestsRef = useRef(guests);
  const lastScanRef = useRef({ text: "", at: 0 });
  guestsRef.current = guests;

  function checkIn(idOrName: string) {
    const now = Date.now();
    if (idOrName === lastScanRef.current.text && now - lastScanRef.current.at < 2500) return;
    lastScanRef.current = { text: idOrName, at: now };

    const list = guestsRef.current;
    const id = parseGuestQr(idOrName);
    const found =
      list.find((g) => g.id === id) ||
      list.find((g) => g.name.trim() === idOrName.trim()) ||
      list.find((g) => g.name.includes(idOrName.trim()));
    if (!found) {
      setMsg("ไม่พบรายชื่อนี้");
      return;
    }
    if (found.checkedIn) {
      setMsg(`${found.name} เช็คอินไปแล้ว`);
      return;
    }
    setState({
      guests: list.map((g) =>
        g.id === found.id ? { ...g, checkedIn: true, checkedInAt: new Date().toISOString() } : g,
      ),
    });
    setMsg(`ยินดีต้อนรับ ${found.name}`);
  }

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => undefined);
    };
  }, []);

  async function startScan() {
    try {
      const scanner = new Html5Qrcode(boxId);
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          checkIn(decoded);
        },
        () => undefined,
      );
    } catch {
      setScanning(false);
      setMsg("เปิดกล้องไม่ได้ ลองอนุญาตกล้อง หรือเช็คอินด้วยการค้นชื่อแทน");
    }
  }

  async function stopScan() {
    await scannerRef.current?.stop().catch(() => undefined);
    scannerRef.current = null;
    setScanning(false);
  }

  const shown = guests.filter((g) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [g.name, g.nickname, g.firstName, g.lastName, g.rank, g.unit, g.phone].join(" ").toLowerCase().includes(s);
  });

  return (
    <>
      <div className="topbar">
        <div>
          <h2>แสกนเช็คอิน</h2>
          <p>สแกน QR ของผู้ร่วมงาน หรือค้นชื่อแล้วกดเช็คอิน</p>
        </div>
        <div className="row">
          {!scanning ? (
            <button className="btn" onClick={startScan}>
              เปิดกล้องสแกน
            </button>
          ) : (
            <button className="btn wine" onClick={stopScan}>
              ปิดกล้อง
            </button>
          )}
          <button
            className="btn secondary"
            onClick={() => {
              const now = new Date().toISOString();
              setState({
                guests: guests.map((g) => (g.checkedIn ? g : { ...g, checkedIn: true, checkedInAt: now })),
              });
              setMsg("เช็คอินทุกคนในรายชื่อแล้ว");
            }}
          >
            เช็คอินทั้งหมด
          </button>
        </div>
      </div>

      <div className="grid cards-2">
        <div className="card">
          <div id={boxId} className="scanner" />
          {msg ? <div className="winner-banner flash" style={{ marginTop: 12 }}>{msg}</div> : null}
        </div>
        <div className="card">
          <div className="field">
            <label>ค้นหาแล้วเช็คอิน</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="พิมพ์ชื่อ" />
          </div>
          <div className="table-wrap" style={{ maxHeight: 420, marginTop: 12 }}>
            <table>
              <tbody>
                {shown.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <div>{g.nickname ? `${g.nickname} · ${g.name}` : g.name}</div>
                      <small style={{ color: "var(--muted)" }}>{g.rank}</small>
                    </td>
                    <td>
                      {g.checkedIn ? (
                        <span className="badge ok">มาแล้ว</span>
                      ) : (
                        <button className="btn ok" onClick={() => checkIn(g.id)}>
                          เช็คอิน
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
