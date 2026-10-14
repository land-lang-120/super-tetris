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

  // ─── Échantillon natif de brique qui se brise (Crush Bref 360ms de référence) ───
  var brickBuffer = null;
  var BRICK_SOUND_URL = "vendor/sounds/brick_break.wav";

  function preloadSamples() {
    var c = getCtx();
    if (!c || brickBuffer) return;
    try {
      fetch(BRICK_SOUND_URL)
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.arrayBuffer();
        })
        .then(function (ab) { return c.decodeAudioData(ab); })
        .then(function (buf) { brickBuffer = buf; })
        .catch(function () {});
    } catch (_) {}
  }

  /**
   * Joue le véritable son d'une brique qui se casse (Crush Bref 360ms officiel).
   * @param {number} [count=1] Nombre de lignes détruites (1..4)
   * @param {number} [combo=0] Niveau de cascade / combo
   */
  function playBrickBreak(count, combo) {
    if (!soundEnabled()) return;
    var c = getCtx();
    if (!c) return;
    try {
      if (c.state === "suspended" && typeof c.resume === "function") {
        c.resume().catch(function () {});
      }

      if (!brickBuffer) {
        fetch(BRICK_SOUND_URL)
          .then(function (r) { return r.arrayBuffer(); })
          .then(function (ab) { return c.decodeAudioData(ab); })
          .then(function (decoded) {
            brickBuffer = decoded;
            playBufferInternal(c, decoded, count, combo);
          })
          .catch(function () {});
        return;
      }

      playBufferInternal(c, brickBuffer, count, combo);
    } catch (_) {}
  }

  function playBufferInternal(c, buf, count, combo) {
    var lines = Math.max(1, Math.min(4, count || 1));
    var comboBoost = Math.min(8, combo || 0);
    var now = c.currentTime;

    // Nombre d'impacts échelonnés selon le nombre de briques/lignes détruites
    var numHits = lines === 1 ? 1 : lines === 2 ? 2 : lines === 3 ? 3 : 4;

    for (var i = 0; i < numHits; i++) {
      (function (idx) {
        var src = c.createBufferSource();
        src.buffer = buf;

        // Micro-variation naturelle de pitch selon l'impact pour un rendu ultra-naturel
        var pitch = 1.0 + (comboBoost * 0.04) + (idx * 0.035) + (Math.random() * 0.03 - 0.015);
        src.playbackRate.value = Math.max(0.75, Math.min(1.6, pitch));

        var gain = c.createGain();
        // Volume percutant et franc (90% à 75% selon la polyphonie)
        var baseVol = 0.88;
        if (lines === 1) baseVol = 0.90;
        else if (lines === 2) baseVol = 0.82;
        else if (lines === 3) baseVol = 0.76;
        else baseVol = 0.72;

        var hitTime = now + (idx * (lines >= 4 ? 0.035 : 0.045));

        gain.gain.setValueAtTime(baseVol, hitTime);

        src.connect(gain);
        gain.connect(c.destination);

        src.start(hitTime);
      })(i);
    }

    // Impact sub-bass supplémentaire pour TÉTRIS (4 lignes) : donne du poids à l'écroulement
    if (lines >= 4) {
      try {
        var sub = c.createOscillator();
        var subG = c.createGain();
        sub.type = "sine";
        sub.frequency.setValueAtTime(110, now);
        sub.frequency.exponentialRampToValueAtTime(32, now + 0.26);

        subG.gain.setValueAtTime(0, now);
        subG.gain.linearRampToValueAtTime(0.28, now + 0.006);
        subG.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

        sub.connect(subG);
        subG.connect(c.destination);
        sub.start(now);
        sub.stop(now + 0.28);
      } catch (_) {}
    }
  }

  // ─── Library d'effets sonores ────────────────────────────────
  var SFX = {
    move:     function () { tone(240, 0.04, "square",   0.06); },
    rotate:   function () { tone(360, 0.05, "triangle", 0.08); },
    lock:     function () { tone(180, 0.08, "sine",     0.12); },
    hardDrop: function () { tone(120, 0.12, "sawtooth", 0.14); },
    hold:     function () { tone(440, 0.06, "triangle", 0.08); },

    // Sons de destruction de briques (remplacent les simples bips par un vrai fracas)
    line1:      function () { playBrickBreak(1); },
    line2:      function () { playBrickBreak(2); },
    line3:      function () { playBrickBreak(3); },
    tetris:     function () { playBrickBreak(4); },
    brickBreak: function (count, combo) { playBrickBreak(count, combo); },
    brickCrack: function () { playBrickBreak(1, 0); },

    levelUp:  function () { sequence([
      {freq:523,dur:0.1},{freq:659,dur:0.1},{freq:784,dur:0.1},
      {freq:1047,dur:0.1},{freq:1319,dur:0.2,vol:0.18},
    ]); },

    booster:  function () { tone(800, 0.15, "triangle", 0.12); },

    // ─── v1.13 : sons spécifiques par booster (parité Tetroid)
    // ❄️ FREEZE : descente glaciale, deux notes hautes qui chutent + souffle
    boosterFreeze: function () { sequence([
      {freq:1568,dur:0.12,type:"sine",vol:0.14},
      {freq:1175,dur:0.14,type:"sine",vol:0.12},
      {freq: 880,dur:0.18,type:"sine",vol:0.10},
      {freq: 587,dur:0.30,type:"triangle",vol:0.08},
    ]); },
    // ⚡ LASER : zap strident montant + flash sawtooth
    boosterLaser: function () { sequence([
      {freq: 220,dur:0.04,type:"sawtooth",vol:0.16,gap:30},
      {freq: 880,dur:0.05,type:"sawtooth",vol:0.18,gap:30},
      {freq:2200,dur:0.10,type:"square",  vol:0.16,gap:40},
      {freq:1760,dur:0.16,type:"triangle",vol:0.10},
    ]); },
    // ☄️ METEOR : impact lourd, sub-bass + crash
    boosterMeteor: function () { sequence([
      {freq: 90, dur:0.15,type:"sawtooth",vol:0.18,gap:60},
      {freq: 60, dur:0.20,type:"sawtooth",vol:0.20,gap:80},
      {freq:140, dur:0.10,type:"square",  vol:0.14,gap:50},
      {freq: 80, dur:0.30,type:"triangle",vol:0.12},
    ]); },
    // 🧲 MAGNET : sweep montant violacé + résonance
    boosterMagnet: function () { sequence([
      {freq: 330,dur:0.08,type:"triangle",vol:0.12,gap:50},
      {freq: 494,dur:0.08,type:"triangle",vol:0.13,gap:50},
      {freq: 659,dur:0.08,type:"triangle",vol:0.14,gap:50},
      {freq: 880,dur:0.10,type:"sine",    vol:0.13,gap:50},
      {freq:1108,dur:0.20,type:"sine",    vol:0.10},
    ]); },

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
    brickBreak: playBrickBreak,
    brickCrack: function () { playBrickBreak(1, 0); },
    getBrickStyle: function () { return "default"; },
    setBrickStyle: function () {},
    preloadSamples: preloadSamples,
    getCtx: getCtx, // exposé pour STMusic (partage du AudioContext)
  };
})();
