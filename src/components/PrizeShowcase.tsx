const PRIZES = [
  { src: "/party/prize-house.png", name: "บ้านหลังงาม", tag: "แสนล้านวิว" },
  { src: "/party/prize-benz.png", name: "เบนซ์คันหรู", tag: "ขับออกได้เลย" },
  { src: "/party/prize-lady.png", name: "นางงามปาร์ตี้", tag: "พลาดไม่ได้" },
];

type Props = {
  mode: "teaser" | "jackpot";
  winnerName?: string;
};

export default function PrizeShowcase({ mode, winnerName }: Props) {
  if (mode === "teaser") {
    return (
      <div className="prize-teaser">
        <div className="prize-teaser-title">รางวัลใหญ่ในงานนี้</div>
        <div className="prize-row">
          {PRIZES.map((p) => (
            <figure key={p.name} className="prize-card">
              <img src={p.src} alt={p.name} />
              <figcaption>{p.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="jackpot flash">
      <img className="bang bang-l" src="/party/prize-bang.png" alt="" />
      <img className="bang bang-r" src="/party/prize-bang.png" alt="" />
      <p className="jackpot-kicker">ปะทัดแตก! ยินดีตำแหน่งใหม่</p>
      <h3>{winnerName}</h3>
      <p className="jackpot-sub">รับสิทธิ์ลุ้นรางวัลใหญ่ไปเลย...</p>
      <div className="prize-row jackpot-row">
        {PRIZES.map((p) => (
          <figure key={p.name} className="prize-card pop-in">
            <img src={p.src} alt={p.name} />
            <figcaption>
              <strong>{p.name}</strong>
              <span>{p.tag}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="joke-note">
        <strong>ล้อเล่นนะ! 🤣</strong>
        <p>บ้าน เบนซ์ นางงาม ยังอยู่ในฝัน แต่ตำแหน่งรองด้วงใหญ่กว่าเดิมแล้ว ของจริงรอจับฉลากบนเวที</p>
      </div>
    </div>
  );
}
