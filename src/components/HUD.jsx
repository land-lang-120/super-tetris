/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — HUD (Heads-Up Display) v4
   ═══════════════════════════════════════════════════════════════════
   v4 (Pino #3 + #4) :
     - Hero row SCORE/TIME SUPPRIMÉ (gagne ~80px verticaux)
     - HUD = UNE SEULE rangée à 4 colonnes :
       LVL | COMBO | NEXT | SCORE      (HOLD remplacé par SCORE)
     - TIMER sort du HUD : devient flottant à GAUCHE du canvas
       (à l'opposé des boutons pause/accueil qui sont à droite).
       → Géré par GameScreen.jsx, pas ici.

   Layout final v4 :
     ┌────────────────────────────────────────┐
     │ LVL │ COMBO │  NEXT  │      SCORE      │  ← UNE rangée HUD
     │  3  │  ×2   │  ▣▣    │     12 345      │
     └────────────────────────────────────────┘
        timer ←── canvas ──→ [⏸] [🏠]   (overlay flottant)
   ═══════════════════════════════════════════════════════════════════ */

const { useEffect: useEffectHUD, useRef: useRefHUD } = React;

function HUD({ time, targetLines, currentLines, score, level, combo, nextPiece, holdPiece }) {
  const nextCanvasRef = useRefHUD(null);

  useEffectHUD(() => {
    const cv = nextCanvasRef.current;
    if (!cv || !window.STRender) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    window.STRender.drawMiniPiece(ctx, nextPiece || null, 10);
  }, [nextPiece]);

  return (
    <div style={SHUD.root}>
      {/* ═══ UNIQUE rangée v4 : LVL / COMBO / NEXT / SCORE ═══
          HOLD retiré, remplacé par SCORE (l'info la + utile).
          TIME géré séparément en overlay par GameScreen. */}
      <div style={SHUD.midRow}>
        <BadgeStat
          label="LVL"
          value={level || 1}
          color="var(--purple-l)"
        />
        <BadgeStat
          label="COMBO"
          value={combo > 0 ? "×" + combo : "×0"}
          color={combo > 0 ? "var(--gold)" : "rgba(255,255,255,0.5)"}
        />
        <BadgeMini label="NEXT" ref_={nextCanvasRef} />
        <BadgeStat
          label="SCORE"
          value={formatNum(score)}
          color="var(--gold)"
          flex={2}
        />
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */
function BadgeStat({ label, value, color, sub, flex }) {
  return (
    <div style={{ ...SHUD.badge, flex: flex || 1 }}>
      <div style={SHUD.badgeLabel}>{label}</div>
      <div style={{ ...SHUD.badgeValue, color: color }}>{value}</div>
      {sub && <div style={SHUD.badgeSub}>{sub}</div>}
    </div>
  );
}

/* BadgeMini : même apparence/dimensions qu'un BadgeStat, mais le
   "value" est un mini canvas (pour NEXT et HOLD).
   Tient pile dans la grille 4 colonnes du midRow. */
function BadgeMini({ label, ref_ }) {
  return (
    <div style={SHUD.badge}>
      <div style={SHUD.badgeLabel}>{label}</div>
      <canvas
        ref={ref_}
        width={48}
        height={32}
        style={{ display: "block", marginTop: 1 }}
      />
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────── */
function formatTime(ms) {
  const total = Math.max(0, Math.floor((ms || 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function formatNum(n) {
  const safe = typeof n === "number" && isFinite(n) ? n : 0;
  return safe.toLocaleString("fr-FR");
}

/* ─── Styles ─────────────────────────────────────────────────── */
const SHUD = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "calc(env(safe-area-inset-top, 0px) + 8px) 10px 6px",
  },

  /* ═══ UNIQUE rangée v4 (Lvl / Combo / Next / Score) ═══ */
  midRow: {
    display: "flex",
    gap: 6,
    alignItems: "stretch",
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    borderRadius: 14,
    padding: "8px 10px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 rgba(0,0,0,0.3)",
  },
  badge: {
    flex: 1,
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(124,58,237,0.4)",
    borderRadius: 10,
    padding: "5px 8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: 800,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 1,
    marginBottom: 2,
  },
  badgeValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 20,
    lineHeight: 1.1,
    textShadow: "0 1px 0 rgba(0,0,0,0.4), 0 0 8px currentColor",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  },
  badgeSub: {
    fontSize: 9,
    color: "rgba(255,255,255,0.5)",
    fontWeight: 700,
    marginTop: 1,
  },
  /* (v4) hero row + miniRow supprimés : layout consolidé en 1 rangée */
};

window.HUD = HUD;
