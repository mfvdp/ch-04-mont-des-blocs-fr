// Démarrage, commandes, établi et affichage.
// Le nom du jeu n'apparaît qu'ici dans le code ; le film et l'image de titre le prennent d'ici.
// Le nom du projet est dans pxt.json ; c'est aussi la zone de mémoire où sont rangées les sauvegardes.
const TITRE = "MONT DES BLOCS"
// Sous cette clé, la sauvegarde est rangée dans settings.
const SAUVEGARDE_CLE = "mont-des-blocs-v1"
// Après un changement d'écran, un appui de touche ne compte qu'après ce délai (contre le martelage des touches).
const ECRAN_CALME_MS = 500
// Image sur le mur de l'établi : coin en haut à gauche de l'image, avec un pixel de cadre autour.
const MUR_X = 129
const MUR_Y = 11
// Un appui sur A plus court que cette durée est un saut. Le creusage le plus rapide dure 220 millisecondes : un appui
// bref ne creuse donc rien. La durée se compte en temps de jeu (80 millisecondes au plus par image), comme pour
// creuser : sur l'appareil, les appuis n'arrivent qu'entre deux images, et avec des images lentes, le temps réel entre
// les deux serait trop long.
const SAUT_APPUI_MS = 250
// Un appui juste avant l'atterrissage compte encore, même quand une image dure longtemps sur l'appareil.
const SAUT_AVANCE_MS = 250
// Si le personnage reste aussi longtemps dans un trou, une aide en haut explique comment en sortir. Elle reste un
// moment et revient après une pause.
const AIDE_APRES_MS = 4000
const AIDE_DUREE_MS = 5000
const AIDE_REPRISE_MS = 20000
let titreOuvert = true
let titreDepuisMs = 0
let menuCalmeJusquaMs = 0
let volumeNonSauve = false
let menuOuvert = false
let ligneMenu = 0
const NB_LIGNES_MENU = 12
let aDemandeConfirmation = false
let bUtilise = false
let touchesVerrouillees = true
let filmRejoue = false
let creusageMs = 0
let creusageX = -1
let creusageY = -1
let creusageZ = -1
let derniereActualisationMs = 0
let derniereSauvegardeMs = -11000
let derniereVerifSauvegardeMs = 0
let message = ""
let messageJusquaMs = 0
let avaitSauvegarde = false
let dernierCoupMs = -1000
let dernierPasMs = -1000
let phaseMarche = 0
let eclatsDebutMs = -1000
let eclatsCouleur = 14
let symboleDessus = [9, 7, 4, 13, 4, 7, 13, 1, 11]
let symboleFace = [9, 6, 14, 11, 14, 6, 4, 9, 12]
let symboleCote = [9, 14, 12, 12, 12, 6, 14, 8, 15]
let versionScene = 0
let versionDessinee = -1
let memoX = -1
let memoY = -1
let memoZ = -1
let memoRotation = -1
let memoInclinaison = -2
let memoLargeur = 0
let imageMonde = image.create(160, 120)
let logoTitre: Image = null
let aTenuMs = 0
// Le pouce a-t-il appuyé sur B avant de lâcher A ? Cela compte quand même comme « A, puis B ».
let bEnchaine = false
let sautPret = false
let creuseCetAppui = false
let monteeDemandee = false
// Moment où le personnage voulait sauter en l'air : s'il atterrit peu après, il saute à ce moment-là.
let envieSautMs = -1000
let dansTrouDepuisMs = -1
let prochainTestTrouMs = 0
let aideJusquaMs = 0
let prochaineAideMs = 0

function demanderNouvelleImage() {
    versionScene++
}
function afficherMessage(texte: string) {
    message = texte
    messageJusquaMs = game.runtime() + 2500
}
function enregistrerPartie(): boolean {
    // L'endroit de l'exercice ne doit jamais écraser la vraie sauvegarde.
    if (exerciceActif) return false
    if (game.runtime() - derniereSauvegardeMs < 11000) {
        afficherMessage("Sauvegarde : attends")
        return false
    }
    settings.writeBuffer(SAUVEGARDE_CLE, coderSauvegarde())
    derniereSauvegardeMs = game.runtime()
    nonSauve = false
    afficherMessage("Partie sauvegardée")
    return true
}
function lancerJeu() {
    titreOuvert = false
    menuOuvert = false
    touchesVerrouillees = true
    bUtilise = true
    creusageMs = 0
    dansTrouDepuisMs = -1
    aideJusquaMs = 0
    actualiserCible()
    demanderNouvelleImage()
    afficherMessage(aPioche ? "Pioche prête. En route !" : "MENU : crée ta pioche")
}
function apresFilm() {
    music.stopAllSounds()
    if (filmRejoue) {
        filmRejoue = false
        lancerJeu()
    } else if (!exerciceFait) lancerExercice()
    else {
        titreOuvert = true
        titreDepuisMs = game.runtime()
        touchesVerrouillees = true
        demanderNouvelleImage()
    }
}
function titrePret(): boolean {
    return game.runtime() - titreDepuisMs >= ECRAN_CALME_MS
}
function changerPlace(sens: number) {
    placeChoisie = (placeChoisie + sens + materiaux.length) % materiaux.length
    nonSauve = true
    afficherMessage(nomsBlocs[materiaux[placeChoisie]])
    verifierActionExercice(2)
}
function basculerMenu() {
    menuOuvert = !menuOuvert
    ligneMenu = 0
    aDemandeConfirmation = false
    bUtilise = true
    touchesVerrouillees = true
    creusageMs = 0
}
function executerLigneMenu() {
    if (exerciceActif) {
        if (exerciceEtape == 7 && fabriquerPioche()) {
            verifierActionExercice(3)
        }
        return
    }
    if (ligneMenu == 0) changerPlace(1)
    else if (ligneMenu == 1) {
        let fabrique = fabriquerPioche()
        afficherMessage(fabrique ? "Pioche fabriquée !"
            : aPioche ? "Pioche déjà obtenue"
            : "Il faut 2 bois+3 pierres")
        if (fabrique) jouerSon(2)
    } else if (ligneMenu == 2) {
        let fabrique = fabriquerPlanches()
        afficherMessage(fabrique ? "4 planches fabriquées" : "1 bois manque / plein")
        if (fabrique) jouerSon(2)
    } else if (ligneMenu == 3) enregistrerPartie()
    else if (ligneMenu == 4) {
        largeurRayon = surAppareil ? (largeurRayon == 8 ? 4 : 8) : (largeurRayon == 4 ? 8 : largeurRayon == 8 ? 2 : 4)
        nonSauve = true
        afficherMessage(largeurRayon == 8 ? "Graphismes : rapides"
            : largeurRayon == 2 ? "Graphismes : fins"
            : "Graphismes : normaux")
        demanderNouvelleImage()
    } else if (ligneMenu == 5) {
        inclinaison = -0.16
        actualiserCible()
        nonSauve = true
        afficherMessage("Regarder devant")
    } else if (ligneMenu == 6) {
        retournerAuDepart()
        lancerJeu()
        afficherMessage("Retour au départ")
    } else if (ligneMenu == 7) lancerExercice()
    else if (ligneMenu == 8) {
        menuOuvert = false
        titreOuvert = true
        filmRejoue = true
        touchesVerrouillees = true
        dernierChapitreFilm = -1
        music.stopAllSounds()
        filmPreparer()
    } else if (ligneMenu == 9) {
        sonActif = !sonActif
        if (!sonActif) music.stopAllSounds()
    } else if (ligneMenu == 11) {
        // Le volume n'est enregistré qu'à la fermeture du menu (actualiserJeu regarde volumeNonSauve), pas
        // à chaque appui.
        music.setVolume(music.volume() >= 255 ? 0 : Math.min(255, music.volume() + 64))
        volumeNonSauve = true
    } else if (!aDemandeConfirmation) {
        aDemandeConfirmation = true
        afficherMessage("Nouveau monde ? B : oui")
    } else {
        creerMonde()
        let aEnregistre = enregistrerPartie()
        lancerJeu()
        afficherMessage(aEnregistre ? "Monde sauvegardé" : "Monde : à sauvegarder")
    }
}
controller.menu.onEvent(ControllerButtonEvent.Pressed, function () {
    // MENU saute le film, l'image de titre et l'exercice, et passe directement au jeu. À l'étape 7 de l'exercice
    // (l'établi), MENU ouvre l'établi à la place. Un deuxième appui trop rapide, juste après, ne doit pas ouvrir
    // l'établi tout de suite.
    let maintenant = game.runtime()
    if (maintenant < menuCalmeJusquaMs) return
    if (!filmFini) {
        filmSauter()
        music.stopAllSounds()
        filmRejoue = false
        lancerJeu()
        menuCalmeJusquaMs = maintenant + ECRAN_CALME_MS
    } else if (exerciceActif) {
        if (exerciceEtape == 7 && !menuOuvert) {
            menuOuvert = true
            ligneMenu = 1
            touchesVerrouillees = true
            bUtilise = true
        } else {
            terminerExercice(false)
            menuCalmeJusquaMs = maintenant + ECRAN_CALME_MS
        }
    } else if (titreOuvert) {
        if (titrePret()) {
            lancerJeu()
            menuCalmeJusquaMs = maintenant + ECRAN_CALME_MS
        }
    } else basculerMenu()
})
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (!filmFini) {
        // Un appui saute une station : vol -> carte -> titre -> exercice ou image de titre ; après « Revoir l'intro »
        // dans l'établi, on passe ensuite directement au jeu.
        if (allerAStationSuivante()) {
            music.stopAllSounds()
            if (filmFini) apresFilm()
        }
    } else if (exerciceActif && exerciceAuBout) terminerExercice(true)
    else if (titreOuvert) {
        if (titrePret()) lancerJeu()
    } else if (menuOuvert) {
        menuOuvert = false
        aDemandeConfirmation = false
        touchesVerrouillees = true
    } else {
        // En jeu : un appui court sur A est un saut (au relâchement), un appui long creuse.
        aTenuMs = 0
        creuseCetAppui = false
        sautPret = !touchesVerrouillees && !controller.B.isPressed() &&
            (!exerciceActif || (exerciceEtape >= 1 && exerciceEtape <= EXERCICE_SAUT))
    }
})
controller.A.onEvent(ControllerButtonEvent.Released, function () {
    if (sautPret && !creuseCetAppui && aTenuMs < SAUT_APPUI_MS && filmFini &&
        !titreOuvert && !menuOuvert && (!controller.B.isPressed() || bEnchaine) && !sauter()) envieSautMs = game.runtime()
    sautPret = false
})
controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    bUtilise = !filmFini || titreOuvert || menuOuvert || touchesVerrouillees
    bEnchaine = !bUtilise && sautPret && controller.A.isPressed()
    if (!filmFini) return
    if (titreOuvert) {
        if (titrePret()) lancerExercice()
    }
    else if (menuOuvert) executerLigneMenu()
})
controller.B.onEvent(ControllerButtonEvent.Released, function () {
    // Pendant un saut, B pose le bloc sous les pieds dès que le personnage est assez haut.
    let enchaine = bEnchaine
    bEnchaine = false
    if (filmFini && !titreOuvert && !menuOuvert && (!bUtilise || enchaine) && !touchesVerrouillees && enSaut &&
        (!exerciceActif || exerciceEtape == EXERCICE_SAUT)) monteeDemandee = true
    else if (filmFini && !titreOuvert && !menuOuvert && !bUtilise && !touchesVerrouillees &&
        (!exerciceActif || exerciceEtape == 5 || exerciceEtape == EXERCICE_SAUT)) {
        actualiserCible()
        if (!aCible) afficherMessage("Cible hors de portée")
        else if (poserBloc(poseX, poseY, poseZ)) {
            jouerSon(1)
            dernierCoupMs = game.runtime()
            demanderNouvelleImage()
            verifierActionExercice(1)
        } else afficherMessage("Pas de place/matériau")
        actualiserCible()
    }
})
controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
    if (menuOuvert && !exerciceActif) {
        ligneMenu = (ligneMenu + NB_LIGNES_MENU - 1) % NB_LIGNES_MENU
        aDemandeConfirmation = false
    }
})
controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
    if (menuOuvert && !exerciceActif) {
        ligneMenu = (ligneMenu + 1) % NB_LIGNES_MENU
        aDemandeConfirmation = false
    }
})
controller.left.onEvent(ControllerButtonEvent.Pressed, function () {
    if (filmFini && !titreOuvert && !menuOuvert && !touchesVerrouillees && controller.B.isPressed() &&
        (!exerciceActif || exerciceEtape == 6)) {
        bUtilise = true
        changerPlace(-1)
    } else if (menuOuvert && ligneMenu == 0 && !exerciceActif) changerPlace(-1)
})
controller.right.onEvent(ControllerButtonEvent.Pressed, function () {
    if (filmFini && !titreOuvert && !menuOuvert && !touchesVerrouillees && controller.B.isPressed() &&
        (!exerciceActif || exerciceEtape == 6)) {
        bUtilise = true
        changerPlace(1)
    } else if (menuOuvert && ligneMenu == 0 && !exerciceActif) changerPlace(1)
})
function actualiserJeu() {
    let maintenant = game.runtime()
    let ecouleMs = Math.max(1, maintenant - derniereActualisationMs)
    let dureeMs = Math.min(80, ecouleMs)
    derniereActualisationMs = maintenant
    if (!controller.A.isPressed() && !controller.B.isPressed()) touchesVerrouillees = false
    if (volumeNonSauve && !menuOuvert) {
        settings.writeNumber("#volume", music.volume())
        volumeNonSauve = false
    }
    if (!filmFini) {
        filmActualiser(Math.min(250, ecouleMs))
        jouerSonFilm(filmChapitre)
        if (filmFini) apresFilm()
        return
    }
    if (titreOuvert || menuOuvert) return
    if (exerciceActif && (exerciceEtape == 0 || exerciceEtape == EXERCICE_FIN)) {
        actualiserExercice(dureeMs, 0, 0)
        return
    }
    if (controller.A.isPressed()) aTenuMs += dureeMs
    let avance = (controller.up.isPressed() ? 1 : 0) - (controller.down.isPressed() ? 1 : 0)
    let sensRotation = (controller.right.isPressed() ? 1 : 0) - (controller.left.isPressed() ? 1 : 0)
    let sensInclinaison = 0
    if (exerciceActif && exerciceEtape != 1 && exerciceEtape != 3 && exerciceEtape != EXERCICE_SAUT) avance = 0
    if (exerciceActif && exerciceEtape != 2 && exerciceEtape != 6 && exerciceEtape != EXERCICE_SAUT) sensRotation = 0
    if (controller.B.isPressed()) {
        if (controller.up.isPressed() || controller.down.isPressed() || controller.left.isPressed() ||
            controller.right.isPressed() || controller.A.isPressed()) bUtilise = true
        if (avance != 0 && (!exerciceActif || exerciceEtape == 3 || exerciceEtape == EXERCICE_SAUT)) {
            sensInclinaison = avance
            inclinaison = Math.max(-1.2, Math.min(1.2, inclinaison + avance * dureeMs * 0.0017))
            nonSauve = true
        }
        avance = 0
        sensRotation = 0
    } else {
        if (exerciceActif && exerciceEtape == 3) avance = 0
        rotation = (rotation + sensRotation * dureeMs * 0.0019 + 2 * Math.PI) % (2 * Math.PI)
    }
    let avantX = persoX
    let avantY = persoY
    let avantZ = persoZ
    deplacerPerso(avance, dureeMs)
    if (persoX != avantX || persoZ != avantZ) {
        dernierPasMs = maintenant
        phaseMarche += dureeMs * 0.014
    }
    if (persoX != avantX || persoY != avantY || persoZ != avantZ || sensRotation != 0) nonSauve = true
    if (auSol && maintenant - envieSautMs <= SAUT_AVANCE_MS) {
        envieSautMs = -1000
        sauter()
    }
    if (monteeDemandee) {
        if (!enSaut) monteeDemandee = false
        else if (persoY >= (hauteurAppel + 1) * UNITE) {
            monteeDemandee = false
            if (poserSousSoi()) {
                jouerSon(1)
                dernierCoupMs = maintenant
                demanderNouvelleImage()
            } else afficherMessage("Pas de place/matériau")
        }
    }
    actualiserCible()
    if (!touchesVerrouillees && controller.A.isPressed() && !controller.B.isPressed() && aCible &&
        (!exerciceActif || exerciceEtape == 4 || exerciceEtape == EXERCICE_SAUT)) {
        if (creusageX != cibleX || creusageY != cibleY || creusageZ != cibleZ) creusageMs = 0
        creusageX = cibleX
        creusageY = cibleY
        creusageZ = cibleZ
        creusageMs += dureeMs
        let dureeCreusageMs = blocCible == Bloc.Pierre || blocCible == Bloc.Cristal
            ? (aPioche ? 220 : 600) : 300
        if (creusageMs >= dureeCreusageMs) {
            creuseCetAppui = true
            let sorte = blocCible
            if (creuserBloc(cibleX, cibleY, cibleZ)) {
                dernierCoupMs = maintenant
                eclatsDebutMs = maintenant
                eclatsCouleur = symboleFace[sorte]
                demanderNouvelleImage()
                jouerSon(sorte == Bloc.Cristal ? 3 : 0)
                if (cristauxTrouves == 5 && sorte == Bloc.Cristal) afficherMessage("5 cristaux ! Bravo !")
                verifierActionExercice(0)
            } else afficherMessage(sorte == Bloc.RocheMere ? "Roche mère incassable"
                : "Inventaire plein")
            creusageMs = 0
            actualiserCible()
        }
    } else creusageMs = 0
    actualiserExercice(dureeMs, sensRotation, sensInclinaison)
    // Deux fois par seconde : le personnage est-il dans un trou ? Vérifié seulement quand il est debout,
    // pas pendant l'exercice.
    if (!exerciceActif && maintenant >= prochainTestTrouMs && auSol) {
        prochainTestTrouMs = maintenant + 500
        if (compterPlace() < TROU_LIMITE) {
            if (dansTrouDepuisMs < 0) dansTrouDepuisMs = maintenant
        } else {
            dansTrouDepuisMs = -1
            aideJusquaMs = 0
        }
    }
    if (dansTrouDepuisMs >= 0 && maintenant - dansTrouDepuisMs >= AIDE_APRES_MS && maintenant >= prochaineAideMs) {
        aideJusquaMs = maintenant + AIDE_DUREE_MS
        prochaineAideMs = maintenant + AIDE_REPRISE_MS
    }
    if (!exerciceActif && maintenant - derniereVerifSauvegardeMs >= 60000) {
        derniereVerifSauvegardeMs = maintenant
        if (nonSauve) enregistrerPartie()
    }
}
function dessinerMondeMemorise(toile: Image) {
    if (versionDessinee != versionScene ||
        memoX != persoX || memoY != persoY || memoZ != persoZ ||
        memoRotation != rotation || memoInclinaison != inclinaison || memoLargeur != largeurRayon) {
        dessinerMonde(imageMonde)
        versionDessinee = versionScene
        memoX = persoX
        memoY = persoY
        memoZ = persoZ
        memoRotation = rotation
        memoInclinaison = inclinaison
        memoLargeur = largeurRayon
    }
    toile.drawImage(imageMonde, 0, 0)
}
function dessinerOutil(toile: Image) {
    let ageMs = game.runtime() - dernierCoupMs
    let coup = ageMs < 220 ? Math.sin(ageMs * Math.PI / 220) : 0
    if (creusageMs > 0) coup = (1 + Math.sin(creusageMs * 0.027)) / 2
    let marche = game.runtime() - dernierPasMs < 120
    let x = Math.round(141 - coup * 13 + (marche ? Math.sin(phaseMarche) * 2 : 0))
    let y = Math.round(97 - coup * 9 + (marche ? Math.abs(Math.cos(phaseMarche)) * 2 : 0))
    // De larges surfaces de plusieurs couleurs donnent du volume à l'avant-bras et à l'outil, même sur
    // un écran minuscule.
    for (let ligne = 0; ligne < 21; ligne++) {
        let gauche = x - 2 + Math.idiv(ligne, 3)
        toile.fillRect(gauche, y + ligne - 5, 15, 1, ligne < 11 ? 14 : 15)
        toile.fillRect(gauche + 1, y + ligne - 5, 10, 1, ligne < 10 ? 3 : 8)
        if (ligne < 9) toile.fillRect(gauche + 1, y + ligne - 5, 3, 1, 13)
        else if (ligne > 11) toile.fillRect(gauche + 2, y + ligne - 5, 3, 1, 12)
    }
    toile.drawLine(x, y - 5, x + 8, y - 5, 1)
    toile.drawLine(x + 8, y - 2, x + 8, y + 3, 14)
    if (aPioche) {
        for (let i = 0; i < 5; i++) {
            toile.drawLine(x - 5 + i, y + 5, x + 5 + i, y - 22,
                i == 0 || i == 4 ? 15 : i == 1 ? 4 : 14)
        }
        for (let ligne = 0; ligne < 5; ligne++) {
            toile.drawLine(x - 7, y - 24 + ligne, x + 11, y - 20 + ligne,
                ligne == 0 ? 1 : ligne < 3 ? 13 : 11)
        }
        toile.drawLine(x - 7, y - 24, x - 12, y - 17, 11)
        toile.drawLine(x - 6, y - 23, x - 11, y - 17, 13)
        toile.drawLine(x + 11, y - 20, x + 15, y - 12, 11)
        toile.drawLine(x + 12, y - 20, x + 16, y - 11, 12)
    }
}
function dessinerEclats(toile: Image) {
    let ageMs = game.runtime() - eclatsDebutMs
    if (ageMs < 0 || ageMs > 480) return
    // Dix éclats sur des trajectoires calculées : aucun objet par petit morceau en mémoire (le tas).
    for (let i = 0; i < 10; i++) {
        let tempsEclat = Math.max(0, ageMs - i * 7) / 65
        let x = Math.round(80 + ((i * 7 % 11) - 5) * tempsEclat)
        let y = Math.round(60 - (3 + i % 4) * tempsEclat + tempsEclat * tempsEclat * 0.65)
        let taille = ageMs < 180 ? 3 : 2
        toile.fillRect(x, y, taille, taille, i % 3 == 0 ? 13 : eclatsCouleur)
        if (taille == 3) toile.setPixel(x, y, 1)
    }
}
function dessinerSymboleBloc(toile: Image, x: number, y: number, sorte: number) {
    toile.drawLine(x + 4, y, x + 8, y + 2, symboleDessus[sorte])
    toile.drawLine(x + 2, y + 1, x + 7, y + 3, symboleDessus[sorte])
    toile.drawLine(x, y + 2, x + 4, y + 4, symboleDessus[sorte])
    for (let i = 0; i < 5; i++) {
        toile.drawLine(x, y + 3 + i, x + 4, y + 5 + i, symboleFace[sorte])
        toile.drawLine(x + 5, y + 5 + i, x + 9, y + 3 + i, symboleCote[sorte])
    }
    if (sorte == Bloc.Bois) toile.drawLine(x + 2, y + 5, x + 2, y + 8, 12)
    if (sorte == Bloc.Planches) toile.drawLine(x, y + 6, x + 4, y + 8, 14)
    if (sorte == Bloc.Cristal) toile.setPixel(x + 2, y + 5, 1)
}
function dessinerBarre(toile: Image) {
    toile.fillRect(0, 0, 160, 10, 15)
    toile.print(aPioche ? "PIOCHE" : "MAIN", 2, 1, aPioche ? 5 : 1, image.font8)
    toile.print("*" + cristauxTrouves + "/5", 58, 1, 9, image.font8)
    toile.print("MENU", 134, 1, 1, image.font8)
    if (exerciceActif || titreOuvert) {
        toile.fillRect(0, 112, 160, 10, 15)
        toile.print(nomsBlocs[materiaux[placeChoisie]] + " " + reserve[materiaux[placeChoisie]],
            2, 111, 5, image.font8)
        if (aCible) {
            toile.print(nomsBlocs[blocCible],
                160 - nomsBlocs[blocCible].length * 6, 111, 1, image.font8)
        }
    } else {
        // On voit d'un coup d'œil les six matériaux, avec leur quantité.
        for (let i = 0; i < 6; i++) {
            let x = 20 + i * 20
            toile.fillRect(x, 100, 20, 20, 15)
            toile.drawRect(x, 100, 20, 20, i == placeChoisie ? 5 : 12)
            if (i == placeChoisie) toile.drawLine(x + 2, 101, x + 17, 101, 13)
            dessinerSymboleBloc(toile, x + 5, 102, materiaux[i])
            let nombre = "" + reserve[materiaux[i]]
            toile.print(nombre, x + 19 - nombre.length * 6, 113, i == placeChoisie ? 5 : 13, image.font5)
        }
        let etiquette = nomsBlocs[materiaux[placeChoisie]]
        toile.fillRect(78 - etiquette.length * 3, 91, etiquette.length * 6 + 4, 8, 15)
        toile.print(etiquette, 80 - etiquette.length * 3, 92, 1, image.font8)
    }
    toile.drawLine(75, 60, 85, 60, 15)
    toile.drawLine(80, 55, 80, 65, 15)
    let couleurCroix = aCible ? 5 : 1
    toile.drawLine(76, 60, 78, 60, couleurCroix)
    toile.drawLine(82, 60, 84, 60, couleurCroix)
    toile.drawLine(80, 56, 80, 58, couleurCroix)
    toile.drawLine(80, 62, 80, 64, couleurCroix)
    if (creusageMs > 0) {
        let dureeCreusageMs = blocCible == Bloc.Pierre || blocCible == Bloc.Cristal
            ? (aPioche ? 220 : 600) : 300
        toile.fillRect(73, 68, Math.min(15, Math.idiv(creusageMs * 15, dureeCreusageMs)), 2, 5)
    }
    if (messageJusquaMs > game.runtime() && !menuOuvert && !exerciceActif) {
        toile.fillRect(0, 82, 160, 10, 15)
        toile.print(message, 2, 83, 5, image.font8)
    }
    if (aideJusquaMs > game.runtime() && !menuOuvert && !exerciceActif) {
        // Aide dans un trou : avec du matériau, construire vers le haut ; sans matériau, d'abord creuser un bloc.
        let aMateriau = resteMateriau()
        toile.fillRect(0, 10, 160, 20, 15)
        toile.drawLine(0, 29, 159, 29, 6)
        toile.print(aMateriau ? "Touche A : tu sautes." : "Pas de bloc ? Maintiens A.",
            2, 11, 5, image.font8)
        toile.print(aMateriau ? "Puis B : bloc sous toi." : "Puis touche A, puis B.",
            2, 20, 1, image.font8)
    }
}
function dessinerMenu(toile: Image) {
    toile.fillRect(5, 9, 150, 101, 15)
    toile.drawRect(5, 9, 150, 101, 6)
    // Image sur le mur : le Calliope Hacker à son bureau, dans un cadre en bois.
    toile.drawRect(MUR_X - 1, MUR_Y - 1, hacker.IMAGE_MUR.width + 2, hacker.IMAGE_MUR.height + 2, 14)
    toile.drawImage(hacker.IMAGE_MUR, MUR_X, MUR_Y)
    if (exerciceActif) {
        toile.print("TA PREMIÈRE PIOCHE", 15, 17, 7)
        toile.print("2 bois + 3 pierres", 20, 38, 1, image.font8)
        toile.print("Bois : " + reserve[Bloc.Bois], 20, 51, 13, image.font8)
        toile.print("Pierre : " + reserve[Bloc.Pierre], 20, 61, 13, image.font8)
        toile.fillRect(14, 77, 131, 13, 8)
        toile.print("B : CRÉER LA PIOCHE", 23, 81, 5, image.font8)
        toile.print("A : Retour", 50, 98, 1, image.font8)
        return
    }
    toile.print("ÉTABLI & PAUSE", 11, 14, 7)
    toile.print("Bois " + reserve[Bloc.Bois] +
        " Pierre " + reserve[Bloc.Pierre], 11, 26, 13, image.font8)
    let lignes = [
        "Bloc : " + nomsBlocs[materiaux[placeChoisie]],
        aPioche ? "Pioche : prête" : "Pioche:2 bois+3 pierres",
        "4 planches : 1 bois",
        "Sauvegarder",
        largeurRayon == 4 ? "Graphismes : normaux"
            : largeurRayon == 8 ? "Graphismes : rapides"
            : "Graphismes : fins (PC)",
        "Regarder devant",
        "Retour au départ",
        "Refaire l'exercice",
        "Revoir l'intro",
        sonActif ? "Son : oui" : "Son : non",
        aDemandeConfirmation ? "Nouveau ? B = Oui" : "Nouveau monde",
        "Volume " + music.volume()
    ]
    let premiere = Math.max(0, Math.min(NB_LIGNES_MENU - 6, ligneMenu - 2))
    for (let i = 0; i < 6; i++) {
        let rang = premiere + i
        // La ligne choisie est montrée par la barre ; sans « > », chaque ligne tient devant la barre de défilement.
        if (rang == ligneMenu) toile.fillRect(9, 36 + i * 9, 142, 9, 8)
        toile.print(lignes[rang], 11, 38 + i * 9, 1, image.font8)
    }
    toile.print(messageJusquaMs > game.runtime() ? message : "B: OK A/MENU: Retour",
        10, 98, 5, image.font8)
    toile.fillRect(152, 36, 2, 54, 12)
    toile.fillRect(152, 36 + Math.idiv(ligneMenu * 46, NB_LIGNES_MENU - 1), 2, 8, 9)
}
function ecrireAuMilieu(toile: Image, texte: string, y: number, couleur: number) {
    toile.print(texte, 80 - texte.length * 3, y, couleur, image.font8)
}
function dessinerTitre(toile: Image) {
    toile.fillRect(7, 12, 146, 98, 15)
    toile.drawRect(7, 12, 146, 98, 6)
    // Le titre du jeu a le même aspect que dans le film ; il est dessiné une seule fois dans une image, et sa taille
    // suit la longueur du nom.
    if (!logoTitre) {
        logoTitre = image.create(160, 30)
        filmDessinerLettres(logoTitre, filmImageTitre, 2, filmEchelleTitre(136), 100000, -10240, true, -1)
    }
    toile.drawTransparentImage(logoTitre, 0, 13)
    // Le Calliope Hacker à son bureau, devant un mur de la couleur hacker.COULEUR_MUR.
    toile.fillRect(48, 39, hacker.IMAGE_TITRE.width, hacker.IMAGE_TITRE.height, hacker.COULEUR_MUR)
    toile.drawTransparentImage(hacker.IMAGE_TITRE, 48, 39)
    ecrireAuMilieu(toile,
        avaitSauvegarde ? "A : reprendre" : "A : ton aventure", 84, 5)
    ecrireAuMilieu(toile, "B : s'entraîner", 96, 1)
}

avaitSauvegarde = decoderSauvegarde(settings.readBuffer(SAUVEGARDE_CLE))
if (!avaitSauvegarde) {
    largeurRayon = surAppareil ? 8 : 2
    creerMonde()
}
// Sur l'appareil, le jeu démarre toujours en mode économe (graphismes rapides), même avec des sauvegardes plus
// anciennes ou importées. « Normal » reste choisissable dans le menu pour la session en cours.
if (surAppareil) largeurRayon = 8
actualiserCible()
filmPreparer()
music.setVolume(settings.exists("#volume") ? settings.readNumber("#volume") : 90)
derniereActualisationMs = game.runtime()
derniereVerifSauvegardeMs = derniereActualisationMs
game.onUpdate(actualiserJeu)
scene.createRenderable(0, function (toile: Image) {
    if (!filmFini) {
        dessinerFilm(toile)
        return
    }
    dessinerMondeMemorise(toile)
    if (!titreOuvert && !menuOuvert) dessinerEclats(toile)
    if (!titreOuvert) dessinerOutil(toile)
    dessinerBarre(toile)
    if (titreOuvert) dessinerTitre(toile)
    if (menuOuvert) dessinerMenu(toile)
    if (exerciceActif) dessinerExercice(toile)
})
