// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  AERIS GLASS · Utility Module v2.0                                       ║
// ║  Copy this entire file into any Claude artifact.                         ║
// ║  Never regenerate values — use exactly as written.                       ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

import { useState, useRef, useCallback } from "react";

// ─── 1. NOISE URL ─────────────────────────────────────────────────────────────
// DO NOT regenerate. This exact string produces the correct 5.5% grain texture.
export const AERIS_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// ─── 2. DESIGN TOKENS ────────────────────────────────────────────────────────
export const G = {
  // Brand palette
  black:   "#000000",
  white:   "#FFFFFF",
  glacial: "#E6F0FF",      // rgb(230, 240, 255)
  bg:      "#0F0F14",      // dark canvas
  bg2:     "#1A1A22",      // secondary surface (flat content cards)

  // Glass dark (use on dark bg or images)
  glassBg:        "rgba(255,255,255,0.07)",
  glassBdr:       "rgba(255,255,255,0.14)",
  glassHL:        "rgba(255,255,255,0.52)",   // edge highlight
  glassShadow:    "0 8px 32px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.20)",
  glassBlur:      "blur(18px) saturate(200%)",
  glassNoise:     0.055,

  // Glass glacial tint (Aeris brand variant)
  glacialBg:      "rgba(230,240,255,0.09)",
  glacialBdr:     "rgba(200,220,255,0.22)",
  glacialHL:      "rgba(220,235,255,0.60)",

  // Glass light (use on white/light bg)
  glassBgLight:   "rgba(255,255,255,0.65)",
  glassBdrLight:  "rgba(255,255,255,0.80)",
  glassHLLight:   "rgba(255,255,255,0.90)",
  glassShadowL:   "0 4px 24px rgba(0,0,0,0.08)",

  // Fallback (prefers-reduced-transparency)
  fallbackBg:     "rgba(30,30,40,0.98)",
  fallbackBdr:    "rgba(255,255,255,0.12)",

  // Opacity ladder (Apple HIG iOS 26)
  op100: 1.00,   // critical   — CTA, logo, primary text
  op70:  0.70,   // support    — secondary text, tabs
  op40:  0.40,   // decorative — dividers, icons
  op20:  0.20,   // atmos      — tints, bg overlays

  // Border radius
  rXXL:  24, rXL: 20, rLG: 16, rMD: 12, rSM: 8, rPill: 100,

  // Spacing (8px grid)
  s1: 8, s2: 16, s3: 24, s4: 32, s5: 40, s6: 48,

  // Typography
  fontDisplay: "'Satoshi', 'DM Sans', sans-serif",
  fontBody:    "'Inter', 'DM Sans', sans-serif",

  // Motion
  ease: "0.18s cubic-bezier(0.4,0,0.2,1)",
  easePress: "0.08s ease",
};

// ─── 3. GLASS STYLE FACTORY ───────────────────────────────────────────────────
// Returns inline style object for a glass surface.
// tint: "dark" | "glacial" | "light"
// hover: boolean — pass hover state for interaction feedback
export function glassStyle(tint = "dark", hover = false, overrides = {}) {
  const bg  = tint === "glacial" ? G.glacialBg  : tint === "light" ? G.glassBgLight  : G.glassBg;
  const bdr = tint === "glacial" ? G.glacialBdr : tint === "light" ? G.glassBdrLight : G.glassBdr;
  const hl  = tint === "glacial" ? G.glacialHL  : tint === "light" ? G.glassHLLight  : G.glassHL;
  const sh  = tint === "light"   ? G.glassShadowL : G.glassShadow;

  return {
    background:           hover ? bg.replace(/[\d.]+\)$/, v => (parseFloat(v) + 0.05).toFixed(2) + ")") : bg,
    backdropFilter:       G.glassBlur,
    WebkitBackdropFilter: G.glassBlur,
    border:              `1px solid ${bdr}`,
    boxShadow:           `inset 0 1px 0 ${hl}, ${hover ? sh.replace("0.32", "0.44") : sh}`,
    transition:          `background ${G.ease}, box-shadow ${G.ease}`,
    ...overrides,
  };
}

// ─── 4. SPECULAR HIGHLIGHT HOOK ───────────────────────────────────────────────
// Simulates Apple's device-motion specular highlights via mouse tracking.
// Returns { ref, handlers, specLayer } — spread handlers on the element,
// render specLayer as a child (it will self-position).
export function useSpecular(intensity = 1) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 50, y: 10, active: false });

  const onMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top)  / r.height) * 100,
      active: true,
    });
  }, []);

  const onMouseLeave = useCallback(() => setPos(p => ({ ...p, active: false })), []);

  const specLayer = (
    <div style={{
      position: "absolute", inset: 0, borderRadius: "inherit",
      background: pos.active
        ? `radial-gradient(ellipse 55% 38% at ${pos.x}% ${pos.y}%, rgba(255,255,255,${0.12 * intensity}), transparent 68%)`
        : "none",
      transition: "background 0.12s ease",
      pointerEvents: "none", zIndex: 1,
    }} />
  );

  return { ref, handlers: { onMouseMove, onMouseLeave }, specLayer };
}

// ─── 5. NOISE LAYER ───────────────────────────────────────────────────────────
// Always include this in every glass component. Compensates for hardware lensing.
export const NoiseLayer = ({ opacity = G.glassNoise }) => (
  <div style={{
    position: "absolute", inset: 0, borderRadius: "inherit",
    backgroundImage: AERIS_NOISE,
    opacity,
    pointerEvents: "none",
    mixBlendMode: "overlay",
    zIndex: 0,
  }} />
);

// ─── 6. GLASS CARD ───────────────────────────────────────────────────────────
// Use for: navigation panels, modals, floating controls (Layer 2).
// DO NOT use as container for primary product/article content (use FlatCard).
export function GlassCard({
  children, tint = "dark", radius = G.rLG, padding = G.s3,
  specular = true, style = {}, onClick,
}) {
  const [hover, setHover] = useState(false);
  const { ref, handlers, specLayer } = useSpecular();

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); handlers.onMouseLeave(); }}
      onMouseMove={handlers.onMouseMove}
      style={{
        position: "relative", overflow: "hidden",
        borderRadius: radius, padding,
        cursor: onClick ? "pointer" : "default",
        ...glassStyle(tint, hover),
        ...style,
      }}
    >
      <NoiseLayer />
      {specular && specLayer}
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </div>
  );
}

// ─── 7. FLAT CARD ─────────────────────────────────────────────────────────────
// Layer 1: primary content (products, articles, data). NO backdrop-filter.
// Contrast-safe. Always legible regardless of what's behind it.
export function FlatCard({
  children, radius = G.rLG, padding = G.s3,
  bg = G.bg2, border = "rgba(255,255,255,0.08)",
  style = {},
}) {
  return (
    <div style={{
      position: "relative", borderRadius: radius, padding,
      background: bg, border: `1px solid ${border}`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── 8. GLASS BUTTON ─────────────────────────────────────────────────────────
// For: secondary actions, navigation, filters.
// For PRIMARY conversion CTA → use SolidButton instead.
export function GlassButton({
  children, tint = "dark", size = "md",
  disabled = false, onClick, style = {},
}) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const { ref, handlers, specLayer } = useSpecular(1.2);

  const sz = { sm: { p: "7px 16px", fs: 12 }, md: { p: "10px 22px", fs: 13 }, lg: { p: "13px 28px", fs: 15 } }[size];

  return (
    <button
      ref={ref} onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); handlers.onMouseLeave(); }}
      onMouseMove={handlers.onMouseMove}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        position: "relative", overflow: "hidden", display: "inline-flex",
        alignItems: "center", justifyContent: "center", gap: 6,
        padding: sz.p, borderRadius: G.rMD,
        cursor: disabled ? "default" : "pointer",
        fontFamily: G.fontBody, fontWeight: 600, fontSize: sz.fs,
        color: `rgba(255,255,255,${disabled ? G.op40 : G.op100})`,
        letterSpacing: "0.01em",
        transform: press ? "scale(0.975)" : "scale(1)",
        transition: `${G.ease}, transform ${G.easePress}`,
        ...glassStyle(tint, hover),
        ...style,
      }}
    >
      <NoiseLayer opacity={0.05} />
      {specLayer}
      <span style={{ position: "relative", zIndex: 2 }}>{children}</span>
    </button>
  );
}

// ─── 9. SOLID BUTTON (Primary CTA) ───────────────────────────────────────────
// Use for the most important conversion action on any screen.
// Never glass — must be always legible and high contrast.
export function SolidButton({ children, onClick, style = {}, inverted = false }) {
  const [press, setPress] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        padding: "10px 22px", borderRadius: G.rMD, cursor: "pointer",
        fontFamily: G.fontBody, fontWeight: 700, fontSize: 13,
        letterSpacing: "0.01em", border: "none",
        background: inverted ? G.black : G.white,
        color:      inverted ? G.white : G.black,
        boxShadow:  "0 4px 16px rgba(0,0,0,0.30)",
        transform:  press ? "scale(0.975)" : "scale(1)",
        transition: `box-shadow ${G.ease}, transform ${G.easePress}`,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── 10. GLASS CHIP ──────────────────────────────────────────────────────────
export function GlassChip({ children, active = false, onClick }) {
  return (
    <span onClick={onClick} style={{
      display: "inline-flex", alignItems: "center",
      height: 26, padding: "0 13px", borderRadius: G.rPill, overflow: "hidden",
      background: active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)",
      backdropFilter: "blur(12px) saturate(180%)",
      WebkitBackdropFilter: "blur(12px) saturate(180%)",
      border: `1px solid ${active ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.14)"}`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,${active ? 0.50 : 0.35})`,
      fontFamily: G.fontBody, fontWeight: 500, fontSize: 11,
      color: `rgba(255,255,255,${active ? G.op100 : G.op70})`,
      letterSpacing: "0.03em", cursor: onClick ? "pointer" : "default",
      transition: `all ${G.ease}`,
    }}>
      {children}
    </span>
  );
}

// ─── 11. GLASS NAV BAR ───────────────────────────────────────────────────────
// Floating navigation element (Layer 2). Always above content, never contains it.
export function GlassNav({ items = [], activeIndex = 0, onSelect }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, padding: "6px 6px",
      borderRadius: G.rMD,
      background: "rgba(255,255,255,0.06)",
      backdropFilter: "blur(24px) saturate(220%)",
      WebkitBackdropFilter: "blur(24px) saturate(220%)",
      border: "1px solid rgba(255,255,255,0.13)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.42), 0 4px 20px rgba(0,0,0,0.40)",
    }}>
      {items.map((item, i) => (
        <div key={item} onClick={() => onSelect?.(i)} style={{
          flex: 1, textAlign: "center", padding: "6px 12px", borderRadius: G.rSM,
          fontSize: 11, fontWeight: i === activeIndex ? 600 : 400, cursor: "pointer",
          color: `rgba(255,255,255,${i === activeIndex ? G.op100 : G.op40})`,
          background: i === activeIndex ? "rgba(255,255,255,0.12)" : "transparent",
          transition: `all ${G.ease}`,
        }}>
          {item}
        </div>
      ))}
    </div>
  );
}

// ─── 12. DARK CANVAS ─────────────────────────────────────────────────────────
// Required background for glass to be visible. Never place glass on white.
export function AerisCanvas({ children, style = {} }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(145deg, ${G.bg} 0%, #0B0B16 55%, #0D0F1A 100%)`,
      fontFamily: G.fontBody,
      position: "relative",
      ...style,
    }}>
      {/* Atmospheric blur blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-25%", left: "-10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(80,100,220,0.09) 0%, transparent 65%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "-15%", right: "-8%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(160,200,255,0.05) 0%, transparent 65%)", filter: "blur(60px)" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ─── 13. LAYER RULES (for AI agents reading this file) ───────────────────────
// MANDATORY: Read before using any component.
//
// LAYER 1 — Content (Flat, Sacred)
//   → Use: FlatCard, plain <div> with solid background
//   → NEVER: GlassCard, backdrop-filter, opacity < 0.85 on text
//   → Contains: product data, articles, feeds, images, pricing
//
// LAYER 2 — Glass Navigation (Floating Controls)
//   → Use: GlassCard, GlassNav, GlassButton (secondary actions)
//   → Floats ABOVE Layer 1. Never wraps or contains primary content.
//   → Contains: tab bars, nav bars, modals, toasts, floating CTAs
//
// LAYER 3 — Specular (Automatic)
//   → Never design manually. Handled by useSpecular() hook.
//   → Simulates Apple's device-motion specular highlights.
//
// PRIMARY CTA → SolidButton (white or black). NEVER glass for main conversion.
// MAX GLASS LAYERS: 4 per screen (Apple compositing budget).
// FALLBACK: @media (prefers-reduced-transparency) → solid backgrounds.
// CONTRAST: 4.5:1 minimum always. Test text on glass surfaces.
// CANVAS: Glass requires dark background. Use AerisCanvas or dark gradient.
