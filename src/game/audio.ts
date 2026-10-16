/**
 * Lagos: After Zero - Procedural Web Audio Sound Synthesizer
 * Zero-dependency, zero-404 audio engine using browser Web Audio API
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  // Ambient nodes
  private windNode: AudioNode | null = null;
  private cricketTimer: number | null = null;
  private rainNode: AudioNode | null = null;
  private heartbeatOsc: OscillatorNode | null = null;
  private isHeartbeatRunning: boolean = false;

  private volumes = {
    master: 0.8,
    ambient: 0.6,
    sfx: 0.85,
  };

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volumes.master, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.volumes.ambient, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.volumes.sfx, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.startAmbientWind();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolumes(master: number, sfx: number, ambient: number) {
    this.volumes.master = THREE_CLAMP(master, 0, 1);
    this.volumes.sfx = THREE_CLAMP(sfx, 0, 1);
    this.volumes.ambient = THREE_CLAMP(ambient, 0, 1);

    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (this.masterGain) this.masterGain.gain.setTargetAtTime(this.volumes.master, now, 0.05);
      if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(this.volumes.sfx, now, 0.05);
      if (this.ambientGain) this.ambientGain.gain.setTargetAtTime(this.volumes.ambient, now, 0.05);
    }
  }

  /**
   * Procedural filtered pink/brown noise for abandoned city wind
   */
  private startAmbientWind() {
    if (!this.ctx || !this.ambientGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.15;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to sound like distant wind through coastal city
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.ambientGain);
    whiteNoise.start();

    this.windNode = windGain;
  }

  /**
   * Trigger ambient night insect chirps (Lagoon/tropics atmosphere)
   */
  public triggerCricket() {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(4500 + Math.random() * 400, now);

    // Rapid amplitude modulation
    const mod = this.ctx.createOscillator();
    mod.frequency.setValueAtTime(35, now);
    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(0.8, now);
    mod.connect(modGain.gain);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ambientGain);
    osc.start(now);
    mod.start(now);
    osc.stop(now + 0.4);
    mod.stop(now + 0.4);
  }

  /**
   * Footstep sound
   */
  public playFootstep(isSprinting: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    
    // Thud / surface friction
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const pitch = isSprinting ? 95 : 75;
    osc.frequency.setValueAtTime(pitch + (Math.random() * 20 - 10), now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    gain.gain.setValueAtTime(isSprinting ? 0.28 : 0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Flashlight click
   */
  public playFlashlightClick(turnOn: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(turnOn ? 1800 : 1200, now);
    osc.frequency.exponentialRampToValueAtTime(turnOn ? 2400 : 800, now + 0.03);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Item pickup sound (metallic scavenge / rustle)
   */
  public playPickup() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    
    // Gentle 2-tone melodic chime + soft rustle
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(520, now);
    osc1.frequency.exponentialRampToValueAtTime(780, now + 0.1);
    osc2.frequency.setValueAtTime(1040, now + 0.05);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  }

  /**
   * Consume food or water
   */
  public playConsume(isDrink: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isDrink ? 'sine' : 'triangle';
    
    // Gulp / chew pitch sweep
    osc.frequency.setValueAtTime(isDrink ? 380 : 220, now);
    osc.frequency.exponentialRampToValueAtTime(isDrink ? 260 : 140, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * Crafting hammer & metal strike
   */
  public playCrafting() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    
    // Strike 1
    this.playMetalClink(now, 820);
    // Strike 2
    this.playMetalClink(now + 0.12, 1100);
    // Strike 3
    this.playMetalClink(now + 0.25, 750);
  }

  private playMetalClink(startTime: number, freq: number) {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, startTime + 0.08);

    gain.gain.setValueAtTime(0.22, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(startTime);
    osc.stop(startTime + 0.14);
  }

  /**
   * Radio static and mysterious Zero Hour transmission broadcast
   */
  public playRadioStatic(durationMs: number = 2500) {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const durSec = durationMs / 1000;

    // Bandpass noise
    const bufferSize = Math.floor(this.ctx.sampleRate * durSec);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(3.5, now);

    // Eerie carrier tone
    const carrier = this.ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(680, now);
    carrier.frequency.linearRampToValueAtTime(740, now + durSec * 0.5);
    carrier.frequency.linearRampToValueAtTime(620, now + durSec);

    const carrierGain = this.ctx.createGain();
    carrierGain.gain.setValueAtTime(0.08, now);

    const masterRadioGain = this.ctx.createGain();
    masterRadioGain.gain.setValueAtTime(0.3, now);
    masterRadioGain.gain.exponentialRampToValueAtTime(0.001, now + durSec);

    noise.connect(filter);
    filter.connect(masterRadioGain);
    carrier.connect(carrierGain);
    carrierGain.connect(masterRadioGain);
    masterRadioGain.connect(this.sfxGain);

    noise.start(now);
    carrier.start(now);
    noise.stop(now + durSec);
    carrier.stop(now + durSec);
  }

  /**
   * Low-health heartbeat pulse
   */
  public setHeartbeat(active: boolean) {
    if (active === this.isHeartbeatRunning) return;
    this.isHeartbeatRunning = active;

    if (active && this.ctx && this.sfxGain) {
      this.pulseHeartbeat();
    }
  }

  private pulseHeartbeat = () => {
    if (!this.isHeartbeatRunning || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);

    // Second beat of 'lub-dub'
    setTimeout(() => {
      if (!this.isHeartbeatRunning || !this.ctx || !this.sfxGain) return;
      const t2 = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(50, t2);
      osc2.frequency.exponentialRampToValueAtTime(30, t2 + 0.1);

      gain2.gain.setValueAtTime(0.3, t2);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.15);

      osc2.connect(gain2);
      gain2.connect(this.sfxGain);
      osc2.start(t2);
      osc2.stop(t2 + 0.18);
    }, 220);

    setTimeout(() => {
      if (this.isHeartbeatRunning) {
        this.pulseHeartbeat();
      }
    }, 1100);
  };

  /**
   * UI Click
   */
  public playUIClick() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Mission completed fanfare / discovery chord
   */
  public playObjectiveCompleted() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.09;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }
}

function THREE_CLAMP(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export const soundEngine = new SoundEngine();
