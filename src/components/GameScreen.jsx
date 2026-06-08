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

const { useState: useStateGS, useRef: useRefGS, useEffect: useEffectGS, useCallback: useCallbackGS } = React;

function GameScreen({ onExitToHome, onGameOver, profile, onProfileChange }) {
  const canvasRef = useRefGS(null);
  const tr = (key, params) => window.STI18n ? window.STI18n.t(key, params) : key;

  // ─── State du jeu (en ref pour perf, pas re-render à chaque frame)
  const gameRef = useRefGS(null);
  if (!gameRef.current) {
    gameRef.current = createInitialGameState();
  }

  // ─── State UI (re-renders OK)
  // ⚠ DOIT être déclaré AVANT les useEffect qui utilisent ces vars
  // (sinon ReferenceError "Cannot access X before initialization").
  const [tick, setTick]               = useStateGS(0);  // counter pour forcer re-render
  const [paused, setPaused]           = useStateGS(false);
  const [flashRows, setFlashRows]     = useStateGS([]);
  const [combo, setCombo]             = useStateGS(0);
  const [floatScore, setFloatScore]   = useStateGS(null); // {x,y,text}
  const BOOSTER_COSTS = { freeze: 200, laser: 300, meteor: 400, magnet: 500 };

  // ─── Reset particules + VFX boosters au mount (clean state entre 2 parties)
  useEffectGS(() => {
    if (window.STParticles)  window.STParticles.clear();
    if (window.STBoosterFX)  window.STBoosterFX.clear();
    return () => {
      if (window.STParticles)  window.STParticles.clear();
      if (window.STBoosterFX)  window.STBoosterFX.clear();
    };
  }, []);

  // ─── v1.13 BUG-ST-1 FIX : canvas backing-store FIXE 400×800 (10×20 cellules de 40px)
  // La v1.12 tentait un sizing dynamique DPR-aware via useLayoutEffect — mais le
  // 1er paint mesurait parfois un parent à 0px → backing-store ridicule = flou.
  // La v1.11 avait `width={400} height={800}` en dur sur la balise <canvas>, qui
  // marchait nettement. On y revient. La CSS (aspectRatio:1/2 + height:100%) fait
  // l'upscale visuel proprement, le navigateur lisse à l'affichage.

  // ─── v1.8 : MUSIQUE iconique de fond (Korobeiniki)
  // Démarre au mount, stop au unmount.
  useEffectGS(() => {
    if (window.STMusic) window.STMusic.start();
    return () => { if (window.STMusic) window.STMusic.stop(); };
  }, []);

  // Pause/Resume music sync avec le pause du jeu
  useEffectGS(() => {
    if (!window.STMusic) return;
    if (paused) window.STMusic.stop();
    else window.STMusic.start();
  }, [paused]);

  // Stop music quand game over
  useEffectGS(() => {
    if (gameRef.current && gameRef.current.gameOver && window.STMusic) {
      window.STMusic.stop();
    }
  }, [tick]);

  // ─── Inputs : swipes + clavier
  useEffectGS(() => {
    const onKey = (e) => {
      const G = gameRef.current;
      if (!G || G.gameOver) return;
      if (paused && e.code !== "Escape") return;

      switch (e.code) {
        case "ArrowLeft":
          if (movePiece(G, -1, 0)) { fxMove(); }
          break;
        case "ArrowRight":
          if (movePiece(G,  1, 0)) { fxMove(); }
          break;
        case "ArrowDown":
          if (movePiece(G, 0, 1)) { G.score += window.STScoring.softDropScore(); fxMove(); }
          break;
        case "ArrowUp":
        case "KeyX":
          if (rotatePiece(G,  1)) { fxRotate(); }
          break;
        case "KeyZ":
          if (rotatePiece(G, -1)) { fxRotate(); }
          break;
        case "Space":      hardDrop(G); fxHardDrop(); break;
        case "ShiftLeft":
        case "ShiftRight":
        case "KeyC":       holdPiece(G); fxHold(); break;
        case "Escape":     setPaused(p => !p); break;
        default: return;
      }
      setTick(t => t + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused]);

  // ─── Touch controls : v1.16 (Pino retour 2026-05-06) — copie fidèle du
  // pattern Tetroid (qui marche sur son phone). Différences clés vs v1.15 :
  //   - { passive: false } + e.preventDefault() → empêche le navigateur de
  //     synthétiser des mousedown/mousemove/mouseup APRÈS le touch, ce qui
  //     dupliquait les évènements et pétait la détection du tap.
  //   - Aucun handler souris : sur mobile, seul touch est nécessaire ; sur
  //     desktop, le clavier est dispo (ArrowKeys + Space).
  //   - Seuils CELL-relatifs (adx < 0.6 × cellSize) au lieu de px fixes.
  //   - Plant on contact préservé.
  useEffectGS(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    let ts0 = null, tx0 = 0, ty0 = 0, tst = 0;
    let downwardMoves = 0;             // soft-drops cumulés (pour plant on contact)

    /** cellSize CSS (rect-based) pour seuils responsive. */
    function getCellSize() {
      const rect = cv.getBoundingClientRect();
      return rect.width / window.STCore.COLS;
    }

    const onStart = (e) => {
      e.preventDefault();
      const t = e.touches ? e.touches[0] : e;
      ts0 = { x: t.clientX, y: t.clientY };
      tx0 = t.clientX; ty0 = t.clientY;
      tst = Date.now();
      downwardMoves = 0;
    };

    const onMove = (e) => {
      e.preventDefault();
      if (!ts0) return;
      const G = gameRef.current;
      if (!G || G.gameOver || paused) return;
      const t = e.touches ? e.touches[0] : e;
      const cellSize = getCellSize();
      const dx = t.clientX - tx0;
      const dy = t.clientY - ty0;
      const adx = Math.abs(dx), ady = Math.abs(dy);

      // Mouvement horizontal : déclenche une fois par cellSize × 0.5 px (snappy)
      if (adx > cellSize * 0.5 && adx > ady * 1.1) {
        const d = dx > 0 ? 1 : -1;
        if (movePiece(G, d, 0)) fxMove();
        tx0 = t.clientX;
        setTick(s => s + 1);
        return;
      }

      // Soft drop : déclenche par cellSize × 0.75 vers le bas
      if (dy > 0 && ady > cellSize * 0.75 && adx < cellSize * 0.5) {
        if (movePiece(G, 0, 1)) {
          G.score += window.STScoring.softDropScore();
          fxMove();
          downwardMoves++;
        }
        ty0 = t.clientY;
        setTick(s => s + 1);
      }
    };

    const onEnd = (e) => {
      e.preventDefault();
      if (!ts0) return;
      const G = gameRef.current;
      if (!G || G.gameOver || paused) { ts0 = null; return; }
      const t = e.changedTouches ? e.changedTouches[0] : e;
      const dx = t.clientX - ts0.x;
      const dy = t.clientY - ts0.y;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      const dur = Date.now() - tst;
      const cellSize = getCellSize();

      // HARD DROP : swipe vertical rapide vers le bas
      if (dy > cellSize * 4 && adx < cellSize * 1.8 && dur < 360) {
        hardDrop(G);
        fxHardDrop();
        setTick(s => s + 1);
        ts0 = null;
        return;
      }

      // ROTATION (tap) : seuils cell-relatifs comme Tetroid
      const wasVerticalSwipe = dy > cellSize * 0.8;
      if (!wasVerticalSwipe && adx < cellSize * 0.6 && ady < cellSize * 0.6 && dur < 420) {
        if (rotatePiece(G, 1)) fxRotate();
        setTick(s => s + 1);
        ts0 = null;
        return;
      }

      // PLANT ON CONTACT : si le swipe vertical a fait descendre la pièce
      // jusqu'au fond, on la verrouille immédiatement.
      if (downwardMoves > 0 && G.piece) {
        const stuckOnFloor = window.STCore.collide(G.grid, G.piece, G.piece.x, G.piece.y + 1);
        if (stuckOnFloor) {
          lockPieceFlow(G);
          fxLock();
          setTick(s => s + 1);
        }
      }
      ts0 = null;
    };

    cv.addEventListener("touchstart", onStart, { passive: false });
    cv.addEventListener("touchmove",  onMove,  { passive: false });
    cv.addEventListener("touchend",   onEnd,   { passive: false });

    return () => {
      cv.removeEventListener("touchstart", onStart);
      cv.removeEventListener("touchmove",  onMove);
      cv.removeEventListener("touchend",   onEnd);
    };
  }, [paused]);

  // ─── Game loop : gravité automatique + particles update
  window.useGameLoop({
    active: !paused,
    onTick: (deltaMs) => {
      const G = gameRef.current;
      if (!G || G.gameOver) return;
      G.elapsedMs   += deltaMs;

      // Particules : update systématique, même si freeze (pour FX continu)
      if (window.STParticles) window.STParticles.update(deltaMs);

      // VFX boosters (laser beams, meteor trails, freeze flakes, magnet waves)
      if (window.STBoosterFX && canvasRef.current) {
        const cv = canvasRef.current;
        window.STBoosterFX.update(deltaMs, cv.width, cv.height);
      }

      // v1.14 BUG-ST-FREEZE FIX : Freeze RALENTIT (vitesse niveau 1 = 1000 ms/cell)
      // au lieu de stopper complètement. Le joueur reste pressé mais respire.
      const isFrozen = !!(window.STBoosters && window.STBoosters.isFrozen(G));
      if (isFrozen) {
        // Sync VFX freeze : actif tant que isFrozen
        if (window.STBoosterFX) window.STBoosterFX.setFreezeActive(true);
      } else if (window.STBoosterFX && window.STBoosterFX.hasFreeze()) {
        // Freeze terminé : retirer l'overlay VFX
        window.STBoosterFX.setFreezeActive(false);
      }

      G.dropAcc += deltaMs;
      // Si freeze actif → toujours utiliser la gravité du niveau 1 (1000 ms/cell),
      // sauf si le niveau courant est DÉJÀ plus lent (sécurité débute partie niv.1).
      const baseGrav = window.STScoring.gravityMs(G.level);
      const gravMs = isFrozen
        ? Math.max(baseGrav, window.STScoring.gravityMs(1))
        : baseGrav;
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
    },
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
      flashRows: flashRows,
    }, {
      cellSize: cellSize,
      cols: window.STCore.COLS,
      rows: window.STCore.ROWS,
      showGhost: true,
    });

    // Particules par-dessus le board (clear bursts, explosions, shockwaves)
    if (window.STParticles) window.STParticles.draw(ctx);

    // VFX boosters par-dessus tout (laser beams, meteor trails, freeze flakes,
    // magnet waves). Le voile freeze est géré ici (drawFreeze) — ne pas le
    // dessiner en double depuis GameScreen.
    if (window.STBoosterFX) {
      window.STBoosterFX.draw(ctx, cv.width, cv.height);
    }
  }, [tick, flashRows]);

  // ─── Game over handler
  const handleGameOver = useCallbackGS((G) => {
    if (typeof onGameOver === "function") {
      const xpGain    = window.STScoring.xpFromGame(G.score, G.linesTotal, G.level);
      const coinsGain = window.STScoring.coinsFromGame(G.score, G.linesTotal);
      onGameOver({
        score: G.score,
        linesTotal: G.linesTotal,
        level: G.level,
        timeMs: G.elapsedMs,
        xpGain: xpGain,
        coinsGain: coinsGain,
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
      b2b: G.b2b,
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
  function fxMove()     { if (window.STAudio)   window.STAudio.play("move");
                          if (window.STHaptics) window.STHaptics.vibePattern("move"); }
  function fxRotate()   { if (window.STAudio)   window.STAudio.play("rotate");
                          if (window.STHaptics) window.STHaptics.vibePattern("rotate"); }
  function fxLock()     { if (window.STAudio)   window.STAudio.play("lock");
                          if (window.STHaptics) window.STHaptics.vibePattern("lock"); }
  function fxHardDrop() { if (window.STAudio)   window.STAudio.play("hardDrop");
                          if (window.STHaptics) window.STHaptics.vibePattern("hardDrop"); }
  function fxHold()     { if (window.STAudio)   window.STAudio.play("hold"); }
  function fxLevelUp()  { if (window.STAudio)   window.STAudio.play("levelUp");
                          if (window.STHaptics) window.STHaptics.vibePattern("levelUp"); }
  function fxGameOver() { if (window.STAudio)   window.STAudio.play("gameOver");
                          if (window.STHaptics) window.STHaptics.vibePattern("gameOver"); }
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

  /** v1.13 BUG-ST-3 FIX : logique IMMÉDIATE + VFX en parallèle (parité Tetroid).
      La v1.12 retardait `applyLaser/Meteor` derrière setTimeout(2.3s) — pendant
      ce délai, le game loop continuait → race conditions, état incohérent.
      Désormais : applyXxx() agit immédiatement, le VFX joue son animation
      indépendamment (purement décoratif). */
  function activateBooster(id) {
    const G = gameRef.current;
    if (!G || G.gameOver || paused || !window.STBoosters) return;
    const cv = canvasRef.current;
    const cellSize = cv ? Math.floor(cv.width / window.STCore.COLS) : 30;

    if (id === "freeze") {
      // ❄️ FREEZE : applique le timer + VFX flocons/cristaux/voile
      window.STBoosters.applyFreeze(G);
      if (cv && window.STBoosterFX) {
        window.STBoosterFX.spawnFreezeEffects(cv.width, cv.height);
      }
      if (window.STAudio) window.STAudio.play("boosterFreeze");

    } else if (id === "laser") {
      // v1.14 BUG-ST-LASER FIX : SON + VFX d'abord, destruction APRÈS sweep beam.
      // Avant : applyLaser immédiat → blocs disparaissaient AVANT que le beam
      // n'ait traversé. Pino : "le laser est censé passer en affichant les
      // traits avec le son qui va avec avant que les briques ne se détruisent".
      const targets = [];
      for (let r = window.STCore.ROWS - 1; r >= 0 && targets.length < 4; r--) {
        let hasCell = false;
        for (let c = 0; c < window.STCore.COLS; c++) {
          if (G.grid[r][c]) { hasCell = true; break; }
        }
        if (hasCell) targets.push(r);
      }
      // 1) Son + VFX beams en parallèle (sweep horizontal sur ~300ms)
      if (window.STAudio) window.STAudio.play("boosterLaser");
      if (cv && window.STBoosterFX && targets.length > 0) {
        window.STBoosterFX.spawnLaser(targets, cellSize, cv.width);
      }
      // 2) Destruction synchrone à la fin du sweep (~340ms = beam.x atteint canvasW)
      //    On capture une référence stable pour éviter race condition si pause.
      const gRefForLaser = gameRef;
      setTimeout(function () {
        const Gnow = gRefForLaser.current;
        if (!Gnow || Gnow.gameOver) return;
        const result = window.STBoosters.applyLaser(Gnow);
        // Particules rouges sur chaque ligne effacée
        if (cv && window.STParticles && result.lines.length > 0) {
          result.lines.forEach(function (rowIdx) {
            const cy = rowIdx * cellSize + cellSize / 2;
            for (let x = 0; x < window.STCore.COLS; x++) {
              window.STParticles.addExplosion(x * cellSize + cellSize / 2, cy, "#ff2020");
            }
          });
        }
        setTick(t => t + 1);
      }, 340);

    } else if (id === "meteor") {
      // v1.14 BUG-ST-METEOR FIX : destruction PAR COLONNE synchronisée à l'impact
      // de chaque météore (au lieu de tout détruire d'un coup).
      // Pino : "les météores sont censés venir frapper sur les blocs en même
      // temps qu'ils se détruisent".
      // Spawn delay : 80ms par colonne. Fall delay : (topRow+1)*cellSize / vy frames @60fps.
      // → impactMs(col) = col*80 + (topRow+1)*cellSize/(cellSize*0.45)*16.67
      //                 = col*80 + (topRow+1)*37
      if (cv && window.STBoosterFX) {
        window.STBoosterFX.spawnMeteor(window.STCore.COLS, cellSize);
      }
      if (window.STAudio) window.STAudio.play("boosterMeteor");

      // Calcule par colonne le topRow (ligne de la pile au moment du déclenchement)
      const meteorPlan = [];
      for (let c = 0; c < window.STCore.COLS; c++) {
        let topRow = -1;
        for (let r = 0; r < window.STCore.ROWS; r++) {
          if (G.grid[r][c]) { topRow = r; break; }
        }
        meteorPlan.push({ col: c, topRow: topRow });
      }
      const gRefForMeteor = gameRef;
      meteorPlan.forEach(function (p) {
        // Délai impact = spawn delay (col*80) + chute (~ 37ms par cellule)
        const fallRows = p.topRow >= 0 ? p.topRow + 1 : window.STCore.ROWS;
        const impactMs = p.col * 80 + fallRows * 37;
        setTimeout(function () {
          const Gnow = gRefForMeteor.current;
          if (!Gnow || Gnow.gameOver) return;
          const r = window.STBoosters.applyMeteorColumn(Gnow, p.col);
          // Retire le météore VFX synchronisé (sinon il continue à tomber)
          if (window.STBoosterFX) window.STBoosterFX.killMeteorAt(p.col);
          if (cv && window.STParticles && r && r.hits > 0) {
            const px = p.col * cellSize + cellSize / 2;
            const py = (p.topRow >= 0 ? p.topRow : 0) * cellSize + cellSize / 2;
            window.STParticles.addShockwave(px, py);
            window.STParticles.addExplosion(px, py, "#ff9000");
          }
          // Pas de sound supplémentaire ici (boosterMeteor au déclenchement = sweep complet)
          // Haptic léger à chaque impact pour le feedback tactile.
          if (window.STHaptics) window.STHaptics.vibePattern("move");
          setTick(t => t + 1);
        }, impactMs);
      });
      // Gravité globale appliquée APRÈS la dernière destruction (pour compresser les colonnes)
      const lastImpact = Math.max(0, ...meteorPlan.map(function (p) {
        const fallRows = p.topRow >= 0 ? p.topRow + 1 : window.STCore.ROWS;
        return p.col * 80 + fallRows * 37;
      }));
      setTimeout(function () {
        const Gnow = gRefForMeteor.current;
        if (!Gnow || Gnow.gameOver || !window.STBoosters) return;
        window.STBoosters.applyGravity(Gnow.grid);
        setTick(t => t + 1);
      }, lastImpact + 80);

    } else if (id === "magnet") {
      // 🧲 MAGNET : 5 vagues violettes VFX + gravity multi-pass + clear lignes
      if (cv && window.STBoosterFX) {
        window.STBoosterFX.spawnMagnetWaves(cv.width, cv.height);
      }
      const r = window.STBoosters.applyMagnet(G);
      if (cv && window.STParticles && r.cellsMoved > 0) {
        for (let x = 0; x < window.STCore.COLS; x++) {
          window.STParticles.addExplosion(
            x * cellSize + cellSize / 2,
            cv.height - cellSize,
            "#b020ff"
          );
        }
      }
      if (r.linesCleared > 0) {
        G.linesTotal = (G.linesTotal || 0) + r.linesCleared;
      }
      if (window.STAudio) window.STAudio.play("boosterMagnet");
    }

    // Haptic commun à tous les boosters
    if (window.STHaptics) window.STHaptics.vibePattern("booster");
    setTick(t => t + 1);
  }

  const G = gameRef.current;

  return (
    <div style={SGS.root}>
      {/* HUD */}
      {window.HUD && (
        <window.HUD
          time={G.elapsedMs}
          targetLines={G.targetLines}
          currentLines={G.linesTotal}
          score={G.score}
          level={G.level}
          combo={G.combo}
          nextPiece={(G.queue && G.queue[0]) || null}
          holdPiece={G.hold}
        />
      )}

      {/* v4.1 : canvas COLLE au HUD (plus aucun espace mort entre eux).
          Le timer + boutons pause/accueil flottent en OVERLAY sur les
          côtés du wrapper, sans bouffer de hauteur. */}
      <div style={SGS.canvasWrap}>
        {/* TIMER pill en overlay à GAUCHE (à l'opposé pause/accueil à droite) */}
        <div style={SGS.timerOverlay}>
          <span style={SGS.timerLabel}>{tr("time")}</span>
          <span style={SGS.timerValue}>{formatGameTime(G.elapsedMs)}</span>
        </div>

        {/* Boutons pause/accueil en overlay à DROITE */}
        <div style={SGS.controlsOverlay}>
          <button
            onClick={() => setPaused(p => !p)}
            style={SGS.smallBtn}
            aria-label={tr("pause")}
          >{paused ? "▶" : "⏸"}</button>
          <button
            onClick={() => {
              if (window.confirm(tr("quitGame"))) {
                if (typeof onExitToHome === "function") onExitToHome();
              }
            }}
            style={SGS.smallBtn}
            aria-label={tr("home")}
          >🏠</button>
        </div>

        {/* Canvas backing-store FIXE 400×800 (10 cols × 20 rows × 40px par cellule).
            CSS upscale via aspectRatio + height:100%. Pas de DPR dynamique — net
            sur tous écrans (le 1ère frame est déjà bien dimensionnée). */}
        <canvas
          ref={canvasRef}
          width={400}
          height={800}
          style={SGS.canvas}
        />

        {combo >= 2 && (
          <div style={SGS.comboBanner} className="pop-in" key={"combo" + combo}>
            {tr("combo")} <span style={{ color: "var(--gold)" }}>{combo}</span>
          </div>
        )}
      </div>

      {/* Boosters — onUse : applique l'effet ET décrémente l'inventaire */}
      {window.BoosterButtons && (
        <window.BoosterButtons
          inventory={(profile && profile.boosters) || {}}
          cooldowns={{}}
          coins={(profile && profile.coins) || 0}
          costs={BOOSTER_COSTS}
          onUse={(id) => {
            activateBooster(id);
            if (typeof onProfileChange === "function") {
              onProfileChange(p => ({
                ...p,
                boosters: {
                  ...((p && p.boosters) || {}),
                  [id]: Math.max(0, (((p && p.boosters) || {})[id] || 0) - 1),
                },
              }));
            }
          }}
          onBuy={(id) => {
            const cost = BOOSTER_COSTS[id] || 0;
            if (typeof onProfileChange !== "function" || !cost) return;
            onProfileChange(p => {
              const safe = p || {};
              if ((safe.coins || 0) < cost) return safe;
              if (window.STAudio) window.STAudio.play("coin");
              return {
                ...safe,
                coins: (safe.coins || 0) - cost,
                boosters: {
                  ...((safe && safe.boosters) || {}),
                  [id]: (((safe && safe.boosters) || {})[id] || 0) + 1,
                },
              };
            });
          }}
          disabled={paused || G.gameOver}
        />
      )}

      {/* Pause modal */}
      {paused && (
        <div style={SGS.pauseOverlay} onClick={() => setPaused(false)}>
          <div style={SGS.pauseCard} onClick={(e) => e.stopPropagation()}>
            <div style={SGS.pauseTitle}>{tr("pause")}</div>
            <button className="btn-3d" style={{ width: "100%", marginBottom: 12 }}
              onClick={() => setPaused(false)}>{tr("resume")}</button>
            <button className="btn-3d purple" style={{ width: "100%" }}
              onClick={() => onExitToHome && onExitToHome()}>{tr("home")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────── */
function formatGameTime(ms) {
  const total = Math.max(0, Math.floor((ms || 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
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
    targetLines: 999,    // mode marathon : pas de cible
    lastMoveWasRotation: false,
    gameOver: false,
  };
}

/* ─── Styles ─────────────────────────────────────────────────── */
const SGS = {
  root: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    background: "radial-gradient(ellipse at top, #1a2a6e, #0b1238 70%)",
  },

  /* v4.1 : timer + boutons en OVERLAYS sur les côtés du canvas
     (n'occupent pas de hauteur dans le flow) */
  timerOverlay: {
    position: "absolute",
    top: 6,
    left: 6,
    zIndex: 5,
    display: "inline-flex",
    alignItems: "baseline",
    gap: 8,
    background: "linear-gradient(180deg, rgba(20,30,80,0.85), rgba(11,18,56,0.85))",
    border: "1.5px solid var(--purple)",
    borderRadius: 100,
    padding: "5px 12px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 0 rgba(0,0,0,0.3)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: 800,
    color: "var(--sky)",
    letterSpacing: 1.5,
  },
  timerValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 16,
    color: "var(--sky)",
    letterSpacing: 1,
    textShadow: "0 1px 0 rgba(0,0,0,0.4), 0 0 8px rgba(56,189,248,0.5)",
  },
  controlsOverlay: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 5,
    display: "flex",
    gap: 6,
  },
  smallBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    fontSize: 18,
    color: "#fff",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 0 rgba(0,0,0,0.25)",
    /* v1.16 (Pino) : centre l'icône (🏠/⏸/▶) verticalement et horizontalement
       dans le bouton — sinon l'emoji "flotte" en bas à cause du baseline natif. */
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    lineHeight: 1,
  },

  canvasWrap: {
    /* flex:1 → ce wrapper PREND toute la hauteur restante (entre HUD
       et boosters). align-items:stretch → le canvas remplit la hauteur. */
    flex: 1,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "center",
    position: "relative",
    minHeight: 0,
    padding: "2px 4px",
  },
  canvas: {
    background: "var(--canvas-bg1)",
    borderRadius: 10,
    boxShadow: "0 0 24px rgba(124,58,237,0.5), inset 0 0 0 3px rgba(124,58,237,0.7)",
    touchAction: "none",
    /* v1.7 : canvas REMPLIT 100% de l'espace flex restant.
       - height:100% → toute la hauteur du wrapper (qui est flex:1)
       - width:auto + aspect-ratio 1/2 → largeur calculée auto
       - maxWidth:100% protège contre le débordement horizontal sur
         écrans très larges où le canvas pourrait dépasser le viewport. */
    height: "100%",
    width: "auto",
    aspectRatio: "1 / 2",
    maxWidth: "100%",
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
    pointerEvents: "none",
  },

  pauseOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    backdropFilter: "blur(4px)",
  },
  pauseCard: {
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "2px solid var(--purple)",
    borderRadius: 18,
    padding: 24,
    minWidth: 260,
    boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
  },
  pauseTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 36,
    color: "var(--gold)",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 4,
    textShadow: "0 3px 0 rgba(0,0,0,0.3)",
  },
};

window.GameScreen = GameScreen;
