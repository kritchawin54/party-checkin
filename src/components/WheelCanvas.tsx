import { useEffect, useRef } from "react";
import { SPIN_DURATION_SECONDS } from "../utils/wheel";

type Slice = { label: string; color: string };

const COLORS = ["#ff2d7b", "#5ce1e6", "#ffe566", "#b6ff6a", "#ff8a4c", "#c084fc", "#ff6aa8", "#4ade80", "#38bdf8", "#fbbf24"];

type Props = {
  labels: string[];
  rotation: number;
  size?: number;
  spinning?: boolean;
};

export default function WheelCanvas({ labels, rotation, size = 440, spinning = false }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const slices: Slice[] = labels.length
      ? labels.map((label, i) => ({ label, color: COLORS[i % COLORS.length] }))
      : [{ label: "ยังไม่มีชื่อ", color: "#4a3b2f" }];
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 8;
    const arc = (Math.PI * 2) / slices.length;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(cx, cy);

    slices.forEach((slice, i) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, i * arc, (i + 1) * arc);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(246,234,215,0.35)";
      ctx.stroke();

      ctx.save();
      ctx.rotate(i * arc + arc / 2);
      ctx.fillStyle = "#3b0754";
      ctx.font = `700 ${slices.length > 14 ? 12 : 15}px Mali, sans-serif`;
      ctx.textAlign = "right";
      const text = slice.label.length > 14 ? `${slice.label.slice(0, 13)}…` : slice.label;
      ctx.fillText(text, r - 16, 4);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fillStyle = "#ff2d7b";
    ctx.fill();
    ctx.strokeStyle = "#ffe566";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }, [labels, size]);

  return (
    <canvas
      ref={ref}
      style={{
        transform: `rotate(${rotation}deg)`,
        transition: spinning ? `transform ${SPIN_DURATION_SECONDS}s cubic-bezier(0.12, 0.7, 0.08, 1)` : "none",
      }}
    />
  );
}
