import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SponsorForm from "../components/SponsorForm";
import { useAppState } from "../hooks";
import { setState, uid } from "../store";
import { downloadText } from "../utils/csv";
import type { Prize } from "../types";

export default function PrizesPage() {
  const { prizes, raffleWinners } = useAppState();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Prize | null>(null);
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return prizes;
    return prizes.filter((p) =>
      [p.name, p.sponsorName, p.sponsorOrg, p.sponsorPhone, p.note].join(" ").toLowerCase().includes(s),
    );
  }, [prizes, q]);

  const totalQty = prizes.reduce((sum, p) => sum + p.quantity, 0);
  const sponsorUrl = `${window.location.origin}/sponsor`;

  return (
    <>
      <div className="topbar">
        <div>
          <h2>สนับสนุน ของรางวัล</h2>
          <p>ผู้สนับสนุนกรอกเองได้ หรือเจ้าหน้าที่ช่วยกรอกว่าใครให้อะไรบ้าง</p>
        </div>
        <div className="row">
          <input className="search" placeholder="ค้นหาของรางวัล / ผู้สนับสนุน" value={q} onChange={(e) => setQ(e.target.value)} />
          <button
            className="btn secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(sponsorUrl);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์ให้ผู้สนับสนุน"}
          </button>
          <Link className="btn secondary" to="/sponsor" target="_blank">
            เปิดฟอร์มสาธารณะ
          </Link>
          <button
            className="btn secondary"
            onClick={() => {
              const header = ["ของรางวัล", "จำนวน", "ผู้สนับสนุน", "หน่วยงาน", "เบอร์", "รายละเอียด", "แหล่งที่มา"];
              const rows = prizes.map((p) =>
                [p.name, String(p.quantity), p.sponsorName, p.sponsorOrg, p.sponsorPhone, p.note, p.source === "sponsor" ? "ผู้สนับสนุนกรอก" : "เจ้าหน้าที่กรอก"]
                  .map((v) => (v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v))
                  .join(","),
              );
              downloadText("ผู้สนับสนุนของรางวัล.csv", [header.join(","), ...rows].join("\n"));
            }}
          >
            ดาวน์โหลด CSV
          </button>
        </div>
      </div>

      <div className="grid stats">
        <div className="card">
          <div className="stat-value">{prizes.length}</div>
          <div className="stat-label">รายการของรางวัล</div>
        </div>
        <div className="card">
          <div className="stat-value">{totalQty}</div>
          <div className="stat-label">ชิ้นรวมทั้งหมด</div>
        </div>
        <div className="card">
          <div className="stat-value">{new Set(prizes.map((p) => p.sponsorName).filter(Boolean)).size}</div>
          <div className="stat-label">ผู้สนับสนุน</div>
        </div>
        <div className="card">
          <div className="stat-value">{raffleWinners.length}</div>
          <div className="stat-label">จับฉลากไปแล้ว</div>
        </div>
      </div>

      <div className="grid cards-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>{editing ? "แก้ไขของรางวัล" : "เพิ่มของรางวัล"}</h3>
          <SponsorForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            submitLabel={editing ? "บันทึก" : "เพิ่มของรางวัล"}
            onSubmit={(data) => {
              if (editing) {
                setState({
                  prizes: prizes.map((p) => (p.id === editing.id ? { ...p, ...data } : p)),
                });
                setEditing(null);
              } else {
                setState({
                  prizes: [
                    ...prizes,
                    {
                      ...data,
                      id: uid(),
                      source: "staff",
                      createdAt: new Date().toISOString(),
                    },
                  ],
                });
              }
            }}
          />
          {editing ? (
            <button className="btn secondary" style={{ marginTop: 10 }} onClick={() => setEditing(null)}>
              ยกเลิกการแก้ไข
            </button>
          ) : null}
        </div>
        <div className="card table-wrap">
          <h3>รายการผู้สนับสนุน</h3>
          {filtered.length === 0 ? (
            <div className="empty">ยังไม่มีของรางวัล กรอกด้านซ้าย หรือส่งลิงก์ให้ผู้สนับสนุน</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ของรางวัล</th>
                  <th>จำนวน</th>
                  <th>ผู้สนับสนุน</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      {p.note ? <div className="muted-line">{p.note}</div> : null}
                    </td>
                    <td>{p.quantity}</td>
                    <td>
                      {p.sponsorName || "ยังไม่ระบุ"}
                      {p.sponsorOrg ? <div className="muted-line">{p.sponsorOrg}</div> : null}
                      <div className="muted-line">{p.source === "sponsor" ? "ผู้สนับสนุนกรอกเอง" : "เจ้าหน้าที่กรอก"}</div>
                    </td>
                    <td>
                      <div className="row">
                        <button
                          className="btn secondary"
                          onClick={() => {
                            setEditing(p);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          แก้
                        </button>
                        <button
                          className="btn wine"
                          onClick={() => {
                            if (confirm(`ลบ ${p.name}?`)) {
                              setState({ prizes: prizes.filter((x) => x.id !== p.id) });
                              if (editing?.id === p.id) setEditing(null);
                            }
                          }}
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
