type Props = {
  size?: "hero" | "compact";
};

export default function EventTitle({ size = "hero" }: Props) {
  return (
    <div className={`event-title ${size}`}>
      <p className="event-kicker">Masquerade · Tuxedo Night</p>
      <p className="event-party">งานเลี้ยง ปาร์ตี้ หน้ากากทักซิโด</p>
      <h1>ยินดีตำแหน่งใหม่</h1>
      <p className="event-sub">
        <span className="event-name">รองด้วง</span>
        <span className="event-bigger">ใหญ่กว่าเดิม</span>
      </p>
    </div>
  );
}
