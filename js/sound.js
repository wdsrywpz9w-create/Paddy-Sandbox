'use strict';
// Synthesised sounds.
// Files share one global scope; they load in the order listed in index.html.

// ---------- sound ----------
const sound = (() => {
  let a = null, master = null, scrape, pour, flow, spray, fanG, noise, muted = settings.sound === 'off';
  function chain(type, f, q) {
    const s = a.createBufferSource(); s.buffer = noise; s.loop = true;
    const fl = a.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = a.createGain(); g.gain.value = 0;
    s.connect(fl); fl.connect(g); g.connect(master); s.start(0, Math.random());
    return g;
  }
  return {
    init() {
      if (a) { if (a.state === 'suspended') a.resume(); return; }
      try {
        const AC = window.AudioContext || window.webkitAudioContext; a = new AC();
        noise = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.3 ? 1 : 0.35); // crackly grain noise
        master = a.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(a.destination);
        scrape = chain('bandpass', 1500, 0.8); pour = chain('bandpass', 3400, 1.1); flow = chain('lowpass', 1100, 0.6); spray = chain('highpass', 2600, 0.5); fanG = chain('bandpass', 420, 0.8);
      } catch (e) { a = null; }
    },
    levels(sc, po, fl, spr) {
      if (!a) return; const t = a.currentTime;
      scrape.gain.setTargetAtTime(sc, t, 0.05); pour.gain.setTargetAtTime(po, t, 0.08); flow.gain.setTargetAtTime(fl, t, 0.12);
      spray.gain.setTargetAtTime(spr, t, 0.06);
    },
    found(isDino) {
      if (!a || muted) return; const t = a.currentTime;
      let at = t;
      if (isDino) { // a friendly "rawr!"
        const o = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain(), l = a.createOscillator(), lg = a.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(230, t); o.frequency.linearRampToValueAtTime(300, t + 0.15); o.frequency.linearRampToValueAtTime(150, t + 0.65);
        l.frequency.value = 24; lg.gain.value = 16; l.connect(lg); lg.connect(o.frequency);
        f.type = 'lowpass'; f.Q.value = 3; f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(1600, t + 0.15); f.frequency.linearRampToValueAtTime(450, t + 0.7);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.06); g.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
        o.connect(f); f.connect(g); g.connect(master); o.start(t); l.start(t); o.stop(t + 0.8); l.stop(t + 0.8);
        at = t + 0.7;
      }
      [523.25, 659.25, 783.99, 1046.5].forEach((fq, k) => { // ta-da!
        const o = a.createOscillator(), g = a.createGain(), st = at + k * 0.09;
        o.type = 'triangle'; o.frequency.value = fq;
        g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(0.15, st + 0.02); g.gain.exponentialRampToValueAtTime(0.001, st + 0.45);
        o.connect(g); g.connect(master); o.start(st); o.stop(st + 0.5);
      });
    },
    stamp(idx) {
      if (!a || muted) return; const t = a.currentTime;
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.18);
      g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.3);
      const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
      const base = notes[idx % notes.length];
      [0, 0.09].forEach((dt, k) => {
        const o2 = a.createOscillator(), g2 = a.createGain();
        o2.type = 'triangle'; o2.frequency.value = base * (k ? 1.5 : 1);
        g2.gain.setValueAtTime(0.0001, t + 0.03 + dt); g2.gain.exponentialRampToValueAtTime(0.16, t + 0.05 + dt);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.5 + dt);
        o2.connect(g2); g2.connect(master); o2.start(t + 0.03 + dt); o2.stop(t + 0.6 + dt);
      });
    },
    wave() {
      if (!a || muted) return; const t = a.currentTime;
      const s = a.createBufferSource(); s.buffer = noise;
      const f = a.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.7;
      f.frequency.setValueAtTime(300, t); f.frequency.linearRampToValueAtTime(1800, t + 0.7); f.frequency.linearRampToValueAtTime(400, t + 1.9);
      const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + 0.5); g.gain.linearRampToValueAtTime(0.0001, t + 2);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + 2);
    },
    pickup() {
      if (!a || muted) return; const t = a.currentTime;
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(760, t + 0.1);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.2);
    },
    scoop() {
      if (!a || muted) return; const t = a.currentTime;
      const s = a.createBufferSource(); s.buffer = noise;
      const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 0.9;
      const g = a.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + 0.3);
    },
    ctx() { return a; },
    fanLevel(v) { if (a && fanG) fanG.gain.setTargetAtTime(v, a.currentTime, 0.1); },
    setMuted(m) { muted = m; if (master) master.gain.value = muted ? 0 : 0.9; },
    suspend() { if (a && a.state === 'running') a.suspend(); },
    resume() { if (a && a.state === 'suspended') a.resume(); },
  };
})();
