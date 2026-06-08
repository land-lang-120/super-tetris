# 🎮 Super Tetris — Guide pas-à-pas pour publier sur Google Play Store

> Guide jumeau du guide Byer, adapté pour le jeu Super Tetris.

**Date** : 2026-05-05
**Statut** : ✅ Tous les assets prêts. Pino a déjà un compte Play Console (`pinolando120@gmail.com`).

---

## ✅ Pré-flight checks

| Check | Statut | URL |
|---|---|---|
| Compte Google Play Developer | ✅ déjà créé | — |
| `assetlinks.json` | ✅ HTTP 200 | https://super-tetris.landonjouajosephpino.workers.dev/.well-known/assetlinks.json |
| Politique de confidentialité | ✅ HTTP 200 | https://super-tetris.landonjouajosephpino.workers.dev/privacy |
| Page support | ✅ HTTP 200 | https://super-tetris.landonjouajosephpino.workers.dev/support |
| AAB signé | ✅ Dans `super-tetris-package.zip` | — |
| Keystore + passwords | ✅ `super-tetris-keystore-passwords.txt` (À SAUVER EN TRIPLE) | — |
| Feature graphic 1024×500 | ✅ `play-store-assets/feature-graphic-1024x500.png` | — |
| 8 screenshots 1080×1920 | ✅ `play-store-assets/screenshots/` | — |

---

## ⚠️ AVANT TOUT — Sauvegarde le keystore

**Sans le keystore, tu ne pourras JAMAIS mettre à jour Super Tetris sur le Play Store.**

1. Décompresse `super-tetris-package.zip`
2. Copie `signing.keystore` à 3 endroits :
   - Google Drive perso
   - Clé USB physique
   - Email à toi-même `pinolando120@gmail.com` (sujet : "SUPER TETRIS KEYSTORE")
3. Idem pour `super-tetris-keystore-passwords.txt`

---

## 📱 Étape 1 — Créer l'app dans Play Console

1. https://play.google.com/console → bouton **"Créer une application"**
2. Remplis :

| Champ | Valeur |
|---|---|
| Nom de l'app | `Super Tetris` |
| Langue par défaut | Français (France) |
| Application ou jeu | **Jeu** ⚠️ (pas Application) |
| Gratuit/payant | Gratuit |
| Déclarations | Coche les 2 cases |

3. Clique **Créer une application**

---

## 🚀 Étape 2 — Configuration

### 2.1 Accès à l'application
**Identifiant requis ?** → **Non** (Super Tetris est jouable sans compte)

### 2.2 Annonces publicitaires
**Pubs ?** → **NON** (V1 — sans pubs)

### 2.3 Classification IARC
- Catégorie : **Jeux > Puzzle**
- Violence : Non
- Contenu sexuel : Non
- Drogue / alcool : Non
- Langage offensant : Non
- **Jeux d'argent / loterie** : Non (V1, sans cash tournament)
- **Achats numériques** : Non (V1)
- App pour enfants : Non (12+ recommandé pour la complexité du gameplay)
- Public cible : Tous publics 3+

→ Résultat : **PEGI 3 / IARC 3+**

### 2.4 Public cible et contenu
- Tranche d'âge : **13 ans et plus** (jeu adapté à tous mais on cible les ados+)
- Marketing dirigé enfants : Non

### 2.5 Sécurité des données ⚠️

**Données collectées** : **AUCUNE** (jeu 100% offline, tout en localStorage).

Coche : "Aucune donnée collectée".

**Sécurité** : HTTPS pour le chargement initial, données joueur 100% sur device, suppression possible (désinstaller).

**Politique URL** : `https://super-tetris.landonjouajosephpino.workers.dev/privacy`

---

## 📋 Étape 3 — Fiche Play Store

Menu : **Présence sur le Play Store > Configuration principale**

| Champ | Valeur (depuis `PLAY-STORE-LISTING.md`) |
|---|---|
| Nom | `Super Tetris` |
| Description courte | "Le Tetris emblématique avec 4 boosters fun et la musique iconique !" |
| Description complète | (copie ligne 49+ du listing) |

**Graphismes** :

| Asset | Fichier |
|---|---|
| Icône app | `icons/icon-512.png` (512×512) |
| Image principale | `play-store-assets/feature-graphic-1024x500.png` |
| Captures écran | `play-store-assets/screenshots/01-08-*.png` (8 fichiers) |

🔥 **Ordre d'upload screenshots** (le 1er convertit le mieux) :
1. **`01-iconic.png`** — accroche nostalgie ("Le Tetris depuis l'enfance")
2. **`02-boosters.png`** — différenciation gameplay (4 boosters)
3. **`07-freedom.png`** — anti-objections (gratuit / sans pub / hors ligne)
4. **`03-tspin.png`** — pour les pros du Tetris
5. **`04-wheel.png`** — engagement quotidien
6. **`05-ranks.png`** — progression long terme
7. **`06-music.png`** — nostalgie audio
8. **`08-cameroun.png`** — fierté locale

**Catégorisation** :
- Catégorie : **Jeux > Puzzle**
- Sous-catégorie : Casual
- Tags : tetris, puzzle, blocks, classic, retro, arcade, korobeiniki, t-spin, srs

**Coordonnées** :
- Email : `pinolando120@gmail.com`
- Site : `https://super-tetris.landonjouajosephpino.workers.dev/`
- Politique : `https://super-tetris.landonjouajosephpino.workers.dev/privacy`

### 3.1 Anglais (recommandé — Tetris est mondial)
Add language → English (US). Copie les textes EN du listing. Mêmes assets visuels.

---

## 📦 Étape 4 — Uploader l'AAB

### 4.1 Test interne d'abord (recommandé)

1. **Versions > Tests internes > Créer une version**
2. Upload `Super Tetris.aab` (depuis `super-tetris-package.zip` décompressé)
3. **Notes de version FR** :
   ```
   🎉 Lancement de Super Tetris !
   • Gameplay Tetris officiel SRS (7 pièces, T-spin, combos)
   • 4 boosters fun : Freeze, Laser, Meteor, Magnet
   • Roue de la fortune quotidienne (1 spin gratuit / 24h)
   • 8 rangs : Recrue → Grand Maître
   • Musique iconique (Korobeiniki) recréée
   • 100% gratuit, sans publicité, hors ligne
   ```
4. Vérifier la version → ajouter testeurs (toi + 1-2 amis)
5. Lien d'opt-in → installe sur ton téléphone

### 4.2 Tests sur device
- [ ] Le jeu s'ouvre sans barre URL Chrome (= TWA OK)
- [ ] Splash + menu principal s'affichent
- [ ] Tu peux lancer une partie
- [ ] La musique fonctionne (active le son)
- [ ] Touch controls répondent
- [ ] Tu peux gagner/perdre une partie
- [ ] Score sauvegardé entre 2 sessions

### 4.3 Promouvoir en Production

1. **Tests internes > Promouvoir > Production**
2. **Pays** : ✅ **TOUS LES PAYS** (Tetris est universel — pas de restriction)
3. **Démarrer le déploiement en production**

---

## 📋 Checklist finale

- [x] Compte Google Play déjà validé
- [ ] Keystore sauvegardé en triple
- [ ] AAB uploadé
- [ ] Titre + descriptions FR + EN
- [ ] Icône 512×512 + Bannière 1024×500
- [ ] 8 screenshots dans le bon ordre
- [ ] URL privacy + support valides
- [ ] IARC complétée (PEGI 3+)
- [ ] Sécurité données : "Aucune donnée collectée"
- [ ] Tous pays sélectionnés
- [ ] Test interne validé sur device

---

## 🆘 Problèmes courants

| Problème | Solution |
|---|---|
| TWA affiche barre URL | Vérifie `assetlinks.json` accessible et fingerprint = celui du keystore |
| Rejet "violence" | Tu as coché Oui par erreur. Refais le questionnaire IARC. |
| "Compatible avec aucun appareil" | Vérifie minSdk dans le manifest TWA (devrait être 21+) |

---

## 🎉 Après publication

- Partage le lien Play Store sur Twitter/Facebook/WhatsApp
- Demande à des amis de noter 5⭐ pour booster ASO
- Surveille les crashs dans Play Console (Statistiques > Stabilité)
- V2 idéas : tournoi en ligne, classement mondial, skins de pièces, mode Sprint

— Claude (assistant CloneX Studio)
