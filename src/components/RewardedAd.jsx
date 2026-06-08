const { useState: useStateRA, useEffect: useEffectRA } = React;

/*
  Simulateur UX des videos interstitielles recompensees.
  Contrat a conserver lors du branchement Google/AdMob :
  - onComplete = appele uniquement quand le SDK confirme la recompense.
  - onSkip = aucune recompense accordee.
  - reward decrit le gain attendu par le flux appelant (shop, wheel, game over).
*/
function RewardedAd({ reward, onComplete, onSkip, durationSec }) {
  const total = durationSec || 5;
  const [remaining, setRemaining] = useStateRA(total);
  const done = remaining <= 0;
  const rewardLabel = describeReward(reward);
  const progress = Math.max(0, Math.min(1, (total - remaining) / total));

  useEffectRA(() => {
    if (remaining <= 0) {
      if (typeof onComplete === "function") onComplete();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, onComplete]);

  return (
    <div style={SRA.root}>
      <div style={SRA.card}>
        <div style={SRA.adLabel}>VIDEO INTERSTITIELLE</div>

        <div style={SRA.preview}>
          <div style={SRA.videoTopBar}>
            <span style={SRA.videoDot}></span>
            <span style={SRA.videoBadge}>PLEIN ECRAN</span>
          </div>
          <div style={SRA.previewIcon}>AD</div>
          <div style={SRA.previewText}>CloneX Studio</div>
          <div style={SRA.previewSub}>La video doit se terminer pour valider la recompense.</div>
          <div style={SRA.progressTrack}>
            <div style={{ ...SRA.progressFill, width: Math.round(progress * 100) + "%" }} />
          </div>
        </div>

        <div style={SRA.timer}>
          {done ? <>Video terminee - recompense debloquee</> : <>Fin de la video dans <strong>{remaining}s</strong></>}
        </div>

        <div style={SRA.rewardBox}>
          <span style={SRA.rewardIcon}>+</span>
          <span style={{ marginLeft: 8 }}>{rewardLabel}</span>
        </div>

        {typeof onSkip === "function" && !done && (
          <button style={SRA.skipBtn} onClick={onSkip}>Quitter la video</button>
        )}
      </div>
    </div>
  );
}

function describeReward(reward) {
  if (!reward) return "Recompense surprise";
  if (reward.type === "continue") return "Continuer la partie";
  if (reward.type === "booster") return "+1 booster " + (reward.id || "");
  if (reward.type === "wheelSpin") return "Relancer la roue";
  if (reward.type === "coins") return "+" + (reward.amount || 0) + " pieces";
  if (reward.type === "xp") return "Boost XP x2 prochaine partie";
  return "Recompense";
}

const SRA = {
  root: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.92)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 500,
    padding: 20,
  },
  card: {
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "2px solid var(--purple)",
    borderRadius: 18,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
  },
  adLabel: {
    fontSize: 11,
    fontWeight: 900,
    color: "var(--orange)",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 16,
  },
  preview: {
    background: "linear-gradient(135deg, #5b21b6, #1e40af, #7c3aed)",
    borderRadius: 14,
    padding: "14px 16px 18px",
    textAlign: "center",
    marginBottom: 16,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  videoTopBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1.2,
  },
  videoDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--red)",
    boxShadow: "0 0 10px rgba(239,68,68,0.85)",
  },
  videoBadge: {
    padding: "4px 7px",
    borderRadius: 8,
    background: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  previewIcon: {
    width: 62,
    height: 62,
    borderRadius: 16,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    fontFamily: "'Lilita One', cursive",
    fontSize: 28,
    color: "#fff",
    background: "rgba(255,255,255,0.14)",
    border: "1.5px solid rgba(255,255,255,0.22)",
  },
  previewText: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 22,
    color: "#fff",
    letterSpacing: 0.5,
  },
  previewSub: {
    marginTop: 5,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: 800,
  },
  progressTrack: {
    height: 7,
    borderRadius: 100,
    background: "rgba(0,0,0,0.35)",
    overflow: "hidden",
    marginTop: 18,
    border: "1px solid rgba(255,255,255,0.12)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 100,
    background: "linear-gradient(90deg, var(--gold), var(--orange))",
    boxShadow: "0 0 12px rgba(255,210,63,0.45)",
    transition: "width 0.35s ease",
  },
  timer: {
    textAlign: "center",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 16,
  },
  rewardBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,210,63,0.15)",
    border: "1.5px solid var(--gold)",
    borderRadius: 12,
    padding: "10px 16px",
    marginBottom: 12,
    color: "var(--gold)",
    fontWeight: 900,
  },
  rewardIcon: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, var(--gold), #d97706)",
    color: "#2d1600",
    fontFamily: "'Lilita One', cursive",
    fontSize: 18,
    boxShadow: "0 2px 0 #92400e",
  },
  skipBtn: {
    width: "100%",
    padding: "10px 16px",
    background: "transparent",
    border: "1.5px solid rgba(255,255,255,0.3)",
    borderRadius: 12,
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: 800,
  },
};

window.RewardedAd = RewardedAd;
