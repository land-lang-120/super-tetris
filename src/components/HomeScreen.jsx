/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — HomeScreen
   ═══════════════════════════════════════════════════════════════════
   Écran d'accueil principal :
     - Header : pièces or + jaune (couronnes/coins) + rang
     - Trophée 3D doré flottant au centre (animation float)
     - Bouton PLAY géant (vert, style 3D)
     - Boutons secondaires : Stats (📊), Boutique (🛒), Paramètres (⚙️), Roue (🎰)
     - Bandeau bas "NIVEAUX TRÉPIDANTS!" avec pièces décoratives

   Lit l'état global (props) :
     - profile : { coins, xp, rank, bestScore, boosters }
     - onNavigate(screen) : callback pour changer d'écran

   Pas d'écriture localStorage ici — c'est le rôle de App.jsx.
   ═══════════════════════════════════════════════════════════════════ */

const { useState: useStateHome } = React;

function HomeScreen({ profile, onNavigate }) {
  const safe = profile || {};
  const coins = safe.coins ?? 0;
  const xp = safe.xp ?? 0;
  const bestScore = safe.bestScore ?? 0;
  const tr = (key, params) => window.STI18n ? window.STI18n.t(key, params) : key;

  // Calcul du rang à partir de l'XP
  const rank = computeRankFromXP(xp);

  return (
    <div style={SH.root}>
      <Starfield count={20} />

      {/* ─── Header : grid 3 cols (coins gauche / RECRUE centre / settings droite) ── */}
      <div style={SH.header}>
        <div style={{ justifySelf: "start" }}>
          <div style={SH.coinsPill}>
            <span style={SH.coinIcon}>T</span>
            <span style={SH.coinValue}>{formatNum(coins)}</span>
            <button
              onClick={() => onNavigate && onNavigate("shop")}
              style={SH.coinPlus}
              aria-label={tr("shop")}
            >+</button>
          </div>
        </div>

        {/* Wrapper flex : double-ceinture pour garantir le centrage,
            même si le navigateur a un bug d'interprétation grid auto. */}
        <div style={{ display:"flex", justifyContent:"center", justifySelf:"center" }}>
          <button
            onClick={() => onNavigate && onNavigate("stats")}
            style={SH.rankBadge}
            aria-label={tr("localRank")}
          >
            <span style={SH.rankIcon}>{rank.icon}</span>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", lineHeight:1.1 }}>
              <span style={SH.rankTitle}>{tr(rank.titleKey)}</span>
              <span style={SH.rankXP}>{formatNum(xp)} {tr("xp")}</span>
            </div>
          </button>
        </div>

        <div style={SH.headerTools}>
          <button
            onClick={() => onNavigate && onNavigate("stats")}
            style={SH.iconBtn}
            aria-label={tr("localRank")}
          ><PodiumIcon /></button>
          <button
            onClick={() => onNavigate && onNavigate("settings")}
            style={SH.iconBtn}
            aria-label={tr("settings")}
          >⚙️</button>
        </div>
      </div>

      {/* ─── Trophée 3D + meilleur score ──────────────────────────── */}
      <div style={SH.trophyWrap} className="float">
        <Trophy />
        {bestScore > 0 && (
          <div style={SH.bestScore}>
            {tr("record")} : <strong>{formatNum(bestScore)}</strong>
          </div>
        )}
      </div>

      {/* ─── Bouton PLAY géant + boutons secondaires ─────────────── */}
      <div style={SH.actionBar}>
        <button
          onClick={() => onNavigate && onNavigate("wheel")}
          className="btn-3d gold icon-only"
          style={SH.actionSide}
          aria-label={tr("wheel")}
        >🎰</button>

        <button
          onClick={() => {
            // v1.7 : pré-warm AudioContext sur ce gesture user garanti
            // (sinon le 1er son du jeu peut être muet à cause de la
            // policy autoplay des navigateurs).
            if (window.STAudio) window.STAudio.play("button");
            if (onNavigate) onNavigate("game");
          }}
          className="btn-3d"
          style={SH.playBtn}
        >{tr("newGame")}</button>

        <button
          onClick={() => onNavigate && onNavigate("shop")}
          className="btn-3d purple icon-only"
          style={SH.actionSide}
          aria-label={tr("shop")}
        >🛒</button>
      </div>

      {/* ─── Bandeau bas "NIVEAUX TRÉPIDANTS" ─────────────────────── */}
      <div style={SH.bottomBanner}>
        <div style={SH.bannerText}>
          <span style={SH.bannerLine1}>{tr("levels")}</span>
          <span style={SH.bannerLine2}>{tr("thrilling")}</span>
        </div>
        <DecoPieces />
      </div>

      {/* v1.22.10 — Marqueur version visible : permet à Pino de vérifier que
           le SW a bien servi la dernière build. Si tu vois "v1.13" ou autre
           ici, ton phone est en cache : Settings → Apps → Super Tetris →
           Clear storage. */}
      <div style={{
        textAlign: "center",
        color: "rgba(255,255,255,0.35)",
        fontSize: 10,
        letterSpacing: "0.2em",
        fontFamily: "system-ui",
        marginTop: 12,
        marginBottom: 4,
      }}>
        v1.22.10
      </div>
    </div>
  );
}

/* ─── Trophée 3D doré (SVG inline pour ne dépendre d'aucune image) ── */
function Trophy() {
  return (
    <svg
      width="220"
      height="240"
      viewBox="0 0 220 240"
      style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.45)) drop-shadow(0 0 32px rgba(124,58,237,0.4))" }}
    >
      {/* Socle violet 3D */}
      <ellipse cx="110" cy="222" rx="78" ry="14" fill="rgba(0,0,0,0.4)" />
      <rect x="46" y="180" width="128" height="36" rx="6" fill="#5b21b6" />
      <rect x="46" y="180" width="128" height="12" rx="6" fill="#7c3aed" />

      {/* Pied du trophée */}
      <rect x="80" y="155" width="60" height="28" fill="#5b21b6" rx="4" />
      <rect x="80" y="155" width="60" height="8" fill="#a855f7" rx="4" />

      {/* Bowl du trophée — dégradé doré + violet */}
      <defs>
        <linearGradient id="bowl" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#9333ea" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id="t-shape" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#ffec80" />
          <stop offset="100%" stopColor="#ffd23f" />
        </linearGradient>
      </defs>

      <path
        d="M 38 50 Q 38 30, 60 30 L 160 30 Q 182 30, 182 50 L 175 145 Q 170 165, 110 165 Q 50 165, 45 145 Z"
        fill="url(#bowl)"
        stroke="#3b0764"
        strokeWidth="3"
      />

      {/* Lettre T or sur le trophée */}
      <path
        d="M 65 60 L 155 60 L 155 80 L 125 80 L 125 145 L 95 145 L 95 80 L 65 80 Z"
        fill="url(#t-shape)"
        stroke="#b8860b"
        strokeWidth="2"
      />

      {/* Highlight blanc sur le bord du bowl */}
      <path
        d="M 50 45 Q 50 38, 60 38 L 160 38"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Étincelles autour */}
      <Sparkle x="20"  y="60"  size="6" />
      <Sparkle x="195" y="80"  size="5" />
      <Sparkle x="15"  y="140" size="4" />
      <Sparkle x="200" y="160" size="6" />
    </svg>
  );
}

function Sparkle({ x, y, size }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <path
        d={`M 0 -${size} L ${size*0.3} -${size*0.3} L ${size} 0 L ${size*0.3} ${size*0.3} L 0 ${size} L -${size*0.3} ${size*0.3} L -${size} 0 L -${size*0.3} -${size*0.3} Z`}
        fill="#fff"
        opacity="0.9"
      >
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </path>
    </g>
  );
}

/* ─── Pièces décoratives en bas ───────────────────────────────── */
function PodiumIcon() {
  return (
    <span style={SH.podiumIcon} aria-hidden="true">
      <span style={{ ...SH.medalDot, ...SH.medalGold }}>1</span>
      <span style={{ ...SH.medalDot, ...SH.medalSilver }}>2</span>
      <span style={{ ...SH.medalDot, ...SH.medalBronze }}>3</span>
      <span style={{ ...SH.podiumStep, ...SH.stepTwo }} />
      <span style={{ ...SH.podiumStep, ...SH.stepOne }} />
      <span style={{ ...SH.podiumStep, ...SH.stepThree }} />
    </span>
  );
}

function DecoPieces() {
  return (
    <div style={SH.decoWrap}>
      {/* Pièce L (orange) */}
      <div style={{ ...SH.decoPiece, transform: "rotate(-12deg)" }}>
        <div style={{ display:"grid", gridTemplate: "repeat(2, 18px) / repeat(3, 18px)", gap: 1 }}>
          {[0,0,1,1,1,1].map((v,i) => (
            <div key={i} style={{
              background: v ? "var(--orange)" : "transparent",
              borderRadius: 2,
              boxShadow: v ? "inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.3)" : "none",
            }} />
          ))}
        </div>
      </div>
      {/* Pièce T (violette) */}
      <div style={{ ...SH.decoPiece, transform: "rotate(8deg)" }}>
        <div style={{ display:"grid", gridTemplate: "repeat(2, 18px) / repeat(3, 18px)", gap: 1 }}>
          {[0,1,0,1,1,1].map((v,i) => (
            <div key={i} style={{
              background: v ? "var(--purple-l)" : "transparent",
              borderRadius: 2,
              boxShadow: v ? "inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.3)" : "none",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */
function formatNum(n) {
  const safeN = typeof n === "number" && isFinite(n) ? n : 0;
  return safeN.toLocaleString("fr-FR");
}

function computeRankFromXP(xp) {
  const x = Math.max(0, xp || 0);
  if (x >= 1000000) return { titleKey: "rankGrandMaster", icon: "👑", level: 8 };
  if (x >=  500000) return { titleKey: "rankLegend",      icon: "👑", level: 7 };
  if (x >=  150000) return { titleKey: "rankMaster",      icon: "💎", level: 6 };
  if (x >=   50000) return { titleKey: "rankDiamond",     icon: "💎", level: 5 };
  if (x >=   15000) return { titleKey: "rankGold",        icon: "🥇", level: 4 };
  if (x >=    5000) return { titleKey: "rankSilver",      icon: "🥈", level: 3 };
  if (x >=    1000) return { titleKey: "rankBronze",      icon: "🥉", level: 2 };
  return                  { titleKey: "rankRookie",      icon: "🥉", level: 1 };
}

const SH = {
  root: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    background: "radial-gradient(ellipse at top, #1a2a6e, #0b1238 70%)",
    overflow: "hidden",
  },

  header: {
    /* v1.2 fix : grid 3 colonnes égales = badge RECRUE vraiment centré */
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px",
    gap: 8,
    position: "relative",
    zIndex: 2,
  },

  coinsPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    borderRadius: 100,
    padding: "6px 4px 6px 10px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 rgba(0,0,0,0.3)",
  },
  coinIcon: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Lilita One', cursive",
    fontSize: 14,
    color: "#4a2600",
    background: "radial-gradient(circle at 32% 26%, #fff7ad, #ffd23f 48%, #d97706 100%)",
    border: "1.5px solid rgba(255,255,255,0.78)",
    boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.55), inset -1px -2px 0 rgba(120,53,15,0.45), 0 2px 0 #92400e",
    lineHeight: 1,
  },
  coinValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 16,
    color: "var(--gold)",
    minWidth: 40,
    textAlign: "center",
    textShadow: "0 1px 0 rgba(0,0,0,0.4)",
  },
  coinPlus: {
    background: "var(--green)",
    color: "#fff",
    width: 28,
    height: 28,
    borderRadius: "50%",
    fontSize: 18,
    fontWeight: 800,
    boxShadow: "0 2px 0 var(--green-d), inset 0 1px 0 rgba(255,255,255,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },

  rankBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "linear-gradient(180deg, var(--purple), var(--purple-d))",
    border: "none",
    borderRadius: 14,
    padding: "6px 12px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 0 rgba(0,0,0,0.3)",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  rankIcon: { fontSize: 22 },
  rankTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 13,
    letterSpacing: 0.5,
    color: "#fff",
    textShadow: "0 1px 0 rgba(0,0,0,0.4)",
  },
  rankXP: { fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.7)" },

  headerTools: {
    justifySelf: "end",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    fontSize: 22,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 rgba(0,0,0,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  podiumIcon: {
    width: 28,
    height: 28,
    position: "relative",
    display: "inline-block",
  },
  podiumStep: {
    position: "absolute",
    bottom: 0,
    width: 9,
    borderRadius: "3px 3px 2px 2px",
    boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.28), inset -1px -1px 0 rgba(0,0,0,0.32)",
  },
  stepTwo: {
    left: 1,
    height: 13,
    background: "linear-gradient(180deg, #cbd5e1, #64748b)",
  },
  stepOne: {
    left: 10,
    height: 18,
    background: "linear-gradient(180deg, #ffec80, #d97706)",
  },
  stepThree: {
    left: 19,
    height: 10,
    background: "linear-gradient(180deg, #fdba74, #9a3412)",
  },
  medalDot: {
    position: "absolute",
    top: 0,
    width: 10,
    height: 10,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Lilita One', cursive",
    fontSize: 7,
    lineHeight: 1,
    color: "#211000",
    border: "1px solid rgba(255,255,255,0.75)",
    zIndex: 2,
    boxShadow: "0 1px 2px rgba(0,0,0,0.45)",
  },
  medalGold: { left: 9, background: "linear-gradient(180deg, #fff7ad, #facc15)" },
  medalSilver: { left: 0, top: 5, background: "linear-gradient(180deg, #f8fafc, #94a3b8)" },
  medalBronze: { left: 18, top: 7, background: "linear-gradient(180deg, #fed7aa, #c2410c)" },

  trophyWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 280,
    position: "relative",
    zIndex: 2,
  },
  bestScore: {
    marginTop: 8,
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(124,58,237,0.5)",
    borderRadius: 12,
    padding: "6px 16px",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
  },

  actionBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "0 24px 24px",
    position: "relative",
    zIndex: 2,
  },
  actionSide: { fontSize: 24, padding: 14, minWidth: 64 },
  playBtn: {
    flex: 1,
    fontSize: "clamp(22px, 6vw, 30px)",
    padding: "20px 32px",
    letterSpacing: 1.5,
    minHeight: 64,
  },
  bottomBanner: {
    position: "relative",
    background: "linear-gradient(180deg, #1e3a8a, #0b1238)",
    padding: "20px 24px calc(env(safe-area-inset-bottom, 0px) + 20px)",
    borderTop: "2px solid var(--purple)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    minHeight: 110,
  },
  bannerText: {
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Lilita One', cursive",
    color: "#fff",
    textShadow: "0 3px 0 rgba(0,0,0,0.4), 0 6px 8px rgba(0,0,0,0.4)",
    lineHeight: 0.95,
  },
  bannerLine1: { fontSize: "clamp(28px, 7vw, 40px)", letterSpacing: 1.5 },
  bannerLine2: {
    fontSize: "clamp(22px, 5vw, 30px)",
    letterSpacing: 1,
    color: "var(--gold)",
    WebkitTextStroke: "1.5px #5b21b6",
  },

  decoWrap: { display: "flex", gap: 10 },
  decoPiece: { padding: 4 },
};

window.HomeScreen = HomeScreen;
