/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Boosters logic v2 (port FIDÈLE de Tetroid)
   ═══════════════════════════════════════════════════════════════════
   Reproduction exacte des mécaniques Tetroid (tetroid-pro/js/boosters.js)
   adaptées à notre architecture pure-functions.

   ❄️ FREEZE  (15s)
     → suspend la gravité (G.freezeUntil = now + 15000)

   ⚡ LASER   (jusqu'à 4 lignes !)
     → trouve les 4 lignes les plus basses NON VIDES
     → les efface complètement
     → APPLIQUE LA GRAVITÉ pour faire tomber les blocs au-dessus
     → score : +12 par cellule effacée

   ☄️ METEOR  (1 météore par colonne = 10 impacts !)
     → pour chaque colonne (gauche → droite avec delay 80ms)
       * détruit 3 cellules verticales depuis le top de la pile
       * applique gravité dans cette colonne (compresse vers le bas)
     → score : +15 par cellule détruite

   🧲 MAGNET (gravité totale)
     → applique gravity par PASSES successives jusqu'à stabilité
     → entre chaque passe : clear des lignes pleines créées
     → score : +8 par brique déplacée

   API :
     applyFreeze(G) → G
     applyLaser(G)  → { grid, lines: [indices], cells: int }
     applyMeteor(G) → { grid, columns: [{col, hits: int}] }
     applyMagnet(G) → { grid, cellsMoved: int, linesCleared: int }
     applyGravity(grid) → { grid, moved: int }   (helper utility)
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  // ─── Configuration ────────────────────────────────────────────
  var COOLDOWNS = { freeze: 5000, laser: 5000, meteor: 5000, magnet: 8000 };
  var DURATIONS = { freeze: 15000 };
  var LASER_MAX_LINES = 4;
  var METEOR_DEPTH = 3;
  var SCORE = { laser: 12, meteor: 15, magnet: 8 };

  /** Helper interne : clone profond d'une grille. */
  function cloneGrid(grid) {
    var g = new Array(grid.length);
    for (var r = 0; r < grid.length; r++) g[r] = grid[r].slice();
    return g;
  }

  /**
   * ─── GRAVITY (fondamental) ────────────────────────────────────
   * Applique la gravité à la grille : tout bloc qui a une cellule
   * vide en dessous descend d'une rangée. Multi-passes jusqu'à
   * stabilité. Retourne le nb total de cellules déplacées.
   */
  function applyGravity(grid) {
    var rows = grid.length;
    var cols = (grid[0] || []).length;
    var totalMoved = 0;
    var changed = true;
    var safety = 0;

    while (changed && safety < rows * 2) {
      changed = false;
      // De bas en haut : on bouge un bloc d'1 case si la case du dessous est vide
      for (var r = rows - 2; r >= 0; r--) {
        for (var c = 0; c < cols; c++) {
          if (grid[r][c] && !grid[r + 1][c]) {
            grid[r + 1][c] = grid[r][c];
            grid[r][c] = 0;
            changed = true;
            totalMoved++;
          }
        }
      }
      safety++;
    }
    return totalMoved;
  }

  /**
   * ─── CLEAR LINES (silent) ─────────────────────────────────────
   * Retire les lignes pleines + décale le reste vers le bas.
   * Retourne le nb de lignes effacées.
   * Note : on a aussi STCore.clearLines() mais ici version "silent"
   * (sans gestion combo/scoring) pour être appelé après gravity.
   */
  function clearLinesSilent(grid) {
    var rows = grid.length;
    var cols = (grid[0] || []).length;
    var newRows = [];
    var clearedCount = 0;
    for (var r = 0; r < rows; r++) {
      var full = true;
      for (var c = 0; c < cols; c++) { if (!grid[r][c]) { full = false; break; } }
      if (full) clearedCount++;
      else      newRows.push(grid[r].slice());
    }
    while (newRows.length < rows) newRows.unshift(new Array(cols).fill(0));
    // copie back dans la même référence
    for (var rr = 0; rr < rows; rr++) grid[rr] = newRows[rr];
    return clearedCount;
  }

  /**
   * ❄️ FREEZE — suspend la gravité 15s.
   */
  function applyFreeze(G) {
    if (!G) return G;
    G.freezeUntil = Date.now() + DURATIONS.freeze;
    return G;
  }
  function isFrozen(G) {
    return !!(G && G.freezeUntil && Date.now() < G.freezeUntil);
  }

  /**
   * ⚡ LASER — efface jusqu'à 4 lignes les plus basses + gravity.
   * Retourne { grid, lines: indices effacés, cells: nb cellules effacées }.
   */
  function applyLaser(G) {
    if (!G || !G.grid) return { grid: G && G.grid, lines: [], cells: 0 };
    var grid = cloneGrid(G.grid);
    var rows = grid.length;
    var cols = (grid[0] || []).length;

    // Chercher les LASER_MAX_LINES lignes les plus basses NON vides
    var targets = [];
    for (var r = rows - 1; r >= 0 && targets.length < LASER_MAX_LINES; r--) {
      for (var c = 0; c < cols; c++) {
        if (grid[r][c]) { targets.push(r); break; }
      }
    }

    var totalCells = 0;
    targets.forEach(function (row) {
      for (var x = 0; x < cols; x++) {
        if (grid[row][x]) totalCells++;
        grid[row][x] = 0;
      }
    });

    // GRAVITY après clear (sinon les blocs au-dessus restent suspendus !)
    applyGravity(grid);

    G.grid = grid;
    G.score = (G.score || 0) + totalCells * SCORE.laser;
    return { grid: grid, lines: targets, cells: totalCells };
  }

  /**
   * ☄️ METEOR — 1 météore par colonne, détruit 3 cellules vert. + gravity.
   * Retourne { grid, columns: [{col, hits}], totalCells }.
   */
  function applyMeteor(G) {
    if (!G || !G.grid) return { grid: G && G.grid, columns: [], totalCells: 0 };
    var grid = cloneGrid(G.grid);
    var rows = grid.length;
    var cols = (grid[0] || []).length;
    var columns = [];
    var totalCells = 0;

    for (var c = 0; c < cols; c++) {
      // Trouve le top de la pile dans cette colonne
      var topRow = -1;
      for (var r = 0; r < rows; r++) {
        if (grid[r][c]) { topRow = r; break; }
      }
      if (topRow < 0) {
        columns.push({ col: c, hits: 0, topRow: -1 });
        continue;
      }
      // Détruit jusqu'à METEOR_DEPTH cellules vers le bas
      var hits = 0;
      for (var dr = 0; dr < METEOR_DEPTH; dr++) {
        var rr = topRow + dr;
        if (rr < rows && grid[rr][c]) {
          grid[rr][c] = 0;
          hits++;
          totalCells++;
        }
      }
      columns.push({ col: c, hits: hits, topRow: topRow });
    }

    // GRAVITY pour compresser les colonnes vers le bas
    applyGravity(grid);

    G.grid = grid;
    G.score = (G.score || 0) + totalCells * SCORE.meteor;
    return { grid: grid, columns: columns, totalCells: totalCells };
  }

  /**
   * 🧲 MAGNET — gravity multi-passes + clear lignes pleines.
   * Retourne { grid, cellsMoved, linesCleared }.
   */
  function applyMagnet(G) {
    if (!G || !G.grid) return { grid: G && G.grid, cellsMoved: 0, linesCleared: 0 };
    var grid = cloneGrid(G.grid);

    var moved = applyGravity(grid);
    var linesCleared = clearLinesSilent(grid);
    // Si lignes effacées → reapply gravity (cascade possible)
    if (linesCleared > 0) {
      moved += applyGravity(grid);
      linesCleared += clearLinesSilent(grid);
    }

    G.grid = grid;
    G.score = (G.score || 0) + moved * SCORE.magnet;
    return { grid: grid, cellsMoved: moved, linesCleared: linesCleared };
  }

  /**
   * Helper : pixel center d'une cellule (col, row) selon cellSize.
   */
  function cellCenterPx(col, row, cellSize) {
    return {
      x: col * cellSize + cellSize / 2,
      y: row * cellSize + cellSize / 2,
    };
  }

  window.STBoosters = {
    COOLDOWNS: COOLDOWNS,
    DURATIONS: DURATIONS,
    LASER_MAX_LINES: LASER_MAX_LINES,
    METEOR_DEPTH: METEOR_DEPTH,
    applyFreeze: applyFreeze,
    isFrozen: isFrozen,
    applyLaser: applyLaser,
    applyMeteor: applyMeteor,
    applyMagnet: applyMagnet,
    applyGravity: applyGravity,
    cellCenterPx: cellCenterPx,
  };
})();
