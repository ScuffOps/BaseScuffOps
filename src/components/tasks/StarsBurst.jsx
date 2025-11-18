
import { useEffect, useMemo } from "react";

// Moved GOLD to module scope to avoid hook dependency warning
const GOLD = ["#f59e0b", "#fbbf24", "#fde68a", "#fcd34d", "#ffedd5"];

export default function StarsBurst({ x = window.innerWidth / 2, y = window.innerHeight / 2, onDone }) {
  // Generate more particles with wider spread
  const sparks = useMemo(
    () =>
      Array.from({ length: 120 }).map((_, i) => ({
        id: i,
        // Max spread much larger for full-screen feel
        dx: (Math.random() - 0.5) * 900,
        dy: (Math.random() - 0.5) * 600 - 80,
        rot: (Math.random() - 0.5) * 540,
        delay: Math.random() * 70,
        size: 10 + Math.random() * 18,
        color: GOLD[Math.floor(Math.random() * GOLD.length)],
        dur: 900 + Math.random() * 700, // vary duration
        opacity: 0.9 + Math.random() * 0.2
      })),
    []
  );

  useEffect(() => {
    // Auto-close after animations complete
    const t = setTimeout(() => onDone && onDone(), 1600);
    return () => clearTimeout(t);
  }, [onDone]);

  useEffect(() => {
    // Play a cute sparkle sound using Web Audio API (no external files)
    // Short two-chirp sparkle with soft envelope
    function playSparkle() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const master = ctx.createGain();
      master.gain.value = 0.25; // overall volume
      master.connect(ctx.destination);

      // Chirp 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(900, now);
      osc1.frequency.exponentialRampToValueAtTime(2000, now + 0.16);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.7, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc1.connect(gain1).connect(master);
      osc1.start(now);
      osc1.stop(now + 0.22);

      // Chirp 2 (slightly delayed, higher)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1200, now + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(2600, now + 0.22);
      gain2.gain.setValueAtTime(0, now + 0.06);
      gain2.gain.linearRampToValueAtTime(0.6, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
      osc2.connect(gain2).connect(master);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.3);

      // Soft noise burst for sparkle effect
      const bufferSize = 0.2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, now + 0.02);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      noise.connect(noiseGain).connect(master);
      noise.start(now + 0.02);
      noise.stop(now + 0.28);

      // Clean up context after a bit to release resources
      setTimeout(() => {
        try { ctx.close(); } catch (_) {}
      }, 600);
    }

    // Some browsers require a user gesture; calling after user action (checkbox click) is fine
    playSparkle();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999
      }}
    >
      <style>{`
        @keyframes spark-pop {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5) rotate(0deg); filter: blur(0px); }
          10% { opacity: 1; }
          100% { opacity: 0; transform: var(--to) scale(1) rotate(var(--rot)); filter: blur(0.6px); }
        }
        @keyframes shockwave {
          0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0.35; }
          80% { opacity: 0.12; }
          100% { transform: translate(-50%, -50%) scale(2.6); opacity: 0; }
        }
        @keyframes flash-bloom {
          0% { opacity: 0.18; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* Flash bloom */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(600px 600px at var(--cx) var(--cy), rgba(245,158,11,0.18), rgba(245,158,11,0.0) 60%)",
          opacity: 0,
          animation: "flash-bloom 420ms ease-out forwards",
          "--cx": `${x}px`,
          "--cy": `${y}px`
        }}
      />

      {/* Shockwave ring */}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 24,
          height: 24,
          borderRadius: "9999px",
          border: "2px solid rgba(245,158,11,0.55)",
          boxShadow: "0 0 18px rgba(245,158,11,0.45), inset 0 0 8px rgba(245,158,11,0.25)",
          transform: "translate(-50%, -50%)",
          animation: "shockwave 880ms ease-out forwards"
        }}
      />

      {/* Gold sparks */}
      {sparks.map((s) => (
        <span
          key={s.id}
          style={{
            position: "absolute",
            left: x,
            top: y,
            transform: "translate(-50%, -50%)",
            color: s.color,
            fontSize: s.size,
            opacity: 0,
            // Use sparkle glyph; looks better than star for "gold sparks"
            textShadow:
              "0 0 8px rgba(245,158,11,0.55), 0 0 14px rgba(252,211,77,0.35), 0 0 24px rgba(253,230,138,0.25)",
            animation: `spark-pop ${s.dur}ms cubic-bezier(.2,.8,.2,1) ${s.delay}ms forwards`,
            "--to": `translate(${s.dx}px, ${s.dy}px)`,
            "--rot": `${s.rot}deg`
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}
