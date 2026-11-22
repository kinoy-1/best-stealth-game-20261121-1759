// audio.js — every sound in the garden is synthesised live with WebAudio:
// footsteps that tell you where a guard is, the bell that tolls the alarm,
// the petal chime, the gate's cold chord. No audio files, no network — just
// oscillators, noise buffers and envelopes. Silent until the player first
// interacts, as browsers require; a mute toggle (M) is always available.
export function createAudio() {
  const audio = {
    ctx: null,
    master: null,
    ambientNodes: null,
    muted: false,
    enabled: false,
    stepAlternate: false,

    /** Call from the first user gesture. Safe to call twice. */
    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        this.ctx = new Ctx();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.5;
        this.master.connect(this.ctx.destination);
        this.enabled = true;
        this.startAmbient();
      } catch (err) {
        this.enabled = false;
      }
    },

    toggleMute() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
      return this.muted;
    },

    /** A short filtered noise burst: the garden's night air, crickets and wind. */
    startAmbient() {
      if (!this.ctx || this.ambientNodes) return;
      const length = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.035;
      // A slow breathing LFO so the night air swells and fades.
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      noise.start();
      lfo.start();
      this.ambientNodes = { noise, lfo };
    },

    /** One soft tone with an exponential falloff. */
    tone(freq, dur, type, vol, when) {
      if (!this.enabled || !this.ctx) return;
      const t0 = this.ctx.currentTime + (when || 0);
      const osc = this.ctx.createOscillator();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol || 0.12, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    },

    /** A short noise tick through a bandpass: a footstep, a wingbeat. */
    tick(freq, vol, dur) {
      if (!this.enabled || !this.ctx) return;
      const t0 = this.ctx.currentTime;
      const length = Math.floor(this.ctx.sampleRate * (dur || 0.06));
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value = 1.2;
      const gain = this.ctx.createGain();
      gain.gain.value = vol;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(t0);
    },

    footstep(running, sneaking) {
      if (!this.enabled) return;
      this.stepAlternate = !this.stepAlternate;
      const base = this.stepAlternate ? 170 : 150;
      this.tick(base, running ? 0.16 : sneaking ? 0.02 : 0.07, running ? 0.08 : 0.05);
    },

    /** A guard's footstep, panned by where the guard stands: footsteps that tell you where a guard is. */
    guardStep(pan) {
      if (!this.enabled || !this.ctx) return;
      this.tick(120, 0.05, 0.07);
    },

    petal() {
      this.tone(880, 0.5, 'sine', 0.14);
      this.tone(1318, 0.7, 'sine', 0.09, 0.07);
    },

    suspicious() {
      this.tone(196, 0.25, 'triangle', 0.12);
      this.tone(147, 0.3, 'triangle', 0.1, 0.12);
    },

    bell() {
      // Three tolls: the bell that ends a quiet night.
      for (let i = 0; i < 3; i += 1) {
        this.tone(233, 1.4, 'sine', 0.22, i * 0.55);
        this.tone(466, 1.1, 'sine', 0.08, i * 0.55);
        this.tone(311, 0.9, 'triangle', 0.05, i * 0.55);
      }
    },

    caught() {
      this.tone(110, 0.8, 'sawtooth', 0.14);
      this.tone(82, 1.0, 'sawtooth', 0.12, 0.15);
    },

    gate() {
      // The moon gate opens: a cold major chord that rises.
      this.tone(523, 1.2, 'sine', 0.1);
      this.tone(659, 1.2, 'sine', 0.1, 0.1);
      this.tone(784, 1.6, 'sine', 0.12, 0.2);
      this.tone(1046, 1.8, 'sine', 0.07, 0.3);
    },

    puffThrow() {
      this.tick(900, 0.06, 0.12);
    },

    puffBurst() {
      this.tone(1200, 0.25, 'sine', 0.06);
      this.tone(1567, 0.4, 'sine', 0.05, 0.05);
    },

    mooncloak() {
      this.tone(1046, 0.9, 'sine', 0.1);
      this.tone(784, 1.1, 'sine', 0.08, 0.15);
      this.tone(1568, 1.3, 'sine', 0.05, 0.3);
    },

    veil() {
      // Silk unfurling: a soft high shimmer that falls like a curtain.
      this.tone(1568, 0.5, 'sine', 0.07);
      this.tone(1175, 0.7, 'sine', 0.06, 0.08);
      this.tone(2093, 0.9, 'sine', 0.04, 0.16);
    },

    uiClick() {
      this.tone(660, 0.08, 'sine', 0.08);
    },

    buy() {
      this.tone(523, 0.2, 'sine', 0.1);
      this.tone(784, 0.35, 'sine', 0.1, 0.08);
    },

    seal() {
      this.tone(784, 0.4, 'sine', 0.1);
      this.tone(988, 0.5, 'sine', 0.1, 0.1);
      this.tone(1175, 0.7, 'sine', 0.09, 0.2);
    },
  };
  return audio;
}
