import type { CSSProperties } from "react";

const COLORS = ["#ffe566", "#ff2d7b", "#5ce1e6", "#b6ff6a", "#ff8a4c", "#ffffff"];
const BURSTS = [
  { left: 22, top: 28, delay: 0 },
  { left: 50, top: 18, delay: 0.2 },
  { left: 78, top: 30, delay: 0.4 },
  { left: 34, top: 58, delay: 0.6 },
  { left: 68, top: 60, delay: 0.8 },
];

type SparkStyle = CSSProperties & {
  "--spark-x": string;
  "--spark-y": string;
  "--spark-color": string;
  "--spark-delay": string;
};

export default function WinnerCelebration() {
  return (
    <div className="winner-celebration" aria-hidden="true">
      {BURSTS.flatMap((burst, burstIndex) =>
        Array.from({ length: 18 }, (_, sparkIndex) => {
          const angle = (Math.PI * 2 * sparkIndex) / 18;
          const distance = 70 + (sparkIndex % 4) * 18;
          const style: SparkStyle = {
            left: `${burst.left}%`,
            top: `${burst.top}%`,
            "--spark-x": `${Math.cos(angle) * distance}px`,
            "--spark-y": `${Math.sin(angle) * distance}px`,
            "--spark-color": COLORS[(burstIndex + sparkIndex) % COLORS.length],
            "--spark-delay": `${burst.delay + (sparkIndex % 3) * 0.025}s`,
          };
          return <span className="celebration-spark" style={style} key={`${burstIndex}-${sparkIndex}`} />;
        }),
      )}
    </div>
  );
}
