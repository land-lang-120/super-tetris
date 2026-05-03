/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — HUD (Heads-Up Display) v2
   ═══════════════════════════════════════════════════════════════════
   Hiérarchie visuelle revue (retour Pino 2026-05-03) :
     - Top row : SCORE (très grand, gold) + TIME (côté à côté, équivalents)
     - Middle row : LEVEL / COMBO / NEXT / HOLD (badges plus petits)
     - Target en sous-titre du score (ex: "/ 17 lignes")

   Le score doit être assez grand pour être lisible pendant le jeu et
   sur la capture pour le classement (futur tournoi).
   ═══════════════════════════════════════════════════════════════════ */

const { useEffect: useEffectHUD, useRef: useRefHUD } = React;

function HUD({ time, targetLines, currentLines, score, level, combo, nextPiece, holdPiece }) {
  const nextCanvasRef = useRefHUD(null);
  const holdCanvasRef = useRefHUD(null);

  useEffectHUD(() => {
    const cv = nextCanvasRef.current;
    if (!cv || !window.STRender) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    window.STRender.drawMiniPiece(ctx, nextPiece || null, 12);
  }, [nextPiece]);

  useEffectHUD(() => {
    const cv = holdCanvasRef.current;
    if (!cv || !window.STRender) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    window.STRender.drawMiniPiece(ctx, holdPiece || null, 12);
  }, [holdPiece]);

  const remaining = Math.max(0, (targetLines || 0) - (currentLines || 0));

  return (
    <div style={SHUD.root}>
      {/* ═══ TOP ROW : SCORE (huge gold) + TIME (huge cyan) ═══ */}
      <div style={SHUD.heroRow}>
        <div style={SHUD.heroBlock}>
          <div style={SHUD.heroLabel}>SCORE</div>
          <div style={SHUD.scoreValue}>{formatNum(score)}</div>
        </div>
        <div style={SHUD.heroDivider} />
        <div style={SHUD.heroBlock}>
          <div style={SHUD.heroLabel}>TIME</div>
          <div style={SHUD.timeValue}>{formatTime(time)}</div>
        </div>
      </div>

      {/* ═══ MIDDLE ROW : LEVEL / COMBO / TARGET ═══ */}
      <div style={SHUD.midRow}>
        <BadgeStat label="LVL"   value={level || 1} color="var(--purple-l)" />
        <BadgeStat label="COMBO" value={combo > 0 ? "×" + combo : "×0"} color={combo > 0 ? "var(--gold)" : "rgba(255,255,255,0.5)"} />
        <BadgeStat label="LINES" value={currentLines || 0} color="var(--green-l)" sub={remaining < 999 ? "/ " + remaining + " restant" : null} />
      </div>

      {/* ═══ BOTTOM ROW : NEXT / HOLD (mini canvases) ═══ */}
      <div style={SHUD.miniRow}>
        <MiniCanvas label="NEXT" ref_={nextCanvasRef} />
        <MiniCanvas label="HOLD" ref_={holdCanvasRef} />
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */
function BadgeStat({ label, value, color, sub }) {
  return (
    <div style={SHUD.badge}>
      <div style={SHUD.badgeLabel}>{label}</div>
      <div style={{ ...SHUD.badgeValue, color: color }}>{value}</div>
      {sub && <div style={SHUD.badgeSub}>{sub}</div>}
    </div>
  );
}

function MiniCanvas({ label, ref_ }) {
  return (
    <div style={SHUD.miniCard}>
      <div style={SHUD.miniLabel}>{label}</div>
      <canvas ref={ref_} width={56} height={40} style={{ display: "block" }} />
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

  /* ═══ HERO ROW (Score + Time très visible) ═══ */
  heroRow: {
    display: "flex",
    alignItems: "stretch",
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    borderRadius: 14,
    padding: "10px 16px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 rgba(0,0,0,0.3)",
  },
  heroBlock: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },
  heroDivider: {
    width: 2,
    background: "rgba(255,255,255,0.12)",
    margin: "4px 12px",
    borderRadius: 2,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: 800,
    color: "var(--sky)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  scoreValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: "clamp(22px, 6vw, 32px)",
    color: "var(--gold)",
    letterSpacing: 0.5,
    textShadow: "0 2px 0 rgba(0,0,0,0.4), 0 0 12px rgba(255,210,63,0.4)",
    lineHeight: 1.1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%",
  },
  timeValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: "clamp(22px, 6vw, 32px)",
    color: "var(--sky)",
    letterSpacing: 1,
    textShadow: "0 2px 0 rgba(0,0,0,0.4), 0 0 12px rgba(56,189,248,0.4)",
    lineHeight: 1.1,
    whiteSpace: "nowrap",
  },

  /* ═══ MIDDLE ROW (Level / Combo / Lines) ═══ */
  midRow: {
    display: "flex",
    gap: 6,
    alignItems: "stretch",
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
    minWidth: 0,
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: 800,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 1,
  },
  badgeValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 18,
    lineHeight: 1.1,
    textShadow: "0 1px 0 rgba(0,0,0,0.4)",
  },
  badgeSub: {
    fontSize: 9,
    color: "rgba(255,255,255,0.5)",
    fontWeight: 700,
    marginTop: 1,
  },

  /* ═══ MINI ROW (Next / Hold) ═══ */
  miniRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  miniCard: {
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    borderRadius: 10,
    padding: "4px 10px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 3px 0 rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  miniLabel: {
    fontSize: 9,
    fontWeight: 800,
    color: "var(--sky)",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
};

window.HUD = HUD;
