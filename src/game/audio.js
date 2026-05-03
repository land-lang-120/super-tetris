/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Audio (Web Audio API)
   ═══════════════════════════════════════════════════════════════════
   Effets sonores synthétiques (pas de fichiers .mp3 à charger) :
     - Tons synthétisés via OscillatorNode
     - Différents pour move, rotate, lock, clear, tetris, levelUp,
       gameOver, booster, hardDrop, hold

   AudioContext est lazy-initialisé (au 1er bruit, pas au boot)
   pour éviter "AudioContext suspended" sur navigateur mobile.
   Auto-resume au 1er user-gesture.

   Respecte st_settings.sound (si false → no-op).
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  var ctx = null;
  var initialized = false;

  function getCtx() {
    if (ctx) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      initialized = true;
      // ─── Resume on user gesture (mobile + desktop autoplay policy)
      // Listeners NON-once : tant que le AC est en suspended, chaque
      // gesture utilisateur le tente. Auto-désinstallation dès running.
      var resume = function () {
        if (!ctx) return;
        if (ctx.state === "suspended") {
          ctx.resume().then(function () {
            if (ctx.state === "running") {
              document.removeEventListener("touchstart", resume);
              document.removeEventListener("click",      resume);
              document.removeEventListener("keydown",    resume);
              document.removeEventListener("pointerdown", resume);
            }
          }).catch(function(){});
        }
      };
      document.addEventListener("touchstart",  resume, { passive: true });
      document.addEventListener("click",       resume);
      document.addEventListener("keydown",     resume);
      document.addEventListener("pointerdown", resume);
      return ctx;
    } catch (_) { return null; }
  }

  function soundEnabled() {
    try {
      var raw = localStorage.getItem("st_settings");
      if (!raw) return true;
      var s = JSON.parse(raw);
      return s && s.sound !== false;
    } catch (_) { return true; }
  }

  /**
   * Joue un tone basique avec enveloppe ADSR simple.
   * @param freq        fréquence en Hz
   * @param duration    durée en secondes
   * @param type        oscillator type (sine, square, sawtooth, triangle)
   * @param volume      0..1
   */
  function tone(freq, duration, type, volume) {
    if (!soundEnabled()) return;
    var c = getCtx();
    if (!c) return;
    try {
      // ─── Fix v1.7 : force le resume du AC à CHAQUE tone() s'il est
      // suspended. Le listener once() peut rater le tout premier gesture
      // (race condition) et laisser le AC bloqué muet pour toujours.
      // Comme tone() est forcément appelé depuis un event handler user
      // (move/rotate/lock/etc.), le browser autorise resume() ici.
      if (c.state === "suspended" && typeof c.resume === "function") {
        c.resume().catch(function () {});
      }

      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = type || "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(c.destination);
      var now = c.currentTime;
      var v = (typeof volume === "number" ? volume : 0.15);
      // attack
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(v, now + 0.01);
      // decay+sustain+release combinés
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (_) {}
  }

  /** Joue plusieurs tones séquentiels (mélodies courtes). */
  function sequence(notes) {
    var c = getCtx();
    if (!c) return;
    var t = 0;
    notes.forEach(function (n) {
      setTimeout(function () {
        tone(n.freq, n.dur || 0.1, n.type || "sine", n.vol || 0.15);
      }, t);
      t += (n.gap || 80);
    });
  }

  // ─── Library d'effets sonores ────────────────────────────────
  var SFX = {
    move:     function () { tone(240, 0.04, "square",   0.06); },
    rotate:   function () { tone(360, 0.05, "triangle", 0.08); },
    lock:     function () { tone(180, 0.08, "sine",     0.12); },
    hardDrop: function () { tone(120, 0.12, "sawtooth", 0.14); },
    hold:     function () { tone(440, 0.06, "triangle", 0.08); },

    line1:    function () { sequence([{freq:523,dur:0.1},{freq:659,dur:0.1}]); },
    line2:    function () { sequence([{freq:523,dur:0.1},{freq:659,dur:0.1},{freq:784,dur:0.1}]); },
    line3:    function () { sequence([{freq:523,dur:0.08},{freq:659,dur:0.08},{freq:784,dur:0.08},{freq:1047,dur:0.12}]); },
    tetris:   function () { sequence([
      {freq:523,dur:0.08,type:"square"},
      {freq:659,dur:0.08,type:"square"},
      {freq:784,dur:0.08,type:"square"},
      {freq:1047,dur:0.16,type:"square",vol:0.18},
    ]); },

    levelUp:  function () { sequence([
      {freq:523,dur:0.1},{freq:659,dur:0.1},{freq:784,dur:0.1},
      {freq:1047,dur:0.1},{freq:1319,dur:0.2,vol:0.18},
    ]); },

    booster:  function () { tone(800, 0.15, "triangle", 0.12); },
    gameOver: function () { sequence([
      {freq:392,dur:0.15},{freq:330,dur:0.15},{freq:262,dur:0.3,vol:0.18},
    ]); },
    win:      function () { sequence([
      {freq:523,dur:0.1},{freq:659,dur:0.1},{freq:784,dur:0.1},
      {freq:1047,dur:0.15},{freq:784,dur:0.1},{freq:1047,dur:0.25,vol:0.2},
    ]); },
    button:   function () { tone(660, 0.05, "sine", 0.08); },
    coin:     function () { tone(880, 0.08, "triangle", 0.10); },
  };

  function play(name) {
    var fn = SFX[name];
    if (fn) fn();
  }

  window.STAudio = {
    play: play,
    SFX: SFX,
    tone: tone,
    sequence: sequence,
    getCtx: getCtx, // exposé pour STMusic (partage du AudioContext)
  };
})();
