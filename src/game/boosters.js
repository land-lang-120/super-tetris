/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Boosters logic (4 boosters jouables)
   ═══════════════════════════════════════════════════════════════════
   Logique fonctionnelle des 4 boosters consommables. Toutes les
   fonctions PRENNENT et RETOURNENT un nouveau game state (immutables
   pour faciliter intégration React + undo éventuel).

   Boosters :
     ❄️ FREEZE  : suspend la gravité pendant 15000ms (15s)
                  → met G.freezeUntil = now + 15000
                  → le tick gameLoop respecte ce flag (gravité = 0)

     ⚡ LASER   : détruit la ligne la plus basse non vide
                  → trouve la ligne, la vide, ne la décale pas (juste vide)
                  → ajoute particles + sound + haptic

     ☄️ METEOR  : détruit 5 cellules aléatoires non vides
                  → choisit 5 positions occupées au hasard
                  → particles d'impact à chacune
                  → shockwave central

     🧲 MAGNET  : attire les blocs vers le bas (gravity sweep)
                  → pour chaque colonne, fait tomber les blocs en haut
                  → ferme les "trous" laissés par des poses imparfaites
                  → gros bonus stratégique pour rétablir une situation
                    catastrophique

   Cooldowns par défaut : 5s entre 2 utilisations du même booster.

   Constantes exposées : COOLDOWNS, DURATIONS
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  // ─── Configuration ────────────────────────────────────────────
  var COOLDOWNS = {
    freeze: 5000,
    laser:  5000,
    meteor: 5000,
    magnet: 8000,
  };

  var DURATIONS = {
    freeze: 15000,  // ms d'immobilisation gravité (15s)
  };

  /**
   * FREEZE — suspend la gravité pendant DURATIONS.freeze ms.
   * Mute G.freezeUntil. Le game loop check ce flag.
   */
  function applyFreeze(G) {
    if (!G) return G;
    var now = Date.now();
    G.freezeUntil = now + DURATIONS.freeze;
    return G;
  }

  /** Renvoie true si la gravité doit être suspendue MAINTENANT. */
  function isFrozen(G) {
    if (!G || !G.freezeUntil) return false;
    return Date.now() < G.freezeUntil;
  }

  /**
   * LASER — détruit la ligne la plus basse occupée (vidée, pas supprimée).
   * Retourne { grid, line: index }. Si pas de ligne, line = -1.
   */
  function applyLaser(G) {
    if (!G || !G.grid) return { grid: G && G.grid, line: -1 };
    var grid = window.STCore.cloneGrid(G.grid);
    var rows = grid.length;
    var cols = (grid[0] || []).length;

    // Cherche la ligne la plus basse avec au moins une cellule
    var targetLine = -1;
    for (var r = rows - 1; r >= 0; r--) {
      var hasCell = false;
      for (var c = 0; c < cols; c++) {
        if (grid[r][c]) { hasCell = true; break; }
      }
      if (hasCell) { targetLine = r; break; }
    }

    if (targetLine >= 0) {
      for (var x = 0; x < cols; x++) grid[targetLine][x] = 0;
      G.grid = grid;
    }
    return { grid: G.grid, line: targetLine };
  }

  /**
   * METEOR — détruit 5 cellules aléatoires occupées.
   * Retourne { grid, cells: [{x,y}] }.
   */
  function applyMeteor(G, count) {
    count = count || 5;
    if (!G || !G.grid) return { grid: G && G.grid, cells: [] };
    var grid = window.STCore.cloneGrid(G.grid);
    var rows = grid.length;
    var cols = (grid[0] || []).length;

    // Récupère toutes les cellules occupées
    var occupied = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (grid[r][c]) occupied.push({ x: c, y: r });
      }
    }
    if (occupied.length === 0) return { grid: G.grid, cells: [] };

    // Shuffle Fisher-Yates et prend les `count` premières
    for (var i = occupied.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = occupied[i]; occupied[i] = occupied[j]; occupied[j] = tmp;
    }
    var hits = occupied.slice(0, Math.min(count, occupied.length));
    hits.forEach(function (cell) {
      grid[cell.y][cell.x] = 0;
    });
    G.grid = grid;
    return { grid: G.grid, cells: hits };
  }

  /**
   * MAGNET — fait tomber tous les blocs vers le bas, colonne par colonne,
   * pour combler les trous. Très utile sur des grids "gruyère".
   * Retourne { grid, cellsMoved }.
   */
  function applyMagnet(G) {
    if (!G || !G.grid) return { grid: G && G.grid, cellsMoved: 0 };
    var grid = window.STCore.cloneGrid(G.grid);
    var rows = grid.length;
    var cols = (grid[0] || []).length;
    var moved = 0;

    for (var c = 0; c < cols; c++) {
      // Récupère toutes les cellules non vides de cette colonne, en partant du bas
      var stack = [];
      for (var r = rows - 1; r >= 0; r--) {
        if (grid[r][c]) {
          stack.push(grid[r][c]);
          grid[r][c] = 0;
        }
      }
      // Réécrit en partant du bas
      for (var k = 0; k < stack.length; k++) {
        var newR = rows - 1 - k;
        var oldVal = grid[newR][c];
        if (!oldVal) moved++;
        grid[newR][c] = stack[k];
      }
    }
    G.grid = grid;
    return { grid: G.grid, cellsMoved: moved };
  }

  /**
   * Centre approximatif (pixels) d'une cellule (col,row) selon cellSize.
   * Utilisé pour positionner particles/shockwaves au bon endroit du canvas.
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
    applyFreeze: applyFreeze,
    isFrozen: isFrozen,
    applyLaser: applyLaser,
    applyMeteor: applyMeteor,
    applyMagnet: applyMagnet,
    cellCenterPx: cellCenterPx,
  };
})();
