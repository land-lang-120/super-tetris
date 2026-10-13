/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — BonusGameScreen (Composant React)
   ═══════════════════════════════════════════════════════════════════
   Écran du Mini-Jeu Bonus "Block Crush" (Vague Montante & Cascades 3D) :
     - Gameplay fidèle à la vidéo de référence :
       * Tétrominos SRS aléatoires en descente
       * Vague montante depuis le bas poussant le plateau
       * Système d'effondrement gravitationnel et destructions en cascade
     - Rendu Canvas 60 FPS haute définition avec DPR et voxels 3D
     - Double ergonomie : gestes tactiles fluides + boutons arcade + clavier desktop
     - Barre de progression de la vague montante en temps réel
     - Bannières dynamiques de combos ("DOUBLE CRUSH", "MEGA CASCADE")
     - Modale de récompenses finales (pièces d'or & boosters)
   ═══════════════════════════════════════════════════════════════════ */

const { useState: useStateBonus, useEffect: useEffectBonus, useRef: useRefBonus, useCallback: useCallbackBonus } = React;

function BonusGameScreen({ onComplete, onClose }) {
  const canvasRef = useRefBonus(null);
  const engineRef = useRefBonus(null);
  const animFrameIdRef = useRefBonus(null);
  const lastTimeRef = useRefBonus(0);

  const [gameState, setGameState] = useStateBonus({
    score: 0,
    linesCleared: 0,
    waveCount: 1,
    maxCascade: 0,
    currentCascade: 0,
    waveProgress: 0,
    state: "playing",
    nextPiece: null,
  });

  const [endGameData, setEndGameData] = useStateBonus(null);

  const touchStateRef = useRefBonus({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastX: 0,
    lastY: 0,
    isDragging: false,
    hasMoved: false,
  });

  const tr = (key, params) => (window.STI18n ? window.STI18n.t(key, params) : key);

  // Initialisation du Moteur Crush et Boucle de Rendu
  useEffectBonus(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Création de l'instance du moteur Crush conforme à la vidéo
    const engine = window.STCrushEngine.createCrushGame(
      () => {},
      (overData) => {
        setEndGameData({
          ...overData,
          isWin: false,
          coins: Math.max(100, Math.min(350, Math.floor(overData.score * 0.1) + 100)),
        });
      },
      (winData) => {
        setEndGameData({
          ...winData,
          isWin: true,
          coins: 250,
        });
      }
    );
    engineRef.current = engine;

    // Redimensionnement fluide au devicePixelRatio
    function handleResize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    // Boucle d'animation continue 60 FPS
    // IMPORTANT : utilise engineRef.current (pas la closure engine)
    // pour que handleRestartBonus puisse swapper le moteur à chaud.
    let lastHudUpdate = 0;
    function loop(timestamp) {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min(0.05, (timestamp - lastTimeRef.current) / 1000);
      lastTimeRef.current = timestamp;

      const eng = engineRef.current;
      if (eng) {
        const rect = canvas.getBoundingClientRect();
        eng.update(dt);
        eng.render(ctx, rect.width, rect.height);

        // Throttle HUD React update à ~100ms (BUG #3 fix inclus)
        if (timestamp - lastHudUpdate > 100) {
          setGameState(eng.getState());
          lastHudUpdate = timestamp;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    }

    animFrameIdRef.current = requestAnimationFrame(loop);

    // Contrôles Clavier Desktop
    function handleKeyDown(e) {
      if (!engineRef.current) return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        engineRef.current.moveLeft();
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        engineRef.current.moveRight();
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        engineRef.current.rotateCW();
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        engineRef.current.softDrop();
      } else if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        engineRef.current.hardDrop();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // ─── Gestion des Gestes Tactiles sur le Canvas ─────────────────
  const handlePointerDown = (e) => {
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    touchStateRef.current = {
      startX: clientX,
      startY: clientY,
      startTime: Date.now(),
      lastX: clientX,
      lastY: clientY,
      isDragging: true,
      hasMoved: false,
    };
  };

  const handlePointerMove = (e) => {
    if (!touchStateRef.current.isDragging || !engineRef.current) return;

    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    const dx = clientX - touchStateRef.current.lastX;
    const dy = clientY - touchStateRef.current.lastY;
    const thresholdX = 26;
    const thresholdY = 32;

    // Déplacement horizontal pas à pas
    if (Math.abs(dx) > thresholdX) {
      if (dx > 0) {
        engineRef.current.moveRight();
      } else {
        engineRef.current.moveLeft();
      }
      touchStateRef.current.lastX = clientX;
      touchStateRef.current.hasMoved = true;
    }

    // Descente douce si glissement vers le bas
    if (dy > thresholdY) {
      engineRef.current.softDrop();
      touchStateRef.current.lastY = clientY;
      touchStateRef.current.hasMoved = true;
    }
  };

  const handlePointerUp = (e) => {
    if (!touchStateRef.current.isDragging || !engineRef.current) return;
    touchStateRef.current.isDragging = false;

    const dur = Date.now() - touchStateRef.current.startTime;
    const clientX = e.clientX ?? (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : touchStateRef.current.lastX);
    const clientY = e.clientY ?? (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : touchStateRef.current.lastY);

    const totalDx = Math.abs(clientX - touchStateRef.current.startX);
    const totalDy = Math.abs(clientY - touchStateRef.current.startY);

    // Tap rapide sans grand mouvement = Rotation !
    if (dur < 280 && totalDx < 16 && totalDy < 16) {
      engineRef.current.rotateCW();
    }
  };

  // ─── Actions des Boutons Arcade ────────────────────────────────
  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const handleAction = (type) => {
    if (!engineRef.current) return;
    triggerHaptic();
    if (type === "left") engineRef.current.moveLeft();
    else if (type === "right") engineRef.current.moveRight();
    else if (type === "rotate") engineRef.current.rotateCW();
    else if (type === "soft") engineRef.current.softDrop();
    else if (type === "hard") engineRef.current.hardDrop();
  };

  const handleClaimReward = () => {
    if (typeof onComplete === "function") {
      const earnedCoins = (endGameData && endGameData.coins) || 250;
      onComplete({
        coins: earnedCoins,
        boosters: { laser: 1, magnet: 1 },
      });
    }
  };

  const handleRestartBonus = () => {
    setEndGameData(null);
    // Reset le HUD React
    setGameState({
      score: 0, linesCleared: 0, waveCount: 1,
      maxCascade: 0, currentCascade: 0, waveProgress: 0,
      state: "playing", nextPiece: null,
    });
    if (canvasRef.current && window.STCrushEngine) {
      // Créer un nouveau moteur — la boucle RAF le ramassera automatiquement
      // via engineRef.current (pas de closure capturée)
      const engine = window.STCrushEngine.createCrushGame(
        () => {},
        (overData) => {
          setEndGameData({
            ...overData,
            isWin: false,
            coins: Math.max(100, Math.min(350, Math.floor(overData.score * 0.1) + 100)),
          });
        },
        (winData) => {
          setEndGameData({
            ...winData,
            isWin: true,
            coins: 250,
          });
        }
      );
      engineRef.current = engine;
      // Reset le timestamp pour éviter un dt géant à la reprise
      lastTimeRef.current = 0;
    }
  };

  return (
    <div style={SB.root}>
      {/* ─── Top Bar ─────────────────────────────────────────────── */}
      <div style={SB.header}>
        <button onClick={onClose} style={SB.backBtn} aria-label={tr("back")}>
          ‹
        </button>

        {/* Badge Vague Montante */}
        <div style={SB.waveBadge}>
          <span style={SB.waveIcon}>🌊</span>
          <span style={SB.waveText}>VAGUE {gameState.waveCount}</span>
        </div>

        {/* Score & Lignes */}
        <div style={SB.scorePill}>
          <span style={SB.coinIcon}>👑</span>
          <span style={SB.scoreValue}>{gameState.score}</span>
        </div>
      </div>

      {/* ─── Jauge de Vague Montante ────────────────────────────── */}
      <div style={SB.waveProgressWrap}>
        <div style={SB.waveHeaderRow}>
          <span style={SB.waveLabel}>
            {gameState.waveProgress > 0.75 ? "⚠️ ALERTE : VAGUE IMMINENTE !" : "PROCHAINE VAGUE MONTANTE :"}
          </span>
          <span style={SB.linesCount}>⚡ Lignes : {gameState.linesCleared}</span>
        </div>
        <div style={SB.progressBarTrack}>
          <div
            style={{
              ...SB.progressBarFill,
              width: `${Math.round(gameState.waveProgress * 100)}%`,
              background:
                gameState.waveProgress > 0.75
                  ? "linear-gradient(90deg, #ef4444, #f97316)"
                  : "linear-gradient(90deg, #00d4e0, #a855f7)",
            }}
          />
        </div>
      </div>

      {/* ─── Bannière de Combo Cascade ──────────────────────────── */}
      {gameState.currentCascade > 1 && (
        <div style={SB.cascadeBanner} className="pop-in">
          <span style={SB.cascadeEmoji}>💥</span>
          <span style={SB.cascadeText}>
            {gameState.currentCascade === 2
              ? "DOUBLE CRUSH ! ×2"
              : gameState.currentCascade === 3
              ? "TRIPLE CASCADE ! ×3"
              : `MEGA CASCADE ! ×${gameState.currentCascade}`}
          </span>
        </div>
      )}

      {/* ─── Zone de Jeu Canvas ─────────────────────────────────── */}
      <div style={SB.canvasContainer}>
        <canvas
          ref={canvasRef}
          style={SB.canvas}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        {/* Aperçu Prochaine Pièce (Next Piece HUD) */}
        {gameState.nextPiece && (
          <div style={SB.nextPieceBadge}>
            <div style={SB.nextPieceLabel}>SUIVANT</div>
            <div style={SB.nextPiecePreview}>
              {gameState.nextPiece.matrix.map((row, r) => (
                <div key={r} style={{ display: "flex" }}>
                  {row.map((cell, c) => (
                    <div
                      key={c}
                      style={{
                        width: 10,
                        height: 10,
                        margin: 1,
                        borderRadius: 2,
                        background: cell ? gameState.nextPiece.color : "transparent",
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Pavé de Contrôles Arcade Tactiles ──────────────────── */}
      <div style={SB.controlsContainer}>
        <div style={SB.controlRow}>
          {/* Gauche */}
          <button
            onPointerDown={() => handleAction("left")}
            style={SB.ctrlBtn}
            className="btn-3d"
            aria-label="Gauche"
          >
            ◀
          </button>

          {/* Rotation */}
          <button
            onPointerDown={() => handleAction("rotate")}
            style={{ ...SB.ctrlBtn, ...SB.rotateBtn }}
            className="btn-3d"
            aria-label="Tourner"
          >
            ↻
          </button>

          {/* Droite */}
          <button
            onPointerDown={() => handleAction("right")}
            style={SB.ctrlBtn}
            className="btn-3d"
            aria-label="Droite"
          >
            ▶
          </button>

          {/* Soft Drop */}
          <button
            onPointerDown={() => handleAction("soft")}
            style={{ ...SB.ctrlBtn, ...SB.softBtn }}
            className="btn-3d"
            aria-label="Descente douce"
          >
            ▼
          </button>

          {/* Hard Drop (Slam) */}
          <button
            onPointerDown={() => handleAction("hard")}
            style={{ ...SB.ctrlBtn, ...SB.hardBtn }}
            className="btn-3d"
            aria-label="Hard Drop"
          >
            ⏬ SLAM
          </button>
        </div>
      </div>

      {/* ─── Modale de Fin de Partie (Victoire ou Game Over) ─────── */}
      {endGameData && (
        <div style={SB.modalOverlay}>
          <div style={SB.victoryCard} className="float">
            <div style={SB.victoryIcon}>{endGameData.isWin ? "🏆" : "💥"}</div>
            <h2 style={SB.victoryTitle}>
              {endGameData.isWin ? "VICTOIRE SUPER BONUS !" : "SESSION TERMINÉE !"}
            </h2>
            <p style={SB.victorySub}>
              {endGameData.isWin
                ? "Vous avez écrasé les vagues avec brio !"
                : "La vague a submergé le sommet ! Voici votre trésor :"}
            </p>

            {/* Statistiques de Session */}
            <div style={SB.statsGrid}>
              <div style={SB.statBox}>
                <span style={SB.statLabel}>SCORE</span>
                <span style={SB.statVal}>{endGameData.score}</span>
              </div>
              <div style={SB.statBox}>
                <span style={SB.statLabel}>LIGNES</span>
                <span style={SB.statVal}>{endGameData.linesCleared}</span>
              </div>
              <div style={SB.statBox}>
                <span style={SB.statLabel}>MAX CASCADE</span>
                <span style={SB.statVal}>×{endGameData.maxCascade || 1}</span>
              </div>
            </div>

            {/* Récompenses Gagnées */}
            <div style={SB.rewardRow}>
              <div style={SB.rewardItem}>
                <span style={SB.rewardEmoji}>👑</span>
                <span style={SB.rewardAmount}>+{endGameData.coins || 250} Pièces</span>
              </div>
              <div style={SB.rewardItem}>
                <span style={SB.rewardEmoji}>⚡</span>
                <span style={SB.rewardAmount}>+1 Laser</span>
              </div>
              <div style={SB.rewardItem}>
                <span style={SB.rewardEmoji}>🧲</span>
                <span style={SB.rewardAmount}>+1 Magnet</span>
              </div>
            </div>

            <div style={SB.modalButtons}>
              <button onClick={handleClaimReward} className="btn-3d gold" style={SB.claimBtn}>
                🎁 RÉCUPÉRER ET SORTIR
              </button>
              <button onClick={handleRestartBonus} style={SB.retryBtn}>
                🔄 REJOUER LA VAGUE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SB = {
  root: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    background: "#080d28",
    overflow: "hidden",
    userSelect: "none",
    touchAction: "none",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "calc(env(safe-area-inset-top, 0px) + 8px) 16px 4px",
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: "linear-gradient(180deg, var(--bg2, #1b285d), var(--bg1, #0f1738))",
    border: "1.5px solid var(--purple, #7c3aed)",
    color: "#fff",
    fontSize: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 3px 0 rgba(0,0,0,0.3)",
  },
  waveBadge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(124, 58, 237, 0.25)",
    border: "1.5px solid var(--purple, #7c3aed)",
    borderRadius: 100,
    padding: "4px 12px",
  },
  waveIcon: { fontSize: 14 },
  waveText: {
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
    fontSize: 13,
    color: "#fff",
    letterSpacing: 0.8,
  },
  scorePill: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "linear-gradient(180deg, var(--bg2, #1b285d), var(--bg1, #0f1738))",
    border: "1.5px solid var(--gold, #ffd23f)",
    borderRadius: 100,
    padding: "4px 12px",
  },
  coinIcon: { fontSize: 14 },
  scoreValue: {
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
    fontSize: 15,
    color: "var(--gold, #ffd23f)",
  },
  waveProgressWrap: {
    padding: "2px 16px 6px",
    display: "flex",
    flexDirection: "column",
    gap: 3,
    zIndex: 10,
  },
  waveHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  waveLabel: {
    fontSize: 10,
    fontWeight: 800,
    color: "rgba(255, 255, 255, 0.75)",
    letterSpacing: 0.5,
  },
  linesCount: {
    fontSize: 10,
    fontWeight: 800,
    color: "var(--cyan, #00d4e0)",
  },
  progressBarTrack: {
    width: "100%",
    height: 6,
    background: "rgba(255, 255, 255, 0.12)",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)",
  },
  progressBarFill: {
    height: "100%",
    transition: "width 0.1s linear, background 0.3s ease",
    borderRadius: 10,
    boxShadow: "0 0 8px rgba(0, 212, 224, 0.5)",
  },
  cascadeBanner: {
    position: "absolute",
    top: "calc(env(safe-area-inset-top, 0px) + 72px)",
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(90deg, #ffd23f, #f97316)",
    color: "#080d28",
    padding: "6px 18px",
    borderRadius: 30,
    fontWeight: 900,
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: 6,
    boxShadow: "0 0 20px rgba(255, 210, 63, 0.8)",
    zIndex: 25,
    pointerEvents: "none",
  },
  cascadeEmoji: { fontSize: 16 },
  cascadeText: { letterSpacing: 0.5 },
  canvasContainer: {
    flex: 1,
    position: "relative",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  canvas: {
    width: "100%",
    height: "100%",
    display: "block",
    cursor: "pointer",
  },
  nextPieceBadge: {
    position: "absolute",
    top: 10,
    right: 14,
    background: "rgba(15, 23, 56, 0.85)",
    border: "1px solid rgba(124, 58, 237, 0.4)",
    borderRadius: 10,
    padding: "6px 8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    pointerEvents: "none",
  },
  nextPieceLabel: {
    fontSize: 8,
    fontWeight: 900,
    color: "rgba(255, 255, 255, 0.6)",
    letterSpacing: 0.5,
  },
  nextPiecePreview: {
    display: "flex",
    flexDirection: "column",
  },
  controlsContainer: {
    padding: "8px 12px calc(env(safe-area-inset-bottom, 0px) + 12px)",
    background: "linear-gradient(180deg, transparent, rgba(8, 13, 40, 0.98))",
    zIndex: 10,
  },
  controlRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    maxWidth: 440,
    margin: "0 auto",
  },
  ctrlBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    background: "linear-gradient(180deg, #2b3974, #182352)",
    border: "1.5px solid rgba(255,255,255,0.15)",
    color: "#fff",
    fontSize: 18,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 0 #0d1538",
    transition: "transform 0.08s ease, background 0.08s ease",
  },
  rotateBtn: {
    background: "linear-gradient(180deg, #9333ea, #6b21a8)",
    border: "1.5px solid #a855f7",
    boxShadow: "0 4px 0 #4c1d95",
  },
  softBtn: {
    background: "linear-gradient(180deg, #0284c7, #0369a1)",
    border: "1.5px solid #38bdf8",
    boxShadow: "0 4px 0 #075985",
  },
  hardBtn: {
    flex: 1.3,
    background: "linear-gradient(180deg, #22c55e, #16a34a)",
    border: "1.5px solid #4ade80",
    boxShadow: "0 4px 0 #15803d",
    fontSize: 14,
    letterSpacing: 0.5,
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.85)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  victoryCard: {
    background: "linear-gradient(180deg, var(--bg2, #1b285d), var(--bg1, #0f1738))",
    border: "2px solid var(--gold, #ffd23f)",
    borderRadius: 20,
    padding: "24px 20px",
    width: "100%",
    maxWidth: 360,
    textAlign: "center",
    boxShadow: "0 12px 40px rgba(0,0,0,0.8), 0 0 30px rgba(255, 210, 63, 0.3)",
  },
  victoryIcon: {
    fontSize: 48,
    marginBottom: 6,
    filter: "drop-shadow(0 4px 10px rgba(255, 210, 63, 0.5))",
  },
  victoryTitle: {
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
    fontSize: 22,
    color: "var(--gold, #ffd23f)",
    margin: "0 0 6px",
    letterSpacing: 0.8,
  },
  victorySub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    margin: "0 0 16px",
    fontWeight: 700,
    lineHeight: 1.4,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    background: "rgba(255, 255, 255, 0.06)",
    borderRadius: 10,
    padding: "8px 4px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  statLabel: {
    display: "block",
    fontSize: 9,
    fontWeight: 900,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  statVal: {
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
    fontSize: 16,
    color: "#fff",
  },
  rewardRow: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 20,
  },
  rewardItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    padding: "8px 14px",
    border: "1px solid rgba(255, 255, 255, 0.12)",
  },
  rewardEmoji: { fontSize: 18 },
  rewardAmount: {
    fontFamily: "'Lilita One', 'Nunito', system-ui, sans-serif",
    fontSize: 15,
    color: "#fff",
    letterSpacing: 0.5,
  },
  modalButtons: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  claimBtn: {
    width: "100%",
    padding: "14px 18px",
    fontSize: 15,
    letterSpacing: 0.8,
    borderRadius: 12,
    cursor: "pointer",
  },
  retryBtn: {
    width: "100%",
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 800,
    color: "rgba(255, 255, 255, 0.75)",
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    cursor: "pointer",
  },
};

window.BonusGameScreen = BonusGameScreen;
