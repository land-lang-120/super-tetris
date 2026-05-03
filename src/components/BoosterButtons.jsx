/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — BoosterButtons
   ═══════════════════════════════════════════════════════════════════
   Barre fixe en bas de l'écran de jeu avec les 4 boosters consommables :
     - ❄️ Freeze : stop la chute pendant 3s
     - ⚡ Laser  : détruit la ligne courante
     - ☄️ Meteor : détruit 5 cellules aléatoires
     - 🧲 Magnet : attire les pièces dans les trous

   Chaque bouton affiche le compteur restant. Si compteur = 0,
   le bouton est grisé avec un "+" pour acheter (V2 → ouvre shop).

   Props:
     - inventory: { freeze, laser, meteor, magnet } (compteurs)
     - cooldowns: { freeze, laser, meteor, magnet } (ms restants si en cooldown)
     - onUse(boosterId): callback quand l'utilisateur active
     - onBuy(boosterId): callback quand le compteur est à 0 (V2)
     - disabled: bool (game pause / over)
   ═══════════════════════════════════════════════════════════════════ */

const BOOSTERS = [
  { id: "freeze", icon: "❄️", color: "#06b6d4", label: "Freeze" },
  { id: "laser",  icon: "⚡", color: "#facc15", label: "Laser"  },
  { id: "meteor", icon: "☄️", color: "#f97316", label: "Meteor" },
  { id: "magnet", icon: "🧲", color: "#ec4899", label: "Magnet" },
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
        const isDisabled = !!disabled || (empty && !onBuy) || onCD;

        return (
          <button
            key={b.id}
            onClick={() => {
              if (disabled) return;
              if (onCD) return;
              if (empty) {
                if (typeof onBuy === "function") onBuy(b.id);
              } else {
                if (typeof onUse === "function") onUse(b.id);
              }
            }}
            disabled={isDisabled && !empty}
            style={{
              ...SBB.btn,
              opacity: (disabled || onCD) ? 0.45 : 1,
              cursor: isDisabled && !empty ? "not-allowed" : "pointer",
              borderColor: empty ? "rgba(255,255,255,0.25)" : b.color,
              /* Halo extérieur + ombre 3D vers le bas pour effet "bouton physique" */
              boxShadow: empty
                ? "0 5px 0 rgba(0,0,0,0.35), inset 0 2px 0 rgba(255,255,255,0.05)"
                : "0 5px 0 " + shade(b.color, -40) + ", "
                  + "0 0 18px " + alpha(b.color, 0.55) + ", "
                  + "inset 0 2px 0 rgba(255,255,255,0.25), "
                  + "inset 0 -3px 0 " + alpha("#000", 0.3),
              background: empty
                ? "radial-gradient(circle at 30% 30%, var(--bg2), var(--bg1))"
                : "radial-gradient(circle at 30% 30%, "
                  + alpha(b.color, 1) + ", "
                  + shade(b.color, -25) + ")",
            }}
            aria-label={b.label + " booster"}
          >
            {/* Icône XL au centre */}
            <span style={{
              ...SBB.icon,
              filter: empty ? "grayscale(0.85) opacity(0.6)" : "drop-shadow(0 2px 2px rgba(0,0,0,0.5))",
            }}>{b.icon}</span>

            {/* Badge compteur (pastille en bas-droite) ou + doré */}
            {empty ? (
              <span style={SBB.plusBadge}>+</span>
            ) : (
              <span style={{
                ...SBB.countBadge,
                background: "linear-gradient(180deg, " + b.color + ", " + shade(b.color, -30) + ")",
              }}>{count}</span>
            )}

            {/* Cooldown overlay circulaire */}
            {onCD && (
              <span style={SBB.cdOverlay}>
                {Math.ceil(cooldown / 1000)}s
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Helpers couleur ─────────────────────────────────────────── */
function alpha(hex, a) {
  // hex (#rrggbb ou #rgb) → rgba(...)
  if (!hex || hex[0] !== "#") return `rgba(124,58,237,${a})`;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = parseInt(h.slice(0,2), 16);
  const g = parseInt(h.slice(2,4), 16);
  const b = parseInt(h.slice(4,6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function shade(hex, amount) {
  // Décale le hex de `amount` (-100..+100). Négatif = plus sombre.
  if (!hex || hex[0] !== "#") return hex;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = clamp(parseInt(h.slice(0,2), 16) + amount, 0, 255);
  const g = clamp(parseInt(h.slice(2,4), 16) + amount, 0, 255);
  const b = clamp(parseInt(h.slice(4,6), 16) + amount, 0, 255);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function toHex(n) { return n.toString(16).padStart(2, "0"); }

/* ─── Styles : boutons CIRCULAIRES style arcade Tetroid ─────── */
const SBB = {
  root: {
    display: "flex",
    gap: 14,
    padding: "12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.4))",
  },
  btn: {
    /* CERCLE arcade : 78px de diamètre, bordure épaisse colorée,
       halo extérieur, ombre 3D inférieure pour relief bouton physique. */
    width: 78,
    height: 78,
    borderRadius: "50%",
    border: "3px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Lilita One', cursive",
    color: "#fff",
    position: "relative",
    transition: "transform 0.08s ease, box-shadow 0.08s ease",
    /* Pas de padding : le contenu (icon) est centré pile par flex.
       Le compteur sort en absolute par-dessus en bas-droite. */
  },
  icon: {
    /* Icône XL au centre du cercle */
    fontSize: 36,
    lineHeight: 1,
    filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.5))",
  },
  /* Badge compteur — pastille bottom-right qui dépasse du cercle */
  countBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "2px solid #fff",
    color: "#fff",
    fontSize: 13,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
  },
  /* Badge "+" doré quand vide → click = boutique */
  plusBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "linear-gradient(180deg, var(--gold), #d97706)",
    border: "2px solid #fff",
    color: "#fff",
    fontSize: 18,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(255,210,63,0.6)",
  },
  /* Overlay cooldown circulaire */
  cdOverlay: {
    position: "absolute",
    inset: -3,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    color: "#fff",
    fontWeight: 800,
  },
};

window.BoosterButtons = BoosterButtons;
