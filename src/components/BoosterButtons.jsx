/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — BoosterButtons (style BONBON Tetroid)
   ═══════════════════════════════════════════════════════════════════
   v3 (Pino #3) : reproduction exacte du design Tetroid (css/boosters.css)
   = bonbons brillants ronds avec :
     - radial-gradient candy (clair → moyen → sombre)
     - box-shadow empilés : cerclage blanc 3px + cerclage couleur 6px
       + ombre 3D inférieure + glow néon
     - reflet brillant en haut-gauche (bulle de verre) + petit point
     - badge compteur vert (pastille avec bordure blanche)
     - label sous le bouton (UPPERCASE, violet clair)
     - animation tap : scale(0.88) translateY(3px)

   Couleurs OFFICIELLES Tetroid :
     ❄️ FREEZE  : bleu ciel  (#b0eeff → #30b0e8 → #0870c0)
     ⚡ LASER   : ROUGE cerise (#ffb0b0 → #ff2020 → #aa0000)
     ☄️ METEOR  : orange mandarine (#ffe090 → #ff9000 → #c05500)
     🧲 MAGNET  : violet raisin (#e8b0ff → #b020ff → #6600cc)

   Props : inventory, cooldowns, onUse, onBuy, disabled
   ═══════════════════════════════════════════════════════════════════ */

const BOOSTERS = [
  {
    id: "freeze", icon: "❄️", label: "Freeze",
    grad: ["#b0eeff", "#30b0e8", "#0870c0"],
    ring: "#30b0e8", shadow3d: "#054880", glow: "rgba(0,120,200,0.6)",
  },
  {
    id: "laser",  icon: "⚡", label: "Laser",
    grad: ["#ffb0b0", "#ff2020", "#aa0000"],
    ring: "#ff2020", shadow3d: "#700000", glow: "rgba(220,0,0,0.6)",
  },
  {
    id: "meteor", icon: "☄️", label: "Meteor",
    grad: ["#ffe090", "#ff9000", "#c05500"],
    ring: "#ff9000", shadow3d: "#7a3000", glow: "rgba(200,100,0,0.6)",
  },
  {
    id: "magnet", icon: "🧲", label: "Magnet",
    grad: ["#e8b0ff", "#b020ff", "#6600cc"],
    ring: "#b020ff", shadow3d: "#3a0088", glow: "rgba(140,0,220,0.6)",
  },
];

function BoosterButtons({ inventory, cooldowns, onUse, onBuy, disabled }) {
  const inv = inventory || {};
  const cd = cooldowns || {};

  return (
    <div style={SBB.root}>
      {BOOSTERS.map((b) => {
        const count    = inv[b.id] ?? 0;
        const cooldown = cd[b.id] ?? 0;
        const empty    = count <= 0;
        const onCD     = cooldown > 0;
        const isDisabled = !!disabled || onCD;

        return (
          <div key={b.id} style={SBB.bb}>
            {/* Le bonbon (cercle brillant) */}
            <button
              onClick={() => {
                if (disabled || onCD) return;
                if (empty) {
                  if (typeof onBuy === "function") onBuy(b.id);
                } else {
                  if (typeof onUse === "function") onUse(b.id);
                }
              }}
              disabled={isDisabled && !empty}
              className="st-candy"
              style={{
                ...SBB.bi,
                opacity: (disabled || onCD) ? 0.45 : 1,
                cursor: isDisabled && !empty ? "not-allowed" : "pointer",
                background: empty
                  ? "radial-gradient(circle at 35% 30%, #555, #333, #111)"
                  : "radial-gradient(circle at 35% 30%, "
                    + b.grad[0] + ", " + b.grad[1] + ", " + b.grad[2] + ")",
                /* 4 box-shadows empilés : cerclage blanc + cerclage couleur
                   + ombre 3D inférieure + glow néon (look exact Tetroid). */
                boxShadow: empty
                  ? "0 0 0 3px #fff, 0 0 0 6px #555, 0 6px 0 #111, 0 8px 16px rgba(0,0,0,0.5)"
                  : "0 0 0 3px #fff, "
                    + "0 0 0 6px " + b.ring + ", "
                    + "0 6px 0 " + b.shadow3d + ", "
                    + "0 8px 16px " + b.glow,
              }}
              aria-label={b.label + " booster"}
            >
              {/* Reflet brillant en haut-gauche (bulle de verre Tetroid) */}
              <span style={SBB.shineMain} />
              <span style={SBB.shineDot} />

              {/* Icône au centre */}
              <span style={SBB.icon}>{b.icon}</span>

              {/* Pastille compteur vert OU "+" doré */}
              {empty ? (
                <span style={SBB.plusBadge}>+</span>
              ) : (
                <span style={SBB.countBadge}>{count}</span>
              )}

              {/* Cooldown overlay circulaire */}
              {onCD && (
                <span style={SBB.cdOverlay}>
                  {Math.ceil(cooldown / 1000)}s
                </span>
              )}
            </button>

            {/* Label sous le bouton */}
            <span style={SBB.label}>{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Styles : reproduction exacte boosters.css Tetroid ─────── */
const SBB = {
  /* Container : fond violet foncé avec bordure haut violet vif (Tetroid) */
  root: {
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "center",
    padding: "10px 4px calc(env(safe-area-inset-bottom, 0px) + 12px)",
    background: "linear-gradient(180deg, #4a1a6e 0%, #2d0f4a 100%)",
    borderTop: "4px solid #8b2fc9",
    boxShadow: "inset 0 1px 0 rgba(180,80,255,0.3), 0 -2px 10px rgba(0,0,0,0.5)",
    flexShrink: 0,
  },
  /* Wrapper bonbon + label */
  bb: {
    flex: 1,
    maxWidth: "25%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
    cursor: "pointer",
    userSelect: "none",
    WebkitUserSelect: "none",
    padding: "2px 0",
  },
  /* Le bonbon (cercle) */
  bi: {
    /* clamp : 44px → 11vw → 56px max (responsive comme Tetroid) */
    width: "clamp(44px, 11vw, 56px)",
    height: "clamp(44px, 11vw, 56px)",
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "clamp(1.2rem, 4vw, 1.55rem)",
    position: "relative",
    overflow: "visible",
    transform: "translateZ(0)",
    transition: "transform 0.12s, box-shadow 0.12s",
    isolation: "isolate",
    padding: 0,
  },
  /* Reflet principal (bulle verre) en haut-gauche */
  shineMain: {
    position: "absolute",
    top: "8%", left: "10%",
    width: "46%", height: "30%",
    background: "linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0) 100%)",
    borderRadius: "50%",
    transform: "rotate(-15deg)",
    pointerEvents: "none",
    zIndex: 1,
  },
  /* Petit point brillant (genre highlight glass) */
  shineDot: {
    position: "absolute",
    top: "11%", left: "19%",
    width: "13%", height: "13%",
    background: "rgba(255,255,255,0.95)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 2,
  },
  /* Icône emoji centrale */
  icon: {
    position: "relative",
    zIndex: 3,
    fontSize: "clamp(1.4rem, 4.5vw, 1.75rem)",
    lineHeight: 1,
    filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.5))",
  },
  /* Badge compteur vert Tetroid (radial gradient) */
  countBadge: {
    position: "absolute",
    bottom: -4, right: -4,
    background: "radial-gradient(circle at 35% 30%, #80ff80, #20c020, #107010)",
    border: "1.5px solid #fff",
    borderRadius: "50%",
    width: 20, height: 20,
    fontSize: "0.7rem",
    fontWeight: 900,
    fontFamily: "'Lilita One', sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 0 #085008, 0 3px 6px rgba(0,100,0,0.5)",
    color: "#fff",
    textShadow: "0 1px 2px rgba(0,60,0,0.8)",
    zIndex: 10,
  },
  /* Badge "+" doré quand vide → renvoie au shop */
  plusBadge: {
    position: "absolute",
    bottom: -4, right: -4,
    background: "radial-gradient(circle at 35% 30%, #ffec80, #ffd23f, #d97706)",
    border: "1.5px solid #fff",
    borderRadius: "50%",
    width: 20, height: 20,
    fontSize: "0.85rem",
    fontWeight: 900,
    fontFamily: "'Lilita One', sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    boxShadow: "0 2px 0 #92400e, 0 3px 6px rgba(217,119,6,0.5)",
    zIndex: 10,
  },
  /* Cooldown overlay circulaire */
  cdOverlay: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    color: "#fff",
    fontWeight: 800,
    zIndex: 20,
  },
  /* Label sous le bonbon */
  label: {
    fontFamily: "'Lilita One', sans-serif",
    fontSize: "0.6rem",
    letterSpacing: 0.5,
    color: "#e8b0ff",
    textTransform: "uppercase",
    textShadow: "0 1px 4px rgba(0,0,0,0.9)",
    marginTop: 8,
    display: "block",
  },
};

window.BoosterButtons = BoosterButtons;
