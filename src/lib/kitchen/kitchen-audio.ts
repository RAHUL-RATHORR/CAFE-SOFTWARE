/**
 * Web Audio API chime synthesizer for Kitchen Display System (KDS).
 * Generates an elegant, subtle two-tone notification without relying on external mp3/wav files.
 */

import { KITCHEN_STORAGE_KEYS } from "@/config/kitchen";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {
      /* Audio context resume postponed until user interaction */
    });
  }
  return audioCtx;
}

export function isKitchenSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const val = localStorage.getItem(KITCHEN_STORAGE_KEYS.soundMuted);
    return val === "true";
  } catch {
    return false;
  }
}

export function setKitchenSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KITCHEN_STORAGE_KEYS.soundMuted, muted ? "true" : "false");
  } catch {
    /* ignore storage errors */
  }
}

/**
 * Plays a pleasant, subtle two-tone order notification bell.
 */
export function playKitchenChime(): void {
  if (isKitchenSoundMuted()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);

    // Tone 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.66);
  } catch {
    // Audio playback not permitted or unavailable
  }
}
