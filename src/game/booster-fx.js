/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Booster VFX (port FIDÈLE de Tetroid)
   ═══════════════════════════════════════════════════════════════════
   Reproduit les 4 systèmes d'effets visuels Tetroid pour les boosters :

     ⚡ LASER  : flash rouge global + 4 beams horizontaux qui balaient
                 la grille de gauche à droite, puis effacent les lignes
     ☄️ METEOR : 10 météorites qui tombent du haut, 1 par colonne, avec
                 trail orange + shockwave + explosion à l'impact
     ❄️ FREEZE : voile bleu glacé + 4-7 flocons de neige animés +
                 14 cristaux de givre qui poussent depuis les bords
     🧲 MAGNET : 5 vagues violettes concentriques depuis le bas + trails
                 de blocs qui montent

   Chaque système a 3 fonctions :
     spawn{Type}Effects(...)  → enregistre l'effet à dessiner
     update{Type}Effects(dt)  → avance l'animation (1× par frame)
     draw{Type}Effects(ctx)   → dessine sur le canvas

   API : window.STBoosterFX = {
     spawnLaser(rows, cellSize, canvasW),
     spawnMeteorImpact(col, topRow, cellSize),
     spawnFreezeEffects(canvasW, canvasH),
     spawnMagnetWaves(canvasW, canvasH),
     update(dt),
     draw(ctx, canvasW, canvasH),
     clear(),
     hasFreeze() → bool (pour overlay externe synchro freeze)
   }
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  // ─── État interne ────────────────────────────────────────────
  var state = {
    laserFlash: null,       // { alpha, decay }
    laserBeams: [],         // [{ y, row, x, life, maxLife, sweepDone, erased }]
    meteorites: [],         // [{ col, x, y, vy, trail, impacted, cellSize }]
    freezeActive: false,
    freezeFlakes: [],       // flocons de neige
    freezeCrystals: [],     // cristaux de givre sur les bords
    magnetWaves: [],        // [{ r, maxR, life, maxLife, x, y }]
    magnetTrails: [],       // [{ x, y, vy, life, maxLife, color }]
  };

  /* ═══════════════════════════════════════════════════════════════════
     ⚡ LASER VFX
     ═══════════════════════════════════════════════════════════════════ */

  /** Spawn N beams horizontaux (1 par row à effacer) + flash rouge global.
      Les beams balaient le canvas de gauche à droite avant que les lignes
      effacent (gives temps au joueur de voir l'effet). */
  function spawnLaser(rowIndices, cellSize, canvasW) {
    state.laserFlash = { alpha: 0.85, decay: 0.06 };
    rowIndices.forEach(function (row, i) {
      // Delay 80ms entre chaque beam pour effet en cascade
      setTimeout(function () {
        state.laserBeams.push({
          y: row * cellSize + cellSize / 2,
          row: row,
          x: 0,
          life: 520,
          maxLife: 520,
          sweepDone: false,
          erased: false,
          canvasW: canvasW,
        });
      }, i * 80);
    });
  }

  function updateLaser(dt) {
    if (state.laserFlash) {
      state.laserFlash.alpha -= state.laserFlash.decay;
      if (state.laserFlash.alpha <= 0) state.laserFlash = null;
    }
    state.laserBeams = state.laserBeams.filter(function (b) {
      b.life -= dt;
      if (!b.sweepDone) {
        b.x += b.canvasW * 0.055;
        if (b.x >= b.canvasW) b.sweepDone = true;
      }
      return b.life > 0;
    });
  }

  function drawLaser(ctx, canvasW, canvasH) {
    // Flash rouge global plein écran (atténue rapidement)
    if (state.laserFlash && state.laserFlash.alpha > 0) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, state.laserFlash.alpha);
      ctx.fillStyle = "rgba(255,80,80,0.18)";
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.restore();
    }
    // Beams horizontaux
    state.laserBeams.forEach(function (b) {
      var a = b.life / b.maxLife;
      var cx2 = b.sweepDone ? canvasW : b.x;
      ctx.save();
      // Trail rouge sombre (bande 1.2 cell de hauteur)
      ctx.globalAlpha = a * 0.25;
      ctx.fillStyle = "rgba(255,40,40,1)";
      ctx.fillRect(0, b.y - 18, cx2, 36);
      // Beam principal : gradient horizontal rouge → blanc → rouge
      var grd = ctx.createLinearGradient(0, b.y, cx2, b.y);
      grd.addColorStop(0,    "rgba(255,80,80,0)");
      grd.addColorStop(0.1,  "#ff4040");
      grd.addColorStop(0.5,  "#ffffff");
      grd.addColorStop(0.9,  "#ff4040");
      grd.addColorStop(1,    "rgba(255,80,80,0)");
      ctx.globalAlpha = a;
      ctx.shadowColor = "#ff2020"; ctx.shadowBlur = 20;
      ctx.fillStyle = grd;
      ctx.fillRect(0, b.y - 3, cx2, 6);
      // Trait blanc ultra-fin au centre
      ctx.globalAlpha = a * 0.9;
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, b.y - 1, cx2, 2);
      // Étincelles à la pointe du sweep
      if (!b.sweepDone) {
        for (var i = 0; i < 3; i++) {
          var sx = b.x * (0.7 + Math.random() * 0.3);
          var sy = b.y + (Math.random() - 0.5) * 12;
          ctx.globalAlpha = a * Math.random();
          ctx.fillStyle = "#fff";
          ctx.fillRect(sx - 1, sy - 1, 2 + Math.random() * 3, 2);
        }
      }
      ctx.restore();
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     ☄️ METEOR VFX
     ═══════════════════════════════════════════════════════════════════ */

  /** Spawn 1 météore par colonne (10 au total, delay 80ms entre).
      Tombent du haut (y = -cellSize) jusqu'à la ligne d'impact. */
  function spawnMeteor(numCols, cellSize) {
    for (var col = 0; col < numCols; col++) {
      var delay = col * 80;
      (function (c, d) {
        setTimeout(function () {
          state.meteorites.push({
            col: c,
            x: c * cellSize + cellSize / 2,
            y: -cellSize,
            vy: cellSize * 0.45,
            trail: [],
            impacted: false,
            cellSize: cellSize,
          });
        }, d);
      })(col, delay);
    }
  }

  function updateMeteor(dt) {
    state.meteorites = state.meteorites.filter(function (m) {
      if (m.impacted) return false;
      m.trail.push({ x: m.x, y: m.y });
      if (m.trail.length > 22) m.trail.shift();
      m.y += m.vy;
      // Détection d'impact géré côté GameScreen (qui appelle spawnMeteorImpact + retire le météore)
      // Ici on filtre juste les hors-écran (sécurité)
      return m.y < 2000;
    });
  }

  function drawMeteor(ctx) {
    state.meteorites.forEach(function (m) {
      // Trail orange dégradé (22 segments)
      m.trail.forEach(function (t, i) {
        var a = i / m.trail.length;
        ctx.save();
        ctx.globalAlpha = a * 0.6;
        ctx.fillStyle = "#ff6600";
        ctx.shadowColor = "#ff9000"; ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(t.x, t.y, m.cellSize * 0.22 * a, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      // Météore lui-même : boule orange brillante avec halo
      ctx.save();
      ctx.shadowColor = "#ffd23f"; ctx.shadowBlur = 24;
      var grd = ctx.createRadialGradient(m.x - m.cellSize * 0.1, m.y - m.cellSize * 0.1, 1, m.x, m.y, m.cellSize * 0.5);
      grd.addColorStop(0,    "#fff8c0");
      grd.addColorStop(0.4,  "#ffaa20");
      grd.addColorStop(1,    "#ff4400");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.cellSize * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /** Force la fin d'un météore (appelé après applyMeteor par GameScreen). */
  function killAllMeteors() {
    state.meteorites = [];
  }

  /* ═══════════════════════════════════════════════════════════════════
     ❄️ FREEZE VFX
     ═══════════════════════════════════════════════════════════════════ */

  function spawnFreezeEffects(canvasW, canvasH) {
    state.freezeActive = true;
    state.freezeFlakes = [];
    state.freezeCrystals = [];
    // 4 flocons initiaux à des positions aléatoires
    for (var i = 0; i < 4; i++) spawnOneFlake(canvasW, canvasH, true);
    // 14 cristaux : 7 sur le bord gauche, 7 sur le bord droit
    for (var j = 0; j < 14; j++) {
      var side = j < 7 ? 0 : canvasW;
      state.freezeCrystals.push({
        x: side,
        y: (j % 7) * (canvasH / 7) + Math.random() * 20,
        size: 0,
        maxSize: 10 + Math.random() * 16,
        angle: (side === 0 ? 1 : -1) * (0.15 + Math.random() * 0.6),
      });
    }
  }

  function spawnOneFlake(canvasW, canvasH, atRandomY) {
    state.freezeFlakes.push({
      x: Math.random() * canvasW,
      y: atRandomY ? Math.random() * canvasH : -8,
      vy: 0.5 + Math.random() * 1.2,
      vx: (Math.random() - 0.5) * 0.6,
      size: 3 + Math.random() * 6,
      alpha: 0.5 + Math.random() * 0.5,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.04,
      wobble: Math.random() * Math.PI * 2,
      wobbleV: 0.02 + Math.random() * 0.03,
    });
  }

  function setFreezeActive(active) {
    state.freezeActive = !!active;
    if (!active) {
      state.freezeFlakes = [];
      state.freezeCrystals = [];
    }
  }

  function updateFreeze(dt, canvasW, canvasH) {
    if (!state.freezeActive) {
      state.freezeFlakes = [];
      state.freezeCrystals = [];
      return;
    }
    // Spawn occasionnel de nouveaux flocons (max 5 simultanés)
    if (state.freezeFlakes.length < 5 && Math.random() < 0.04) {
      spawnOneFlake(canvasW, canvasH, false);
    }
    state.freezeFlakes = state.freezeFlakes.filter(function (f) {
      f.wobble += f.wobbleV;
      f.x += f.vx + Math.sin(f.wobble) * 0.4;
      f.y += f.vy;
      f.rot += f.rotV;
      return f.y < canvasH + 10;
    });
    // Cristaux poussent jusqu'à maxSize (animation grow-in)
    state.freezeCrystals.forEach(function (c) {
      if (c.size < c.maxSize) c.size += 0.5;
    });
  }

  function drawFreeze(ctx, canvasW, canvasH) {
    if (!state.freezeActive) return;
    ctx.save();
    // Voile bleu glacé en gradient vertical (clair en haut, transparent en bas)
    var ov = ctx.createLinearGradient(0, 0, 0, canvasH);
    ov.addColorStop(0, "rgba(168,240,255,0.12)");
    ov.addColorStop(1, "rgba(100,200,255,0.04)");
    ctx.fillStyle = ov;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Cristaux de givre (lignes étoile-like depuis les bords)
    state.freezeCrystals.forEach(function (c) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      ctx.shadowColor = "#a8f0ff"; ctx.shadowBlur = 10;
      ctx.strokeStyle = "rgba(180,240,255,0.8)";
      ctx.lineWidth = 1.5;
      // Branche principale
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(c.size, 0); ctx.stroke();
      // 4 sous-branches (style flocon de neige)
      [0.45, -0.45, 0.7, -0.7].forEach(function (a) {
        var pos = c.size * (a > 0.5 ? 0.35 : 0.6);
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos + Math.cos(a) * c.size * 0.38, Math.sin(a) * c.size * 0.38);
        ctx.stroke();
      });
      ctx.restore();
    });

    // Flocons de neige (étoiles à 6 branches qui tombent)
    state.freezeFlakes.forEach(function (f) {
      ctx.save();
      ctx.globalAlpha = f.alpha * 0.85;
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.strokeStyle = "#d0f0ff";
      ctx.lineWidth = Math.max(0.8, f.size * 0.14);
      ctx.shadowColor = "#a8f0ff"; ctx.shadowBlur = f.size * 1.2;
      for (var i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, f.size); ctx.stroke();
        var b = f.size * 0.45;
        ctx.beginPath(); ctx.moveTo(0, b); ctx.lineTo( f.size * 0.28, b + f.size * 0.22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, b); ctx.lineTo(-f.size * 0.28, b + f.size * 0.22); ctx.stroke();
      }
      // Centre du flocon (petit point blanc lumineux)
      ctx.fillStyle = "rgba(220,245,255,0.9)";
      ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.arc(0, 0, f.size * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  /* ═══════════════════════════════════════════════════════════════════
     🧲 MAGNET VFX
     ═══════════════════════════════════════════════════════════════════ */

  function spawnMagnetWaves(canvasW, canvasH) {
    // 5 vagues concentriques violettes depuis le bas, delay 120ms entre
    for (var i = 0; i < 5; i++) {
      (function (idx) {
        setTimeout(function () {
          state.magnetWaves.push({
            r: 0,
            maxR: canvasH,
            life: 900,
            maxLife: 900,
            x: canvasW / 2,
            y: canvasH,
          });
        }, idx * 120);
      })(i);
    }
  }

  function spawnMagnetTrail(x, y, color) {
    state.magnetTrails.push({ x: x, y: y, vy: -2, life: 400, maxLife: 400, color: color || "#b020ff" });
  }

  function updateMagnet(dt) {
    state.magnetWaves = state.magnetWaves.filter(function (w) {
      w.r += 4;
      w.life -= dt;
      return w.life > 0;
    });
    state.magnetTrails = state.magnetTrails.filter(function (t) {
      t.y += t.vy;
      t.vy += 0.1;
      t.life -= dt;
      return t.life > 0;
    });
  }

  function drawMagnet(ctx) {
    // Vagues : demi-cercles violets qui s'étendent depuis le bas
    state.magnetWaves.forEach(function (w) {
      var a = (w.life / w.maxLife) * 0.35;
      ctx.save();
      ctx.strokeStyle = "rgba(180,60,255," + a + ")";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#aa30ff"; ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, Math.PI, 0);  // demi-cercle haut (Math.PI à 0)
      ctx.stroke();
      ctx.restore();
    });
    // Trails : petits blocs colorés qui montent
    state.magnetTrails.forEach(function (t) {
      var a = t.life / t.maxLife;
      ctx.save();
      ctx.globalAlpha = a * 0.7;
      ctx.fillStyle = t.color;
      ctx.shadowColor = "#aa30ff"; ctx.shadowBlur = 8;
      ctx.fillRect(t.x - 2, t.y - 4, 4, 8);
      ctx.restore();
    });
  }

  /* ═══════════════════════════════════════════════════════════════════
     API publique
     ═══════════════════════════════════════════════════════════════════ */

  function update(dt, canvasW, canvasH) {
    updateLaser(dt);
    updateMeteor(dt);
    updateFreeze(dt, canvasW || 400, canvasH || 800);
    updateMagnet(dt);
  }

  function draw(ctx, canvasW, canvasH) {
    if (!ctx) return;
    drawLaser(ctx, canvasW, canvasH);
    drawMeteor(ctx);
    drawFreeze(ctx, canvasW, canvasH);
    drawMagnet(ctx);
  }

  function clear() {
    state.laserFlash = null;
    state.laserBeams = [];
    state.meteorites = [];
    state.freezeActive = false;
    state.freezeFlakes = [];
    state.freezeCrystals = [];
    state.magnetWaves = [];
    state.magnetTrails = [];
  }

  function hasFreeze() { return state.freezeActive; }

  window.STBoosterFX = {
    spawnLaser:           spawnLaser,
    spawnMeteor:          spawnMeteor,
    killAllMeteors:       killAllMeteors,
    spawnFreezeEffects:   spawnFreezeEffects,
    setFreezeActive:      setFreezeActive,
    spawnMagnetWaves:     spawnMagnetWaves,
    spawnMagnetTrail:     spawnMagnetTrail,
    update:               update,
    draw:                 draw,
    clear:                clear,
    hasFreeze:            hasFreeze,
  };
})();
