/* Super Tetris — bundle.js (auto-generated, do not edit by hand) */


/* ─────────────────────────────────────────────────────────── */

/* === src/game/pieces.js === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Pieces & SRS rotation system
   ═══════════════════════════════════════════════════════════════════
   Définit les 7 pièces standard Tetris avec :
     - Forme initiale (matrice 4x4 ou 3x3)
     - 4 rotations (0°, 90°, 180°, 270°)
     - Couleur canonique (var CSS référencée par render.js)
     - Wall-kick offsets (Super Rotation System / SRS officiel)

   Référence SRS : https://tetris.wiki/Super_Rotation_System
   On suit la convention "JLSTZ" (4 wall-kicks par rotation) +
   "I" (4 wall-kicks différents) car la pièce I a sa propre table.

   Exporte (façon namespace, vu qu'on est en script global Babel-compiled,
   pas en ES modules) :
     window.STPieces = {
       PIECES, getRotation, getWallKicks, randomColor
     }
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  // Chaque pièce est un tableau de 4 rotations (état 0,1,2,3).
  // Chaque rotation est une matrice carrée (1=cell, 0=empty).
  // Origine relative: (0,0) en haut-gauche de la matrice.
  // L'algo de spawn place la pièce centrée horizontalement sur la grille (col 3 ou 4).

  var PIECES = {
    I: {
      color: "var(--piece-i)",
      colorHex: "#00d4e0",
      // 4x4 — la pièce I a sa propre rotation (ne tourne pas autour d'un centre)
      rotations: [[[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]], [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]], [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]]]
    },
    O: {
      color: "var(--piece-o)",
      colorHex: "#ffd23f",
      // 2x2 — la pièce O ne tourne pas (4 rotations identiques)
      rotations: [[[1, 1], [1, 1]], [[1, 1], [1, 1]], [[1, 1], [1, 1]], [[1, 1], [1, 1]]]
    },
    T: {
      color: "var(--piece-t)",
      colorHex: "#a855f7",
      rotations: [[[0, 1, 0], [1, 1, 1], [0, 0, 0]], [[0, 1, 0], [0, 1, 1], [0, 1, 0]], [[0, 0, 0], [1, 1, 1], [0, 1, 0]], [[0, 1, 0], [1, 1, 0], [0, 1, 0]]]
    },
    S: {
      color: "var(--piece-s)",
      colorHex: "#22c55e",
      rotations: [[[0, 1, 1], [1, 1, 0], [0, 0, 0]], [[0, 1, 0], [0, 1, 1], [0, 0, 1]], [[0, 0, 0], [0, 1, 1], [1, 1, 0]], [[1, 0, 0], [1, 1, 0], [0, 1, 0]]]
    },
    Z: {
      color: "var(--piece-z)",
      colorHex: "#ef4444",
      rotations: [[[1, 1, 0], [0, 1, 1], [0, 0, 0]], [[0, 0, 1], [0, 1, 1], [0, 1, 0]], [[0, 0, 0], [1, 1, 0], [0, 1, 1]], [[0, 1, 0], [1, 1, 0], [1, 0, 0]]]
    },
    J: {
      color: "var(--piece-j)",
      colorHex: "#2563eb",
      rotations: [[[1, 0, 0], [1, 1, 1], [0, 0, 0]], [[0, 1, 1], [0, 1, 0], [0, 1, 0]], [[0, 0, 0], [1, 1, 1], [0, 0, 1]], [[0, 1, 0], [0, 1, 0], [1, 1, 0]]]
    },
    L: {
      color: "var(--piece-l)",
      colorHex: "#f97316",
      rotations: [[[0, 0, 1], [1, 1, 1], [0, 0, 0]], [[0, 1, 0], [0, 1, 0], [0, 1, 1]], [[0, 0, 0], [1, 1, 1], [1, 0, 0]], [[1, 1, 0], [0, 1, 0], [0, 1, 0]]]
    }
  };

  // ─── Wall-kicks SRS — JLSTZ (les 5 pièces non-I, non-O) ──────────
  // Pour chaque rotation src->dst, 5 offsets à essayer dans l'ordre.
  // Si aucun ne convient → rotation refusée.
  // Format: [[dx, dy], ...]  (dx = column shift, dy = row shift, négatif = vers le haut)
  var KICKS_JLSTZ = {
    "0->1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "1->0": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "1->2": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "2->1": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "2->3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    "3->2": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "3->0": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "0->3": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
  };

  // ─── Wall-kicks SRS — I (pièce I a sa propre table) ──────────────
  var KICKS_I = {
    "0->1": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    "1->0": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    "1->2": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    "2->1": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    "2->3": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    "3->2": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    "3->0": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    "0->3": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
  };

  /**
   * Retourne la matrice de la pièce pour la rotation donnée.
   * Optional chaining défensif si nom invalide.
   */
  function getRotation(pieceName, rot) {
    var p = PIECES[pieceName];
    if (!p) return null;
    var safeRot = (rot % 4 + 4) % 4; // gère les rotations négatives
    return p.rotations[safeRot] || null;
  }

  /**
   * Retourne la liste des wall-kicks à essayer pour passer
   * de la rotation `fromRot` à `toRot` pour la pièce donnée.
   * @returns Array<[dx,dy]>
   */
  function getWallKicks(pieceName, fromRot, toRot) {
    if (pieceName === "O") return [[0, 0]]; // O ne tourne pas
    var f = (fromRot % 4 + 4) % 4;
    var t = (toRot % 4 + 4) % 4;
    var key = f + "->" + t;
    var table = pieceName === "I" ? KICKS_I : KICKS_JLSTZ;
    return table[key] || [[0, 0]];
  }

  /** Retourne la couleur hex d'une pièce (pour le canvas). */
  function colorOf(pieceName) {
    var p = PIECES[pieceName];
    return p ? p.colorHex : "#888";
  }

  // Export global (script style, pas ES module)
  window.STPieces = {
    PIECES: PIECES,
    PIECE_NAMES: ["I", "O", "T", "S", "Z", "J", "L"],
    getRotation: getRotation,
    getWallKicks: getWallKicks,
    colorOf: colorOf
  };
})();

/* ─────────────────────────────────────────────────────────── */

/* === src/game/bag.js === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Bag system (génération random "fair")
   ═══════════════════════════════════════════════════════════════════
   Système officiel Tetris : à chaque cycle de 7 pièces, chaque pièce
   apparaît exactement 1×. Plus juste que random pur (qui peut donner
   3× I d'affilée ou aucune T pendant 14 pièces).

   Algorithme :
     - Maintenir un "sac" (Array) initialisé avec les 7 noms de pièces
     - Mélanger (Fisher-Yates)
     - À chaque demande de pièce, pop la dernière
     - Quand le sac est vide → en créer un nouveau (re-shuffle)

   On expose 2 fonctions principales :
     - createBag()        : crée un nouveau sac mélangé
     - drawNext(state)    : tire la prochaine pièce + alimente la queue

   La queue (S.queue) est maintenue à au moins 5 pièces pour permettre
   au joueur de voir 5 pièces à venir (HUD).
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  var PIECE_NAMES = ["I", "O", "T", "S", "Z", "J", "L"];

  /** Fisher-Yates shuffle in-place. */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }
  function createBag() {
    return shuffle(PIECE_NAMES.slice());
  }

  /**
   * Initialise la queue avec au moins 5 pièces visibles.
   * @returns Array<string> queue (de gauche à droite : [next, next+1, ...])
   */
  function initQueue() {
    var q = [];
    while (q.length < 7) {
      q = q.concat(createBag());
    }
    return q;
  }

  /**
   * Tire la prochaine pièce et alimente la queue si nécessaire.
   * @param state.queue Array<string> (sera muté)
   * @returns string nom de la pièce tirée
   */
  function drawNext(state) {
    if (!state || !Array.isArray(state.queue)) {
      // fallback défensif : on initialise au cas où
      state.queue = initQueue();
    }
    if (state.queue.length < 5) {
      state.queue = state.queue.concat(createBag());
    }
    return state.queue.shift();
  }

  /** Retourne les N prochaines pièces sans les retirer de la queue. */
  function peekQueue(state, n) {
    if (!state || !Array.isArray(state.queue)) return [];
    var count = Math.max(1, Math.min(7, n || 5));
    return state.queue.slice(0, count);
  }
  window.STBag = {
    createBag: createBag,
    initQueue: initQueue,
    drawNext: drawNext,
    peekQueue: peekQueue
  };
})();

/* ─────────────────────────────────────────────────────────── */

/* === src/game/core.js === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Core mechanics
   ═══════════════════════════════════════════════════════════════════
   Fonctions PURES (pas de side effects sur le DOM, pas de RAF).
   Toutes les opérations qui modifient l'état du jeu sont ici :

     - createGrid(rows, cols)        : nouvelle grille vide
     - cloneGrid(grid)               : deep clone (avant mutation)
     - collide(grid, piece, ox, oy)  : test de collision
     - lock(grid, piece, ox, oy)     : pose la pièce dans la grille
     - clearLines(grid)              : retire les lignes pleines, retourne {newGrid, count}
     - rotatePiece(piece, dir)       : tente une rotation avec wall-kicks SRS
     - dropToBottom(grid, piece)     : retourne le y final pour hard drop / ghost
     - isTSpin(grid, piece, lastMove): détecte si le dernier mouvement est un T-spin
     - isGameOver(grid, newPiece)    : top-out check (collision dès le spawn)

   ⚠️ Aucune fonction ne mute l'argument `grid` directement (sauf lock,
   qui retourne le nouveau grid). Pratique pour React (immutabilité).
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  var ROWS = 20;
  var COLS = 10;

  /** Crée une grille `rows x cols` remplie de 0. */
  function createGrid(rows, cols) {
    rows = rows || ROWS;
    cols = cols || COLS;
    var g = new Array(rows);
    for (var r = 0; r < rows; r++) {
      g[r] = new Array(cols).fill(0);
    }
    return g;
  }

  /** Deep clone d'une grille (pour mutation safe). */
  function cloneGrid(grid) {
    if (!grid) return createGrid();
    var g = new Array(grid.length);
    for (var r = 0; r < grid.length; r++) {
      g[r] = grid[r].slice();
    }
    return g;
  }

  /**
   * Teste si la pièce `piece.name` à la rotation `piece.rot` placée
   * en (ox, oy) entre en collision avec la grille ou les bords.
   * @returns boolean true = collision (placement invalide)
   */
  function collide(grid, piece, ox, oy) {
    var P = window.STPieces;
    if (!P || !piece) return true;
    var matrix = P.getRotation(piece.name, piece.rot);
    if (!matrix) return true;
    var size = matrix.length;
    var rows = grid.length;
    var cols = (grid[0] || []).length;
    for (var dy = 0; dy < size; dy++) {
      for (var dx = 0; dx < size; dx++) {
        if (!matrix[dy][dx]) continue;
        var x = ox + dx;
        var y = oy + dy;
        // bords gauche, droit, bas
        if (x < 0 || x >= cols) return true;
        if (y >= rows) return true;
        // au-dessus du board (-1, -2, ...) → pas de collision (on autorise spawn)
        if (y < 0) continue;
        if (grid[y][x]) return true;
      }
    }
    return false;
  }

  /**
   * Pose la pièce dans la grille (retourne une NOUVELLE grille).
   * Stocke le nom de la pièce (string) dans la cellule pour pouvoir
   * recolorier au rendu.
   */
  function lock(grid, piece, ox, oy) {
    var P = window.STPieces;
    if (!P || !piece) return grid;
    var matrix = P.getRotation(piece.name, piece.rot);
    if (!matrix) return grid;
    var newGrid = cloneGrid(grid);
    for (var dy = 0; dy < matrix.length; dy++) {
      for (var dx = 0; dx < matrix[dy].length; dx++) {
        if (!matrix[dy][dx]) continue;
        var x = ox + dx;
        var y = oy + dy;
        if (y < 0 || y >= newGrid.length) continue;
        if (x < 0 || x >= newGrid[0].length) continue;
        newGrid[y][x] = piece.name; // stocke le nom pour le rendu coloré
      }
    }
    return newGrid;
  }

  /**
   * Retire toutes les lignes pleines.
   * @returns { grid: nouveau grid, count: nb de lignes retirées, lines: indices des lignes retirées }
   */
  function clearLines(grid) {
    if (!grid) return {
      grid: grid,
      count: 0,
      lines: []
    };
    var rows = grid.length;
    var cols = (grid[0] || []).length;
    var newRows = [];
    var clearedIndices = [];
    for (var r = 0; r < rows; r++) {
      var row = grid[r];
      var full = row.every(function (c) {
        return !!c;
      });
      if (full) {
        clearedIndices.push(r);
      } else {
        newRows.push(row.slice());
      }
    }

    // Préfixer avec des lignes vides pour garder la hauteur
    while (newRows.length < rows) {
      newRows.unshift(new Array(cols).fill(0));
    }
    return {
      grid: newRows,
      count: clearedIndices.length,
      lines: clearedIndices
    };
  }

  /**
   * Tente une rotation avec wall-kicks SRS.
   * @param grid    grille actuelle
   * @param piece   { name, rot, x, y }
   * @param dir     +1 = horaire, -1 = anti-horaire
   * @returns {ok, piece, kick} — ok=false si la rotation est refusée
   */
  function rotatePiece(grid, piece, dir) {
    var P = window.STPieces;
    if (!P || !piece) return {
      ok: false,
      piece: piece
    };
    var fromRot = piece.rot;
    var toRot = ((piece.rot + dir) % 4 + 4) % 4;
    var kicks = P.getWallKicks(piece.name, fromRot, toRot);
    for (var i = 0; i < kicks.length; i++) {
      var dx = kicks[i][0];
      var dy = kicks[i][1];
      var test = {
        name: piece.name,
        rot: toRot,
        x: piece.x + dx,
        y: piece.y + dy
      };
      if (!collide(grid, test, test.x, test.y)) {
        return {
          ok: true,
          piece: test,
          kick: kicks[i]
        };
      }
    }
    return {
      ok: false,
      piece: piece
    };
  }

  /**
   * Retourne le y final si on hard-drop la pièce (pour ghost piece et hard drop).
   */
  function dropToBottom(grid, piece) {
    var y = piece.y;
    while (!collide(grid, piece, piece.x, y + 1)) {
      y++;
      if (y > 100) break; // safety
    }
    return y;
  }

  /**
   * Détecte si la dernière action est un T-spin.
   * Heuristique standard : la pièce courante est un T, le dernier mouvement
   * est une rotation, et au moins 3 des 4 coins du carré 3x3 entourant le
   * centre du T sont occupés (cellules de la grille ou bords).
   */
  function isTSpin(grid, piece, lastMoveWasRotation) {
    if (!piece || piece.name !== "T" || !lastMoveWasRotation) return false;
    var rows = grid.length;
    var cols = (grid[0] || []).length;
    var cx = piece.x + 1; // centre du T = +1, +1 dans la matrice 3x3
    var cy = piece.y + 1;
    var corners = [[cx - 1, cy - 1], [cx + 1, cy - 1], [cx - 1, cy + 1], [cx + 1, cy + 1]];
    var occupied = 0;
    for (var i = 0; i < 4; i++) {
      var x = corners[i][0];
      var y = corners[i][1];
      if (x < 0 || x >= cols || y < 0 || y >= rows) {
        occupied++; // hors grille = considéré occupé
      } else if (grid[y][x]) {
        occupied++;
      }
    }
    return occupied >= 3;
  }

  /**
   * Détecte un game over (top-out) : pièce nouvelle qui collide dès le spawn.
   */
  function isGameOver(grid, piece) {
    return collide(grid, piece, piece.x, piece.y);
  }

  /**
   * Crée une nouvelle pièce avec position de spawn standard
   * (centrée horizontalement, en haut de la grille).
   */
  function spawnPiece(name, cols) {
    cols = cols || COLS;
    return {
      name: name,
      rot: 0,
      x: Math.floor(cols / 2) - 2,
      // -2 pour centrer la matrice 3x3 ou 4x4
      y: name === "I" ? -1 : 0 // I est plus large, on la spawn 1 ligne plus haut
    };
  }
  window.STCore = {
    ROWS: ROWS,
    COLS: COLS,
    createGrid: createGrid,
    cloneGrid: cloneGrid,
    collide: collide,
    lock: lock,
    clearLines: clearLines,
    rotatePiece: rotatePiece,
    dropToBottom: dropToBottom,
    isTSpin: isTSpin,
    isGameOver: isGameOver,
    spawnPiece: spawnPiece
  };
})();

/* ─────────────────────────────────────────────────────────── */

/* === src/game/scoring.js === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Scoring & Difficulty
   ═══════════════════════════════════════════════════════════════════
   Système de score officiel Tetris (parité avec le Tetris Guideline) :

     Single (1 ligne)       :   100 × niveau
     Double (2 lignes)      :   300 × niveau
     Triple (3 lignes)      :   500 × niveau
     Tetris (4 lignes)      :   800 × niveau
     T-Spin Single          :   800 × niveau
     T-Spin Double          : 1 200 × niveau
     T-Spin Triple          : 1 600 × niveau
     Mini T-Spin (no clear) :   100 × niveau
     Soft drop              :  1 par cellule
     Hard drop              :  2 par cellule
     Combo (n+1 ligne d'affilée): 50 × n × niveau
     Back-to-back (Tetris ou T-Spin enchaînés): bonus ×1.5

   Niveau & vitesse (gravité, ms par cellule) :
     Niveau 1  → 1000 ms/cell
     Niveau 5  →  500 ms/cell
     Niveau 10 →  250 ms/cell
     Niveau 15 →  100 ms/cell
     Niveau 20 →   50 ms/cell (plafond)

   Niveau monte tous les 10 lignes effacées.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  var SCORES = {
    SINGLE: 100,
    DOUBLE: 300,
    TRIPLE: 500,
    TETRIS: 800,
    TSPIN_MINI: 100,
    TSPIN_SINGLE: 800,
    TSPIN_DOUBLE: 1200,
    TSPIN_TRIPLE: 1600,
    SOFT_DROP_PER_CELL: 1,
    HARD_DROP_PER_CELL: 2,
    COMBO_BASE: 50
  };
  var LINES_PER_LEVEL = 10;
  var MAX_LEVEL = 20;

  /**
   * Calcule le score gagné lors du lock d'une pièce.
   * @param ctx { lines:int, isTSpin:bool, level:int, combo:int (combo précédent), b2b:bool (back-to-back actif) }
   * @returns { score, newCombo, newB2B }
   */
  function scoreFor(ctx) {
    var lines = ctx.lines || 0;
    var isTSpin = !!ctx.isTSpin;
    var level = Math.max(1, ctx.level || 1);
    var combo = ctx.combo || 0;
    var b2bActive = !!ctx.b2b;
    var pts = 0;
    var awarded = false; // si on a déclenché un combo line clear (≥1 ligne)

    if (isTSpin) {
      if (lines === 0) pts = SCORES.TSPIN_MINI;else if (lines === 1) pts = SCORES.TSPIN_SINGLE;else if (lines === 2) pts = SCORES.TSPIN_DOUBLE;else if (lines === 3) pts = SCORES.TSPIN_TRIPLE;
      awarded = lines > 0;
    } else {
      if (lines === 1) pts = SCORES.SINGLE;else if (lines === 2) pts = SCORES.DOUBLE;else if (lines === 3) pts = SCORES.TRIPLE;else if (lines === 4) pts = SCORES.TETRIS;
      awarded = lines > 0;
    }
    pts *= level;

    // Back-to-back bonus (Tetris ou T-spin enchaînés)
    var newB2B = b2bActive;
    if (lines > 0) {
      var qualifiesB2B = lines === 4 || isTSpin && lines > 0;
      if (qualifiesB2B && b2bActive) {
        pts = Math.floor(pts * 1.5);
      }
      newB2B = qualifiesB2B;
    }

    // Combo (lines ≥ 1 d'affilée)
    var newCombo = awarded ? combo + 1 : 0;
    if (awarded && combo > 0) {
      pts += SCORES.COMBO_BASE * combo * level;
    }
    return {
      score: pts,
      newCombo: newCombo,
      newB2B: newB2B
    };
  }

  /**
   * Score gagné par soft drop (descente accélérée).
   * Appelé à chaque cellule descendue manuellement.
   */
  function softDropScore() {
    return SCORES.SOFT_DROP_PER_CELL;
  }

  /**
   * Score gagné par hard drop (slam).
   * @param cellsFallen nombre de cellules entre la position au moment du slam et le sol
   */
  function hardDropScore(cellsFallen) {
    return Math.max(0, cellsFallen) * SCORES.HARD_DROP_PER_CELL;
  }

  /**
   * Niveau courant en fonction des lignes totales effacées.
   * @returns int (1..MAX_LEVEL)
   */
  function levelFromLines(linesTotal) {
    var lvl = 1 + Math.floor((linesTotal || 0) / LINES_PER_LEVEL);
    return Math.min(MAX_LEVEL, Math.max(1, lvl));
  }

  /**
   * Vitesse de gravité (ms entre chaque descente automatique d'une cellule)
   * pour le niveau donné.
   */
  function gravityMs(level) {
    var lvl = Math.min(MAX_LEVEL, Math.max(1, level || 1));
    // Courbe douce : commence à 1000ms (niveau 1), descend exponentiellement.
    // Niveau 10 ~ 500/2 = 250, niveau 20 ~ 50.
    var speeds = [0,
    // index 0 unused
    1000,
    // 1
    900, 800, 700, 600,
    // 5
    500, 420, 360, 300, 250,
    // 10
    210, 180, 150, 130, 110,
    // 15
    100, 85, 75, 60, 50 // 20
    ];
    return speeds[lvl] || 50;
  }

  /**
   * XP gagnée à la fin d'une partie.
   * Formule : floor(score / 100) + bonus pour lignes effacées.
   */
  function xpFromGame(score, linesTotal, level) {
    var base = Math.floor((score || 0) / 100);
    var lineBonus = (linesTotal || 0) * 5;
    var levelBonus = (level || 1) * 10;
    return base + lineBonus + levelBonus;
  }

  /**
   * Pièces or gagnées à la fin d'une partie.
   * Formule plus modeste que XP, pour pousser à acheter / regarder pubs.
   */
  function coinsFromGame(score, linesTotal) {
    var base = Math.floor((score || 0) / 1000);
    var lineBonus = Math.floor((linesTotal || 0) / 10) * 5;
    return Math.max(1, base + lineBonus);
  }
  window.STScoring = {
    SCORES: SCORES,
    LINES_PER_LEVEL: LINES_PER_LEVEL,
    MAX_LEVEL: MAX_LEVEL,
    scoreFor: scoreFor,
    softDropScore: softDropScore,
    hardDropScore: hardDropScore,
    levelFromLines: levelFromLines,
    gravityMs: gravityMs,
    xpFromGame: xpFromGame,
    coinsFromGame: coinsFromGame
  };
})();

/* ─────────────────────────────────────────────────────────── */

/* === src/game/render.js === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Canvas rendering
   ═══════════════════════════════════════════════════════════════════
   Dessine la grille + pièce courante + ghost piece sur un canvas 2D.

   Style visuel inspiré du Tetris officiel :
     - Pièces 3D avec gradient highlight top-left, ombre bottom-right
     - Bordure lumineuse violette autour de la zone de jeu
     - Lignes de grille subtiles (rgba(255,255,255,0.05))
     - Ghost piece : silhouette 30% opacité de la pièce qui va atterrir
     - Particules au moment du clearLines (handled via render.flash())

   Toutes les fonctions sont pures côté pixel (lit l'état, dessine).
   Pas d'animation persistante — le RAF loop redessine TOUT à chaque frame.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  /**
   * Dessine la grille + pièce courante sur le canvas.
   * @param ctx       CanvasRenderingContext2D
   * @param state     { grid, piece, ghostY, flashRows: [int] (rows en train de disparaître) }
   * @param config    { cellSize, cols, rows, showGhost: bool }
   */
  function drawBoard(ctx, state, config) {
    if (!ctx || !state) return;
    var grid = state.grid;
    var piece = state.piece;
    var ghostY = state.ghostY;
    var flashRows = state.flashRows || [];
    var cellSize = config.cellSize;
    var cols = config.cols;
    var rows = config.rows;
    var w = cellSize * cols;
    var h = cellSize * rows;

    // Background gradient (canvas-bg1 → canvas-bg2)
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#0a0e2a");
    grad.addColorStop(1, "#0d1530");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Grid lines (subtiles)
    ctx.strokeStyle = "rgba(124,58,237,0.1)";
    ctx.lineWidth = 1;
    for (var x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize + 0.5, 0);
      ctx.lineTo(x * cellSize + 0.5, h);
      ctx.stroke();
    }
    for (var y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize + 0.5);
      ctx.lineTo(w, y * cellSize + 0.5);
      ctx.stroke();
    }

    // Cellules verrouillées
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        var v = grid[r][c];
        if (!v) continue;
        var color = window.STPieces && window.STPieces.colorOf(v) || "#888";
        var isFlashing = flashRows.indexOf(r) >= 0;
        drawCell(ctx, c * cellSize, r * cellSize, cellSize, color, isFlashing);
      }
    }

    // Ghost piece (silhouette)
    if (piece && config.showGhost && typeof ghostY === "number" && ghostY > piece.y) {
      drawPiece(ctx, piece, piece.x, ghostY, cellSize, true);
    }

    // Pièce courante
    if (piece) {
      drawPiece(ctx, piece, piece.x, piece.y, cellSize, false);
    }

    // Bordure violette autour du board (style Tetris officiel)
    ctx.strokeStyle = "rgba(124,58,237,0.6)";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, w, h);
  }

  /**
   * Dessine une pièce à la position (ox, oy) en cellules.
   */
  function drawPiece(ctx, piece, ox, oy, cellSize, isGhost) {
    var P = window.STPieces;
    if (!P || !piece) return;
    var matrix = P.getRotation(piece.name, piece.rot);
    if (!matrix) return;
    var color = P.colorOf(piece.name);
    for (var dy = 0; dy < matrix.length; dy++) {
      for (var dx = 0; dx < matrix[dy].length; dx++) {
        if (!matrix[dy][dx]) continue;
        var px = (ox + dx) * cellSize;
        var py = (oy + dy) * cellSize;
        if (isGhost) {
          drawGhostCell(ctx, px, py, cellSize, color);
        } else {
          drawCell(ctx, px, py, cellSize, color, false);
        }
      }
    }
  }

  /**
   * Dessine une cellule "3D" : couleur de base + highlight + shadow.
   */
  function drawCell(ctx, x, y, size, color, flash) {
    if (flash) {
      // Cellule en train de disparaître : flash blanc
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillRect(x, y, size, size);
      return;
    }
    // Body
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);

    // Highlight top-left (effet 3D)
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(x, y, size, Math.max(2, size * 0.18));
    ctx.fillRect(x, y, Math.max(2, size * 0.18), size);

    // Shadow bottom-right
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x, y + size - Math.max(2, size * 0.18), size, Math.max(2, size * 0.18));
    ctx.fillRect(x + size - Math.max(2, size * 0.18), y, Math.max(2, size * 0.18), size);

    // Borne externe (séparation entre cellules)
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  }

  /**
   * Dessine une cellule "ghost" : juste un contour pointillé / opacity 30%.
   */
  function drawGhostCell(ctx, x, y, size, color) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
    ctx.restore();
  }

  /**
   * Dessine un mini canvas avec une pièce centrée (pour HUD next/hold).
   */
  function drawMiniPiece(ctx, pieceName, cellSize) {
    if (!ctx) return;
    var P = window.STPieces;
    if (!P || !pieceName) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      return;
    }
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    var matrix = P.getRotation(pieceName, 0);
    if (!matrix) return;
    var color = P.colorOf(pieceName);

    // Trim matrix : trouve les bornes effectives de la pièce
    var minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (var r = 0; r < matrix.length; r++) {
      for (var c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          if (r < minY) minY = r;
          if (r > maxY) maxY = r;
          if (c < minX) minX = c;
          if (c > maxX) maxX = c;
        }
      }
    }
    if (minX === Infinity) return;
    var pw = (maxX - minX + 1) * cellSize;
    var ph = (maxY - minY + 1) * cellSize;
    var ox = (ctx.canvas.width - pw) / 2 - minX * cellSize;
    var oy = (ctx.canvas.height - ph) / 2 - minY * cellSize;
    for (var rr = minY; rr <= maxY; rr++) {
      for (var cc = minX; cc <= maxX; cc++) {
        if (matrix[rr][cc]) {
          drawCell(ctx, ox + cc * cellSize, oy + rr * cellSize, cellSize, color, false);
        }
      }
    }
  }
  window.STRender = {
    drawBoard: drawBoard,
    drawPiece: drawPiece,
    drawCell: drawCell,
    drawGhostCell: drawGhostCell,
    drawMiniPiece: drawMiniPiece
  };
})();

/* ─────────────────────────────────────────────────────────── */

/* === src/game/audio.js === */
"use strict";

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
      // Resume on first user gesture (mobile autoplay policy)
      var resume = function () {
        if (ctx.state === "suspended") ctx.resume().catch(function () {});
      };
      document.addEventListener("touchstart", resume, {
        once: true,
        passive: true
      });
      document.addEventListener("click", resume, {
        once: true
      });
      document.addEventListener("keydown", resume, {
        once: true
      });
      return ctx;
    } catch (_) {
      return null;
    }
  }
  function soundEnabled() {
    try {
      var raw = localStorage.getItem("st_settings");
      if (!raw) return true;
      var s = JSON.parse(raw);
      return s && s.sound !== false;
    } catch (_) {
      return true;
    }
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
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = type || "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(c.destination);
      var now = c.currentTime;
      var v = typeof volume === "number" ? volume : 0.15;
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
      t += n.gap || 80;
    });
  }

  // ─── Library d'effets sonores ────────────────────────────────
  var SFX = {
    move: function () {
      tone(240, 0.04, "square", 0.06);
    },
    rotate: function () {
      tone(360, 0.05, "triangle", 0.08);
    },
    lock: function () {
      tone(180, 0.08, "sine", 0.12);
    },
    hardDrop: function () {
      tone(120, 0.12, "sawtooth", 0.14);
    },
    hold: function () {
      tone(440, 0.06, "triangle", 0.08);
    },
    line1: function () {
      sequence([{
        freq: 523,
        dur: 0.1
      }, {
        freq: 659,
        dur: 0.1
      }]);
    },
    line2: function () {
      sequence([{
        freq: 523,
        dur: 0.1
      }, {
        freq: 659,
        dur: 0.1
      }, {
        freq: 784,
        dur: 0.1
      }]);
    },
    line3: function () {
      sequence([{
        freq: 523,
        dur: 0.08
      }, {
        freq: 659,
        dur: 0.08
      }, {
        freq: 784,
        dur: 0.08
      }, {
        freq: 1047,
        dur: 0.12
      }]);
    },
    tetris: function () {
      sequence([{
        freq: 523,
        dur: 0.08,
        type: "square"
      }, {
        freq: 659,
        dur: 0.08,
        type: "square"
      }, {
        freq: 784,
        dur: 0.08,
        type: "square"
      }, {
        freq: 1047,
        dur: 0.16,
        type: "square",
        vol: 0.18
      }]);
    },
    levelUp: function () {
      sequence([{
        freq: 523,
        dur: 0.1
      }, {
        freq: 659,
        dur: 0.1
      }, {
        freq: 784,
        dur: 0.1
      }, {
        freq: 1047,
        dur: 0.1
      }, {
        freq: 1319,
        dur: 0.2,
        vol: 0.18
      }]);
    },
    booster: function () {
      tone(800, 0.15, "triangle", 0.12);
    },
    gameOver: function () {
      sequence([{
        freq: 392,
        dur: 0.15
      }, {
        freq: 330,
        dur: 0.15
      }, {
        freq: 262,
        dur: 0.3,
        vol: 0.18
      }]);
    },
    win: function () {
      sequence([{
        freq: 523,
        dur: 0.1
      }, {
        freq: 659,
        dur: 0.1
      }, {
        freq: 784,
        dur: 0.1
      }, {
        freq: 1047,
        dur: 0.15
      }, {
        freq: 784,
        dur: 0.1
      }, {
        freq: 1047,
        dur: 0.25,
        vol: 0.2
      }]);
    },
    button: function () {
      tone(660, 0.05, "sine", 0.08);
    },
    coin: function () {
      tone(880, 0.08, "triangle", 0.10);
    }
  };
  function play(name) {
    var fn = SFX[name];
    if (fn) fn();
  }
  window.STAudio = {
    play: play,
    SFX: SFX,
    tone: tone,
    sequence: sequence
  };
})();

/* ─────────────────────────────────────────────────────────── */

/* === src/game/haptics.js === */
"use strict";

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
    move: [6],
    rotate: [10],
    lock: [18],
    hardDrop: [12, 40, 40],
    line1: [40, 30, 40],
    line2: [40, 20, 40, 20, 60],
    line3: [40, 15, 40, 15, 40, 15, 80],
    line4: [60, 10, 60, 10, 60, 10, 100],
    booster: [20, 30, 60, 30, 20],
    levelUp: [30, 20, 50, 20, 80, 20, 120],
    gameOver: [80, 40, 60, 40, 40, 40, 20]
  };
  function vibroEnabled() {
    try {
      var raw = localStorage.getItem("st_settings");
      if (!raw) return true; // default ON
      var s = JSON.parse(raw);
      return s && s.vibro !== false;
    } catch (_) {
      return true;
    }
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
    vibePattern: vibePattern
  };
})();

/* ─────────────────────────────────────────────────────────── */

/* === src/game/particles.js === */
"use strict";

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
    embers: []
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
        size: 3 + Math.random() * 5
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
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 500 + Math.random() * 500,
        maxLife: 1000,
        color: col,
        size: 2 + Math.random() * 5
      });
    }
  }

  /** Anneau d'onde de choc (visualise un boost laser/meteor). */
  function addShockwave(x, y) {
    state.shockwaves.push({
      x: x,
      y: y,
      r: 0,
      life: 500,
      maxLife: 500
    });
    for (var i = 0; i < 8; i++) {
      var a = -Math.PI + Math.random() * Math.PI;
      var sp = 3 + Math.random() * 7;
      state.embers.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 4,
        life: 600 + Math.random() * 400,
        maxLife: 1000,
        size: 2 + Math.random() * 4,
        color: "#ffd740"
      });
    }
  }

  /** Update tous les systèmes (appelé chaque frame). */
  function update(dt) {
    var g = 0.2; // gravité
    state.particles = state.particles.filter(function (p) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += g;
      p.life -= dt;
      return p.life > 0;
    });
    state.shockwaves = state.shockwaves.filter(function (s) {
      s.r += 6;
      s.life -= dt;
      return s.life > 0;
    });
    state.embers = state.embers.filter(function (e) {
      e.x += e.vx;
      e.y += e.vy;
      e.vy += 0.15;
      e.life -= dt;
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
      ctx.strokeStyle = "rgba(255," + Math.floor(180 * a) + ",0," + a * 0.8 + ")";
      ctx.lineWidth = 3 * a;
      ctx.shadowColor = "#ff8c00";
      ctx.shadowBlur = 20 * a;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
      if (s.r > 4) {
        ctx.strokeStyle = "rgba(255,255,255," + a * 0.5 + ")";
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
    count: count
  };
})();

/* ─────────────────────────────────────────────────────────── */

/* === src/game/boosters.js === */
"use strict";

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
    laser: 5000,
    meteor: 5000,
    magnet: 8000
  };
  var DURATIONS = {
    freeze: 15000 // ms d'immobilisation gravité (15s)
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
    if (!G || !G.grid) return {
      grid: G && G.grid,
      line: -1
    };
    var grid = window.STCore.cloneGrid(G.grid);
    var rows = grid.length;
    var cols = (grid[0] || []).length;

    // Cherche la ligne la plus basse avec au moins une cellule
    var targetLine = -1;
    for (var r = rows - 1; r >= 0; r--) {
      var hasCell = false;
      for (var c = 0; c < cols; c++) {
        if (grid[r][c]) {
          hasCell = true;
          break;
        }
      }
      if (hasCell) {
        targetLine = r;
        break;
      }
    }
    if (targetLine >= 0) {
      for (var x = 0; x < cols; x++) grid[targetLine][x] = 0;
      G.grid = grid;
    }
    return {
      grid: G.grid,
      line: targetLine
    };
  }

  /**
   * METEOR — détruit 5 cellules aléatoires occupées.
   * Retourne { grid, cells: [{x,y}] }.
   */
  function applyMeteor(G, count) {
    count = count || 5;
    if (!G || !G.grid) return {
      grid: G && G.grid,
      cells: []
    };
    var grid = window.STCore.cloneGrid(G.grid);
    var rows = grid.length;
    var cols = (grid[0] || []).length;

    // Récupère toutes les cellules occupées
    var occupied = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (grid[r][c]) occupied.push({
          x: c,
          y: r
        });
      }
    }
    if (occupied.length === 0) return {
      grid: G.grid,
      cells: []
    };

    // Shuffle Fisher-Yates et prend les `count` premières
    for (var i = occupied.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = occupied[i];
      occupied[i] = occupied[j];
      occupied[j] = tmp;
    }
    var hits = occupied.slice(0, Math.min(count, occupied.length));
    hits.forEach(function (cell) {
      grid[cell.y][cell.x] = 0;
    });
    G.grid = grid;
    return {
      grid: G.grid,
      cells: hits
    };
  }

  /**
   * MAGNET — fait tomber tous les blocs vers le bas, colonne par colonne,
   * pour combler les trous. Très utile sur des grids "gruyère".
   * Retourne { grid, cellsMoved }.
   */
  function applyMagnet(G) {
    if (!G || !G.grid) return {
      grid: G && G.grid,
      cellsMoved: 0
    };
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
    return {
      grid: G.grid,
      cellsMoved: moved
    };
  }

  /**
   * Centre approximatif (pixels) d'une cellule (col,row) selon cellSize.
   * Utilisé pour positionner particles/shockwaves au bon endroit du canvas.
   */
  function cellCenterPx(col, row, cellSize) {
    return {
      x: col * cellSize + cellSize / 2,
      y: row * cellSize + cellSize / 2
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
    cellCenterPx: cellCenterPx
  };
})();

/* ─────────────────────────────────────────────────────────── */

/* === src/hooks/useGameLoop.js === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — useGameLoop hook
   ═══════════════════════════════════════════════════════════════════
   RAF loop avec :
     - Cleanup automatique au unmount (pas de leak)
     - Pause auto quand l'app passe en arrière-plan (visibilitychange)
     - Frame skip cap : si delta time > 100ms, on ignore (évite les
       jumps de plusieurs niveaux quand l'utilisateur revient après
       avoir mis l'app en arrière-plan 3h plus tard)

   Usage :
     useGameLoop({
       active: !paused && !gameOver,
       onTick: (deltaMs) => { ... },  // appelé à chaque frame
     });

   On expose le hook sur window pour qu'il soit accessible depuis
   GameScreen.jsx (qui est aussi dans le bundle).
   ═══════════════════════════════════════════════════════════════════ */

const {
  useEffect: useEffectGL,
  useRef: useRefGL
} = React;
function useGameLoop({
  active,
  onTick
}) {
  const rafRef = useRefGL(null);
  const lastTimeRef = useRefGL(0);
  const onTickRef = useRefGL(onTick);
  const visiblePausedRef = useRefGL(false);

  // On garde une ref vers le callback pour éviter de redémarrer la loop
  // à chaque re-render parent.
  useEffectGL(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  // Visibility pause : pas de RAF si l'app est en arrière-plan.
  useEffectGL(() => {
    const onVis = () => {
      if (document.hidden) {
        visiblePausedRef.current = true;
      } else {
        visiblePausedRef.current = false;
        // Reset lastTime pour éviter un gros delta au retour
        lastTimeRef.current = 0;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  useEffectGL(() => {
    if (!active) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimeRef.current = 0;
      return;
    }
    const tick = now => {
      if (visiblePausedRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const last = lastTimeRef.current || now;
      let delta = now - last;
      // Frame skip cap : delta > 100ms → on cap pour éviter jumps
      if (delta > 100) delta = 100;
      lastTimeRef.current = now;
      try {
        if (typeof onTickRef.current === "function") {
          onTickRef.current(delta);
        }
      } catch (e) {
        // L'erreur ne doit pas tuer le RAF
        console.warn("[ST] useGameLoop tick error:", e);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [active]);
}
window.useGameLoop = useGameLoop;

/* ─────────────────────────────────────────────────────────── */

/* === src/hooks/useStorage.js === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — useStorage hook
   ═══════════════════════════════════════════════════════════════════
   Wrapper localStorage versionné pour :
     - Lire/écrire de manière typée (avec defaults)
     - Gérer les erreurs (private mode, storage plein, etc.)
     - Versionner le schéma (st_v) pour migrations futures

   Cf. checklist senior #9 : "Versionnage du schéma" + "Optional chaining
   systématique sur les accès aux objets persistés".

   Usage :
     const [coins, setCoins] = useStorage("st_coins", 0);
     const [profile, setProfile] = useStorage("st_profile",
       { xp:0, bestScore:0, boosters:{} });
   ═══════════════════════════════════════════════════════════════════ */

const {
  useState: useStateST,
  useEffect: useEffectST,
  useCallback: useCallbackST
} = React;
const SCHEMA_VERSION = 1;

// Cache mémoire pour éviter les reads répétés
const memCache = {};
function safeRead(key, defaultValue) {
  try {
    if (key in memCache) return memCache[key];
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    const parsed = JSON.parse(raw);
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
  const setAndPersist = useCallbackST(next => {
    setValue(prev => {
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
        // Migrations futures à coder ici
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
  SCHEMA_VERSION: SCHEMA_VERSION
};

/* ─────────────────────────────────────────────────────────── */

/* === src/components/Starfield.jsx === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Starfield helper
   ═══════════════════════════════════════════════════════════════════
   Composant décoratif réutilisable affiché en background des écrans
   (Loading, Home, GameOver, Settings…). Génère N étoiles scintillantes
   réparties aléatoirement.

   Note : on définit Starfield en GLOBAL une seule fois pour que les
   autres composants (qui le référencent par `<Starfield />`) puissent
   le résoudre sans imports.
   ═══════════════════════════════════════════════════════════════════ */

const {
  useState: useStateSF
} = React;
window.Starfield = function Starfield({
  count
}) {
  const [stars] = useStateSF(() => {
    const n = count || 24;
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        size: Math.random() * 3 + 2
      });
    }
    return arr;
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "starfield",
    style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 0
    }
  }, stars.map((st, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "star",
    style: {
      top: st.top + "%",
      left: st.left + "%",
      width: st.size + "px",
      height: st.size + "px",
      animationDelay: st.delay + "s"
    }
  })));
};

/* ─────────────────────────────────────────────────────────── */

/* === src/components/HUD.jsx === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — HUD (Heads-Up Display) v3
   ═══════════════════════════════════════════════════════════════════
   v3 (Pino 2026-05-03 #2) :
     - LINES retiré (peu utile, redondant avec score)
     - NEXT et HOLD intégrés dans la rangée des badges (au lieu d'une
       3e rangée qui bouffait ~70px)
     - Économie verticale → canvas + boosters plus grands

   Layout final :
     ┌─────────────────────────────────────┐
     │  SCORE 12 345  │  TIME  01:23       │  ← Hero row
     ├──────┬─────────┬──────────┬─────────┤
     │ LVL  │  COMBO  │   NEXT   │  HOLD   │  ← Mid row (4 cols)
     │  3   │   ×2    │   ▣▣     │   ▣     │
     └──────┴─────────┴──────────┴─────────┘
   ═══════════════════════════════════════════════════════════════════ */

const {
  useEffect: useEffectHUD,
  useRef: useRefHUD
} = React;
function HUD({
  time,
  targetLines,
  currentLines,
  score,
  level,
  combo,
  nextPiece,
  holdPiece
}) {
  const nextCanvasRef = useRefHUD(null);
  const holdCanvasRef = useRefHUD(null);
  useEffectHUD(() => {
    const cv = nextCanvasRef.current;
    if (!cv || !window.STRender) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    window.STRender.drawMiniPiece(ctx, nextPiece || null, 10);
  }, [nextPiece]);
  useEffectHUD(() => {
    const cv = holdCanvasRef.current;
    if (!cv || !window.STRender) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    window.STRender.drawMiniPiece(ctx, holdPiece || null, 10);
  }, [holdPiece]);
  return /*#__PURE__*/React.createElement("div", {
    style: SHUD.root
  }, /*#__PURE__*/React.createElement("div", {
    style: SHUD.heroRow
  }, /*#__PURE__*/React.createElement("div", {
    style: SHUD.heroBlock
  }, /*#__PURE__*/React.createElement("div", {
    style: SHUD.heroLabel
  }, "SCORE"), /*#__PURE__*/React.createElement("div", {
    style: SHUD.scoreValue
  }, formatNum(score))), /*#__PURE__*/React.createElement("div", {
    style: SHUD.heroDivider
  }), /*#__PURE__*/React.createElement("div", {
    style: SHUD.heroBlock
  }, /*#__PURE__*/React.createElement("div", {
    style: SHUD.heroLabel
  }, "TIME"), /*#__PURE__*/React.createElement("div", {
    style: SHUD.timeValue
  }, formatTime(time)))), /*#__PURE__*/React.createElement("div", {
    style: SHUD.midRow
  }, /*#__PURE__*/React.createElement(BadgeStat, {
    label: "LVL",
    value: level || 1,
    color: "var(--purple-l)"
  }), /*#__PURE__*/React.createElement(BadgeStat, {
    label: "COMBO",
    value: combo > 0 ? "×" + combo : "×0",
    color: combo > 0 ? "var(--gold)" : "rgba(255,255,255,0.5)"
  }), /*#__PURE__*/React.createElement(BadgeMini, {
    label: "NEXT",
    ref_: nextCanvasRef
  }), /*#__PURE__*/React.createElement(BadgeMini, {
    label: "HOLD",
    ref_: holdCanvasRef
  })));
}

/* ─── Sub-components ─────────────────────────────────────────── */
function BadgeStat({
  label,
  value,
  color,
  sub
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: SHUD.badge
  }, /*#__PURE__*/React.createElement("div", {
    style: SHUD.badgeLabel
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      ...SHUD.badgeValue,
      color: color
    }
  }, value), sub && /*#__PURE__*/React.createElement("div", {
    style: SHUD.badgeSub
  }, sub));
}

/* BadgeMini : même apparence/dimensions qu'un BadgeStat, mais le
   "value" est un mini canvas (pour NEXT et HOLD).
   Tient pile dans la grille 4 colonnes du midRow. */
function BadgeMini({
  label,
  ref_
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: SHUD.badge
  }, /*#__PURE__*/React.createElement("div", {
    style: SHUD.badgeLabel
  }, label), /*#__PURE__*/React.createElement("canvas", {
    ref: ref_,
    width: 48,
    height: 32,
    style: {
      display: "block",
      marginTop: 1
    }
  }));
}

/* ─── Helpers ────────────────────────────────────────────────── */
function formatTime(ms) {
  const total = Math.max(0, Math.floor((ms || 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}
function formatNum(n) {
  const safe = typeof n === "number" && isFinite(n) ? n : 0;
  return safe.toLocaleString("fr-FR");
}

/* ─── Styles ─────────────────────────────────────────────────── */
const SHUD = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "calc(env(safe-area-inset-top, 0px) + 8px) 10px 6px"
  },
  /* ═══ HERO ROW (Score + Time très visible) ═══ */
  heroRow: {
    display: "flex",
    alignItems: "stretch",
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    borderRadius: 14,
    padding: "10px 16px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 rgba(0,0,0,0.3)"
  },
  heroBlock: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0
  },
  heroDivider: {
    width: 2,
    background: "rgba(255,255,255,0.12)",
    margin: "4px 12px",
    borderRadius: 2
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: 800,
    color: "var(--sky)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2
  },
  scoreValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: "clamp(22px, 6vw, 32px)",
    color: "var(--gold)",
    letterSpacing: 0.5,
    textShadow: "0 2px 0 rgba(0,0,0,0.4), 0 0 12px rgba(255,210,63,0.4)",
    lineHeight: 1.1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "100%"
  },
  timeValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: "clamp(22px, 6vw, 32px)",
    color: "var(--sky)",
    letterSpacing: 1,
    textShadow: "0 2px 0 rgba(0,0,0,0.4), 0 0 12px rgba(56,189,248,0.4)",
    lineHeight: 1.1,
    whiteSpace: "nowrap"
  },
  /* ═══ MIDDLE ROW (Level / Combo / Lines) ═══ */
  midRow: {
    display: "flex",
    gap: 6,
    alignItems: "stretch"
  },
  badge: {
    flex: 1,
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(124,58,237,0.4)",
    borderRadius: 10,
    padding: "5px 8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 0
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: 800,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 1
  },
  badgeValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 18,
    lineHeight: 1.1,
    textShadow: "0 1px 0 rgba(0,0,0,0.4)"
  },
  badgeSub: {
    fontSize: 9,
    color: "rgba(255,255,255,0.5)",
    fontWeight: 700,
    marginTop: 1
  }

  /* (v3) miniRow + miniCard supprimés : NEXT/HOLD intégrés dans midRow */
};
window.HUD = HUD;

/* ─────────────────────────────────────────────────────────── */

/* === src/components/BoosterButtons.jsx === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — BoosterButtons
   ═══════════════════════════════════════════════════════════════════
   Barre fixe en bas de l'écran de jeu avec les 4 boosters consommables :
     - ❄️ Freeze : stop la chute pendant 3s
     - ⚡ Laser  : détruit la ligne courante
     - ☄️ Meteor : détruit 5 cellules aléatoires
     - 🧲 Magnet : attire les pièces dans les trous

   Chaque bouton affiche le compteur restant. Si compteur = 0,
   le bouton est grisé avec un "+" pour acheter (V2 → ouvre shop).

   Props:
     - inventory: { freeze, laser, meteor, magnet } (compteurs)
     - cooldowns: { freeze, laser, meteor, magnet } (ms restants si en cooldown)
     - onUse(boosterId): callback quand l'utilisateur active
     - onBuy(boosterId): callback quand le compteur est à 0 (V2)
     - disabled: bool (game pause / over)
   ═══════════════════════════════════════════════════════════════════ */

const BOOSTERS = [{
  id: "freeze",
  icon: "❄️",
  color: "#06b6d4",
  label: "Freeze"
}, {
  id: "laser",
  icon: "⚡",
  color: "#facc15",
  label: "Laser"
}, {
  id: "meteor",
  icon: "☄️",
  color: "#f97316",
  label: "Meteor"
}, {
  id: "magnet",
  icon: "🧲",
  color: "#ec4899",
  label: "Magnet"
}];
function BoosterButtons({
  inventory,
  cooldowns,
  onUse,
  onBuy,
  disabled
}) {
  const inv = inventory || {};
  const cd = cooldowns || {};
  return /*#__PURE__*/React.createElement("div", {
    style: SBB.root
  }, BOOSTERS.map(b => {
    const count = inv[b.id] ?? 0;
    const cooldown = cd[b.id] ?? 0;
    const empty = count <= 0;
    const onCD = cooldown > 0;
    const isDisabled = !!disabled || empty && !onBuy || onCD;
    return /*#__PURE__*/React.createElement("button", {
      key: b.id,
      onClick: () => {
        if (disabled) return;
        if (onCD) return;
        if (empty) {
          if (typeof onBuy === "function") onBuy(b.id);
        } else {
          if (typeof onUse === "function") onUse(b.id);
        }
      },
      disabled: isDisabled && !empty,
      style: {
        ...SBB.btn,
        opacity: disabled || onCD ? 0.45 : 1,
        cursor: isDisabled && !empty ? "not-allowed" : "pointer",
        borderColor: empty ? "rgba(255,255,255,0.25)" : b.color,
        /* Halo extérieur + ombre 3D vers le bas pour effet "bouton physique" */
        boxShadow: empty ? "0 5px 0 rgba(0,0,0,0.35), inset 0 2px 0 rgba(255,255,255,0.05)" : "0 5px 0 " + shade(b.color, -40) + ", " + "0 0 18px " + alpha(b.color, 0.55) + ", " + "inset 0 2px 0 rgba(255,255,255,0.25), " + "inset 0 -3px 0 " + alpha("#000", 0.3),
        background: empty ? "radial-gradient(circle at 30% 30%, var(--bg2), var(--bg1))" : "radial-gradient(circle at 30% 30%, " + alpha(b.color, 1) + ", " + shade(b.color, -25) + ")"
      },
      "aria-label": b.label + " booster"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        ...SBB.icon,
        filter: empty ? "grayscale(0.85) opacity(0.6)" : "drop-shadow(0 2px 2px rgba(0,0,0,0.5))"
      }
    }, b.icon), empty ? /*#__PURE__*/React.createElement("span", {
      style: SBB.plusBadge
    }, "+") : /*#__PURE__*/React.createElement("span", {
      style: {
        ...SBB.countBadge,
        background: "linear-gradient(180deg, " + b.color + ", " + shade(b.color, -30) + ")"
      }
    }, count), onCD && /*#__PURE__*/React.createElement("span", {
      style: SBB.cdOverlay
    }, Math.ceil(cooldown / 1000), "s"));
  }));
}

/* ─── Helpers couleur ─────────────────────────────────────────── */
function alpha(hex, a) {
  // hex (#rrggbb ou #rgb) → rgba(...)
  if (!hex || hex[0] !== "#") return `rgba(124,58,237,${a})`;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function shade(hex, amount) {
  // Décale le hex de `amount` (-100..+100). Négatif = plus sombre.
  if (!hex || hex[0] !== "#") return hex;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = clamp(parseInt(h.slice(0, 2), 16) + amount, 0, 255);
  const g = clamp(parseInt(h.slice(2, 4), 16) + amount, 0, 255);
  const b = clamp(parseInt(h.slice(4, 6), 16) + amount, 0, 255);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function toHex(n) {
  return n.toString(16).padStart(2, "0");
}

/* ─── Styles : boutons CIRCULAIRES style arcade Tetroid ─────── */
const SBB = {
  root: {
    display: "flex",
    gap: 14,
    padding: "12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.4))"
  },
  btn: {
    /* CERCLE arcade : 78px de diamètre, bordure épaisse colorée,
       halo extérieur, ombre 3D inférieure pour relief bouton physique. */
    width: 78,
    height: 78,
    borderRadius: "50%",
    border: "3px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Lilita One', cursive",
    color: "#fff",
    position: "relative",
    transition: "transform 0.08s ease, box-shadow 0.08s ease"
    /* Pas de padding : le contenu (icon) est centré pile par flex.
       Le compteur sort en absolute par-dessus en bas-droite. */
  },
  icon: {
    /* Icône XL au centre du cercle */
    fontSize: 36,
    lineHeight: 1,
    filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.5))"
  },
  /* Badge compteur — pastille bottom-right qui dépasse du cercle */
  countBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "2px solid #fff",
    color: "#fff",
    fontSize: 13,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.4)"
  },
  /* Badge "+" doré quand vide → click = boutique */
  plusBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "linear-gradient(180deg, var(--gold), #d97706)",
    border: "2px solid #fff",
    color: "#fff",
    fontSize: 18,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(255,210,63,0.6)"
  },
  /* Overlay cooldown circulaire */
  cdOverlay: {
    position: "absolute",
    inset: -3,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    color: "#fff",
    fontWeight: 800
  }
};
window.BoosterButtons = BoosterButtons;

/* ─────────────────────────────────────────────────────────── */

/* === src/components/RewardedAd.jsx === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — RewardedAd
   ═══════════════════════════════════════════════════════════════════
   Stub V1 pour les pubs récompensées.
   En V1 : on simule avec un compteur 5s + bouton "Skip" désactivé.
   En V2 : on intégrera AdMob (via Capacitor ou WebView native).

   API attendue :
     <RewardedAd
       reward={{ type: "continue" }}    // ou { type: "booster", id: "freeze" }
       onComplete={() => ...}
       onSkip={() => ...}                // si V1 dev mode permet de skip
     />

   En production, après l'intégration AdMob, on remplace cette stub par :
     - Appel à AdMob.showRewardedAd()
     - Listen pour onRewardEarned
     - Fallback: si pas de pub disponible, on peut donner la reward "free"
       1 fois/jour pour pas frustrer l'utilisateur.
   ═══════════════════════════════════════════════════════════════════ */

const {
  useState: useStateRA,
  useEffect: useEffectRA
} = React;
function RewardedAd({
  reward,
  onComplete,
  onSkip,
  durationSec
}) {
  const total = durationSec || 5;
  const [remaining, setRemaining] = useStateRA(total);
  useEffectRA(() => {
    if (remaining <= 0) {
      if (typeof onComplete === "function") onComplete();
      return;
    }
    const id = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, onComplete]);
  const rewardLabel = describeReward(reward);
  return /*#__PURE__*/React.createElement("div", {
    style: SRA.root
  }, /*#__PURE__*/React.createElement("div", {
    style: SRA.card
  }, /*#__PURE__*/React.createElement("div", {
    style: SRA.adLabel
  }, "\uD83D\uDCFA PUBLICIT\xC9"), /*#__PURE__*/React.createElement("div", {
    style: SRA.preview
  }, /*#__PURE__*/React.createElement("div", {
    style: SRA.previewIcon
  }, "\uD83C\uDFAE"), /*#__PURE__*/React.createElement("div", {
    style: SRA.previewText
  }, "D\xE9couvre d'autres jeux CloneX Studio")), /*#__PURE__*/React.createElement("div", {
    style: SRA.timer
  }, remaining > 0 ? /*#__PURE__*/React.createElement(React.Fragment, null, "R\xE9compense dans ", /*#__PURE__*/React.createElement("strong", null, remaining, "s"), "\u2026") : /*#__PURE__*/React.createElement(React.Fragment, null, "\u2705 R\xE9compense d\xE9bloqu\xE9e !")), /*#__PURE__*/React.createElement("div", {
    style: SRA.rewardBox
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 24
    }
  }, "\uD83C\uDF81"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 8
    }
  }, rewardLabel)), typeof onSkip === "function" && remaining > 0 && /*#__PURE__*/React.createElement("button", {
    style: SRA.skipBtn,
    onClick: onSkip
  }, "Passer la pub")));
}
function describeReward(reward) {
  if (!reward) return "Récompense surprise !";
  if (reward.type === "continue") return "Continuer la partie";
  if (reward.type === "booster") return "+1 booster " + (reward.id || "");
  if (reward.type === "coins") return "+" + (reward.amount || 0) + " pièces";
  if (reward.type === "xp") return "Boost XP ×2 prochaine partie";
  return "Récompense !";
}
const SRA = {
  root: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.92)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 500,
    padding: 20
  },
  card: {
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "2px solid var(--purple)",
    borderRadius: 18,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    boxShadow: "0 12px 32px rgba(0,0,0,0.6)"
  },
  adLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: "var(--orange)",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 16
  },
  preview: {
    background: "linear-gradient(135deg, #5b21b6, #1e40af, #7c3aed)",
    borderRadius: 14,
    padding: "32px 16px",
    textAlign: "center",
    marginBottom: 16
  },
  previewIcon: {
    fontSize: 60,
    marginBottom: 8
  },
  previewText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: 700
  },
  timer: {
    textAlign: "center",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 16
  },
  rewardBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,210,63,0.15)",
    border: "1.5px solid var(--gold)",
    borderRadius: 12,
    padding: "10px 16px",
    marginBottom: 12,
    color: "var(--gold)",
    fontWeight: 700
  },
  skipBtn: {
    width: "100%",
    padding: "10px 16px",
    background: "transparent",
    border: "1.5px solid rgba(255,255,255,0.3)",
    borderRadius: 12,
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: 700
  }
};
window.RewardedAd = RewardedAd;

/* ─────────────────────────────────────────────────────────── */

/* === src/components/LoadingScreen.jsx === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — LoadingScreen
   ═══════════════════════════════════════════════════════════════════
   Splash screen affiché 1.8-2.5s avant l'écran d'accueil.
     - Logo "SUPER TETRIS" arc-en-ciel (style Tetris officiel)
     - Barre de progression animée (purement cosmétique mais rassurante)
     - Particules d'étoiles scintillantes en background
     - Disparaît en fade-out une fois le timer terminé OU si onDone
       est appelé manuellement

   Pas de logique de jeu ici — c'est purement visuel.
   ═══════════════════════════════════════════════════════════════════ */

const {
  useState,
  useEffect,
  useRef
} = React;
function LoadingScreen({
  onDone,
  minDurationMs
}) {
  const [progress, setProgress] = useState(0);
  const [hint, setHint] = useState("");
  const startedRef = useRef(Date.now());
  const minMs = typeof minDurationMs === "number" ? minDurationMs : 1800;

  // Liste de hints rotatifs (pédagogie + immersion)
  const hints = ["Astuce : utilise le hold pour mettre une pièce en réserve", "Réussir un Tetris (4 lignes) donne le maximum de points", "Les T-Spin valent 3× plus que les lignes normales", "Les boosters se gardent entre les parties", "La roue de la fortune offre des récompenses chaque jour", "Ne ferme pas l'app si tu vois la pub — c'est une vie en plus !", "Les niveaux supérieurs accélèrent la chute", "Combo 10× = score multiplié par 5 !"];

  // Mount-once : démarre l'animation de progression
  useEffect(() => {
    startedRef.current = Date.now();

    // Hint aléatoire
    setHint(hints[Math.floor(Math.random() * hints.length)]);

    // Progress 0 → 100% sur minMs
    let raf;
    const tick = () => {
      const elapsed = Date.now() - startedRef.current;
      const pct = Math.min(100, elapsed / minMs * 100);
      setProgress(pct);
      if (elapsed < minMs) {
        raf = requestAnimationFrame(tick);
      } else {
        // Petit délai pour que la barre arrive bien à 100% visuel
        setTimeout(() => {
          if (typeof onDone === "function") onDone();
          // Notifie le HTML loader de bord pour qu'il disparaisse aussi
          try {
            window.dispatchEvent(new Event("super-tetris-ready"));
          } catch (_) {}
        }, 200);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    style: S.root
  }, /*#__PURE__*/React.createElement(Starfield, null), /*#__PURE__*/React.createElement("div", {
    style: S.content
  }, /*#__PURE__*/React.createElement("div", {
    style: S.logoWrap,
    className: "float"
  }, /*#__PURE__*/React.createElement("div", {
    style: S.logoSmall
  }, "SUPER"), /*#__PURE__*/React.createElement("div", {
    className: "logo-rainbow",
    style: S.logoMain
  }, "TETRIS")), /*#__PURE__*/React.createElement("div", {
    style: S.spinnerWrap
  }, /*#__PURE__*/React.createElement("div", {
    style: S.spinner
  })), /*#__PURE__*/React.createElement("div", {
    style: S.barWrap
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.barFill,
      width: progress + "%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: S.hint
  }, hint)));
}

/* ─── Starfield (étoiles scintillantes en background) ───────────── */
function Starfield({
  count
}) {
  const [stars] = useState(() => {
    const n = count || 28;
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        size: Math.random() * 3 + 2
      });
    }
    return arr;
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "starfield",
    style: {
      position: "absolute",
      inset: 0
    }
  }, stars.map((st, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "star",
    style: {
      top: st.top + "%",
      left: st.left + "%",
      width: st.size + "px",
      height: st.size + "px",
      animationDelay: st.delay + "s"
    }
  })));
}
const S = {
  root: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(ellipse at center, #1a2a6e 0%, #0b1238 70%)"
  },
  content: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 24,
    textAlign: "center"
  },
  logoWrap: {
    marginBottom: 32,
    lineHeight: 1
  },
  logoSmall: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 24,
    color: "#fff",
    letterSpacing: 8,
    marginBottom: 4,
    textShadow: "0 2px 0 rgba(0,0,0,0.4)"
  },
  logoMain: {
    fontSize: "clamp(48px, 14vw, 84px)",
    letterSpacing: 6,
    lineHeight: 1
  },
  spinnerWrap: {
    width: 56,
    height: 56,
    marginBottom: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "4px solid rgba(124,58,237,0.18)",
    borderTopColor: "var(--purple-l)",
    animation: "st-spin 0.9s linear infinite"
  },
  barWrap: {
    width: "min(280px, 70vw)",
    height: 8,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 100,
    overflow: "hidden",
    marginBottom: 16,
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)"
  },
  barFill: {
    height: "100%",
    background: "linear-gradient(90deg, #7c3aed, #a855f7, #ec4899, #f97316)",
    borderRadius: 100,
    transition: "width 0.05s linear",
    boxShadow: "0 0 10px rgba(168,85,247,0.6)"
  },
  hint: {
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(255,255,255,0.55)",
    maxWidth: 280,
    lineHeight: 1.5,
    fontStyle: "italic",
    minHeight: 36
  }
};

// CSS keyframes pour spinner (injecté localement car pas dans global.css)
(function () {
  if (typeof document === "undefined") return;
  if (document.getElementById("st-spinner-keyframes")) return;
  const style = document.createElement("style");
  style.id = "st-spinner-keyframes";
  style.textContent = "@keyframes st-spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(style);
})();
window.LoadingScreen = LoadingScreen;

/* ─────────────────────────────────────────────────────────── */

/* === src/components/HomeScreen.jsx === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — HomeScreen
   ═══════════════════════════════════════════════════════════════════
   Écran d'accueil principal :
     - Header : pièces or + jaune (couronnes/coins) + rang
     - Trophée 3D doré flottant au centre (animation float)
     - Bouton PLAY géant (vert, style 3D)
     - Boutons secondaires : Settings (⚙️), Stats/Leaderboard (📊),
       Boutique (🛒), Roue de la fortune (🎰)
     - Bandeau bas "NIVEAUX TRÉPIDANTS!" avec pièces décoratives

   Lit l'état global (props) :
     - profile : { coins, xp, rank, bestScore, boosters }
     - onNavigate(screen) : callback pour changer d'écran

   Pas d'écriture localStorage ici — c'est le rôle de App.jsx.
   ═══════════════════════════════════════════════════════════════════ */

const {
  useState: useStateHome
} = React;
function HomeScreen({
  profile,
  onNavigate
}) {
  const safe = profile || {};
  const coins = safe.coins ?? 0;
  const xp = safe.xp ?? 0;
  const bestScore = safe.bestScore ?? 0;

  // Calcul du rang à partir de l'XP
  const rank = computeRankFromXP(xp);
  return /*#__PURE__*/React.createElement("div", {
    style: SH.root
  }, /*#__PURE__*/React.createElement(Starfield, {
    count: 20
  }), /*#__PURE__*/React.createElement("div", {
    style: SH.header
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      justifySelf: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SH.coinsPill
  }, /*#__PURE__*/React.createElement("span", {
    style: SH.coinIcon
  }, "\uD83D\uDC51"), /*#__PURE__*/React.createElement("span", {
    style: SH.coinValue
  }, formatNum(coins)), /*#__PURE__*/React.createElement("button", {
    onClick: () => onNavigate && onNavigate("shop"),
    style: SH.coinPlus,
    "aria-label": "Acheter des pi\xE8ces"
  }, "+"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      justifySelf: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SH.rankBadge
  }, /*#__PURE__*/React.createElement("span", {
    style: SH.rankIcon
  }, rank.icon), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      lineHeight: 1.1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: SH.rankTitle
  }, rank.title), /*#__PURE__*/React.createElement("span", {
    style: SH.rankXP
  }, formatNum(xp), " XP")))), /*#__PURE__*/React.createElement("div", {
    style: {
      justifySelf: "end"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onNavigate && onNavigate("settings"),
    style: SH.iconBtn,
    "aria-label": "Param\xE8tres"
  }, "\u2699\uFE0F"))), /*#__PURE__*/React.createElement("div", {
    style: SH.trophyWrap,
    className: "float"
  }, /*#__PURE__*/React.createElement(Trophy, null), bestScore > 0 && /*#__PURE__*/React.createElement("div", {
    style: SH.bestScore
  }, "Record : ", /*#__PURE__*/React.createElement("strong", null, formatNum(bestScore)))), /*#__PURE__*/React.createElement("div", {
    style: SH.actionBar
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onNavigate && onNavigate("stats"),
    className: "btn-3d purple icon-only",
    style: SH.actionSide,
    "aria-label": "Classement"
  }, "\uD83D\uDCCA"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onNavigate && onNavigate("game"),
    className: "btn-3d",
    style: SH.playBtn
  }, "NEW GAME"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onNavigate && onNavigate("wheel"),
    className: "btn-3d gold icon-only",
    style: SH.actionSide,
    "aria-label": "Roue de la fortune"
  }, "\uD83C\uDFB0")), /*#__PURE__*/React.createElement("div", {
    style: SH.bottomBanner
  }, /*#__PURE__*/React.createElement("div", {
    style: SH.bannerText
  }, /*#__PURE__*/React.createElement("span", {
    style: SH.bannerLine1
  }, "NIVEAUX"), /*#__PURE__*/React.createElement("span", {
    style: SH.bannerLine2
  }, "TR\xC9PIDANTS !")), /*#__PURE__*/React.createElement(DecoPieces, null)));
}

/* ─── Trophée 3D doré (SVG inline pour ne dépendre d'aucune image) ── */
function Trophy() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "220",
    height: "240",
    viewBox: "0 0 220 240",
    style: {
      filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.45)) drop-shadow(0 0 32px rgba(124,58,237,0.4))"
    }
  }, /*#__PURE__*/React.createElement("ellipse", {
    cx: "110",
    cy: "222",
    rx: "78",
    ry: "14",
    fill: "rgba(0,0,0,0.4)"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "46",
    y: "180",
    width: "128",
    height: "36",
    rx: "6",
    fill: "#5b21b6"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "46",
    y: "180",
    width: "128",
    height: "12",
    rx: "6",
    fill: "#7c3aed"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "80",
    y: "155",
    width: "60",
    height: "28",
    fill: "#5b21b6",
    rx: "4"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "80",
    y: "155",
    width: "60",
    height: "8",
    fill: "#a855f7",
    rx: "4"
  }), /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "bowl",
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#9333ea"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#5b21b6"
  })), /*#__PURE__*/React.createElement("linearGradient", {
    id: "t-shape",
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#ffec80"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#ffd23f"
  }))), /*#__PURE__*/React.createElement("path", {
    d: "M 38 50 Q 38 30, 60 30 L 160 30 Q 182 30, 182 50 L 175 145 Q 170 165, 110 165 Q 50 165, 45 145 Z",
    fill: "url(#bowl)",
    stroke: "#3b0764",
    strokeWidth: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 65 60 L 155 60 L 155 80 L 125 80 L 125 145 L 95 145 L 95 80 L 65 80 Z",
    fill: "url(#t-shape)",
    stroke: "#b8860b",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 50 45 Q 50 38, 60 38 L 160 38",
    stroke: "rgba(255,255,255,0.4)",
    strokeWidth: "3",
    fill: "none",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement(Sparkle, {
    x: "20",
    y: "60",
    size: "6"
  }), /*#__PURE__*/React.createElement(Sparkle, {
    x: "195",
    y: "80",
    size: "5"
  }), /*#__PURE__*/React.createElement(Sparkle, {
    x: "15",
    y: "140",
    size: "4"
  }), /*#__PURE__*/React.createElement(Sparkle, {
    x: "200",
    y: "160",
    size: "6"
  }));
}
function Sparkle({
  x,
  y,
  size
}) {
  return /*#__PURE__*/React.createElement("g", {
    transform: `translate(${x},${y})`
  }, /*#__PURE__*/React.createElement("path", {
    d: `M 0 -${size} L ${size * 0.3} -${size * 0.3} L ${size} 0 L ${size * 0.3} ${size * 0.3} L 0 ${size} L -${size * 0.3} ${size * 0.3} L -${size} 0 L -${size * 0.3} -${size * 0.3} Z`,
    fill: "#fff",
    opacity: "0.9"
  }, /*#__PURE__*/React.createElement("animate", {
    attributeName: "opacity",
    values: "0.3;1;0.3",
    dur: "2s",
    repeatCount: "indefinite"
  })));
}

/* ─── Pièces décoratives en bas ───────────────────────────────── */
function DecoPieces() {
  return /*#__PURE__*/React.createElement("div", {
    style: SH.decoWrap
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...SH.decoPiece,
      transform: "rotate(-12deg)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplate: "repeat(2, 18px) / repeat(3, 18px)",
      gap: 1
    }
  }, [0, 0, 1, 1, 1, 1].map((v, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: v ? "var(--orange)" : "transparent",
      borderRadius: 2,
      boxShadow: v ? "inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.3)" : "none"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...SH.decoPiece,
      transform: "rotate(8deg)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplate: "repeat(2, 18px) / repeat(3, 18px)",
      gap: 1
    }
  }, [0, 1, 0, 1, 1, 1].map((v, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: v ? "var(--purple-l)" : "transparent",
      borderRadius: 2,
      boxShadow: v ? "inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.3)" : "none"
    }
  })))));
}

/* ─── Helpers ─────────────────────────────────────────────────── */
function formatNum(n) {
  const safeN = typeof n === "number" && isFinite(n) ? n : 0;
  return safeN.toLocaleString("fr-FR");
}
function computeRankFromXP(xp) {
  const x = Math.max(0, xp || 0);
  if (x >= 1000000) return {
    title: "GRAND MAÎTRE",
    icon: "👑",
    level: 8
  };
  if (x >= 500000) return {
    title: "LÉGENDE",
    icon: "👑",
    level: 7
  };
  if (x >= 150000) return {
    title: "MAÎTRE",
    icon: "💎",
    level: 6
  };
  if (x >= 50000) return {
    title: "DIAMANT",
    icon: "💎",
    level: 5
  };
  if (x >= 15000) return {
    title: "OR",
    icon: "🥇",
    level: 4
  };
  if (x >= 5000) return {
    title: "ARGENT",
    icon: "🥈",
    level: 3
  };
  if (x >= 1000) return {
    title: "BRONZE",
    icon: "🥉",
    level: 2
  };
  return {
    title: "RECRUE",
    icon: "🥉",
    level: 1
  };
}
const SH = {
  root: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    background: "radial-gradient(ellipse at top, #1a2a6e, #0b1238 70%)",
    overflow: "hidden"
  },
  header: {
    /* v1.2 fix : grid 3 colonnes égales = badge RECRUE vraiment centré */
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px",
    gap: 8,
    position: "relative",
    zIndex: 2
  },
  coinsPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    borderRadius: 100,
    padding: "6px 4px 6px 10px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 rgba(0,0,0,0.3)"
  },
  coinIcon: {
    fontSize: 18
  },
  coinValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 16,
    color: "var(--gold)",
    minWidth: 40,
    textAlign: "center",
    textShadow: "0 1px 0 rgba(0,0,0,0.4)"
  },
  coinPlus: {
    background: "var(--green)",
    color: "#fff",
    width: 28,
    height: 28,
    borderRadius: "50%",
    fontSize: 18,
    fontWeight: 800,
    boxShadow: "0 2px 0 var(--green-d), inset 0 1px 0 rgba(255,255,255,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1
  },
  rankBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "linear-gradient(180deg, var(--purple), var(--purple-d))",
    borderRadius: 14,
    padding: "6px 12px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 0 rgba(0,0,0,0.3)"
  },
  rankIcon: {
    fontSize: 22
  },
  rankTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 13,
    letterSpacing: 0.5,
    color: "#fff",
    textShadow: "0 1px 0 rgba(0,0,0,0.4)"
  },
  rankXP: {
    fontSize: 10,
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)"
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    fontSize: 22,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 rgba(0,0,0,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  trophyWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 280,
    position: "relative",
    zIndex: 2
  },
  bestScore: {
    marginTop: 8,
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(124,58,237,0.5)",
    borderRadius: 12,
    padding: "6px 16px",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700
  },
  actionBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "0 24px 24px",
    position: "relative",
    zIndex: 2
  },
  actionSide: {
    fontSize: 24,
    padding: 14,
    minWidth: 64
  },
  playBtn: {
    flex: 1,
    fontSize: "clamp(22px, 6vw, 30px)",
    padding: "20px 32px",
    letterSpacing: 1.5,
    minHeight: 64
  },
  bottomBanner: {
    position: "relative",
    background: "linear-gradient(180deg, #1e3a8a, #0b1238)",
    padding: "20px 24px calc(env(safe-area-inset-bottom, 0px) + 20px)",
    borderTop: "2px solid var(--purple)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    minHeight: 110
  },
  bannerText: {
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Lilita One', cursive",
    color: "#fff",
    textShadow: "0 3px 0 rgba(0,0,0,0.4), 0 6px 8px rgba(0,0,0,0.4)",
    lineHeight: 0.95
  },
  bannerLine1: {
    fontSize: "clamp(28px, 7vw, 40px)",
    letterSpacing: 1.5
  },
  bannerLine2: {
    fontSize: "clamp(22px, 5vw, 30px)",
    letterSpacing: 1,
    color: "var(--gold)",
    WebkitTextStroke: "1.5px #5b21b6"
  },
  decoWrap: {
    display: "flex",
    gap: 10
  },
  decoPiece: {
    padding: 4
  }
};
window.HomeScreen = HomeScreen;

/* ─────────────────────────────────────────────────────────── */

/* === src/components/GameScreen.jsx === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — GameScreen
   ═══════════════════════════════════════════════════════════════════
   Écran principal de jeu, orchestre :
     - HUD (score, niveau, combo, time, target, next, hold)
     - Canvas 2D (grille + pièce + ghost via STRender)
     - BoosterButtons (4 boosters)
     - Inputs tactiles : swipe gauche/droite/bas + tap rotate + slam
     - Inputs clavier : arrows + space (hard drop) + shift (hold) + Esc (pause)
     - Game loop (RAF) avec gravité auto par niveau
     - Pause modal (sur Esc ou bouton pause)

   Architecture :
     - state local (useState) pour UI éphémère (paused, message flash)
     - state du jeu dans une ref (useRef) pour éviter les re-renders coûteux
       à chaque frame. On force un re-render avec setTick (counter) après
       chaque mutation significative (pose, clear, level-up).

   Cleanup : cf. checklist senior #11 (RAF) + #12 (visibility pause).
   La pause auto onBlur / onVisibilityHidden est gérée par useGameLoop.
   ═══════════════════════════════════════════════════════════════════ */

const {
  useState: useStateGS,
  useRef: useRefGS,
  useEffect: useEffectGS,
  useCallback: useCallbackGS
} = React;
function GameScreen({
  onExitToHome,
  onGameOver,
  profile,
  onProfileChange
}) {
  const canvasRef = useRefGS(null);

  // ─── State du jeu (en ref pour perf, pas re-render à chaque frame)
  const gameRef = useRefGS(null);
  if (!gameRef.current) {
    gameRef.current = createInitialGameState();
  }

  // ─── Reset particules au mount (clean state entre 2 parties)
  useEffectGS(() => {
    if (window.STParticles) window.STParticles.clear();
    return () => {
      if (window.STParticles) window.STParticles.clear();
    };
  }, []);

  // ─── State UI (re-renders OK)
  const [tick, setTick] = useStateGS(0); // counter pour forcer re-render
  const [paused, setPaused] = useStateGS(false);
  const [flashRows, setFlashRows] = useStateGS([]);
  const [combo, setCombo] = useStateGS(0);
  const [floatScore, setFloatScore] = useStateGS(null); // {x,y,text}

  // ─── Inputs : swipes + clavier
  useEffectGS(() => {
    const onKey = e => {
      const G = gameRef.current;
      if (!G || G.gameOver) return;
      if (paused && e.code !== "Escape") return;
      switch (e.code) {
        case "ArrowLeft":
          if (movePiece(G, -1, 0)) {
            fxMove();
          }
          break;
        case "ArrowRight":
          if (movePiece(G, 1, 0)) {
            fxMove();
          }
          break;
        case "ArrowDown":
          if (movePiece(G, 0, 1)) {
            G.score += window.STScoring.softDropScore();
            fxMove();
          }
          break;
        case "ArrowUp":
        case "KeyX":
          if (rotatePiece(G, 1)) {
            fxRotate();
          }
          break;
        case "KeyZ":
          if (rotatePiece(G, -1)) {
            fxRotate();
          }
          break;
        case "Space":
          hardDrop(G);
          fxHardDrop();
          break;
        case "ShiftLeft":
        case "ShiftRight":
        case "KeyC":
          holdPiece(G);
          fxHold();
          break;
        case "Escape":
          setPaused(p => !p);
          break;
        default:
          return;
      }
      setTick(t => t + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused]);

  // ─── Touch controls : swipes + tap (rotate) + double-tap (hard drop)
  useEffectGS(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    let startX = 0,
      startY = 0,
      startT = 0,
      lastDy = 0,
      accDx = 0,
      accDy = 0;
    let lastTapTime = 0;
    const SENSITIVITY = 24; // px par cellule de mouvement

    const onStart = e => {
      const t = e.touches ? e.touches[0] : e;
      startX = t.clientX;
      startY = t.clientY;
      startT = Date.now();
      lastDy = 0;
      accDx = 0;
      accDy = 0;
    };
    const onMove = e => {
      const G = gameRef.current;
      if (!G || G.gameOver || paused) return;
      const t = e.touches ? e.touches[0] : e;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      // Mouvement horizontal
      while (Math.abs(dx - accDx) >= SENSITIVITY) {
        if (dx > accDx) {
          if (movePiece(G, 1, 0)) fxMove();
          accDx += SENSITIVITY;
        } else {
          if (movePiece(G, -1, 0)) fxMove();
          accDx -= SENSITIVITY;
        }
      }
      // Soft drop vers le bas
      if (dy - accDy >= SENSITIVITY) {
        while (dy - accDy >= SENSITIVITY) {
          if (movePiece(G, 0, 1)) {
            G.score += window.STScoring.softDropScore();
            fxMove();
          }
          accDy += SENSITIVITY;
        }
      }
      setTick(s => s + 1);
    };
    const onEnd = e => {
      const G = gameRef.current;
      if (!G || G.gameOver || paused) return;
      const t = e.changedTouches ? e.changedTouches[0] : e;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dur = Date.now() - startT;
      const total = Math.abs(dx) + Math.abs(dy);

      // Swipe vertical rapide vers le bas → hard drop
      if (dy > 80 && Math.abs(dy) > Math.abs(dx) * 1.5 && dur < 400) {
        hardDrop(G);
        fxHardDrop();
        setTick(s => s + 1);
        return;
      }
      // Tap court → rotate
      if (total < 16 && dur < 250) {
        const now = Date.now();
        if (now - lastTapTime < 300) {
          // Double-tap : hold
          holdPiece(G);
          fxHold();
          lastTapTime = 0;
        } else {
          if (rotatePiece(G, 1)) fxRotate();
          lastTapTime = now;
        }
        setTick(s => s + 1);
      }
    };
    cv.addEventListener("touchstart", onStart, {
      passive: true
    });
    cv.addEventListener("touchmove", onMove, {
      passive: true
    });
    cv.addEventListener("touchend", onEnd, {
      passive: true
    });
    cv.addEventListener("mousedown", onStart);
    cv.addEventListener("mousemove", e => {
      if (e.buttons) onMove(e);
    });
    cv.addEventListener("mouseup", onEnd);
    return () => {
      cv.removeEventListener("touchstart", onStart);
      cv.removeEventListener("touchmove", onMove);
      cv.removeEventListener("touchend", onEnd);
    };
  }, [paused]);

  // ─── Game loop : gravité automatique + particles update
  window.useGameLoop({
    active: !paused,
    onTick: deltaMs => {
      const G = gameRef.current;
      if (!G || G.gameOver) return;
      G.elapsedMs += deltaMs;

      // Particules : update systématique, même si freeze (pour FX continu)
      if (window.STParticles) window.STParticles.update(deltaMs);

      // Freeze booster : bloque la gravité (mais pas les inputs)
      if (window.STBoosters && window.STBoosters.isFrozen(G)) {
        setTick(t => t + 1);
        return;
      }
      G.dropAcc += deltaMs;
      const gravMs = window.STScoring.gravityMs(G.level);
      while (G.dropAcc >= gravMs) {
        G.dropAcc -= gravMs;
        if (!movePiece(G, 0, 1)) {
          // Pose impossible vers le bas → lock
          lockPieceFlow(G);
          if (G.gameOver) {
            handleGameOver(G);
            return;
          }
        }
      }
      setTick(t => t + 1);
    }
  });

  // ─── Render canvas après chaque tick
  useEffectGS(() => {
    const G = gameRef.current;
    const cv = canvasRef.current;
    if (!G || !cv || !window.STRender) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const cellSize = Math.floor(cv.width / window.STCore.COLS);
    const ghostY = G.piece ? window.STCore.dropToBottom(G.grid, G.piece) : null;
    window.STRender.drawBoard(ctx, {
      grid: G.grid,
      piece: G.piece,
      ghostY: ghostY,
      flashRows: flashRows
    }, {
      cellSize: cellSize,
      cols: window.STCore.COLS,
      rows: window.STCore.ROWS,
      showGhost: true
    });

    // Particules par-dessus le board (clear bursts, explosions, shockwaves)
    if (window.STParticles) window.STParticles.draw(ctx);

    // Voile freeze légèrement bleuté quand le booster est actif
    if (window.STBoosters && window.STBoosters.isFrozen(G)) {
      ctx.save();
      ctx.fillStyle = "rgba(6, 182, 212, 0.12)";
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.restore();
    }
  }, [tick, flashRows]);

  // ─── Game over handler
  const handleGameOver = useCallbackGS(G => {
    if (typeof onGameOver === "function") {
      const xpGain = window.STScoring.xpFromGame(G.score, G.linesTotal, G.level);
      const coinsGain = window.STScoring.coinsFromGame(G.score, G.linesTotal);
      onGameOver({
        score: G.score,
        linesTotal: G.linesTotal,
        level: G.level,
        timeMs: G.elapsedMs,
        xpGain: xpGain,
        coinsGain: coinsGain
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onGameOver]);

  // ─── Helpers de mutation (sur G ref, retournent true/false selon succès)
  function movePiece(G, dx, dy) {
    if (!G.piece) return false;
    const nx = G.piece.x + dx;
    const ny = G.piece.y + dy;
    if (window.STCore.collide(G.grid, G.piece, nx, ny)) return false;
    G.piece.x = nx;
    G.piece.y = ny;
    G.lastMoveWasRotation = false;
    return true;
  }
  function rotatePiece(G, dir) {
    if (!G.piece) return false;
    const r = window.STCore.rotatePiece(G.grid, G.piece, dir);
    if (r.ok) {
      G.piece = r.piece;
      G.lastMoveWasRotation = true;
      return true;
    }
    return false;
  }
  function hardDrop(G) {
    if (!G.piece) return;
    const targetY = window.STCore.dropToBottom(G.grid, G.piece);
    const fallen = targetY - G.piece.y;
    G.piece.y = targetY;
    G.score += window.STScoring.hardDropScore(fallen);
    G.lastMoveWasRotation = false;
    lockPieceFlow(G);
  }
  function holdPiece(G) {
    if (!G.piece || G.holdUsed) return;
    const cur = G.piece.name;
    if (G.hold) {
      G.piece = window.STCore.spawnPiece(G.hold, window.STCore.COLS);
    } else {
      G.piece = window.STCore.spawnPiece(window.STBag.drawNext(G), window.STCore.COLS);
    }
    G.hold = cur;
    G.holdUsed = true;
  }

  /** Pose la pièce, gère le scoring + clear + game over. */
  function lockPieceFlow(G) {
    if (!G.piece) return;
    const tspin = window.STCore.isTSpin(G.grid, G.piece, G.lastMoveWasRotation);
    G.grid = window.STCore.lock(G.grid, G.piece, G.piece.x, G.piece.y);

    // FX : lock (haptic + sound)
    fxLock();
    const prevLevel = G.level;
    const cleared = window.STCore.clearLines(G.grid);
    G.grid = cleared.grid;
    G.linesTotal += cleared.count;

    // Scoring
    const sc = window.STScoring.scoreFor({
      lines: cleared.count,
      isTSpin: tspin,
      level: G.level,
      combo: G.combo,
      b2b: G.b2b
    });
    G.score += sc.score;
    G.combo = sc.newCombo;
    G.b2b = sc.newB2B;

    // Combo state pour UI
    setCombo(G.combo);

    // Flash effect + FX sur les lignes effacées
    if (cleared.lines.length) {
      setFlashRows(cleared.lines);
      setTimeout(() => setFlashRows([]), 200);
      fxLineClear(cleared.count);
    }

    // Niveau auto basé sur les lignes + FX si level up
    G.level = window.STScoring.levelFromLines(G.linesTotal);
    if (G.level > prevLevel) fxLevelUp();

    // Spawn nouvelle pièce
    const nextName = window.STBag.drawNext(G);
    G.piece = window.STCore.spawnPiece(nextName, window.STCore.COLS);
    G.holdUsed = false;
    G.lastMoveWasRotation = false;

    // Game over check
    if (window.STCore.isGameOver(G.grid, G.piece)) {
      G.gameOver = true;
      fxGameOver();
    }
  }

  /* ─── FX helpers (audio + haptic + particles) ─────────────────
     Tous wrappés en try/catch implicite : si le module n'est pas
     chargé (ex: SSR ou fail du build), no-op silencieux.            */
  function fxMove() {
    if (window.STAudio) window.STAudio.play("move");
    if (window.STHaptics) window.STHaptics.vibePattern("move");
  }
  function fxRotate() {
    if (window.STAudio) window.STAudio.play("rotate");
    if (window.STHaptics) window.STHaptics.vibePattern("rotate");
  }
  function fxLock() {
    if (window.STAudio) window.STAudio.play("lock");
    if (window.STHaptics) window.STHaptics.vibePattern("lock");
  }
  function fxHardDrop() {
    if (window.STAudio) window.STAudio.play("hardDrop");
    if (window.STHaptics) window.STHaptics.vibePattern("hardDrop");
  }
  function fxHold() {
    if (window.STAudio) window.STAudio.play("hold");
  }
  function fxLevelUp() {
    if (window.STAudio) window.STAudio.play("levelUp");
    if (window.STHaptics) window.STHaptics.vibePattern("levelUp");
  }
  function fxGameOver() {
    if (window.STAudio) window.STAudio.play("gameOver");
    if (window.STHaptics) window.STHaptics.vibePattern("gameOver");
  }
  function fxLineClear(count) {
    const cv = canvasRef.current;
    if (cv && window.STParticles) {
      window.STParticles.addLineClearBurst(cv.width, cv.height, count);
    }
    if (window.STAudio) {
      const key = count >= 4 ? "tetris" : "line" + count;
      window.STAudio.play(key);
    }
    if (window.STHaptics) {
      window.STHaptics.vibePattern("line" + Math.min(4, count));
    }
  }

  /** Active un booster acheté (clic sur un BoosterButton). */
  function activateBooster(id) {
    const G = gameRef.current;
    if (!G || G.gameOver || paused || !window.STBoosters) return;
    const cv = canvasRef.current;
    const cellSize = cv ? Math.floor(cv.width / window.STCore.COLS) : 30;
    if (id === "freeze") {
      window.STBoosters.applyFreeze(G);
      if (window.STAudio) window.STAudio.play("booster");
      if (window.STHaptics) window.STHaptics.vibePattern("booster");
    } else if (id === "laser") {
      const r = window.STBoosters.applyLaser(G);
      if (cv && r.line >= 0 && window.STParticles) {
        const cy = r.line * cellSize + cellSize / 2;
        for (let x = 0; x < window.STCore.COLS; x++) {
          window.STParticles.addExplosion(x * cellSize + cellSize / 2, cy, "#facc15");
        }
      }
      if (window.STAudio) window.STAudio.play("booster");
      if (window.STHaptics) window.STHaptics.vibePattern("booster");
    } else if (id === "meteor") {
      const r = window.STBoosters.applyMeteor(G, 5);
      if (cv && window.STParticles) {
        r.cells.forEach(function (cell) {
          const px = cell.x * cellSize + cellSize / 2;
          const py = cell.y * cellSize + cellSize / 2;
          window.STParticles.addShockwave(px, py);
          window.STParticles.addExplosion(px, py, "#f97316");
        });
      }
      if (window.STAudio) window.STAudio.play("booster");
      if (window.STHaptics) window.STHaptics.vibePattern("booster");
    } else if (id === "magnet") {
      const r = window.STBoosters.applyMagnet(G);
      if (cv && window.STParticles && r.cellsMoved > 0) {
        for (let x = 0; x < window.STCore.COLS; x++) {
          window.STParticles.addExplosion(x * cellSize + cellSize / 2, cv.height - cellSize, "#ec4899");
        }
      }
      if (window.STAudio) window.STAudio.play("booster");
      if (window.STHaptics) window.STHaptics.vibePattern("booster");
    }
    setTick(t => t + 1);
  }
  const G = gameRef.current;
  return /*#__PURE__*/React.createElement("div", {
    style: SGS.root
  }, window.HUD && /*#__PURE__*/React.createElement(window.HUD, {
    time: G.elapsedMs,
    targetLines: G.targetLines,
    currentLines: G.linesTotal,
    score: G.score,
    level: G.level,
    combo: G.combo,
    nextPiece: G.queue && G.queue[0] || null,
    holdPiece: G.hold
  }), /*#__PURE__*/React.createElement("div", {
    style: SGS.controlsRow
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setPaused(p => !p),
    style: SGS.smallBtn,
    "aria-label": "Pause"
  }, paused ? "▶" : "⏸"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (window.confirm("Quitter la partie ?")) {
        if (typeof onExitToHome === "function") onExitToHome();
      }
    },
    style: SGS.smallBtn,
    "aria-label": "Accueil"
  }, "\uD83C\uDFE0")), /*#__PURE__*/React.createElement("div", {
    style: SGS.canvasWrap
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    width: 400,
    height: 800,
    style: SGS.canvas
  }), combo >= 2 && /*#__PURE__*/React.createElement("div", {
    style: SGS.comboBanner,
    className: "pop-in",
    key: "combo" + combo
  }, "COMBO ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--gold)"
    }
  }, combo))), window.BoosterButtons && /*#__PURE__*/React.createElement(window.BoosterButtons, {
    inventory: profile && profile.boosters || {},
    cooldowns: {},
    onUse: id => {
      activateBooster(id);
      if (typeof onProfileChange === "function") {
        onProfileChange(p => ({
          ...p,
          boosters: {
            ...(p && p.boosters || {}),
            [id]: Math.max(0, ((p && p.boosters || {})[id] || 0) - 1)
          }
        }));
      }
    },
    onBuy: id => {
      window.alert("Boutique disponible bientôt !");
    },
    disabled: paused || G.gameOver
  }), paused && /*#__PURE__*/React.createElement("div", {
    style: SGS.pauseOverlay,
    onClick: () => setPaused(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: SGS.pauseCard,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: SGS.pauseTitle
  }, "PAUSE"), /*#__PURE__*/React.createElement("button", {
    className: "btn-3d",
    style: {
      width: "100%",
      marginBottom: 12
    },
    onClick: () => setPaused(false)
  }, "Reprendre"), /*#__PURE__*/React.createElement("button", {
    className: "btn-3d purple",
    style: {
      width: "100%"
    },
    onClick: () => onExitToHome && onExitToHome()
  }, "Accueil"))));
}

/* ─── Initial state ──────────────────────────────────────────── */
function createInitialGameState() {
  const queue = window.STBag ? window.STBag.initQueue() : [];
  const firstName = queue.shift();
  const grid = window.STCore ? window.STCore.createGrid() : [];
  const piece = firstName && window.STCore ? window.STCore.spawnPiece(firstName, window.STCore.COLS) : null;
  return {
    grid: grid,
    piece: piece,
    queue: queue,
    hold: null,
    holdUsed: false,
    score: 0,
    level: 1,
    linesTotal: 0,
    combo: 0,
    b2b: false,
    elapsedMs: 0,
    dropAcc: 0,
    targetLines: 999,
    // mode marathon : pas de cible
    lastMoveWasRotation: false,
    gameOver: false
  };
}

/* ─── Styles ─────────────────────────────────────────────────── */
const SGS = {
  root: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    background: "radial-gradient(ellipse at top, #1a2a6e, #0b1238 70%)"
  },
  controlsRow: {
    display: "flex",
    gap: 8,
    padding: "0 8px 8px",
    justifyContent: "flex-end"
  },
  smallBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    fontSize: 18,
    color: "#fff",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 0 rgba(0,0,0,0.25)"
  },
  canvasWrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    minHeight: 0,
    padding: "2px 4px"
  },
  canvas: {
    background: "var(--canvas-bg1)",
    borderRadius: 10,
    boxShadow: "0 0 24px rgba(124,58,237,0.5), inset 0 0 0 3px rgba(124,58,237,0.7)",
    touchAction: "none",
    /* v1.5 : encore plus grand (HUD condensé en 2 rangées au lieu de 3).
       HUD ~140px + boosters ~100px + marges ~20px ≈ 260px à retirer.
       Sur 1920×1080 → ~410×820 (vs 530×1060 ratio idéal mais limité
       par maxWidth = viewport). Sur mobile portrait full-width. */
    height: "min(calc(100vh - 250px), calc((100vw - 24px) * 2), 95vh)",
    width: "auto",
    aspectRatio: "1 / 2",
    maxWidth: "calc(100vw - 24px)",
    minHeight: "480px"
  },
  comboBanner: {
    position: "absolute",
    left: 0,
    top: "20%",
    background: "linear-gradient(90deg, var(--blue), var(--sky))",
    color: "#fff",
    padding: "8px 22px 8px 14px",
    fontFamily: "'Lilita One', cursive",
    fontSize: 22,
    letterSpacing: 1,
    clipPath: "polygon(0 0, 100% 0, 92% 100%, 0 100%)",
    boxShadow: "0 4px 0 rgba(0,0,0,0.3)",
    pointerEvents: "none"
  },
  pauseOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    backdropFilter: "blur(4px)"
  },
  pauseCard: {
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "2px solid var(--purple)",
    borderRadius: 18,
    padding: 24,
    minWidth: 260,
    boxShadow: "0 12px 32px rgba(0,0,0,0.5)"
  },
  pauseTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 36,
    color: "var(--gold)",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 4,
    textShadow: "0 3px 0 rgba(0,0,0,0.3)"
  }
};
window.GameScreen = GameScreen;

/* ─────────────────────────────────────────────────────────── */

/* === src/components/GameOverScreen.jsx === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — GameOverScreen
   ═══════════════════════════════════════════════════════════════════
   Affiché quand la pièce ne peut plus spawner (top out).

   Design fidèle aux screenshots Tetris officiel :
     - Header : badge coins + bouton X (close)
     - Médaillon central : bouclier violet avec icône (épées croisées
       ou trophée selon le score)
     - Titre "BLOCK OUT" en gros (Lilita One)
     - Sous-titre : "Essayez encore, vous allez y arriver !" / "Nouveau
       record !" / etc.
     - Stats : Classement local + Record perso historique
     - Section "Your Rewards" : XP gagnée + coins gagnés + boosters
       gagnés au passage de niveau
     - Bouton "VOIR PUB POUR CONTINUER" (en haut, optionnel) — RewardedAd
     - Bouton géant vert "RÉESSAYER"
     - Bouton secondaire "Accueil"
   ═══════════════════════════════════════════════════════════════════ */

const {
  useState: useStateGO,
  useEffect: useEffectGO
} = React;
function GameOverScreen({
  result,
  profile,
  onRetry,
  onContinueWithAd,
  onHome
}) {
  const r = result || {};
  const score = r.score ?? 0;
  const linesTotal = r.linesTotal ?? 0;
  const level = r.level ?? 1;
  const xpGain = r.xpGain ?? 0;
  const coinsGain = r.coinsGain ?? 0;
  const oldBest = profile && profile.bestScore || 0;
  const newRecord = score > oldBest;
  const bestForDisplay = Math.max(oldBest, score);

  // V1 : on autorise 1 seul "Continue via pub" par partie
  const [continueUsed, setContinueUsed] = useStateGO(false);
  return /*#__PURE__*/React.createElement("div", {
    style: SGO.root
  }, /*#__PURE__*/React.createElement(Starfield, {
    count: 20
  }), /*#__PURE__*/React.createElement("div", {
    style: SGO.header
  }, /*#__PURE__*/React.createElement("div", {
    style: SGO.coinsPill
  }, /*#__PURE__*/React.createElement("span", {
    style: SGO.coinIcon
  }, "\uD83D\uDC51"), /*#__PURE__*/React.createElement("span", {
    style: SGO.coinValue
  }, formatNum(profile && profile.coins || 0))), /*#__PURE__*/React.createElement("button", {
    onClick: onHome,
    style: SGO.closeBtn,
    "aria-label": "Accueil"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: SGO.medallion,
    className: "pop-in"
  }, /*#__PURE__*/React.createElement(Shield, {
    newRecord: newRecord
  })), /*#__PURE__*/React.createElement("div", {
    style: SGO.title
  }, newRecord ? "NEW RECORD" : "BLOCK OUT"), /*#__PURE__*/React.createElement("div", {
    style: SGO.subtitle
  }, newRecord ? "Bravo, tu viens de battre ton record !" : "Essayez encore, vous allez y arriver !"), /*#__PURE__*/React.createElement("div", {
    style: SGO.statsBlock
  }, /*#__PURE__*/React.createElement(StatRow, {
    label: "Score",
    value: formatNum(score),
    accent: true
  }), /*#__PURE__*/React.createElement(StatRow, {
    label: "Lignes effac\xE9es",
    value: linesTotal
  }), /*#__PURE__*/React.createElement(StatRow, {
    label: "Niveau atteint",
    value: level
  }), /*#__PURE__*/React.createElement(StatRow, {
    label: "Record personnel",
    value: formatNum(bestForDisplay),
    highlight: newRecord
  })), /*#__PURE__*/React.createElement("div", {
    style: SGO.rewardsTitle
  }, "R\xE9compenses"), /*#__PURE__*/React.createElement("div", {
    style: SGO.rewardsRow
  }, /*#__PURE__*/React.createElement(RewardChip, {
    icon: "\u2B50",
    label: "XP",
    value: "+" + formatNum(xpGain)
  }), /*#__PURE__*/React.createElement(RewardChip, {
    icon: "\uD83D\uDC51",
    label: "Pi\xE8ces",
    value: "+" + formatNum(coinsGain)
  })), !continueUsed && typeof onContinueWithAd === "function" && /*#__PURE__*/React.createElement("button", {
    style: SGO.continueBtn,
    onClick: () => {
      setContinueUsed(true);
      onContinueWithAd();
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      marginRight: 8
    }
  }, "\uD83D\uDCFA"), /*#__PURE__*/React.createElement("span", null, "Voir une pub pour continuer")), /*#__PURE__*/React.createElement("button", {
    className: "btn-3d",
    style: SGO.retryBtn,
    onClick: onRetry
  }, "R\xC9ESSAYER"), /*#__PURE__*/React.createElement("button", {
    className: "btn-3d purple",
    style: SGO.homeBtn,
    onClick: onHome
  }, "Accueil"));
}

/* ─── Sub-components ──────────────────────────────────────────── */
function Shield({
  newRecord
}) {
  // SVG bouclier violet avec épées croisées (matches le screenshot)
  return /*#__PURE__*/React.createElement("svg", {
    width: "180",
    height: "180",
    viewBox: "0 0 180 180",
    style: {
      filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "shieldGrad",
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#a855f7"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#5b21b6"
  })), /*#__PURE__*/React.createElement("linearGradient", {
    id: "centerGrad",
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#f97316"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#c2410c"
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: "90",
    cy: "90",
    r: "84",
    fill: "url(#shieldGrad)",
    stroke: "#3b0764",
    strokeWidth: "4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "90",
    cy: "90",
    r: "74",
    fill: "none",
    stroke: "#cbd5e1",
    strokeWidth: "6",
    opacity: "0.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "90",
    cy: "90",
    r: "55",
    fill: "url(#centerGrad)",
    stroke: "#7c2d12",
    strokeWidth: "3"
  }), newRecord ?
  /*#__PURE__*/
  // Trophée pour record
  React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
    d: "M 70 65 L 110 65 L 110 75 L 100 75 L 100 100 L 110 100 L 110 110 L 70 110 L 70 100 L 80 100 L 80 75 L 70 75 Z",
    fill: "#ffd23f",
    stroke: "#92400e",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 80 110 L 100 110 L 100 130 L 80 130 Z",
    fill: "#ffd23f",
    stroke: "#92400e",
    strokeWidth: "2"
  })) :
  /*#__PURE__*/
  // Épées croisées (game over standard)
  React.createElement("g", null, /*#__PURE__*/React.createElement("g", {
    transform: "rotate(45, 90, 90)"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "86",
    y: "40",
    width: "8",
    height: "60",
    fill: "#cbd5e1",
    stroke: "#475569",
    strokeWidth: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "80",
    y: "100",
    width: "20",
    height: "6",
    fill: "#fbbf24",
    stroke: "#92400e",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "84",
    y: "106",
    width: "12",
    height: "14",
    fill: "#dc2626",
    stroke: "#7f1d1d",
    strokeWidth: "1"
  })), /*#__PURE__*/React.createElement("g", {
    transform: "rotate(-45, 90, 90)"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "86",
    y: "40",
    width: "8",
    height: "60",
    fill: "#cbd5e1",
    stroke: "#475569",
    strokeWidth: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "80",
    y: "100",
    width: "20",
    height: "6",
    fill: "#fbbf24",
    stroke: "#92400e",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "84",
    y: "106",
    width: "12",
    height: "14",
    fill: "#dc2626",
    stroke: "#7f1d1d",
    strokeWidth: "1"
  }))));
}
function StatRow({
  label,
  value,
  accent,
  highlight
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...SGO.statRow,
      ...(highlight ? SGO.statRowNew : {})
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: SGO.statLabel
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      ...SGO.statValue,
      color: accent ? "var(--gold)" : highlight ? "var(--gold)" : "#fff",
      fontSize: accent ? 22 : 16
    }
  }, value));
}
function RewardChip({
  icon,
  label,
  value
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: SGO.chip
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      lineHeight: 1.1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "rgba(255,255,255,0.6)",
      fontWeight: 600
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "'Lilita One', cursive",
      fontSize: 18,
      color: "var(--gold)"
    }
  }, value)));
}

/* ─── Helpers ─────────────────────────────────────────────── */
function formatNum(n) {
  const safe = typeof n === "number" && isFinite(n) ? n : 0;
  return safe.toLocaleString("fr-FR");
}
const SGO = {
  root: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px calc(env(safe-area-inset-bottom, 0px) + 16px)",
    overflowY: "auto",
    background: "radial-gradient(ellipse at center, #1a2a6e 0%, #0b1238 70%)"
  },
  header: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20
  },
  coinsPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    borderRadius: 100,
    padding: "6px 16px 6px 10px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 rgba(0,0,0,0.3)"
  },
  coinIcon: {
    fontSize: 18
  },
  coinValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 16,
    color: "var(--gold)",
    minWidth: 40,
    textAlign: "center"
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(180deg, var(--blue), #1e40af)",
    border: "1.5px solid var(--sky)",
    fontSize: 18,
    color: "#fff",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 0 rgba(0,0,0,0.3)"
  },
  medallion: {
    margin: "10px 0 16px"
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: "clamp(36px, 9vw, 50px)",
    color: "#fff",
    letterSpacing: 3,
    textShadow: "0 4px 0 rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.4)",
    marginBottom: 6,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: 600
  },
  statsBlock: {
    width: "100%",
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 24
  },
  statRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    background: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    border: "1px solid rgba(124,58,237,0.4)"
  },
  statRowNew: {
    background: "linear-gradient(180deg, rgba(255,210,63,0.2), rgba(255,210,63,0.05))",
    border: "1.5px solid var(--gold)"
  },
  statLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: 700
  },
  statValue: {
    fontFamily: "'Lilita One', cursive",
    color: "#fff"
  },
  rewardsTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 20,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 1
  },
  rewardsRow: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
    justifyContent: "center"
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    borderRadius: 14,
    padding: "10px 16px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 rgba(0,0,0,0.3)",
    minWidth: 130
  },
  continueBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 360,
    padding: "14px 18px",
    background: "linear-gradient(180deg, var(--orange), #c2410c)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    borderRadius: 14,
    border: "1.5px solid #fb923c",
    marginBottom: 12,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 0 rgba(0,0,0,0.3)",
    fontFamily: "'Nunito', sans-serif"
  },
  retryBtn: {
    width: "100%",
    maxWidth: 360,
    fontSize: 24,
    padding: "18px 24px",
    marginBottom: 12,
    letterSpacing: 1
  },
  homeBtn: {
    width: "100%",
    maxWidth: 360,
    fontSize: 16,
    padding: "12px 24px"
  }
};
window.GameOverScreen = GameOverScreen;

/* ─────────────────────────────────────────────────────────── */

/* === src/components/FortuneWheel.jsx === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — FortuneWheel
   ═══════════════════════════════════════════════════════════════════
   Roue de la fortune avec :
     - 8 segments colorés (récompenses variées)
     - Animation rotation 4-5s avec easing easeOutCubic
     - 1 spin gratuit toutes les 24h (timestamp localStorage)
     - Spin payant : 50 pièces or
     - Pop-up de victoire avec récompense gagnée

   Récompenses possibles (avec probabilités pondérées) :
     - 50 pièces or (commun)
     - 100 pièces or (commun)
     - 1× freeze (commun)
     - 1× laser (commun)
     - 1× meteor (rare)
     - 1× magnet (rare)
     - 250 pièces or (rare)
     - JACKPOT : 1000 pièces or (epique)
   ═══════════════════════════════════════════════════════════════════ */

const {
  useState: useStateFW,
  useRef: useRefFW,
  useEffect: useEffectFW
} = React;
const SEGMENTS = [{
  id: "coins50",
  label: "50",
  icon: "👑",
  color: "#7c3aed",
  reward: {
    coins: 50
  },
  weight: 24
}, {
  id: "freeze1",
  label: "Freeze",
  icon: "❄️",
  color: "#06b6d4",
  reward: {
    boosters: {
      freeze: 1
    }
  },
  weight: 16
}, {
  id: "coins100",
  label: "100",
  icon: "👑",
  color: "#22c55e",
  reward: {
    coins: 100
  },
  weight: 18
}, {
  id: "laser1",
  label: "Laser",
  icon: "⚡",
  color: "#facc15",
  reward: {
    boosters: {
      laser: 1
    }
  },
  weight: 16
}, {
  id: "meteor1",
  label: "Meteor",
  icon: "☄️",
  color: "#f97316",
  reward: {
    boosters: {
      meteor: 1
    }
  },
  weight: 8
}, {
  id: "coins250",
  label: "250",
  icon: "👑",
  color: "#ec4899",
  reward: {
    coins: 250
  },
  weight: 8
}, {
  id: "magnet1",
  label: "Magnet",
  icon: "🧲",
  color: "#a855f7",
  reward: {
    boosters: {
      magnet: 1
    }
  },
  weight: 8
}, {
  id: "jackpot",
  label: "JACKPOT",
  icon: "💎",
  color: "#fbbf24",
  reward: {
    coins: 1000
  },
  weight: 2
}];
const FREE_SPIN_INTERVAL_MS = 24 * 3600 * 1000; // 24h
const SPIN_COST_COINS = 50;
function FortuneWheel({
  profile,
  onClose,
  onReward
}) {
  const [angle, setAngle] = useStateFW(0);
  const [spinning, setSpinning] = useStateFW(false);
  const [resultIdx, setResultIdx] = useStateFW(null);
  const [showResult, setShowResult] = useStateFW(false);
  const safe = profile || {};
  const lastFreeSpinTs = safe.wheelLastFree || 0;
  const now = Date.now();
  const freeSpinReady = now - lastFreeSpinTs >= FREE_SPIN_INTERVAL_MS;
  const hasEnoughCoins = (safe.coins || 0) >= SPIN_COST_COINS;

  // Compteur pour le prochain spin gratuit (mm:ss)
  const [waitText, setWaitText] = useStateFW(formatRemaining(lastFreeSpinTs));
  useEffectFW(() => {
    if (freeSpinReady) return;
    const id = setInterval(() => setWaitText(formatRemaining(lastFreeSpinTs)), 1000);
    return () => clearInterval(id);
  }, [lastFreeSpinTs, freeSpinReady]);
  function formatRemaining(lastTs) {
    const remaining = FREE_SPIN_INTERVAL_MS - (Date.now() - (lastTs || 0));
    if (remaining <= 0) return "Disponible !";
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor(remaining % 3600000 / 60000);
    const s = Math.floor(remaining % 60000 / 1000);
    if (h > 0) return h + "h " + String(m).padStart(2, "0") + "m";
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }
  function pickWeighted() {
    const total = SEGMENTS.reduce((acc, s) => acc + s.weight, 0);
    let r = Math.random() * total;
    for (let i = 0; i < SEGMENTS.length; i++) {
      r -= SEGMENTS[i].weight;
      if (r <= 0) return i;
    }
    return 0;
  }
  function doSpin(isFree) {
    if (spinning) return;
    const idx = pickWeighted();
    setResultIdx(idx);
    setSpinning(true);
    setShowResult(false);

    // Calcul de l'angle final : on tourne plusieurs fois puis on arrête
    // pour que le pointeur (en haut, 0°) tombe sur le segment idx.
    // Chaque segment fait 360/8 = 45°.
    const segAngle = 360 / SEGMENTS.length;
    const targetAngle = 360 - idx * segAngle - segAngle / 2;
    const fullRotations = 5; // rotations complètes
    const finalAngle = angle + fullRotations * 360 + (360 - angle % 360 + targetAngle) % 360;
    setAngle(finalAngle);

    // Délai = durée animation CSS
    setTimeout(() => {
      setSpinning(false);
      setShowResult(true);
      // Notifie le parent
      const seg = SEGMENTS[idx];
      if (typeof onReward === "function") {
        onReward({
          isFree: isFree,
          segment: seg,
          reward: seg.reward
        });
      }
    }, 4500);
  }
  return /*#__PURE__*/React.createElement("div", {
    style: SFW.root
  }, /*#__PURE__*/React.createElement("div", {
    style: SFW.header
  }, /*#__PURE__*/React.createElement("div", {
    style: SFW.title
  }, "\uD83C\uDFB0 Roue de la fortune"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: SFW.closeBtn,
    "aria-label": "Fermer"
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: SFW.wheelWrap
  }, /*#__PURE__*/React.createElement(Wheel, {
    angle: angle,
    segments: SEGMENTS
  }), /*#__PURE__*/React.createElement("div", {
    style: SFW.pointer
  }, "\u25BC")), /*#__PURE__*/React.createElement("div", {
    style: SFW.buttonsCol
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-3d",
    style: {
      ...SFW.spinBtn,
      opacity: !freeSpinReady || spinning ? 0.5 : 1,
      cursor: !freeSpinReady || spinning ? "not-allowed" : "pointer"
    },
    disabled: !freeSpinReady || spinning,
    onClick: () => doSpin(true)
  }, spinning ? "..." : freeSpinReady ? "TOURNER (gratuit)" : "Prochain : " + waitText), /*#__PURE__*/React.createElement("button", {
    className: "btn-3d gold",
    style: {
      ...SFW.spinBtn,
      opacity: !hasEnoughCoins || spinning ? 0.5 : 1,
      cursor: !hasEnoughCoins || spinning ? "not-allowed" : "pointer"
    },
    disabled: !hasEnoughCoins || spinning,
    onClick: () => doSpin(false)
  }, spinning ? "..." : "TOURNER (" + SPIN_COST_COINS + " 👑)")), showResult && resultIdx !== null && /*#__PURE__*/React.createElement("div", {
    style: SFW.resultOverlay,
    onClick: () => {
      setShowResult(false);
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: SFW.resultCard,
    className: "pop-in",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: SFW.resultIcon
  }, SEGMENTS[resultIdx].icon), /*#__PURE__*/React.createElement("div", {
    style: SFW.resultText
  }, SEGMENTS[resultIdx].id === "jackpot" ? "JACKPOT !!!" : "Bravo !"), /*#__PURE__*/React.createElement("div", {
    style: SFW.resultReward
  }, "Tu gagnes ", /*#__PURE__*/React.createElement("strong", null, SEGMENTS[resultIdx].label), SEGMENTS[resultIdx].reward.coins ? " pièces" : "", " !"), /*#__PURE__*/React.createElement("button", {
    className: "btn-3d",
    style: {
      width: "100%"
    },
    onClick: () => setShowResult(false)
  }, "R\xE9cup\xE9rer"))));
}

/* ─── Wheel SVG ──────────────────────────────────────────── */
function Wheel({
  angle,
  segments
}) {
  const radius = 130;
  const cx = 150,
    cy = 150;
  const segAngle = 360 / segments.length;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 300,
      height: 300,
      transition: "transform 4.5s cubic-bezier(0.17, 0.67, 0.16, 0.99)",
      transform: "rotate(" + angle + "deg)",
      filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 300 300",
    width: "300",
    height: "300"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("radialGradient", {
    id: "wheel-bg",
    cx: "50%",
    cy: "50%",
    r: "50%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#1a2a6e"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#0b1238"
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: radius + 10,
    fill: "#3b0764",
    stroke: "#5b21b6",
    strokeWidth: "4"
  }), segments.map((seg, i) => {
    const startAngle = i * segAngle - 90 - segAngle / 2; // pointeur en haut
    const endAngle = startAngle + segAngle;
    const path = arcPath(cx, cy, radius, startAngle, endAngle);
    const labelAngle = startAngle + segAngle / 2;
    const labelX = cx + Math.cos(labelAngle * Math.PI / 180) * (radius * 0.65);
    const labelY = cy + Math.sin(labelAngle * Math.PI / 180) * (radius * 0.65);
    return /*#__PURE__*/React.createElement("g", {
      key: seg.id
    }, /*#__PURE__*/React.createElement("path", {
      d: path,
      fill: seg.color,
      stroke: "#3b0764",
      strokeWidth: "2"
    }), /*#__PURE__*/React.createElement("text", {
      x: labelX,
      y: labelY,
      textAnchor: "middle",
      fontSize: "22",
      fill: "#fff",
      stroke: "#000",
      strokeWidth: "0.6",
      style: {
        fontFamily: "'Lilita One', cursive"
      },
      transform: "rotate(" + (labelAngle + 90) + " " + labelX + " " + labelY + ")"
    }, seg.icon), /*#__PURE__*/React.createElement("text", {
      x: labelX,
      y: labelY + 22,
      textAnchor: "middle",
      fontSize: "11",
      fontWeight: "800",
      fill: "#fff",
      style: {
        fontFamily: "Nunito, sans-serif"
      },
      transform: "rotate(" + (labelAngle + 90) + " " + labelX + " " + (labelY + 22) + ")"
    }, seg.label));
  }), /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: "20",
    fill: "var(--gold)",
    stroke: "#92400e",
    strokeWidth: "3"
  }), /*#__PURE__*/React.createElement("text", {
    x: cx,
    y: cy + 6,
    textAnchor: "middle",
    fontSize: "20"
  }, "\uD83C\uDFAF")));
}
function arcPath(cx, cy, r, startDeg, endDeg) {
  const start = polar(cx, cy, r, endDeg);
  const end = polar(cx, cy, r, startDeg);
  const largeArc = endDeg - startDeg <= 180 ? "0" : "1";
  return ["M", cx, cy, "L", start.x, start.y, "A", r, r, 0, largeArc, 0, end.x, end.y, "Z"].join(" ");
}
function polar(cx, cy, r, deg) {
  const rad = deg * Math.PI / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}
const SFW = {
  root: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(6px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px calc(env(safe-area-inset-bottom, 0px) + 16px)",
    overflowY: "auto",
    zIndex: 100
  },
  header: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 24,
    color: "var(--gold)",
    letterSpacing: 1,
    textShadow: "0 3px 0 rgba(0,0,0,0.4)"
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    fontSize: 18,
    color: "#fff",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 0 rgba(0,0,0,0.25)"
  },
  wheelWrap: {
    position: "relative",
    margin: "10px 0 24px"
  },
  pointer: {
    position: "absolute",
    top: -10,
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: 36,
    color: "var(--gold)",
    textShadow: "0 4px 0 #92400e",
    pointerEvents: "none"
  },
  buttonsCol: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "100%",
    maxWidth: 360
  },
  spinBtn: {
    width: "100%",
    fontSize: 16,
    padding: "14px 20px",
    letterSpacing: 0.5
  },
  resultOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 200
  },
  resultCard: {
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "2.5px solid var(--gold)",
    borderRadius: 18,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    textAlign: "center",
    boxShadow: "0 12px 32px rgba(0,0,0,0.6), 0 0 24px rgba(255,210,63,0.4)"
  },
  resultIcon: {
    fontSize: 80,
    marginBottom: 12
  },
  resultText: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 32,
    color: "var(--gold)",
    letterSpacing: 1,
    marginBottom: 8,
    textShadow: "0 3px 0 rgba(0,0,0,0.4)"
  },
  resultReward: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 20
  }
};
window.FortuneWheel = FortuneWheel;

/* ─────────────────────────────────────────────────────────── */

/* === src/components/SettingsScreen.jsx === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — SettingsScreen
   ═══════════════════════════════════════════════════════════════════
   Écran paramètres avec :
     - Son (toggle on/off)
     - Vibration (toggle on/off)
     - Langue (FR / EN, dropdown — extensible à 12 langues V2)
     - Thème (sombre / clair)
     - Reset des données (avec double confirmation)
     - Crédits & version

   Props :
     - settings : { sound, vibro, lang, theme }
     - onChange : (next) => void
     - onClose  : () => void
     - onReset  : () => void  (clear localStorage)
   ═══════════════════════════════════════════════════════════════════ */

const {
  useState: useStateSS
} = React;
function SettingsScreen({
  settings,
  onChange,
  onClose,
  onReset
}) {
  const s = settings || {
    sound: true,
    vibro: true,
    lang: "fr",
    theme: "dark"
  };
  const [confirmReset, setConfirmReset] = useStateSS(false);
  function update(patch) {
    if (typeof onChange === "function") {
      onChange({
        ...s,
        ...patch
      });
    }
  }
  return /*#__PURE__*/React.createElement("div", {
    style: SS.root
  }, /*#__PURE__*/React.createElement(Starfield, {
    count: 16
  }), /*#__PURE__*/React.createElement("div", {
    style: SS.header
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: SS.backBtn,
    "aria-label": "Retour"
  }, "\u2190"), /*#__PURE__*/React.createElement("div", {
    style: SS.title
  }, "Param\xE8tres"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40
    }
  }), " "), /*#__PURE__*/React.createElement("div", {
    style: SS.content
  }, /*#__PURE__*/React.createElement(Section, {
    title: "Audio & vibration"
  }, /*#__PURE__*/React.createElement(Row, {
    label: "Son",
    description: "Effets sonores et musique",
    control: /*#__PURE__*/React.createElement(Toggle, {
      on: s.sound,
      onChange: v => update({
        sound: v
      })
    })
  }), /*#__PURE__*/React.createElement(Row, {
    label: "Vibration",
    description: "Retour haptique sur Android",
    control: /*#__PURE__*/React.createElement(Toggle, {
      on: s.vibro,
      onChange: v => update({
        vibro: v
      })
    })
  })), /*#__PURE__*/React.createElement(Section, {
    title: "Langue"
  }, /*#__PURE__*/React.createElement(Row, {
    label: "Langue de l'app",
    control: /*#__PURE__*/React.createElement("select", {
      style: SS.select,
      value: s.lang,
      onChange: e => update({
        lang: e.target.value
      })
    }, /*#__PURE__*/React.createElement("option", {
      value: "fr"
    }, "\uD83C\uDDEB\uD83C\uDDF7 Fran\xE7ais"), /*#__PURE__*/React.createElement("option", {
      value: "en"
    }, "\uD83C\uDDEC\uD83C\uDDE7 English"))
  })), /*#__PURE__*/React.createElement(Section, {
    title: "Donn\xE9es"
  }, /*#__PURE__*/React.createElement("button", {
    style: SS.dangerBtn,
    onClick: () => {
      if (!confirmReset) {
        setConfirmReset(true);
        return;
      }
      if (typeof onReset === "function") onReset();
      setConfirmReset(false);
    }
  }, confirmReset ? "⚠️ Vraiment effacer ? Cliquez une 2ᵉ fois" : "Réinitialiser tout (score, XP, boosters, coins)"), confirmReset && /*#__PURE__*/React.createElement("button", {
    style: SS.cancelBtn,
    onClick: () => setConfirmReset(false)
  }, "Annuler")), /*#__PURE__*/React.createElement(Section, {
    title: "\xC0 propos"
  }, /*#__PURE__*/React.createElement(Row, {
    label: "Version",
    value: "0.1.0"
  }), /*#__PURE__*/React.createElement(Row, {
    label: "Studio",
    value: "CloneX Studio"
  }), /*#__PURE__*/React.createElement(Row, {
    label: "Contact",
    value: /*#__PURE__*/React.createElement("a", {
      href: "mailto:pinolando120@gmail.com",
      style: SS.link
    }, "pinolando120@gmail.com")
  }), /*#__PURE__*/React.createElement(Row, {
    label: "Confidentialit\xE9",
    value: /*#__PURE__*/React.createElement("a", {
      href: "https://clonex.pages.dev/privacy",
      target: "_blank",
      rel: "noopener noreferrer",
      style: SS.link
    }, "clonex.pages.dev/privacy")
  }))));
}

/* ─── Sub-components ──────────────────────────────────────────── */
function Section({
  title,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: SS.section
  }, /*#__PURE__*/React.createElement("div", {
    style: SS.sectionTitle
  }, title), /*#__PURE__*/React.createElement("div", {
    style: SS.sectionBody
  }, children));
}
function Row({
  label,
  description,
  value,
  control
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: SS.row
  }, /*#__PURE__*/React.createElement("div", {
    style: SS.rowLabelWrap
  }, /*#__PURE__*/React.createElement("span", {
    style: SS.rowLabel
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: SS.rowDesc
  }, description)), value && /*#__PURE__*/React.createElement("span", {
    style: SS.rowValue
  }, value), control);
}
function Toggle({
  on,
  onChange
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => onChange(!on),
    style: {
      ...SS.toggle,
      background: on ? "var(--green)" : "rgba(255,255,255,0.15)"
    },
    role: "switch",
    "aria-checked": !!on
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...SS.toggleKnob,
      transform: on ? "translateX(20px)" : "translateX(0)"
    }
  }));
}
function SegmentedControl({
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: SS.segmented
  }, options.map(opt => /*#__PURE__*/React.createElement("button", {
    key: opt.id,
    onClick: () => onChange(opt.id),
    style: {
      ...SS.segBtn,
      ...(value === opt.id ? SS.segBtnActive : {})
    }
  }, opt.label)));
}
const SS = {
  root: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    background: "radial-gradient(ellipse at top, #1a2a6e, #0b1238 70%)",
    overflow: "hidden"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px"
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    fontSize: 22,
    color: "#fff",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 0 rgba(0,0,0,0.25)"
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 22,
    color: "#fff",
    letterSpacing: 1
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 16px calc(env(safe-area-inset-bottom, 0px) + 24px)"
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 800,
    color: "var(--sky)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingLeft: 4
  },
  sectionBody: {
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    borderRadius: 14,
    border: "1.5px solid rgba(124,58,237,0.4)",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    gap: 12
  },
  rowLabelWrap: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 0
  },
  rowLabel: {
    fontSize: 14,
    color: "#fff",
    fontWeight: 700
  },
  rowDesc: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2
  },
  rowValue: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)"
  },
  link: {
    color: "var(--sky)",
    textDecoration: "underline"
  },
  toggle: {
    width: 48,
    height: 26,
    borderRadius: 100,
    border: "none",
    position: "relative",
    cursor: "pointer",
    transition: "background 0.2s",
    padding: 3,
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)"
  },
  toggleKnob: {
    width: 20,
    height: 20,
    background: "#fff",
    borderRadius: "50%",
    transition: "transform 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
    display: "block"
  },
  segmented: {
    display: "flex",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    padding: 3,
    gap: 2
  },
  segBtn: {
    padding: "6px 14px",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: 700,
    borderRadius: 8,
    transition: "all 0.15s"
  },
  segBtnActive: {
    background: "var(--purple)",
    color: "#fff",
    boxShadow: "0 2px 0 var(--purple-d)"
  },
  select: {
    background: "var(--bg1)",
    color: "#fff",
    border: "1.5px solid var(--purple)",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    fontFamily: "inherit",
    fontWeight: 700,
    cursor: "pointer"
  },
  dangerBtn: {
    width: "100%",
    padding: "14px 16px",
    background: "linear-gradient(180deg, var(--red), #b91c1c)",
    color: "#fff",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 800,
    boxShadow: "0 4px 0 #7f1d1d, inset 0 1px 0 rgba(255,255,255,0.2)"
  },
  cancelBtn: {
    width: "100%",
    padding: "10px 16px",
    background: "transparent",
    border: "1.5px solid rgba(255,255,255,0.2)",
    color: "rgba(255,255,255,0.7)",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    marginTop: 8
  }
};
window.SettingsScreen = SettingsScreen;

/* ─────────────────────────────────────────────────────────── */

/* === src/App.jsx === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — App (composant racine)
   ═══════════════════════════════════════════════════════════════════
   Orchestre :
     - Routing entre écrans (loading / home / game / gameover / wheel /
       settings / shop / leaderboard)
     - État global persisté (settings + profile via useStorage)
     - Logique de récompense (XP/coins/boosters gagnés à chaque partie)
     - Application du thème (body class .light)
     - Boucle de vie : LoadingScreen au boot puis HomeScreen une fois prêt

   Source de vérité unique pour :
     - settings : { sound, vibro, lang, theme }
     - profile  : { coins, xp, bestScore, boosters, wheelLastFree }

   Tout descendant lit ces 2 objets en props (read-only) et muteurs via
   onChange / onProfileChange. Pas de localStorage direct dans les
   composants enfants — règle senior #1 (source unique de vérité).
   ═══════════════════════════════════════════════════════════════════ */

const {
  useState: useStateApp,
  useEffect: useEffectApp,
  useCallback: useCallbackApp
} = React;
const DEFAULT_PROFILE = {
  coins: 100,
  // bonus de bienvenue
  xp: 0,
  bestScore: 0,
  boosters: {
    freeze: 1,
    laser: 1,
    meteor: 0,
    magnet: 0
  },
  // pack starter
  wheelLastFree: 0,
  // timestamp dernier spin gratuit
  totalGames: 0
};
const DEFAULT_SETTINGS = {
  sound: true,
  vibro: true,
  lang: "fr",
  theme: "dark"
};
function App() {
  // Routing : loading -> home -> game -> gameover -> ...
  const [screen, setScreen] = useStateApp("loading");
  const [profile, setProfile] = window.useStorage("st_profile", DEFAULT_PROFILE);
  const [settings, setSettings] = window.useStorage("st_settings", DEFAULT_SETTINGS);
  const [lastResult, setLastResult] = useStateApp(null); // résultat de la dernière partie

  // Applique le thème en ajoutant/retirant body.light
  useEffectApp(() => {
    if (settings && settings.theme === "light") {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  }, [settings && settings.theme]);

  // Notifie le HTML loader qu'on est prêt (fade out splash)
  useEffectApp(() => {
    try {
      window.dispatchEvent(new Event("super-tetris-ready"));
    } catch (_) {}
  }, []);

  // ─── Handlers ────────────────────────────────────────────────
  const navigate = useCallbackApp(target => {
    setScreen(target);
  }, []);
  const handleGameOver = useCallbackApp(result => {
    // Met à jour profile : best score, XP, coins, totalGames
    setProfile(prev => {
      const p = prev || DEFAULT_PROFILE;
      const score = result && result.score || 0;
      const xpGain = result && result.xpGain || 0;
      const coinsGain = result && result.coinsGain || 0;
      return {
        ...p,
        bestScore: Math.max(p.bestScore || 0, score),
        xp: (p.xp || 0) + xpGain,
        coins: (p.coins || 0) + coinsGain,
        totalGames: (p.totalGames || 0) + 1
      };
    });
    setLastResult(result);
    setScreen("gameover");
  }, [setProfile]);
  const handleRetry = useCallbackApp(() => {
    setLastResult(null);
    setScreen("game");
  }, []);
  const handleHome = useCallbackApp(() => {
    setLastResult(null);
    setScreen("home");
  }, []);
  const handleWheelReward = useCallbackApp(({
    isFree,
    segment,
    reward
  }) => {
    if (!reward) return;
    setProfile(prev => {
      const p = prev || DEFAULT_PROFILE;
      const next = {
        ...p
      };
      if (isFree) {
        next.wheelLastFree = Date.now();
      } else {
        next.coins = Math.max(0, (p.coins || 0) - 50); // coût spin payant
      }
      if (reward.coins) {
        next.coins = (next.coins || 0) + reward.coins;
      }
      if (reward.boosters) {
        next.boosters = {
          ...(p.boosters || {})
        };
        Object.keys(reward.boosters).forEach(k => {
          next.boosters[k] = (next.boosters[k] || 0) + reward.boosters[k];
        });
      }
      return next;
    });
  }, [setProfile]);
  const handleResetData = useCallbackApp(() => {
    if (window.confirm("Confirmer la suppression de toutes vos données ? (score, XP, coins, boosters seront remis à zéro)")) {
      setProfile(DEFAULT_PROFILE);
      setSettings(DEFAULT_SETTINGS);
      setScreen("home");
    }
  }, [setProfile, setSettings]);

  // ─── Rendu de l'écran courant ────────────────────────────────
  let content;
  if (screen === "loading") {
    content = /*#__PURE__*/React.createElement(window.LoadingScreen, {
      onDone: () => setScreen("home"),
      minDurationMs: 1800
    });
  } else if (screen === "home") {
    content = /*#__PURE__*/React.createElement(window.HomeScreen, {
      profile: profile,
      onNavigate: navigate
    });
  } else if (screen === "game") {
    content = /*#__PURE__*/React.createElement(window.GameScreen, {
      profile: profile,
      onProfileChange: setProfile,
      onGameOver: handleGameOver,
      onExitToHome: handleHome
    });
  } else if (screen === "gameover") {
    content = /*#__PURE__*/React.createElement(window.GameOverScreen, {
      result: lastResult,
      profile: profile,
      onRetry: handleRetry,
      onHome: handleHome,
      onContinueWithAd: () => {
        // V1 stub : on simule une pub puis donne +1 vie (= retry sans reset)
        window.alert("📺 Pub regardée ! Bonus continue débloqué.");
        setScreen("game");
      }
    });
  } else if (screen === "wheel") {
    content = /*#__PURE__*/React.createElement(window.FortuneWheel, {
      profile: profile,
      onClose: handleHome,
      onReward: handleWheelReward
    });
  } else if (screen === "settings") {
    content = /*#__PURE__*/React.createElement(window.SettingsScreen, {
      settings: settings,
      onChange: setSettings,
      onClose: handleHome,
      onReset: handleResetData
    });
  } else if (screen === "stats" || screen === "shop") {
    // V2 : LeaderboardScreen + ShopScreen
    content = /*#__PURE__*/React.createElement(ComingSoon, {
      title: screen === "stats" ? "Classement" : "Boutique",
      onBack: handleHome
    });
  } else {
    // Fallback de sécurité
    content = /*#__PURE__*/React.createElement(ComingSoon, {
      title: "\xC9cran inconnu",
      onBack: handleHome
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      overflow: "hidden"
    }
  }, content);
}

/* ─── Placeholder pour les écrans V2 ─────────────────────────── */
function ComingSoon({
  title,
  onBack
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "radial-gradient(ellipse at top, #1a2a6e, #0b1238 70%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 80,
      marginBottom: 16
    }
  }, "\uD83D\uDEA7"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Lilita One', cursive",
      fontSize: 36,
      color: "#fff",
      marginBottom: 8,
      letterSpacing: 1,
      textShadow: "0 3px 0 rgba(0,0,0,0.4)"
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "rgba(255,255,255,0.6)",
      fontSize: 14,
      marginBottom: 32,
      maxWidth: 320,
      lineHeight: 1.5
    }
  }, "Cette section arrive bient\xF4t dans la prochaine mise \xE0 jour."), /*#__PURE__*/React.createElement("button", {
    className: "btn-3d purple",
    onClick: onBack
  }, "Retour"));
}
window.App = App;

/* ─────────────────────────────────────────────────────────── */

/* === src/main.jsx === */
"use strict";

/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — main entry point
   ═══════════════════════════════════════════════════════════════════
   Mount le composant App sur #root.
   Wrappé dans un ErrorBoundary pour qu'aucune exception React ne
   white-screen le jeu.
   ═══════════════════════════════════════════════════════════════════ */

class STErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }
  componentDidCatch(error, info) {
    console.error("[ST] ErrorBoundary caught:", error, info && info.componentStack);
  }
  handleReload = () => {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(r => r.update().catch(() => {}));
        });
      }
    } catch (_) {}
    window.location.reload();
  };
  render() {
    if (!this.state.hasError) return this.props.children;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "fixed",
        inset: 0,
        background: "#0b1238",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'Nunito', sans-serif",
        textAlign: "center",
        color: "#fff",
        zIndex: 9999
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 80,
        height: 80,
        borderRadius: 40,
        background: "linear-gradient(180deg, #ef4444, #b91c1c)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        fontSize: 40
      }
    }, "\u26A0\uFE0F"), /*#__PURE__*/React.createElement("h1", {
      style: {
        fontFamily: "'Lilita One', cursive",
        fontSize: 28,
        marginBottom: 8
      }
    }, "Oups, un souci technique"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 14,
        color: "rgba(255,255,255,0.7)",
        maxWidth: 340,
        marginBottom: 24,
        lineHeight: 1.5
      }
    }, "Le jeu a rencontr\xE9 une erreur inattendue. Recharge pour continuer."), /*#__PURE__*/React.createElement("button", {
      onClick: this.handleReload,
      className: "btn-3d",
      style: {
        minWidth: 200
      }
    }, "Recharger"), this.state.error && /*#__PURE__*/React.createElement("pre", {
      style: {
        marginTop: 24,
        maxWidth: 340,
        padding: 12,
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,210,63,0.4)",
        borderRadius: 8,
        fontFamily: "monospace",
        fontSize: 11,
        color: "#fbbf24",
        textAlign: "left",
        whiteSpace: "pre-wrap",
        overflow: "auto"
      }
    }, String(this.state.error.message || this.state.error)));
  }
}
(function () {
  const container = document.getElementById("root");
  if (!container) {
    console.error("[ST] #root not found");
    return;
  }
  const root = ReactDOM.createRoot(container);
  root.render(/*#__PURE__*/React.createElement(STErrorBoundary, null, /*#__PURE__*/React.createElement(window.App, null)));
})();