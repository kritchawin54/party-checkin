import { useMemo, useState } from "react";
import { useAppState } from "../hooks";
import { setState } from "../store";
import { formBowlingTeams, teamBalanceSummary } from "../utils/grouping";
import { downloadText } from "../utils/csv";
import { guestLabel } from "../types";

export default function BowlingPage() {
  const { guests, teams, settings } = useAppState();
  const [onlyChecked, setOnlyChecked] = useState(true);
  const [teamCount, setTeamCount] = useState(settings.teamCount);

  const pool = useMemo(
    () => guests.filter((g) => (onlyChecked ? g.checkedIn : true)),
    [guests, onlyChecked],
  );
  const summary = useMemo(() => teamBalanceSummary(teams, guests), [teams, guests]);

  function groupNow() {
    const next = formBowlingTeams(pool, teamCount);
    setState({
      teams: next,
      groupedAt: new Date().toISOString(),
      settings: { ...settings, teamCount },
    });
  }

  function exportTeams() {
    const lines = ["ทีม,หัวหน้าทีม,ชื่อ,ยศ,ประเภท,ระดับยศ"];
    for (const row of summary) {
      const captain = row.members.find((m) => m.id === row.team.captainId);
      for (const m of row.members) {
        lines.push(
          [
            row.team.name,
            captain?.name ?? "",
            m.name,
            m.rank,
            m.category === "adult" ? "ผู้ใหญ่" : "เยาวชน",
            String(m.rankLevel),
          ].join(","),
        );
      }
    }
    downloadText("ทีมโบว์ลิ่ง.csv", lines.join("\n"));
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h2>จับกลุ่ม ทำกิจกรรม</h2>
          <p>หัวหน้าทีมเป็นผู้ใหญ่ (ยศสูงก่อน) ที่เหลือคละยศแบบเฉลี่ยทุกทีม</p>
        </div>
        <div className="row">
          <label className="btn secondary">
            <input type="checkbox" checked={onlyChecked} onChange={(e) => setOnlyChecked(e.target.checked)} />{" "}
            ใช้เฉพาะคนเช็คอิน
          </label>
          <div className="field" style={{ minWidth: 120, flex: "0 0 140px" }}>
            <label>จำนวนทีม</label>
            <input
              type="number"
              min={2}
              max={8}
              value={teamCount}
              onChange={(e) => setTeamCount(Number(e.target.value))}
            />
          </div>
          <button className="btn" onClick={groupNow} disabled={pool.length < 2}>
            จับกลุ่มใหม่
          </button>
          <button className="btn secondary" onClick={exportTeams} disabled={!teams.length}>
            ดาวน์โหลดทีม
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        ผู้ใหญ่ในกลุ่มนี้ {pool.filter((g) => g.category === "adult").length} คน · เยาวชน{" "}
        {pool.filter((g) => g.category === "youth").length} คน · รวม {pool.length} คน
      </div>

      {summary.length === 0 ? (
        <div className="card empty">กดจับกลุ่มใหม่เพื่อแบ่งทีมทำกิจกรรม</div>
      ) : (
        <div className="grid cards-3">
          {summary.map(({ team, members, avg, adults }) => {
            const captain = members.find((m) => m.id === team.captainId);
            return (
              <div className="card team-card" key={team.id}>
                <header>
                  <h3>
                    <span className="swatch" style={{ background: team.color, marginRight: 8 }} />
                    <input
                      value={team.name}
                      onChange={(e) =>
                        setState({
                          teams: teams.map((t) => (t.id === team.id ? { ...t, name: e.target.value } : t)),
                        })
                      }
                      style={{ background: "transparent", border: 0, color: "inherit", fontSize: 18, fontWeight: 700 }}
                    />
                  </h3>
                  <span className="badge">เฉลี่ยยศ {avg.toFixed(1)}</span>
                </header>
                <p>
                  หัวหน้าทีม: <strong>{captain ? guestLabel(captain) : "-"}</strong> {captain?.rank ? `· ${captain.rank}` : ""}
                </p>
                <p style={{ color: "var(--muted)" }}>
                  {members.length} คน · ผู้ใหญ่ {adults} · เยาวชน {members.length - adults}
                </p>
                <ul className="member-list">
                  {members.map((m) => (
                    <li key={m.id}>
                      <span>
                        {guestLabel(m)}
                        {m.id === team.captainId ? " ★" : ""}
                      </span>
                      <span className="badge muted">
                        {m.rank || (m.category === "adult" ? "ผู้ใหญ่" : "เยาวชน")} · Lv.{m.rankLevel}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
