const { useState: useStateGO } = React;

const REVIVE_COST_COINS = 50;
const AD_REVIVE_LIMIT = 3;
const BOOSTER_ORDER = ["freeze", "laser", "meteor", "magnet"];
const BOOSTER_META = {
  freeze: { icon: "❄️", label: "Freeze", grad: ["#b0eeff", "#30b0e8", "#0870c0"], ring: "#30b0e8", shadow: "#054880" },
  laser: { icon: "⚡", label: "Laser", grad: ["#ffb0b0", "#ff2020", "#aa0000"], ring: "#ff2020", shadow: "#700000" },
  meteor: { icon: "☄️", label: "Meteor", grad: ["#ffe090", "#ff9000", "#c05500"], ring: "#ff9000", shadow: "#7a3000" },
  magnet: { icon: "🧲", label: "Magnet", grad: ["#e8b0ff", "#b020ff", "#6600cc"], ring: "#b020ff", shadow: "#3a0088" },
};

function GameOverScreen({ result, profile, onRetry, onHome, onWatchBoosterAd, onBuyLife }) {
  const tr = (key, params) => window.STI18n ? window.STI18n.t(key, params) : key;
  const r = result || {};
  const score = r.score ?? 0;
  const linesTotal = r.linesTotal ?? 0;
  const level = r.level ?? 1;
  const xpGain = r.xpGain ?? 0;
  const coinsGain = r.coinsGain ?? 0;
  const coins = (profile && profile.coins) || 0;
  const oldBest = (profile && profile.bestScore) || 0;
  const newRecord = score > oldBest && score > 0;
  const bestForDisplay = Math.max(oldBest, score);
  const canBuyLife = coins >= REVIVE_COST_COINS;

  const [finalMode, setFinalMode] = useStateGO(false);
  const [watchedAds, setWatchedAds] = useStateGO(0);
  const [shareMsg, setShareMsg] = useStateGO(null);
  const [adBoosters] = useStateGO(makeAdBoosters);
  const canContinueWithAds = watchedAds > 0;
  const canWatchMoreAds = watchedAds < AD_REVIVE_LIMIT && typeof onWatchBoosterAd === "function";

  const StarfieldComp = window.Starfield || Starfield;

  function handleWatchAd() {
    if (!canWatchMoreAds) return;
    const nextBooster = adBoosters[watchedAds];
    if (typeof onWatchBoosterAd === "function") {
      onWatchBoosterAd(nextBooster);
    }
    setWatchedAds((n) => Math.min(AD_REVIVE_LIMIT, n + 1));
  }

  function handleShare() {
    const recordText = newRecord ? (tr("newRecord") || "NOUVEAU RECORD") + " !" : "Super Tetris";
    const text = recordText + " " + tr("shareText", {
      score: formatNum(score),
      level: level,
      lines: formatNum(linesTotal),
    });
    const url = "https://land-lang-120.github.io/super-tetris/";
    const shareData = { title: "Super Tetris", text: text, url: url };

    if (navigator.share) {
      navigator.share(shareData).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text + " " + url).then(function () {
        setShareMsg(tr("scoreCopied") || "📋 Score copié !");
        setTimeout(function () { setShareMsg(null); }, 2500);
      }).catch(function () {
        setShareMsg((tr("copyFailed") || "⚠️ Lien :") + " " + url);
        setTimeout(function () { setShareMsg(null); }, 4000);
      });
    }
    if (window.STAudio) window.STAudio.play("button");
  }

  // ═════════════════════════════════════════════════════════════════
  // Écran 2 : Bilan final (après avoir cliqué sur « Abandonner »)
  // ═════════════════════════════════════════════════════════════════
  if (finalMode) {
    return (
      <div style={SGO.root}>
        {StarfieldComp && <StarfieldComp count={18} />}
        <div style={SGO.finalWrap}>
          <TetrominoSkull small />
          <div style={SGO.finalTitle}>
            {newRecord ? (tr("newRecord") || "NOUVEAU RECORD !") : (tr("finalDefeat") || "PARTIE TERMINÉE")}
          </div>
          <div style={SGO.finalSub}>
            {newRecord
              ? (tr("recordMsg") || "Bravo, tu viens de battre ton record personnel !")
              : (tr("finalDefeatDesc") || "Votre progression est sauvegardée. Réessayez pour aller plus loin.")}
          </div>

          <div style={SGO.finalStats}>
            <StatPill label={tr("score") || "Score"} value={formatNum(score)} accent />
            <StatPill label={tr("clearedLines") || "Lignes"} value={linesTotal} />
            <StatPill label={tr("reachedLevel") || "Niveau"} value={level} />
            <StatPill label={tr("personalBest") || "Record"} value={formatNum(bestForDisplay)} />
          </div>

          <div style={SGO.rewardStrip}>
            <RewardChip icon="XP" label="XP" value={"+" + formatNum(xpGain)} xp />
            <RewardChip icon="T" label={tr("coins") || "Pièces"} value={"+" + formatNum(coinsGain)} coin />
          </div>

          <button style={SGO.shareBtn} onClick={handleShare} aria-label={tr("shareScore") || "Partager mon score"}>
            <span style={SGO.shareIcon}>↗</span>
            <span>{tr("shareScore") || "Partager mon score"}</span>
          </button>
          {shareMsg && <div style={SGO.shareToast} className="pop-in">{shareMsg}</div>}

          {/* Les 2 boutons majeurs : REJOUER et ACCUEIL */}
          <div style={SGO.finalActionRow}>
            <button
              className="btn-3d"
              style={SGO.finalReplayBtn}
              onClick={() => {
                if (window.STAudio) window.STAudio.play("click");
                if (typeof onRetry === "function") onRetry();
              }}
            >
              🔄 {tr("retry") || "REJOUER"}
            </button>
            <button
              className="btn-3d purple"
              style={SGO.finalHomeBtn}
              onClick={() => {
                if (window.STAudio) window.STAudio.play("click");
                if (typeof onHome === "function") onHome();
              }}
            >
              🏠 {tr("home") || "ACCUEIL"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // Écran 1 : « Vous etes mort » (Capture d'écran exacte demandée)
  // ═════════════════════════════════════════════════════════════════
  return (
    <div style={SGO.root}>
      {StarfieldComp && <StarfieldComp count={18} />}

      {/* Top bar avec monnaie et bouton accueil rapide */}
      <div style={SGO.topBar}>
        <div style={SGO.coinsPill}>
          <span style={SGO.coinIcon}>T</span>
          <span style={SGO.coinValue}>{formatNum(coins)}</span>
        </div>
        {typeof onHome === "function" && (
          <button
            style={SGO.quickHomeBtn}
            onClick={() => {
              if (window.STAudio) window.STAudio.play("click");
              onHome();
            }}
            title={tr("home") || "Accueil"}
            aria-label={tr("home") || "Accueil"}
          >
            🏠
          </button>
        )}
      </div>

      {/* Hero : Crâne pixelisé + Vous etes mort */}
      <div style={SGO.hero}>
        <TetrominoSkull />
        <div style={SGO.title}>{tr("playerDead") || "Vous etes mort"}</div>
        <div style={SGO.subtitle}>
          {tr("continuePrompt") || "Continuez avec des boosters ou rachetez une vie."}
        </div>
        <div style={SGO.discreetStats}>
          <span>{tr("score") || "Score"} <strong>{formatNum(score)}</strong></span>
          <span>{tr("reachedLevel") || "Niveau atteint"} <strong>{level}</strong></span>
        </div>
      </div>

      {/* Boîte continue avec les boosters et la vidéo */}
      <div style={SGO.continueBox}>
        <div style={SGO.boosterPreview}>
          {adBoosters.map((id, idx) => (
            <React.Fragment key={idx}>
              <BoosterOrb id={id} locked={idx >= watchedAds} />
              {idx < adBoosters.length - 1 && <span style={SGO.plus}>+</span>}
            </React.Fragment>
          ))}
        </div>
        <div style={SGO.continueText}>
          {tr("adContinueDesc", { count: Math.min(watchedAds + 1, AD_REVIVE_LIMIT) }) ||
            ("Regarde une video interstitielle pour debloquer le booster " + Math.min(watchedAds + 1, AD_REVIVE_LIMIT) + " et continuer plus fort.")}
        </div>
        {canWatchMoreAds && (
          <button className="btn-3d gold" style={SGO.watchAdBtn} onClick={handleWatchAd}>
            {tr("watchAdToContinue") || "Regarder une video"}
          </button>
        )}
        <button
          className="btn-3d"
          style={{ ...SGO.continueBtn, ...(canContinueWithAds ? null : SGO.disabledBtn) }}
          disabled={!canContinueWithAds}
          onClick={() => {
            if (window.STAudio) window.STAudio.play("click");
            if (typeof onRetry === "function") onRetry();
          }}
        >
          {tr("continueGame") || "Continuer la partie"}
        </button>
      </div>

      {/* Racheter une vie (50 Pièces) */}
      {typeof onBuyLife === "function" && (
        <button
          style={{ ...SGO.lifeBtn, ...(canBuyLife ? null : SGO.lifeBtnDisabled) }}
          disabled={!canBuyLife}
          onClick={() => {
            if (!canBuyLife) return;
            if (window.STAudio) window.STAudio.play("coin");
            onBuyLife();
          }}
        >
          <span>{tr("buyLife") || "Racheter une vie"}</span>
          <strong style={SGO.lifeCost}>
            <span style={SGO.inlineCoin}>T</span> {REVIVE_COST_COINS}
          </strong>
        </button>
      )}

      {/* Abandonner -> Ouvre le bilan final avec Rejouer et Accueil */}
      <button
        style={SGO.giveUpBtn}
        onClick={() => {
          if (window.STAudio) window.STAudio.play("click");
          setFinalMode(true);
        }}
      >
        {tr("giveUp") || "Abandonner"}
      </button>
    </div>
  );
}

function makeAdBoosters() {
  const pool = BOOSTER_ORDER.slice();
  const picked = [];
  while (picked.length < AD_REVIVE_LIMIT) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
    if (!pool.length) pool.push.apply(pool, BOOSTER_ORDER);
  }
  return picked;
}

function TetrominoSkull({ small }) {
  const cell = small ? 12 : 16;
  const rows = [
    "011110",
    "111111",
    "101101",
    "111111",
    "011110",
    "010010",
  ];
  return (
    <div style={{ ...SGO.skullGrid, gridTemplateColumns: "repeat(6, " + cell + "px)" }}>
      {rows.join("").split("").map((v, i) => (
        <span
          key={i}
          style={{
            ...SGO.skullCell,
            width: cell,
            height: cell,
            opacity: v === "1" ? 1 : 0,
          }}
        />
      ))}
    </div>
  );
}

function BoosterOrb({ id, locked }) {
  const b = BOOSTER_META[id] || BOOSTER_META.freeze;
  return (
    <div
      style={{
        ...SGO.boosterOrb,
        background: "radial-gradient(circle at 35% 30%, " + b.grad[0] + ", " + b.grad[1] + ", " + b.grad[2] + ")",
        boxShadow: "0 0 0 2px #fff, 0 0 0 4px " + b.ring + ", 0 5px 0 " + b.shadow,
        filter: locked ? "grayscale(0.55)" : "none",
        opacity: locked ? 0.55 : 1,
      }}
    >
      {b.icon}
    </div>
  );
}

function StatPill({ label, value, accent }) {
  return (
    <div style={SGO.statPill}>
      <span>{label}</span>
      <strong style={accent ? SGO.statPillAccent : null}>{value}</strong>
    </div>
  );
}

function RewardChip({ icon, label, value, coin, xp }) {
  return (
    <div style={SGO.chip}>
      <span style={coin ? SGO.rewardCoinIcon : (xp ? SGO.rewardXpIcon : { fontSize: 20 })}>{icon}</span>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 800 }}>{label}</span>
        <span style={{ fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif", fontSize: 16, color: "var(--gold)" }}>{value}</span>
      </div>
    </div>
  );
}

function formatNum(n) {
  const safe = typeof n === "number" && isFinite(n) ? n : 0;
  return safe.toLocaleString("fr-FR");
}

const SGO = {
  root: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px calc(env(safe-area-inset-bottom, 0px) + 16px)",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    background: "radial-gradient(ellipse at center, #1a2a6e 0%, #0b1238 70%)",
    isolation: "isolate",
  },
  topBar: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: 360,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  coinsPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    borderRadius: 100,
    padding: "6px 14px 6px 9px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 rgba(0,0,0,0.3)",
  },
  quickHomeBtn: {
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    borderRadius: 12,
    width: 38,
    height: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    cursor: "pointer",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 0 rgba(0,0,0,0.25)",
  },
  coinIcon: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
    fontSize: 14,
    color: "#4a2600",
    background: "radial-gradient(circle at 32% 26%, #fff7ad, #ffd23f 48%, #d97706 100%)",
    border: "1.5px solid rgba(255,255,255,0.78)",
    boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.55), inset -1px -2px 0 rgba(120,53,15,0.45), 0 2px 0 #92400e",
  },
  coinValue: {
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
    fontSize: 16,
    color: "var(--gold)",
    minWidth: 34,
    textAlign: "center",
  },
  hero: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  skullGrid: {
    display: "grid",
    gap: 3,
    padding: 12,
    borderRadius: 16,
    background: "linear-gradient(180deg, #182155, #080d28)",
    border: "1.5px solid rgba(255,255,255,0.12)",
    boxShadow: "0 8px 18px rgba(0,0,0,0.34)",
    marginBottom: 14,
  },
  skullCell: {
    borderRadius: 3,
    background: "linear-gradient(180deg, #f8fafc, #94a3b8)",
    boxShadow: "0 2px 0 #475569, inset 0 1px 0 rgba(255,255,255,0.7)",
  },
  title: {
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
    fontSize: "clamp(34px, 9vw, 48px)",
    color: "#fff",
    letterSpacing: 2,
    textShadow: "0 4px 0 rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.4)",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    fontWeight: 800,
  },
  discreetStats: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 10,
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: 800,
  },
  continueBox: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: 360,
    background: "linear-gradient(180deg, #2a2f67, #101846)",
    border: "1.5px solid rgba(255,210,63,0.45)",
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
    boxShadow: "0 4px 0 rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.12)",
  },
  boosterPreview: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,
  },
  boosterOrb: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    flexShrink: 0,
  },
  plus: {
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
    fontSize: 24,
    color: "#fff",
    textShadow: "0 2px 0 rgba(0,0,0,0.45)",
  },
  continueText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    lineHeight: 1.3,
    fontWeight: 800,
    textAlign: "center",
    marginBottom: 10,
  },
  watchAdBtn: {
    width: "100%",
    minHeight: 44,
    fontSize: 15,
    marginBottom: 10,
  },
  continueBtn: {
    width: "100%",
    minHeight: 44,
    fontSize: 17,
  },
  disabledBtn: {
    opacity: 0.5,
    filter: "grayscale(0.7)",
    cursor: "not-allowed",
  },
  lifeBtn: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: 360,
    minHeight: 48,
    borderRadius: 14,
    border: "1.5px solid rgba(255,210,63,0.6)",
    background: "linear-gradient(180deg, #2e315f, #11183e)",
    color: "#fff",
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
    fontSize: 17,
    letterSpacing: 0.4,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 14px",
    marginBottom: 10,
    boxShadow: "0 4px 0 rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.12)",
    cursor: "pointer",
  },
  lifeBtnDisabled: {
    opacity: 0.48,
    filter: "grayscale(0.75)",
    cursor: "not-allowed",
  },
  lifeCost: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "var(--gold)",
    fontSize: 18,
  },
  inlineCoin: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
    fontSize: 14,
    color: "#4a2600",
    background: "radial-gradient(circle at 32% 26%, #fff7ad, #ffd23f 48%, #d97706 100%)",
    border: "1.5px solid rgba(255,255,255,0.78)",
    boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.55), inset -1px -2px 0 rgba(120,53,15,0.45), 0 2px 0 #92400e",
  },
  giveUpBtn: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: 360,
    minHeight: 44,
    border: "1.5px solid rgba(248,113,113,0.48)",
    borderRadius: 14,
    color: "#fff",
    background: "linear-gradient(180deg, #7f1d1d, #3b111f)",
    fontSize: 15,
    fontWeight: 900,
    boxShadow: "0 3px 0 rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.1)",
    cursor: "pointer",
  },
  finalWrap: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: 380,
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px 0",
  },
  finalTitle: {
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
    color: "#fff",
    fontSize: 34,
    letterSpacing: 1.5,
    textAlign: "center",
    textShadow: "0 3px 0 rgba(0,0,0,0.42)",
  },
  finalSub: {
    marginTop: 5,
    marginBottom: 14,
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    fontWeight: 800,
    textAlign: "center",
  },
  finalStats: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
    marginBottom: 12,
  },
  statPill: {
    minHeight: 56,
    borderRadius: 12,
    border: "1px solid rgba(124,58,237,0.36)",
    background: "linear-gradient(180deg, #11183e, #080d28)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: 900,
  },
  statPillAccent: {
    color: "var(--gold)",
    fontSize: 18,
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
  },
  rewardStrip: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 12,
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    borderRadius: 12,
    padding: "9px 12px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 0 rgba(0,0,0,0.3)",
    minWidth: 118,
  },
  rewardCoinIcon: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
    fontSize: 14,
    color: "#4a2600",
    background: "radial-gradient(circle at 32% 26%, #fff7ad, #ffd23f 48%, #d97706 100%)",
    border: "1.5px solid rgba(255,255,255,0.78)",
  },
  rewardXpIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
    fontSize: 11,
    color: "#052e16",
    background: "linear-gradient(180deg, #86efac, #22c55e)",
    border: "1.5px solid rgba(255,255,255,0.7)",
    boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.45), 0 2px 0 #166534",
  },
  shareIcon: {
    width: 22,
    height: 22,
    borderRadius: 8,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.24)",
    fontSize: 15,
    lineHeight: 1,
  },
  shareBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "13px 18px",
    background: "linear-gradient(180deg, var(--blue), #1e40af)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 900,
    borderRadius: 14,
    border: "1.5px solid var(--sky)",
    marginBottom: 12,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 0 rgba(0,0,0,0.3)",
    cursor: "pointer",
  },
  finalActionRow: {
    display: "flex",
    gap: 12,
    width: "100%",
    marginTop: 8,
  },
  finalReplayBtn: {
    flex: 1,
    fontSize: 18,
    padding: "14px 10px",
    cursor: "pointer",
  },
  finalHomeBtn: {
    flex: 1,
    fontSize: 18,
    padding: "14px 10px",
    cursor: "pointer",
  },
  shareToast: {
    position: "fixed",
    bottom: 100,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.85)",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    border: "1px solid var(--sky)",
    zIndex: 200,
  },
};

window.GameOverScreen = GameOverScreen;
