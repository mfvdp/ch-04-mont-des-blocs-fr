// L'exercice en huit étapes sur un terrain à part. À la fin, la vraie partie (monde, réserve et position)
// revient comme avant.
let exerciceActif = false
let exerciceEtape = 0
let exerciceMs = 0
let exerciceProgres = 0
let copiePartie: Buffer = null
let exerciceDepartZ = 0
let exerciceAuBout = false
let etaitNonSauve = false
// L'étape 8 entraîne le saut et la construction vers le haut dans un trou ; l'étape 9 est la carte de fin.
const EXERCICE_SAUT = 8
const EXERCICE_FIN = 9
let exerciceTitres = [
    "TON AVENTURE COMMENCE",
    "01  SE DÉPLACER",
    "02  REGARDER",
    "03  HAUT ET BAS",
    "04  RÉCOLTER DU BOIS",
    "05  TON PREMIER BLOC",
    "06  CHOISIR LE MATÉRIAU",
    "07  L'ÉTABLI",
    "08  SORS DU TROU",
    "PRÊT POUR TON MONDE"
]
let exerciceLigne1 = [
    "Découvre le monde.",
    "Maintiens HAUT : marche",
    "Maintiens GAUCHE/DROITE",
    "Maintiens B + HAUT/BAS",
    "Vise le bois.",
    "Appuie brièvement sur B",
    "Maintiens B + DROITE.",
    "Ouvre MENU.",
    "Touche A : tu sautes.",
    "Explore. Récolte. Bâtis."
]
let exerciceLigne2 = [
    "Huit petits défis.",
    "Rejoins le bloc test.",
    "Tu peux ainsi tourner.",
    "Déplace ton regard.",
    "Maintiens A : creuse.",
    "Pose devant la pierre.",
    "Choisis un matériau.",
    "Fabrique une pioche.",
    "Puis B : bloc sous toi.",
    "A : en route !"
]

function lancerExercice() {
    // Même si on refait l'exercice, le monde, la réserve et la position du vrai jeu sont conservés.
    etaitNonSauve = nonSauve
    copiePartie = coderSauvegarde()
    creerMonde()
    for (let x = 9; x <= 15; x++) {
        for (let z = 3; z <= 10; z++) {
            ecrireBloc(x, 3, z, Bloc.Herbe)
            for (let y = 4; y < MONDE_HAUTEUR; y++) ecrireBloc(x, y, z, Bloc.Air)
        }
    }
    ecrireBloc(12, 4, 7, Bloc.Bois)
    ecrireBloc(12, 5, 7, Bloc.Bois)
    ecrireBloc(12, 4, 8, Bloc.Pierre)
    ecrireBloc(12, 5, 8, Bloc.Pierre)
    exerciceActif = true
    exerciceEtape = 0
    exerciceMs = 0
    exerciceProgres = 0
    exerciceDepartZ = persoZ
    exerciceAuBout = false
    titreOuvert = false
    menuOuvert = false
    touchesVerrouillees = true
    bUtilise = true
    creusageMs = 0
    messageJusquaMs = 0
    actualiserCible()
    demanderNouvelleImage()
}
function terminerExercice(reussi: boolean) {
    if (!exerciceActif) return
    if (copiePartie) decoderSauvegarde(copiePartie)
    nonSauve = etaitNonSauve
    copiePartie = null
    exerciceActif = false
    exerciceAuBout = false
    menuOuvert = false
    titreOuvert = false
    touchesVerrouillees = true
    bUtilise = true
    creusageMs = 0
    if (reussi) {
        exerciceFait = true
        nonSauve = true
        enregistrerPartie()
        afficherMessage("Ton aventure commence !")
    } else afficherMessage("Exercice terminé")
    actualiserCible()
    demanderNouvelleImage()
}
function passerEtapeSuivante() {
    exerciceEtape++
    exerciceMs = 0
    exerciceProgres = 0
    creusageMs = 0
    touchesVerrouillees = true
    bUtilise = true
    jouerSon(2)
    if (exerciceEtape == 3 || exerciceEtape == 4 || exerciceEtape == 5) {
        rotation = 0
        inclinaison = -0.16
    }
    if (exerciceEtape == 4) {
        persoX = 12 * UNITE + 128
        persoZ = 5 * UNITE + 128
        persoY = 4 * UNITE
        vitesseChute = 0
    }
    if (exerciceEtape == EXERCICE_SAUT) {
        // Un trou de deux blocs de profondeur : on n'en sort pas en marchant, mais en construisant vers le haut, oui.
        menuOuvert = false
        ecrireBloc(10, 1, 5, Bloc.Pierre)
        ecrireBloc(10, 2, 5, Bloc.Air)
        ecrireBloc(10, 3, 5, Bloc.Air)
        persoX = 10 * UNITE + 128
        persoZ = 5 * UNITE + 128
        persoY = 2 * UNITE
        vitesseChute = 0
        enSaut = false
        rotation = 0
        inclinaison = -0.16
    }
    if (exerciceEtape == EXERCICE_FIN) {
        exerciceAuBout = true
        menuOuvert = false
    }
    actualiserCible()
    demanderNouvelleImage()
}
function verifierActionExercice(action: number) {
    if (!exerciceActif) return
    if ((exerciceEtape == 4 && action == 0) || (exerciceEtape == 5 && action == 1) ||
        (exerciceEtape == 6 && action == 2) || (exerciceEtape == 7 && action == 3)) passerEtapeSuivante()
}
function actualiserExercice(dureeMs: number, sensRotation: number, sensInclinaison: number) {
    if (!exerciceActif) return
    exerciceMs += dureeMs
    if (exerciceEtape == 0 && exerciceMs >= 2600) passerEtapeSuivante()
    else if (exerciceEtape == 1) {
        exerciceProgres = Math.min(1, Math.max(0, (persoZ - exerciceDepartZ) / 160))
        if (exerciceProgres >= 1) passerEtapeSuivante()
    } else if (exerciceEtape == 2) {
        exerciceProgres += Math.abs(sensRotation) * dureeMs / 260
        if (exerciceProgres >= 1) passerEtapeSuivante()
    } else if (exerciceEtape == 3) {
        exerciceProgres += Math.abs(sensInclinaison) * dureeMs / 260
        if (exerciceProgres >= 1) passerEtapeSuivante()
    } else if (exerciceEtape == EXERCICE_SAUT && persoY >= 4 * UNITE && persoHeurte(persoX, persoY - 1, persoZ)) {
        // Réussi dès que le personnage est de nouveau en haut, sur la prairie.
        passerEtapeSuivante()
    }
}
function dessinerExercice(toile: Image) {
    if (exerciceEtape == 0 || exerciceEtape == EXERCICE_FIN) {
        toile.fillRect(4, 30, 152, 61, 15)
        toile.drawRect(4, 30, 152, 61, 6)
        let titre = exerciceTitres[exerciceEtape]
        toile.print(titre.substr(0, Math.min(titre.length, Math.idiv(exerciceMs, 35))),
            9, 38, 7, image.font8)
        toile.print(exerciceLigne1[exerciceEtape], 11, 53, 1, image.font8)
        toile.print(exerciceLigne2[exerciceEtape], 11, 64, 13, image.font8)
        if (exerciceEtape == 0) {
            toile.fillRect(11, 81, Math.min(138, Math.idiv(exerciceMs * 138, 2600)), 2, 9)
        } else {
            let lueur = Math.idiv(exerciceMs, 250) % 2 == 0 ? 5 : 13
            let texteVasY = "A : VAS-Y !"
            toile.print(texteVasY, 80 - texteVasY.length * 3, 79, lueur, image.font8)
        }
    } else if (!menuOuvert) {
        toile.fillRect(0, 80, 160, 32, 15)
        toile.drawLine(0, 80, 159, 80, 6)
        toile.print(exerciceTitres[exerciceEtape], 4, 84, 5, image.font8)
        toile.print(exerciceLigne1[exerciceEtape], 4, 94, 1, image.font8)
        toile.print(exerciceLigne2[exerciceEtape], 4, 103, 13, image.font8)
        for (let i = 0; i < 8; i++) {
            toile.fillRect(114 + i * 6, 73, 4, 3,
                i < exerciceEtape - 1 ? 7 : i == exerciceEtape - 1 ? 5 : 12)
        }
    }
    toile.fillRect(0, 0, 160, 8, 15)
    toile.print("EXERCICE " + Math.min(8, exerciceEtape) + "/8", 2, 1, 9, image.font8)
    toile.print(exerciceEtape == 7 ? "MENU" : "MENU: FIN",
        exerciceEtape == 7 ? 134 : 88, 1, 13, image.font8)
}
