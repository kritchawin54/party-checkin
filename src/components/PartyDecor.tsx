const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i % 9) * 0.35}s`,
  duration: `${4.5 + (i % 5)}s`,
  color: ["#ff4d8d", "#ffe066", "#5ce1e6", "#fff8e7", "#ff8a4c", "#ffffff"][i % 6],
  rotate: `${(i * 40) % 360}deg`,
}));

const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  left: `${8 + ((i * 17) % 84)}%`,
  top: `${6 + ((i * 23) % 78)}%`,
  delay: `${(i % 7) * 0.28}s`,
  size: `${8 + (i % 4) * 4}px`,
}));

type Props = {
  vibe?: "full" | "light";
};

export default function PartyDecor({ vibe = "full" }: Props) {
  return (
    <div className={`party-decor ${vibe}`} aria-hidden="true">
      <img className="sticker mascot" src="/party/mascot.png" alt="" />
      <img className="sticker mask-left" src="/party/mask.svg" alt="" />
      <img className="sticker mask-right" src="/party/mask.svg" alt="" />
      <img className="sticker flowers-right" src="/party/flowers.png" alt="" />
      <img className="sticker balloons" src="/party/balloons.png" alt="" />
      <img className="sticker bowling" src="/party/bowling.png" alt="" />
      <img className="sticker bowtie" src="/party/bowtie.svg" alt="" />
      <div className="sparks">
        {SPARKS.map((spark, i) => (
          <span
            key={i}
            className="spark"
            style={{
              left: spark.left,
              top: spark.top,
              width: spark.size,
              height: spark.size,
              animationDelay: spark.delay,
            }}
          />
        ))}
      </div>
      <div className="confetti">
        {CONFETTI.map((piece, i) => (
          <span
            key={i}
            style={{
              left: piece.left,
              animationDelay: piece.delay,
              animationDuration: piece.duration,
              background: piece.color,
              transform: `rotate(${piece.rotate})`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
