type ToneType = OscillatorType;

function isBrowserAudioSupported(): boolean {
  return typeof window !== "undefined" && ("AudioContext" in window || "webkitAudioContext" in window);
}

class GameSound {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private jungleOscillators: OscillatorNode[] = [];
  private jungleGains: GainNode[] = [];
  private enabled = true;

  private getContext(): AudioContext | null {
    if (!this.enabled || !isBrowserAudioSupported()) {
      return null;
    }

    if (this.context) {
      return this.context;
    }

    const AudioCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) {
      return null;
    }

    this.context = new AudioCtor();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.3;

    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-20, this.context.currentTime);
    this.compressor.knee.setValueAtTime(20, this.context.currentTime);
    this.compressor.ratio.setValueAtTime(8, this.context.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.context.currentTime);
    this.compressor.release.setValueAtTime(0.24, this.context.currentTime);

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.context.destination);
    return this.context;
  }

  private async triggerTone(
    frequency: number,
    durationSeconds: number,
    type: ToneType,
    gainPeak: number,
    delaySeconds = 0,
  ): Promise<void> {
    const context = this.getContext();
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      await context.resume();
    }

    if (!this.masterGain) {
      return;
    }

    const startAt = context.currentTime + delaySeconds;
    const stopAt = startAt + durationSeconds;

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(gainPeak, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

    oscillator.connect(gain);
    gain.connect(this.masterGain);

    oscillator.start(startAt);
    oscillator.stop(stopAt + 0.02);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopJungleAmbience();
    }
  }

  async prime() {
    const context = this.getContext();
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      await context.resume();
    }
  }

  // Move placed sound - clean click
  playMoveClick() {
    void this.triggerTone(280, 0.12, "triangle", 0.12);
    void this.triggerTone(420, 0.08, "sine", 0.08, 0.04);
  }

  // Burst effect - when cells explode
  playBurst() {
    void this.triggerTone(520, 0.15, "sine", 0.14);
    void this.triggerTone(780, 0.12, "triangle", 0.1, 0.03);
    void this.triggerTone(1040, 0.1, "sine", 0.08, 0.06);
  }

  // Chain reaction - impact sound
  playChainImpact() {
    void this.triggerTone(340, 0.08, "sine", 0.1);
    void this.triggerTone(680, 0.06, "triangle", 0.08, 0.02);
  }

  // Combo multiplier - uplifting sound
  playCombo() {
    void this.triggerTone(440, 0.1, "sine", 0.09);
    void this.triggerTone(550, 0.12, "triangle", 0.1, 0.05);
    void this.triggerTone(660, 0.14, "sine", 0.1, 0.1);
  }

  // Jungle ambience - looping background
  startJungleAmbience() {
    const context = this.getContext();
    if (!context || !this.masterGain) {
      return;
    }

    if (context.state === "suspended") {
      void context.resume();
    }

    // Stop existing jungle sounds
    this.stopJungleAmbience();

    // Create multiple low-frequency tones for jungle ambience
    const frequencies = [45, 60, 85, 110];
    const types: ToneType[] = ["sine", "triangle", "sine", "square"];

    frequencies.forEach((freq, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = types[index];
      oscillator.frequency.setValueAtTime(freq, context.currentTime);

      // Add slight variations to frequencies for more organic feel
      if (index % 2 === 0) {
        const lfo = context.createOscillator();
        const lfoGain = context.createGain();

        lfo.frequency.setValueAtTime(0.3 + index * 0.1, context.currentTime);
        lfoGain.gain.setValueAtTime(freq * 0.02, context.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);

        lfo.start();
        this.jungleOscillators.push(lfo);
      }

      // Very low volume for ambient
      gain.gain.setValueAtTime(0.02, context.currentTime);

      oscillator.connect(gain);
      if (this.masterGain) {
        gain.connect(this.masterGain);
      } else {
        gain.connect(context.destination);
      }

      oscillator.start();
      this.jungleOscillators.push(oscillator);
      this.jungleGains.push(gain);
    });
  }

  stopJungleAmbience() {
    const context = this.getContext();
    if (!context) {
      return;
    }

    this.jungleOscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });

    this.jungleOscillators = [];
    this.jungleGains = [];
  }
}

export function createGameSound() {
  return new GameSound();
}
