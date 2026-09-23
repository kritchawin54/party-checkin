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
