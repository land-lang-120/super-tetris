/* Super Tetris - ShopScreen
   Packs de boosters + pieces par pub recompensee.
   Les couleurs des boosters reprennent exactement les gradients du gameplay. */

const SHOP_BOOSTERS = {
  freeze: {
    icon: "❄️", label: "Freeze", descKey: "freezeDesc",
    grad: ["#b0eeff", "#30b0e8", "#0870c0"],
    ring: "#30b0e8", shadow3d: "#054880", glow: "rgba(0,120,200,0.55)",
  },
  laser: {
    icon: "⚡", label: "Laser", descKey: "laserDesc",
    grad: ["#ffb0b0", "#ff2020", "#aa0000"],
    ring: "#ff2020", shadow3d: "#700000", glow: "rgba(220,0,0,0.55)",
  },
  meteor: {
    icon: "☄️", label: "Meteor", descKey: "meteorDesc",
    grad: ["#ffe090", "#ff9000", "#c05500"],
    ring: "#ff9000", shadow3d: "#7a3000", glow: "rgba(200,100,0,0.55)",
  },
  magnet: {
    icon: "🧲", label: "Magnet", descKey: "magnetDesc",
    grad: ["#e8b0ff", "#b020ff", "#6600cc"],
    ring: "#b020ff", shadow3d: "#3a0088", glow: "rgba(140,0,220,0.55)",
  },
};

const SHOP_PACKS = [
  {
    id: "starter",
    nameKey: "starterPack",
    price: "$1.99",
    cost: 1000,
    featured: false,
    boosters: { freeze: 10, laser: 10, meteor: 5, magnet: 5 },
  },
  {
    id: "adventurer",
    nameKey: "adventurerPack",
    price: "$4.99",
    cost: 1500,
    featured: true,
    boosters: { freeze: 20, laser: 20, meteor: 15, magnet: 15 },
  },
  {
    id: "legendary",
    nameKey: "legendaryPack",
    price: "$9.99",
    cost: 2000,
    featured: false,
    boosters: { freeze: 30, laser: 30, meteor: 20, magnet: 20 },
  },
  {
    id: "ultimate",
    nameKey: "ultimatePack",
    price: "$19.99",
    cost: 4000,
    featured: false,
    boosters: { freeze: 50, laser: 50, meteor: 40, magnet: 40 },
  },
];

const SHOP_AD_REWARD = 5;

function ShopScreen({ profile, onBuyPack, onWatchAd, onClose }) {
  const p = profile || {};
  const coins = p.coins || 0;
  const boosters = p.boosters || {};
  const tr = (key, params) => window.STI18n ? window.STI18n.t(key, params) : key;
  const adsToStarter = Math.max(0, Math.ceil((SHOP_PACKS[0].cost - coins) / SHOP_AD_REWARD));

  return (
    <div style={SSHO.root}>
      <Starfield count={16} />
      <div style={SSHO.header}>
        <button onClick={onClose} style={SSHO.backBtn} aria-label={tr("back")}>
          <span style={SSHO.backIcon}>{"\u2190"}</span>
        </button>
        <div style={SSHO.title}>{tr("shop")}</div>
        <div style={SSHO.coins}><GoldTCoin size={20} /> {formatShopNum(coins)}</div>
      </div>

      <div style={SSHO.content}>
        <section style={SSHO.adPanel}>
          <div style={SSHO.adCopy}>
            <div style={SSHO.sectionTitle}>{tr("earnCoins")}</div>
            <div style={SSHO.adText}>
              {adsToStarter > 0
                ? tr("adsToStarter", { count: adsToStarter, coins: SHOP_AD_REWARD })
                : tr("starterReady")}
            </div>
          </div>
          <button
            className="btn-3d"
            style={SSHO.adButton}
            onClick={() => typeof onWatchAd === "function" && onWatchAd(SHOP_AD_REWARD)}
          >
            ▶ +{SHOP_AD_REWARD} <GoldTCoin size={18} />
          </button>
        </section>

        <section style={SSHO.stockPanel}>
          <div style={SSHO.sectionTitle}>{tr("stock")}</div>
          <div style={SSHO.stockGrid}>
            {Object.keys(SHOP_BOOSTERS).map((id) => (
              <div key={id} style={SSHO.stockItem}>
                <BoosterCandy booster={SHOP_BOOSTERS[id]} size={38} />
                <span style={SSHO.stockCount}>{boosters[id] || 0}</span>
              </div>
            ))}
          </div>
        </section>

        <div style={SSHO.sectionTitle}>{tr("boosterPacks")}</div>
        <div style={SSHO.packList}>
          {SHOP_PACKS.map((pack) => {
            const canBuy = coins >= pack.cost;
            return (
              <article key={pack.id} style={{ ...SSHO.packCard, ...(pack.featured ? SSHO.featuredPack : null) }}>
                {pack.featured && <div style={SSHO.bestBadge}>{tr("bestValue")}</div>}
                <div style={SSHO.packTop}>
                  <div style={SSHO.packName}>{tr(pack.nameKey)}</div>
                  <div style={SSHO.priceLine}>
                    <span style={{ ...SSHO.packCost, ...(canBuy ? null : SSHO.packCostLocked) }}>
                      <GoldTCoin size={22} /> {formatShopNum(pack.cost)}
                    </span>
                    <span style={SSHO.packMoney}>{pack.price}</span>
                  </div>
                </div>

                <div style={SSHO.boosterGrid}>
                  {Object.keys(pack.boosters).map((id) => (
                    <div key={id} style={SSHO.boosterLine}>
                      <BoosterCandy booster={SHOP_BOOSTERS[id]} size={42} />
                      <div style={SSHO.boosterMeta}>
                        <span style={SSHO.boosterQty}>x{pack.boosters[id]}</span>
                        <span style={SSHO.boosterName}>{SHOP_BOOSTERS[id].label}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="btn-3d"
                  style={{ ...SSHO.buyBtn, cursor: canBuy ? "pointer" : "not-allowed" }}
                  disabled={!canBuy}
                  onClick={() => typeof onBuyPack === "function" && onBuyPack(pack)}
                >
                  {tr("obtainMyPack")}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BoosterCandy({ booster, size }) {
  const s = size || 44;
  return (
    <span
      style={{
        ...SSHO.candy,
        width: s,
        height: s,
        fontSize: Math.max(20, Math.round(s * 0.5)),
        background: "radial-gradient(circle at 35% 30%, "
          + booster.grad[0] + ", " + booster.grad[1] + ", " + booster.grad[2] + ")",
        boxShadow: "0 0 0 2px #fff, 0 0 0 4px " + booster.ring
          + ", 0 5px 0 " + booster.shadow3d + ", 0 8px 14px " + booster.glow,
      }}
      aria-hidden="true"
    >
      <span style={SSHO.shineMain} />
      <span style={SSHO.shineDot} />
      <span style={SSHO.candyIcon}>{booster.icon}</span>
    </span>
  );
}

function GoldTCoin({ size }) {
  const s = size || 20;
  return (
    <span
      style={{
        ...SSHO.tCoin,
        width: s,
        height: s,
        fontSize: Math.max(11, Math.round(s * 0.58)),
      }}
      aria-hidden="true"
    >
      T
    </span>
  );
}

function formatShopNum(n) {
  const safe = typeof n === "number" && isFinite(n) ? n : 0;
  return safe.toLocaleString("fr-FR");
}

const SSHO = {
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
    gridTemplateColumns: "48px 1fr auto",
    alignItems: "center",
    gap: 10,
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
    fontSize: 26,
    color: "#fff",
    letterSpacing: 1,
    textAlign: "center",
  },
  coins: {
    fontFamily: "'Lilita One', cursive",
    color: "var(--gold)",
    fontSize: 16,
    background: "linear-gradient(180deg, #10194c, #081032)",
    border: "1px solid rgba(255,210,63,0.4)",
    borderRadius: 12,
    padding: "8px 10px",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 14px calc(env(safe-area-inset-bottom, 0px) + 20px)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    position: "relative",
    zIndex: 2,
  },
  sectionTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 17,
    color: "#fff",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textShadow: "0 2px 0 rgba(0,0,0,0.4)",
  },
  adPanel: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 12,
    alignItems: "center",
    background: "linear-gradient(180deg, #293069, #121a48)",
    border: "1.5px solid rgba(255,210,63,0.42)",
    borderRadius: 14,
    padding: 12,
    boxShadow: "0 5px 14px rgba(0,0,0,0.28)",
  },
  adCopy: { minWidth: 0 },
  adText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 1.35,
    color: "rgba(255,255,255,0.72)",
    fontWeight: 800,
  },
  adButton: {
    minWidth: 98,
    padding: "11px 12px",
    fontSize: 14,
    background: "linear-gradient(180deg, var(--gold), #d97706)",
    boxShadow: "0 4px 0 #92400e, inset 0 1px 0 rgba(255,255,255,0.32)",
  },
  stockPanel: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    alignItems: "center",
    gap: 12,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid rgba(124,58,237,0.38)",
    borderRadius: 14,
    padding: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.22)",
  },
  stockGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 8,
  },
  stockItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    minWidth: 0,
  },
  stockCount: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 16,
    color: "#80ff80",
    textShadow: "0 1px 4px rgba(0,0,0,0.8)",
  },
  packList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
  },
  packCard: {
    position: "relative",
    background: "linear-gradient(180deg, #1a2a6e, #0b1238)",
    border: "1.5px solid rgba(124,58,237,0.46)",
    borderRadius: 14,
    padding: "15px 14px 14px",
    boxShadow: "0 5px 16px rgba(0,0,0,0.28)",
  },
  featuredPack: {
    border: "1.5px solid rgba(255,210,63,0.62)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.34), 0 0 24px rgba(255,210,63,0.14)",
  },
  bestBadge: {
    position: "absolute",
    top: -9,
    right: 12,
    padding: "3px 8px",
    borderRadius: 8,
    background: "linear-gradient(180deg, var(--gold), #d97706)",
    color: "#2d1600",
    fontSize: 10,
    fontWeight: 1000,
    letterSpacing: 0.4,
    boxShadow: "0 3px 0 #92400e",
  },
  packTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  packName: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 20,
    color: "#fff",
    minWidth: 0,
  },
  priceLine: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "nowrap",
    gap: 8,
    flexShrink: 0,
  },
  packMoney: {
    fontFamily: "'Lilita One', cursive",
    color: "var(--gold)",
    fontSize: 20,
    letterSpacing: 0.4,
    padding: "5px 8px",
    borderRadius: 10,
    background: "linear-gradient(180deg, #4c3c17, #241b08)",
    border: "1.5px solid rgba(255,210,63,0.5)",
    textShadow: "0 1px 0 rgba(0,0,0,0.55), 0 0 12px rgba(255,210,63,0.28)",
  },
  packCost: {
    fontFamily: "'Lilita One', cursive",
    color: "var(--gold)",
    fontSize: 20,
    background: "linear-gradient(180deg, #11183e, #080d28)",
    border: "1.5px solid rgba(255,210,63,0.42)",
    borderRadius: 10,
    padding: "5px 9px",
    textShadow: "0 1px 0 rgba(0,0,0,0.55), 0 0 12px rgba(255,210,63,0.22)",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  packCostLocked: {
    filter: "grayscale(0.85)",
    opacity: 0.48,
    boxShadow: "inset 0 1px 4px rgba(0,0,0,0.5)",
    border: "1.5px solid rgba(255,255,255,0.16)",
    color: "rgba(255,255,255,0.62)",
  },
  boosterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    columnGap: 12,
    rowGap: 13,
    marginBottom: 16,
  },
  boosterLine: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    minWidth: 0,
  },
  boosterMeta: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    lineHeight: 1.05,
  },
  boosterQty: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 18,
    color: "#fff",
  },
  boosterName: {
    fontSize: 10,
    color: "rgba(255,255,255,0.58)",
    fontWeight: 900,
    textTransform: "uppercase",
  },
  buyBtn: {
    width: "100%",
    minHeight: 42,
    padding: "11px 12px",
    fontSize: 17,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  candy: {
    flexShrink: 0,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    isolation: "isolate",
  },
  shineMain: {
    position: "absolute",
    top: "8%",
    left: "10%",
    width: "46%",
    height: "30%",
    background: "linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0) 100%)",
    borderRadius: "50%",
    transform: "rotate(-15deg)",
    pointerEvents: "none",
    zIndex: 1,
  },
  shineDot: {
    position: "absolute",
    top: "11%",
    left: "19%",
    width: "13%",
    height: "13%",
    background: "rgba(255,255,255,0.95)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 2,
  },
  candyIcon: {
    position: "relative",
    zIndex: 3,
    lineHeight: 1,
    filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.5))",
  },
  tCoin: {
    flex: "0 0 auto",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Lilita One', cursive",
    color: "#4a2600",
    background: "radial-gradient(circle at 32% 26%, #fff7ad, #ffd23f 48%, #d97706 100%)",
    border: "1.5px solid rgba(255,255,255,0.82)",
    boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.55), inset -1px -2px 0 rgba(120,53,15,0.45), 0 2px 0 #92400e",
    textShadow: "0 1px 0 rgba(255,255,255,0.42)",
    lineHeight: 1,
  },
};

window.ShopScreen = ShopScreen;
