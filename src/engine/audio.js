export class SoundController {
  constructor() {
    this.enabled = false;
    this.context = null;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.ensureContext();
      this.playTone({ frequency: 520, duration: 0.08, type: "sine", volume: 0.018 });
    }
  }

  spin() {
    this.playTone({ frequency: 180, duration: 0.08, type: "triangle", volume: 0.028 });
    this.playTone({ frequency: 310, duration: 0.06, type: "sine", volume: 0.018, delay: 0.04 });
  }

  stop(reelIndex) {
    this.playTone({
      frequency: 300 + reelIndex * 36,
      duration: 0.05,
      type: "triangle",
      volume: 0.022 + reelIndex * 0.003
    });
  }

  result(type) {
    if (type === "special" || type === "trio") {
      this.playTone({ frequency: 440, duration: 0.12, type: "sine", volume: 0.03 });
      this.playTone({ frequency: 554, duration: 0.16, type: "sine", volume: 0.028, delay: 0.08 });
      this.playTone({ frequency: 660, duration: 0.22, type: "triangle", volume: 0.022, delay: 0.18 });
      return;
    }

    if (type === "pair" || type === "glimmer") {
      this.playTone({ frequency: 392, duration: 0.1, type: "sine", volume: 0.024 });
      this.playTone({ frequency: 494, duration: 0.14, type: "triangle", volume: 0.018, delay: 0.07 });
      return;
    }

    this.playTone({ frequency: 220, duration: 0.07, type: "triangle", volume: 0.012 });
  }

  ensureContext() {
    if (!this.enabled) {
      return null;
    }

    if (!this.context) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) {
        return null;
      }
      this.context = new AudioContextCtor();
    }

    if (this.context.state === "suspended") {
      this.context.resume();
    }

    return this.context;
  }

  playTone({ frequency, duration, type = "sine", volume = 0.03, delay = 0, attack = 0.01, release = 0.12 }) {
    const context = this.ensureContext();
    if (!context) {
      return;
    }

    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration + release);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + release + 0.02);
  }
}
