/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — FortuneWheel
   ═══════════════════════════════════════════════════════════════════
   Roue de la fortune avec :
     - 8 segments colorés (récompenses variées)
     - Animation rotation 4-5s avec easing easeOutCubic
     - 1 spin gratuit toutes les 24h (timestamp localStorage)
     - Spin payant : 50 pièces or
     - Pop-up de victoire avec récompense gagnée

   Récompenses possibles (avec probabilités pondérées) :
     - 50 pièces or (commun)
     - 100 pièces or (commun)
     - 1× freeze (commun)
     - 1× laser (commun)
     - 1× meteor (rare)
     - 1× magnet (rare)
     - 250 pièces or (rare)
     - JACKPOT : 1000 pièces or (epique)
   ═══════════════════════════════════════════════════════════════════ */

const { useState: useStateFW, useRef: useRefFW, useEffect: useEffectFW } = React;

const SEGMENTS = [
  { id: "coins50",   label: "50",      icon: "T", color: "#7c3aed", reward: { coins: 50 },           weight: 24 },
  { id: "freeze1",   label: "Freeze",  icon: "❄️", color: "#06b6d4", reward: { boosters: { freeze: 1 } }, weight: 16 },
  { id: "coins100",  label: "100",     icon: "T", color: "#22c55e", reward: { coins: 100 },          weight: 18 },
  { id: "laser1",    label: "Laser",   icon: "⚡", color: "#facc15", reward: { boosters: { laser: 1 } },  weight: 16 },
  { id: "meteor1",   label: "Meteor",  icon: "☄️", color: "#f97316", reward: { boosters: { meteor: 1 } }, weight: 8 },
  { id: "coins250",  label: "250",     icon: "T", color: "#ec4899", reward: { coins: 250 },          weight: 8 },
  { id: "magnet1",   label: "Magnet",  icon: "🧲", color: "#a855f7", reward: { boosters: { magnet: 1 } }, weight: 8 },
  { id: "jackpot",   label: "JACKPOT", icon: "💎", color: "#fbbf24", reward: { coins: 1000 },         weight: 2 },
];

const FREE_SPIN_INTERVAL_MS = 24 * 3600 * 1000; // 24h
const SPIN_COST_COINS = 50;
const AD_SPIN_INTERVAL_MS = 10 * 60 * 1000;
const AD_SPIN_APPEAR_CHANCE = 0.45;
const LOSE_SEGMENT = { label: "Perdu", icon: "\u2620\uFE0F", color: "#111827", lose: true, reward: null, weight: 10 };
const WHEEL_SEGMENTS = SEGMENTS.reduce((acc, seg, idx) => {
  acc.push(seg);
  acc.push({ ...LOSE_SEGMENT, id: "lose" + (idx + 1) });
  return acc;
}, []);

function FortuneWheel({ profile, onClose, onReward, onWatchAdSpin, adSpinSignal }) {
  const tr = (key, params) => window.STI18n ? window.STI18n.t(key, params) : key;
  const [angle, setAngle]             = useStateFW(0);
  const [spinning, setSpinning]       = useStateFW(false);
  const [resultIdx, setResultIdx]     = useStateFW(null);
  const [showResult, setShowResult]   = useStateFW(false);
  const [lastAdSpinTs, setLastAdSpinTs] = useStateFW(readAdSpinTs());
  const [showAdSpinOffer, setShowAdSpinOffer] = useStateFW(false);
  const lastAdSignalRef = useRefFW(adSpinSignal || 0);

  const safe = profile || {};
  const lastFreeSpinTs = safe.wheelLastFree || 0;
  const now = Date.now();
  const freeSpinReady = (now - lastFreeSpinTs) >= FREE_SPIN_INTERVAL_MS;
  const hasEnoughCoins = (safe.coins || 0) >= SPIN_COST_COINS;
  const adSpinReady = (now - lastAdSpinTs) >= AD_SPIN_INTERVAL_MS;

  // Compteur pour le prochain spin gratuit (mm:ss)
  const [waitText, setWaitText] = useStateFW(formatRemaining(lastFreeSpinTs));
  const [adWaitText, setAdWaitText] = useStateFW(formatAdRemaining(lastAdSpinTs));
  useEffectFW(() => {
    setWaitText(formatRemaining(lastFreeSpinTs));
    if (freeSpinReady) return;
    const id = setInterval(() => setWaitText(formatRemaining(lastFreeSpinTs)), 1000);
    return () => clearInterval(id);
  }, [lastFreeSpinTs, freeSpinReady]);
  useEffectFW(() => {
    setAdWaitText(formatAdRemaining(lastAdSpinTs));
    if (adSpinReady) return;
    const id = setInterval(() => setAdWaitText(formatAdRemaining(lastAdSpinTs)), 1000);
    return () => clearInterval(id);
  }, [lastAdSpinTs, adSpinReady]);
  useEffectFW(() => {
    if (!adSpinSignal || adSpinSignal === lastAdSignalRef.current) return;
    lastAdSignalRef.current = adSpinSignal;
    doSpin("ad");
  }, [adSpinSignal]);
  useEffectFW(() => {
    if (freeSpinReady) {
      setShowAdSpinOffer(false);
      return;
    }
    const saved = readAdOfferState();
    if (saved && saved.cycle === lastFreeSpinTs) {
      setShowAdSpinOffer(!!saved.show && !saved.consumed);
      return;
    }
    const show = Math.random() < AD_SPIN_APPEAR_CHANCE;
    saveAdOfferState({ cycle: lastFreeSpinTs, show: show, consumed: false });
    setShowAdSpinOffer(show);
  }, [freeSpinReady, lastFreeSpinTs]);

  function formatRemaining(lastTs) {
    const remaining = FREE_SPIN_INTERVAL_MS - (Date.now() - (lastTs || 0));
    if (remaining <= 0) return tr("available");
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    if (h > 0) return h + "h " + String(m).padStart(2, "0") + "m";
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function formatAdRemaining(lastTs) {
    const remaining = AD_SPIN_INTERVAL_MS - (Date.now() - (lastTs || 0));
    if (remaining <= 0) return tr("available");
    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function pickWeighted() {
    const total = WHEEL_SEGMENTS.reduce((acc, s) => acc + s.weight, 0);
    let r = Math.random() * total;
    for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
      r -= WHEEL_SEGMENTS[i].weight;
      if (r <= 0) return i;
    }
    return 0;
  }

  function doSpin(mode) {
    if (spinning) return;
    const isFree = mode === "free";
    const isAd = mode === "ad";
    const idx = pickWeighted();
    setResultIdx(idx);
    setSpinning(true);
    setShowResult(false);

    // Calcul de l'angle final : on tourne plusieurs fois puis on arrête
    // pour que le pointeur (en haut, 0°) tombe sur le segment idx.
    // Chaque segment fait 360/8 = 45°.
    const segAngle = 360 / WHEEL_SEGMENTS.length;
    const targetAngle = 360 - (idx * segAngle) - segAngle / 2;
    const fullRotations = 5; // rotations complètes
    const finalAngle = angle + (fullRotations * 360) + ((360 - (angle % 360)) + targetAngle) % 360;
    setAngle(finalAngle);

    // Délai = durée animation CSS
    setTimeout(() => {
      setSpinning(false);
      setShowResult(true);
      // Notifie le parent
      const seg = WHEEL_SEGMENTS[idx];
      if (typeof onReward === "function") {
        onReward({
          isFree: isFree,
          isAd: isAd,
          segment: seg,
          reward: seg.reward,
        });
      }
    }, 4500);
  }

  function handleAdSpin() {
    if (!adSpinReady || spinning || typeof onWatchAdSpin !== "function") return;
    const ts = Date.now();
    setLastAdSpinTs(ts);
    setAdWaitText(formatAdRemaining(ts));
    setShowAdSpinOffer(false);
    try { localStorage.setItem("st_wheel_ad_spin_last", String(ts)); } catch (_) {}
    saveAdOfferState({ cycle: lastFreeSpinTs, show: true, consumed: true });
    onWatchAdSpin();
  }

  return (
    <div style={SFW.root}>
      <div style={SFW.header}>
        <div style={SFW.title}>🎰 {tr("wheel")}</div>
        <button onClick={onClose} style={SFW.closeBtn} aria-label={tr("close")}>✕</button>
      </div>

      <div style={SFW.wheelWrap}>
        <Wheel angle={angle} segments={WHEEL_SEGMENTS} />
        {/* Pointeur fixé en haut */}
        <div style={SFW.pointer}>▼</div>
      </div>

      {!freeSpinReady && showAdSpinOffer && (
        <div style={SFW.statusPanel}>
          {adSpinReady ? (
            <button
              className="btn-3d gold"
              style={SFW.adSpinBtn}
              disabled={spinning}
              onClick={handleAdSpin}
            >
              {tr("watchAdSpin")}
            </button>
          ) : (
            <div style={SFW.adCooldown}>{tr("adSpinLater", { time: adWaitText })}</div>
          )}
        </div>
      )}

      {/* Boutons */}
      <div style={SFW.buttonsCol}>
        <button
          className="btn-3d"
          style={{
            ...SFW.spinBtn,
            opacity: (!freeSpinReady || spinning) ? 0.5 : 1,
            cursor: (!freeSpinReady || spinning) ? "not-allowed" : "pointer",
          }}
          disabled={!freeSpinReady || spinning}
          onClick={() => doSpin("free")}
        >
          {spinning ? "..." : (freeSpinReady ? tr("spinFree") : tr("nextSpin") + waitText)}
        </button>
        <button
          className="btn-3d gold"
          style={{
            ...SFW.spinBtn,
            opacity: (!hasEnoughCoins || spinning) ? 0.5 : 1,
            cursor: (!hasEnoughCoins || spinning) ? "not-allowed" : "pointer",
          }}
          disabled={!hasEnoughCoins || spinning}
          onClick={() => doSpin("paid")}
        >
          {spinning ? "..." : tr("spinPaid", { cost: SPIN_COST_COINS })}
        </button>
      </div>

      {/* Modal résultat */}
      {showResult && resultIdx !== null && (
        <div style={SFW.resultOverlay} onClick={() => { setShowResult(false); }}>
          <div style={SFW.resultCard} className="pop-in" onClick={(e) => e.stopPropagation()}>
            <div style={SFW.resultIcon}>{WHEEL_SEGMENTS[resultIdx].icon}</div>
            <div style={SFW.resultText}>
              {WHEEL_SEGMENTS[resultIdx].lose ? tr("tryAgainLaterTitle") : (WHEEL_SEGMENTS[resultIdx].id === "jackpot" ? tr("jackpot") : tr("congrats"))}
            </div>
            <div style={SFW.resultReward}>
              {WHEEL_SEGMENTS[resultIdx].lose ? (
                tr("tryAgainLaterMsg")
              ) : (
                <>{tr("youWin")}<strong>{WHEEL_SEGMENTS[resultIdx].label}</strong>
                {WHEEL_SEGMENTS[resultIdx].reward && WHEEL_SEGMENTS[resultIdx].reward.coins ? " " + tr("coins").toLowerCase() : ""} !</>
              )}
            </div>
            <button className="btn-3d" style={{ width: "100%" }} onClick={() => setShowResult(false)}>
              {WHEEL_SEGMENTS[resultIdx].lose ? tr("close") : tr("collect")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Wheel SVG ──────────────────────────────────────────── */
function Wheel({ angle, segments }) {
  const radius = 130;
  const cx = 150, cy = 150;
  const segAngle = 360 / segments.length;

  return (
    <div style={{
      width: 300,
      height: 300,
      transition: "transform 4.5s cubic-bezier(0.17, 0.67, 0.16, 0.99)",
      transform: "rotate(" + angle + "deg)",
      filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))",
    }}>
      <svg viewBox="0 0 300 300" width="300" height="300">
        <defs>
          <radialGradient id="wheel-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="#1a2a6e" />
            <stop offset="100%" stopColor="#0b1238" />
          </radialGradient>
        </defs>

        <circle cx={cx} cy={cy} r={radius + 10} fill="#3b0764" stroke="#5b21b6" strokeWidth="4" />

        {segments.map((seg, i) => {
          const startAngle = i * segAngle - 90 - segAngle / 2; // pointeur en haut
          const endAngle   = startAngle + segAngle;
          const path = arcPath(cx, cy, radius, startAngle, endAngle);
          const labelAngle = startAngle + segAngle / 2;
          const labelX = cx + Math.cos(labelAngle * Math.PI / 180) * (radius * 0.65);
          const labelY = cy + Math.sin(labelAngle * Math.PI / 180) * (radius * 0.65);

          return (
            <g key={seg.id}>
              <path d={path} fill={seg.color} stroke="#3b0764" strokeWidth="2" />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fontSize="22"
                fill="#fff"
                stroke="#000"
                strokeWidth="0.6"
                style={{ fontFamily: "'Lilita One', cursive" }}
                transform={"rotate(" + (labelAngle + 90) + " " + labelX + " " + labelY + ")"}
              >
                {seg.icon}
              </text>
            </g>
          );
        })}

        {/* Centre */}
        <circle cx={cx} cy={cy} r="20" fill="var(--gold)" stroke="#92400e" strokeWidth="3" />
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="20">🎯</text>
      </svg>
    </div>
  );
}

function arcPath(cx, cy, r, startDeg, endDeg) {
  const start = polar(cx, cy, r, endDeg);
  const end   = polar(cx, cy, r, startDeg);
  const largeArc = endDeg - startDeg <= 180 ? "0" : "1";
  return [
    "M", cx, cy,
    "L", start.x, start.y,
    "A", r, r, 0, largeArc, 0, end.x, end.y,
    "Z",
  ].join(" ");
}
function polar(cx, cy, r, deg) {
  const rad = (deg) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function readAdSpinTs() {
  try {
    const raw = localStorage.getItem("st_wheel_ad_spin_last");
    const n = raw ? Number(raw) : 0;
    return isFinite(n) ? n : 0;
  } catch (_) {
    return 0;
  }
}

function readAdOfferState() {
  try {
    const raw = localStorage.getItem("st_wheel_ad_offer_state");
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function saveAdOfferState(state) {
  try {
    localStorage.setItem("st_wheel_ad_offer_state", JSON.stringify(state));
  } catch (_) {}
}

const SFW = {
  root: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(6px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px calc(env(safe-area-inset-bottom, 0px) + 16px)",
    overflowY: "auto",
    zIndex: 100,
  },

  header: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 24,
    color: "var(--gold)",
    letterSpacing: 1,
    textShadow: "0 3px 0 rgba(0,0,0,0.4)",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    fontSize: 18,
    color: "#fff",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 0 rgba(0,0,0,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    padding: 0,
  },

  wheelWrap: {
    position: "relative",
    margin: "10px 0 24px",
  },
  pointer: {
    position: "absolute",
    top: -10,
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: 36,
    color: "var(--gold)",
    textShadow: "0 4px 0 #92400e",
    pointerEvents: "none",
  },

  statusPanel: {
    width: "100%",
    maxWidth: 360,
    background: "linear-gradient(180deg, rgba(26,42,110,0.94), rgba(11,18,56,0.96))",
    border: "1.5px solid rgba(255,210,63,0.34)",
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
    boxShadow: "0 5px 14px rgba(0,0,0,0.28)",
  },
  statusTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 18,
    color: "var(--gold)",
    letterSpacing: 0.5,
    marginBottom: 5,
    textShadow: "0 2px 0 rgba(0,0,0,0.35)",
  },
  statusText: {
    fontSize: 12,
    lineHeight: 1.35,
    color: "rgba(255,255,255,0.76)",
    fontWeight: 850,
    marginBottom: 10,
  },
  adSpinBtn: {
    width: "100%",
    minHeight: 42,
    padding: "10px 12px",
    fontSize: 14,
    letterSpacing: 0.4,
  },
  adCooldown: {
    borderRadius: 10,
    border: "1.5px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.28)",
    padding: "9px 10px",
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: 900,
    textAlign: "center",
  },

  buttonsCol: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "100%",
    maxWidth: 360,
  },
  spinBtn: {
    width: "100%",
    fontSize: 16,
    padding: "14px 20px",
    letterSpacing: 0.5,
  },

  resultOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 200,
  },
  resultCard: {
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "2.5px solid var(--gold)",
    borderRadius: 18,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    textAlign: "center",
    boxShadow: "0 12px 32px rgba(0,0,0,0.6), 0 0 24px rgba(255,210,63,0.4)",
  },
  resultIcon: { fontSize: 80, marginBottom: 12 },
  resultText: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 32,
    color: "var(--gold)",
    letterSpacing: 1,
    marginBottom: 8,
    textShadow: "0 3px 0 rgba(0,0,0,0.4)",
  },
  resultReward: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 20,
  },
};

window.FortuneWheel = FortuneWheel;
