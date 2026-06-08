/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — useStorage hook
   ═══════════════════════════════════════════════════════════════════
   Wrapper localStorage versionné pour :
     - Lire/écrire de manière typée (avec defaults)
     - Gérer les erreurs (private mode, storage plein, etc.)
     - Versionner le schéma (st_v) pour migrations futures

   Cf. checklist senior #9 : "Versionnage du schéma" + "Optional chaining
   systématique sur les accès aux objets persistés".

   Usage :
     const [coins, setCoins] = useStorage("st_coins", 0);
     const [profile, setProfile] = useStorage("st_profile",
       { xp:0, bestScore:0, boosters:{} });
   ═══════════════════════════════════════════════════════════════════ */

const { useState: useStateST, useEffect: useEffectST, useCallback: useCallbackST } = React;

/* SCHEMA_VERSION : version courante du schéma localStorage.
   v1 = legacy (2026-04-15)
   v2 = test Pino : boosters=30 (2026-05-03) ← retirée pour la prod
   v3 = production : boosters de départ équilibrés (2026-05-05, audit BUG-SEC-ST-2). */
const SCHEMA_VERSION = 3;

// Cache mémoire pour éviter les reads répétés
const memCache = {};

/* v1.16+ round 3 (audit BUG-SEC-ST-4 + BUG-AUDIT-ST-9) :
   Validation structure + types au load. Avant : si user éditait localStorage
   manuellement (DevTools) en mettant `coins: "abc"` ou `boosters: null`,
   l'app crashait silencieusement. Maintenant on valide chaque champ critique
   et on retombe sur defaultValue si corrompu — pas de crash 1-star.
   Spec validation : profile = { coins:int, xp:int, bestScore:int,
                                  boosters:{freeze:int,laser:int,meteor:int,magnet:int},
                                  wheelLastFree:int, totalGames:int, history:array }
                    settings = { sound:bool, music:bool, vibro:bool, lang:str, theme:str } */
function isPositiveInt(v) {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 && Number.isInteger(v);
}
function validateProfile(p, def) {
  if (!p || typeof p !== "object") return def;
  const out = { ...def };
  if (isPositiveInt(p.coins)) out.coins = p.coins;
  if (isPositiveInt(p.xp)) out.xp = p.xp;
  if (isPositiveInt(p.bestScore)) out.bestScore = p.bestScore;
  if (isPositiveInt(p.totalGames)) out.totalGames = p.totalGames;
  if (typeof p.wheelLastFree === "number" && Number.isFinite(p.wheelLastFree)) out.wheelLastFree = p.wheelLastFree;
  if (Array.isArray(p.history)) {
    out.history = p.history.slice(0, 30).filter((g) => g && typeof g === "object").map((g) => ({
      score: isPositiveInt(g.score) ? g.score : 0,
      linesTotal: isPositiveInt(g.linesTotal) ? g.linesTotal : 0,
      level: isPositiveInt(g.level) ? g.level : 1,
      xpGain: isPositiveInt(g.xpGain) ? g.xpGain : 0,
      coinsGain: isPositiveInt(g.coinsGain) ? g.coinsGain : 0,
      date: typeof g.date === "number" && Number.isFinite(g.date) ? g.date : Date.now(),
    }));
  }
  if (p.boosters && typeof p.boosters === "object") {
    const b = { ...def.boosters };
    ["freeze", "laser", "meteor", "magnet"].forEach((k) => {
      if (isPositiveInt(p.boosters[k]) && p.boosters[k] <= 999) b[k] = p.boosters[k];
    });
    out.boosters = b;
  }
  return out;
}
function validateSettings(s, def) {
  if (!s || typeof s !== "object") return def;
  const out = { ...def };
  if (typeof s.sound === "boolean") out.sound = s.sound;
  if (typeof s.music === "boolean") out.music = s.music;
  if (typeof s.vibro === "boolean") out.vibro = s.vibro;
  if (typeof s.lang === "string" && s.lang.length <= 4) out.lang = s.lang;
  if (s.theme === "light" || s.theme === "dark") out.theme = s.theme;
  return out;
}

function safeRead(key, defaultValue) {
  try {
    if (key in memCache) return memCache[key];
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    let parsed = JSON.parse(raw);
    /* Validation structure selon la clé */
    if (key === "st_profile") parsed = validateProfile(parsed, defaultValue);
    else if (key === "st_settings") parsed = validateSettings(parsed, defaultValue);
    memCache[key] = parsed;
    return parsed;
  } catch (e) {
    console.warn("[ST] safeRead failed for", key, e);
    return defaultValue;
  }
}

function safeWrite(key, value) {
  try {
    memCache[key] = value;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    // QuotaExceededError, SecurityError, private mode...
    console.warn("[ST] safeWrite failed for", key, e);
    return false;
  }
}

/**
 * Hook React qui retourne [value, setValue] backed by localStorage.
 * @param key string
 * @param defaultValue any
 */
function useStorage(key, defaultValue) {
  const [value, setValue] = useStateST(() => safeRead(key, defaultValue));

  const setAndPersist = useCallbackST((next) => {
    setValue((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      safeWrite(key, resolved);
      return resolved;
    });
  }, [key]);

  return [value, setAndPersist];
}

/**
 * Initialise le schéma : pose la version courante si jamais set.
 */
function ensureSchema() {
  try {
    const v = localStorage.getItem("st_v");
    if (!v) {
      localStorage.setItem("st_v", String(SCHEMA_VERSION));
    } else {
      const num = parseInt(v, 10);
      if (num < SCHEMA_VERSION) {
        // Migration v2 → v3 (production) : si l'utilisateur a hérité du buff
        // de test (boosters = 30 chacun), on le ramène à des valeurs de
        // démarrage équilibrées (sinon l'économie du jeu est cassée dès le
        // premier launch). On ne touche PAS aux boosters supérieurs aux
        // valeurs de départ : si Pino a déjà gagné des boosters via la roue
        // de la fortune, on les garde.
        if (num === 2) {
          try {
            const profileRaw = localStorage.getItem("st_profile");
            if (profileRaw) {
              const profile = JSON.parse(profileRaw);
              if (profile && profile.boosters) {
                // Si exactement 30 (signal du test Pino), on reset.
                // Sinon, c'est que le joueur a gagné/dépensé : on n'écrase pas.
                const b = profile.boosters;
                if (b.freeze === 30 && b.laser === 30 && b.meteor === 30 && b.magnet === 30) {
                  profile.boosters = { freeze: 1, laser: 1, meteor: 0, magnet: 0 };
                  localStorage.setItem("st_profile", JSON.stringify(profile));
                  delete memCache["st_profile"];
                }
              }
            }
          } catch (_) {}
        }
        localStorage.setItem("st_v", String(SCHEMA_VERSION));
      }
    }
  } catch (_) {}
}
ensureSchema();

window.useStorage = useStorage;
window.STStorage = {
  read: safeRead,
  write: safeWrite,
  SCHEMA_VERSION: SCHEMA_VERSION,
};
