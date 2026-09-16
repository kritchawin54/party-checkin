import { useMemo, useState } from "react";
import GuestForm from "../components/GuestForm";
import { useAppState } from "../hooks";
import { setState, uid } from "../store";
import { downloadText, guestsToCsv, parseGuestCsv } from "../utils/csv";
import type { Guest } from "../types";

export default function GuestsPage() {
  const { guests } = useAppState();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return guests;
    return guests.filter((g) =>
      [g.name, g.nickname, g.firstName, g.lastName, g.rank, g.unit, g.phone].join(" ").toLowerCase().includes(s),
    );
  }, [guests, q]);

  function addMany(rows: Guest[]) {
    const exist = new Set(guests.map((g) => g.name.trim().toLowerCase()));
    const fresh = rows.filter((g) => !exist.has(g.name.trim().toLowerCase()));
    setState({ guests: [...guests, ...fresh] });
    if (fresh.length !== rows.length) {
      alert(`นำเข้า ${fresh.length} ชื่อ (ข้ามชื่อซ้ำ ${rows.length - fresh.length} คน)`);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>รายชื่อผู้ร่วมงาน</h2>
          <p>รายชื่อจากการสแกน QR, อัปโหลด CSV หรือเจ้าหน้าที่กรอกแทน</p>
        </div>
        <div className="row">
          <input className="search" placeholder="ค้นหาชื่อ / ยศ / หน่วยงาน" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="btn secondary">
            อัปโหลด CSV
            <input
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                addMany(parseGuestCsv(text));
                e.target.value = "";
              }}
            />
          </label>
          <button className="btn secondary" onClick={() => downloadText("รายชื่อผู้ร่วมงาน.csv", guestsToCsv(guests))}>
            ดาวน์โหลด CSV
          </button>
          <button
            className="btn secondary"
            onClick={async () => {
              const text = await fetch("/template-guests.csv").then((r) => r.text());
              addMany(parseGuestCsv(text));
            }}
          >
            โหลดรายชื่อตัวอย่าง
          </button>
          <a className="btn secondary" href="/template-guests.csv" download>
            ไฟล์ตัวอย่าง CSV
          </a>
          <button
            className="btn"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            เพิ่มรายชื่อ
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <strong>หัวคอลัมน์ CSV:</strong> ชื่อจริง, นามสกุล, ชื่อเล่น, ตำแหน่ง, เบอร์โทร, ผู้ติดตาม
      </div>

      <div className="card table-wrap">
        {filtered.length === 0 ? (
          <div className="empty">ยังไม่มีรายชื่อ อัปโหลดไฟล์หรือเพิ่มจากฟอร์มได้เลย</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>ชื่อเล่น</th>
                <th>ตำแหน่ง</th>
                <th>ผู้ติดตาม</th>
                <th>ระดับ</th>
                <th>ประเภท</th>
                <th>หน่วยงาน</th>
                <th>สถานะ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id}>
                  <td>{g.name}</td>
                  <td>{g.nickname || "-"}</td>
                  <td>{g.rank || "-"}</td>
                  <td>{g.companionCount ? `${g.companionCount} คน` : "ไม่มี"}</td>
                  <td>{g.rankLevel}</td>
                  <td>{g.category === "adult" ? "ผู้ใหญ่" : "เยาวชน"}</td>
                  <td>{g.unit || "-"}</td>
                  <td>
                    <span className={`badge ${g.checkedIn ? "ok" : "muted"}`}>
                      {g.checkedIn ? "เช็คอินแล้ว" : "รอเช็คอิน"}
                    </span>
                    {g.source === "onsite" ? <span className="badge">หน้างาน</span> : null}
                    {g.source === "scan" ? <span className="badge">สแกน QR</span> : null}
                  </td>
                  <td>
                    <div className="row">
                      <button
                        className="btn secondary"
                        onClick={() => {
                          setEditing(g);
                          setOpen(true);
                        }}
                      >
                        แก้
                      </button>
                      <button
                        className="btn wine"
                        onClick={() => {
                          if (confirm(`ลบ ${g.name}?`)) {
                            setState({ guests: guests.filter((x) => x.id !== g.id) });
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

      {open ? (
        <div className="modal-back" onClick={() => setOpen(false)}>
          <div className="card modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "แก้ไขรายชื่อ" : "เพิ่มรายชื่อ"}</h3>
            <GuestForm
              key={editing?.id ?? "new"}
              initial={editing ?? undefined}
              submitLabel={editing ? "บันทึก" : "เพิ่ม"}
              onSubmit={(data) => {
                if (editing) {
                  setState({
                    guests: guests.map((g) => (g.id === editing.id ? { ...g, ...data } : g)),
                  });
                } else {
                  setState({
                    guests: [
                      ...guests,
                      {
                        ...data,
                        id: uid(),
                        source: "upload",
                        checkedIn: false,
                        createdAt: new Date().toISOString(),
                      },
                    ],
                  });
                }
                setOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
