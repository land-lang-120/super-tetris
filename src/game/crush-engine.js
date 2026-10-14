/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Crush 3D Engine (Jeu Bonus Publicitaire)
   ═══════════════════════════════════════════════════════════════════
   Moteur autonome conforme à la vidéo de référence (Block Crush) :
     - Grille 10×20 avec rendu 3D isométrique biseauté
     - Tétrominos classiques (I, O, T, S, Z, J, L) avec rotation SRS
     - Vague montante depuis le bas ("Garbage Wave") poussant la grille
     - Système de destruction continue en CASCADE :
       1. Pose du tétromino -> Détection des lignes complètes
       2. Éclatement en voxels 3D (tumbling physics 60 FPS)
       3. Gravité des blocs flottants au-dessus
       4. Si de nouvelles lignes sont formées -> Réaction en chaîne continue (Combos)
     - Ligne de danger au sommet (Top-Out Game Over)
     - Accords audio synthétisés en harmonie via window.STAudio
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  var COLS = 10;
  var ROWS = 20;
  var DANGER_ROW = 2; // Si un bloc dépasse cette ligne, alerte rouge ; ligne 0 = Top-out

  // Palette officielle Super Tetris néon (100% synchronisée avec pieces.js)
  var COLORS = {
    I: "#00d4e0", // Cyan
    O: "#ffd23f", // Or
    T: "#a855f7", // Violet
    S: "#22c55e", // Vert
    Z: "#ef4444", // Rouge
    J: "#2563eb", // Bleu
    L: "#f97316", // Orange
  };

  function getColor(key) {
    if (window.STPieces && typeof window.STPieces.colorOf === "function") {
      return window.STPieces.colorOf(key);
    }
    return COLORS[key] || "#888";
  }

  var COLOR_KEYS = ["I", "O", "T", "S", "Z", "J", "L"];

  // Définitions des 7 tétrominos
  var SHAPES = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    O: [
      [1, 1],
      [1, 1],
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  };

  /**
   * Création d'une instance complète du jeu Block Crush
   */
  function createCrushGame(onScoreUpdate, onGameOver, onVictory) {
    var grid = createEmptyGrid();
    var bag = [];
    var currentPiece = null;
    var nextPiece = null;

    var state = "playing"; // "playing" | "cascade" | "gameover" | "victory"
    var score = 0;
    var linesCleared = 0;
    var waveCount = 1;
    var maxCascade = 0;
    var currentCascade = 0;

    // Vague montante : timer et intervalle
    var waveInterval = 8.5; // secondes par vague
    var waveTimer = waveInterval;

    // Gravité de la pièce active
    var dropInterval = 0.75; // secondes par case
    var dropTimer = dropInterval;
    var isSoftDropping = false;

    // Particules & Voxel 3D
    var voxels = [];
    var particles = [];
    var cameraShake = 0;

    // Animation de cascade
    var cascadeTimer = 0;
    var cascadeStep = 0; // 0 = idle, 1 = disintegrating lines, 2 = gravity drop, 3 = recheck
    var pendingClearedRows = [];

    // Initialisation du mur de départ au fond de la grille
    initStartingGarbageWall();
    nextPiece = getRandomPiece();
    spawnNextPiece();

    function createEmptyGrid() {
      var g = [];
      for (var r = 0; r < ROWS; r++) {
        var row = [];
        for (var c = 0; c < COLS; c++) {
          row.push(null);
        }
        g.push(row);
      }
      return g;
    }

    /**
     * Génère un relief irrégulier au bas du plateau avec chenaux et escaliers
     * fidèle à l'esthétique de la vidéo de référence
     */
    function initStartingGarbageWall() {
      // Remplissage des 7 rangées du bas (13 à 19)
      for (var r = 13; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          // Création d'un chenal central ou en zigzag
          var isHole = false;
          if (r === 13 && (c === 4 || c === 5)) isHole = true;
          if (r === 14 && (c === 4 || c === 5 || c === 6)) isHole = true;
          if (r === 15 && (c === 5 || c === 6)) isHole = true;
          if (r === 16 && (c === 3 || c === 4)) isHole = true;
          if (r === 17 && (c === 4 || c === 5)) isHole = true;
          if (r >= 18 && (c === 2 || c === 7)) isHole = true;

          if (!isHole) {
            var colorKey = COLOR_KEYS[(c * 2 + r * 3) % COLOR_KEYS.length];
            grid[r][c] = {
              color: getColor(colorKey),
              key: colorKey,
              name: colorKey,
              id: "b_" + r + "_" + c,
            };
          }
        }
      }
    }

    /**
     * Système 7-Bag aléatoire (avec synchronisation STPieces)
     */
    function getRandomPiece() {
      if (bag.length === 0) {
        bag = (window.STPieces && window.STPieces.PIECE_NAMES)
          ? window.STPieces.PIECE_NAMES.slice()
          : COLOR_KEYS.slice();
        // Shuffle bag
        for (var i = bag.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var temp = bag[i];
          bag[i] = bag[j];
          bag[j] = temp;
        }
      }
      var type = bag.pop();
      var matrix;
      if (window.STPieces && typeof window.STPieces.getRotation === "function") {
        var baseRot = window.STPieces.getRotation(type, 0);
        matrix = baseRot ? baseRot.map(function (row) { return row.slice(); }) : SHAPES[type].map(function (row) { return row.slice(); });
      } else {
        matrix = SHAPES[type].map(function (row) { return row.slice(); });
      }
      return {
        type: type,
        name: type,
        rot: 0,
        matrix: matrix,
        color: getColor(type),
        x: Math.floor((COLS - matrix[0].length) / 2),
        y: 0,
      };
    }

    function spawnNextPiece() {
      currentPiece = nextPiece;
      nextPiece = getRandomPiece();
      currentPiece.y = 0;
      currentPiece.x = Math.floor((COLS - currentPiece.matrix[0].length) / 2);

      // Si collision immédiate à l'apparition -> Top Out
      if (checkCollision(currentPiece.matrix, currentPiece.x, currentPiece.y)) {
        triggerGameOver();
      }
    }

    function checkCollision(matrix, px, py) {
      for (var r = 0; r < matrix.length; r++) {
        for (var c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c]) {
            var targetX = px + c;
            var targetY = py + r;

            // Limites du plateau
            if (targetX < 0 || targetX >= COLS || targetY >= ROWS) {
              return true;
            }
            // Collision avec blocs existants
            if (targetY >= 0 && grid[targetY][targetX] !== null) {
              return true;
            }
          }
        }
      }
      return false;
    }

    /**
     * Calcul de la Ghost Piece
     */
    function getGhostY() {
      if (!currentPiece) return 0;
      var gy = currentPiece.y;
      while (!checkCollision(currentPiece.matrix, currentPiece.x, gy + 1)) {
        gy++;
      }
      return gy;
    }

    /**
     * Déplacements et rotations
     */
    function moveLeft() {
      if (state !== "playing" || !currentPiece) return false;
      if (!checkCollision(currentPiece.matrix, currentPiece.x - 1, currentPiece.y)) {
        currentPiece.x--;
        if (window.STAudio) window.STAudio.play("move");
        return true;
      }
      return false;
    }

    function moveRight() {
      if (state !== "playing" || !currentPiece) return false;
      if (!checkCollision(currentPiece.matrix, currentPiece.x + 1, currentPiece.y)) {
        currentPiece.x++;
        if (window.STAudio) window.STAudio.play("move");
        return true;
      }
      return false;
    }

    function rotateCW() {
      if (state !== "playing" || !currentPiece) return false;
      var pieceName = currentPiece.name || currentPiece.type;
      var fromRot = currentPiece.rot || 0;
      var nextRot = (fromRot + 1) % 4;

      var rotated = null;
      if (window.STPieces && typeof window.STPieces.getRotation === "function") {
        rotated = window.STPieces.getRotation(pieceName, nextRot);
      }
      if (!rotated) {
        rotated = rotateMatrixCW(currentPiece.matrix);
      }

      // Wall-kicks officiels SRS via STPieces ou fallback
      var kicks = null;
      if (window.STPieces && typeof window.STPieces.getWallKicks === "function") {
        kicks = window.STPieces.getWallKicks(pieceName, fromRot, nextRot);
      } else {
        kicks = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0]];
      }

      for (var i = 0; i < kicks.length; i++) {
        var dx = kicks[i][0];
        var dy = kicks[i][1];
        var kx = currentPiece.x + dx;
        var ky = currentPiece.y + dy;
        if (!checkCollision(rotated, kx, ky)) {
          currentPiece.matrix = rotated;
          currentPiece.rot = nextRot;
          currentPiece.x = kx;
          currentPiece.y = ky;
          if (window.STAudio) window.STAudio.play("rotate");
          return true;
        }
      }
      return false;
    }

    function rotateMatrixCW(m) {
      var h = m.length;
      var w = m[0].length;
      var res = [];
      for (var c = 0; c < w; c++) {
        var newRow = [];
        for (var r = h - 1; r >= 0; r--) {
          newRow.push(m[r][c]);
        }
        res.push(newRow);
      }
      return res;
    }

    function softDrop() {
      if (state !== "playing" || !currentPiece) return false;
      if (!checkCollision(currentPiece.matrix, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++;
        score += 1;
        return true;
      } else {
        lockPiece();
        return false;
      }
    }

    function hardDrop() {
      if (state !== "playing" || !currentPiece) return false;
      var gy = getGhostY();
      var droppedDist = gy - currentPiece.y;
      currentPiece.y = gy;
      score += droppedDist * 2;
      cameraShake = 0.5;

      if (window.STAudio) {
        window.STAudio.play("hardDrop");
      }
      lockPiece();
      return true;
    }

    /**
     * Verrouillage du tétromino dans la grille
     */
    function lockPiece() {
      if (!currentPiece) return;

      for (var r = 0; r < currentPiece.matrix.length; r++) {
        for (var c = 0; c < currentPiece.matrix[r].length; c++) {
          if (currentPiece.matrix[r][c]) {
            var gx = currentPiece.x + c;
            var gy = currentPiece.y + r;
            if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
              grid[gy][gx] = {
                color: currentPiece.color,
                key: currentPiece.type,
                name: currentPiece.name || currentPiece.type,
                id: "p_" + Date.now() + "_" + r + "_" + c,
              };
            }
          }
        }
      }

      currentPiece = null;
      if (window.STAudio) window.STAudio.play("lock");

      // Vérifier la ligne de danger / Top out après atterrissage
      if (isGridToppedOut()) {
        triggerGameOver();
        return;
      }

      // Enclencher la phase d'évaluation de la cascade de destructions
      currentCascade = 0;
      evaluateLineClearsAndCascade();
    }

    /**
     * Vague Montante ("Rising Wave")
     * Pousse tout le plateau vers le haut et insère une nouvelle ligne au fond
     */
    function pushRisingWave() {
      // 1. Vérification Top-Out : si la ligne du haut (0) a des blocs, fin de partie
      for (var c = 0; c < COLS; c++) {
        if (grid[0][c] !== null) {
          triggerGameOver();
          return;
        }
      }

      // 2. Décalage de toutes les lignes vers le haut
      for (var r = 0; r < ROWS - 1; r++) {
        grid[r] = grid[r + 1];
      }

      // 3. Génération d'une nouvelle ligne inférieure avec 1 à 2 trous stratégiques
      var newRow = [];
      var holeCol1 = Math.floor(Math.random() * COLS);
      var holeCol2 = (holeCol1 + 2 + Math.floor(Math.random() * 4)) % COLS;

      for (var col = 0; col < COLS; col++) {
        if (col === holeCol1 || col === holeCol2) {
          newRow.push(null);
        } else {
          var colorKey = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
          newRow.push({
            color: getColor(colorKey),
            key: colorKey,
            name: colorKey,
            id: "wave_" + Date.now() + "_" + col,
          });
        }
      }
      grid[ROWS - 1] = newRow;

      // 4. Si une pièce active est en jeu et entre en collision, on la remonte si possible
      if (currentPiece) {
        if (checkCollision(currentPiece.matrix, currentPiece.x, currentPiece.y)) {
          currentPiece.y--;
          if (checkCollision(currentPiece.matrix, currentPiece.x, currentPiece.y)) {
            lockPiece();
          }
        }
      }

      waveCount++;
      cameraShake = 0.8;

      // Son d'avertissement de vague montante
      if (window.STAudio) {
        window.STAudio.tone(160, 0.2, "sawtooth", 0.12);
      }
    }

    /**
     * Détection des lignes pleines
     */
    function getCompletedRows() {
      var completed = [];
      for (var r = 0; r < ROWS; r++) {
        var isFull = true;
        for (var c = 0; c < COLS; c++) {
          if (grid[r][c] === null) {
            isFull = false;
            break;
          }
        }
        if (isFull) {
          completed.push(r);
        }
      }
      return completed;
    }

    /**
     * Système de destruction en CASCADE continue
     */
    function evaluateLineClearsAndCascade() {
      var completed = getCompletedRows();

      if (completed.length > 0) {
        state = "cascade";
        currentCascade++;
        if (currentCascade > maxCascade) maxCascade = currentCascade;

        pendingClearedRows = completed;
        cascadeStep = 1; // Désintégration des blocs
        cascadeTimer = 0.28; // Durée de l'effet d'explosion

        // Éclatement voxel 3D des blocs de ces lignes
        completed.forEach(function (rowIdx) {
          for (var c = 0; c < COLS; c++) {
            var cell = grid[rowIdx][c];
            if (cell) {
              spawnVoxelsForCell(c, rowIdx, cell.color);
              grid[rowIdx][c] = null; // Nettoyage de la cellule
            }
          }
        });

        linesCleared += completed.length;
        var pts = completed.length * 200 * currentCascade;
        score += pts;
        cameraShake = Math.min(1.2, 0.4 + completed.length * 0.25 + currentCascade * 0.15);

        // Fracas prononcé de briques qui se cassent, modulé selon le combo cascade
        if (window.STAudio) {
          if (typeof window.STAudio.brickBreak === "function") {
            window.STAudio.brickBreak(completed.length, currentCascade);
          } else if (typeof window.STAudio.play === "function") {
            window.STAudio.play(completed.length >= 4 ? "tetris" : "line" + completed.length);
          }
        }
      } else {
        // Aucune nouvelle ligne : fin de la séquence de cascade
        state = "playing";
        currentCascade = 0;
        cascadeStep = 0;
        spawnNextPiece();
      }
    }

    /**
     * Effondrement par gravité (Gravity Falling)
     * Les blocs situés au-dessus des vides tombent vers le bas
     */
    function applyGravityStep() {
      var shiftedAny = false;

      for (var c = 0; c < COLS; c++) {
        // Parcours du bas vers le haut
        for (var r = ROWS - 1; r > 0; r--) {
          if (grid[r][c] === null) {
            // Chercher le premier bloc au-dessus
            for (var above = r - 1; above >= 0; above--) {
              if (grid[above][c] !== null) {
                grid[r][c] = grid[above][c];
                grid[above][c] = null;
                shiftedAny = true;
                break;
              }
            }
          }
        }
      }

      return shiftedAny;
    }

    /**
     * Projection de voxels 3D (Éclatement en débris)
     */
    function spawnVoxelsForCell(c, r, color) {
      // Chaque bloc produit 4 à 8 micro-voxels 3D
      var countX = 2;
      var countY = 2;
      for (var ox = 0; ox < countX; ox++) {
        for (var oy = 0; oy < countY; oy++) {
          voxels.push({
            x: c + ox * 0.5,
            y: r + oy * 0.5,
            z: 0.1 + Math.random() * 0.4,
            vx: (Math.random() - 0.5) * 0.22,
            vy: -0.15 - Math.random() * 0.14, // Projection initiale vers le haut
            vz: (Math.random() - 0.5) * 0.18,
            rotX: Math.random() * Math.PI,
            rotY: Math.random() * Math.PI,
            rotZ: Math.random() * Math.PI,
            vRotX: (Math.random() - 0.5) * 0.2,
            vRotY: (Math.random() - 0.5) * 0.2,
            vRotZ: (Math.random() - 0.5) * 0.2,
            size: 0.45,
            color: color,
            life: 1.0,
          });
        }
      }

      // Éclats lumineux / particules
      for (var p = 0; p < 4; p++) {
        particles.push({
          x: c + 0.5,
          y: r + 0.5,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          color: color,
          size: 3 + Math.random() * 4,
          life: 0.7,
        });
      }
    }

    function isGridToppedOut() {
      // Si des blocs ont franchi la rangée 0 ou 1
      for (var c = 0; c < COLS; c++) {
        if (grid[0][c] !== null) return true;
      }
      return false;
    }

    function triggerGameOver() {
      // Guard contre le double-fire (vague + lockPiece simultanés)
      if (state === "gameover" || state === "victory") return;
      state = "gameover";
      if (window.STAudio) window.STAudio.play("gameOver");
      if (typeof onGameOver === "function") {
        onGameOver({ score: score, linesCleared: linesCleared, maxCascade: maxCascade });
      }
    }

    function triggerVictory() {
      state = "victory";
      if (window.STAudio) window.STAudio.play("win");
      if (typeof onVictory === "function") {
        onVictory({ score: score, linesCleared: linesCleared, maxCascade: maxCascade, coins: 250 });
      }
    }

    /**
     * Mise à jour continue (Game Loop 60 FPS)
     */
    function update(dt) {
      if (cameraShake > 0) {
        cameraShake = Math.max(0, cameraShake - dt * 2.8);
      }

      // Mise à jour des voxels 3D
      if (voxels.length > 0) {
        for (var i = voxels.length - 1; i >= 0; i--) {
          var v = voxels[i];
          v.x += v.vx * dt * 60;
          v.y += v.vy * dt * 60;
          v.z += v.vz * dt * 60;
          v.vy += 0.016 * dt * 60; // Gravité constante

          v.rotX += v.vRotX * dt * 60;
          v.rotY += v.vRotY * dt * 60;
          v.rotZ += v.vRotZ * dt * 60;

          v.life -= dt * 1.1;
          if (v.life <= 0 || v.y > ROWS + 5) {
            voxels.splice(i, 1);
          }
        }
      }

      // Mise à jour des particules lumineuses
      if (particles.length > 0) {
        for (var p = particles.length - 1; p >= 0; p--) {
          var part = particles[p];
          part.x += part.vx * dt * 60;
          part.y += part.vy * dt * 60;
          part.life -= dt * 1.6;
          part.size = Math.max(0, part.size - dt * 6);
          if (part.life <= 0) {
            particles.splice(p, 1);
          }
        }
      }

      if (state === "gameover" || state === "victory") {
        return;
      }

      // Étape de CASCADE en cours
      if (state === "cascade") {
        cascadeTimer -= dt;
        if (cascadeTimer <= 0) {
          if (cascadeStep === 1) {
            // Étape 2 : appliquer la gravité sur les blocs suspendus
            applyGravityStep();
            cascadeStep = 2;
            cascadeTimer = 0.18; // Court délai pour visualiser l'effondrement
          } else if (cascadeStep === 2) {
            // Étape 3 : re-vérifier si de nouvelles lignes complètes sont formées
            evaluateLineClearsAndCascade();
          }
        }
        return;
      }

      // État de jeu normal ("playing")
      if (state === "playing") {
        // Gestion de la vague montante
        waveTimer -= dt;
        if (waveTimer <= 0) {
          waveTimer = waveInterval;
          pushRisingWave();
        }

        // Chute automatique de la pièce
        dropTimer -= dt;
        if (dropTimer <= 0) {
          dropTimer = isSoftDropping ? 0.05 : dropInterval;
          if (currentPiece) {
            if (!checkCollision(currentPiece.matrix, currentPiece.x, currentPiece.y + 1)) {
              currentPiece.y++;
            } else {
              lockPiece();
            }
          }
        }
      }
    }

    /**
     * Rendu Canvas haute définition 60 FPS
     */
    function render(ctx, width, height) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Fond Arcade Néon Galactique
      var bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.35,
        20,
        width * 0.5,
        height * 0.5,
        width * 0.85
      );
      bgGrad.addColorStop(0, "#162354");
      bgGrad.addColorStop(0.5, "#0b1238");
      bgGrad.addColorStop(1, "#05081c");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Calcul des dimensions de la grille
      var marginX = 20;
      var availableW = width - marginX * 2;
      var cellSize = Math.floor(Math.min(availableW / COLS, (height * 0.72) / ROWS));
      var boardW = COLS * cellSize;
      var boardH = ROWS * cellSize;
      var originX = Math.floor((width - boardW) * 0.5);
      var originY = Math.floor(height * 0.14);

      ctx.save();
      if (cameraShake > 0) {
        var sx = (Math.random() - 0.5) * cameraShake * 12;
        var sy = (Math.random() - 0.5) * cameraShake * 12;
        ctx.translate(sx, sy);
      }

      // Fond du plateau de jeu (parité exacte avec le jeu de base render.js)
      var boardGrad = ctx.createLinearGradient(originX, originY, originX, originY + boardH);
      boardGrad.addColorStop(0, "#0a0e2a");
      boardGrad.addColorStop(1, "#0d1530");
      ctx.fillStyle = boardGrad;
      ctx.fillRect(originX, originY, boardW, boardH);

      // Grille subtile violette (parité exacte avec le jeu de base)
      ctx.strokeStyle = "rgba(124, 58, 237, 0.1)";
      ctx.lineWidth = 1;
      for (var c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(originX + c * cellSize + 0.5, originY);
        ctx.lineTo(originX + c * cellSize + 0.5, originY + boardH);
        ctx.stroke();
      }
      for (var r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(originX, originY + r * cellSize + 0.5);
        ctx.lineTo(originX + boardW, originY + r * cellSize + 0.5);
        ctx.stroke();
      }

      // Ligne d'alerte rouge / Danger Top-Out
      var dangerY = originY + DANGER_ROW * cellSize;
      var pulse = 0.35 + 0.25 * Math.sin(Date.now() * 0.008);
      ctx.save();
      ctx.strokeStyle = "rgba(239, 68, 68, " + pulse + ")";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(originX, dangerY);
      ctx.lineTo(originX + boardW, dangerY);
      ctx.stroke();
      ctx.restore();

      // Rendu des blocs fixés dans la grille (100% parité avec drawCell)
      for (var gr = 0; gr < ROWS; gr++) {
        for (var gc = 0; gc < COLS; gc++) {
          var cell = grid[gr][gc];
          if (cell) {
            var bx = originX + gc * cellSize;
            var by = originY + gr * cellSize;
            draw3DBlock(ctx, bx, by, cellSize, cell.color);
          }
        }
      }

      // Ghost Piece (Ombre de visée 100% parité STRender.drawGhostCell)
      if (currentPiece && state === "playing") {
        var gy = getGhostY();
        for (var pr = 0; pr < currentPiece.matrix.length; pr++) {
          for (var pc = 0; pc < currentPiece.matrix[pr].length; pc++) {
            if (currentPiece.matrix[pr][pc]) {
              var gx = originX + (currentPiece.x + pc) * cellSize;
              var gpy = originY + (gy + pr) * cellSize;
              drawGhostBlock(ctx, gx, gpy, cellSize, currentPiece.color);
            }
          }
        }

        // Pièce active en cours de chute (100% parité avec drawCell)
        for (var cr = 0; cr < currentPiece.matrix.length; cr++) {
          for (var cc = 0; cc < currentPiece.matrix[cr].length; cc++) {
            if (currentPiece.matrix[cr][cc]) {
              var px = originX + (currentPiece.x + cc) * cellSize;
              var py = originY + (currentPiece.y + cr) * cellSize;
              draw3DBlock(ctx, px, py, cellSize, currentPiece.color);
            }
          }
        }
      }

      // Rendu des voxels 3D en effondrement / tumbling
      drawTumblingVoxels(ctx, originX, originY, cellSize, voxels);

      // Particules lumineuses
      drawParticles(ctx, originX, originY, cellSize, particles);

      // Bordure violette néon autour du board (parité exacte avec render.js)
      ctx.strokeStyle = "rgba(124, 58, 237, 0.6)";
      ctx.lineWidth = 3;
      ctx.strokeRect(originX, originY, boardW, boardH);

      ctx.restore();
    }

    /**
     * Rendu d'une cellule 3D bombée style "bouton brillant"
     * (100% PARITÉ VISUELLE AVEC LE JEU DE BASE render.js drawCell)
     */
    function draw3DBlock(ctx, x, y, size, color) {
      if (window.STRender && typeof window.STRender.drawCell === "function") {
        window.STRender.drawCell(ctx, x, y, size, color, false);
        return;
      }

      // 1) Base solide
      ctx.fillStyle = color;
      ctx.fillRect(x, y, size, size);

      // 2) Gradient diagonal "bombé" : reflet haut-gauche → ombre bas-droite
      var grd = ctx.createLinearGradient(x, y, x + size, y + size);
      grd.addColorStop(0, "rgba(255,255,255,0.50)");
      grd.addColorStop(0.45, "rgba(255,255,255,0.00)");
      grd.addColorStop(1, "rgba(0,0,0,0.40)");
      ctx.fillStyle = grd;
      ctx.fillRect(x, y, size, size);

      // 3) Bandeau reflet supérieur (effet "verre vitré")
      var topGlow = ctx.createLinearGradient(x, y, x, y + size * 0.45);
      topGlow.addColorStop(0, "rgba(255,255,255,0.55)");
      topGlow.addColorStop(0.6, "rgba(255,255,255,0.10)");
      topGlow.addColorStop(1, "rgba(255,255,255,0.00)");
      ctx.fillStyle = topGlow;
      ctx.fillRect(x + size * 0.1, y + size * 0.06, size * 0.8, size * 0.4);

      // 4) Inner shadow bas
      var bot = ctx.createLinearGradient(x, y + size * 0.6, x, y + size);
      bot.addColorStop(0, "rgba(0,0,0,0.00)");
      bot.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = bot;
      ctx.fillRect(x, y + size * 0.6, size, size * 0.4);

      // 5) Reflet ponctuel rond en haut-gauche (style "highlight de bille")
      var spot = ctx.createRadialGradient(
        x + size * 0.3,
        y + size * 0.28,
        0,
        x + size * 0.3,
        y + size * 0.28,
        size * 0.45
      );
      spot.addColorStop(0, "rgba(255,255,255,0.55)");
      spot.addColorStop(0.5, "rgba(255,255,255,0.12)");
      spot.addColorStop(1, "rgba(255,255,255,0.00)");
      ctx.fillStyle = spot;
      ctx.fillRect(x, y, size, size);

      // 6) Bordure interne brillante (cerclage clair façon bombée)
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1.5, y + 1.5, size - 3, size - 3);

      // 7) Bordure externe sombre (séparation nette entre cellules)
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    }

    /**
     * Dessine une cellule "ghost" (100% PARITÉ avec STRender.drawGhostCell)
     */
    function drawGhostBlock(ctx, x, y, size, color) {
      if (window.STRender && typeof window.STRender.drawGhostCell === "function") {
        window.STRender.drawGhostCell(ctx, x, y, size, color);
        return;
      }
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

    function drawTumblingVoxels(ctx, ox, oy, cs, list) {
      for (var i = 0; i < list.length; i++) {
        var v = list[i];
        var vx = ox + v.x * cs;
        var vy = oy + v.y * cs;
        var sz = v.size * cs * Math.max(0.2, v.life);
        var hsz = sz * 0.5;

        ctx.save();
        ctx.translate(vx, vy);
        ctx.rotate(v.rotZ);
        ctx.globalAlpha = Math.min(1, v.life * 1.3);

        // Base couleur
        ctx.fillStyle = v.color;
        ctx.fillRect(-hsz, -hsz, sz, sz);

        // Bevel 3D spéculaire
        var vg = ctx.createLinearGradient(-hsz, -hsz, hsz, hsz);
        vg.addColorStop(0, "rgba(255, 255, 255, 0.65)");
        vg.addColorStop(0.45, "rgba(255, 255, 255, 0.0)");
        vg.addColorStop(1, "rgba(0, 0, 0, 0.45)");
        ctx.fillStyle = vg;
        ctx.fillRect(-hsz, -hsz, sz, sz);

        // Highlight supérieur verre
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.fillRect(-hsz, -hsz, sz, sz * 0.35);

        // Bordure brillante fine
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1;
        ctx.strokeRect(-hsz + 0.5, -hsz + 0.5, sz - 1, sz - 1);

        ctx.restore();
      }
    }

    function drawParticles(ctx, ox, oy, cs, list) {
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        var px = ox + p.x * cs;
        var py = oy + p.y * cs;
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function getState() {
      return {
        score: score,
        linesCleared: linesCleared,
        waveCount: waveCount,
        maxCascade: maxCascade,
        currentCascade: currentCascade,
        waveProgress: Math.max(0, Math.min(1, 1 - waveTimer / waveInterval)),
        state: state,
        nextPiece: nextPiece,
      };
    }

    function shadeColor(color, percent) {
      var num = parseInt(color.replace("#", ""), 16);
      var amt = Math.round(2.55 * percent);
      var R = (num >> 16) + amt;
      var G = ((num >> 8) & 0x00ff) + amt;
      var B = (num & 0x0000ff) + amt;
      return (
        "#" +
        (
          0x1000000 +
          (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
          (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
          (B < 255 ? (B < 1 ? 0 : B) : 255)
        )
          .toString(16)
          .slice(1)
      );
    }

    return {
      moveLeft: moveLeft,
      moveRight: moveRight,
      rotateCW: rotateCW,
      softDrop: softDrop,
      hardDrop: hardDrop,
      update: update,
      render: render,
      getState: getState,
      triggerVictory: triggerVictory,
    };
  }

  window.STCrushEngine = {
    createCrushGame: createCrushGame,
    COLS: COLS,
    ROWS: ROWS,
    COLORS: COLORS,
  };
})();
