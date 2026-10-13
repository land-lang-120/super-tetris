/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — useStorage hook
   ═══════════════════════════════════════════════════════════════════
   Wrapper localStorage versionné pour :
     - Lire/écrire de manière typée (avec defaults)
     - Gérer les erreurs (private mode, storage plein, etc.)
     - Versionner le schéma (st_v) pour migrations futures

   Usage :
     const [coins, setCoins] = useStorage("st_coins", 0);
     const [profile, setProfile] = useStorage("st_profile",
       { xp:0, bestScore:0, boosters:{} });
   ═══════════════════════════════════════════════════════════════════ */

const { useState: useStateST, useEffect: useEffectST, useCallback: useCallbackST } = React;

/* SCHEMA_VERSION : version courante du schéma localStorage.
   v4 = 30 boosters de base partout + support multilingue écran quitter (2026-09-11). */
const SCHEMA_VERSION = 4;

// Cache mémoire pour éviter les reads répétés
const memCache = {};

/* Validation structure + types au load */
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
  if (typeof p.playerName === "string") out.playerName = p.playerName.trim().slice(0, 18);
  if (typeof p.playerId === "string") out.playerId = p.playerId.trim().slice(0, 32);
  if (isPositiveInt(p.profileCreatedAt)) out.profileCreatedAt = p.profileCreatedAt;
  if (typeof p.starterBoostersGranted === "boolean") out.starterBoostersGranted = p.starterBoostersGranted;
  if (typeof p.starterBoosters30Granted === "boolean") out.starterBoosters30Granted = p.starterBoosters30Granted;
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
