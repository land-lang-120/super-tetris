/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Haptics (vibrations)
   ═══════════════════════════════════════════════════════════════════
   Wrapper léger autour de navigator.vibrate() avec patterns prédéfinis.
   Sur iOS : pas supporté → fallback silencieux (try/catch).
   Sur Android : tous les patterns marchent.

   Respect du setting utilisateur : si st_settings.vibro === false → no-op.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  var HAPTICS = {
    move:      [6],
    rotate:    [10],
    lock:      [18],
    hardDrop:  [12, 40, 40],
    line1:     [40, 30, 40],
    line2:     [40, 20, 40, 20, 60],
    line3:     [40, 15, 40, 15, 40, 15, 80],
    line4:     [60, 10, 60, 10, 60, 10, 100],
    booster:   [20, 30, 60, 30, 20],
    levelUp:   [30, 20, 50, 20, 80, 20, 120],
    gameOver:  [80, 40, 60, 40, 40, 40, 20],
  };

  function vibroEnabled() {
    try {
      var raw = localStorage.getItem("st_settings");
      if (!raw) return true; // default ON
      var s = JSON.parse(raw);
      return s && s.vibro !== false;
    } catch (_) { return true; }
  }

  function vibe(pattern) {
    try {
      if (!navigator.vibrate) return;
      if (!vibroEnabled()) return;
      navigator.vibrate(pattern);
    } catch (_) {}
  }

  // API named (vibePattern("lock"))
  function vibePattern(name) {
    var p = HAPTICS[name];
    if (p) vibe(p);
  }

  window.STHaptics = {
    PATTERNS: HAPTICS,
    vibe: vibe,
    vibePattern: vibePattern,
  };
})();
