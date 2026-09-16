import type { BowlingTeam, Guest } from "../types";
import { TEAM_COLORS } from "../types";
import { uid } from "../store";

function shuffle<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function formBowlingTeams(participants: Guest[], teamCount: number): BowlingTeam[] {
  const n = Math.max(2, Math.min(8, teamCount));
  const teams: BowlingTeam[] = Array.from({ length: n }, (_, i) => ({
    id: uid(),
    name: `ทีม ${i + 1}`,
    color: TEAM_COLORS[i % TEAM_COLORS.length],
    memberIds: [],
  }));

  if (!participants.length) return teams;

  const adults = shuffle(participants.filter((p) => p.category === "adult")).sort(
    (a, b) => b.rankLevel - a.rankLevel || a.name.localeCompare(b.name, "th"),
  );
  const youth = participants.filter((p) => p.category !== "adult");

  const captains = adults.slice(0, n);
  const leftoverAdults = adults.slice(n);

  captains.forEach((c, i) => {
    teams[i].captainId = c.id;
    teams[i].memberIds.push(c.id);
  });

  if (captains.length < n) {
    const remainingPeople = shuffle([...leftoverAdults, ...youth]).sort(
      (a, b) => b.rankLevel - a.rankLevel,
    );
    remainingPeople.slice(0, n - captains.length).forEach((p, idx) => {
      const team = teams[captains.length + idx];
      team.captainId = p.id;
      team.memberIds.push(p.id);
    });
  }

  const assigned = new Set(teams.flatMap((t) => t.memberIds));
  const pool = participants.filter((p) => !assigned.has(p.id));

  const byRank = new Map<number, Guest[]>();
  for (const p of pool) {
    const list = byRank.get(p.rankLevel) ?? [];
    list.push(p);
    byRank.set(p.rankLevel, list);
  }

  const ranks = [...byRank.keys()].sort((a, b) => b - a);
  let teamIdx = 0;
  let dir = 1;
  for (const rank of ranks) {
    for (const person of shuffle(byRank.get(rank) ?? [])) {
      teams[teamIdx].memberIds.push(person.id);
      teamIdx += dir;
      if (teamIdx >= n) {
        teamIdx = n - 1;
        dir = -1;
      } else if (teamIdx < 0) {
        teamIdx = 0;
        dir = 1;
      }
    }
  }

  return teams;
}

export function teamBalanceSummary(teams: BowlingTeam[], guests: Guest[]) {
  return teams.map((team) => {
    const members = team.memberIds
      .map((id) => guests.find((g) => g.id === id))
      .filter((g): g is Guest => Boolean(g));
    const avg =
      members.reduce((sum, m) => sum + m.rankLevel, 0) / Math.max(1, members.length);
    const adults = members.filter((m) => m.category === "adult").length;
    return { team, members, avg, adults };
  });
}
