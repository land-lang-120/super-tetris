/* Super Tetris - StatsScreen
   Profil joueur + classements local / mondial / competitions. */

const { useState: useStateStats, useEffect: useEffectStats } = React;

function StatsScreen({ profile, onProfileChange, onClose }) {
  const p = profile || {};
  const history = Array.isArray(p.history) ? p.history.slice() : [];
  const sorted = history.slice().sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);
  const totalLines = history.reduce((sum, g) => sum + (g.linesTotal || 0), 0);
  const tr = (key, params) => window.STI18n ? window.STI18n.t(key, params) : key;
  const [tab, setTab] = useStateStats("local");
  const [draftName, setDraftName] = useStateStats(p.playerName || "");
  const [draftPlayerId] = useStateStats(p.playerId || makePlayerId());

  const playerId = p.playerId || draftPlayerId;
  const hasProfile = !!(p.playerName && String(p.playerName).trim());
  const globalRank = hasProfile ? estimateGlobalRank(p.bestScore || 0, p.xp || 0) : null;

  useEffectStats(() => {
    setDraftName(p.playerName || "");
  }, [p.playerName]);

  function saveProfile() {
    const clean = String(draftName || "").trim().slice(0, 18);
    if (!clean || typeof onProfileChange !== "function") return;
    onProfileChange((prev) => ({
      ...(prev || {}),
      playerName: clean,
      playerId: (prev && prev.playerId) || playerId,
      profileCreatedAt: (prev && prev.profileCreatedAt) || Date.now(),
    }));
    setDraftName(clean);
  }

  return (
    <div style={SST.root}>
      <Starfield count={16} />
      <div style={SST.header}>
        <button onClick={onClose} style={SST.backBtn} aria-label={tr("back")}>
          <span style={SST.backIcon}>{"\u2190"}</span>
        </button>
        <div style={SST.title}>{tr("ranking")}</div>
        <div style={{ width: 42 }} />
      </div>

      <div style={SST.content}>
        <section style={SST.profileCard}>
          <div style={SST.avatar}>{hasProfile ? String(p.playerName).charAt(0).toUpperCase() : "?"}</div>
          <div style={SST.profileMain}>
            <div style={SST.profileLabel}>{tr("playerProfile")}</div>
            <div style={SST.profileName}>{hasProfile ? p.playerName : tr("createProfile")}</div>
            <div style={SST.profileId}>ID {playerId}</div>
          </div>
        </section>

        <section style={SST.profileEditor}>
          <input
            style={SST.nameInput}
            value={draftName}
            maxLength={18}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder={tr("playerNamePlaceholder")}
          />
          <button className="btn-3d" style={SST.saveBtn} onClick={saveProfile}>
            {hasProfile ? tr("update") : tr("create")}
          </button>
        </section>

        <div style={SST.tabs}>
          {[
            ["local", tr("localRank")],
            ["world", tr("worldRank")],
            ["competition", tr("competitionRank")],
          ].map(([id, label]) => (
            <button
              key={id}
              style={{ ...SST.tabBtn, ...(tab === id ? SST.tabActive : null) }}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "local" && (
          <>
            <div style={SST.summaryGrid}>
              <StatCard label={tr("record")} value={formatStatsNum(p.bestScore || 0)} />
              <StatCard label={tr("games")} value={formatStatsNum(p.totalGames || history.length || 0)} />
              <StatCard label={tr("lines")} value={formatStatsNum(totalLines)} />
              <StatCard label={tr("xp")} value={formatStatsNum(p.xp || 0)} />
            </div>

            <div style={SST.sectionTitle}>{tr("topScores")}</div>
            <ScoreList sorted={sorted} tr={tr} />
          </>
        )}

        {tab === "world" && (
          <section style={SST.remoteCard}>
            {hasProfile ? (
              <>
                <div style={SST.remoteRank}>#{formatStatsNum(globalRank)}</div>
                <div style={SST.remoteTitle}>{tr("worldRank")}</div>
                <div style={SST.remoteText}>{tr("worldRankReady")}</div>
                <div style={SST.remoteMeta}>{tr("record")} {formatStatsNum(p.bestScore || 0)} · {formatStatsNum(p.xp || 0)} XP</div>
              </>
            ) : (
              <EmptyProfile tr={tr} />
            )}
          </section>
        )}

        {tab === "competition" && (
          <section style={SST.remoteCard}>
            {hasProfile ? (
              <>
                <div style={SST.competitionBadge}>🏆</div>
                <div style={SST.remoteTitle}>{tr("competitionRank")}</div>
                <div style={SST.remoteText}>{tr("competitionReady")}</div>
                <div style={SST.remoteMeta}>{tr("games")} {formatStatsNum(p.totalGames || 0)} · {tr("lines")} {formatStatsNum(totalLines)}</div>
              </>
            ) : (
              <EmptyProfile tr={tr} />
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function ScoreList({ sorted, tr }) {
  return (
    <div style={SST.list}>
      {sorted.length === 0 ? (
        <div style={SST.empty}>{tr("noScores")}</div>
      ) : sorted.map((g, i) => (
        <div key={(g.date || 0) + "-" + i} style={SST.row}>
          <div style={SST.rank}>#{i + 1}</div>
          <div style={SST.rowMain}>
            <div style={SST.score}>{formatStatsNum(g.score || 0)}</div>
            <div style={SST.meta}>
              {tr("level")} {g.level || 1} · {formatStatsNum(g.linesTotal || 0)} {tr("lines").toLowerCase()} · {formatDate(g.date, tr)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyProfile({ tr }) {
  return (
    <>
      <div style={SST.competitionBadge}>👤</div>
      <div style={SST.remoteTitle}>{tr("profileRequired")}</div>
      <div style={SST.remoteText}>{tr("profileRequiredDesc")}</div>
    </>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={SST.statCard}>
      <div style={SST.statValue}>{value}</div>
      <div style={SST.statLabel}>{label}</div>
    </div>
  );
}

function makePlayerId() {
  try {
    const raw = localStorage.getItem("st_profile");
    const p = raw ? JSON.parse(raw) : null;
    if (p && p.playerId) return p.playerId;
  } catch (_) {}
  return "ST-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Date.now().toString(36).slice(-4).toUpperCase();
}

function estimateGlobalRank(score, xp) {
  const power = Math.max(0, score || 0) + Math.max(0, xp || 0) * 3;
  return Math.max(1, 100000 - Math.floor(power / 12));
}

function formatStatsNum(n) {
  const safe = typeof n === "number" && isFinite(n) ? n : 0;
  return safe.toLocaleString("fr-FR");
}

function formatDate(ts, tr) {
  if (!ts) return tr ? tr("today") : "Aujourd'hui";
  try {
    return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  } catch (_) {
    return tr ? tr("today") : "Aujourd'hui";
  }
}

const SST = {
  root: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    background: "radial-gradient(ellipse at top, #1a2a6e, #0b1238 70%)",
    overflow: "hidden",
  },
  header: {
    display: "grid",
    gridTemplateColumns: "48px 1fr 48px",
    alignItems: "center",
    padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px",
    position: "relative",
    zIndex: 2,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    fontSize: 0,
    color: "#fff",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 0 rgba(0,0,0,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 0,
    padding: 0,
  },
  backIcon: {
    display: "block",
    fontSize: 22,
    lineHeight: "22px",
    transform: "translateY(-3px)",
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 24,
    color: "#fff",
    letterSpacing: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 16px calc(env(safe-area-inset-bottom, 0px) + 20px)",
    position: "relative",
    zIndex: 2,
  },
  profileCard: {
    display: "grid",
    gridTemplateColumns: "58px 1fr",
    gap: 12,
    alignItems: "center",
    background: "linear-gradient(180deg, rgba(255,210,63,0.14), rgba(124,58,237,0.16)), linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid rgba(255,210,63,0.42)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    boxShadow: "0 4px 12px rgba(0,0,0,0.24)",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Lilita One', cursive",
    fontSize: 28,
    color: "#2d1600",
    background: "radial-gradient(circle at 32% 26%, #fff7ad, #ffd23f 52%, #d97706 100%)",
    border: "2px solid rgba(255,255,255,0.8)",
    boxShadow: "0 4px 0 #92400e",
  },
  profileMain: { minWidth: 0 },
  profileLabel: {
    fontSize: 10,
    color: "var(--sky)",
    fontWeight: 1000,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  profileName: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 22,
    color: "#fff",
    marginTop: 2,
  },
  profileId: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: 900,
  },
  profileEditor: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 8,
    marginBottom: 12,
  },
  nameInput: {
    minWidth: 0,
    height: 42,
    borderRadius: 12,
    border: "1.5px solid rgba(124,58,237,0.5)",
    background: "rgba(0,0,0,0.32)",
    color: "#fff",
    padding: "0 12px",
    fontSize: 14,
    fontWeight: 900,
    outline: "none",
  },
  saveBtn: {
    minWidth: 92,
    minHeight: 42,
    fontSize: 13,
    padding: "8px 12px",
  },
  tabs: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
    marginBottom: 14,
  },
  tabBtn: {
    minHeight: 38,
    borderRadius: 10,
    border: "1.5px solid rgba(124,58,237,0.36)",
    background: "rgba(0,0,0,0.28)",
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: 1000,
    textTransform: "uppercase",
    padding: "6px 7px",
  },
  tabActive: {
    color: "#fff",
    background: "linear-gradient(180deg, var(--purple), var(--purple-d))",
    boxShadow: "0 3px 0 rgba(0,0,0,0.28)",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 22,
  },
  statCard: {
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid rgba(124,58,237,0.45)",
    borderRadius: 14,
    padding: "14px 12px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  },
  statValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 24,
    color: "var(--gold)",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.62)",
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 900,
    color: "var(--sky)",
    letterSpacing: 2,
    textTransform: "uppercase",
    margin: "0 0 8px 4px",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "44px 1fr",
    alignItems: "center",
    gap: 10,
    background: "rgba(0,0,0,0.32)",
    border: "1px solid rgba(124,58,237,0.35)",
    borderRadius: 12,
    padding: 10,
  },
  rank: {
    fontFamily: "'Lilita One', cursive",
    color: "var(--gold)",
    fontSize: 18,
    textAlign: "center",
  },
  rowMain: { minWidth: 0 },
  score: {
    fontFamily: "'Lilita One', cursive",
    color: "#fff",
    fontSize: 19,
  },
  meta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.58)",
    marginTop: 2,
  },
  empty: {
    padding: 18,
    background: "rgba(0,0,0,0.32)",
    border: "1px solid rgba(124,58,237,0.35)",
    borderRadius: 12,
    color: "rgba(255,255,255,0.68)",
    textAlign: "center",
    fontSize: 13,
  },
  remoteCard: {
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid rgba(124,58,237,0.45)",
    borderRadius: 14,
    padding: 18,
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  },
  remoteRank: {
    fontFamily: "'Lilita One', cursive",
    color: "var(--gold)",
    fontSize: 42,
    textShadow: "0 3px 0 rgba(0,0,0,0.35)",
  },
  competitionBadge: {
    fontSize: 46,
    marginBottom: 8,
  },
  remoteTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 22,
    color: "#fff",
    marginBottom: 6,
  },
  remoteText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    lineHeight: 1.4,
    fontWeight: 800,
  },
  remoteMeta: {
    marginTop: 12,
    padding: "8px 10px",
    borderRadius: 10,
    background: "rgba(0,0,0,0.26)",
    color: "var(--sky)",
    fontSize: 12,
    fontWeight: 1000,
  },
};

window.StatsScreen = StatsScreen;
