import { useState, useMemo, useCallback, useEffect } from "react";
import {
  ComposedChart, LineChart, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ─── Theme ────────────────────────────────────────────────────────────────────
const DARK = {
  bg:          "#060b14",
  sidebar:     "#080d17",
  card:        "#0d1424",
  cardBorder:  "#1a2235",
  border:      "#1f2937",
  borderSub:   "#0f172a",
  inputBg:     "#111827",
  inputBorder: "#1f2937",
  text:        "#f1f5f9",
  textSub:     "#94a3b8",
  textMuted:   "#475569",
  textFaint:   "#374151",
  gridLine:    "#0f172a",
  axisLine:    "#1f2937",
  axisTick:    "#374151",
  tooltipBg:   "#0a0f1a",
  toggleOff:   "#1f2937",
  advBg:       "#060b14",
  advBorder:   "#1a2235",
  footerText:  "#1f2937",
  accent:      "#f97316",
  accentMc:    "#a78bfa",
  mcFill:      "#060b14",  // area fill for band cutout
};

const LIGHT = {
  bg:          "#f8fafc",
  sidebar:     "#ffffff",
  card:        "#ffffff",
  cardBorder:  "#e2e8f0",
  border:      "#e2e8f0",
  borderSub:   "#f1f5f9",
  inputBg:     "#f8fafc",
  inputBorder: "#e2e8f0",
  text:        "#0f172a",
  textSub:     "#475569",
  textMuted:   "#94a3b8",
  textFaint:   "#cbd5e1",
  gridLine:    "#f1f5f9",
  axisLine:    "#e2e8f0",
  axisTick:    "#94a3b8",
  tooltipBg:   "#ffffff",
  toggleOff:   "#e2e8f0",
  advBg:       "#f1f5f9",
  advBorder:   "#e2e8f0",
  footerText:  "#cbd5e1",
  accent:      "#ea6c00",
  accentMc:    "#7c3aed",
  mcFill:      "#f8fafc",
};

// ─── Tax constants ────────────────────────────────────────────────────────────
const FORFAIT_OVERIG   = 0.06;
const FORFAIT_SPAAR    = 0.013;
const FORFAIT_TARIEF   = 0.36;
const HEFFINGSVRIJ_F   = 61000;
const HEFFINGSVRIJ_W   = 1500;
const WERKELIJK_TARIEF = 0.36;

// ─── RNG ──────────────────────────────────────────────────────────────────────
function randn() {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function clampReturn(r) { return Math.max(-0.6, r); }

// ─── Tax calculation ──────────────────────────────────────────────────────────
function calcTax(stelsel, etf, crypto, spaar, etfGr, cryptoGr, spaarGr, hv) {
  if (stelsel === "forfaitair") {
    const overige   = etf + crypto;
    const totaalB3  = overige + spaar;
    const fictief   = spaar * FORFAIT_SPAAR + overige * FORFAIT_OVERIG;
    const grondslag = Math.max(0, totaalB3 - hv);
    const factor    = totaalB3 > 0 ? grondslag / totaalB3 : 0;
    return Math.max(0, fictief * factor * FORFAIT_TARIEF);
  }
  const werkelijk = etfGr + cryptoGr + spaarGr;
  return Math.max(0, werkelijk - hv) * WERKELIJK_TARIEF;
}

// ─── Tax payment: savings → reduce contributions → sell investments ───────────
function payTax(etf, crypto, spaar, belasting, betaalUitSpaar, bijEtf, bijCrypto) {
  let rem = belasting;
  let spaarUitgeput = false, invVerkocht = false;
  let bijEtfRest = bijEtf, bijCryptoRest = bijCrypto;

  if (rem <= 0) return { etf, crypto, spaar, bijEtfRest, bijCryptoRest, spaarUitgeput, invVerkocht };

  if (betaalUitSpaar) {
    if (spaar >= rem) { spaar -= rem; rem = 0; }
    else { rem -= spaar; spaar = 0; spaarUitgeput = true; }

    if (rem > 0) {
      const totalBij = bijEtfRest + bijCryptoRest;
      if (totalBij > 0) {
        const absorb = Math.min(rem, totalBij);
        const f = absorb / totalBij;
        bijEtfRest    = Math.max(0, bijEtfRest    - bijEtfRest    * f);
        bijCryptoRest = Math.max(0, bijCryptoRest - bijCryptoRest * f);
        rem -= absorb;
      }
    }
    if (rem > 0) {
      invVerkocht = true;
      const totInv = etf + crypto;
      if (totInv > 0) {
        etf    = Math.max(0, etf    - rem * (etf    / totInv));
        crypto = Math.max(0, crypto - rem * (crypto / totInv));
      }
    }
  } else {
    const box3 = etf + crypto + spaar;
    if (box3 > 0) { const f = 1 - Math.min(rem / box3, 1); etf *= f; crypto *= f; spaar *= f; }
  }
  return { etf, crypto, spaar, bijEtfRest, bijCryptoRest, spaarUitgeput, invVerkocht };
}

// ─── Simulation ───────────────────────────────────────────────────────────────
function simulate(p, stelsel, metBijstorting, betaalUitSpaar, overrideReturns) {
  const { startEtf, startCrypto, startSpaar, startPensioen, bijEtf, bijCrypto, bijPensioen, rendEtf, rendCrypto, rendSpaar, jaren, fiscaalPartner } = p;
  const hv = stelsel === "forfaitair"
    ? (fiscaalPartner ? HEFFINGSVRIJ_F * 2 : HEFFINGSVRIJ_F)
    : (fiscaalPartner ? HEFFINGSVRIJ_W * 2 : HEFFINGSVRIJ_W);

  let etf = startEtf, crypto = startCrypto, spaar = startSpaar, pensioen = startPensioen;
  let cumulB = 0, spaarUitgeputJaar = null;

  const data = [{ jaar: 2027, etf, crypto, spaar, pensioen, totaal: etf + crypto + spaar + pensioen, belasting: 0, cumulBelasting: 0 }];

  for (let j = 1; j <= jaren; j++) {
    const rEtf    = overrideReturns ? overrideReturns[j-1].etf    : rendEtf;
    const rCrypto = overrideReturns ? overrideReturns[j-1].crypto : rendCrypto;
    const rSpaar  = overrideReturns ? overrideReturns[j-1].spaar  : rendSpaar;

    const etfGr = etf * rEtf, cryptoGr = crypto * rCrypto;
    const spaarGr = spaar * Math.max(0, rSpaar), pensioenGr = pensioen * rEtf;
    const belasting = calcTax(stelsel, etf, crypto, spaar, etfGr, cryptoGr, spaarGr, hv);

    etf = Math.max(0, etf + etfGr); crypto = Math.max(0, crypto + cryptoGr);
    spaar = Math.max(0, spaar + spaarGr); pensioen = Math.max(0, pensioen + pensioenGr);

    const paid = payTax(etf, crypto, spaar, belasting, betaalUitSpaar,
      metBijstorting ? bijEtf : 0, metBijstorting ? bijCrypto : 0);
    etf = paid.etf; crypto = paid.crypto; spaar = paid.spaar;
    if (paid.spaarUitgeput && !spaarUitgeputJaar) spaarUitgeputJaar = 2027 + j;

    if (metBijstorting) { etf += paid.bijEtfRest; crypto += paid.bijCryptoRest; pensioen += bijPensioen; }
    cumulB += belasting;

    data.push({ jaar: 2027 + j, etf: Math.round(etf), crypto: Math.round(crypto), spaar: Math.round(spaar), pensioen: Math.round(pensioen), totaal: Math.round(etf + crypto + spaar + pensioen), belasting: Math.round(belasting), cumulBelasting: Math.round(cumulB) });
  }
  return { data, spaarUitgeputJaar };
}

// ─── Monte Carlo ──────────────────────────────────────────────────────────────
function runMonteCarlo(p, stelsel, betaalUitSpaar, volEtf, volCrypto, N = 500) {
  const { rendEtf, rendCrypto, rendSpaar, jaren } = p;
  const results = [];
  for (let s = 0; s < N; s++) {
    const ov = Array.from({ length: jaren }, () => ({
      etf:    clampReturn(rendEtf    + volEtf    * randn()),
      crypto: clampReturn(rendCrypto + volCrypto * randn()),
      spaar:  Math.max(0, rendSpaar  + 0.005     * randn()),
    }));
    results.push(simulate(p, stelsel, true, betaalUitSpaar, ov).data.map((d) => d.totaal));
  }
  const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor((p / 100) * (s.length - 1))]; };
  return Array.from({ length: jaren + 1 }, (_, i) => {
    const vals = results.map((r) => r[i]);
    return { jaar: 2027 + i, p10: Math.round(pct(vals, 10)), p25: Math.round(pct(vals, 25)), p50: Math.round(pct(vals, 50)), p75: Math.round(pct(vals, 75)), p90: Math.round(pct(vals, 90)) };
  });
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt  = (n) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n ?? 0);
const fmtK = (n) => {
  if (n == null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `€${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
};

// ─── UI primitives ────────────────────────────────────────────────────────────
function NumberInput({ label, hint, value, onChange, step = 1000, T }) {
  const [raw, setRaw]     = useState(String(value));
  const [focus, setFocus] = useState(false);
  if (!focus && raw !== String(value)) setRaw(String(value));
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.textMuted, marginBottom: 3 }}>
        {label}{hint && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: T.textSub, marginLeft: 5 }}>({hint})</span>}
      </label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: T.textMuted, fontSize: 13, pointerEvents: "none" }}>€</span>
        <input type="number" value={raw} step={step} min={0}
          onChange={(e) => { setRaw(e.target.value); const n = parseFloat(e.target.value); if (!isNaN(n) && n >= 0) onChange(n); }}
          onFocus={(e) => { setFocus(true); e.target.select(); e.target.style.borderColor = T.accent; }}
          onBlur={(e)  => { setFocus(false); e.target.style.borderColor = T.inputBorder; const n = parseFloat(raw); const c = isNaN(n) || n < 0 ? 0 : n; setRaw(String(c)); onChange(c); }}
          style={{ width: "100%", boxSizing: "border-box", padding: "9px 10px 9px 22px", background: T.inputBg, border: `1.5px solid ${T.inputBorder}`, borderRadius: 7, color: T.text, fontSize: 15, fontFamily: "inherit", outline: "none", transition: "border-color 0.15s" }}
        />
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, format, accent, T }) {
  const ac = accent || T.accent;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: ac }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: ac, height: 4, cursor: "pointer" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.textFaint, marginTop: 1 }}>
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

function Toggle({ label, sub, value, onChange, T }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
      <button onClick={() => onChange(!value)} style={{ width: 38, height: 20, borderRadius: 10, border: "none", cursor: "pointer", background: value ? T.accent : T.toggleOff, position: "relative", flexShrink: 0, marginTop: 2, transition: "background 0.2s" }}>
        <div style={{ width: 14, height: 14, borderRadius: 7, background: "white", position: "absolute", top: 3, left: value ? 21 : 3, transition: "left 0.2s" }} />
      </button>
      <div>
        <div style={{ fontSize: 11, color: T.textSub, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, lineHeight: 1.5 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SectionHead({ icon, title, T }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, paddingBottom: 8, marginBottom: 12, borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 800, color: T.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>{title}</span>
    </div>
  );
}

function KpiCard({ label, value, sub, color, T }) {
  return (
    <div style={{ background: T.card, borderRadius: 12, padding: "12px 14px", border: `1px solid ${T.cardBorder}`, position: "relative", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "12px 12px 0 0" }} />
      <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 900, color: T.text, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function AdvancedPanel({ open, onToggle, children, T }) {
  return (
    <div style={{ marginBottom: 16, borderRadius: 10, border: `1px solid ${T.advBorder}`, overflow: "hidden" }}>
      <button onClick={onToggle} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", background: T.advBg, border: "none", cursor: "pointer",
        fontFamily: "inherit",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 13 }}>🎲</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: T.accentMc, letterSpacing: "0.1em", textTransform: "uppercase" }}>Geavanceerde instellingen</span>
        </div>
        <span style={{ fontSize: 13, color: T.textMuted, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
      </button>
      {open && (
        <div style={{ background: T.advBg, borderTop: `1px solid ${T.advBorder}`, padding: "14px 14px 4px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label, T }) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => p.value != null && p.dataKey && !p.dataKey.startsWith("__"));
  return (
    <div style={{ background: T.tooltipBg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 16px", minWidth: 210, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 8 }}>{label}</div>
      {items.map((p) => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.stroke || p.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: T.textSub, flex: 1 }}>{p.name || p.dataKey}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{fmtK(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Collapsible info block ──────────────────────────────────────────────────
function InfoBlock({ title, children, T, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 12, borderRadius: 10, border: `1px solid ${T.cardBorder}`, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", background: T.card, border: "none", cursor: "pointer", fontFamily: "inherit",
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{title}</span>
        <span style={{ fontSize: 13, color: T.textMuted, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", background: T.card, borderTop: `1px solid ${T.cardBorder}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [darkMode, setDarkMode] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [showInfo, setShowInfo] = useState(false);
  const T = darkMode ? DARK : LIGHT;

  // Follow system theme changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setDarkMode(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Inputs
  const [startEtf,       setStartEtf]       = useState(80000);
  const [startCrypto,    setStartCrypto]    = useState(50000);
  const [startSpaar,     setStartSpaar]     = useState(30000);
  const [startPensioen,  setStartPensioen]  = useState(40000);
  const [bijEtf,         setBijEtf]         = useState(6000);
  const [bijCrypto,      setBijCrypto]      = useState(2400);
  const [bijPensioen,    setBijPensioen]    = useState(4000);
  const [rendEtf,        setRendEtf]        = useState(0.07);
  const [rendCrypto,     setRendCrypto]     = useState(0.10);
  const [rendSpaar,      setRendSpaar]      = useState(0.025);
  const [jaren,          setJaren]          = useState(25);
  const [fiscaalPartner, setFiscaalPartner] = useState(false);
  const [betaalUitSpaar, setBetaalUitSpaar] = useState(false);
  // Advanced
  const [advOpen,    setAdvOpen]    = useState(false);
  const [volEtf,     setVolEtf]     = useState(0.16);
  const [volCrypto,  setVolCrypto]  = useState(0.55);
  const [mcStelsel,  setMcStelsel]  = useState("werkelijk");
  // Tab
  const [activeTab, setActiveTab] = useState("deterministisch");

  const p = { startEtf, startCrypto, startSpaar, startPensioen, bijEtf, bijCrypto, bijPensioen, rendEtf, rendCrypto, rendSpaar, jaren, fiscaalPartner };
  const key = JSON.stringify(p);

  const fMet      = useMemo(() => simulate(p, "forfaitair", true,  false,           null), [key]);
  const wMet      = useMemo(() => simulate(p, "werkelijk",  true,  false,           null), [key]);
  const fMetSpaar = useMemo(() => simulate(p, "forfaitair", true,  betaalUitSpaar,  null), [key, betaalUitSpaar]);
  const wMetSpaar = useMemo(() => simulate(p, "werkelijk",  true,  betaalUitSpaar,  null), [key, betaalUitSpaar]);

  const mcKey   = JSON.stringify({ key, mcStelsel, betaalUitSpaar, volEtf, volCrypto });
  const mcProp  = useMemo(() => runMonteCarlo(p, mcStelsel, false, volEtf, volCrypto, 500), [mcKey]);
  const mcSpaar = useMemo(() => runMonteCarlo(p, mcStelsel, true,  volEtf, volCrypto, 500), [mcKey]);

  const chartDet = useMemo(() => fMet.data.map((d, i) => ({
    jaar: d.jaar,
    "Forfaitair (proportioneel)":          d.totaal,
    "Werkelijk 2028+ (proportioneel)":     wMet.data[i]?.totaal,
    ...(betaalUitSpaar ? {
      "Forfaitair (uit spaargeld)":          fMetSpaar.data[i]?.totaal,
      "Werkelijk 2028+ (uit spaargeld)":     wMetSpaar.data[i]?.totaal,
    } : {}),
  })), [key, betaalUitSpaar, fMet, wMet, fMetSpaar, wMetSpaar]);

  const chartBel = useMemo(() => fMet.data.map((d, i) => ({
    jaar: d.jaar,
    "Belasting Forfaitair":          d.cumulBelasting,
    "Belasting Werkelijk 2028+":     wMet.data[i]?.cumulBelasting,
    ...(betaalUitSpaar ? {
      "Belasting F (uit spaargeld)":   fMetSpaar.data[i]?.cumulBelasting,
      "Belasting W (uit spaargeld)":   wMetSpaar.data[i]?.cumulBelasting,
    } : {}),
  })), [key, betaalUitSpaar, fMet, wMet, fMetSpaar, wMetSpaar]);

  const chartMC = useMemo(() => mcProp.map((d, i) => ({
    jaar: d.jaar,
    "P90 (proportioneel)":  mcProp[i].p90,
    "P10 (proportioneel)":  mcProp[i].p10,
    "P50 (proportioneel)":  mcProp[i].p50,
    "P90 (uit spaargeld)":  mcSpaar[i].p90,
    "P10 (uit spaargeld)":  mcSpaar[i].p10,
    "P50 (uit spaargeld)":  mcSpaar[i].p50,
  })), [mcProp, mcSpaar]);

  const eindF  = fMet.data[fMet.data.length - 1];
  const eindW  = wMet.data[wMet.data.length - 1];
  const eindWS = wMetSpaar.data[wMetSpaar.data.length - 1];
  const diff   = eindF.totaal - eindW.totaal;
  const MILESTONES = [5, 10, 15, 20, 25, 30].filter((y) => y <= jaren);

  const DET_LINES = [
    { k: "Forfaitair (proportioneel)",         c: "#3b82f6", d: false },
    { k: "Werkelijk 2028+ (proportioneel)",    c: "#a855f7", d: false },
    ...(betaalUitSpaar ? [
      { k: "Forfaitair (uit spaargeld)",        c: "#f97316", d: true  },
      { k: "Werkelijk 2028+ (uit spaargeld)",   c: "#f43f5e", d: true  },
    ] : []),
  ];
  const BEL_LINES = [
    { k: "Belasting Forfaitair",               c: "#3b82f6", d: false },
    { k: "Belasting Werkelijk 2028+",          c: "#ef4444", d: false },
    ...(betaalUitSpaar ? [
      { k: "Belasting F (uit spaargeld)",       c: "#f97316", d: true  },
      { k: "Belasting W (uit spaargeld)",       c: "#f59e0b", d: true  },
    ] : []),
  ];

  const tooltipProps = { content: (props) => <CustomTooltip {...props} T={T} /> };

  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", minHeight: "100vh", transition: "background 0.2s, color 0.2s" }}>
      <style>{`
        * { box-sizing: border-box; }
        input[type=range] { cursor: pointer; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
        .outer { display: flex; flex-direction: column; }
        .sidebar { background: ${T.sidebar}; border-bottom: 1px solid ${T.border}; padding: 0; }
        .sidebar-inner { padding: 16px; }
        .content { padding: 16px; }
        .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
        @media (min-width: 768px) {
          .outer { flex-direction: row; height: 100vh; overflow: hidden; }
          .sidebar { width: 296px; border-bottom: none; border-right: 1px solid ${T.border}; overflow-y: auto; flex-shrink: 0; }
          .content { flex: 1; overflow-y: auto; padding: 20px 24px; }
          .kpi-grid { grid-template-columns: repeat(4, 1fr); gap: 12px; }
        }
      `}</style>

      <div className="outer">
        {/* ─── Sidebar ─── */}
        <div className="sidebar">
          {/* Header */}
          <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-0.01em", color: T.text }}>Box 3 Calculator</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>Forfaitair 2027 vs Werkelijk 2028+</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setShowInfo(!showInfo)} style={{
                width: 34, height: 34, borderRadius: 8, border: `1px solid ${showInfo ? T.accent : T.border}`,
                background: showInfo ? T.accent + "18" : T.card, cursor: "pointer", fontSize: 14, display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
                transition: "background 0.2s, border-color 0.2s", color: showInfo ? T.accent : T.textMuted,
                fontWeight: 700, fontFamily: "inherit",
              }} title="Over deze tool">
                ?
              </button>
              <button onClick={() => setDarkMode(!darkMode)} style={{
                width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.border}`,
                background: T.card, cursor: "pointer", fontSize: 16, display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
                transition: "background 0.2s",
              }} title={darkMode ? "Lichte modus" : "Donkere modus"}>
                {darkMode ? "☀️" : "🌙"}
              </button>
            </div>
          </div>

          <div className="sidebar-inner">
            {/* Startkapitaal */}
            <div style={{ marginBottom: 16 }}>
              <SectionHead icon="💰" title="Huidig vermogen" T={T} />
              <NumberInput label="ETFs / Aandelen"  value={startEtf}      onChange={setStartEtf}      T={T} />
              <NumberInput label="Crypto"            value={startCrypto}   onChange={setStartCrypto}   T={T} />
              <NumberInput label="Spaargeld"         value={startSpaar}    onChange={setStartSpaar}    T={T} />
              <NumberInput label="Pensioenbeleggen"  hint="vrijgesteld" value={startPensioen} onChange={setStartPensioen} T={T} />
            </div>

            {/* Bijstorting */}
            <div style={{ marginBottom: 16 }}>
              <SectionHead icon="📥" title="Jaarlijkse inleg" T={T} />
              <NumberInput label="ETFs / Aandelen"  value={bijEtf}      onChange={setBijEtf}      step={500} T={T} />
              <NumberInput label="Crypto"           value={bijCrypto}   onChange={setBijCrypto}   step={500} T={T} />
              <NumberInput label="Pensioenbeleggen" value={bijPensioen} onChange={setBijPensioen} step={500} T={T} />
            </div>

            {/* Rendement */}
            <div style={{ marginBottom: 16 }}>
              <SectionHead icon="📈" title="Verwacht rendement" T={T} />
              <Slider label="ETFs / Aandelen" value={rendEtf}    min={0.02} max={0.15} step={0.005} onChange={setRendEtf}    format={(v) => `${(v*100).toFixed(1)}%`} T={T} />
              <Slider label="Crypto"          value={rendCrypto} min={0.02} max={0.30} step={0.01}  onChange={setRendCrypto} format={(v) => `${(v*100).toFixed(0)}%`}  T={T} />
              <Slider label="Spaargeld"       value={rendSpaar}  min={0.005} max={0.05} step={0.005} onChange={setRendSpaar}  format={(v) => `${(v*100).toFixed(1)}%`} T={T} />
            </div>

            {/* Situatie */}
            <div style={{ marginBottom: 16 }}>
              <SectionHead icon="⚙️" title="Situatie" T={T} />
              <Slider label="Tijdshorizon" value={jaren} min={5} max={40} step={1} onChange={setJaren} format={(v) => `${v} jaar`} T={T} />
              <Toggle label="Fiscaal partner" sub="Verdubbelt heffingsvrij vermogen" value={fiscaalPartner} onChange={setFiscaalPartner} T={T} />
            </div>

            {/* Betaalstrategie */}
            <div style={{ marginBottom: 16 }}>
              <SectionHead icon="💳" title="Betaalstrategie belasting" T={T} />
              <Toggle
                label="Betaal belasting uit spaargeld"
                sub="Volgorde: spaargeld → inleg verminderen → ETF/crypto verkopen (pensioen nooit)"
                value={betaalUitSpaar}
                onChange={setBetaalUitSpaar}
                T={T}
              />
              {betaalUitSpaar && (
                <div style={{
                  borderRadius: 8, padding: "8px 10px", fontSize: 10, marginTop: 4,
                  background: wMetSpaar.spaarUitgeputJaar ? (darkMode ? "#1c0a00" : "#fff7ed") : (darkMode ? "#0a1c0f" : "#f0fdf4"),
                  border: `1px solid ${wMetSpaar.spaarUitgeputJaar ? T.accent + "55" : "#10b98155"}`,
                  color: wMetSpaar.spaarUitgeputJaar ? T.accent : "#10b981",
                }}>
                  {wMetSpaar.spaarUitgeputJaar
                    ? `⚠️ Spaargeld uitgeput in ${wMetSpaar.spaarUitgeputJaar} (werkelijk)`
                    : `✓ Spaargeld voldoende voor ${jaren} jaar`}
                </div>
              )}
            </div>

            {/* ── Geavanceerd (ingeklapt) ── */}
            <AdvancedPanel open={advOpen} onToggle={() => setAdvOpen(!advOpen)} T={T}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
                  Monte Carlo simuleert 500 scenario's met willekeurige jaarrendementen rondom het opgegeven gemiddelde. De banden tonen P10–P90 uitkomsten.
                </div>
                <Slider label="ETFs volatiliteit"   value={volEtf}    min={0.05} max={0.40} step={0.01} onChange={setVolEtf}    format={(v) => `±${(v*100).toFixed(0)}%`} accent={T.accentMc} T={T} />
                <Slider label="Crypto volatiliteit" value={volCrypto} min={0.10} max={0.90} step={0.05} onChange={setVolCrypto} format={(v) => `±${(v*100).toFixed(0)}%`} accent={T.accentMc} T={T} />
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>MC stelsel</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[["forfaitair", "Forfaitair"], ["werkelijk", "Werkelijk 2028+"]].map(([k, l]) => (
                      <button key={k} onClick={() => setMcStelsel(k)} style={{
                        flex: 1, padding: "5px 8px", border: `1px solid ${mcStelsel === k ? T.accentMc : T.border}`,
                        borderRadius: 6, background: mcStelsel === k ? T.accentMc + "22" : "transparent",
                        color: mcStelsel === k ? T.accentMc : T.textMuted, fontSize: 10, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                      }}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            </AdvancedPanel>

            {/* Kantelpunt */}
            <div style={{ background: T.card, borderRadius: 8, padding: 12, border: `1px solid ${T.cardBorder}` }}>
              <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>⚖️ Kantelpunt (6% forfait)</div>
              {[[rendEtf, "ETFs"], [rendCrypto, "Crypto"]].map(([r, lbl]) => (
                <div key={lbl} style={{ fontSize: 10, color: r > FORFAIT_OVERIG ? "#ef4444" : "#10b981", marginBottom: 3 }}>
                  {lbl} {(r*100).toFixed(1)}% → {r > FORFAIT_OVERIG ? "werkelijk duurder" : "werkelijk gunstiger"}
                </div>
              ))}
              <div style={{ fontSize: 10, color: "#10b981" }}>Pensioen → altijd vrijgesteld</div>
            </div>
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="content">

          {showInfo ? (
            <>
              {/* ─── Info Page ─── */}
              <div style={{ maxWidth: 640 }}>
                {/* Hero / intro */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: T.text, marginBottom: 8 }}>
                    Wat verandert er in box 3?
                  </div>
                  <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.8, marginBottom: 14 }}>
                    Vanaf 2028 wil de overheid vermogen in box 3 belasten op basis van <strong style={{ color: T.text }}>werkelijk rendement</strong> in plaats van het huidige <strong style={{ color: T.text }}>forfait</strong>. Dat betekent dat niet langer een fictief percentage, maar je daadwerkelijke koerswinsten, dividenden en rente de grondslag vormen — inclusief <strong style={{ color: T.text }}>ongerealiseerde koerswinst</strong>.
                  </div>
                  <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.8, marginBottom: 14 }}>
                    Deze calculator laat zien wat het verschil is tussen beide stelsels over een zelfgekozen tijdshorizon van 5 tot 40 jaar. Neutraal, zonder oordeel. Belasting betalen is normaal — maar inzicht in de impact op je vermogensopbouw is waardevol.
                  </div>
                  <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7, padding: "10px 14px", background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: 10, marginBottom: 14 }}>
                    <strong style={{ color: T.textSub }}>Context:</strong> dit raakt mensen met vermogen boven de ~€61.000 (na heffingsvrij vermogen) — een relatief bevoorrechte groep. Deze tool is bedoeld om transparantie te bieden, niet om de belastingdruk te dramatiseren.
                  </div>
                </div>

                {/* Wat is dit stelsel? */}
                <InfoBlock title="Wat is het forfaitaire stelsel?" T={T}>
                  <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.8 }}>
                    <p style={{ marginBottom: 10 }}>
                      In het huidige stelsel (tot en met 2027) gaat de Belastingdienst uit van een <strong style={{ color: T.text }}>fictief rendement</strong> op je vermogen, ongeacht wat je echt hebt verdiend. Voor beleggingen (ETFs, aandelen, crypto) is dat forfait 6%, voor spaargeld 1,3%.
                    </p>
                    <p style={{ marginBottom: 10 }}>
                      Je betaalt 36% belasting over dat fictieve rendement, na aftrek van het heffingsvrij vermogen (€61.000 per persoon, €122.000 met fiscaal partner).
                    </p>
                    <p style={{ marginBottom: 10, padding: "10px 12px", background: T.bg, borderRadius: 8, border: `1px solid ${T.borderSub}` }}>
                      <strong style={{ color: T.text }}>Rekenvoorbeeld:</strong> €100.000 in ETFs, geen partner.
                      Forfaitair inkomen: €100.000 × 6% = €6.000. Na heffingsvrij: (€100.000 − €61.000) / €100.000 × €6.000 = €2.340. Belasting: €2.340 × 36% = <strong style={{ color: T.accent }}>€842</strong>.
                    </p>
                  </div>
                </InfoBlock>

                <InfoBlock title="Wat verandert er met werkelijk rendement (2028+)?" T={T}>
                  <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.8 }}>
                    <p style={{ marginBottom: 10 }}>
                      In het nieuwe stelsel wordt belasting geheven over je <strong style={{ color: T.text }}>daadwerkelijke rendement</strong>: rente, dividend, huurinkomsten en — cruciaal — ook <strong style={{ color: T.text }}>ongerealiseerde koerswinsten</strong>. Dat zijn stijgingen in de waarde van je beleggingen die je nog niet hebt verkocht.
                    </p>
                    <p style={{ marginBottom: 10 }}>
                      Het heffingsvrij inkomen wordt naar verwachting ~€1.500 per persoon (dit is een schatting — het wetsvoorstel is nog in behandeling).
                    </p>
                    <p style={{ marginBottom: 10 }}>
                      Bij rendement boven de 6% (het huidige forfait) betaal je onder werkelijk rendement <strong style={{ color: T.text }}>meer</strong> belasting. Bij rendement onder de 6% juist <strong style={{ color: T.text }}>minder</strong>. Dit is het kantelpunt.
                    </p>
                  </div>
                </InfoBlock>

                <InfoBlock title="Waarom ongerealiseerde winst?" T={T}>
                  <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.8 }}>
                    <p style={{ marginBottom: 10 }}>
                      De Hoge Raad oordeelde in 2021 dat het forfaitaire stelsel in strijd was met het eigendomsrecht wanneer het werkelijke rendement structureel lager lag dan het forfait. Een nieuw stelsel was nodig.
                    </p>
                    <p style={{ marginBottom: 10 }}>
                      Belasting op alleen <em>gerealiseerde</em> winst (bij verkoop) zou vereisen dat brokers per transactie aankoopprijs en verkoopprijs rapporteren aan de Belastingdienst — een compleet ander datamodel. De dienst ontvangt nu al rekeningopgaves van banken: saldo begin jaar en saldo eind jaar.
                    </p>
                    <p style={{ marginBottom: 10 }}>
                      De keuze voor ongerealiseerde koerswinst als jaarlijkse heffingsgrondslag past in die bestaande datastroom. Het is een compromis tussen politieke druk en de realiteit van een vastgelopen Belastingdienst-IT.
                    </p>
                    <p>
                      Nederland wordt hiermee een van de weinige landen die ongerealiseerde koerswinst als jaarlijks inkomen belast. Dat is internationaal opvallend — maar het is context, geen aanklacht.
                    </p>
                  </div>
                </InfoBlock>

                {/* Disclaimer */}
                <div style={{ marginBottom: 14, borderRadius: 10, padding: "14px 16px", background: darkMode ? "#1c1006" : "#fffbeb", border: `1px solid ${darkMode ? "#92400e44" : "#fbbf2444"}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: darkMode ? "#fbbf24" : "#92400e", marginBottom: 6 }}>Disclaimer</div>
                  <div style={{ fontSize: 11, color: darkMode ? "#fcd34d" : "#78350f", lineHeight: 1.7, opacity: 0.9 }}>
                    Het heffingsvrij inkomen onder werkelijk rendement (~€1.500) is een <strong>schatting</strong> op basis van het wetsvoorstel. De wet is nog in behandeling bij de Tweede Kamer en kan wijzigen. Alle berekeningen zijn indicatief en vormen geen fiscaal advies.
                  </div>
                </div>

                {/* Privacy */}
                <div style={{ marginBottom: 14, borderRadius: 10, padding: "14px 16px", background: T.card, border: `1px solid ${T.cardBorder}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 6 }}>Jouw gegevens blijven bij jou</div>
                  <div style={{ fontSize: 11, color: T.textSub, lineHeight: 1.7 }}>
                    Alles wat je invult blijft in je eigen browser. Wij slaan niets op, loggen niets en sturen niets door. Er zijn geen cookies, geen trackers en geen account nodig.
                  </div>
                </div>

                {/* Bronnen */}
                <InfoBlock title="Bronnen" T={T}>
                  <div style={{ fontSize: 11, color: T.textSub, lineHeight: 2 }}>
                    <div>Wetsvoorstel werkelijk rendement box 3 — tweedekamer.nl</div>
                    <div>Belastingplan 2026 (definitief) — rijksoverheid.nl</div>
                    <div>Forfaitaire percentages 2026: 6% overige bezittingen, 1,3% spaargeld — belastingdienst.nl</div>
                    <div>Heffingsvrij vermogen 2027 (placeholder): €61.000 per persoon</div>
                  </div>
                </InfoBlock>

                <button onClick={() => setShowInfo(false)} style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px",
                  background: T.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
                  fontSize: 12, fontWeight: 700, fontFamily: "inherit", marginTop: 4, marginBottom: 20,
                }}>
                  Naar de calculator
                </button>
              </div>
            </>
          ) : (
            <>

          {/* KPIs */}
          <div className="kpi-grid" style={{ marginBottom: 14 }}>
            <KpiCard label={`Eindvermogen Forfaitair`}      value={fmtK(eindF.totaal)} sub={`${jaren} jaar`} color="#3b82f6" T={T} />
            <KpiCard label={`Eindvermogen Werkelijk 2028+`} value={fmtK(eindW.totaal)} sub={`${jaren} jaar`} color="#a855f7" T={T} />
            <KpiCard
              label={diff > 0 ? "Nadeel werkelijk stelsel" : "Voordeel werkelijk stelsel"}
              value={fmtK(Math.abs(diff))}
              sub={`over ${jaren} jaar`}
              color={diff > 0 ? T.accent : "#10b981"}
              T={T}
            />
            <KpiCard
              label={betaalUitSpaar ? "Effect betaalstrategie" : "Pensioen eindwaarde"}
              value={betaalUitSpaar ? fmtK(Math.abs(eindW.totaal - eindWS.totaal)) : fmtK(eindW.pensioen)}
              sub={betaalUitSpaar ? "verschil W: spaargeld vs proportioneel" : "vrijgesteld van box 3"}
              color="#10b981"
              T={T}
            />
          </div>

          {/* Inzicht banner */}
          <div style={{ background: T.card, borderRadius: 12, padding: "12px 16px", marginBottom: 14, border: `1px solid ${T.cardBorder}`, display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, color: diff > 0 ? T.accent : "#10b981" }}>
                {diff > 0
                  ? `⚠️ Werkelijk rendement kost ${fmtK(diff)} meer over ${jaren} jaar`
                  : `✅ Werkelijk rendement scheelt ${fmtK(Math.abs(diff))} t.o.v. forfaitair`}
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.7 }}>
                Cumulatieve belasting: <span style={{ color: "#3b82f6", fontWeight: 600 }}>{fmtK(eindF.cumulBelasting)}</span> (forfaitair) vs <span style={{ color: "#a855f7", fontWeight: 600 }}>{fmtK(eindW.cumulBelasting)}</span> (werkelijk).
                {betaalUitSpaar && ` Betaalstrategie uit spaargeld geeft werkelijk eindvermogen ${fmtK(eindWS.totaal)}.`}
              </div>
            </div>
            {advOpen && (
              <div style={{ fontSize: 11, color: T.textMuted, minWidth: 150, borderLeft: `2px solid ${T.border}`, paddingLeft: 12 }}>
                <div style={{ color: T.accentMc, fontWeight: 700, marginBottom: 3 }}>Monte Carlo mediaan</div>
                <div>{fmtK(mcProp[mcProp.length-1]?.p50)} <span style={{ color: T.textFaint }}>P50</span></div>
                <div style={{ color: "#ef4444" }}>{fmtK(mcProp[mcProp.length-1]?.p10)} <span style={{ color: T.textFaint }}>P10</span></div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.cardBorder}`, overflow: "hidden", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", padding: "10px 12px 0", borderBottom: `1px solid ${T.border}`, gap: 0 }}>
              {[
                ["deterministisch", "📈 Vermogensgroei"],
                ["belasting",       "💸 Cumulatieve belasting"],
                ...(advOpen ? [["montecarlo", "🎲 Monte Carlo"]] : []),
              ].map(([k, lbl]) => (
                <button key={k} onClick={() => setActiveTab(k)} style={{
                  padding: "6px 12px 8px", border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 700, fontFamily: "inherit", background: "transparent",
                  color: activeTab === k ? T.text : T.textFaint,
                  borderBottom: activeTab === k ? `2px solid ${T.accent}` : "2px solid transparent",
                  transition: "all 0.15s", whiteSpace: "nowrap",
                }}>{lbl}</button>
              ))}
            </div>

            <div style={{ padding: "14px 6px 8px" }}>
              {activeTab === "deterministisch" && (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartDet} margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.gridLine} />
                    <XAxis dataKey="jaar" stroke={T.axisLine} tick={{ fill: T.axisTick, fontSize: 11 }} />
                    <YAxis stroke={T.axisLine} tick={{ fill: T.axisTick, fontSize: 11 }} tickFormatter={fmtK} width={68} />
                    <Tooltip {...tooltipProps} />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} formatter={(v) => <span style={{ color: T.textSub }}>{v}</span>} />
                    {DET_LINES.map((l) => (
                      <Line key={l.k} type="monotone" dataKey={l.k} stroke={l.c}
                        strokeWidth={l.d ? 1.5 : 2.5} strokeDasharray={l.d ? "5 4" : undefined}
                        dot={false} activeDot={{ r: 4 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}

              {activeTab === "belasting" && (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartBel} margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.gridLine} />
                    <XAxis dataKey="jaar" stroke={T.axisLine} tick={{ fill: T.axisTick, fontSize: 11 }} />
                    <YAxis stroke={T.axisLine} tick={{ fill: T.axisTick, fontSize: 11 }} tickFormatter={fmtK} width={68} />
                    <Tooltip {...tooltipProps} />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} formatter={(v) => <span style={{ color: T.textSub }}>{v}</span>} />
                    {BEL_LINES.map((l) => (
                      <Line key={l.k} type="monotone" dataKey={l.k} stroke={l.c}
                        strokeWidth={l.d ? 1.5 : 2.5} strokeDasharray={l.d ? "5 4" : undefined}
                        dot={false} activeDot={{ r: 4 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}

              {activeTab === "montecarlo" && (
                <>
                  <div style={{ display: "flex", gap: 14, padding: "0 8px 10px", flexWrap: "wrap" }}>
                    {[["#3b82f6", "P10–P90 (proportioneel)"], ["#f97316", "P10–P90 (uit spaargeld)"]].map(([c, l]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: T.textSub }}>
                        <div style={{ width: 12, height: 8, background: c, opacity: 0.4, borderRadius: 2 }} />{l}
                      </div>
                    ))}
                    {[["#60a5fa", "Mediaan proportioneel"], ["#fb923c", "Mediaan uit spaargeld"]].map(([c, l]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: T.textSub }}>
                        <div style={{ width: 18, height: 2, background: c }} />{l}
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={chartMC} margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.gridLine} />
                      <XAxis dataKey="jaar" stroke={T.axisLine} tick={{ fill: T.axisTick, fontSize: 11 }} />
                      <YAxis stroke={T.axisLine} tick={{ fill: T.axisTick, fontSize: 11 }} tickFormatter={fmtK} width={68} />
                      <Tooltip {...tooltipProps} />
                      <Area type="monotone" dataKey="P90 (proportioneel)" stroke="none" fill="#3b82f6" fillOpacity={0.18} dot={false} legendType="none" />
                      <Area type="monotone" dataKey="P10 (proportioneel)" stroke="none" fill={T.mcFill} fillOpacity={1} dot={false} legendType="none" />
                      <Area type="monotone" dataKey="P90 (uit spaargeld)" stroke="none" fill="#f97316" fillOpacity={0.14} dot={false} legendType="none" />
                      <Area type="monotone" dataKey="P10 (uit spaargeld)" stroke="none" fill={T.mcFill} fillOpacity={1} dot={false} legendType="none" />
                      <Line type="monotone" dataKey="P50 (proportioneel)" stroke="#60a5fa" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                      <Line type="monotone" dataKey="P50 (uit spaargeld)" stroke="#fb923c" strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div style={{ padding: "6px 10px 2px", fontSize: 10, color: T.textFaint }}>
                    500 simulaties · {mcStelsel === "werkelijk" ? "Werkelijk rendement 2028+" : "Forfaitair 2027"}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mijlpalentabel */}
          <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.cardBorder}`, overflow: "hidden", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 10, fontWeight: 800, color: T.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Mijlpalen — met bijstorting
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {["Jaar", "Forfaitair", "Werkelijk", betaalUitSpaar ? "W (spaargeld)" : "Pensioen", "Bel. F", "Bel. W", "Verschil", ...(advOpen ? ["MC P10", "MC P50"] : [])].map((h) => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "right", fontSize: 9, color: T.textFaint, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MILESTONES.map((y, i) => {
                    const f = fMet.data[y], w = wMet.data[y], ws = wMetSpaar.data[y], mc = mcProp[y];
                    if (!f || !w) return null;
                    const d = f.totaal - w.totaal;
                    return (
                      <tr key={y} style={{ borderBottom: `1px solid ${T.borderSub}`, background: i % 2 ? "transparent" : T.bg + "66" }}>
                        <td style={{ padding: "8px 12px", color: T.textMuted, textAlign: "right", fontFamily: "monospace" }}>{f.jaar}</td>
                        <td style={{ padding: "8px 12px", color: "#3b82f6",  fontWeight: 700, textAlign: "right" }}>{fmtK(f.totaal)}</td>
                        <td style={{ padding: "8px 12px", color: "#a855f7",  fontWeight: 700, textAlign: "right" }}>{fmtK(w.totaal)}</td>
                        <td style={{ padding: "8px 12px", color: betaalUitSpaar ? T.accent : "#10b981", fontWeight: 700, textAlign: "right" }}>
                          {betaalUitSpaar ? fmtK(ws?.totaal) : fmtK(w.pensioen)}
                        </td>
                        <td style={{ padding: "8px 12px", color: "#3b82f6", textAlign: "right" }}>{fmtK(f.cumulBelasting)}</td>
                        <td style={{ padding: "8px 12px", color: "#ef4444", textAlign: "right" }}>{fmtK(w.cumulBelasting)}</td>
                        <td style={{ padding: "8px 12px", fontWeight: 700, textAlign: "right", color: d > 0 ? T.accent : "#10b981" }}>
                          {d > 0 ? "+" : ""}{fmtK(d)}
                          <span style={{ fontSize: 8, fontWeight: 400, color: T.textFaint, marginLeft: 2 }}>{d > 0 ? "F↑" : "W↑"}</span>
                        </td>
                        {advOpen && <td style={{ padding: "8px 12px", color: "#7c3aed", textAlign: "right" }}>{fmtK(mc?.p10)}</td>}
                        {advOpen && <td style={{ padding: "8px 12px", color: T.accentMc, fontWeight: 700, textAlign: "right" }}>{fmtK(mc?.p50)}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ fontSize: 10, color: T.footerText, lineHeight: 1.8, paddingBottom: 16 }}>
            * Forfait 2027: 6% overige bezittingen, 1.3% spaargeld, heffingsvrij €61.000/persoon.
            Werkelijk 2028+: wetsvoorstel in behandeling — ongerealiseerde koerswinsten jaarlijks belast à 36%, heffingsvrij ~€1.500 (schatting).
            {advOpen && " Monte Carlo: normaalverdeling rondom gemiddelden, 500 simulaties, rendementsfloor −60%."}
            {" "}Pensioenbeleggingen vrijgesteld van box 3. Geen fiscaal advies.
          </div>

          {/* Privacy mini-blok onder calculator */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: T.textFaint }}>Geen cookies. Geen trackers. Alles blijft in je browser.</span>
            <button onClick={() => setShowInfo(true)} style={{
              background: "none", border: "none", cursor: "pointer", fontSize: 10,
              color: T.accent, fontFamily: "inherit", fontWeight: 600, padding: 0,
            }}>Meer info</button>
          </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
}