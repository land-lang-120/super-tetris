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

  // ─── Reset particules au mount (clean state entre 2 parties)
  useEffectGS(() => {
    if (window.STParticles) window.STParticles.clear();
    return () => { if (window.STParticles) window.STParticles.clear(); };
  }, []);

  // ─── State UI (re-renders OK)
  const [tick, setTick]               = useStateGS(0);  // counter pour forcer re-render
  const [paused, setPaused]           = useStateGS(false);
  const [flashRows, setFlashRows]     = useStateGS([]);
  const [combo, setCombo]             = useStateGS(0);
  const [floatScore, setFloatScore]   = useStateGS(null); // {x,y,text}

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
    const SENSITIVITY = 24; // px par cellule de mouvement

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

    // Voile freeze légèrement bleuté quand le booster est actif
    if (window.STBoosters && window.STBoosters.isFrozen(G)) {
      ctx.save();
      ctx.fillStyle = "rgba(6, 182, 212, 0.12)";
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.restore();
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
      window.STBoosters.applyFreeze(G);
      if (window.STAudio)   window.STAudio.play("booster");
      if (window.STHaptics) window.STHaptics.vibePattern("booster");
    } else if (id === "laser") {
      const r = window.STBoosters.applyLaser(G);
      if (cv && r.line >= 0 && window.STParticles) {
        const cy = r.line * cellSize + cellSize / 2;
        for (let x = 0; x < window.STCore.COLS; x++) {
          window.STParticles.addExplosion(x * cellSize + cellSize / 2, cy, "#facc15");
        }
      }
      if (window.STAudio)   window.STAudio.play("booster");
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
      if (window.STAudio)   window.STAudio.play("booster");
      if (window.STHaptics) window.STHaptics.vibePattern("booster");
    } else if (id === "magnet") {
      const r = window.STBoosters.applyMagnet(G);
      if (cv && window.STParticles && r.cellsMoved > 0) {
        for (let x = 0; x < window.STCore.COLS; x++) {
          window.STParticles.addExplosion(
            x * cellSize + cellSize / 2,
            cv.height - cellSize,
            "#ec4899"
          );
        }
      }
      if (window.STAudio)   window.STAudio.play("booster");
      if (window.STHaptics) window.STHaptics.vibePattern("booster");
    }
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

      {/* Pause / Exit button bar */}
      <div style={SGS.controlsRow}>
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

      {/* Canvas centered — responsive : taille calculée pour remplir l'écran */}
      <div style={SGS.canvasWrap}>
        <canvas
          ref={canvasRef}
          width={400}
          height={800}
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

  controlsRow: {
    display: "flex",
    gap: 8,
    padding: "0 8px 8px",
    justifyContent: "flex-end",
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
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    minHeight: 0,
    padding: "4px 8px",
  },
  canvas: {
    background: "var(--canvas-bg1)",
    borderRadius: 10,
    boxShadow: "0 0 24px rgba(124,58,237,0.5), inset 0 0 0 3px rgba(124,58,237,0.7)",
    touchAction: "none",
    /* v1.2 fix : canvas vraiment plus grand. Ratio 1:2 (10×20).
       On part de la HAUTEUR disponible (le facteur limitant sur portrait)
       et on calcule la largeur depuis ça. Marges minimales pour HUD+boosters. */
    height: "min(calc(100vh - 260px), calc((100vw - 16px) * 2))",
    width: "auto",
    aspectRatio: "1 / 2",
    maxWidth: "calc(100vw - 16px)",
    minHeight: "400px",
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
