/**
 * Original JARVIS reactor sound.
 * Uses the Web Audio API.
 * No external files or paid services.
 */

export async function playReactorEntrySound(): Promise<void> {
  if (
    typeof window === "undefined" ||
    !window.AudioContext
  ) {
    return;
  }

  let context: AudioContext | null = null;

  try {
    context = new AudioContext();

    if (context.state === "suspended") {
      await context.resume();
    }

    const start = context.currentTime + 0.01;
    const duration = 1.55;
    const end = start + duration;

    // MASTER VOLUME

    const master = context.createGain();

    master.gain.setValueAtTime(0.0001, start);

    master.gain.linearRampToValueAtTime(
      0.17,
      start + 0.23
    );

    master.gain.setValueAtTime(
      0.17,
      start + 0.88
    );

    master.gain.exponentialRampToValueAtTime(
      0.0001,
      end
    );

    master.connect(context.destination);

    // DEEP REACTOR HUM

    const hum = context.createOscillator();
    const humFilter = context.createBiquadFilter();
    const humVolume = context.createGain();

    hum.type = "sawtooth";

    hum.frequency.setValueAtTime(48, start);

    hum.frequency.exponentialRampToValueAtTime(
      96,
      start + 0.92
    );

    hum.frequency.exponentialRampToValueAtTime(
      62,
      end
    );

    humFilter.type = "lowpass";

    humFilter.frequency.setValueAtTime(
      160,
      start
    );

    humFilter.frequency.exponentialRampToValueAtTime(
      760,
      start + 0.94
    );

    humVolume.gain.value = 0.43;

    hum
      .connect(humFilter)
      .connect(humVolume)
      .connect(master);

    hum.start(start);
    hum.stop(end);

    // ENERGY CHARGING FREQUENCY

    const charge = context.createOscillator();
    const chargeVolume = context.createGain();

    charge.type = "sine";

    charge.frequency.setValueAtTime(
      170,
      start
    );

    charge.frequency.exponentialRampToValueAtTime(
      720,
      start + 0.98
    );

    charge.frequency.exponentialRampToValueAtTime(
      270,
      end
    );

    chargeVolume.gain.setValueAtTime(
      0.0001,
      start
    );

    chargeVolume.gain.exponentialRampToValueAtTime(
      0.2,
      start + 0.23
    );

    chargeVolume.gain.exponentialRampToValueAtTime(
      0.0001,
      end
    );

    charge
      .connect(chargeVolume)
      .connect(master);

    charge.start(start);
    charge.stop(end);

    // REACTOR TUNNEL WHOOSH

    const sampleCount = Math.ceil(
      context.sampleRate * duration
    );

    const buffer = context.createBuffer(
      1,
      sampleCount,
      context.sampleRate
    );

    const samples = buffer.getChannelData(0);

    for (let i = 0; i < sampleCount; i++) {
      samples[i] = Math.random() * 2 - 1;
    }

    const rush = context.createBufferSource();
    const rushFilter = context.createBiquadFilter();
    const rushVolume = context.createGain();

    rush.buffer = buffer;

    rushFilter.type = "bandpass";
    rushFilter.Q.value = 0.65;

    rushFilter.frequency.setValueAtTime(
      320,
      start
    );

    rushFilter.frequency.exponentialRampToValueAtTime(
      2100,
      start + 1.0
    );

    rushVolume.gain.setValueAtTime(
      0.0001,
      start
    );

    rushVolume.gain.exponentialRampToValueAtTime(
      0.38,
      start + 0.91
    );

    rushVolume.gain.exponentialRampToValueAtTime(
      0.0001,
      end
    );

    rush
      .connect(rushFilter)
      .connect(rushVolume)
      .connect(master);

    rush.start(start);
    rush.stop(end);

    // TECHNICAL ACTIVATION BEEPS

    for (const [offset, pitch] of [
      [0.09, 520],
      [0.36, 760],
    ]) {
      const beep = context.createOscillator();
      const gain = context.createGain();

      beep.type = "sine";

      beep.frequency.setValueAtTime(
        pitch,
        start + offset
      );

      beep.frequency.exponentialRampToValueAtTime(
        pitch * 1.2,
        start + offset + 0.13
      );

      gain.gain.setValueAtTime(
        0.0001,
        start + offset
      );

      gain.gain.exponentialRampToValueAtTime(
        0.12,
        start + offset + 0.025
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        start + offset + 0.15
      );

      beep
        .connect(gain)
        .connect(master);

      beep.start(start + offset);
      beep.stop(start + offset + 0.16);
    }

    // CLEAN UP

    const audioContext = context;

    window.setTimeout(() => {
      void audioContext.close().catch(() => {});
    }, 1850);
  } catch (error) {
    console.warn(
      "Reactor sound unavailable:",
      error
    );

    if (context) {
      void context.close().catch(() => {});
    }
  }
}