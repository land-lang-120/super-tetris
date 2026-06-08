# 🎮 Super Tetris — Cahier de charges

> Le Tetris emblématique réinventé avec 4 boosters fun et la musique iconique
> Version : **1.22.5** — 2026-06-08 (boutique, roue, game over, loading thématique, pubs vidéo interstitielles)
> URL prod : https://super-tetris.landonjouajosephpino.workers.dev
> Tech : React 18 UMD CDN + Babel build + Terser → bundle.js (95 KB minifié)

---

## 📋 DÉMARCHE À SUIVRE — À LIRE AVANT CHAQUE ACTION

> **Règle absolue Pino, à appliquer pour TOUTE modification de cette app :**

1. **Développer pas à pas** chaque élément demandé. Pas de "mega-fix" en une seule passe — un fix, on teste, on passe au suivant.
2. **Corriger un par un** les éléments énumérés. À chaque fix, vérifier que rien n'est cassé ailleurs (game loop, boosters timing, audio context, save schema versioning).
3. **Tester dans le Preview MCP** quand c'est possible (`mcp__Claude_Preview__preview_start` + `preview_screenshot` + `preview_eval`) avant de déployer en production.
4. **Audit minutieux du code** après tous les fixes : relire chaque bloc modifié, vérifier que les invariants tiennent (pas de race condition booster, pas de leak RAF, pas de drift audio, pas de mock visible Play Store).
5. **Mettre à jour CE CAHIER** avec :
   - Bumper la version (semver)
   - Ajouter section "Patch vX.Y.Z" avec tableau # / Bug audit / Fix / Fichier
   - Inclure une checklist senior post-fix listant les invariants vérifiés
6. **Commit + deploy + bumper SW cache** (`CACHE_NAME = "super-tetris-v..."`) pour forcer la propagation chez les users.

> *Pino 2026-05-06 : "Note ça comme démarche à suivre dans chaque cahier de charge de manière à le lire avant chaque action histoire de ne jamais oublier."*

---

---

## 1. Vision

Le Tetris officiel SRS avec :
- **Gameplay officiel** (7 pièces, T-spin, combo, back-to-back, hard drop)
- **4 boosters fun** (Freeze, Laser, Meteor, Magnet)
- **Roue de la fortune** quotidienne
- **8 rangs** (Recrue → Grand Maître)
- **Musique iconique** (Korobeiniki recréée)
- **100% gratuit, hors ligne, sans pubs**

Tagline : *"Le Tetris emblématique avec 4 boosters fun et la musique iconique !"*

## 2. Périmètre fonctionnel V1.13

### 2.1 Gameplay
- 7 pièces classiques (I, O, T, S, Z, J, L)
- Système de rotation SRS avec wall-kicks (officiel)
- Hold pour mettre une pièce de côté
- Ghost piece pour viser parfaitement
- Hard drop (×2 pts/ligne) + soft drop (×1 pt/ligne)
- T-spin avec bonus (jusqu'à 1600 × niveau)
- Combo en cascade + back-to-back (×1.5)
- Niveau augmente toutes les 10 lignes (vitesse +)

### 2.2 Boosters
| Booster | Effet | Stock départ V1 | Coût coins |
|---|---|---|---|
| ❄️ Freeze | Ralentit la chute 15s (vitesse niveau 1) | 1 | 200 |
| ⚡ Laser | Détruit 4 lignes basses + cascade | 1 | 300 |
| ☄️ Meteor | 10 météorites détruisent le top | 0 | 400 |
| 🧲 Magnet | Compresse + élimine trous | 0 | 500 |

### 2.3 Roue de la fortune
- 1 spin gratuit toutes les 24h
- 8 segments : pièces or, boosters, multiplicateurs XP

### 2.4 Système de rangs
🥉 Recrue → Bronze → 🥈 Argent → 🥇 Or → 💎 Diamant → 🔮 Maître → 👑 Légende → 🔥 Grand Maître

## 3. Architecture technique

### 3.1 Stack actuelle (V1.x)
- **Front** : React 18 UMD CDN + JSX inline (Babel build → bundle.js)
- **Build** : `node build.js` (concatène `src/` → `bundle.js`)
- **Style** : CSS pur dans index.html
- **Données** : `useStorage` hook → localStorage versionné (`st_*`)
- **Audio** : Web Audio API (Korobeiniki recréée mélodie+basse+batterie)
- **PWA** : manifest + service worker
- **Cloudflare** : Workers Static Assets (`wrangler.jsonc`)

### 3.2 Stack cible V2
- React 18 + TypeScript + Vite
- Backend Firebase (cloud sync scores + leaderboard mondial)
- IAP via Google Play Billing (packs coins/boosters Premium Pass)
- Mode multijoueur via WebSocket

### 3.3 Schéma localStorage (`st_v` = 3)
```
st_v: number                  // version schema (3 = production V1)
st_profile: {
  level: number,
  xp: number,
  bestScore: number,
  boosters: { freeze, laser, meteor, magnet },
  wheelLastFree: number,      // timestamp dernier spin gratuit
  totalGames: number,
  rankId: string
}
st_settings: { sound, music, vibro, lang }
st_history: Array<{score, date, level, lines}>
```

---

## 📊 Snapshot 2026-05-05 — Audit sécurité + Play Store

### ✅ Audit sécurité (4 issues, 0 critique)

| # | Sujet | Sévérité | Statut |
|---|---|---|---|
| **BUG-SEC-ST-1** | Account ID Cloudflare dans wrangler.jsonc | INFO | ⚠️ By design (les ID CF sont publics, le secret c'est le token) |
| **BUG-SEC-ST-2** | Migration v1→v2 met boosters=30 (test Pino, pas prod) | HAUTE | ✅ **FIXÉ 2026-05-05** : schema v3, migration v2→v3 ramène à 1/1/0/0 si valeurs=30 |
| **BUG-SEC-ST-3** | Quota localStorage non géré | BASSE | V1.x.1 |
| **BUG-SEC-ST-4** | Pas de validation profile structure au load | BASSE | V1.x.1 |

### ✅ Play Store : ASSETS PRÊTS

| Asset | Statut |
|---|---|
| AAB signé (`Super Tetris.aab`) | ✅ Dans `super-tetris-package.zip` |
| Keystore + passwords | ✅ `super-tetris-keystore-passwords.txt` |
| Privacy + Support live | ✅ `/privacy` + `/support` |
| Feature graphic 1024×500 | ✅ `play-store-assets/` |
| 8 screenshots marketing 1080×1920 | ✅ `play-store-assets/screenshots/` |
| `PLAY-STORE-LISTING.md` (FR + EN) | ✅ |
| `PLAY-STORE-DEPLOYMENT-GUIDE.md` | ✅ |
| Dossier Bureau Pino (`Super-Tetris-Play-Store/`) | ✅ |

### 🚦 Statut Play Store

⏳ En attente du déblocage du compte Pino (bug Google `OR_IDREH_04`).

Dès déblocage, **Super Tetris est l'app la plus simple à pusher en premier** (100% offline, pas de backend, classification IARC simple = PEGI 3, pas de données collectées).

---

## 4. Roadmap

### ✅ Patch v1.22.5 (2026-06-08) — Consolidation UX / monétisation / loading

| # | Besoin validé par Pino | Décision / Fix | Fichiers |
|---|---|---|---|
| DOC-STATE | Le cahier de charge doit rester la source de vérité projet | Ajout de cette section pour documenter les validations finales effectuées pendant la passe Codex | `CAHIER-CHARGES.md` |
| LOADING-NEW | Détruire l'ancien splash qui flashait parfois avant React | Suppression complète de l'ancien `#st-boot` dans `index.html`; seul `LoadingScreen` reste actif | `index.html`, `LoadingScreen.jsx`, `Starfield.jsx` |
| LOADING-THEME | Loading 100% thématique Tetris | Fond de tétraminos glissants, logo statique `SUPER` blanc + `TETRIS` multicolore, barre de chargement en carrés colorés, tétramino rotatif avec transition absorption/rejet | `LoadingScreen.jsx`, `Starfield.jsx` |
| LOADING-TIME | Temps de chargement final | Durée ramenée de 60s de review à 12s pour la version test/publication | `App.jsx` |
| SHOP-PACKS | Boutique harmonisée avec gameplay | Packs Starter / Adventurer / Legendary / Ultimate, prix $ visibles en or, coûts en pièces sur la même ligne, CTA `Obtenir mon pack`, boosters colorés comme dans le gameplay | `ShopScreen.jsx` |
| SHOP-ADS | Coins par publicité hors partie | Les vidéos interstitielles de boutique donnent uniquement +5 pièces pour éviter une progression trop rapide | `ShopScreen.jsx`, `RewardedAd.jsx`, `App.jsx` |
| WHEEL-LOSS | Roue non gagnante à chaque tour | Segments tête de mort entre récompenses, résultat perdant sans bouton récupérer, message de retour plus tard | `FortuneWheel.jsx` |
| WHEEL-AD | Relance par publicité contrôlée | Bouton vidéo de relance apparaissant aléatoirement sur le cycle 24h, puis disparaît jusqu'au prochain cycle après usage | `FortuneWheel.jsx`, `App.jsx` |
| GAMEOVER-RESCUE | Écran de mort trop chargé | Séparation nette entre phase de sauvetage et défaite finale; stats discrètes avant abandon, stats complètes seulement à la fin définitive | `GameOverScreen.jsx` |
| GAMEOVER-ADS | Relance façon Candy Crush | Jusqu'à 3 vidéos interstitielles successives; chaque vidéo donne le droit de continuer et ajoute un booster aléatoire affiché visuellement avec des `+` entre boosters | `GameOverScreen.jsx`, `RewardedAd.jsx`, `App.jsx` |
| GAMEOVER-LIFE | Rachat de vie avec pièces | Une vie coûte 50 pièces; option présente en plus des vidéos, sans obliger le joueur à regarder une pub | `GameOverScreen.jsx`, `App.jsx` |
| ADS-FORMAT | Toutes les pubs seront en format interstitiel vidéo | `RewardedAd` simule un plein écran vidéo interstitiel récompensé; en production Google/AdMob, `onComplete` devra être appelé uniquement par le callback officiel de récompense | `RewardedAd.jsx`, `App.jsx`, `i18n.js` |
| I18N-FINAL | Les autres langues ne doivent pas être décoratives | Textes principaux branchés via `STI18n`; FR/EN mis à jour pour vidéos interstitielles | `i18n.js`, composants |
| NAV-MOBILE | Retour natif téléphone | Les écrans secondaires reviennent vers Home via `popstate`; les boutons retour visuels sont centrés | `App.jsx`, écrans secondaires |

Checklist senior post-fix :
- ✅ L'ancien loader HTML n'existe plus dans `index.html`; aucun flash `#st-boot`.
- ✅ Le loading final conserve le design validé par Pino et dure 12 secondes.
- ✅ Les pubs sont documentées comme vidéos interstitielles récompensées, pas bannières.
- ✅ Le simulateur publicitaire reste clairement isolé dans `RewardedAd.jsx`.
- ✅ La récompense ne doit être accordée qu'en fin de vidéo; futur AdMob = callback officiel "reward earned".
- ✅ La boutique, la roue, le game over et le classement restent harmonisés avec le design existant.
- ⚠️ Avant publication finale Google : remplacer le simulateur `RewardedAd` par le SDK pub réel, puis régénérer AAB/APK.
- ⚠️ Le déploiement Cloudflare reste dépendant d'un token/login valide.

---

### ✅ Patch v1.21.0 (2026-06-06) — Internationalisation réelle 12 langues

| # | Besoin | Fix | Fichier |
|---|---|---|---|
| I18N-REAL | Les langues autres que FR/EN ne doivent plus être décoratives | Ajout d'une couche `STI18n` partagée, 12 langues disponibles, `lang`/`dir` appliqués au document, textes branchés sur accueil, paramètres, boutique, classement, game over, roue, HUD, pause et tutoriel | `src/i18n.js`, `App.jsx`, composants |
| I18N-SETTINGS | Sélecteur langue limité à FR/EN | Paramètres alimente le select depuis `STI18n.languages` et applique immédiatement la langue choisie | `SettingsScreen.jsx` |
| I18N-CACHE | Propagation mobile | Version `1.21.0`, cache SW `super-tetris-v1.21.0`, bundle query `?v=1.21.0` | `package.json`, `index.html`, `sw.js`, `HomeScreen.jsx`, `SettingsScreen.jsx` |

Checklist post-fix :
- ✅ Les textes visibles majeurs ne sont plus codés en dur sur les écrans utilisateurs principaux.
- ✅ L'arabe applique `dir="rtl"` au document.
- ✅ Le design et le placement Boutique/Classement v1.20.2 sont conservés.

---

### ✅ Patch v1.20.2 (2026-06-06) — Placement final Boutique / Classement

| # | Besoin | Fix | Fichier |
|---|---|---|---|
| UX-HOME-2 | Boutique attendue sur l'ancien bouton Paramètres du bas | Bouton bas gauche `🛒` = Boutique ; badge de rang cliquable = Classement local ; Paramètres reste en haut à droite | `HomeScreen.jsx` |
| CACHE | Propagation mobile | Version `1.20.2`, cache SW `super-tetris-v1.20.2`, bundle query `?v=1.20.2` | `package.json`, `index.html`, `sw.js`, `HomeScreen.jsx`, `SettingsScreen.jsx` |

---

### ✅ Patch v1.20.1 (2026-06-06) — Harmonie design Home

| # | Besoin | Fix | Fichier |
|---|---|---|---|
| UX-HOME | Trop de CTAs après ajout boutique/stats | Retrait de la barre secondaire ajoutée ; retour à la composition originale : coins `+` pour Boutique, bouton gauche Stats, bouton central New Game, bouton droit Roue, engrenage top Paramètres | `HomeScreen.jsx` |
| CACHE | Propagation mobile de la retouche design | Version `1.20.1`, cache SW `super-tetris-v1.20.1`, bundle query `?v=1.20.1` | `package.json`, `index.html`, `sw.js`, `HomeScreen.jsx`, `SettingsScreen.jsx` |

---

### ✅ Patch v1.20.0 (2026-06-06) — Boutique + classement local effectifs

| # | Besoin | Fix | Fichier |
|---|---|---|---|
| V1-SHOP | Boutique réelle sans IAP ni mock | `ShopScreen` fonctionnel : achat de boosters avec les pièces gagnées, stock visible, boutons désactivés si solde insuffisant | `ShopScreen.jsx`, `App.jsx`, `build.js` |
| V1-STATS | Classement exploitable sans backend | `StatsScreen` local : record, parties, lignes, XP, top 10 scores sur l'appareil | `StatsScreen.jsx`, `App.jsx`, `build.js` |
| V1-HIST | Persistance des scores | `profile.history` ajouté, validé au chargement, limité à 30 parties | `App.jsx`, `useStorage.js` |
| V1-BOOST | Boosters vides utilisables proprement | Achat direct en jeu si assez de pièces, sinon bouton désactivé ; plus de `+` cliquable sans effet | `GameScreen.jsx`, `BoosterButtons.jsx` |
| BUMP | Propagation mobile | Version `1.20.0`, cache SW `super-tetris-v1.20`, bundle query `?v=1.20` | `package.json`, `index.html`, `sw.js`, `HomeScreen.jsx`, `SettingsScreen.jsx` |

**Checklist senior post-fix :**
- ✅ Aucun achat intégré simulé : la boutique consomme uniquement les coins gagnés en jeu.
- ✅ Classement explicitement local, sans promesse de backend mondial.
- ✅ Historique validé par `useStorage` pour éviter corruption DevTools.
- ✅ Les boosters vides ne déclenchent plus d'alerte ni d'écran mock.

---

### ✅ Patch v1.19.0 (2026-06-06) — Publication-ready cleanup

| # | Bug audit | Fix | Fichier |
|---|---|---|---|
| H1 | Claims i18n trop ambitieux / langues non branchées | Textes resserrés sur FR/EN uniquement, commentaire settings clarifié : pas d'ajout de langues avant traduction complète | `manifest.json`, `SettingsScreen.jsx`, `PLAY-STORE-LISTING.md` |
| H3 | Mocks visibles boutique/ads/Coming Soon | Suppression de l'alert boutique, boosters vides désactivés sans CTA achat, routes `shop/stats` renvoyées vers Home tant que V2 non branchée | `GameScreen.jsx`, `BoosterButtons.jsx`, `App.jsx` |
| B14 | Versions désynchronisées | Alignement package/app marker/bundle query/SW cache/docs sur `1.19.0` / `v1.19` | `package.json`, `HomeScreen.jsx`, `SettingsScreen.jsx`, `index.html`, `sw.js`, `CAHIER-CHARGES.md` |

**Checklist senior post-fix :**
- ✅ Aucun CTA boutique factice visible en V1 Play Store.
- ✅ Aucun bouton "pub pour continuer" rendu tant qu'AdMob n'est pas branché.
- ✅ Le manifest et la fiche Play Store ne promettent plus classement mondial / missions non livrés.
- ✅ Le cache SW est bumpé pour forcer la propagation (`super-tetris-v1.19`).

---

### ✅ Patch v1.16+ round 3 (2026-05-06) — Music + Save integrity

| # | Bug audit | Fix | Fichier |
|---|---|---|---|
| M7 | Music race condition : RAF se met en pause sur visibility hidden mais `setInterval` musique tourne toujours | `document.addEventListener("visibilitychange")` dans music.js : sauvegarde `_wasPlayingBeforeHide`, stop si hidden, restart au retour focus avec timings recalibrés | `game/music.js:237-256` |
| M9 | Save game integrity : pas de validation profile au load (DevTools `coins:"abc"` → crash) | `validateProfile()` + `validateSettings()` dans `safeRead`. Type-check chaque champ critique (coins/xp/bestScore/totalGames/wheelLastFree int positifs ; boosters int 0-999 ; settings booleans + lang ≤4 chars + theme enum). Fallback sur defaultValue si corrompu. | `hooks/useStorage.js:29-83` |

---

### ✅ Patch v1.16+ round 2 (2026-05-06) — Bundle minify + SRI

| # | Bug audit | Fix | Fichier |
|---|---|---|---|
| H5 | Bundle 228 KB non-minifié + React UMD CDN sans SRI | **Terser ajouté** au build (compress 2 passes + mangle) → bundle **228 KB → 95.4 KB** (-58%). React 18.2.0 / ReactDOM 18.2.0 chargés depuis cdnjs avec **`integrity` SHA-512** vérifié. | `build.js:101-119`, `index.html:67-76` |

**Conséquence** : boot mobile 3G ~2× plus rapide. Si CDN servait un fichier modifié → browser refuse l'exécution.

---

### ✅ Patch v1.16+ (2026-05-06) — Cleanup mocks visibles + Tutorial

**3 BUG-AUDIT (HAUTE) FIXÉS** :
1. **Bouton "+" boutique** masqué dans `HomeScreen.jsx:40-44` (commentaire — risque rejet Play Store si on affiche mock "Coming Soon")
2. **"📊 Classement"** remplacé par **"⚙️ Paramètres"** (vrai écran au lieu du Coming Soon)
3. **`onContinueWithAd`** retiré de `App.jsx:171-184` → bouton "📺 Voir une pub pour continuer" disparaît du GameOverScreen (le `window.alert("Pub regardée !")` simulant une pub était un risque rejet "achat intégré simulé")

**+ Nouvelle fonctionnalité v1.16+ : TUTORIAL FIRST-LAUNCH**
- Modal 5 steps qui apparaît une seule fois au 1er lancement (HomeScreen)
- Steps : Bienvenue / Déplacements / Rotation / Boosters / Records & Roue
- Stockage `localStorage["st_tutorial_seen"]`
- Reset automatique sur `handleResetData` (re-affichera au prochain new game)
- Skip + bouton Précédent/Suivant + indicateurs steps animés

**Conséquence** : l'app est maintenant Play Store-clean côté monétisation factice (audit BUG-AUDIT-ST-3 closed).

---

### 🔍 Senior Audit 2026-05-06 — 15 issues prioritaires

| # | Sévérité | Sujet | Zone | Effort |
|---|---|---|---|---|
| H1 | **HAUTE** | i18n 16 langues annoncées, 100% FR hardcoded (0 fichier i18n, 2 langues dropdown stub) | ✅ Fix v1.19 : claims resserrés FR/EN, pas de promesse 16 langues | Clos |
| H2 | **HAUTE** | Race condition double-write settings : `STMusic.toggle` écrit localStorage direct ET `useStorage` memCache → désync possible | `music.js:113-115`, `audio.js:51-58`, `SettingsScreen.jsx:58` | S |
| H3 | **HAUTE** | Shop = écran "🚧 Coming Soon", RewardedAd = `alert("Pub regardée !")` → mock visible | ✅ Fix v1.19 : shop/stats non exposés, alert boutique retirée, CTA achat désactivé | Clos |
| H4 | **HAUTE** | T-spin detection pas conforme Tetris Guideline (pas de mini/full distinction, kick non vérifié) | `core.js:172-195`, `scoring.js:62-67` | M |
| H5 | **HAUTE** | Bundle 228 KB non-minifié + React UMD CDN sans intégrité SRI | `bundle.js`, `index.html:67-68` | S |
| M6 | MOYENNE | Tutorial / onboarding 0 — pas de first-launch guide (8 hints LoadingScreen non lus attentivement) | aucun fichier | M |
| M7 | MOYENNE | Music race condition au pause / blur : RAF se met en pause mais `setInterval` musique tourne en background | `GameScreen.jsx:62-79`, `useGameLoop.js:34-46` | S |
| M8 | MOYENNE | AudioContext jamais `close()` → fuite mémoire après N parties | `audio.js:25` | S |
| M9 | MOYENNE | Save game integrity manquante (pas de validation structure profile au load) | `useStorage.js:29-41` | M |
| M10 | MOYENNE | Tap targets boosters 44px = limite WCAG, coin badge `+` 28px sous min, pas d'`aria-pressed` | `BoosterButtons.jsx:152`, `HomeScreen.jsx:306-316` | S |
| M11 | MOYENNE | SW network-first sur HTML/JS/CSS casse l'offline 1ère visite si `bundle.js` pas pré-cached | `sw.js:46-60` | S |
| M12 | MOYENNE | Bouton retour Android (popstate) accumule entries history sans cleanup | `App.jsx:67-79` | S |
| B13 | BASSE | Account ID Cloudflare exposé dans `wrangler.jsonc` commit (acceptable, pré-empt comment) | `wrangler.jsonc:4` | S |
| B14 | BASSE | Versions désynchros : `index.html ?v=1.13` / `sw.js v1.16` / `HomeScreen v1.16` / `SettingsScreen 0.1.0` | ✅ Fix v1.19 : versions alignées | Clos |
| B15 | BASSE | Roue de la fortune : `Math.random()` non audité contre weights=0, pondération récompenses non disclosée (PEGI 12+ risk) | `FortuneWheel.jsx:68-76` | S |

**Bloquants Play Store réels restants** : H4 (T-spin pas Tetris-Guideline-compliant pour pros).
**Stack solide** : refonte tactile v1.16 (copie Tetroid `passive:false + preventDefault`) marche, plant on contact, freeze ralenti, laser/meteor sync, back button centré.

### ✅ Fait (V1.14 — 2026-05-05 patch Pino)
**4 bugs UX/booster reportés par Pino, tous fixés en bloc :**

| # | Symptôme | Cause technique | Fix v1.14 | Fichier |
|---|---|---|---|---|
| **BUG-ST-ROT** | Tap écran ne rote plus la pièce | Seuil `total < 16px` trop strict — un tap avec wobble 17-23px était rejeté | Suivi d'un flag `moved` : tap = aucun `movePiece` déclenché ET `dur < 350ms`. Plus tolérant aux finger-wobbles. | `GameScreen.jsx` |
| **BUG-ST-LASER** | Briques disparaissent AVANT que les lasers ne traversent | `applyLaser(G)` exécuté immédiatement, VFX en parallèle | Délai 340ms (= durée du sweep beam) avant destruction. Son joué AVANT le délai. | `GameScreen.jsx` |
| **BUG-ST-METEOR** | Briques disparaissent AVANT impact des météores | `applyMeteor` détruisait toutes colonnes d'un coup | Nouvelle fn `applyMeteorColumn(G, col)` + ordonnancement par-colonne (`col*80 + (topRow+1)*37 ms`). Météore VFX retiré à l'impact via `killMeteorAt(col)`. Gravité globale appliquée APRÈS dernier impact. | `boosters.js`, `booster-fx.js`, `GameScreen.jsx` |
| **BUG-ST-FREEZE** | Freeze stoppait complètement les pièces | Game loop avait `return` immédiat si `isFrozen` | Override gravity → `gravityMs(1)` (= 1000 ms/cell, vitesse niveau 1) pendant 15s. Les pièces continuent à tomber, juste plus lentement. | `GameScreen.jsx` |

**Checklist senior post-fix :**
- ✅ Pas de race condition : delays utilisent `gameRef.current` (live) + check `gameOver` à chaque setTimeout firing
- ✅ Pas de fuite mémoire : VFX `killMeteorAt(col)` retire le météore visuel synchro destruction
- ✅ Cumul boosters OK : si 2 lasers/météores enchaînés, les delays ne se marchent pas dessus (chaque setTimeout est indépendant et vérifie l'état du moment)
- ✅ Freeze + game over : si freeze actif et lock impossible → game over normal (gravity slow ne masque pas la fin)
- ✅ Tap rotation + soft-drop : le flag `moved` est reset à chaque touchstart, pas de carry-over entre touches

### ✅ Fait (V1.13)
- Gameplay officiel SRS complet
- 4 boosters avec effets visuels
- Roue de la fortune
- 8 rangs
- Musique Korobeiniki
- 100% gratuit / offline / sans pub
- FR/EN uniquement en V1 ; autres langues à brancher seulement avec traductions complètes
- Privacy + Support pages
- Audit sécurité + 1 fix HAUTE

### 🔄 En cours
- Push Play Store (en attente débloquage compte)

### 📋 V2 (futur)
1. Migration TS + Vite (cohérence avec Switchr)
2. Cloud sync via Firebase (scores + classement mondial)
3. IAP Google Play Billing (Premium Pass)
4. Mode Sprint (40 lignes en chrono)
5. Mode Ultra (2 min de gameplay max)
6. Tournoi cash (sweepstakes — restreint aux pays légalement OK)
7. Skins de pièces customisables
8. Mode multijoueur online

---

## 5. Conventions code

- React UMD CDN, JSX dans `src/*.jsx` → Babel concat → `bundle.js`
- Préfixe localStorage : `st_*`
- Préfixe fonctions/vars : `st*` (stHash, stRender, etc.)
- `useStorage` hook centralise lecture/écriture localStorage
- Schema versionning via `st_v` clé localStorage
