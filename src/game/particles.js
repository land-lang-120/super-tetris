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
    voxels: [], // Voxels 3D (briques qui se brisent comme dans la vidéo de référence)
  };

  /**
   * Fait voler en éclats 3D les cellules détruites d'une ou plusieurs lignes.
   * Reproduit fidèlement la désintégration en micro-cubes de la vidéo Block Crush !
   * @param {Array<{x: number, y: number, color: string}>} cells
   * @param {number} cellSize
   */
  function addBrickShatter(cells, cellSize) {
    if (!cells || !cells.length) return;
    var cs = cellSize || 30;
    var subCount = 3; // Chaque bloc éclate en 3x3 = 9 micro-voxels 3D
    var subSize = (cs / subCount) * 1.15;

    cells.forEach(function (c) {
      var col = c.color || "#00d4e0";
      for (var sx = 0; sx < subCount; sx++) {
        for (var sy = 0; sy < subCount; sy++) {
          var px = c.x + (sx + 0.5) * (cs / subCount);
          var py = c.y + (sy + 0.5) * (cs / subCount);

          var angle = Math.atan2(sy - 1, sx - 1) + (Math.random() - 0.5) * 0.8;
          var speed = 2.0 + Math.random() * 5.5;

          state.voxels.push({
            x: px,
            y: py,
            z: 0.85 + Math.random() * 0.45,
            vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2.5,
            vy: -2.0 - Math.random() * 4.5, // Éjection initiale vers le haut
            vz: (Math.random() - 0.5) * 0.4,
            rotZ: Math.random() * Math.PI * 2,
            vRotZ: (Math.random() - 0.5) * 0.35,
            size: subSize,
            color: col,
            life: 0.9 + Math.random() * 0.4,
            maxLife: 1.3,
          });
        }
      }

      // Éclats lumineux / poussière de débris
      for (var s = 0; s < 3; s++) {
        var spA = Math.random() * Math.PI * 2;
        var spS = 3 + Math.random() * 6;
        state.embers.push({
          x: c.x + cs * 0.5,
          y: c.y + cs * 0.5,
          vx: Math.cos(spA) * spS,
          vy: Math.sin(spA) * spS - 2,
          size: 2 + Math.random() * 3,
          color: col,
          life: 400 + Math.random() * 300,
          maxLife: 700,
        });
      }
    });
  }

  /** Ajoute des particules quand des lignes sont effacées (24/ligne). */
  function addLineClearBurst(canvasW, canvasH, lineCount) {
    var n = (lineCount || 1) * 20;
    for (var i = 0; i < n; i++) {
      state.particles.push({
        x: Math.random() * canvasW,
        y: Math.random() * canvasH * 0.7 + canvasH * 0.15,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 500 + Math.random() * 400,
        maxLife: 900,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        size: 3 + Math.random() * 4,
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
    var dtSec = Math.min(0.05, (dt || 16) / 1000);
    var g = 0.2; // gravité basique

    // Particules 2D standards
    state.particles = state.particles.filter(function (p) {
      p.x += p.vx; p.y += p.vy; p.vy += g; p.life -= dt;
      return p.life > 0;
    });

    // Voxels 3D (Briques éclatées)
    state.voxels = state.voxels.filter(function (v) {
      v.x += v.vx * dtSec * 60;
      v.y += v.vy * dtSec * 60;
      v.z += v.vz * dtSec * 60;
      v.vy += 0.55 * dtSec * 60; // Gravité constante et vive
      v.rotZ += v.vRotZ * dtSec * 60;
      v.life -= dtSec * 1.5;
      return v.life > 0;
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

  /** Dessine toutes les particules et voxels 3D sur le canvas. */
  function draw(ctx) {
    if (!ctx) return;

    // 1) Dessin des Voxels 3D de briques brisées (avec biseau spéculaire et tumbling)
    state.voxels.forEach(function (v) {
      var sz = v.size * Math.max(0.2, v.z) * Math.min(1.0, v.life * 1.25);
      var hsz = sz * 0.5;
      var alpha = Math.min(1, v.life * 1.4);

      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.rotate(v.rotZ);
      ctx.globalAlpha = alpha;

      // Ombre portée du voxel
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(-hsz + 2, -hsz + 2, sz, sz);

      // Base couleur du bloc d'origine
      ctx.fillStyle = v.color;
      ctx.fillRect(-hsz, -hsz, sz, sz);

      // Reflet 3D diagonal bombé
      var vg = ctx.createLinearGradient(-hsz, -hsz, hsz, hsz);
      vg.addColorStop(0, "rgba(255, 255, 255, 0.75)");
      vg.addColorStop(0.4, "rgba(255, 255, 255, 0.05)");
      vg.addColorStop(1, "rgba(0, 0, 0, 0.55)");
      ctx.fillStyle = vg;
      ctx.fillRect(-hsz, -hsz, sz, sz);

      // Reflet supérieur vitré
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.fillRect(-hsz + 1, -hsz + 1, sz - 2, sz * 0.35);

      // Biseau fin lumineux
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 1;
      ctx.strokeRect(-hsz + 0.5, -hsz + 0.5, sz - 1, sz - 1);

      ctx.restore();
    });

    // 2) Particules basiques (carrés colorés)
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

    // 3) Shockwaves (anneaux)
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

    // 4) Embers (braises et étincelles)
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
    state.voxels = [];
  }

  function count() {
    return state.particles.length + state.shockwaves.length + state.embers.length + state.voxels.length;
  }

  window.STParticles = {
    addBrickShatter: addBrickShatter,
    addLineClearBurst: addLineClearBurst,
    addExplosion: addExplosion,
    addShockwave: addShockwave,
    update: update,
    draw: draw,
    clear: clear,
    count: count,
  };
})();
