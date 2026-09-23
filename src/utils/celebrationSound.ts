export function prepareCelebrationSound(current: AudioContext | null) {
  const AudioContextClass = window.AudioContext;
  const context = current ?? new AudioContextClass();
  if (context.state === "suspended") void context.resume();
  return context;
}

export function playCelebrationSound(context: AudioContext | null) {
  if (!context) return;
  if (context.state === "suspended") void context.resume();

  const start = context.currentTime + 0.03;
  [0, 0.16, 0.34, 0.62].forEach((delay, index) => {
    const time = start + delay;
    const length = Math.floor(context.sampleRate * 0.18);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }

    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    noise.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = 750 + index * 260;
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.32, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
    noise.connect(filter).connect(gain).connect(context.destination);
    noise.start(time);
    noise.stop(time + 0.2);
  });

  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    const time = start + 0.42 + index * 0.1;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.12, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.32);
  });
}
