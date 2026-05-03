# 🎮 Super Tetris — Cahier de charges

> Jeu de puzzle Tetris avancé, réplique du Tetris officiel mobile, avec boosters, roue de la fortune, classement mondial, missions et pubs récompensées.
> Version : **1.9** — 2026-05-03 (musique iconique + boosters fidèles Tetroid)
> Studio : CloneX Studio (Joseph Pino Lando Njoua)
> Stack : **React 18** (CDN) + **Babel pré-transpilé** (pattern Byer) + **Canvas 2D** + **localStorage** + **Cloudflare Workers Static Assets** (hébergement) + **Google Play Billing** (achats intégrés futurs)
> URL prod : **`https://super-tetris.landonjouajosephpino.workers.dev`** (déployée en mode Workers Static Assets via wrangler API token)
> Repo : `https://github.com/land-lang-120/super-tetris` (public)
> Voir aussi : `ARCHITECTURE.md` (détails techniques) · `PROGRESS.md` (suivi du dev)

---

## 0. 📊 État d'avancement (snapshot 2026-05-03 — V1.9 EN PROD 🎉)

### 🆕 RÉSUMÉ — où on en est NOW (3 mai 2026, ~04h30)

| Aspect | Statut |
|---|---|
| 🌐 **Déploiement live** | ✅ `super-tetris.landonjouajosephpino.workers.dev` — v1.9 déployée via wrangler API token |
| 🎮 **Gameplay core** | ✅ Marathon, 7 pièces, SRS, hold, ghost, hard/soft drop, T-spin, scoring Guideline |
| 🍬 **Boosters** | ✅ Les 4 fonctionnels (FREEZE 15s, LASER 4 lignes+gravity, METEOR 10 col×3 cellules+gravity, MAGNET multi-pass+lines) — fidèles Tetroid |
| 🎵 **Audio** | ✅ SFX synthétisés (move/rotate/lock/clear/etc.) + musique iconique Korobeiniki en boucle (port Tetroid) |
| 📳 **Haptics** | ✅ Vibrations Android avec patterns par action |
| 💥 **Particules** | ✅ Burst au clear de ligne + explosions + shockwaves boosters |
| 🎨 **Look bonbon** | ✅ Boosters circulaires style Tetroid (cerclage blanc/couleur, reflets, pastille verte) |
| 🏠 **HomeScreen** | ✅ Trophée 3D + RECRUE centré + boutons Play/Wheel/Settings + bandeau bas |
| ⚙️ **SettingsScreen** | ✅ Sound + Music + Vibro + Langue + Reset double-confirm |
| 🎰 **FortuneWheel** | ✅ 8 segments pondérés + animation + 1 spin gratuit/24h |
| 💀 **GameOverScreen** | ✅ Médaillon SVG + stats + RÉESSAYER + Pub continue (stub) |
| 📱 **PWA** | ✅ Manifest + SW v1.9 (network-first) + icônes 192/512 |
| 🚧 **Pas encore** | ❌ Tournois (modèle C, threshold $10K), parrainage, leaderboard Firebase, 12 langues, AdMob réel, Google Play Billing, missions, skins |

### 📍 URL de prod
**`https://super-tetris.landonjouajosephpino.workers.dev`**

⚠️ Note : URL en `.workers.dev` parce que Cloudflare a auto-créé le projet en mode **"Workers Static Assets"** (la nouvelle plateforme qui remplace Pages classique). Le déploiement se fait via :
```bash
CLOUDFLARE_API_TOKEN="cfut_..." npx wrangler deploy
```
Le token est valide 1 mois (jusqu'au 2026-06-03). Penser à renouveler avant.

---

### 🔄 Versions déployées (historique)

| Ver | Quand | Quoi |
|---|---|---|
| **v1.0** | 2/5 23:30 | Squelette React, 7 écrans, Tetris jouable, 19 modules |
| **v1.1** | 3/5 00:30 | Canvas plus grand + HUD repensé (SCORE/TIME hero) + section "Compétitions" |
| **v1.2** | 3/5 01:00 | Canvas vraiment plus grand + RECRUE centré (grid 3-col) |
| **v1.3** | 3/5 01:45 | **Batch 7** : audio.js + haptics.js + particles.js + boosters.js (logique stub) |
| **v1.4** | 3/5 02:30 | Canvas 3× plus grand + boosters cercles arcade (1ère version) |
| **v1.5** | 3/5 03:00 | HUD compact 2 rangées (LINES retiré, NEXT/HOLD intégrés) |
| **v1.6** | 3/5 03:30 | **Boosters STYLE BONBON Tetroid exact** (radial gradient + reflets + cerclages + couleurs corrigées) |
| **v1.7** | 3/5 03:45 | Canvas flex 100% + audio resume fix + HUD 1 rangée [LVL/COMBO/NEXT/SCORE] + TIMER pill flottant |
| **v1.8** | 3/5 04:00 | **Musique iconique Korobeiniki** (port Tetroid : mélodie + basse + drums + scheduler) + canvas COLLE au HUD |
| **v1.8.1** | 3/5 04:15 | Hotfix ReferenceError "paused before init" (ordre des hooks) |
| **v1.9** | 3/5 04:30 | **Boosters refondus FIDÈLES Tetroid** : LASER détruit jusqu'à 4 lignes + gravity, METEOR 1 météore par colonne (10 au total) + 3 cellules verticales + gravity, MAGNET multi-pass + clear lines en cascade. Compteurs starter → 30 de chaque pour test. |

### 📦 Bundle actuel
- **24 fichiers** game/components/hooks → `bundle.js`
- **170 KB** non-gzippé (~50 KB gzip)
- Build : `node build.js` (~3-9 sec)
- Deploy : `npx wrangler deploy` avec `CLOUDFLARE_API_TOKEN` env var (~30 sec)

---

## 0. 📊 État d'avancement (snapshot historique — V1 STRUCTURE COMPLÈTE LIVRÉE 🎉)

> Source de vérité unique pour répondre à "où en est-on ?".
> Mise à jour à CHAQUE batch livré (push GitHub).

### ✅ FAIT (livré + commité + push)

**Batch 1 — Structure & design tokens** (commit `c76bdff`)
- `manifest.json` : "Super Tetris", theme #0b1238, categories games+puzzle
- `CAHIER-CHARGES.md` : 8 sections + checklist senior 13 règles + état 3 points
- `src/styles/variables.css` : palette Tetris officielle (bleu marine + violet + arc-en-ciel + gold)
- `src/styles/global.css` : reset + animations (fade-in, pop-in, shake, pulse, float) + classes (.btn-3d, .card, .logo-rainbow, .starfield)

**Batch 2 — Logique de jeu pure** (5 modules game/)
- `pieces.js` : 7 tetrominoes + 4 rotations + tables SRS wall-kicks (JLSTZ + I)
- `bag.js` : système 7-bag fair + queue 5+ pièces
- `core.js` : grille, collide, lock, clearLines, rotation SRS, dropToBottom, isTSpin, isGameOver, spawnPiece
- `scoring.js` : score Tetris Guideline (single/double/triple/tetris/T-spin/combo/B2B) + niveau 1-20 + gravité ms + XP/coins
- `render.js` : canvas 2D (board, pièces 3D, ghost piece pointillé, mini-pieces HUD)

**Batch 3 — Premiers écrans React**
- `LoadingScreen.jsx` : splash 1.8s avec logo arc-en-ciel + barre progression + 8 hints rotatifs + spinner + starfield
- `HomeScreen.jsx` : trophée 3D SVG inline + boutons Settings/PLAY/Wheel + header (coins/rang/⚙️) + bandeau bas "NIVEAUX TRÉPIDANTS"

**Batch 4 — Game UI**
- `useGameLoop.js` : RAF loop + cleanup + visibility pause + frame skip cap (checklist senior #11-13)
- `useStorage.js` : wrapper localStorage versionné (st_v) + cache mémoire + safeRead/safeWrite
- `HUD.jsx` : TIME / TARGET / NEXT / SCORE / LVL / COMBO / HOLD avec mini-canvas
- `BoosterButtons.jsx` : 4 boutons fixes (freeze/laser/meteor/magnet) + cooldowns + bouton "+" si vide
- `GameScreen.jsx` : canvas + inputs touch (swipes + tap rotate + double-tap hold) + clavier (arrows/X/Z/Space/Shift/Esc) + pause modal + combo banner

**Batch 5 — Features metagame**
- `GameOverScreen.jsx` : médaillon SVG (épées ou trophée selon record) + stats + récompenses + bouton "Voir pub pour continuer" + RÉESSAYER + Accueil
- `FortuneWheel.jsx` : 8 segments pondérés + animation 4.5s easeOutCubic + 1 spin gratuit/24h + spin payant 50 coins + modal résultat
- `RewardedAd.jsx` : stub V1 (5s countdown, skippable) — sera remplacé par AdMob en V2
- `SettingsScreen.jsx` : Toggle (sound/vibro) + SegmentedControl (theme) + select (langue) + reset double-confirm + crédits

**Batch 6 — Wire-up & build**
- `Starfield.jsx` : composant décoratif réutilisable (24 étoiles scintillantes par défaut)
- `App.jsx` : composant racine, routing 7 écrans, single source of truth profile+settings, handlers (gameOver, retry, wheelReward, resetData)
- `main.jsx` : entry React + ErrorBoundary class + ReactDOM.createRoot
- `build.js` : Babel CLI script (preset-env + preset-react) — concatène 19 fichiers en `bundle.js` (~132 KB)
- `sw.js` : Service Worker v1 (network-first HTML/JS/CSS, cache-first assets)
- `package.json` : devDependencies Babel + scripts build/dev/test
- ✅ **Bundle généré : 19 fichiers → 132.6 KB en 3.6s**

### 🚧 EN COURS (mise à jour 2026-05-03)

**Patch design v1.1 (retour Pino post-déploiement)** :
- ✅ Canvas plus grand + responsive (aspect ratio 1:2, fit viewport)
- ✅ HUD repensé : SCORE (gold huge) + TIME (sky huge) côte à côte en hero row
- ✅ Section "Compétitions" ajoutée au cahier (Modèle A vs B + alertes légales)
- 🚧 À builder + push (`node build.js && git push`)

**Décision business à prendre (avant V2)** :
- Choisir entre **Modèle A** (cash réel, nécessite licence) et **Modèle B** (sponsored + premium pass, zéro risque légal). Voir section 3.5bis ci-dessus.

### 📋 À FAIRE

**Tests & validation V1 (~30 min)**
- Test local : `cd super-tetris && python -m http.server 8000` puis ouvrir `http://localhost:8000`
- Vérifier les 7 écrans (loading → home → game → gameover → wheel → settings → fallback)
- Vérifier les inputs (clavier + touch + souris)
- Vérifier la persistance localStorage (best score, coins, boosters, settings)
- Vérifier les 3 chemins de la checklist senior :
  - (a) 1ère ouverture (storage vide)
  - (b) Joueur récurrent (storage rempli)
  - (c) Edge case (offline, RAF interrompu, vibrate API absente)

**Déploiement V1 (~15 min)**
- Créer repo GitHub `land-lang-120/super-tetris` (ou rester dans le mono-repo Tetroid actuel)
- Push initial
- Cloudflare Pages → connect repo → build settings (Framework=None, Build command=empty, Output=`/`) → deploy
- URL résultante : `https://super-tetris.pages.dev`

**Polish & QA (~3-4h post-V1)**
- Audit senior systématique (3 chemins + ghost-refs + cleanup RAF)
- Particules canvas au clear de ligne
- Audio (Web Audio API : musique fond + 8 effets sonores : drop, lock, clear, tetris, level-up, game over, button, combo)
- Haptics (`navigator.vibrate()` court au lock, long au tetris/level-up)
- i18n : extraction des strings + ajout EN (FR par défaut)
- Tests perf : Lighthouse mobile 3G, low-end Android (cible : >85 score)

**Features V2 (post-launch)**
- Mode Sprint (objectif 40 lignes en moins de temps)
- Mode Ultra (score max en 2 min)
- LeaderboardScreen avec Firebase Firestore
- ShopScreen + Google Play Billing
- Quêtes journalières / hebdo
- Skins de pièces (cosmétiques)

**Soumission Google Play (après V1 testée + Wise opérationnel)**
- Génération AAB via PWABuilder.com (input URL Cloudflare Pages)
- Politique de confidentialité : `https://clonex.pages.dev/privacy` (déjà en ligne)
- Page de support : `https://clonex.pages.dev/support` (déjà en ligne)
- Site officiel app : `https://clonex.pages.dev/super-tetris` (à créer ou pointer vers super-tetris.pages.dev)
- Screenshots Play Store : 5-8 captures portrait 1080x1920 (loading + home + game + clear ligne + gameover + roue + settings)
- Icône 512x512 (à exporter depuis icon-512.svg) + bannière feature 1024x500
- Description FR/EN + ASO keywords (tetris, puzzle, mobile game, etc.)
- Soumission Play Console (24-72h revue Google)

---

## 0bis. 🎯 CHECKLIST SENIOR (À RELIRE SYSTÉMATIQUEMENT)

> ⚠️ **Reprise de la checklist Byer** — la même rigueur s'applique à toutes les apps du portefeuille CloneX. Audit méticuleux, non négociable.

**Avant chaque modification structurelle :**
1. **Grep ghost-refs** : avant de supprimer une variable/state/ref/import, lancer `grep -rn "<varname>" src/` pour identifier TOUTES les références.
2. **Walk-through render path** : pour chaque écran touché, tracer mentalement chaque accès `props.*` / `state.*` ligne par ligne sur le code post-modification. Identifier les paths qui pourraient recevoir `undefined` / array vide / null.
3. **Test des 3 chemins** :
   - **(a)** 1ère ouverture (localStorage vide, pas de session, pas de score précédent)
   - **(b)** Joueur récurrent (localStorage rempli, score historique, items consommés)
   - **(c)** Edge case (offline, RAF interrompu par mise en arrière-plan, vibrate API absente)

**Avant chaque commit / push :**
4. **Lecture du diff** : `git diff --stat` puis lire chaque fichier modifié en entier. Pas de push à l'aveugle.
5. **Vérif handlers** : tout bouton/action ajouté DOIT avoir un `onClick` (ou `onTouchStart`) fonctionnel. Pas de "j'ai vu le SVG je suppose que ça marche".
6. **Audit cumulatif** : début de chaque nouvelle phase = grep + vérif que les phases précédentes tiennent toujours (boosters consommables, score persisté, etc.).

**Après chaque deploy :**
7. **Smoke test live** : `curl /bundle.js?v=N | grep -c <feature_marker>` >0 ET `grep -c <removed_var>` =0 sur le live.
8. **Tests utilisateur** : ne JAMAIS dire "prêt à tester" sans avoir mentalement simulé une partie complète sur le code post-deploy.

**Pour les data structures persistées (`localStorage`) :**
9. **Versionnage du schéma** : chaque `localStorage.getItem` accepte un format old/new (rétrocompat) ou migre automatiquement. Pas de crash si l'utilisateur a une ancienne version installée.
10. **Optional chaining systématique** sur les accès aux objets persistés (`saved?.boosters?.freeze ?? 0`, `lb?.[0]?.score || 0`).

**Pour les boucles de jeu (Canvas + RAF) :**
11. **Cleanup** : tout `requestAnimationFrame` posé doit avoir un `cancelAnimationFrame` correspondant dans le `useEffect` cleanup. Pas de double-RAF qui mange CPU.
12. **Pause / Resume** : `document.visibilitychange` doit pauser le jeu quand l'app passe en arrière-plan. Sinon batterie + score irréaliste si l'utilisateur revient 3h plus tard.
13. **Frame skip** : si le delta time dépasse 100ms, on cap (sinon une grosse glitch fait sauter 10 niveaux de difficulté).

> 💡 Cette checklist est la dette technique à payer après chaque audit foiré.
> Elle est **commune à Byer, Super Tetris, et toutes les futures apps CloneX**.

---

## 0ter. ✅ AUDIT CHECKLIST SENIOR — état v1.9 (3 mai 2026)

> Audit méthodique des 13 règles ci-dessus appliquées au code v1.9 actuel.
> Légende : ✅ OK · ⚠️ Partiel · ❌ Non fait · 🔜 Plan d'action

### 1. Grep ghost-refs ✅
- `LINES` retiré du HUD (v1.5) → grep confirmé 0 ref orpheline
- `HOLD` retiré du HUD (v4) → SCORE l'a remplacé proprement, pas de ghost
- `MiniCanvas` (ancien composant interne) supprimé → 0 ref restante
- Styles `heroRow / heroBlock / heroLabel / scoreValue / timeValue` retirés en bloc → 0 ref orpheline
- Variables `controlsRow / timerPill` supprimées et remplacées par `timerOverlay / controlsOverlay` → vérifié

### 2. Walk-through render path ✅
- `App.jsx` → `currentScreen` route vers 7 écrans avec optional chaining systématique sur `profile` et `settings`
- `GameScreen.jsx` → toutes les références à `G` (gameRef.current) sont vérifiées par `if (!G || G.gameOver) return`
- `HUD.jsx` → tous les fields acceptent undefined via fallback (`level || 1`, `combo > 0 ? "×" + combo : "×0"`, `formatNum(score)` retourne "0" si NaN)
- `BoosterButtons.jsx` → `inv = inventory || {}` et `count = inv[b.id] ?? 0` (fallback partout)

### 3. Test des 3 chemins ⚠️
- **(a) 1ère ouverture (storage vide)** : ✅ DEFAULT_PROFILE injecté par useStorage avec defaults solides. Migration v1→v2 vérifiée (reset boosters à 30).
- **(b) Joueur récurrent** : ✅ localStorage cache mémoire dans useStorage évite reads répétés. Boosters/score/XP correctement persistés entre parties.
- **(c) Edge cases** : ⚠️ partiel
  - Offline : SW cache l'app entière → ✅ OK
  - RAF interrompu (visibilitychange) : ✅ géré dans useGameLoop
  - vibrate API absente (iOS) : ✅ try/catch dans haptics.js
  - AudioContext suspended : ✅ FIX v1.7 (resume forcé à chaque tone)
  - LocalStorage bloqué (mode privé Safari) : ⚠️ safeRead/safeWrite catch erreurs mais ne notifient pas l'utilisateur → 🔜 toast warning à ajouter

### 4. Lecture du diff ✅
- Tous les commits récents (v1.4 à v1.9) ont été review fichier par fichier avant push
- Aucun "git add ." sauvage : add ciblé sur les fichiers modifiés

### 5. Vérif handlers ✅
- Boosters : tous les `onUse` connectés à `activateBooster(id)` qui appelle la vraie logique STBoosters.applyXxx
- Boutons pause/accueil : `onClick={() => setPaused(p => !p)}` et exit avec confirm
- NEW GAME : `onClick` pré-warm AudioContext + navigate
- Settings toggles : Toggle a un vrai `onChange={onChange}` qui propage à `update({ ... })`

### 6. Audit cumulatif ✅
- Vérifié à chaque batch : les phases précédentes (boosters consommables, score persisté, settings) tiennent toujours
- v1.9 : ajouté le test que `applyMagnet` retourne aussi `linesCleared` qui s'accumule dans `G.linesTotal` → ne casse pas le scoring existant

### 7. Smoke test live ✅
À chaque deploy : `curl bundle.js | grep -c <feature>` >0 ET `grep -c <removed>` =0
- v1.9 : `grep "applyGravity" bundle.js` → confirmé présent
- `grep "MUSIC_SEQ" bundle.js` → 20 occurrences confirmées
- `grep "freeze: 30" bundle.js` → DEFAULT_PROFILE migré

### 8. Tests utilisateur ⚠️
- **Bug v1.8 : "Cannot access paused before init"** non détecté avant push → fix v1.8.1
- Leçon : les useEffects qui dépendent de useState locales doivent IMPÉRATIVEMENT être déclarés APRÈS leur déclaration (limites linter ESLint manquant ici)
- 🔜 Ajouter un eslint plugin react-hooks pour catcher ce genre d'erreurs avant push

### 9. Versionnage du schéma ✅
- `useStorage.js` SCHEMA_VERSION = **2** (v1.9)
- Migration v1→v2 implémentée : reset boosters à 30 (test Pino)
- Migration future v2→v3 : prévoir un slot pour ajouter `wheelLastFree` ou `referrals` sans casser

### 10. Optional chaining systématique ✅
- `profile?.boosters?.freeze ?? 0` partout dans BoosterButtons et activateBooster
- `safe = profile || {}` puis `safe.coins ?? 0` dans HomeScreen
- Toutes les valeurs en provenance de localStorage sont fallback-safe

### 11. Cleanup RAF ✅
- `useGameLoop` : `cancelAnimationFrame(rafIdRef.current)` dans cleanup useEffect
- `STMusic.stop()` clearInterval dans cleanup useEffect au unmount de GameScreen
- `STParticles.clear()` au mount/unmount de GameScreen (pas de fuite particules entre 2 parties)
- Listeners audio resume : auto-désinscription dès AC running (v1.7 fix)

### 12. Pause / Resume ✅
- `useGameLoop` accepte `active` prop : pause auto sur `document.visibilitychange` ou `onBlur`
- `paused` state dans GameScreen → `STMusic.stop/start` synchronisé
- Game over → STMusic.stop() pour libérer le scheduler

### 13. Frame skip ✅
- `useGameLoop` : `dt = Math.min(deltaMs, 100)` pour cap les gros lags (sinon partie tronquée si l'utilisateur revient après un sleep)
- Pas de logique de gameplay basée sur `now()` directement, tout passe par `deltaMs` capé

---

### 🔜 PROCHAINES PRIORITÉS (post-pause Pino)

**Polish v1.10 (1-2h)** :
1. Test utilisateur complet de v1.9 (Pino : valider que LASER détruit bien 4 lignes + blocs tombent, METEOR 10 colonnes touchées, MAGNET cascade qui fait des lignes)
2. Tutorial first-launch (2-3 écrans avec swipe : "Tu fais les lignes" + "Tap les bonbons pour booster")
3. Animation level-up plein écran (overlay flash + texte "LVL X" + sound levelUp)
4. Animation game over plus dramatique (zoom out + shake + fade)

**Monétisation V2 (J+7)** :
5. Shop fonctionnel (packs achetables, mock IAP avant Google Play Billing réel)
6. Coffre quotidien + missions journalières (rétention)
7. AdMob intégration (rewarded continue après game over + free booster toutes les 4h)

**Social V2 (J+14)** :
8. Système de parrainage (code unique + lien magique + récompenses parrain/filleul)
9. Leaderboard mondial Firebase (top 100 + classement local par pays)
10. Partage du score (sheet natif WhatsApp/Twitter/etc.)

**International V2 (J+21)** :
11. i18n : extraction strings + 12 langues (FR ✅ EN partiel + DE/ES/PT/RU/ZH/KO/AR/HI/NL/SV)

**Tournois V3 (après threshold $10K revenus nets atteint)** :
12. Modèle C : sweepstakes sponsorisé, free entry, pool 100 max, journalier/hebdo/mensuel
13. Validation pays par pays (US "NO PURCHASE NECESSARY", CM déclaration MINFI éventuelle, UE 18+)

**Soumission Play Store (parallèle au polish)** :
14. PWABuilder.com → générer AAB depuis l'URL prod
15. Play Console : créer fiche (nom, description FR/EN, screenshots, privacy URL clonex.pages.dev/privacy)
16. Soumission Closed Testing → Open Testing → Production (3-7 jours revue Google)

---

## 1. Vision

**Super Tetris** est la version **premium et complète** de Tetroid (existant). Reproduit fidèlement l'expérience visuelle et UX du **Tetris® officiel** distribué sur Google Play (par Playstudios), tout en intégrant des innovations propres :
- 4 boosters consommables (freeze, laser, météore, magnet)
- Roue de la fortune quotidienne
- Système de rangs (8 niveaux)
- Classement mondial Firebase
- Pubs récompensées pour relancer la partie après un game over
- Missions journalières / hebdomadaires
- 12 langues localisées

L'objectif est un produit **"polished mobile casual game"** indistinguable de l'app officielle en termes de finition graphique, déployable sur Google Play Store via PWABuilder.

---

## 2. Personas

### 2.1 Joueur casual (cible principale, 80%)
- Joue 5-15 min en transport, pause déj, soir avant dodo
- Cherche défi rapide + récompenses visuelles
- Peu enclin à l'achat, mais regarde une pub pour relancer si bon score
- Veut voir sa progression (rang, score, classement local)

### 2.2 Joueur compétitif (15%)
- Joue 30 min — 2h
- Cherche record perso + classement mondial
- Maîtrise les techniques (T-spin, hard drop, hold)
- Achète parfois des packs de boosters pour défier ses limites

### 2.3 Whale / supporter (5%)
- Achète régulièrement des packs cosmétiques + boosters
- Premium pass éventuel (V2)
- Source principale du revenu de l'app

---

## 3. Périmètre fonctionnel

### 3.1 Modes de jeu
- **Marathon** (par défaut) : niveaux 1 → 20+, vitesse croissante, score cumulé
- **Sprint** (V2) : viser X lignes en temps minimum
- **Ultra** (V2) : score max en 2 min
- **VS** (V2) : multijoueur asynchrone via Firebase

### 3.2 Mécaniques de base (parité Tetris officiel)
- 7 pièces (I, O, T, S, Z, J, L) avec couleurs canoniques
- Système de **bag** (chaque pièce apparaît 1× tous les 7 tirages)
- **Hold** (échanger la pièce courante avec une réserve, 1× par pièce)
- **Ghost piece** (silhouette d'atterrissage)
- **Hard drop** (slam) + **soft drop** (descente accélérée)
- **Rotation SRS** (Super Rotation System) avec wall-kicks
- **T-spin detection** (bonus score)

### 3.3 Boosters (consommables, conservent entre parties)
| Booster | Effet | Acquisition |
|---|---|---|
| ❄️ **Freeze** | Stop la chute pendant 3s | Roue / shop / récompense quotidienne |
| ⚡ **Laser** | Détruit la ligne courante | Roue / shop / niveau-up |
| ☄️ **Meteor** | Détruit 5 cellules aléatoires | Roue / shop |
| 🧲 **Magnet** | Attire les pièces dans les trous | Roue / shop / quête |

### 3.4 Roue de la fortune
- 1 spin gratuit toutes les 24h
- Récompenses : pièces or, boosters, multiplicateurs XP, packs cosmétiques
- Spin payant possible (50 pièces or)

### 3.5 Système de récompenses
- **Pubs récompensées** (rewarded ads) :
  - **Continue** après game over (1× par partie, +1 vie)
  - **Free booster** (1× par mode booster, toutes les 4h)
  - **Boost XP** (×2 sur la prochaine partie)
- **Missions journalières** : "Faire 5 lignes", "Atteindre 10 000 pts", etc.
- **Coffre quotidien** : ouvre tous les jours pour bonus surprise
- **Quêtes hebdo** (V2)

### 3.5bis Système de compétitions / tournois — MODÈLE FINAL (décidé 2026-05-03)

> ✅ **Décision arrêtée par Pino le 2026-05-03** : modèle "sweepstakes sponsorisé"
> à threshold (modèle C ci-dessous). Les modèles A et B sont conservés comme
> historique de réflexion mais NE seront PAS implémentés.

#### Modèle C — Sweepstakes sponsorisé à threshold (RETENU ✅)

**Mécanique :**
- **Inscription au tournoi : GRATUITE** (aucun paiement requis pour participer)
- Cagnotte alimentée par **30% des revenus nets cumulés de Pino** (après déduction du % Google Play / Apple Store)
- **Threshold d'activation** : la fonctionnalité "Compétition" n'apparaît dans l'app que lorsque **revenus nets cumulés ≥ 10 000 USD**
  - Avant ce seuil, l'option n'existe pas (l'utilisateur ne voit pas de tournoi)
  - À partir du seuil, le bouton "🏆 Tournois" s'active sur HomeScreen
  - Entre chaque tournoi, recalcul du % de revenus net disponible pour la prochaine cagnotte
- Pools : **100 joueurs max** par tournoi (création automatique de nouveaux pools si demande)
- Cycles : **journalier**, **hebdomadaire**, **mensuel** (selon cagnotte disponible)

**Modèle économique global :**
- 100% du revenu Pino vient de :
  - 📺 **Pubs récompensées** (rewarded ads) — entre 0,02-0,10 USD par vue
  - 💳 **Achats intégrés** (packs de pièces / boosters / Premium Pass)
  - 🎫 **Premium Pass** mensuel à $2,99 (sans pubs + bonus quotidien + accès tournois VIP)
- Une fois la commission Google déduite (15-30% selon type) → calcul du **revenu net**
- 30% du revenu net → réservé à la cagnotte des prochains tournois (pool commun, redistribué progressivement)
- 70% du revenu net → réinvestissement (dev, marketing) + bénéfice Pino

**Distribution des gains au sein d'un pool :**
- **Pool < 100 joueurs** (cagnotte plus petite) : top 10 partagent (40% / 25% / 15% / 8% / 5% / 3% / 2% / 1% / 0,5% / 0,5%)
- **Pool 100-1000** : top 20 partagent (curve plus douce)
- **Pool > 1000** : top 30 partagent + petits lots de consolation
- Distribution **automatique** via Notch Pay (pour CM) ou autres rails par pays

**Conditions d'éligibilité (pour participer au tournoi) :**
- Cumul minimum de **10 heures de jeu** sur Super Tetris
- Best score >= **50 000 pts** (prouve que c'est un joueur sérieux, pas un bot)
- Compte vérifié (email confirmé)
- Avoir lu et accepté les conditions de participation
- Pays autorisé (vérifier liste pays par pays — sweepstakes laws variables)
- 18+ recommandé (à confirmer par juridiction)

**Avantages business :**
- ✅ **Aucun risque financier pour Pino** : la cagnotte est un % de ce qu'il a DÉJÀ gagné
- ✅ **Aucune licence requise** : ce n'est pas un jeu d'argent (no entry fee = sweepstakes légal)
- ✅ **Marketing extrêmement puissant** : "Joue gratuitement à Super Tetris, gagne du cash réel chaque semaine !"
- ✅ **Boucle de rétention parfaite** : pour participer, il faut jouer 10h+ → l'utilisateur s'engage → temps de jeu = revenus pubs + IAP
- ✅ **Validation Google Play standard** (sweepstakes ≠ gambling tant qu'inscription gratuite)
- ✅ **Boucle vertueuse** : plus de joueurs → plus de revenus → plus de cagnotte → plus d'attrait → plus de joueurs

**⚠️ Nuances légales à valider :**
- 🇺🇸 **USA** : afficher "NO PURCHASE NECESSARY" en évidence (sweepstakes laws) — déjà OK car inscription gratuite
- 🇨🇲 **Cameroun** : déclaration éventuelle au MINFI pour distribution de gains réguliers (à vérifier — petit montant peut être OK)
- 🇪🇺 **UE** : 18+ obligatoire si argent réel + transparency conditions
- Toutes juridictions : Terms of Service clairs + équité du tirage prouvable + KYC pour payouts > $X

#### Modèles ARCHIVÉS (non retenus)

**Modèle A — RMG entry fee** (initialement proposé) : nécessitait licence pari, refusé par les stores sans licence. **Trop risqué et lent.**

**Modèle B — Sponsored sans cash réel** (j'avais recommandé) : pas de cash → moins viral, moins motivant. Pino a préféré C qui combine légalité ET cash gain réel.

→ **Modèle C = best of both worlds**.

#### Modèle A — Real Money Game (RMG) "compétition payante" (proposé par Pino 2026-05-03)

**Mécanique :**
- Inscription au tournoi : **2,99 USD par participant**
- Pool : **100 joueurs max** par tournoi
- Cycle : **journalier** + **hebdomadaire** + **mensuel**

**Modèle économique :**
- 30% du total des inscriptions → **commission Byer/CloneX**
- 70% → **cagnotte distribuée aux gagnants**
- Distribution :
  - Pool de 100 joueurs (peu de monde) → top 10 partagent
  - Pool de +3 000 000 joueurs → top 20-30 partagent
  - Cagnotte journalière → distribution quotidienne automatique
  - Cagnotte hebdomadaire → top X de la semaine
  - Cagnotte mensuelle → top X du mois (gros prix grand pool)

**Conditions d'éligibilité :**
- Cumul minimum d'**heures de jeu** (ex: 10h)
- Cumul minimum de **points** (ex: best score > 50 000)
- Objectif : pousser les joueurs à rester sur l'app (rétention)

**⚠️ Contraintes légales et techniques (À VALIDER AVANT DÉV) :**

| Aspect | Cameroun | Google Play | Apple App Store |
|---|---|---|---|
| Statut légal | Considéré comme **loterie / pari** | Politique **Real Money Gaming** stricte | Politique **In-App Gambling** très stricte |
| Licence requise | **Licence MINFI** ou via opérateur agréé (PMUC, etc.) | Pays par pays — soumission spéciale RMG | Souvent refusé sauf si opérateur licencié reconnu |
| Vérification utilisateur | KYC obligatoire (18+ + ID + adresse) | Idem | Idem |
| Conformité | Anti-blanchiment, fiscalité gains | Submitted to RMG flow (au lieu du flow normal) | Apple developer relations spécifique |
| Risque d'app refusée | — | **Élevé** sans licence prouvée | **Très élevé** |
| Délai de mise sur le marché | 6-12 mois (licence + KYC + infra) | 3-4 semaines de revue Google | 1-3 mois de revue Apple |

→ **Ce modèle nécessite obligatoirement** : licence pari/jeu + KYC stricte + comptabilité fiscale + audit + restrictions géographiques (uniquement pays où c'est légal).

#### Modèle B — Tournois sponsorisés (gratuit + monnaie virtuelle, RECOMMANDÉ)

**Mécanique :**
- Inscription **gratuite** au tournoi (pas de cash réel)
- Gains payés en **pièces virtuelles** (in-game currency)
- Pièces virtuelles **non échangeables contre du cash réel** mais utilisables pour : boosters, skins, premium pass, etc.
- Pools identiques (100 joueurs max, journalier/hebdo/mensuel)

**Modèle économique :**
- **Pubs récompensées** entre les tournois (l'utilisateur regarde une pub pour tenter sa chance plusieurs fois)
- **Premium Pass mensuel** ($2.99/mois) :
  - Pas de pubs
  - Pièces virtuelles bonus quotidiennes
  - Accès tournois VIP avec gros prix virtuels
  - Skins exclusifs
  - +50% XP
- **Achats in-app de pièces virtuelles** (packs : 100 / 500 / 2000 pièces)

**Avantages vs Modèle A :**
- ✅ **Aucune licence requise** — légal partout, pas de vérification 18+
- ✅ **Validation Google/Apple** = revue normale, pas de RMG flow
- ✅ **Time to market : immédiat** (pas d'attente licence)
- ✅ **ARPU plus élevé** (Brawl Stars, Clash Royale font des milliards avec ce modèle)
- ✅ **Public plus large** (tous les pays, tous les âges 12+)
- ✅ **Pas de risque pénal**

**Inconvénients :**
- 🔸 Pas de gain direct cash pour les joueurs (mais la perception de "victoire" + FOMO marche très bien)
- 🔸 Modèle "freemium" classique, doit être finement balancé pour conversion 1-3% en payeurs

**Référence** : Brawl Stars (Supercell) ~3 milliards $ revenus, modèle 100% sponsorisé.

#### Cas hybride (V3 long terme, après legal solide)

Si Byer/CloneX réussit avec le Modèle B et accumule du capital + équipe légale :
- Fonder une entité licenciée (filiale "CloneX Gaming Ltd" basée Malta ou Curaçao, juridictions cash gaming friendly)
- Obtenir licence MGA ou Curaçao eGaming
- Lancer un produit séparé "CloneX Cash Tournaments" — uniquement dans les pays où c'est légal
- Ce produit serait une app distincte, pas Super Tetris (pour éviter de cannibaliser la base utilisateurs casual)

→ **Recommandation Claude** : commencer par **Modèle B** pour Super Tetris V1+V2 (lancement rapide, ROI prouvé, zéro risque). Modèle A à reconsidérer en V3+ après avoir atteint masse critique.

### 3.5ter Système de viralité / parrainage (V2)

> 🎯 **Objectif** (Pino 2026-05-03) : faire grandir la base utilisateurs par
> invitation entre amis (acquisition organique gratuite, taux conversion
> naturellement plus élevé que les pubs payantes).

**Mécanique du parrainage :**
- Chaque joueur reçoit un **code de parrainage unique** (ex: "JOSEPH-2X4") visible dans Profil
- Lien magique partageable : `https://super-tetris.pages.dev/?ref=JOSEPH-2X4`
- Quand un nouvel utilisateur installe l'app via ce lien :
  - Il s'inscrit normalement
  - À la 1ère ouverture, l'app détecte le `ref=` dans l'URL et l'enregistre dans son profil
  - Le code parrain est validé après que le filleul a atteint un milestone (ex: niveau 5 + 1h de jeu cumulée → évite le farming)

**Récompenses :**

| Action | Récompense PARRAIN | Récompense FILLEUL |
|---|---|---|
| Filleul installe + niveau 5 | +100 pièces virtuelles + 1× freeze | +100 pièces virtuelles + 1× freeze |
| Filleul atteint 1h de jeu | +50 pièces | +50 pièces |
| Filleul achète 1er pack IAP | +500 pièces + 1× meteor | +200 pièces |
| Filleul devient Premium Pass | +1 mois Premium gratuit | — (déjà Premium) |
| Tous les paliers de récompense scalent | Sans limite (X filleuls = X récompenses) | One-shot par filleul |

**Boutons partage natifs (intégrés au flow) :**
- Profil → "Inviter des amis" → ouvre le sheet de partage natif (WhatsApp, SMS, Telegram, Twitter, etc.) avec le lien pré-rempli + texte attractif type "Viens jouer à Super Tetris avec moi ! 🎮 Tu gagnes 100 pièces + 1 booster à l'inscription via mon lien : [URL]"
- Game Over Screen → bouton secondaire "📤 Partager mon score"
- Roue de la fortune → bouton "Inviter pour 1 spin gratuit" (alternative au cooldown 24h)

**Tracking technique :**
- Table `referrals` : `parrain_user_id`, `filleul_user_id`, `code_used`, `created_at`, `validated_at`, `rewards_paid` boolean
- Edge Function `referral-validate` : appelée à chaque milestone du filleul, distribue les récompenses
- Anti-fraude : vérifier 1 IP/device par filleul, blacklist des comportements suspects

**Affichage joueur :**
- Profil → section "Parrainage" : code visible (copy 1-clic) + nb filleuls actifs + total récompenses gagnées via parrainage + bouton "Inviter"

### 3.6 Achats intégrés (Google Play Billing)
- **Pack petit** : 100 pièces or (~0,99€)
- **Pack moyen** : 500 pièces or + 5 boosters mix (~4,99€)
- **Pack large** : 1500 pièces or + 20 boosters mix + skin (~9,99€)
- **Premium** (V2) : pas de pubs, +50% XP, skin exclusif (~19,99€)

### 3.7 Système de rangs (XP cumulé)
1. 🥉 RECRUE (0 — 1 000 XP)
2. 🥉 BRONZE (1 000 — 5 000)
3. 🥈 ARGENT (5 000 — 15 000)
4. 🥇 OR (15 000 — 50 000)
5. 💎 DIAMANT (50 000 — 150 000)
6. 💎 MAÎTRE (150 000 — 500 000)
7. 👑 LÉGENDE (500 000 — 1 000 000)
8. 👑 GRAND MAÎTRE (1 000 000+)

### 3.8 Classement mondial
- Top 100 affiché localement
- Pseudo + score + drapeau
- Stocké sur Firebase Firestore (collection `super_tetris_scores`)

---

## 4. Architecture technique

### 4.1 Stack
- **Frontend** : React 18 (CDN UMD), Babel pré-transpilé via `build.js` (pattern hérité de Byer)
- **Build** : `node build.js` → `bundle.js` (single file ES5+ pur, pas de Babel runtime)
- **Game logic** : Canvas 2D pour le rendu de la grille
- **State** : `useState` + `useReducer` React + `localStorage` pour persistence
- **Audio** : Web Audio API (Tone.js optionnel pour la musique de fond)
- **Haptics** : `navigator.vibrate()` (Android only, fallback silencieux)
- **Backend (optionnel)** : Firebase Firestore pour leaderboard mondial
- **Hébergement** : Cloudflare Pages (déploiement automatique sur push GitHub)

### 4.2 Structure des fichiers

```
super-tetris/
├── index.html             # Entry HTML (charge bundle.js)
├── manifest.json          # Manifest PWA
├── sw.js                  # Service Worker (cache offline)
├── build.js               # Script de build (Babel CLI → bundle.js)
├── package.json           # Dépendances build
├── CAHIER-CHARGES.md      # Ce fichier
├── ARCHITECTURE.md        # Détails techniques
├── PROGRESS.md            # Suivi du dev
│
├── icons/
│   ├── icon-192.svg
│   └── icon-512.svg
│
└── src/
    ├── main.jsx           # Entry point React (mount root)
    ├── App.jsx            # Composant racine (routing entre écrans)
    │
    ├── styles/
    │   ├── variables.css  # Variables CSS (couleurs, radius, ombres)
    │   └── global.css     # Reset + styles globaux + animations
    │
    ├── game/
    │   ├── pieces.js      # Définition des 7 pièces + rotation SRS
    │   ├── bag.js         # Système de sac (random shuffled)
    │   ├── core.js        # Logique : collide, lock, clearLines, tspin
    │   ├── scoring.js     # Calcul du score (single, double, T-spin, combo)
    │   └── render.js      # Dessin du canvas (grille + pièces + ghost)
    │
    ├── components/
    │   ├── LoadingScreen.jsx       # Splash 2-3s avec barre de progression
    │   ├── HomeScreen.jsx          # Trophée + PLAY + Settings + Stats
    │   ├── GameScreen.jsx          # HUD + Canvas + Boosters + Pause
    │   ├── GameOverScreen.jsx      # Score + classement + RÉESSAYER + pub continue
    │   ├── FortuneWheel.jsx        # Roue de la fortune (animation rotation)
    │   ├── ShopScreen.jsx          # Achats intégrés (packs)
    │   ├── LeaderboardScreen.jsx   # Top 100 mondial
    │   ├── SettingsScreen.jsx      # Son, vibration, langue, thème
    │   ├── BoosterButtons.jsx      # 4 boutons fixes en bas pendant le jeu
    │   ├── HUD.jsx                 # Score, niveau, combo, next, hold
    │   └── RewardedAd.jsx          # Wrapper pour pubs récompensées
    │
    ├── hooks/
    │   ├── useGameLoop.js     # RAF loop avec cleanup + visibility pause
    │   ├── useStorage.js      # Wrapper localStorage versionné
    │   ├── useAudio.js        # Lazy-load audio + mute
    │   └── useHaptic.js       # Vibrate avec fallback
    │
    └── lib/
        ├── i18n.js            # 12 langues (FR, EN, DE, ES, PT, RU, ZH, KO, AR, HI, NL, SV)
        └── analytics.js       # Plausible / Firebase Analytics (opt-in)
```

### 4.3 Stockage (localStorage)

| Clé | Contenu |
|---|---|
| `st_v` | Version du schéma (pour migrations) |
| `st_best` | Meilleur score |
| `st_xp` | XP total cumulé |
| `st_rank` | Rang actuel (calculé à partir de XP, mais cached) |
| `st_boosters` | `{freeze:N, laser:N, meteor:N, magnet:N}` |
| `st_coins` | Pièces or (monnaie virtuelle) |
| `st_wheel_last` | Timestamp du dernier spin gratuit |
| `st_chest_last` | Timestamp du dernier coffre quotidien |
| `st_missions` | `[{id, progress, claimed}]` |
| `st_settings` | `{sound:bool, vibro:bool, lang:'fr', theme:'dark'}` |
| `st_pseudo` | Pseudo pour le classement |
| `st_consents` | RGPD : consentement pubs personnalisées |

### 4.4 Flux de données React

```
App.jsx
 └── état global (currentScreen, settings, profile)
     │
     ├── LoadingScreen (mount-once)
     ├── HomeScreen (état : XP, rang, coins, boosters)
     │    └── boutons onClick → setCurrentScreen
     ├── GameScreen (état : grid, piece, score, level, paused)
     │    ├── useGameLoop()
     │    ├── BoosterButtons
     │    ├── HUD
     │    └── PauseModal
     ├── GameOverScreen (props : score, rank, gainXP, gainCoins)
     │    └── boutons : RÉESSAYER / Voir pub / Accueil
     ├── FortuneWheel (modal overlay)
     └── ShopScreen / LeaderboardScreen / SettingsScreen
```

---

## 5. Charte visuelle

### 5.1 Couleurs (cf. `variables.css`)

| Token | Usage |
|---|---|
| `--bg1` `#0b1238` | Fond principal très sombre |
| `--bg2` `#1a2a6e` | Fond cards / surfaces |
| `--purple` `#7c3aed` | Accent principal UI |
| `--gold` `#ffd23f` | Score, couronnes, monnaie |
| `--green` `#22c55e` | CTA principal (PLAY, RÉESSAYER) |
| `--piece-i/o/t/s/z/j/l` | Couleurs canoniques des 7 pièces Tetris |

### 5.2 Typographie
- **Lilita One** (titres, logo, gros boutons) — style cartoon arrondi
- **Bungee** (alternative pour effets graphiques)
- **Nunito** 700-900 (corps, UI)

### 5.3 Effets signature
- **Logo arc-en-ciel** : R rouge, T orange, R jaune, I vert, S violet — gradient text + ombre violette
- **Boutons** : gradient avec ombre `0 4px 0 rgba(0,0,0,0.25)` (style "stamped 3D")
- **Particules** : étoiles blanches scintillantes en fond pendant le jeu
- **Pièces 3D** : gradient highlight top-left → ombre bottom-right
- **Combo banner** : glissement bleu avec texte "COMBO X" depuis la gauche

### 5.4 Animations
- Splash → fade + zoom du logo
- Pièce qui se pose → flash blanc + particules
- Ligne complétée → flash + slide + reset
- Game over → shake écran + zoom out + fade out
- Boost activé → glow autour du bouton + screen flash

---

## 6. Roadmap MVP → Prod

### MVP V1 (cible : 5 jours de dev intense)
- ✅ Structure React + Babel build (squelette)
- ⏳ LoadingScreen + HomeScreen
- ⏳ GameScreen (canvas + game loop + 7 pièces + clearLines + score)
- ⏳ GameOverScreen
- ⏳ HUD complet
- ⏳ Boosters (4 pouvoirs)
- ⏳ FortuneWheel (modal + animation)
- ⏳ Settings (son/vibro/langue/thème)
- ⏳ Stats persistées (localStorage)
- ⏳ Pubs récompensées (intégration Google AdMob via webview ou test mode pour V1)
- ⏳ i18n FR + EN
- ⏳ Soumission Google Play Store

### V2 (post-launch, +30 jours)
- Mode Sprint, Ultra
- Leaderboard mondial Firebase
- Premium pass (sans pubs)
- 10 langues additionnelles
- Système de quêtes hebdomadaires
- Skins de pièces (cosmétiques)
- Mode VS asynchrone

### V3 (long terme)
- Multiplayer temps réel
- Tournoi avec récompenses cash
- Discord/Twitch integration
- Saisons (rangs réinitialisés tous les 3 mois)

---

## 7. Conformité Google Play

### 7.1 Politique de confidentialité
- Page partagée avec les autres apps : `https://clonex.pages.dev/privacy`
- Mentionner : analytics, AdMob, Firebase Auth (futur), localStorage

### 7.2 Achats intégrés
- Utiliser **Google Play Billing API** (V2 obligatoire)
- Lister chaque pack dans Play Console → In-app products
- Implémenter validation côté serveur (Edge Function future)

### 7.3 Pubs (AdMob)
- ID app AdMob à créer
- Bannières limitées (pas pendant la partie)
- Rewarded ads obligatoire (continue, free booster, boost XP)
- Conformité COPPA (pas d'apps pour enfants <13 ans)

### 7.4 Classification du contenu
- **PEGI 3** / **ESRB E** (Everyone)
- Aucun contenu violent, sexuel, ou drogues

---

## 8. Métriques de succès (post-launch)

| Métrique | Cible J+30 |
|---|---|
| DAU (utilisateurs quotidiens) | 1 000 |
| Sessions / utilisateur / jour | 3+ |
| Durée moyenne de session | 8 min |
| D1 retention | 40%+ |
| D7 retention | 20%+ |
| Note Play Store | 4.4+ ⭐ |
| Conversion ad rewarded | 30%+ |
| Conversion achat IAP | 1.5%+ |

---

_Cette app fait partie de **CloneX Studio**. Voir aussi : [Byer](../byer/CAHIER-CHARGES.md), [Tetroid](../tetroid-pro/), [Switchr](?), [SecretNote](?), [DailyNote](?)._
