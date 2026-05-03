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

  // ─── Reset particules + VFX boosters au mount (clean state entre 2 parties)
  useEffectGS(() => {
    if (window.STParticles)  window.STParticles.clear();
    if (window.STBoosterFX)  window.STBoosterFX.clear();
    return () => {
      if (window.STParticles)  window.STParticles.clear();
      if (window.STBoosterFX)  window.STBoosterFX.clear();
    };
  }, []);

  // ─── v1.12 BUG-ST-1 : CANVAS PIXEL-PERFECT IMMÉDIAT (pas de flou au démarrage)
  // Le bug v1.11 : useEffect = async, donc le canvas reste à 1×1 pour le 1er render
  // → backing store minuscule → upscale énorme → pièces FLOUES les premières secondes.
  //
  // Fix v1.12 : utilise React.useLayoutEffect (SYNCHRONE, fire avant peinture browser).
  // Combiné avec un sizing initial via cv.parentElement.getBoundingClientRect() qui
  // donne la taille AVANT la 1ère frame de paint. Plus aucun flou au démarrage.
  React.useLayoutEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;

    function syncSize() {
      // On lit la taille du PARENT (canvasWrap qui a flex:1) car le canvas
      // lui-même peut être à 1×1 au tout 1er paint. Le parent est correct
      // dès le 1er layout React.
      const parent = cv.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      // Le canvas suit aspect-ratio 1/2 et height=100% → on calcule sa taille
      // réelle d'affichage à partir du parent (max-width contraint).
      const parentH = rect.height;
      const parentW = rect.width;
      // Aspect 1:2 → on prend min(parentH, parentW × 2) pour la hauteur
      const dispH = Math.min(parentH, parentW * 2);
      const dispW = dispH / 2;
      const w = Math.max(1, Math.round(dispW * dpr));
      const h = Math.max(1, Math.round(dispH * dpr));
      if (cv.width !== w || cv.height !== h) {
        cv.width  = w;
        cv.height = h;
        setTick(t => t + 1);
      }
    }

    // Sync IMMÉDIAT (synchrone, avant 1er paint browser grâce à useLayoutEffect)
    syncSize();

    // ResizeObserver pour les resize ultérieurs (rotation, redim window)
    let ro = null;
    if (typeof ResizeObserver === "function") {
      ro = new ResizeObserver(syncSize);
      ro.observe(cv.parentElement || cv);
    } else {
      window.addEventListener("resize", syncSize);
    }
    return function cleanup() {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", syncSize);
    };
  }, []);

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

  // ─── Touch controls : swipes + tap (rotate) + double-tap (hard drop)
  useEffectGS(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    let startX = 0, startY = 0, startT = 0, lastDy = 0, accDx = 0, accDy = 0;
    let lastTapTime = 0;
    let lastRotateTime = 0;            // v1.12 BUG-ST-2 : cooldown anti-hold
    const SENSITIVITY = 24;            // px par cellule de mouvement
    const DOUBLE_TAP_MS = 180;         // v1.12 BUG-ST-2 : 300→180ms (était trop sensible)
    const ROTATE_HOLD_GUARD_MS = 280;  // v1.12 BUG-ST-2 : pas de hold dans X ms après rotate

    const onStart = (e) => {
      const t = e.touches ? e.touches[0] : e;
      startX = t.clientX; startY = t.clientY; startT = Date.now();
      lastDy = 0; accDx = 0; accDy = 0;
    };
    const onMove = (e) => {
      const G = gameRef.current;
      if (!G || G.gameOver || paused) return;
      const t = e.touches ? e.touches[0] : e;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      // Mouvement horizontal
      while (Math.abs(dx - accDx) >= SENSITIVITY) {
        if (dx > accDx) { if (movePiece(G,  1, 0)) fxMove(); accDx += SENSITIVITY; }
        else            { if (movePiece(G, -1, 0)) fxMove(); accDx -= SENSITIVITY; }
      }
      // Soft drop vers le bas
      if (dy - accDy >= SENSITIVITY) {
        while (dy - accDy >= SENSITIVITY) {
          if (movePiece(G, 0, 1)) { G.score += window.STScoring.softDropScore(); fxMove(); }
          accDy += SENSITIVITY;
        }
      }
      setTick(s => s + 1);
    };
    const onEnd = (e) => {
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
      // Tap court → rotate (v1.12 : double-tap hold protégé contre faux positifs)
      if (total < 16 && dur < 250) {
        const now = Date.now();
        const sinceLastRotate = now - lastRotateTime;
        // Double-tap = HOLD, mais SEULEMENT si :
        //   1) Le précédent tap était récent (< DOUBLE_TAP_MS = 180ms)
        //   2) Aucune rotation < ROTATE_HOLD_GUARD_MS (280ms)
        //   → empêche le hold accidentel quand l'utilisateur tape vite pour rotater
        if (now - lastTapTime < DOUBLE_TAP_MS && sinceLastRotate > ROTATE_HOLD_GUARD_MS) {
          holdPiece(G);
          fxHold();
          lastTapTime = 0;
        } else {
          if (rotatePiece(G, 1)) {
            fxRotate();
            lastRotateTime = now;
          }
          lastTapTime = now;
        }
        setTick(s => s + 1);
      }
    };

    cv.addEventListener("touchstart", onStart, { passive: true });
    cv.addEventListener("touchmove",  onMove,  { passive: true });
    cv.addEventListener("touchend",   onEnd,   { passive: true });
    cv.addEventListener("mousedown",  onStart);
    cv.addEventListener("mousemove",  (e) => { if (e.buttons) onMove(e); });
    cv.addEventListener("mouseup",    onEnd);

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

      // Freeze booster : bloque la gravité (mais pas les inputs)
      if (window.STBoosters && window.STBoosters.isFrozen(G)) {
        // Sync VFX freeze : actif tant que isFrozen
        if (window.STBoosterFX) window.STBoosterFX.setFreezeActive(true);
        setTick(t => t + 1);
        return;
      } else if (window.STBoosterFX && window.STBoosterFX.hasFreeze()) {
        // Freeze terminé : retirer l'overlay VFX
        window.STBoosterFX.setFreezeActive(false);
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

  /** Active un booster acheté (clic sur un BoosterButton). */
  function activateBooster(id) {
    const G = gameRef.current;
    if (!G || G.gameOver || paused || !window.STBoosters) return;
    const cv = canvasRef.current;
    const cellSize = cv ? Math.floor(cv.width / window.STCore.COLS) : 30;

    if (id === "freeze") {
      // ❄️ FREEZE : applique le timer + spawn VFX flakes/crystals/voile
      window.STBoosters.applyFreeze(G);
      if (cv && window.STBoosterFX) {
        window.STBoosterFX.spawnFreezeEffects(cv.width, cv.height);
      }
    } else if (id === "laser") {
      // ⚡ LASER : VFX beams qui balaient AVANT que les lignes s'effacent
      // (delay 80ms × N + 520ms par beam). Pour synchroniser : on spawn
      // les beams VFX d'abord, puis applique l'effet logique avec un timeout
      // équivalent à la durée totale du sweep.
      const targets = [];
      for (let r = window.STCore.ROWS - 1; r >= 0 && targets.length < 4; r--) {
        let hasCell = false;
        for (let c = 0; c < window.STCore.COLS; c++) {
          if (G.grid[r][c]) { hasCell = true; break; }
        }
        if (hasCell) targets.push(r);
      }
      if (cv && window.STBoosterFX && targets.length > 0) {
        window.STBoosterFX.spawnLaser(targets, cellSize, cv.width);
      }
      // Effet logique appliqué après le sweep VFX (effet visuel d'abord)
      const sweepTotalMs = (targets.length - 1) * 80 + 320;
      setTimeout(function () {
        const result = window.STBoosters.applyLaser(G);
        if (cv && window.STParticles && result.lines.length > 0) {
          result.lines.forEach(function (rowIdx) {
            const cy = rowIdx * cellSize + cellSize / 2;
            for (let x = 0; x < window.STCore.COLS; x++) {
              window.STParticles.addExplosion(x * cellSize + cellSize / 2, cy, "#ff2020");
            }
          });
        }
        setTick(t => t + 1);
      }, sweepTotalMs);
    } else if (id === "meteor") {
      // ☄️ METEOR : 10 météores VFX qui tombent du haut, delay 80ms entre.
      // L'effet logique est appliqué APRÈS la fin de tous les météores.
      if (cv && window.STBoosterFX) {
        window.STBoosterFX.spawnMeteor(window.STCore.COLS, cellSize);
      }
      // Calcule quand tous les météores auront atteint le bas
      // (10 météores × 80ms delay + ~1500ms chute moyenne)
      const meteorTotalMs = window.STCore.COLS * 80 + 1500;
      setTimeout(function () {
        const result = window.STBoosters.applyMeteor(G);
        if (cv && window.STParticles) {
          result.columns.forEach(function (col) {
            if (col.hits > 0) {
              const px = col.col * cellSize + cellSize / 2;
              const py = col.topRow * cellSize + cellSize / 2;
              window.STParticles.addShockwave(px, py);
              window.STParticles.addExplosion(px, py, "#ff9000");
            }
          });
        }
        if (window.STBoosterFX) window.STBoosterFX.killAllMeteors();
        setTick(t => t + 1);
      }, meteorTotalMs);
    } else if (id === "magnet") {
      // 🧲 MAGNET : 5 vagues violettes VFX + effet logique immédiat
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
      // Bonus combo si magnet a déclenché des line clears
      if (r.linesCleared > 0) {
        G.linesTotal = (G.linesTotal || 0) + r.linesCleared;
      }
    }

    // FX communs à tous les boosters
    if (window.STAudio)   window.STAudio.play("booster");
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
          <span style={SGS.timerLabel}>TIME</span>
          <span style={SGS.timerValue}>{formatGameTime(G.elapsedMs)}</span>
        </div>

        {/* Boutons pause/accueil en overlay à DROITE */}
        <div style={SGS.controlsOverlay}>
          <button
            onClick={() => setPaused(p => !p)}
            style={SGS.smallBtn}
            aria-label="Pause"
          >{paused ? "▶" : "⏸"}</button>
          <button
            onClick={() => {
              if (window.confirm("Quitter la partie ?")) {
                if (typeof onExitToHome === "function") onExitToHome();
              }
            }}
            style={SGS.smallBtn}
            aria-label="Accueil"
          >🏠</button>
        </div>

        {/* Canvas pixel-perfect : width/height attributes settés dynamiquement
            par le ResizeObserver dans useEffect (cv.width = displayWidth × DPR).
            On démarre avec 1×1 pour éviter le flash de display 0×0 vide. */}
        <canvas
          ref={canvasRef}
          width={1}
          height={1}
          style={SGS.canvas}
        />

        {combo >= 2 && (
          <div style={SGS.comboBanner} className="pop-in" key={"combo" + combo}>
            COMBO <span style={{ color: "var(--gold)" }}>{combo}</span>
          </div>
        )}
      </div>

      {/* Boosters — onUse : applique l'effet ET décrémente l'inventaire */}
      {window.BoosterButtons && (
        <window.BoosterButtons
          inventory={(profile && profile.boosters) || {}}
          cooldowns={{}}
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
            window.alert("Boutique disponible bientôt !");
          }}
          disabled={paused || G.gameOver}
        />
      )}

      {/* Pause modal */}
      {paused && (
        <div style={SGS.pauseOverlay} onClick={() => setPaused(false)}>
          <div style={SGS.pauseCard} onClick={(e) => e.stopPropagation()}>
            <div style={SGS.pauseTitle}>PAUSE</div>
            <button className="btn-3d" style={{ width: "100%", marginBottom: 12 }}
              onClick={() => setPaused(false)}>Reprendre</button>
            <button className="btn-3d purple" style={{ width: "100%" }}
              onClick={() => onExitToHome && onExitToHome()}>Accueil</button>
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
