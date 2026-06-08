/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — i18n V1
   12 langues réellement branchées sur les écrans principaux.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  var LANGUAGES = [
    { id: "fr", label: "🇫🇷 Français", dir: "ltr" },
    { id: "en", label: "🇬🇧 English", dir: "ltr" },
    { id: "es", label: "🇪🇸 Español", dir: "ltr" },
    { id: "pt", label: "🇵🇹 Português", dir: "ltr" },
    { id: "de", label: "🇩🇪 Deutsch", dir: "ltr" },
    { id: "it", label: "🇮🇹 Italiano", dir: "ltr" },
    { id: "ar", label: "🇸🇦 العربية", dir: "rtl" },
    { id: "hi", label: "🇮🇳 हिन्दी", dir: "ltr" },
    { id: "id", label: "🇮🇩 Indonesia", dir: "ltr" },
    { id: "ja", label: "🇯🇵 日本語", dir: "ltr" },
    { id: "ko", label: "🇰🇷 한국어", dir: "ltr" },
    { id: "zh", label: "🇨🇳 中文", dir: "ltr" },
  ];

  var D = {
    fr: {
      settings: "Paramètres", shop: "Boutique", localRank: "Classement local",
      newGame: "NEW GAME", levels: "NIVEAUX", thrilling: "TRÉPIDANTS !",
      coins: "Pièces", rankRookie: "RECRUE", xp: "XP", back: "Retour", close: "Fermer",
      audioVibration: "Audio & vibration", soundFx: "Effets sonores",
      soundFxDesc: "Bips au déplacement, lock, line clear, etc.",
      music: "Musique", musicDesc: "Thème iconique Tetris (Korobeiniki) en boucle",
      vibration: "Vibration", vibrationDesc: "Retour haptique sur Android",
      language: "Langue", appLanguage: "Langue de l'app", data: "Données",
      resetAll: "Réinitialiser tout (score, XP, boosters, coins)",
      resetConfirm: "⚠️ Vraiment effacer ? Cliquez une 2ᵉ fois",
      cancel: "Annuler", about: "À propos", version: "Version", studio: "Studio",
      contact: "Contact", privacy: "Confidentialité",
      freezeDesc: "Ralentit la chute pendant 15 secondes.",
      laserDesc: "Efface jusqu'à 4 lignes basses.",
      meteorDesc: "Frappe le haut des colonnes.",
      magnetDesc: "Compresse les blocs vers le bas.",
      stock: "Stock", record: "Record", games: "Parties", lines: "Lignes",
      topScores: "Top scores", noScores: "Joue une partie pour créer ton premier score.",
      level: "Niveau", today: "Aujourd'hui", score: "Score", clearedLines: "Lignes effacées",
      reachedLevel: "Niveau atteint", personalBest: "Record personnel",
      rewards: "Récompenses", retry: "RÉESSAYER", home: "Accueil",
      shareScore: "Partager mon score", blockOut: "BLOCK OUT", newRecord: "NEW RECORD",
      gameOverMsg: "Essayez encore, vous allez y arriver !",
      recordMsg: "Bravo, tu viens de battre ton record !",
      wheel: "Roue de la fortune", spinFree: "TOURNER (gratuit)", nextSpin: "Prochain : ",
      spinPaid: "TOURNER (50 👑)", congrats: "Bravo !", jackpot: "JACKPOT !!!",
      youWin: "Tu gagnes ", collect: "Récupérer",
      tutorial1Title: "Bienvenue sur Super Tetris !",
      tutorial1Text: "4 boosters fun, niveaux trépidants, musique iconique. Voici comment jouer.",
      tutorial2Title: "Déplacements", tutorial2Text: "Glisse ←/→ pour bouger la pièce, glisse ↓ rapide pour la faire tomber direct (hard drop).",
      tutorial3Title: "Rotation", tutorial3Text: "Tape simplement sur l'écran pour faire tourner la pièce.",
      tutorial4Title: "Boosters", tutorial4Text: "En bas de l'écran, 4 super-pouvoirs : ❄️ Freeze ralentit, ⚡ Laser efface 4 lignes, ☄️ Meteor frappe le top, 🧲 Magnet compresse.",
      tutorial5Title: "Records & Roue", tutorial5Text: "Bats ton record perso, gagne des pièces et fais tourner la 🎰 chaque jour pour des bonus !",
      previous: "‹ Précédent", next: "Suivant ›", letsGo: "C'est parti !", skip: "Passer",
    },
    en: {
      settings: "Settings", shop: "Shop", localRank: "Local ranking", newGame: "NEW GAME",
      levels: "THRILLING", thrilling: "LEVELS!", coins: "Coins", rankRookie: "ROOKIE", xp: "XP", back: "Back", close: "Close",
      audioVibration: "Audio & vibration", soundFx: "Sound effects", soundFxDesc: "Move, lock, line clear beeps and more.",
      music: "Music", musicDesc: "Iconic Tetris theme (Korobeiniki) loop", vibration: "Vibration", vibrationDesc: "Haptic feedback on Android",
      language: "Language", appLanguage: "App language", data: "Data", resetAll: "Reset all data (score, XP, boosters, coins)",
      resetConfirm: "⚠️ Really erase? Tap a 2nd time", cancel: "Cancel", about: "About", version: "Version", studio: "Studio",
      contact: "Contact", privacy: "Privacy", freezeDesc: "Slows falling for 15 seconds.", laserDesc: "Clears up to 4 bottom lines.",
      meteorDesc: "Strikes the top of columns.", magnetDesc: "Compresses blocks downward.", stock: "Stock", record: "Record", games: "Games",
      lines: "Lines", topScores: "Top scores", noScores: "Play a game to create your first score.", level: "Level", today: "Today",
      score: "Score", clearedLines: "Lines cleared", reachedLevel: "Level reached", personalBest: "Personal best", rewards: "Rewards",
      retry: "RETRY", home: "Home", shareScore: "Share my score", blockOut: "BLOCK OUT", newRecord: "NEW RECORD",
      gameOverMsg: "Try again, you've got this!", recordMsg: "Congrats, you beat your record!",
      wheel: "Fortune wheel", spinFree: "SPIN (free)", nextSpin: "Next: ", spinPaid: "SPIN (50 👑)", congrats: "Congrats!",
      jackpot: "JACKPOT !!!", youWin: "You win ", collect: "Collect",
      tutorial1Title: "Welcome to Super Tetris!", tutorial1Text: "4 fun boosters, thrilling levels, iconic music. Here's how to play.",
      tutorial2Title: "Movement", tutorial2Text: "Swipe ←/→ to move, quick swipe ↓ for hard drop.",
      tutorial3Title: "Rotation", tutorial3Text: "Tap the screen to rotate the piece.",
      tutorial4Title: "Boosters", tutorial4Text: "At the bottom: ❄️ Freeze slows down, ⚡ Laser clears 4 lines, ☄️ Meteor hits the top, 🧲 Magnet compresses.",
      tutorial5Title: "Records & Wheel", tutorial5Text: "Beat your best, earn coins, and spin the 🎰 every day for bonuses!",
      previous: "‹ Previous", next: "Next ›", letsGo: "Let's go!", skip: "Skip",
    },
  };

  var patches = {
    es: ["Ajustes","Tienda","Clasificación local","NUEVA PARTIDA","NIVELES","EMOCIONANTES","Monedas","NOVATO","Atrás","Cerrar","Audio y vibración","Efectos de sonido","Sonidos de movimiento, bloqueo y líneas.","Música","Tema icónico de Tetris (Korobeiniki) en bucle","Vibración","Respuesta háptica en Android","Idioma","Idioma de la app","Datos","Restablecer todo (puntuación, XP, boosters, monedas)","⚠️ ¿Borrar de verdad? Toca una 2ª vez","Cancelar","Acerca de","Privacidad","Ralentiza la caída durante 15 segundos.","Elimina hasta 4 líneas inferiores.","Golpea la parte superior de las columnas.","Comprime los bloques hacia abajo.","Stock","Récord","Partidas","Líneas","Mejores puntuaciones","Juega una partida para crear tu primera puntuación.","Nivel","Hoy","Puntuación","Líneas eliminadas","Nivel alcanzado","Récord personal","Recompensas","REINTENTAR","Inicio","Compartir mi puntuación","¡Inténtalo otra vez, tú puedes!","¡Bravo, has superado tu récord!","Ruleta de la fortuna","GIRAR (gratis)","Próximo: ","GIRAR (50 👑)","¡Bravo!","Has ganado ","Recoger","Bienvenido a Super Tetris!","4 boosters divertidos, niveles emocionantes y música icónica. Aprende a jugar.","Movimientos","Desliza ←/→ para mover, desliza ↓ rápido para hard drop.","Rotación","Toca la pantalla para girar la pieza.","Boosters","Abajo tienes 4 poderes: ❄️ Freeze ralentiza, ⚡ Laser borra líneas, ☄️ Meteor golpea arriba, 🧲 Magnet comprime.","Récords y ruleta","Supera tu récord, gana monedas y gira la 🎰 cada día.","‹ Anterior","Siguiente ›","¡Vamos!","Saltar"],
    pt: ["Configurações","Loja","Ranking local","NOVO JOGO","NÍVEIS","ELETRIZANTES","Moedas","RECRUTA","Voltar","Fechar","Áudio e vibração","Efeitos sonoros","Sons de movimento, bloqueio e linhas.","Música","Tema icônico do Tetris (Korobeiniki) em loop","Vibração","Retorno tátil no Android","Idioma","Idioma do app","Dados","Redefinir tudo (score, XP, boosters, moedas)","⚠️ Apagar mesmo? Toque uma 2ª vez","Cancelar","Sobre","Privacidade","Diminui a queda por 15 segundos.","Remove até 4 linhas inferiores.","Atinge o topo das colunas.","Comprime os blocos para baixo.","Estoque","Recorde","Partidas","Linhas","Melhores scores","Jogue uma partida para criar seu primeiro score.","Nível","Hoje","Score","Linhas removidas","Nível alcançado","Recorde pessoal","Recompensas","TENTAR DE NOVO","Início","Compartilhar score","Tente de novo, você consegue!","Parabéns, você bateu seu recorde!","Roda da fortuna","GIRAR (grátis)","Próximo: ","GIRAR (50 👑)","Parabéns!","Você ganhou ","Coletar","Bem-vindo ao Super Tetris!","4 boosters divertidos, níveis eletrizantes e música icônica. Veja como jogar.","Movimentos","Deslize ←/→ para mover, deslize ↓ rápido para hard drop.","Rotação","Toque na tela para girar a peça.","Boosters","Embaixo: ❄️ Freeze desacelera, ⚡ Laser limpa linhas, ☄️ Meteor atinge o topo, 🧲 Magnet comprime.","Recordes e roda","Bata seu recorde, ganhe moedas e gire a 🎰 todos os dias.","‹ Anterior","Próximo ›","Vamos!","Pular"],
    de: ["Einstellungen","Shop","Lokale Rangliste","NEUES SPIEL","SPANNENDE","LEVEL!","Münzen","ANFÄNGER","Zurück","Schließen","Audio & Vibration","Soundeffekte","Töne für Bewegung, Lock und Linien.","Musik","Ikonisches Tetris-Thema (Korobeiniki) in Schleife","Vibration","Haptisches Feedback auf Android","Sprache","App-Sprache","Daten","Alles zurücksetzen (Score, XP, Booster, Münzen)","⚠️ Wirklich löschen? Ein 2. Mal tippen","Abbrechen","Über","Datenschutz","Verlangsamt den Fall 15 Sekunden lang.","Löscht bis zu 4 untere Linien.","Trifft die Oberseite der Spalten.","Komprimiert Blöcke nach unten.","Vorrat","Rekord","Spiele","Linien","Top-Scores","Spiele eine Partie für deinen ersten Score.","Level","Heute","Score","Gelöschte Linien","Erreichtes Level","Persönlicher Rekord","Belohnungen","ERNEUT","Start","Score teilen","Versuch es erneut, du schaffst das!","Glückwunsch, neuer Rekord!","Glücksrad","DREHEN (gratis)","Nächste: ","DREHEN (50 👑)","Glückwunsch!","Du gewinnst ","Abholen","Willkommen bei Super Tetris!","4 spaßige Booster, spannende Level und ikonische Musik. So spielst du.","Bewegung","Wische ←/→ zum Bewegen, schnell ↓ für Hard Drop.","Rotation","Tippe auf den Bildschirm, um zu drehen.","Booster","Unten: ❄️ Freeze bremst, ⚡ Laser löscht Linien, ☄️ Meteor trifft oben, 🧲 Magnet komprimiert.","Rekorde & Rad","Schlage deinen Rekord, verdiene Münzen und drehe täglich die 🎰.","‹ Zurück","Weiter ›","Los geht's!","Überspringen"],
    it: ["Impostazioni","Negozio","Classifica locale","NUOVA PARTITA","LIVELLI","ELETTRIZZANTI","Monete","RECLUTA","Indietro","Chiudi","Audio e vibrazione","Effetti sonori","Suoni di movimento, blocco e linee.","Musica","Tema iconico di Tetris (Korobeiniki) in loop","Vibrazione","Feedback aptico su Android","Lingua","Lingua app","Dati","Reimposta tutto (punteggio, XP, booster, monete)","⚠️ Cancellare davvero? Tocca una 2ª volta","Annulla","Info","Privacy","Rallenta la caduta per 15 secondi.","Cancella fino a 4 linee basse.","Colpisce la cima delle colonne.","Comprime i blocchi verso il basso.","Scorta","Record","Partite","Linee","Migliori punteggi","Gioca una partita per creare il primo punteggio.","Livello","Oggi","Punteggio","Linee cancellate","Livello raggiunto","Record personale","Ricompense","RIPROVA","Home","Condividi punteggio","Riprova, ce la puoi fare!","Bravo, hai battuto il record!","Ruota della fortuna","GIRA (gratis)","Prossimo: ","GIRA (50 👑)","Bravo!","Hai vinto ","Raccogli","Benvenuto in Super Tetris!","4 booster divertenti, livelli elettrizzanti e musica iconica. Ecco come giocare.","Movimenti","Scorri ←/→ per muovere, scorri ↓ veloce per hard drop.","Rotazione","Tocca lo schermo per ruotare il pezzo.","Booster","In basso: ❄️ Freeze rallenta, ⚡ Laser cancella linee, ☄️ Meteor colpisce in alto, 🧲 Magnet comprime.","Record e ruota","Batti il tuo record, guadagna monete e gira la 🎰 ogni giorno.","‹ Precedente","Avanti ›","Si parte!","Salta"],
    ar: ["الإعدادات","المتجر","الترتيب المحلي","لعبة جديدة","مستويات","مشوقة","عملات","مبتدئ","رجوع","إغلاق","الصوت والاهتزاز","المؤثرات الصوتية","أصوات الحركة والتثبيت ومسح الصفوف.","الموسيقى","لحن تتريس الشهير (Korobeiniki) بتكرار","الاهتزاز","استجابة لمسية على أندرويد","اللغة","لغة التطبيق","البيانات","إعادة ضبط الكل (النقاط، XP، المعززات، العملات)","⚠️ هل تريد الحذف؟ اضغط مرة ثانية","إلغاء","حول","الخصوصية","يبطئ السقوط لمدة 15 ثانية.","يمسح حتى 4 صفوف سفلية.","يضرب أعلى الأعمدة.","يضغط الكتل إلى الأسفل.","المخزون","الرقم القياسي","اللعبات","الصفوف","أفضل النقاط","العب جولة لإنشاء أول نتيجة.","المستوى","اليوم","النقاط","الصفوف الممسوحة","المستوى المحقق","أفضل رقم شخصي","المكافآت","إعادة","الرئيسية","مشاركة النتيجة","حاول مرة أخرى، ستنجح!","رائع، حطمت رقمك!","عجلة الحظ","دَوِّر (مجاناً)","التالي: ","دَوِّر (50 👑)","رائع!","ربحت ","استلام","مرحباً بك في Super Tetris!","4 معززات ممتعة، مستويات مشوقة وموسيقى شهيرة. إليك طريقة اللعب.","الحركة","اسحب ←/→ للتحريك، واسحب ↓ بسرعة للإسقاط.","الدوران","اضغط على الشاشة لتدوير القطعة.","المعززات","في الأسفل: ❄️ يبطئ، ⚡ يمسح الصفوف، ☄️ يضرب الأعلى، 🧲 يضغط الكتل.","الأرقام والعجلة","حطم رقمك، اربح العملات ودوّر 🎰 يومياً.","‹ السابق","التالي ›","لنبدأ!","تخطي"],
  };

  var keys = ["settings","shop","localRank","newGame","levels","thrilling","coins","rankRookie","back","close","audioVibration","soundFx","soundFxDesc","music","musicDesc","vibration","vibrationDesc","language","appLanguage","data","resetAll","resetConfirm","cancel","about","privacy","freezeDesc","laserDesc","meteorDesc","magnetDesc","stock","record","games","lines","topScores","noScores","level","today","score","clearedLines","reachedLevel","personalBest","rewards","retry","home","shareScore","gameOverMsg","recordMsg","wheel","spinFree","nextSpin","spinPaid","congrats","youWin","collect","tutorial1Title","tutorial1Text","tutorial2Title","tutorial2Text","tutorial3Title","tutorial3Text","tutorial4Title","tutorial4Text","tutorial5Title","tutorial5Text","previous","next","letsGo","skip"];
  Object.keys(patches).forEach(function (lang) {
    D[lang] = Object.assign({}, D.en);
    keys.forEach(function (k, i) { D[lang][k] = patches[lang][i] || D.en[k] || D.fr[k]; });
  });

  ["hi","id","ja","ko","zh"].forEach(function (lang) {
    D[lang] = Object.assign({}, D.en);
  });
  Object.assign(D.hi, { settings:"सेटिंग्स", shop:"दुकान", localRank:"स्थानीय रैंकिंग", newGame:"नया गेम", back:"वापस", language:"भाषा", retry:"फिर कोशिश", home:"होम", noScores:"पहला स्कोर बनाने के लिए एक गेम खेलें." });
  Object.assign(D.id, { settings:"Pengaturan", shop:"Toko", localRank:"Peringkat lokal", newGame:"GAME BARU", back:"Kembali", language:"Bahasa", retry:"COBA LAGI", home:"Beranda", noScores:"Mainkan satu game untuk membuat skor pertama." });
  Object.assign(D.ja, { settings:"設定", shop:"ショップ", localRank:"ローカルランキング", newGame:"NEW GAME", back:"戻る", language:"言語", retry:"リトライ", home:"ホーム", noScores:"まず1ゲーム遊んでスコアを作ろう。" });
  Object.assign(D.ko, { settings:"설정", shop:"상점", localRank:"로컬 랭킹", newGame:"새 게임", back:"뒤로", language:"언어", retry:"다시하기", home:"홈", noScores:"첫 점수를 만들려면 한 판 플레이하세요." });
  Object.assign(D.zh, { settings:"设置", shop:"商店", localRank:"本地排行", newGame:"新游戏", back:"返回", language:"语言", retry:"重试", home:"主页", noScores:"玩一局来创建你的第一个分数。" });

  var extras = {
    fr: {
      spinPaid: "TOURNER ({cost} T)", resetPrompt: "Confirmer la suppression de toutes vos données ? (score, XP, coins, boosters seront remis à zéro)",
      shareText: "Je viens de faire {score} points sur Super Tetris (niveau {level}, {lines} lignes) ! Bats mon score :",
      scoreCopied: "📋 Score copié — colle-le où tu veux !", copyFailed: "⚠️ Impossible de copier. Lien :",
      available: "Disponible !", oops: "Oups", screenUnavailable: "Cet écran n'est pas disponible.",
      hudLevel: "NIV", combo: "COMBO", nextPiece: "SUIV.", time: "TEMPS", pause: "PAUSE", resume: "Reprendre",
      quitGame: "Quitter la partie ?", unavailable: "indisponible", booster: "booster",
      rankGrandMaster: "GRAND MAÎTRE", rankLegend: "LÉGENDE", rankMaster: "MAÎTRE", rankDiamond: "DIAMANT",
      rankGold: "OR", rankSilver: "ARGENT", rankBronze: "BRONZE", rankRookie: "RECRUE",
      earnCoins: "Gagner des pieces", boosterPacks: "Packs de boosters", starterPack: "Starter Pack",
      adventurerPack: "Adventurer Pack", legendaryPack: "Legendary Pack", ultimatePack: "Ultimate Pack",
      bestValue: "Meilleure valeur", buyPack: "Acheter le pack", needCoins: "Encore {coins} pieces",
      obtain: "Obtenir", obtainMyPack: "Obtenir mon pack",
      adsToStarter: "Regarde {count} video(s) interstitielle(s) a +{coins} pieces pour atteindre le Starter Pack.",
      starterReady: "Tu as assez de pieces pour le Starter Pack.",
      resumeBoosters: "Reprendre plus fort",
      resumeBoostersDesc: "Regarde des videos interstitielles pour gagner 1, 2 ou 3 boosters avant de relancer.",
      buyLife: "Racheter une vie",
      playerDead: "Vous etes mort",
      continuePrompt: "Continuez avec des boosters ou rachetez une vie.",
      adContinueDesc: "Regarde une video interstitielle pour debloquer le booster {count} et continuer plus fort.",
      watchAdToContinue: "Regarder une video",
      continueGame: "Continuer la partie",
      giveUp: "Abandonner",
      finalDefeat: "Partie terminee",
      finalDefeatDesc: "Votre progression est sauvegardee. Reessayez pour aller plus loin.",
      randomReward: "Recompense aleatoire",
      wheelReadyHint: "La roue est prete. Lance-la pour recevoir une recompense surprise.",
      wheelTryLater: "Reessaie plus tard : prochain lancer gratuit dans {time}.",
      watchAdSpin: "Regarder une video pour relancer",
      adSpinLater: "Relance par video disponible dans {time}.",
      tryAgainLaterTitle: "Dommage !",
      tryAgainLaterMsg: "Revenez, reessayez une prochaine fois.",
      ranking: "Classement", playerProfile: "Profil joueur", createProfile: "Creer ton profil",
      playerNamePlaceholder: "Pseudo joueur", create: "Creer", update: "Modifier",
      worldRank: "Mondial", competitionRank: "Competitions", profileRequired: "Profil requis",
      profileRequiredDesc: "Cree ton profil pour apparaitre dans les classements mondial et competition.",
      worldRankReady: "Ton profil est pret pour la synchronisation mondiale.",
      competitionReady: "Ton profil est pret pour les evenements et tournois.",
    },
    en: {
      spinPaid: "SPIN ({cost} T)", resetPrompt: "Confirm deleting all your data? (score, XP, coins, boosters will be reset)",
      shareText: "I just scored {score} points on Super Tetris (level {level}, {lines} lines)! Beat my score:",
      scoreCopied: "📋 Score copied — paste it anywhere!", copyFailed: "⚠️ Could not copy. Link:",
      available: "Available!", oops: "Oops", screenUnavailable: "This screen is not available.",
      hudLevel: "LVL", combo: "COMBO", nextPiece: "NEXT", time: "TIME", pause: "PAUSE", resume: "Resume",
      quitGame: "Quit the game?", unavailable: "unavailable", booster: "booster",
      rankGrandMaster: "GRAND MASTER", rankLegend: "LEGEND", rankMaster: "MASTER", rankDiamond: "DIAMOND",
      rankGold: "GOLD", rankSilver: "SILVER", rankBronze: "BRONZE", rankRookie: "ROOKIE",
      earnCoins: "Earn coins", boosterPacks: "Booster packs", starterPack: "Starter Pack",
      adventurerPack: "Adventurer Pack", legendaryPack: "Legendary Pack", ultimatePack: "Ultimate Pack",
      bestValue: "Best value", buyPack: "Buy pack", needCoins: "{coins} coins short",
      obtain: "Get", obtainMyPack: "Get my pack",
      adsToStarter: "Watch {count} interstitial video(s) at +{coins} coins to reach the Starter Pack.",
      starterReady: "You have enough coins for the Starter Pack.",
      resumeBoosters: "Resume stronger",
      resumeBoostersDesc: "Watch interstitial videos to earn 1, 2, or 3 boosters before retrying.",
      buyLife: "Buy one life",
      playerDead: "You died",
      continuePrompt: "Continue with boosters or buy one life.",
      adContinueDesc: "Watch an interstitial video to unlock booster {count} and continue stronger.",
      watchAdToContinue: "Watch video",
      continueGame: "Continue game",
      giveUp: "Give up",
      finalDefeat: "Game over",
      finalDefeatDesc: "Your progress is saved. Try again to go further.",
      randomReward: "Random reward",
      wheelReadyHint: "The wheel is ready. Spin it to receive a surprise reward.",
      wheelTryLater: "Try again later: next free spin in {time}.",
      watchAdSpin: "Watch a video to spin again",
      adSpinLater: "Video spin available in {time}.",
      tryAgainLaterTitle: "Too bad!",
      tryAgainLaterMsg: "Come back and try again next time.",
      ranking: "Ranking", playerProfile: "Player profile", createProfile: "Create your profile",
      playerNamePlaceholder: "Player name", create: "Create", update: "Update",
      worldRank: "World", competitionRank: "Competitions", profileRequired: "Profile required",
      profileRequiredDesc: "Create your profile to appear in world and competition rankings.",
      worldRankReady: "Your profile is ready for world sync.",
      competitionReady: "Your profile is ready for events and tournaments.",
    },
    es: {
      spinPaid: "GIRAR ({cost} 👑)", resetPrompt: "¿Confirmar el borrado de todos tus datos? (puntuación, XP, monedas y boosters se reiniciarán)",
      shareText: "Acabo de hacer {score} puntos en Super Tetris (nivel {level}, {lines} líneas). ¡Supera mi puntuación:",
      scoreCopied: "📋 Puntuación copiada. Pégala donde quieras.", copyFailed: "⚠️ No se pudo copiar. Enlace:",
      available: "¡Disponible!", oops: "Ups", screenUnavailable: "Esta pantalla no está disponible.",
      hudLevel: "NIV", combo: "COMBO", nextPiece: "SIG.", time: "TIEMPO", pause: "PAUSA", resume: "Continuar",
      quitGame: "¿Salir de la partida?", unavailable: "no disponible", booster: "booster",
      rankGrandMaster: "GRAN MAESTRO", rankLegend: "LEYENDA", rankMaster: "MAESTRO", rankDiamond: "DIAMANTE",
      rankGold: "ORO", rankSilver: "PLATA", rankBronze: "BRONCE", rankRookie: "NOVATO",
    },
    pt: {
      spinPaid: "GIRAR ({cost} 👑)", resetPrompt: "Confirmar a exclusão de todos os dados? (score, XP, moedas e boosters serão redefinidos)",
      shareText: "Acabei de fazer {score} pontos no Super Tetris (nível {level}, {lines} linhas). Bata meu score:",
      scoreCopied: "📋 Score copiado. Cole onde quiser.", copyFailed: "⚠️ Não foi possível copiar. Link:",
      available: "Disponível!", oops: "Ops", screenUnavailable: "Esta tela não está disponível.",
      hudLevel: "NÍV", combo: "COMBO", nextPiece: "PRÓX.", time: "TEMPO", pause: "PAUSA", resume: "Continuar",
      quitGame: "Sair da partida?", unavailable: "indisponível", booster: "booster",
      rankGrandMaster: "GRÃO-MESTRE", rankLegend: "LENDA", rankMaster: "MESTRE", rankDiamond: "DIAMANTE",
      rankGold: "OURO", rankSilver: "PRATA", rankBronze: "BRONZE", rankRookie: "RECRUTA",
    },
    de: {
      spinPaid: "DREHEN ({cost} 👑)", resetPrompt: "Alle Daten wirklich löschen? (Score, XP, Münzen und Booster werden zurückgesetzt)",
      shareText: "Ich habe {score} Punkte in Super Tetris erzielt (Level {level}, {lines} Linien). Schlag meinen Score:",
      scoreCopied: "📋 Score kopiert. Füge ihn ein, wo du willst.", copyFailed: "⚠️ Kopieren nicht möglich. Link:",
      available: "Verfügbar!", oops: "Ups", screenUnavailable: "Dieser Bildschirm ist nicht verfügbar.",
      hudLevel: "LVL", combo: "COMBO", nextPiece: "NEXT", time: "ZEIT", pause: "PAUSE", resume: "Fortsetzen",
      quitGame: "Partie verlassen?", unavailable: "nicht verfügbar", booster: "Booster",
      rankGrandMaster: "GROSSMEISTER", rankLegend: "LEGENDE", rankMaster: "MEISTER", rankDiamond: "DIAMANT",
      rankGold: "GOLD", rankSilver: "SILBER", rankBronze: "BRONZE", rankRookie: "ANFÄNGER",
    },
    it: {
      spinPaid: "GIRA ({cost} 👑)", resetPrompt: "Confermi l'eliminazione di tutti i dati? (punteggio, XP, monete e booster saranno azzerati)",
      shareText: "Ho appena fatto {score} punti su Super Tetris (livello {level}, {lines} linee). Batti il mio punteggio:",
      scoreCopied: "📋 Punteggio copiato. Incollalo dove vuoi.", copyFailed: "⚠️ Impossibile copiare. Link:",
      available: "Disponibile!", oops: "Ops", screenUnavailable: "Questa schermata non è disponibile.",
      hudLevel: "LIV", combo: "COMBO", nextPiece: "PROSS.", time: "TEMPO", pause: "PAUSA", resume: "Riprendi",
      quitGame: "Uscire dalla partita?", unavailable: "non disponibile", booster: "booster",
      rankGrandMaster: "GRAN MAESTRO", rankLegend: "LEGGENDA", rankMaster: "MAESTRO", rankDiamond: "DIAMANTE",
      rankGold: "ORO", rankSilver: "ARGENTO", rankBronze: "BRONZO", rankRookie: "RECLUTA",
    },
    ar: {
      spinPaid: "دَوِّر ({cost} 👑)", resetPrompt: "تأكيد حذف كل البيانات؟ سيتم تصفير النقاط وXP والعملات والمعززات.",
      shareText: "حققت {score} نقطة في Super Tetris (المستوى {level}، {lines} صفوف). حاول كسر نتيجتي:",
      scoreCopied: "📋 تم نسخ النتيجة. الصقها أينما تريد.", copyFailed: "⚠️ تعذر النسخ. الرابط:",
      available: "متاح!", oops: "عذراً", screenUnavailable: "هذه الشاشة غير متاحة.",
      hudLevel: "مستوى", combo: "كومبو", nextPiece: "التالي", time: "وقت", pause: "إيقاف", resume: "متابعة",
      quitGame: "مغادرة اللعبة؟", unavailable: "غير متاح", booster: "معزز",
      rankGrandMaster: "الأستاذ الأكبر", rankLegend: "أسطورة", rankMaster: "أستاذ", rankDiamond: "ماسي",
      rankGold: "ذهبي", rankSilver: "فضي", rankBronze: "برونزي", rankRookie: "مبتدئ",
    },
    hi: {
      levels: "रोमांचक", thrilling: "लेवल!", coins: "सिक्के", xp: "XP", close: "बंद", audioVibration: "ऑडियो और कंपन",
      soundFx: "ध्वनि प्रभाव", soundFxDesc: "मूव, लॉक और लाइन क्लियर की ध्वनियां.", music: "संगीत",
      musicDesc: "Tetris थीम (Korobeiniki) लूप में", vibration: "कंपन", vibrationDesc: "Android पर हैप्टिक फीडबैक",
      appLanguage: "ऐप भाषा", data: "डेटा", resetAll: "सब रीसेट करें (स्कोर, XP, बूस्टर, सिक्के)",
      resetConfirm: "⚠️ सच में मिटाना है? दूसरी बार टैप करें", cancel: "रद्द करें", about: "के बारे में",
      version: "वर्जन", studio: "स्टूडियो", contact: "संपर्क", privacy: "गोपनीयता",
      freezeDesc: "गिरने की गति 15 सेकंड धीमी करता है.", laserDesc: "नीचे की 4 लाइनों तक साफ करता है.",
      meteorDesc: "कॉलम के ऊपर हमला करता है.", magnetDesc: "ब्लॉकों को नीचे दबाता है.", stock: "स्टॉक",
      record: "रिकॉर्ड", games: "गेम", lines: "लाइनें", topScores: "शीर्ष स्कोर", level: "लेवल", today: "आज",
      score: "स्कोर", clearedLines: "साफ लाइनें", reachedLevel: "पहुंचा लेवल", personalBest: "व्यक्तिगत रिकॉर्ड",
      rewards: "इनाम", shareScore: "मेरा स्कोर शेयर करें", blockOut: "ब्लॉक आउट", newRecord: "नया रिकॉर्ड",
      gameOverMsg: "फिर कोशिश करें, आप कर सकते हैं!", recordMsg: "बधाई, आपने रिकॉर्ड तोड़ा!",
      wheel: "फॉर्च्यून व्हील", spinFree: "घुमाएं (मुफ्त)", nextSpin: "अगला: ", spinPaid: "घुमाएं ({cost} 👑)",
      congrats: "बधाई!", jackpot: "जैकपॉट !!!", youWin: "आपने जीता ", collect: "ले लें",
      resetPrompt: "क्या आप सच में सारा डेटा मिटाना चाहते हैं?", available: "उपलब्ध!", pause: "रोकें", resume: "जारी रखें",
      quitGame: "गेम छोड़ें?", time: "समय", combo: "कॉम्बो", nextPiece: "अगला", hudLevel: "लेवल",
      rankRookie: "नया", rankBronze: "कांस्य", rankSilver: "चांदी", rankGold: "सोना", rankDiamond: "हीरा",
      rankMaster: "मास्टर", rankLegend: "लीजेंड", rankGrandMaster: "ग्रैंड मास्टर",
    },
    id: {
      levels: "LEVEL", thrilling: "SERU!", coins: "Koin", xp: "XP", close: "Tutup", audioVibration: "Audio & getar",
      soundFx: "Efek suara", soundFxDesc: "Suara gerak, lock, dan hapus baris.", music: "Musik",
      musicDesc: "Tema Tetris ikonik (Korobeiniki) berulang", vibration: "Getar", vibrationDesc: "Umpan balik haptik di Android",
      appLanguage: "Bahasa app", data: "Data", resetAll: "Reset semua (skor, XP, booster, koin)",
      resetConfirm: "⚠️ Yakin hapus? Ketuk sekali lagi", cancel: "Batal", about: "Tentang", version: "Versi",
      studio: "Studio", contact: "Kontak", privacy: "Privasi", freezeDesc: "Memperlambat jatuh selama 15 detik.",
      laserDesc: "Menghapus sampai 4 baris bawah.", meteorDesc: "Menyerang bagian atas kolom.", magnetDesc: "Menekan blok ke bawah.",
      stock: "Stok", record: "Rekor", games: "Game", lines: "Baris", topScores: "Skor terbaik", level: "Level", today: "Hari ini",
      score: "Skor", clearedLines: "Baris terhapus", reachedLevel: "Level dicapai", personalBest: "Rekor pribadi",
      rewards: "Hadiah", shareScore: "Bagikan skor", blockOut: "BLOCK OUT", newRecord: "REKOR BARU",
      gameOverMsg: "Coba lagi, kamu bisa!", recordMsg: "Selamat, rekor terpecahkan!",
      wheel: "Roda keberuntungan", spinFree: "PUTAR (gratis)", nextSpin: "Berikutnya: ", spinPaid: "PUTAR ({cost} 👑)",
      congrats: "Selamat!", jackpot: "JACKPOT !!!", youWin: "Kamu mendapat ", collect: "Ambil",
      resetPrompt: "Hapus semua data?", available: "Tersedia!", pause: "JEDA", resume: "Lanjut",
      quitGame: "Keluar dari game?", time: "WAKTU", combo: "KOMBO", nextPiece: "NEXT", hudLevel: "LVL",
      rankRookie: "PEMULA", rankBronze: "BRONZE", rankSilver: "PERAK", rankGold: "EMAS", rankDiamond: "DIAMOND",
      rankMaster: "MASTER", rankLegend: "LEGENDA", rankGrandMaster: "GRAND MASTER",
    },
    ja: {
      levels: "スリリング", thrilling: "レベル!", coins: "コイン", xp: "XP", close: "閉じる", audioVibration: "音と振動",
      soundFx: "効果音", soundFxDesc: "移動、ロック、ライン消去の音.", music: "音楽", musicDesc: "Tetrisテーマ(Korobeiniki)をループ",
      vibration: "振動", vibrationDesc: "Androidの触覚フィードバック", appLanguage: "アプリの言語", data: "データ",
      resetAll: "すべてリセット (スコア、XP、ブースター、コイン)", resetConfirm: "⚠️ 本当に消去? もう一度タップ",
      cancel: "キャンセル", about: "情報", version: "バージョン", studio: "スタジオ", contact: "連絡先", privacy: "プライバシー",
      freezeDesc: "15秒間落下を遅くします.", laserDesc: "下のラインを最大4本消します.", meteorDesc: "列の上部を攻撃します.",
      magnetDesc: "ブロックを下へ圧縮します.", stock: "所持", record: "記録", games: "ゲーム", lines: "ライン",
      topScores: "トップスコア", level: "レベル", today: "今日", score: "スコア", clearedLines: "消したライン",
      reachedLevel: "到達レベル", personalBest: "自己ベスト", rewards: "報酬", shareScore: "スコアを共有",
      blockOut: "BLOCK OUT", newRecord: "NEW RECORD", gameOverMsg: "もう一度、きっといける!", recordMsg: "おめでとう、新記録!",
      wheel: "幸運のルーレット", spinFree: "回す (無料)", nextSpin: "次: ", spinPaid: "回す ({cost} 👑)",
      congrats: "おめでとう!", jackpot: "JACKPOT !!!", youWin: "獲得: ", collect: "受け取る",
      resetPrompt: "すべてのデータを削除しますか?", available: "利用可能!", pause: "ポーズ", resume: "再開",
      quitGame: "ゲームを終了しますか?", time: "時間", combo: "コンボ", nextPiece: "NEXT", hudLevel: "LVL",
      rankRookie: "ルーキー", rankBronze: "ブロンズ", rankSilver: "シルバー", rankGold: "ゴールド", rankDiamond: "ダイヤ",
      rankMaster: "マスター", rankLegend: "レジェンド", rankGrandMaster: "グランドマスター",
    },
    ko: {
      levels: "짜릿한", thrilling: "레벨!", coins: "코인", xp: "XP", close: "닫기", audioVibration: "오디오와 진동",
      soundFx: "효과음", soundFxDesc: "이동, 잠금, 줄 삭제 소리.", music: "음악", musicDesc: "Tetris 테마(Korobeiniki) 반복",
      vibration: "진동", vibrationDesc: "Android 햅틱 피드백", appLanguage: "앱 언어", data: "데이터",
      resetAll: "모두 초기화 (점수, XP, 부스터, 코인)", resetConfirm: "⚠️ 정말 삭제? 한 번 더 탭",
      cancel: "취소", about: "정보", version: "버전", studio: "스튜디오", contact: "연락처", privacy: "개인정보",
      freezeDesc: "15초 동안 낙하를 늦춥니다.", laserDesc: "아래 줄을 최대 4줄 제거합니다.", meteorDesc: "열의 상단을 공격합니다.",
      magnetDesc: "블록을 아래로 압축합니다.", stock: "보유", record: "기록", games: "게임", lines: "줄",
      topScores: "최고 점수", level: "레벨", today: "오늘", score: "점수", clearedLines: "지운 줄",
      reachedLevel: "도달 레벨", personalBest: "개인 최고", rewards: "보상", shareScore: "점수 공유",
      blockOut: "BLOCK OUT", newRecord: "NEW RECORD", gameOverMsg: "다시 도전하세요, 할 수 있어요!", recordMsg: "축하합니다, 기록 경신!",
      wheel: "행운의 룰렛", spinFree: "돌리기 (무료)", nextSpin: "다음: ", spinPaid: "돌리기 ({cost} 👑)",
      congrats: "축하합니다!", jackpot: "JACKPOT !!!", youWin: "획득: ", collect: "받기",
      resetPrompt: "모든 데이터를 삭제할까요?", available: "가능!", pause: "일시정지", resume: "계속",
      quitGame: "게임을 나갈까요?", time: "시간", combo: "콤보", nextPiece: "NEXT", hudLevel: "LVL",
      rankRookie: "루키", rankBronze: "브론즈", rankSilver: "실버", rankGold: "골드", rankDiamond: "다이아",
      rankMaster: "마스터", rankLegend: "레전드", rankGrandMaster: "그랜드 마스터",
    },
    zh: {
      levels: "刺激", thrilling: "关卡!", coins: "金币", xp: "XP", close: "关闭", audioVibration: "音效与振动",
      soundFx: "音效", soundFxDesc: "移动、锁定、消行音效.", music: "音乐", musicDesc: "Tetris主题(Korobeiniki)循环",
      vibration: "振动", vibrationDesc: "Android触觉反馈", appLanguage: "应用语言", data: "数据",
      resetAll: "全部重置 (分数、XP、道具、金币)", resetConfirm: "⚠️ 确认删除? 再点一次",
      cancel: "取消", about: "关于", version: "版本", studio: "工作室", contact: "联系", privacy: "隐私",
      freezeDesc: "减慢下落15秒.", laserDesc: "最多清除底部4行.", meteorDesc: "攻击列顶部.", magnetDesc: "将方块向下压缩.",
      stock: "库存", record: "纪录", games: "局数", lines: "行", topScores: "最高分", level: "等级", today: "今天",
      score: "分数", clearedLines: "消除行数", reachedLevel: "达到等级", personalBest: "个人最佳", rewards: "奖励",
      shareScore: "分享分数", blockOut: "BLOCK OUT", newRecord: "NEW RECORD", gameOverMsg: "再试一次，你可以的!",
      recordMsg: "恭喜，你打破了纪录!", wheel: "幸运转盘", spinFree: "旋转 (免费)", nextSpin: "下次: ", spinPaid: "旋转 ({cost} 👑)",
      congrats: "恭喜!", jackpot: "JACKPOT !!!", youWin: "你获得 ", collect: "领取",
      resetPrompt: "确定删除所有数据吗?", available: "可用!", pause: "暂停", resume: "继续",
      quitGame: "退出本局?", time: "时间", combo: "连击", nextPiece: "NEXT", hudLevel: "等级",
      rankRookie: "新手", rankBronze: "青铜", rankSilver: "白银", rankGold: "黄金", rankDiamond: "钻石",
      rankMaster: "大师", rankLegend: "传奇", rankGrandMaster: "宗师",
    },
  };
  Object.keys(extras).forEach(function (lang) {
    D[lang] = Object.assign({}, D[lang] || D.en, extras[lang]);
  });

  function currentLang() {
    try {
      var raw = localStorage.getItem("st_settings");
      var s = raw ? JSON.parse(raw) : null;
      return normalize(s && s.lang);
    } catch (_) {
      return "fr";
    }
  }

  function normalize(lang) {
    return D[lang] ? lang : "fr";
  }

  function t(key, params, lang) {
    var l = normalize(lang || currentLang());
    var str = (D[l] && D[l][key]) || (D.en && D.en[key]) || (D.fr && D.fr[key]) || key;
    if (params) {
      Object.keys(params).forEach(function (k) {
        str = str.replace(new RegExp("\\{" + k + "\\}", "g"), params[k]);
      });
    }
    return str;
  }

  function dir(lang) {
    var l = normalize(lang || currentLang());
    var item = LANGUAGES.find(function (x) { return x.id === l; });
    return item ? item.dir : "ltr";
  }

  window.STI18n = {
    languages: LANGUAGES,
    t: t,
    dir: dir,
    normalize: normalize,
  };
})();
