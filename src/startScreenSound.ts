type ToneType = OscillatorType;

function isBrowserAudioSupported(): boolean {
  return typeof window !== "undefined" && ("AudioContext" in window || "webkitAudioContext" in window);
}

class StartScreenSound {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private enabled = true;

  private getContext(): AudioContext | null {
    if (!this.enabled || !isBrowserAudioSupported()) {
      return null;
    }

    if (this.context) {
      return this.context;
    }

    const AudioCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) {
      return null;
    }

    this.context = new AudioCtor();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.24;

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

  playHover() {
    void this.triggerTone(520, 0.09, "triangle", 0.08);
  }

  playClick() {
    void this.triggerTone(320, 0.11, "triangle", 0.1);
    void this.triggerTone(460, 0.1, "sine", 0.06, 0.05);
  }

  playStart() {
    void this.triggerTone(220, 0.22, "triangle", 0.11);
    void this.triggerTone(277, 0.22, "triangle", 0.1, 0.09);
    void this.triggerTone(329, 0.24, "triangle", 0.1, 0.18);
    void this.triggerTone(440, 0.28, "sine", 0.08, 0.28);
  }
}

export function createStartScreenSound() {
  return new StartScreenSound();
}
