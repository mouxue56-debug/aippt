export function aiEffectsStyle(): string {
  return `<style id="aippt-ai-effects">
    .slide[data-motion-preset="ai-neon-scan"]::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.16) 48%, rgba(255,61,139,0.18) 52%, transparent 100%),
        repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 9px);
      mix-blend-mode: screen;
      animation: aipptScan 3.6s ease-in-out infinite;
    }
    .slide[data-motion-preset="ai-neon-scan"] [data-role="title"],
    .slide[data-motion-preset="ai-neon-scan"] .slide-title {
      text-shadow: 0 0 18px rgba(0,229,255,0.62), 0 0 34px rgba(255,61,139,0.28);
    }
    .slide[data-motion-preset="hologram-depth"] {
      perspective: 1200px;
    }
    .slide[data-motion-preset="hologram-depth"] [data-role],
    .slide[data-motion-preset="hologram-depth"] .card,
    .slide[data-motion-preset="hologram-depth"] [data-aippt-block] {
      transform-style: preserve-3d;
      animation: aipptHoloFloat 5.2s ease-in-out infinite;
    }
    .slide[data-motion-preset="signal-pulse"] [data-role="title"],
    .slide[data-motion-preset="signal-pulse"] .slide-title {
      animation: aipptSignalPulse 2.8s ease-in-out infinite;
    }
    .slide[data-motion-preset="signal-pulse"] .card,
    .slide[data-motion-preset="signal-pulse"] [data-aippt-block] {
      box-shadow: 0 0 0 1px rgba(0,229,255,0.24), 0 0 34px rgba(0,229,255,0.15);
    }
    .slide[data-motion-preset="data-cascade"] [data-role],
    .slide[data-motion-preset="data-cascade"] .card,
    .slide[data-motion-preset="data-cascade"] [data-aippt-block] {
      animation: aipptCascade 0.72s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .slide[data-motion-preset="data-cascade"] [data-role]:nth-child(2),
    .slide[data-motion-preset="data-cascade"] .card:nth-child(2) { animation-delay: 0.08s; }
    .slide[data-motion-preset="data-cascade"] [data-role]:nth-child(3),
    .slide[data-motion-preset="data-cascade"] .card:nth-child(3) { animation-delay: 0.16s; }
    .slide[data-motion-preset="data-cascade"] [data-role]:nth-child(4),
    .slide[data-motion-preset="data-cascade"] .card:nth-child(4) { animation-delay: 0.24s; }
    [data-motion="focus-pop"] {
      animation: aipptFocusPop 0.58s cubic-bezier(0.2, 1, 0.28, 1) both;
    }
    [data-motion="neural-glow"] {
      position: relative;
      filter: drop-shadow(0 0 12px rgba(0,229,255,0.32));
      animation: aipptNeuralGlow 2.8s ease-in-out infinite;
    }
    [data-motion="scan-line"] {
      animation: aipptScanLine 0.85s ease-out both;
    }
    @keyframes aipptScan {
      0%, 100% { clip-path: inset(0 100% 0 0); opacity: 0.24; }
      45%, 55% { clip-path: inset(0 0 0 0); opacity: 0.86; }
    }
    @keyframes aipptHoloFloat {
      0%, 100% { transform: translate3d(0,0,0) rotateX(0deg); filter: saturate(1); }
      50% { transform: translate3d(0,-8px,22px) rotateX(1deg); filter: saturate(1.18); }
    }
    @keyframes aipptSignalPulse {
      0%, 100% { filter: brightness(1); letter-spacing: inherit; }
      50% { filter: brightness(1.25); letter-spacing: 0.04em; }
    }
    @keyframes aipptCascade {
      from { opacity: 0; transform: translateY(18px) scale(0.98); filter: blur(5px); }
      to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    }
    @keyframes aipptFocusPop {
      from { opacity: 0; transform: translateY(16px) scale(0.96); filter: blur(6px); }
      to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    }
    @keyframes aipptNeuralGlow {
      0%, 100% { filter: drop-shadow(0 0 8px rgba(0,229,255,0.22)); }
      50% { filter: drop-shadow(0 0 20px rgba(255,61,139,0.38)); }
    }
    @keyframes aipptScanLine {
      from { opacity: 0; clip-path: inset(0 100% 0 0); }
      to { opacity: 1; clip-path: inset(0 0 0 0); }
    }
  </style>`;
}
