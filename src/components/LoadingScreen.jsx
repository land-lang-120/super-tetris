const { useState, useEffect, useRef } = React;

const LOGO_COLORS = ["#06b6d4", "#facc15", "#a855f7", "#22c55e", "#ef4444", "#3b82f6"];
const LETTERS = {
  S: ["01111", "10000", "11110", "00001", "11110"],
  U: ["10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "11110", "10000", "10000"],
  E: ["11111", "10000", "11110", "10000", "11111"],
  R: ["11110", "10001", "11110", "10100", "10010"],
  T: ["11111", "00100", "00100", "00100", "00100"],
  I: ["11111", "00100", "00100", "00100", "11111"],
};

function LoadingScreen({ onDone, minDurationMs }) {
  const [progress, setProgress] = useState(0);
  const [hint, setHint] = useState("");
  const [morphIndex, setMorphIndex] = useState(0);
  const startedRef = useRef(Date.now());
  const minMs = typeof minDurationMs === "number" ? minDurationMs : 1800;

  const hints = [
    "Astuce : utilise le hold pour mettre une piece en reserve",
    "Reussir un Tetris donne le maximum de points",
    "Les boosters se gardent entre les parties",
    "La roue de la fortune offre des recompenses chaque jour",
    "Les niveaux superieurs accelerent la chute",
  ];

  useEffect(() => {
    startedRef.current = Date.now();
    setHint(hints[Math.floor(Math.random() * hints.length)]);

    let onDoneCalled = false;
    const callOnDoneOnce = () => {
      if (onDoneCalled) return;
      onDoneCalled = true;
      setProgress(100);
      if (typeof onDone === "function") onDone();
      try { window.dispatchEvent(new Event("super-tetris-ready")); } catch (_) {}
    };
    const onDoneTimeout = setTimeout(callOnDoneOnce, minMs + 200);
    const ultimateFallback = setTimeout(callOnDoneOnce, Math.max(4000, minMs * 2));

    let raf;
    const tick = () => {
      const elapsed = Date.now() - startedRef.current;
      const pct = Math.min(100, (elapsed / minMs) * 100);
      setProgress(pct);
      if (elapsed < minMs) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const morphTimer = setInterval(() => {
      setMorphIndex((n) => n + 1);
    }, 1067);

    return () => {
      clearTimeout(onDoneTimeout);
      clearTimeout(ultimateFallback);
      clearInterval(morphTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div style={S.root}>
      <Starfield count={22} />
      <div style={S.content}>
        <div style={S.logoWrap}>
          <div style={S.logoSuper}>SUPER</div>
          <div style={S.logoTetris}>
            {"TETRIS".split("").map((letter, i) => (
              <span key={i} style={{ color: LOGO_COLORS[i % LOGO_COLORS.length] }}>{letter}</span>
            ))}
          </div>
        </div>

        <div style={S.spinnerWrap}>
          <MorphingTetromino index={morphIndex} />
        </div>

        <div style={S.barWrap}>
          <PieceProgress progress={progress} />
        </div>

        <div style={S.hint}>{hint}</div>
      </div>
    </div>
  );
}

function MorphingTetromino({ index }) {
  const pieces = window.STTetrominoes || [];
  const total = Math.max(1, pieces.length);
  const current = pieces[index % total];
  return (
    <div style={S.morphStage}>
      <TetrominoShape key={index} piece={current} unit={18} style={S.morphPiece} />
    </div>
  );
}

function PieceProgress({ progress }) {
  const cells = 18;
  const count = Math.max(1, Math.ceil((progress / 100) * cells));
  return (
    <div style={S.progressGrid}>
      {Array.from({ length: cells }).map((_, i) => (
        <span
          key={i}
          style={{
            ...S.progressCell,
            opacity: i < count ? 1 : 0.14,
            transform: i < count ? "scale(1)" : "scale(0.82)",
            background: LOGO_COLORS[i % LOGO_COLORS.length],
          }}
        />
      ))}
    </div>
  );
}

function TetrominoShape({ piece, unit, style }) {
  if (!piece) return null;
  const xs = piece.cells.map((cell) => cell[0]);
  const ys = piece.cells.map((cell) => cell[1]);
  const minX = Math.min.apply(null, xs);
  const maxX = Math.max.apply(null, xs);
  const minY = Math.min.apply(null, ys);
  const maxY = Math.max.apply(null, ys);
  const pieceW = maxX - minX + 1;
  const pieceH = maxY - minY + 1;
  const offsetX = (4 - pieceW) / 2 - minX;
  const offsetY = (4 - pieceH) / 2 - minY;
  return (
    <div style={{ ...S.tetroShape, width: unit * 4, height: unit * 4, ...style }}>
      {piece.cells.map((cell, i) => (
        <span
          key={i}
          style={{
            ...S.tetroCell,
            width: unit,
            height: unit,
            left: (cell[0] + offsetX) * unit,
            top: (cell[1] + offsetY) * unit,
            background: piece.color,
          }}
        />
      ))}
    </div>
  );
}

const S = {
  root: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(ellipse at center, #1a2a6e 0%, #0b1238 70%)",
    overflow: "hidden",
  },
  content: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 24,
    textAlign: "center",
  },
  logoWrap: {
    marginBottom: 26,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logoSuper: {
    fontFamily: "'Lilita One', cursive",
    fontSize: "clamp(25px, 7vw, 36px)",
    color: "#fff",
    letterSpacing: 7,
    marginBottom: 2,
    textTransform: "uppercase",
    textShadow: "0 3px 0 rgba(0,0,0,0.42)",
    lineHeight: 1,
  },
  logoTetris: {
    fontFamily: "'Lilita One', cursive",
    fontSize: "clamp(52px, 15vw, 82px)",
    letterSpacing: 3,
    textTransform: "uppercase",
    textShadow: "0 4px 0 rgba(0,0,0,0.42), 0 0 18px rgba(168,85,247,0.3)",
    lineHeight: 0.95,
  },
  spinnerWrap: {
    width: 82,
    height: 82,
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.06), rgba(255,255,255,0.01) 58%, transparent 60%)",
  },
  tetroShape: {
    position: "relative",
    flex: "0 0 auto",
  },
  tetroCell: {
    position: "absolute",
    borderRadius: 3,
    border: "1px solid rgba(255,255,255,0.32)",
    boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.25), inset -1px -1px 0 rgba(0,0,0,0.18)",
  },
  morphPiece: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: -36,
    marginTop: -36,
    transformOrigin: "50% 50%",
    animation: "st-loader-disc-spin 1.067s linear 1",
    filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.45))",
  },
  morphStage: {
    position: "relative",
    width: 82,
    height: 82,
  },
  barWrap: {
    width: "min(318px, 84vw)",
    minHeight: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.24)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    marginBottom: 16,
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.45)",
  },
  progressGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(18, 1fr)",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    width: "100%",
    padding: "8px 11px",
  },
  progressCell: {
    aspectRatio: "1 / 1",
    minWidth: 9,
    minHeight: 9,
    borderRadius: 3,
    border: "1px solid rgba(255,255,255,0.24)",
    boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.24), inset -1px -1px 0 rgba(0,0,0,0.2), 0 0 8px rgba(255,255,255,0.06)",
    transition: "opacity 0.16s ease, transform 0.16s ease",
  },
  hint: {
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(255,255,255,0.58)",
    maxWidth: 280,
    lineHeight: 1.5,
    minHeight: 36,
  },
};

(function () {
  if (typeof document === "undefined") return;
  if (document.getElementById("st-loader-keyframes")) return;
  const style = document.createElement("style");
  style.id = "st-loader-keyframes";
  style.textContent = [
    "@keyframes st-loader-disc-spin {",
    "0% { opacity: 0; transform: rotate(0deg) scale(0.14); filter: blur(2px); }",
    "6% { opacity: 1; transform: rotate(16deg) scale(1.12); filter: blur(0); }",
    "12% { opacity: 1; transform: rotate(32deg) scale(1); filter: blur(0); }",
    "84% { opacity: 1; transform: rotate(227deg) scale(1); filter: blur(0); }",
    "98% { opacity: 1; transform: rotate(265deg) scale(0.24); filter: blur(1.5px); }",
    "100% { opacity: 0; transform: rotate(270deg) scale(0.08); filter: blur(2.4px); }",
    "}",
  ].join("");
  document.head.appendChild(style);
})();

window.LoadingScreen = LoadingScreen;
