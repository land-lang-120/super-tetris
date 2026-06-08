/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Particles system
   ═══════════════════════════════════════════════════════════════════
   Système d'effets visuels :
     - Particules au clear de ligne (24-96 particules color-mix)
     - Explosion burst (40 particules à un point)
     - Shockwaves (anneaux) pour les meteor boosters
     - Embers (braises) qui flottent au booster meteor

   État partagé via une Singleton STParticles. Le rendu canvas est
   géré dans render.js (fonction drawOverlay) qui appelle drawXxx ici.

   Update(dt) avancement temporel + filtre des particules mortes.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  // Couleurs des pièces pour les particules colorées
  var PARTICLE_COLORS = ["#00d4e0", "#ffd23f", "#a855f7", "#22c55e", "#ef4444", "#2563eb", "#f97316"];

  // État interne (mutable)
  var state = {
    particles: [],
    shockwaves: [],
    embers: [],
  };

  /** Ajoute des particules quand des lignes sont effacées (24/ligne). */
  function addLineClearBurst(canvasW, canvasH, lineCount) {
    var n = (lineCount || 1) * 24;
    for (var i = 0; i < n; i++) {
      state.particles.push({
        x: Math.random() * canvasW,
        y: Math.random() * canvasH * 0.7 + canvasH * 0.15,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 700 + Math.random() * 500,
        maxLife: 1200,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        size: 3 + Math.random() * 5,
      });
    }
  }

  /** Explosion ponctuelle (booster meteor / impact). */
  function addExplosion(x, y, color) {
    var col = color || PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    for (var i = 0; i < 40; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 3 + Math.random() * 10;
      state.particles.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 500 + Math.random() * 500,
        maxLife: 1000,
        color: col,
        size: 2 + Math.random() * 5,
      });
    }
  }

  /** Anneau d'onde de choc (visualise un boost laser/meteor). */
  function addShockwave(x, y) {
    state.shockwaves.push({ x: x, y: y, r: 0, life: 500, maxLife: 500 });
    for (var i = 0; i < 8; i++) {
      var a = -Math.PI + Math.random() * Math.PI;
      var sp = 3 + Math.random() * 7;
      state.embers.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 4,
        life: 600 + Math.random() * 400,
        maxLife: 1000,
        size: 2 + Math.random() * 4,
        color: "#ffd740",
      });
    }
  }

  /** Update tous les systèmes (appelé chaque frame). */
  function update(dt) {
    var g = 0.2; // gravité
    state.particles = state.particles.filter(function (p) {
      p.x += p.vx; p.y += p.vy; p.vy += g; p.life -= dt;
      return p.life > 0;
    });
    state.shockwaves = state.shockwaves.filter(function (s) {
      s.r += 6; s.life -= dt;
      return s.life > 0;
    });
    state.embers = state.embers.filter(function (e) {
      e.x += e.vx; e.y += e.vy; e.vy += 0.15; e.life -= dt;
      return e.life > 0;
    });
  }

  /** Dessine toutes les particules sur le contexte canvas. */
  function draw(ctx) {
    if (!ctx) return;
    // Particules basiques (carrés colorés)
    state.particles.forEach(function (p) {
      var a = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    });

    // Shockwaves (anneaux)
    state.shockwaves.forEach(function (s) {
      var a = s.life / s.maxLife;
      ctx.save();
      ctx.strokeStyle = "rgba(255," + Math.floor(180 * a) + ",0," + (a * 0.8) + ")";
      ctx.lineWidth = 3 * a;
      ctx.shadowColor = "#ff8c00";
      ctx.shadowBlur = 20 * a;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
      if (s.r > 4) {
        ctx.strokeStyle = "rgba(255,255,255," + (a * 0.5) + ")";
        ctx.lineWidth = 1.5 * a;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Embers (braises)
    state.embers.forEach(function (e) {
      var a = e.life / e.maxLife;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /** Reset complet (à appeler entre 2 parties). */
  function clear() {
    state.particles = [];
    state.shockwaves = [];
    state.embers = [];
  }

  function count() {
    return state.particles.length + state.shockwaves.length + state.embers.length;
  }

  window.STParticles = {
    addLineClearBurst: addLineClearBurst,
    addExplosion: addExplosion,
    addShockwave: addShockwave,
    update: update,
    draw: draw,
    clear: clear,
    count: count,
  };
})();
