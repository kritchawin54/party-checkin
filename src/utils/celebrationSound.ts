export function prepareCelebrationSound(current: AudioContext | null) {
  const AudioContextClass = window.AudioContext;
  const context = current ?? new AudioContextClass();
  if (context.state === "suspended") void context.resume();
  return context;
}

export function startWheelSpinSound(context: AudioContext | null, delayMs: number, durationMs: number) {
  if (!context) return () => undefined;
  if (context.state === "suspended") void context.resume();

  const start = context.currentTime + Math.max(0, delayMs) / 1000;
  const duration = durationMs / 1000;
  const end = start + duration;
  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();
  const sources: OscillatorNode[] = [];
  master.gain.setValueAtTime(0.0001, start);
  master.gain.exponentialRampToValueAtTime(0.42, start + 0.08);
  master.gain.setValueAtTime(0.42, Math.max(start + 0.09, end - 0.12));
  master.gain.exponentialRampToValueAtTime(0.0001, end);
  compressor.threshold.value = -20;
  compressor.knee.value = 14;
  compressor.ratio.value = 5;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.16;
  master.connect(compressor).connect(context.destination);

  const notes = [261.63, 329.63, 392, 523.25, 392, 659.25];
  let elapsed = 0;
  let beat = 0;
  while (elapsed < duration - 0.08) {
    const progress = elapsed / duration;
    const interval = 0.26 - progress * 0.14;
    const time = start + elapsed;
    const note = context.createOscillator();
    const noteGain = context.createGain();
    note.type = beat % 3 === 0 ? "square" : "triangle";
    note.frequency.setValueAtTime(notes[beat % notes.length] * (progress > 0.72 ? 1.5 : 1), time);
    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.exponentialRampToValueAtTime(0.08 + progress * 0.055, time + 0.008);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + Math.min(0.12, interval * 0.78));
    note.connect(noteGain).connect(master);
    note.start(time);
    note.stop(time + Math.min(0.14, interval * 0.85));
    sources.push(note);

    if (beat % 4 === 0) {
      const drum = context.createOscillator();
      const drumGain = context.createGain();
      drum.type = "sine";
      drum.frequency.setValueAtTime(155, time);
      drum.frequency.exponentialRampToValueAtTime(58, time + 0.1);
      drumGain.gain.setValueAtTime(0.16, time);
      drumGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
      drum.connect(drumGain).connect(master);
      drum.start(time);
      drum.stop(time + 0.13);
      sources.push(drum);
    }

    elapsed += interval;
    beat += 1;
  }

  let stopped = false;
  const cleanupTimer = window.setTimeout(() => {
    master.disconnect();
    compressor.disconnect();
  }, Math.max(0, delayMs) + durationMs + 700);

  return () => {
    if (stopped) return;
    stopped = true;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    for (const source of sources) {
      try {
        source.stop(now + 0.07);
      } catch {
        // source already ended
      }
    }
    window.clearTimeout(cleanupTimer);
    window.setTimeout(() => {
      master.disconnect();
      compressor.disconnect();
    }, 120);
  };
}

export function playCelebrationSound(context: AudioContext | null) {
  if (!context) return;
  if (context.state === "suspended") void context.resume();

  const start = context.currentTime + 0.03;
  const duration = 5;
  const master = context.createGain();
  const compressor = context.createDynamicsCompressor();
  master.gain.value = 0.9;
  compressor.threshold.value = -18;
  compressor.knee.value = 12;
  compressor.ratio.value = 6;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.2;
  master.connect(compressor).connect(context.destination);

  Array.from({ length: 110 }, (_, index) => {
    const progress = index / 110;
    const time = start + progress * duration + Math.random() * 0.055;
    const clapDuration = 0.055 + Math.random() * 0.045;
    const length = Math.floor(context.sampleRate * clapDuration);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      const attack = Math.min(1, i / (context.sampleRate * 0.004));
      data[i] = (Math.random() * 2 - 1) * attack * Math.pow(1 - i / length, 3);
    }

    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const pan = context.createStereoPanner();
    noise.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = 1200 + Math.random() * 1800;
    filter.Q.value = 0.55 + Math.random() * 0.5;
    const swell = 0.72 + Math.sin(progress * Math.PI) * 0.28;
    gain.gain.setValueAtTime((0.11 + Math.random() * 0.1) * swell, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + clapDuration);
    pan.pan.value = Math.random() * 1.6 - 0.8;
    noise.connect(filter).connect(gain).connect(pan).connect(master);
    noise.start(time);
    noise.stop(time + clapDuration);
  });

  window.setTimeout(() => {
    master.disconnect();
    compressor.disconnect();
  }, (duration + 1) * 1000);
}
