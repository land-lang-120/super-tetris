/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — App (composant racine)
   ═══════════════════════════════════════════════════════════════════
   Orchestre :
     - Routing entre écrans V1 (loading / home / game / gameover / wheel /
       settings / shop / stats)
     - État global persisté (settings + profile via useStorage)
     - Logique de récompense (XP/coins/boosters gagnés à chaque partie)
     - Application du thème (body class .light)
     - Boucle de vie : LoadingScreen au boot puis HomeScreen une fois prêt

   Source de vérité unique pour :
     - settings : { sound, vibro, lang, theme }
     - profile  : { coins, xp, bestScore, boosters, wheelLastFree, history }

   Tout descendant lit ces 2 objets en props (read-only) et muteurs via
   onChange / onProfileChange. Pas de localStorage direct dans les
   composants enfants — règle senior #1 (source unique de vérité).
   ═══════════════════════════════════════════════════════════════════ */

const { useState: useStateApp, useEffect: useEffectApp, useCallback: useCallbackApp } = React;

const DEFAULT_PROFILE = {
  coins: 100,            // bonus de bienvenue
  xp: 0,
  bestScore: 0,
  // Boosters de base à 30 chacun
  boosters: { freeze: 30, laser: 30, meteor: 30, magnet: 30 },
  wheelLastFree: 0,      // timestamp dernier spin gratuit
  totalGames: 0,
  playerName: "",
  playerId: "",
  profileCreatedAt: 0,
  starterBoostersGranted: true,
  starterBoosters30Granted: true,
  history: [],
};

const DEFAULT_SETTINGS = {
  sound: true,
  music: true,
  vibro: true,
  lang: (typeof navigator !== "undefined" && navigator.language && navigator.language.startsWith("fr")) ? "fr" : "en",
  theme: "dark",
};

function App() {
  // Routing : loading -> home -> game -> gameover -> wheel/settings/shop/stats
  const [screen, setScreen]       = useStateApp("loading");
  const [profile, setProfile]     = window.useStorage("st_profile", DEFAULT_PROFILE);
  const [settings, setSettings]   = window.useStorage("st_settings", DEFAULT_SETTINGS);
  const [lastResult, setLastResult] = useStateApp(null); // résultat de la dernière partie
  // Flux publicitaire V1.22.x : toutes les pubs sont des videos interstitielles
  // recompensees. RewardedAd simule l'UX jusqu'au branchement Google/AdMob ;
  // ensuite, onComplete devra venir uniquement du callback "reward earned".
  const [pendingShopAd, setPendingShopAd] = useStateApp(null);
  const [wheelAdSpinNonce, setWheelAdSpinNonce] = useStateApp(0);
  const [bonusModalOpen, setBonusModalOpen] = useStateApp(false);

  // v1.0.3 (versionCode 4) : augmentation des boosters de base à 30 chacun.
  // Préserve 100% de la progression des testeurs (scores, XP, stats, pièces)
  // et élève leurs boosters à 30 minimum sans écraser s'ils en possèdent déjà plus.
  useEffectApp(() => {
    if (!profile || profile.starterBoosters30Granted) return;
    setProfile((prev) => {
      const p = prev || DEFAULT_PROFILE;
      if (p.starterBoosters30Granted) return p;
      const current = (p && p.boosters) || {};
      return {
        ...p,
        starterBoostersGranted: true,
        starterBoosters30Granted: true,
        boosters: {
          freeze: Math.max(30, current.freeze || 0),
          laser: Math.max(30, current.laser || 0),
          meteor: Math.max(30, current.meteor || 0),
          magnet: Math.max(30, current.magnet || 0),
        },
      };
    });
  }, [profile && profile.starterBoosters30Granted, setProfile]);

  // Applique le thème en ajoutant/retirant body.light
  useEffectApp(() => {
    if (settings && settings.theme === "light") {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  }, [settings && settings.theme]);

  // Applique la langue choisie au document : utile pour lecteurs d'ecran,
  // clavier mobile et langues RTL comme l'arabe.
  useEffectApp(() => {
    const lang = window.STI18n ? window.STI18n.normalize(settings && settings.lang) : ((settings && settings.lang) || "en");
    document.documentElement.lang = lang;
    document.documentElement.dir = window.STI18n ? window.STI18n.dir(lang) : "ltr";
  }, [settings && settings.lang]);

  // Notifie le HTML loader qu'on est prêt (fade out splash)
  useEffectApp(() => {
    try { window.dispatchEvent(new Event("super-tetris-ready")); } catch (_) {}
  }, []);

  // v1.14 — Bouton retour Android natif (TWA) :
  // Intercepte popstate pour faire un back IN-APP au lieu de fermer l'app.
  // Mapping : game/gameover/wheel/settings/shop/stats → home, home → ferme.
  useEffectApp(() => {
    window.history.pushState({ screen: screen }, "");
    function onPop() {
      if (screen !== "home" && screen !== "loading") {
        setPendingShopAd(null);
        setBonusModalOpen(false);
        setScreen("home");
        setLastResult(null);
        window.history.pushState({ screen: "home" }, "");
      }
      // home → laisse le TWA se fermer (pas de re-push)
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [screen]);

  // ─── Handlers ────────────────────────────────────────────────
  const navigate = useCallbackApp((target) => {
    setScreen(target);
  }, []);

  const handleGameOver = useCallbackApp((result) => {
    // Met à jour profile : best score, XP, coins, totalGames, historique local
    setProfile((prev) => {
      const p = prev || DEFAULT_PROFILE;
      const score = (result && result.score) || 0;
      const xpGain = (result && result.xpGain) || 0;
      const coinsGain = (result && result.coinsGain) || 0;
      const historyEntry = {
        score,
        linesTotal: (result && result.linesTotal) || 0,
        level: (result && result.level) || 1,
        xpGain,
        coinsGain,
        date: Date.now(),
      };
      const history = [historyEntry].concat(Array.isArray(p.history) ? p.history : []).slice(0, 30);
      return {
        ...p,
        bestScore: Math.max(p.bestScore || 0, score),
        xp: (p.xp || 0) + xpGain,
        coins: (p.coins || 0) + coinsGain,
        totalGames: (p.totalGames || 0) + 1,
        history,
      };
    });
    setLastResult(result);
    setScreen("gameover");
  }, [setProfile]);

  const handleBuyBooster = useCallbackApp((id, cost) => {
    let ok = false;
    setProfile((prev) => {
      const p = prev || DEFAULT_PROFILE;
      const price = Math.max(0, cost || 0);
      if (!id || (p.coins || 0) < price) return p;
      ok = true;
      return {
        ...p,
        coins: (p.coins || 0) - price,
        boosters: {
          ...((p && p.boosters) || {}),
          [id]: (((p && p.boosters) || {})[id] || 0) + 1,
        },
      };
    });
    if (ok && window.STAudio) window.STAudio.play("coin");
    return ok;
  }, [setProfile]);

  const handleBuyPack = useCallbackApp((pack) => {
    let ok = false;
    setProfile((prev) => {
      const p = prev || DEFAULT_PROFILE;
      const price = Math.max(0, (pack && pack.cost) || 0);
      const bundle = (pack && pack.boosters) || null;
      if (!bundle || (p.coins || 0) < price) return p;
      const nextBoosters = { ...((p && p.boosters) || {}) };
      Object.keys(bundle).forEach((id) => {
        nextBoosters[id] = (nextBoosters[id] || 0) + Math.max(0, bundle[id] || 0);
      });
      ok = true;
      return {
        ...p,
        coins: (p.coins || 0) - price,
        boosters: nextBoosters,
      };
    });
    if (ok && window.STAudio) window.STAudio.play("coin");
    return ok;
  }, [setProfile]);

  const handleGrantPack = useCallbackApp((pack) => {
    let ok = false;
    setProfile((prev) => {
      const p = prev || DEFAULT_PROFILE;
      const bundle = (pack && pack.boosters) || null;
      if (!bundle) return p;
      const nextBoosters = { ...((p && p.boosters) || {}) };
      Object.keys(bundle).forEach((id) => {
        nextBoosters[id] = (nextBoosters[id] || 0) + Math.max(0, bundle[id] || 0);
      });
      ok = true;
      return {
        ...p,
        boosters: nextBoosters,
      };
    });
    if (ok && window.STAudio) window.STAudio.play("coin");
    return ok;
  }, [setProfile]);

  const handleShopAdReward = useCallbackApp((amount) => {
    const reward = Math.max(0, amount || 0);
    if (!reward) return false;
    setProfile((prev) => {
      const p = prev || DEFAULT_PROFILE;
      return {
        ...p,
        coins: (p.coins || 0) + reward,
      };
    });
    if (window.STAudio) window.STAudio.play("coin");
    return true;
  }, [setProfile]);

  const handleShopAdStart = useCallbackApp((amount) => {
    const reward = Math.max(0, amount || 0);
    if (!reward) return false;
    setPendingShopAd({ type: "coins", amount: reward });
    return true;
  }, []);

  const handleWatchAd = useCallbackApp(({ type, amount, id, onSuccess, onCancel }) => {
    setPendingShopAd({ type: type || "coins", amount: amount || 50, id, onSuccess, onCancel });
    return true;
  }, []);

  const handleGameOverBoosterAdStart = useCallbackApp((boosterId) => {
    const safeId = ["freeze", "laser", "meteor", "magnet"].includes(boosterId) ? boosterId : "freeze";
    setPendingShopAd({ type: "booster", id: safeId, amount: 1 });
    return true;
  }, []);

  const handleRewardedBooster = useCallbackApp((id) => {
    const safeId = ["freeze", "laser", "meteor", "magnet"].includes(id) ? id : "freeze";
    setProfile((prev) => {
      const p = prev || DEFAULT_PROFILE;
      const nextBoosters = { ...((p && p.boosters) || {}) };
      nextBoosters[safeId] = (nextBoosters[safeId] || 0) + 1;
      return {
        ...p,
        boosters: nextBoosters,
      };
    });
    if (window.STAudio) window.STAudio.play("coin");
    return true;
  }, [setProfile]);

  const handleRetry = useCallbackApp(() => {
    setLastResult(null);
    setScreen("game");
  }, []);

  const handleBuyLife = useCallbackApp(() => {
    if (((profile && profile.coins) || 0) < 50) return;
    setProfile((prev) => {
      const p = prev || DEFAULT_PROFILE;
      return {
        ...p,
        coins: Math.max(0, (p.coins || 0) - 50),
      };
    });
    setLastResult(null);
    setScreen("game");
    if (window.STAudio) window.STAudio.play("coin");
  }, [profile && profile.coins, setProfile]);

  const handleHome = useCallbackApp(() => {
    setLastResult(null);
    setScreen("home");
  }, []);

  const handleWheelReward = useCallbackApp(({ isFree, isAd, segment, reward }) => {
    setProfile((prev) => {
      const p = prev || DEFAULT_PROFILE;
      const next = { ...p };
      if (isFree) {
        next.wheelLastFree = Date.now();
      } else if (!isAd) {
        next.coins = Math.max(0, (p.coins || 0) - 50); // coût spin payant
      }
      if (reward && reward.coins) {
        next.coins = (next.coins || 0) + reward.coins;
      }
      if (reward && reward.boosters) {
        next.boosters = { ...((p.boosters) || {}) };
        Object.keys(reward.boosters).forEach((k) => {
          next.boosters[k] = (next.boosters[k] || 0) + reward.boosters[k];
        });
      }
      return next;
    });
  }, [setProfile]);

  const handleBonusComplete = useCallbackApp((reward) => {
    const coinsEarned = (reward && reward.coins) || 250;
    const boostersEarned = (reward && reward.boosters) || {};
    setProfile((prev) => {
      const p = prev || DEFAULT_PROFILE;
      const nextBoosters = { ...((p && p.boosters) || {}) };
      Object.keys(boostersEarned).forEach((k) => {
        nextBoosters[k] = (nextBoosters[k] || 0) + boostersEarned[k];
      });
      return {
        ...p,
        coins: (p.coins || 0) + coinsEarned,
        boosters: nextBoosters,
      };
    });
    if (window.STAudio) window.STAudio.play("win");
    setScreen("home");
  }, [setProfile]);

  const handleResetData = useCallbackApp(() => {
    const tr = (key, params) => window.STI18n ? window.STI18n.t(key, params, settings && settings.lang) : key;
    if (window.confirm(tr("resetPrompt"))) {
      setProfile(DEFAULT_PROFILE);
      setSettings(DEFAULT_SETTINGS);
      try { localStorage.removeItem("st_tutorial_seen"); } catch(_) {}
      setScreen("home");
    }
  }, [setProfile, setSettings]);

  // v1.16 (audit senior 2026-05-06) : Tutorial first-launch sur écran d'accueil.
  // Se déclenche 1 seule fois quand l'utilisateur arrive sur HomeScreen et que
  // localStorage["st_tutorial_seen"] !== "1". Pas de bypass côté game pour
  // ne pas casser les sessions courtes.
  const [showTutorial, setShowTutorial] = useStateApp(false);
  useEffectApp(() => {
    if (screen !== "home") return;
    let seen = false;
    try { seen = localStorage.getItem("st_tutorial_seen") === "1"; } catch (_) {}
    if (!seen) setShowTutorial(true);
  }, [screen]);

  const closeTutorial = useCallbackApp(() => {
    try { localStorage.setItem("st_tutorial_seen", "1"); } catch (_) {}
    setShowTutorial(false);
  }, []);

  // ─── Rendu de l'écran courant ────────────────────────────────
  let content;
  if (screen === "loading") {
    content = (
      <window.LoadingScreen
        onDone={() => setScreen("home")}
        minDurationMs={1800}
      />
    );
  } else if (screen === "home") {
    content = (
      <window.HomeScreen
        profile={profile}
        onNavigate={navigate}
        onOpenBonusModal={() => setBonusModalOpen(true)}
      />
    );
  } else if (screen === "bonus") {
    content = (
      <window.BonusGameScreen
        onComplete={handleBonusComplete}
        onClose={handleHome}
      />
    );
  } else if (screen === "game") {
    content = (
      <window.GameScreen
        profile={profile}
        onProfileChange={setProfile}
        onGameOver={handleGameOver}
        onExitToHome={handleHome}
        onOpenShop={() => setScreen("shop")}
        onWatchAd={handleWatchAd}
      />
    );
  } else if (screen === "gameover") {
    content = (
      <window.GameOverScreen
        result={lastResult}
        profile={profile}
        onRetry={handleRetry}
        onHome={handleHome}
        onWatchAd={handleWatchAd}
        onWatchBoosterAd={handleGameOverBoosterAdStart}
        onBuyLife={handleBuyLife}
      />
    );
  } else if (screen === "wheel") {
    content = (
      <window.FortuneWheel
        profile={profile}
        onClose={handleHome}
        onReward={handleWheelReward}
        onWatchAdSpin={() => setPendingShopAd({ type: "wheelSpin", amount: 1 })}
        adSpinSignal={wheelAdSpinNonce}
      />
    );
  } else if (screen === "settings") {
    content = (
      <window.SettingsScreen
        settings={settings}
        onChange={setSettings}
        onClose={handleHome}
        onReset={handleResetData}
      />
    );
  } else if (screen === "stats") {
    content = (
      <window.StatsScreen
        profile={profile}
        onProfileChange={setProfile}
        onClose={handleHome}
      />
    );
  } else if (screen === "shop") {
    content = (
      <window.ShopScreen
        profile={profile}
        onBuy={handleBuyBooster}
        onBuyPack={handleBuyPack}
        onGrantPack={handleGrantPack}
        onWatchAd={handleShopAdStart}
        onClose={handleHome}
      />
    );
  } else {
    // Fallback de sécurité
    content = (
      <UnknownScreen
        onBack={handleHome}
      />
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {content}
      {pendingShopAd && (
        <window.RewardedAd
          reward={{ type: pendingShopAd.type, amount: pendingShopAd.amount, id: pendingShopAd.id }}
          durationSec={5}
          onSkip={() => {
            if (typeof pendingShopAd.onCancel === "function") pendingShopAd.onCancel();
            setPendingShopAd(null);
          }}
          onComplete={() => {
            if (typeof pendingShopAd.onSuccess === "function") {
              pendingShopAd.onSuccess();
            } else if (pendingShopAd.type === "wheelSpin") {
              setWheelAdSpinNonce((n) => n + 1);
            } else if (pendingShopAd.type === "booster") {
              handleRewardedBooster(pendingShopAd.id);
            } else {
              handleShopAdReward(pendingShopAd.amount);
            }
            setPendingShopAd(null);
          }}
        />
      )}
      {showTutorial && <TutorialOverlay onClose={closeTutorial} />}
      {bonusModalOpen && (
        <BonusAdPromptModal
          onWatchAd={() => {
            setBonusModalOpen(false);
            setPendingShopAd({
              type: "bonusGame",
              amount: 0,
              onSuccess: () => {
                setScreen("bonus");
              },
            });
          }}
          onQuickTest={() => {
            setBonusModalOpen(false);
            setScreen("bonus");
          }}
          onClose={() => setBonusModalOpen(false)}
        />
      )}
    </div>
  );
}

/* ─── Tutorial overlay (v1.16 — first launch only) ──────────── */
function TutorialOverlay({ onClose }) {
  const [step, setStep] = useStateApp(0);
  const tr = (key, params) => window.STI18n ? window.STI18n.t(key, params) : key;
  const steps = [
    { icon: "🎮", title: tr("tutorial1Title"), text: tr("tutorial1Text") },
    { icon: "👆", title: tr("tutorial2Title"), text: tr("tutorial2Text") },
    { icon: "🔄", title: tr("tutorial3Title"), text: tr("tutorial3Text") },
    { icon: "❄️ ⚡ ☄️ 🧲", title: tr("tutorial4Title"), text: tr("tutorial4Text") },
    { icon: "🏆", title: tr("tutorial5Title"), text: tr("tutorial5Text") },
  ];
  const last = step === steps.length - 1;
  const cur = steps[step];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(11, 18, 56, 0.94)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={(e) => e.stopPropagation()}>
      <div style={{
        background: "linear-gradient(180deg, #1a2a6e, #0b1238)",
        border: "2px solid #7c3aed",
        borderRadius: 20, padding: 28, maxWidth: 380, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(124,58,237,0.4)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{cur.icon}</div>
        <h2 style={{ fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif", fontSize: 22, color: "#fff", margin: "0 0 12px", textShadow: "0 2px 0 rgba(0,0,0,0.5)" }}>
          {cur.title}
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.55, margin: "0 0 24px", fontWeight: 500 }}>
          {cur.text}
        </p>
        {/* Indicateurs steps */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i === step ? "#a855f7" : "rgba(255,255,255,0.25)",
              transition: "all 0.2s",
            }} />
          ))}
        </div>
        {/* Boutons */}
        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 12,
                background: "transparent", border: "1.5px solid rgba(255,255,255,0.3)",
                color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "system-ui, sans-serif",
              }}
            >{tr("previous")}</button>
          )}
          <button
            onClick={() => last ? onClose() : setStep((s) => s + 1)}
            className="btn-3d"
            style={{
              flex: 2, padding: "12px 16px", borderRadius: 12,
              background: "linear-gradient(180deg, #a855f7, #7c3aed)",
              border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
              fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif", letterSpacing: 0.5,
              boxShadow: "0 4px 0 #5b21b6, inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          >{last ? tr("letsGo") : tr("next")}</button>
        </div>
        {!last && (
          <button
            onClick={onClose}
            style={{
              marginTop: 14, background: "transparent", border: "none",
              color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer",
              textDecoration: "underline", fontFamily: "system-ui, sans-serif",
            }}
          >{tr("skip")}</button>
        )}
      </div>
    </div>
  );
}

/* ─── Fallback de route inconnue ─────────────────────────── */
function UnknownScreen({ onBack }) {
  const tr = (key, params) => window.STI18n ? window.STI18n.t(key, params) : key;
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      background: "radial-gradient(ellipse at top, #1a2a6e, #0b1238 70%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 80, marginBottom: 16 }}>⚠️</div>
      <h1 style={{
        fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
        fontSize: 36,
        color: "#fff",
        marginBottom: 8,
        letterSpacing: 1,
        textShadow: "0 3px 0 rgba(0,0,0,0.4)",
      }}>{tr("oops")}</h1>
      <p style={{
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
        marginBottom: 32,
        maxWidth: 320,
        lineHeight: 1.5,
      }}>
        {tr("screenUnavailable")}
      </p>
      <button className="btn-3d purple" onClick={onBack}>{tr("back")}</button>
    </div>
  );
}

/* ─── Modale d'accès au Jeu Bonus 3D ─────────────────────── */
function BonusAdPromptModal({ onWatchAd, onQuickTest, onClose }) {
  const tr = (key, params) => (window.STI18n ? window.STI18n.t(key, params) : key);
  return (
    <div style={SBAP.root}>
      <div style={SBAP.card}>
        <div style={SBAP.badge}>JEU BONUS 3D</div>
        <div style={SBAP.icon}>🎁</div>
        <h2 style={SBAP.title}>BLOCK CRUSH 3D</h2>
        <p style={SBAP.desc}>
          {tr("bonusGameDesc") || "Détruisez les blocs en cascade 3D pour gagner des pièces et boosters !"}
        </p>

        <div style={SBAP.rewardsBox}>
          <div style={SBAP.rewardPill}>👑 +250 Pièces</div>
          <div style={SBAP.rewardPill}>⚡ Boosters Offerts</div>
        </div>

        <button onClick={onWatchAd} className="btn-3d gold" style={SBAP.watchBtn}>
          🎬 {tr("watchAdToPlay") || "Regarder la pub (5s)"}
        </button>

        <button onClick={onQuickTest} className="btn-3d purple" style={SBAP.testBtn}>
          ⚡ {tr("quickTestBtn") || "Test Direct (Sans Pub)"}
        </button>

        <button onClick={onClose} style={SBAP.closeBtn}>
          {tr("cancel") || "Annuler"}
        </button>
      </div>
    </div>
  );
}

const SBAP = {
  root: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.88)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 600,
    padding: 20,
  },
  card: {
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "2px solid var(--purple)",
    borderRadius: 22,
    padding: "24px 20px",
    width: "100%",
    maxWidth: 360,
    textAlign: "center",
    boxShadow: "0 12px 36px rgba(0,0,0,0.7), 0 0 25px rgba(124,58,237,0.4)",
  },
  badge: {
    fontSize: 11,
    fontWeight: 900,
    color: "var(--orange)",
    letterSpacing: 2,
    marginBottom: 6,
  },
  icon: {
    fontSize: 48,
    margin: "4px 0 8px",
    filter: "drop-shadow(0 4px 10px rgba(236,72,153,0.5))",
  },
  title: {
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
    fontSize: 22,
    color: "#fff",
    margin: "0 0 8px",
    letterSpacing: 1,
  },
  desc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    margin: "0 0 16px",
    lineHeight: 1.4,
    fontWeight: 600,
  },
  rewardsBox: {
    display: "flex",
    gap: 8,
    justifyContent: "center",
    marginBottom: 20,
  },
  rewardPill: {
    background: "rgba(255,210,63,0.15)",
    border: "1px solid var(--gold)",
    color: "var(--gold)",
    borderRadius: 100,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 900,
  },
  watchBtn: {
    width: "100%",
    padding: "14px 16px",
    fontSize: 15,
    marginBottom: 10,
    borderRadius: 12,
    cursor: "pointer",
  },
  testBtn: {
    width: "100%",
    padding: "12px 16px",
    fontSize: 13,
    marginBottom: 12,
    borderRadius: 12,
    cursor: "pointer",
    background: "linear-gradient(180deg, #3b82f6, #1d4ed8)",
    border: "1px solid rgba(255,255,255,0.3)",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    padding: 6,
  },
};

window.App = App;
