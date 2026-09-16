import { FormEvent, useState } from "react";
import { RANK_PRESETS, categoryOf, composeName, rankLevelOf } from "../types";
import type { Category, Guest } from "../types";

type Props = {
  initial?: Partial<Guest>;
  submitLabel: string;
  variant?: "admin" | "guest";
  onSubmit: (
    guest: Omit<Guest, "id" | "createdAt" | "source" | "checkedIn" | "checkedInAt"> & { checkedIn?: boolean },
  ) => void;
};

export default function GuestForm({ initial, submitLabel, variant = "admin", onSubmit }: Props) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? initial?.name?.split(/\s+/)[0] ?? "");
  const [lastName, setLastName] = useState(
    initial?.lastName ?? initial?.name?.split(/\s+/).slice(1).join(" ") ?? "",
  );
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [rank, setRank] = useState(initial?.rank ?? "");
  const [rankLevel, setRankLevel] = useState(initial?.rankLevel ?? 3);
  const [category, setCategory] = useState<Category>(initial?.category ?? "adult");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [hasCompanion, setHasCompanion] = useState((initial?.companionCount ?? 0) > 0 ? "yes" : "no");
  const [companionCount, setCompanionCount] = useState(String(initial?.companionCount && initial.companionCount > 0 ? initial.companionCount : 1));

  function handleRank(value: string) {
    setRank(value);
    setRankLevel(rankLevelOf(value));
    setCategory(categoryOf(value));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !nickname.trim() || !rank.trim()) return;
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nickname: nickname.trim(),
      name: composeName(firstName, lastName),
      rank: rank.trim(),
      rankLevel,
      category,
      unit: unit.trim(),
      phone: phone.trim(),
      companionCount: hasCompanion === "yes" ? Math.max(1, Number(companionCount) || 1) : 0,
    });
    if (!initial) {
      setFirstName("");
      setLastName("");
      setNickname("");
      setPhone("");
      setHasCompanion("no");
      setCompanionCount("1");
    }
  }

  return (
    <form className="guest-form" onSubmit={handleSubmit}>
      <div className="row">
        <div className="field">
          <label>
            ชื่อ <span className="req">*</span>
          </label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="ชื่อจริง" />
        </div>
        <div className="field">
          <label>
            นามสกุล <span className="req">*</span>
          </label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="นามสกุล" />
        </div>
      </div>
      <div className="field">
        <label>
          ชื่อเล่น <span className="req">*</span>
        </label>
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} required placeholder="ชื่อที่เพื่อนเรียก" />
      </div>
      <div className="field">
        <label>
          ระดับ / ตำแหน่ง <span className="req">*</span>
        </label>
        <select value={rank} onChange={(e) => handleRank(e.target.value)} required>
          <option value="">เลือกตำแหน่ง</option>
          {rank && !RANK_PRESETS.some((p) => p.rank === rank) ? <option value={rank}>{rank}</option> : null}
          {RANK_PRESETS.map((p) => (
            <option key={p.rank} value={p.rank}>
              {p.rank}
            </option>
          ))}
        </select>
      </div>
      {variant === "admin" ? (
        <div className="row">
          <div className="field">
            <label>ระดับสำหรับคละกลุ่ม (1-10)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={rankLevel}
              onChange={(e) => setRankLevel(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>ประเภท</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              <option value="adult">ผู้ใหญ่ (หัวหน้าทีมได้)</option>
              <option value="youth">เยาวชน / เด็ก</option>
            </select>
          </div>
        </div>
      ) : null}
      {variant === "admin" ? (
        <div className="field">
          <label>หน่วยงาน (ถ้ามี)</label>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="เช่น ภ.จว. ..." />
        </div>
      ) : null}
      <div className="field">
        <label>
          เบอร์โทร <span className="opt">(ไม่บังคับ)</span>
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="08x-xxx-xxxx"
        />
      </div>
      <div className="field">
        <label>มีผู้ติดตามมาด้วยไหม</label>
        <select value={hasCompanion} onChange={(e) => setHasCompanion(e.target.value)} required>
          <option value="no">ไม่มี มาคนเดียว</option>
          <option value="yes">มีผู้ติดตาม</option>
        </select>
      </div>
      {hasCompanion === "yes" ? (
        <div className="field">
          <label>ผู้ติดตามมากี่คน (ไม่นับตัวท่าน)</label>
          <input
            type="number"
            min={1}
            max={20}
            value={companionCount}
            onChange={(e) => setCompanionCount(e.target.value)}
            required
          />
        </div>
      ) : null}
      <button className="btn" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
