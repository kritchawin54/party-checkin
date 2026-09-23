import { useEffect, useState } from "react";
import { useAppState } from "../hooks";
import { DEFAULT_SETTINGS } from "../types";

type Props = {
  size?: "hero" | "compact";
  title?: string;
};

const HEADLINE = "ยินดีตำแหน่งใหม่";
const BIGGER = "ใหญ่กว่าเดิม";

function splitEventName(name: string) {
  const clean = name.replace(/\s+/g, " ").trim();
  const showKicker = /หน้ากาก|ทักซิโด|ปาร์ตี้|ปาตี้/i.test(clean);
  const idx = clean.indexOf(HEADLINE);
  if (idx < 0) {
    return { showKicker, party: "", headline: clean || DEFAULT_SETTINGS.eventName, nick: "", bigger: "" };
  }
  const party = clean.slice(0, idx).trim();
  let after = clean.slice(idx + HEADLINE.length).trim();
  let bigger = "";
  if (after.endsWith(BIGGER)) {
    bigger = BIGGER;
    after = after.slice(0, -BIGGER.length).trim();
  }
  return { showKicker, party, headline: HEADLINE, nick: after, bigger };
}

export default function EventTitle({ size = "hero", title }: Props) {
  const { settings } = useAppState();
  const [remoteName, setRemoteName] = useState("");

  useEffect(() => {
    if (title) return;
    let stop = false;
    async function load() {
      try {
        const res = await fetch("/api/info");
        if (!res.ok) return;
        const data = (await res.json()) as { eventName?: string };
        if (!stop && data.eventName) setRemoteName(data.eventName);
      } catch {
        // keep last name
      }
    }
    void load();
    const timer = window.setInterval(load, 3000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [title]);

  const name = (title || remoteName || settings.eventName || DEFAULT_SETTINGS.eventName).trim();
  const parts = splitEventName(name);

  useEffect(() => {
    if (name) document.title = name;
  }, [name]);

  return (
    <div className={`event-title ${size}`}>
      {parts.showKicker ? <p className="event-kicker">Masquerade · Tuxedo Night</p> : null}
      {parts.party ? <p className="event-party">{parts.party}</p> : null}
      <h1>{parts.headline}</h1>
      {parts.nick || parts.bigger ? (
        <p className="event-sub">
          {parts.nick ? <span className="event-name">{parts.nick}</span> : null}
          {parts.bigger ? <span className="event-bigger">{parts.bigger}</span> : null}
        </p>
      ) : null}
    </div>
  );
}
