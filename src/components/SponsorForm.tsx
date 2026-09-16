import { FormEvent, useState } from "react";
import type { Prize } from "../types";

type Draft = Omit<Prize, "id" | "createdAt" | "source">;

type Props = {
  initial?: Partial<Prize>;
  submitLabel: string;
  onSubmit: (prize: Draft) => void | Promise<void>;
};

export default function SponsorForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1));
  const [sponsorName, setSponsorName] = useState(initial?.sponsorName ?? "");
  const [sponsorOrg, setSponsorOrg] = useState(initial?.sponsorOrg ?? "");
  const [sponsorPhone, setSponsorPhone] = useState(initial?.sponsorPhone ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !sponsorName.trim()) return;
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        quantity: Math.max(1, Number(quantity) || 1),
        sponsorName: sponsorName.trim(),
        sponsorOrg: sponsorOrg.trim(),
        sponsorPhone: sponsorPhone.trim(),
        note: note.trim(),
      });
      if (!initial) {
        setName("");
        setQuantity("1");
        setSponsorName("");
        setSponsorOrg("");
        setSponsorPhone("");
        setNote("");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="guest-form" onSubmit={handleSubmit}>
      <div className="field">
        <label>
          ของรางวัล <span className="req">*</span>
        </label>
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="เช่น กระเช้าของขวัญ, น้ำมัน, เงินสด" />
      </div>
      <div className="row">
        <div className="field">
          <label>
            ชื่อผู้สนับสนุน <span className="req">*</span>
          </label>
          <input value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} required placeholder="ชื่อคน / ร้าน / หน่วยงาน" />
        </div>
        <div className="field">
          <label>จำนวน</label>
          <input type="number" min={1} max={99} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </div>
      </div>
      <div className="field">
        <label>
          หน่วยงาน / ร้าน <span className="opt">(ไม่บังคับ)</span>
        </label>
        <input value={sponsorOrg} onChange={(e) => setSponsorOrg(e.target.value)} placeholder="เช่น ภ.จว. ... หรือ ร้านป้าแดง" />
      </div>
      <div className="field">
        <label>
          เบอร์ติดต่อ <span className="opt">(ไม่บังคับ)</span>
        </label>
        <input value={sponsorPhone} onChange={(e) => setSponsorPhone(e.target.value)} inputMode="tel" placeholder="08x-xxx-xxxx" />
      </div>
      <div className="field">
        <label>
          รายละเอียดเพิ่ม <span className="opt">(ไม่บังคับ)</span>
        </label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="ขนาด สี ยี่ห้อ หรือหมายเหตุ" />
      </div>
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "กำลังบันทึก..." : submitLabel}
      </button>
    </form>
  );
}
