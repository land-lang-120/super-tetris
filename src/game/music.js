/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Musique iconique (port de Tetroid audio.js)
   ═══════════════════════════════════════════════════════════════════
   Séquenceur Web Audio API qui joue le THÈME ICONIQUE de Tetris
   (Korobeiniki) en boucle, avec :
     - Mélodie principale (square + sine octave) — séquence MUSIC_SEQ
     - Ligne de basse (triangle wave) — BASS_PATTERN sur 8 mesures
     - Percussion (kick / snare / hat) — pattern 4/4

   Architecture :
     - BPM 158, scheduler avec lookahead 0.1s (toutes les 25ms)
     - Indépendant du toggle "sound" (a son propre toggle "music")
     - Réutilise window.STAudio.getCtx() pour partager l'AudioContext
     - Auto-resume du AC sur user gesture

   API :
     window.STMusic = {
       start(),    // démarre la boucle
       stop(),     // arrête + clear interval
       toggle(on), // bascule + persist setting
       isOn()      // lit le setting (default true)
     }
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  // ─── Config musicale ──────────────────────────────────────────
  var M_BPM  = 158;
  var M_BEAT = 60 / M_BPM;
  var M_E    = M_BEAT / 2;

  // Notes (Hz) — gamme piano
  var MN = {
    E2:82, B2:123, A2:110, C3:131, D3:147, E3:165, G3:196, A3:220, B3:247,
    C4:262, D4:294, E4:330, F4:349, G4:392, A4:440, B4:494,
    C5:523, D5:587, E5:659, F5:698, G5:784, A5:880
  };

  /** Construit la séquence Korobeiniki (Tetris Theme A). */
  function buildSequence() {
    var Q = M_BEAT, E = M_E;
    var seq = [];
    function m(f, d) { seq.push({ mf: MN[f] || 0, md: d }); }
    function r(d)    { seq.push({ mf: 0, md: d }); }

    m('E5',Q); m('B4',E); m('C5',E); m('D5',Q); m('C5',E); m('B4',E);
    m('A4',Q); m('A4',E); m('C5',E); m('E5',Q); m('D5',E); m('C5',E);
    m('B4',Q); m('C5',E); m('D5',E); m('E5',Q); m('C5',Q);
    m('A4',Q); m('A4',Q); r(M_BEAT * 2);
    r(E); m('D5',E); m('F5',Q); m('A5',Q); m('G5',E); m('F5',E);
    m('E5',Q); m('C5',E); m('E5',E); m('D5',Q); m('C5',Q);
    m('B4',Q); m('B4',E); m('C5',E); m('D5',Q); r(Q);
    m('E5',Q); m('C5',Q); m('A4',Q); r(Q);

    return seq;
  }

  var MUSIC_SEQ = buildSequence();

  // Ligne de basse : 8 mesures (cycle complet)
  var BASS_PATTERN = [
    [MN.A2, MN.E3, MN.A3, MN.E3, MN.A2, MN.E3, MN.A3, MN.E3],
    [MN.A2, MN.E3, MN.A3, MN.E3, MN.A2, MN.E3, MN.A3, MN.E3],
    [MN.C3, MN.G3, MN.C3, MN.G3, MN.C3, MN.G3, MN.C3, MN.G3],
    [MN.C3, MN.G3, MN.C3, MN.G3, MN.C3, MN.G3, MN.C3, MN.G3],
    [MN.G3, MN.D3, MN.G3, MN.D3, MN.G3, MN.D3, MN.G3, MN.D3],
    [MN.G3, MN.D3, MN.G3, MN.D3, MN.G3, MN.D3, MN.G3, MN.D3],
    [MN.E2, MN.B2, MN.E3, MN.B2, MN.E2, MN.B2, MN.E3, MN.B2],
    [MN.A2, MN.E3, MN.A3, MN.E3, MN.A2, MN.E3, MN.A3, MN.E3],
  ];

  var LOOKAHEAD   = 0.1;   // secondes : on planifie 100ms à l'avance
  var SCHEDULE_MS = 25;    // ms : cadence du scheduler

  // ─── État interne ─────────────────────────────────────────────
  var state = {
    playing: false,
    interval: null,
    ctx: null,
    schedIdx: 0,
    schedTime: 0,
    nextNoteTime: 0,
  };

  /** Récupère l'AudioContext partagé avec STAudio (ou en crée un). */
  function getCtx() {
    // Réutilise STAudio si présent (même AC = pas de conflit)
    if (window.STAudio && typeof window.STAudio.getCtx === "function") {
      return window.STAudio.getCtx();
    }
    if (state.ctx) return state.ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      state.ctx = new AC();
      return state.ctx;
    } catch (_) { return null; }
  }

  /** Lit le setting musique (default ON). */
  function isOn() {
    try {
      var raw = localStorage.getItem("st_settings");
      if (!raw) return true;
      var s = JSON.parse(raw);
      return s && s.music !== false;
    } catch (_) { return true; }
  }

  /** Bascule + persist le setting. */
  function toggle(on) {
    try {
      var raw = localStorage.getItem("st_settings");
      var s = raw ? JSON.parse(raw) : {};
      s.music = !!on;
      localStorage.setItem("st_settings", JSON.stringify(s));
    } catch (_) {}
    if (on) start();
    else stop();
  }

  // ─── Synthèse : note mélodie / drum ───────────────────────────
  function note(freq, type, vol, when, dur) {
    var c = getCtx();
    if (!c) return;
    try {
      var o = c.createOscillator();
      var g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type;
      o.frequency.setValueAtTime(freq, when);
      g.gain.setValueAtTime(vol, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.start(when); o.stop(when + dur + 0.01);
    } catch (_) {}
  }

  function drum(type, vol, when) {
    var c = getCtx();
    if (!c) return;
    try {
      if (type === "kick") {
        var o = c.createOscillator();
        var g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = "sine";
        o.frequency.setValueAtTime(150, when);
        o.frequency.exponentialRampToValueAtTime(40, when + 0.07);
        g.gain.setValueAtTime(vol, when);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.1);
        o.start(when); o.stop(when + 0.11);
      } else {
        var sr = c.sampleRate;
        var len = Math.floor(sr * (type === "snare" ? 0.08 : 0.02));
        var buf = c.createBuffer(1, len, sr);
        var d = buf.getChannelData(0);
        for (var i = 0; i < len; i++) {
          d[i] = (Math.random() * 2 - 1) * (1 - i / len) * (type === "snare" ? 0.25 : 0.12);
        }
        var s = c.createBufferSource();
        var g2 = c.createGain();
        s.buffer = buf; s.connect(g2); g2.connect(c.destination);
        g2.gain.setValueAtTime(vol, when);
        s.start(when);
      }
    } catch (_) {}
  }

  // ─── Scheduler ────────────────────────────────────────────────
  function scheduleTick() {
    if (!state.playing) return;
    var c = getCtx();
    if (!c) return;
    var now = c.currentTime;

    while (state.nextNoteTime < now + LOOKAHEAD) {
      var step = MUSIC_SEQ[state.schedIdx];
      // Mélodie : square principal + sine 1 octave au-dessus (brillance)
      if (step.mf > 0) {
        note(step.mf,     "square", 0.07, state.nextNoteTime, step.md * 0.82);
        note(step.mf * 2, "sine",   0.02, state.nextNoteTime, step.md * 0.82);
      }
      // Basse (BASS_PATTERN par bar de 8 croches)
      var beatN = Math.round((state.nextNoteTime - state.schedTime) / M_E);
      var barN = Math.floor(beatN / 8);
      var beatInBar = beatN % 8;
      var bassBar = BASS_PATTERN[barN % BASS_PATTERN.length];
      if (bassBar && beatInBar < 8) {
        note(bassBar[beatInBar], "triangle", 0.11, state.nextNoteTime, M_E * 0.70);
      }
      // Percussion (kick / snare / hat)
      var beatIn4 = Math.round((state.nextNoteTime - state.schedTime) / M_BEAT) % 4;
      var isDownbeat = Math.abs((state.nextNoteTime - state.schedTime) % M_BEAT) < 0.012;
      if (isDownbeat) {
        if (beatIn4 === 0 || beatIn4 === 2) drum("kick",  0.22, state.nextNoteTime);
        if (beatIn4 === 1 || beatIn4 === 3) drum("snare", 0.16, state.nextNoteTime);
        if (beatIn4 === 0)                  drum("kick",  0.13, state.nextNoteTime + M_E * 0.5);
      }
      var isEighth = Math.abs((state.nextNoteTime - state.schedTime) % M_E) < 0.006;
      if (isEighth) drum("hat", 0.07, state.nextNoteTime);

      state.nextNoteTime += step.md;
      state.schedIdx++;

      // Boucle infinie : on revient au début de la séquence
      if (state.schedIdx >= MUSIC_SEQ.length) {
        state.schedIdx = 0;
        state.schedTime = state.nextNoteTime;
      }
    }
  }

  // ─── API publique ─────────────────────────────────────────────
  function start() {
    if (state.playing || !isOn()) return;
    var c = getCtx();
    if (!c) return;
    if (c.state === "suspended" && typeof c.resume === "function") {
      c.resume().catch(function(){});
    }
    state.playing = true;
    state.schedIdx = 0;
    state.schedTime = c.currentTime;
    state.nextNoteTime = c.currentTime + 0.05;
    state.interval = setInterval(scheduleTick, SCHEDULE_MS);
  }

  function stop() {
    state.playing = false;
    if (state.interval) {
      clearInterval(state.interval);
      state.interval = null;
    }
  }

  function isPlaying() { return state.playing; }

  window.STMusic = {
    start: start,
    stop: stop,
    toggle: toggle,
    isOn: isOn,
    isPlaying: isPlaying,
  };
})();
