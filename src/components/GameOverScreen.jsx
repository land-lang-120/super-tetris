const { useState: useStateGO } = React;

const REVIVE_COST_COINS = 50;
const AD_REVIVE_LIMIT = 3;
const BOOSTER_ORDER = ["freeze", "laser", "meteor", "magnet"];
const BOOSTER_META = {
  freeze: { icon: "\u2744\uFE0F", label: "Freeze", grad: ["#b0eeff", "#30b0e8", "#0870c0"], ring: "#30b0e8", shadow: "#054880" },
  laser: { icon: "\u26A1", label: "Laser", grad: ["#ffb0b0", "#ff2020", "#aa0000"], ring: "#ff2020", shadow: "#700000" },
  meteor: { icon: "\u2604\uFE0F", label: "Meteor", grad: ["#ffe090", "#ff9000", "#c05500"], ring: "#ff9000", shadow: "#7a3000" },
  magnet: { icon: "\uD83E\uDDF2", label: "Magnet", grad: ["#e8b0ff", "#b020ff", "#6600cc"], ring: "#b020ff", shadow: "#3a0088" },
};

function GameOverScreen({ result, profile, onRetry, onWatchBoosterAd, onBuyLife }) {
  const tr = (key, params) => window.STI18n ? window.STI18n.t(key, params) : key;
  const r = result || {};
  const score = r.score ?? 0;
  const linesTotal = r.linesTotal ?? 0;
  const level = r.level ?? 1;
  const xpGain = r.xpGain ?? 0;
  const coinsGain = r.coinsGain ?? 0;
  const coins = (profile && profile.coins) || 0;
  const oldBest = (profile && profile.bestScore) || 0;
  const newRecord = score > oldBest;
  const bestForDisplay = Math.max(oldBest, score);
  const canBuyLife = coins >= REVIVE_COST_COINS;

  const [finalMode, setFinalMode] = useStateGO(false);
  const [watchedAds, setWatchedAds] = useStateGO(0);
  const [shareMsg, setShareMsg] = useStateGO(null);
  const [adBoosters] = useStateGO(makeAdBoosters);
  const canContinueWithAds = watchedAds > 0;
  const canWatchMoreAds = watchedAds < AD_REVIVE_LIMIT && typeof onWatchBoosterAd === "function";

  function handleWatchAd() {
    if (!canWatchMoreAds) return;
    const nextBooster = adBoosters[watchedAds];
    if (typeof onWatchBoosterAd === "function") onWatchBoosterAd(nextBooster);
    setWatchedAds((n) => Math.min(AD_REVIVE_LIMIT, n + 1));
  }

  function handleShare() {
    const recordText = newRecord ? tr("newRecord") + " !" : "Super Tetris";
    const text = recordText + " " + tr("shareText", {
      score: formatNum(score),
      level: level,
      lines: formatNum(linesTotal),
    });
    const url = "https://super-tetris.landonjouajosephpino.workers.dev";
    const shareData = { title: "Super Tetris", text: text, url: url };

    if (navigator.share) {
      navigator.share(shareData).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text + " " + url).then(function () {
        setShareMsg(tr("scoreCopied"));
        setTimeout(function () { setShareMsg(null); }, 2500);
      }).catch(function () {
        setShareMsg(tr("copyFailed") + " " + url);
        setTimeout(function () { setShareMsg(null); }, 4000);
      });
    }
    if (window.STAudio) window.STAudio.play("button");
  }

  if (finalMode) {
    return (
      <div style={SGO.root}>
        <Starfield count={18} />
        <div style={SGO.finalWrap}>
          <TetrominoSkull small />
          <div style={SGO.finalTitle}>{newRecord ? tr("newRecord") : tr("finalDefeat")}</div>
          <div style={SGO.finalSub}>{newRecord ? tr("recordMsg") : tr("finalDefeatDesc")}</div>

          <div style={SGO.finalStats}>
            <StatPill label={tr("score")} value={formatNum(score)} accent />
            <StatPill label={tr("clearedLines")} value={linesTotal} />
            <StatPill label={tr("reachedLevel")} value={level} />
            <StatPill label={tr("personalBest")} value={formatNum(bestForDisplay)} />
          </div>

          <div style={SGO.rewardStrip}>
            <RewardChip icon="XP" label={tr("xp")} value={"+" + formatNum(xpGain)} xp />
            <RewardChip icon="T" label={tr("coins")} value={"+" + formatNum(coinsGain)} coin />
          </div>

          <button style={SGO.shareBtn} onClick={handleShare} aria-label={tr("shareScore")}>
            <span style={SGO.shareIcon}>↗</span>
            <span>{tr("shareScore")}</span>
          </button>
          {shareMsg && <div style={SGO.shareToast} className="pop-in">{shareMsg}</div>}
          <button className="btn-3d" style={SGO.retryBtn} onClick={onRetry}>{tr("retry")}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={SGO.root}>
      <Starfield count={18} />
      <div style={SGO.topBar}>
        <div style={SGO.coinsPill}>
          <span style={SGO.coinIcon}>T</span>
          <span style={SGO.coinValue}>{formatNum(coins)}</span>
        </div>
      </div>

      <div style={SGO.hero}>
        <TetrominoSkull />
        <div style={SGO.title}>{tr("playerDead")}</div>
        <div style={SGO.subtitle}>{tr("continuePrompt")}</div>
        <div style={SGO.discreetStats}>
          <span>{tr("score")} <strong>{formatNum(score)}</strong></span>
          <span>{tr("reachedLevel")} <strong>{level}</strong></span>
        </div>
      </div>

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
          {tr("adContinueDesc", { count: Math.min(watchedAds + 1, AD_REVIVE_LIMIT) })}
        </div>
        {canWatchMoreAds && (
          <button className="btn-3d gold" style={SGO.watchAdBtn} onClick={handleWatchAd}>
            {tr("watchAdToContinue")}
          </button>
        )}
        <button
          className="btn-3d"
          style={{ ...SGO.continueBtn, ...(canContinueWithAds ? null : SGO.disabledBtn) }}
          disabled={!canContinueWithAds}
          onClick={onRetry}
        >
          {tr("continueGame")}
        </button>
      </div>

      {typeof onBuyLife === "function" && (
        <button
          style={{ ...SGO.lifeBtn, ...(canBuyLife ? null : SGO.lifeBtnDisabled) }}
          disabled={!canBuyLife}
          onClick={onBuyLife}
        >
          <span>{tr("buyLife")}</span>
          <strong style={SGO.lifeCost}><span style={SGO.inlineCoin}>T</span> {REVIVE_COST_COINS}</strong>
        </button>
      )}

      <button style={SGO.giveUpBtn} onClick={() => setFinalMode(true)}>{tr("giveUp")}</button>
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
        <span key={i} style={{
          ...SGO.skullCell,
          width: cell,
          height: cell,
          opacity: v === "1" ? 1 : 0,
        }} />
      ))}
    </div>
  );
}

function BoosterOrb({ id, locked }) {
  const b = BOOSTER_META[id] || BOOSTER_META.freeze;
  return (
    <div style={{
      ...SGO.boosterOrb,
      background: "radial-gradient(circle at 35% 30%, " + b.grad[0] + ", " + b.grad[1] + ", " + b.grad[2] + ")",
      boxShadow: "0 0 0 2px #fff, 0 0 0 4px " + b.ring + ", 0 5px 0 " + b.shadow,
      filter: locked ? "grayscale(0.55)" : "none",
      opacity: locked ? 0.55 : 1,
    }}>
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
        <span style={{ fontFamily: "'Lilita One', cursive", fontSize: 16, color: "var(--gold)" }}>{value}</span>
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
    background: "radial-gradient(ellipse at center, #1a2a6e 0%, #0b1238 70%)",
  },
  topBar: {
    width: "100%",
    display: "flex",
    justifyContent: "flex-start",
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
  },
  coinValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 16,
    color: "var(--gold)",
    minWidth: 34,
    textAlign: "center",
  },
  hero: {
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
    background: "rgba(0,0,0,0.26)",
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
    fontFamily: "'Lilita One', cursive",
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
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 10,
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: 900,
  },
  continueBox: {
    width: "100%",
    maxWidth: 360,
    background: "linear-gradient(180deg, rgba(255,210,63,0.16), rgba(249,115,22,0.08)), linear-gradient(180deg, var(--bg2), var(--bg1))",
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
    fontFamily: "'Lilita One', cursive",
    fontSize: 24,
    color: "#fff",
    textShadow: "0 2px 0 rgba(0,0,0,0.45)",
  },
  continueText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    lineHeight: 1.3,
    fontWeight: 850,
    textAlign: "center",
    marginBottom: 10,
  },
  watchAdBtn: {
    width: "100%",
    minHeight: 44,
    fontSize: 14,
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
    width: "100%",
    maxWidth: 360,
    minHeight: 48,
    borderRadius: 14,
    border: "1.5px solid rgba(255,210,63,0.6)",
    background: "linear-gradient(180deg, rgba(255,210,63,0.22), rgba(217,119,6,0.1)), linear-gradient(180deg, var(--bg2), var(--bg1))",
    color: "#fff",
    fontFamily: "'Lilita One', cursive",
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
    fontFamily: "'Lilita One', cursive",
    fontSize: 14,
    color: "#4a2600",
    background: "radial-gradient(circle at 32% 26%, #fff7ad, #ffd23f 48%, #d97706 100%)",
    border: "1.5px solid rgba(255,255,255,0.78)",
    boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.55), inset -1px -2px 0 rgba(120,53,15,0.45), 0 2px 0 #92400e",
  },
  giveUpBtn: {
    width: "100%",
    maxWidth: 360,
    minHeight: 44,
    border: "1.5px solid rgba(248,113,113,0.48)",
    borderRadius: 14,
    color: "#fff",
    background: "linear-gradient(180deg, rgba(239,68,68,0.24), rgba(127,29,29,0.18)), rgba(0,0,0,0.26)",
    fontSize: 14,
    fontWeight: 1000,
    boxShadow: "0 3px 0 rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.1)",
    cursor: "pointer",
  },
  finalWrap: {
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
    fontFamily: "'Lilita One', cursive",
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
    background: "rgba(0,0,0,0.28)",
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
    fontFamily: "'Lilita One', cursive",
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
    fontFamily: "'Lilita One', cursive",
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
    fontFamily: "'Lilita One', cursive",
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
  },
  retryBtn: {
    width: "100%",
    fontSize: 22,
    padding: "17px 22px",
    letterSpacing: 1,
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
