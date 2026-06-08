const { useState: useStateSF } = React;

const ST_TETROMINOES = [
  { id: "I", color: "#06b6d4", cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  { id: "O", color: "#facc15", cells: [[1, 0], [2, 0], [1, 1], [2, 1]] },
  { id: "T", color: "#a855f7", cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  { id: "S", color: "#22c55e", cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  { id: "Z", color: "#ef4444", cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  { id: "J", color: "#3b82f6", cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  { id: "L", color: "#f97316", cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
];

window.STTetrominoes = ST_TETROMINOES;

window.Starfield = function Starfield({ count }) {
  const [pieces] = useStateSF(() => {
    const n = count || 18;
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        piece: ST_TETROMINOES[i % ST_TETROMINOES.length],
        left: Math.random() * 105 - 8,
        size: Math.random() * 10 + 13,
        delay: Math.random() * 12,
        duration: Math.random() * 12 + 18,
        rotate: Math.floor(Math.random() * 4) * 90,
        opacity: Math.random() * 0.12 + 0.08,
      });
    }
    return arr;
  });

  return (
    <div style={SSF.root} aria-hidden="true">
      <div style={SSF.track}>
        {pieces.map((item, i) => (
          <TetrominoGhost key={i} item={item} />
        ))}
      </div>
      <div style={SSF.veil} />
    </div>
  );
};

function TetrominoGhost({ item }) {
  const unit = item.size;
  return (
    <div
      style={{
        ...SSF.piece,
        left: item.left + "%",
        width: unit * 4,
        height: unit * 4,
        opacity: item.opacity,
        animationDuration: item.duration + "s",
        animationDelay: "-" + item.delay + "s",
        "--r": item.rotate + "deg",
      }}
    >
      {item.piece.cells.map((cell, idx) => (
        <span
          key={idx}
          style={{
            ...SSF.cell,
            width: unit,
            height: unit,
            left: cell[0] * unit,
            top: cell[1] * unit,
            background: item.piece.color,
          }}
        />
      ))}
    </div>
  );
}

const SSF = {
  root: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 0,
    overflow: "hidden",
  },
  track: {
    position: "absolute",
    inset: 0,
  },
  piece: {
    position: "absolute",
    top: "-18%",
    animationName: "st-tetromino-fall",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
    filter: "drop-shadow(0 7px 10px rgba(0,0,0,0.35))",
    willChange: "transform, top",
  },
  cell: {
    position: "absolute",
    borderRadius: 4,
    border: "1px solid rgba(255,255,255,0.22)",
    boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.2), inset -2px -2px 0 rgba(0,0,0,0.18)",
  },
  veil: {
    position: "absolute",
    inset: 0,
    background: "rgba(4, 8, 32, 0.55)",
    backdropFilter: "blur(0.2px)",
  },
};

(function () {
  if (typeof document === "undefined") return;
  if (document.getElementById("st-tetromino-field-keyframes")) return;
  const style = document.createElement("style");
  style.id = "st-tetromino-field-keyframes";
  style.textContent = [
    "@keyframes st-tetromino-fall {",
    "0% { transform: translate3d(0,-18vh,0) rotate(var(--r, 0deg)); }",
    "100% { transform: translate3d(0,128vh,0) rotate(calc(var(--r, 0deg) + 90deg)); }",
    "}",
  ].join("");
  document.head.appendChild(style);
})();
