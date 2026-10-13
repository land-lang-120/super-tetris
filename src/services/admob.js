/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — STAdMob (Service Publicités Récompensées Google AdMob)
   ═══════════════════════════════════════════════════════════════════
   Gestion des publicités récompensées AdMob pour l'application Mobile.
   Supporte :
     1. Le bridge natif Android AdMob (si présent dans la WebView/TWA)
     2. Google AdSense / AdManager / Google Mobile Ads Web SDK
     3. Fallback automatique vers la simulation si AdMob est bloqué/hors ligne
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  // IDs AdMob configurables (à remplacer par tes identifiants AdMob de production)
  let config = {
    appId: "ca-app-pub-3940256099942544~3347511713", // Test App ID par défaut Google
    rewardedUnitId: "ca-app-pub-3940256099942544/5224354917", // Test Rewarded Ad Unit ID par défaut
    enabled: true,
  };

  let isLoaded = false;
  let isAdReady = false;

  /**
   * Permet de mettre à jour les IDs AdMob de l'application
   */
  function configure(newConfig) {
    config = { ...config, ...newConfig };
    console.log("[STAdMob] Configuration mise à jour:", config);
  }

  /**
   * Initialise le SDK AdMob Web / GPT si disponible
   */
  function init() {
    if (typeof window === "undefined") return;

    // Détection du bridge natif Android AdMob s'il existe
    if (window.AndroidAdMob || window.AdMob) {
      console.log("[STAdMob] Bridge AdMob natif détecté");
      isLoaded = true;
      isAdReady = true;
      return;
    }

    // Chargement optionnel du Google Publisher Tag / Google Mobile Ads SDK pour Web
    if (!window.googletag && !document.getElementById("admob-gpt-sdk")) {
      const script = document.createElement("script");
      script.id = "admob-gpt-sdk";
      script.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
      script.async = true;
      script.onload = () => {
        console.log("[STAdMob] Google Mobile Ads Web SDK prêt");
        isLoaded = true;
        isAdReady = true;
      };
      script.onerror = () => {
        console.warn("[STAdMob] Impossible de charger Google Mobile Ads SDK (hors-ligne ou adblocker)");
        isLoaded = false;
        isAdReady = false;
      };
      document.head.appendChild(script);
    }
  }

  /**
   * Tente d'afficher une publicité récompensée AdMob.
   * Si AdMob n'est pas disponible ou échoue, appelle onError/onFallback.
   * 
   * @param {Object} options
   * @param {Object} options.reward Description de la récompense
   * @param {Function} options.onComplete Appelé après succès de la vidéo (récompense validée)
   * @param {Function} options.onSkip Appelé si l'utilisateur quitte avant la fin
   * @param {Function} options.onFallback Appelé si AdMob est indisponible (ex: passe au simulateur)
   */
  function showRewardedAd({ reward, onComplete, onSkip, onFallback }) {
    console.log("[STAdMob] Demande d'affichage pub récompensée pour:", reward);

    // 1. Vérification du bridge natif Android (si l'app Android transmet l'objet)
    if (window.AndroidAdMob && typeof window.AndroidAdMob.showRewarded === "function") {
      try {
        window.__stAdMobOnReward = () => {
          console.log("[STAdMob] Récompense validée par le bridge natif Android");
          if (typeof onComplete === "function") onComplete();
        };
        window.__stAdMobOnSkip = () => {
          console.log("[STAdMob] Vidéo fermée sans récompense");
          if (typeof onSkip === "function") onSkip();
        };
        window.AndroidAdMob.showRewarded(config.rewardedUnitId, "__stAdMobOnReward", "__stAdMobOnSkip");
        return;
      } catch (bridgeErr) {
        console.warn("[STAdMob] Crash du bridge natif Android:", bridgeErr);
        if (typeof onFallback === "function") { onFallback(); return; }
      }
    }

    // 2. Vérification du SDK AdMob / Capacitor / Cordova AdMob s'il existe
    if (window.AdMob && typeof window.AdMob.showRewardVideo === "function") {
      try {
        window.AdMob.showRewardVideo({
          adId: config.rewardedUnitId,
        }, (res) => {
          if (res && res.rewarded) {
            if (typeof onComplete === "function") onComplete();
          } else {
            if (typeof onSkip === "function") onSkip();
          }
        }, (err) => {
          console.warn("[STAdMob] Erreur AdMob plugin:", err);
          if (typeof onFallback === "function") onFallback();
        });
        return;
      } catch (pluginErr) {
        console.warn("[STAdMob] Crash du plugin AdMob:", pluginErr);
        if (typeof onFallback === "function") { onFallback(); return; }
      }
    }

    // 3. Sinon, déclencher le fallback vers le simulateur UI intégré
    console.log("[STAdMob] Redirection vers le simulateur RewardedAd intégré (AdMob Web Fallback)");
    if (typeof onFallback === "function") {
      onFallback();
    } else if (typeof onComplete === "function") {
      onComplete();
    }
  }

  // Initialisation automatique au chargement du script
  try { init(); } catch (_) {}

  // Export sur window.STAdMob
  window.STAdMob = {
    configure,
    init,
    showRewardedAd,
    getConfig: () => ({ ...config }),
  };
})();
