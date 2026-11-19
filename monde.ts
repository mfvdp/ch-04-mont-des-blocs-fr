// Le monde et ses règles : les blocs, les mouvements du personnage, creuser, poser, fabriquer et la sauvegarde.
// Toutes les positions sont données en 256es de bloc (un bloc fait UNITE = 256 de large) : on calcule ainsi sans
// nombres à virgule. L'axe Y pointe vers le haut.
const MONDE_LARGEUR = 24
const MONDE_HAUTEUR = 12
const UNITE = 256
const PERSO_DEMI_LARGEUR = 62
const PERSO_HAUTEUR = 410
const HAUTEUR_YEUX = 350
const NB_BLOCS = MONDE_LARGEUR * MONDE_LARGEUR * MONDE_HAUTEUR
const SAUVEGARDE_TAILLE = 64 + NB_BLOCS / 2 + 2
// Vitesse de départ d'un saut, en 1/256 de bloc par seconde. Le personnage monte d'environ 1,27 bloc : juste assez pour
// sauter sur un bloc et poser un bloc sous lui pendant le saut.
const SAUT_VITESSE = 1140
// Si l'espace autour du personnage a moins de cases que ce nombre, il compte comme un trou.
const TROU_LIMITE = 20
enum Bloc { Air, Herbe, Terre, Pierre, Bois, Feuilles, Planches, Cristal, RocheMere }
let monde = control.createBuffer(NB_BLOCS)
let reserve = [0, 0, 24, 16, 8, 0, 12, 0, 0]
let materiaux = [Bloc.Terre, Bloc.Pierre, Bloc.Bois, Bloc.Feuilles, Bloc.Planches, Bloc.Cristal]
let nomsBlocs = ["Air", "Herbe", "Terre", "Pierre", "Bois", "Feuilles", "Planches", "Cristal", "Roche mère"]
let placeChoisie = 0
let cristauxTrouves = 0
let persoX = 3200
let persoY = 1024
let persoZ = 1152
let rotation = 0
let inclinaison = -0.16
let vitesseChute = 0
let auSol = true
// Le personnage est-il en l'air à cause d'un saut, et à quelle hauteur (en blocs) étaient ses pieds au moment du saut.
let enSaut = false
let hauteurAppel = 0
// Ce qui reste du dernier déplacement vertical parce que c'était moins de 1/256 de bloc (en 2000es). Ainsi, rien ne se
// perd quand on calcule avec des nombres entiers.
let resteChute = 0
// Aide-mémoire pour chercher un trou : les cases déjà visitées et une file des cases encore à voir. Ils sont créés une
// seule fois, pas à chaque image.
let trouVu = control.createBuffer(MONDE_LARGEUR * MONDE_LARGEUR)
let trouX = control.createBuffer(TROU_LIMITE)
let trouZ = control.createBuffer(TROU_LIMITE)
let trouPieds = control.createBuffer(TROU_LIMITE)
let nonSauve = false
let largeurRayon = 4
let aPioche = false
let exerciceFait = false

function estDansMonde(x: number, y: number, z: number): boolean {
    return x >= 0 && x < MONDE_LARGEUR && y >= 0 && y < MONDE_HAUTEUR && z >= 0 && z < MONDE_LARGEUR
}
function blocEn(x: number, y: number, z: number): number {
    if (!estDansMonde(x, y, z)) return Bloc.Air
    return monde[x + MONDE_LARGEUR * (z + MONDE_LARGEUR * y)]
}
function ecrireBloc(x: number, y: number, z: number, sorte: number) {
    if (estDansMonde(x, y, z) && y > 0) {
        monde[x + MONDE_LARGEUR * (z + MONDE_LARGEUR * y)] = sorte
        nonSauve = true
    }
}
function persoHeurte(x: number, y: number, z: number): boolean {
    if (x - PERSO_DEMI_LARGEUR < 0 || z - PERSO_DEMI_LARGEUR < 0 ||
        x + PERSO_DEMI_LARGEUR >= MONDE_LARGEUR * UNITE || z + PERSO_DEMI_LARGEUR >= MONDE_LARGEUR * UNITE ||
        y < UNITE) return true
    for (let blocY = y >> 8; blocY <= (y + PERSO_HAUTEUR - 1) >> 8; blocY++) {
        for (let blocZ = (z - PERSO_DEMI_LARGEUR) >> 8; blocZ <= (z + PERSO_DEMI_LARGEUR - 1) >> 8; blocZ++) {
            for (let blocX = (x - PERSO_DEMI_LARGEUR) >> 8;
                blocX <= (x + PERSO_DEMI_LARGEUR - 1) >> 8; blocX++) {
                if (blocEn(blocX, blocY, blocZ) != Bloc.Air) return true
            }
        }
    }
    return false
}
function chevauchePerso(x: number, y: number, z: number): boolean {
    return x * UNITE < persoX + PERSO_DEMI_LARGEUR && (x + 1) * UNITE > persoX - PERSO_DEMI_LARGEUR &&
        z * UNITE < persoZ + PERSO_DEMI_LARGEUR && (z + 1) * UNITE > persoZ - PERSO_DEMI_LARGEUR &&
        y * UNITE < persoY + PERSO_HAUTEUR && (y + 1) * UNITE > persoY
}
function planterArbre(x: number, z: number, sol: number) {
    for (let y = sol + 3; y <= sol + 4; y++) {
        for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) ecrireBloc(x + dx, y, z + dz, Bloc.Feuilles)
        }
    }
    for (let y = sol + 1; y <= sol + 3; y++) ecrireBloc(x, y, z, Bloc.Bois)
}
function creerMonde() {
    monde.fill(0)
    let phaseX = randint(0, 628) / 100
    let phaseZ = randint(0, 628) / 100
    for (let z = 0; z < MONDE_LARGEUR; z++) {
        for (let x = 0; x < MONDE_LARGEUR; x++) {
            let sommet = 3 +
                Math.floor((Math.sin(x * 0.43 + phaseX) + Math.cos(z * 0.38 + phaseZ) + 2) * 0.65)
            // La bande qui mène au premier arbre reste plate (hauteur 3) dans chaque nouveau monde, pour que le
            // début soit facile.
            if (x >= 9 && x <= 15 && z <= 9) sommet = 3
            for (let y = 0; y <= sommet; y++) {
                let sorte = y == 0 ? Bloc.RocheMere
                    : y == sommet ? Bloc.Herbe
                    : y == sommet - 1 ? Bloc.Terre
                    : Bloc.Pierre
                if (y > 0 && y < sommet - 1 && randint(0, 29) == 0) sorte = Bloc.Cristal
                monde[x + MONDE_LARGEUR * (z + MONDE_LARGEUR * y)] = sorte
            }
            if (x % 5 == 2 && z % 6 == 3 && z > 7) planterArbre(x, z, sommet)
        }
    }
    // Des cristaux fixes juste au-dessus de la roche mère (hauteur 1) et une petite chambre sous le sol : il y a
    // toujours quelque chose à trouver.
    for (let i = 0; i < 7; i++) ecrireBloc(3 + i * 2, 1, 18, Bloc.Cristal)
    for (let x = 4; x <= 7; x++) {
        for (let z = 15; z <= 18; z++) {
            ecrireBloc(x, 2, z, Bloc.Air)
            ecrireBloc(x, 3, z, Bloc.Air)
        }
    }
    planterArbre(12, 9, 3)
    // Quelques blocs de pierre et de planches sont déjà là, pour essayer tout de suite de construire.
    ecrireBloc(15, 4, 7, Bloc.Pierre)
    ecrireBloc(15, 5, 7, Bloc.Pierre)
    ecrireBloc(16, 4, 7, Bloc.Planches)
    reserve = [0, 0, 24, 16, 8, 0, 12, 0, 0]
    placeChoisie = 0
    cristauxTrouves = 0
    aPioche = false
    rotation = 0
    inclinaison = -0.16
    retournerAuDepart()
    nonSauve = true
}
function retournerAuDepart() {
    persoX = 12 * UNITE + 128
    persoZ = 4 * UNITE + 128
    persoY = 4 * UNITE
    ecrireBloc(12, 3, 4, Bloc.Herbe)
    ecrireBloc(12, 4, 4, Bloc.Air)
    ecrireBloc(12, 5, 4, Bloc.Air)
    vitesseChute = 0
    auSol = true
    enSaut = false
}
function deplacerSurAxe(dx: number, dz: number) {
    if (!persoHeurte(persoX + dx, persoY, persoZ + dz)) {
        persoX += dx
        persoZ += dz
    } else if (auSol && !persoHeurte(persoX, persoY + UNITE, persoZ) &&
        !persoHeurte(persoX + dx, persoY + UNITE, persoZ + dz)) {
        persoY += UNITE
        persoX += dx
        persoZ += dz
        // À chaque calcul, le personnage ne monte que d'une marche, même en diagonale ; ensuite il est
        // considéré en l'air.
        auSol = false
        vitesseChute = 0
    }
}
function deplacerPerso(avance: number, dureeMs: number) {
    dureeMs = Math.max(0, Math.min(80, dureeMs))
    if (dureeMs == 0) return
    // Qui monte en volant n'est pas debout sur le sol. Ainsi, le personnage ne monte pas en plus une marche au
    // moment du saut.
    auSol = vitesseChute <= 0 && persoHeurte(persoX, persoY - 2, persoZ)
    let distance = Math.idiv(avance * dureeMs * 7, 10)
    deplacerSurAxe(Math.round(Math.sin(rotation) * distance), 0)
    deplacerSurAxe(0, Math.round(Math.cos(rotation) * distance))
    // Chemin selon l'horloge : la vitesse moyenne avant et après le pas de temps, multipliée par la durée. Ainsi, un
    // saut monte aussi haut, qu'une image dure 16 ou 80 millisecondes.
    let vitesseAvant = vitesseChute
    vitesseChute = Math.max(-1100, vitesseChute - dureeMs * 2)
    let trajet = (vitesseAvant + vitesseChute) * dureeMs + resteChute
    let mouvement = Math.idiv(trajet, 2000)
    resteChute = trajet - mouvement * 2000
    let morceaux = Math.max(1, Math.ceil(Math.abs(mouvement) / 24))
    for (let i = 0; i < morceaux; i++) {
        let dy = Math.idiv(mouvement * (i + 1), morceaux) - Math.idiv(mouvement * i, morceaux)
        if (!persoHeurte(persoX, persoY + dy, persoZ)) persoY += dy
        else {
            // Le personnage glisse pas à pas tout contre le sol ou le plafond, au lieu de rester en l'air juste avant.
            let sens = dy < 0 ? -1 : 1
            for (let petitPas = 0; petitPas < Math.abs(dy); petitPas++) {
                if (persoHeurte(persoX, persoY + sens, persoZ)) break
                persoY += sens
            }
            vitesseChute = 0
            resteChute = 0
            break
        }
    }
    auSol = persoHeurte(persoX, persoY - 1, persoZ)
    if (auSol && vitesseChute <= 0) enSaut = false
}
// On ne saute que depuis le sol, pas en l'air.
function sauter(): boolean {
    if (!persoHeurte(persoX, persoY - 1, persoZ)) return false
    vitesseChute = SAUT_VITESSE
    resteChute = 0
    auSol = false
    enSaut = true
    hauteurAppel = persoY >> 8
    return true
}
// Pendant un saut, poser un bloc sous les pieds (construire vers le haut). Si le matériau choisi est épuisé, le
// personnage prend le matériau suivant dont il lui reste encore.
function poserSousSoi(): boolean {
    if (!enSaut || persoY < (hauteurAppel + 1) * UNITE) return false
    if (reserve[materiaux[placeChoisie]] == 0) {
        for (let i = 1; i < materiaux.length; i++) {
            let suivant = (placeChoisie + i) % materiaux.length
            if (reserve[materiaux[suivant]] > 0) {
                placeChoisie = suivant
                break
            }
        }
    }
    return poserBloc(persoX >> 8, hauteurAppel, persoZ >> 8)
}
// Le personnage a-t-il encore un matériau, quel qu'il soit ?
function resteMateriau(): boolean {
    for (let i = 0; i < materiaux.length; i++) {
        if (reserve[materiaux[i]] > 0) return true
    }
    return false
}
// Où arrive le personnage depuis sa case sur la case voisine, seulement en marchant et en sautant ? La réponse est la
// nouvelle hauteur de ses pieds, ou -1 si ce n'est pas possible.
function hauteurAtteinte(x: number, z: number, pieds: number, voisinX: number, voisinZ: number): number {
    if (voisinX < 0 || voisinZ < 0 || voisinX >= MONDE_LARGEUR || voisinZ >= MONDE_LARGEUR) return -1
    if (blocEn(voisinX, pieds, voisinZ) == Bloc.Air && blocEn(voisinX, pieds + 1, voisinZ) == Bloc.Air) {
        let y = pieds
        while (y > 1 && blocEn(voisinX, y - 1, voisinZ) == Bloc.Air) y--
        return y
    }
    if (blocEn(voisinX, pieds + 1, voisinZ) == Bloc.Air && blocEn(voisinX, pieds + 2, voisinZ) == Bloc.Air &&
        blocEn(x, pieds + 2, z) == Bloc.Air) return pieds + 1
    return -1
}
// Compte les cases que le personnage atteint en marchant et en sautant, mais seulement jusqu'à la limite d'un trou.
// Moins de cases veut dire : il est dans un trou et n'en sort qu'en construisant vers le haut ou en creusant.
function compterPlace(): number {
    trouVu.fill(0)
    trouX[0] = persoX >> 8
    trouZ[0] = persoZ >> 8
    trouPieds[0] = persoY >> 8
    trouVu[trouX[0] + MONDE_LARGEUR * trouZ[0]] = 1
    let nombre = 1
    let suivante = 0
    while (suivante < nombre) {
        let x = trouX[suivante]
        let z = trouZ[suivante]
        let pieds = trouPieds[suivante]
        suivante++
        for (let cote = 0; cote < 4; cote++) {
            let voisinX = x + (cote == 0 ? 1 : cote == 1 ? -1 : 0)
            let voisinZ = z + (cote == 2 ? 1 : cote == 3 ? -1 : 0)
            let atteinte = hauteurAtteinte(x, z, pieds, voisinX, voisinZ)
            if (atteinte < 0 || trouVu[voisinX + MONDE_LARGEUR * voisinZ] == 1) continue
            if (nombre >= TROU_LIMITE) return TROU_LIMITE
            trouVu[voisinX + MONDE_LARGEUR * voisinZ] = 1
            trouX[nombre] = voisinX
            trouZ[nombre] = voisinZ
            trouPieds[nombre] = atteinte
            nombre++
        }
    }
    return nombre
}
function creuserBloc(x: number, y: number, z: number): boolean {
    let sorte = blocEn(x, y, z)
    if (sorte == Bloc.Air || sorte == Bloc.RocheMere || !estDansMonde(x, y, z)) return false
    let recolte = sorte == Bloc.Herbe ? Bloc.Terre : sorte
    if (reserve[recolte] >= 999) return false
    reserve[recolte]++
    // Les cristaux comptent d'après la plus grande réserve qu'on ait eue : poser un cristal puis le reprendre ne le
    // compte pas deux fois.
    if (sorte == Bloc.Cristal) cristauxTrouves = Math.max(cristauxTrouves, reserve[sorte])
    ecrireBloc(x, y, z, Bloc.Air)
    return true
}
function poserBloc(x: number, y: number, z: number): boolean {
    let sorte = materiaux[placeChoisie]
    if (!estDansMonde(x, y, z) || y == 0 || blocEn(x, y, z) != Bloc.Air || reserve[sorte] == 0 ||
        chevauchePerso(x, y, z)) return false
    ecrireBloc(x, y, z, sorte)
    reserve[sorte]--
    return true
}
function fabriquerPlanches(): boolean {
    if (reserve[Bloc.Bois] < 1 || reserve[Bloc.Planches] > 995) return false
    reserve[Bloc.Bois]--
    reserve[Bloc.Planches] += 4
    nonSauve = true
    return true
}
function fabriquerPioche(): boolean {
    if (aPioche || reserve[Bloc.Bois] < 2 || reserve[Bloc.Pierre] < 3) return false
    reserve[Bloc.Bois] -= 2
    reserve[Bloc.Pierre] -= 3
    aPioche = true
    nonSauve = true
    return true
}
function sommeControle(donnees: Buffer): number {
    let somme = 0
    for (let i = 0; i < donnees.length - 2; i++) somme = (somme * 31 + donnees[i]) & 65535
    return somme
}
function coderSauvegarde(): Buffer {
    let donnees = control.createBuffer(SAUVEGARDE_TAILLE)
    donnees[0] = 67
    donnees[1] = 51
    donnees[2] = 1
    donnees[3] = placeChoisie
    donnees[4] = largeurRayon
    donnees[5] = aPioche ? 1 : 0
    donnees.setNumber(NumberFormat.UInt16LE, 6, persoX)
    donnees.setNumber(NumberFormat.UInt16LE, 8, persoY)
    donnees.setNumber(NumberFormat.UInt16LE, 10, persoZ)
    donnees.setNumber(NumberFormat.UInt16LE, 12, Math.floor(rotation * 10000))
    donnees.setNumber(NumberFormat.UInt16LE, 14, Math.floor((inclinaison + 1.2) * 10000))
    donnees.setNumber(NumberFormat.UInt16LE, 16, Math.min(65535, cristauxTrouves))
    for (let i = 0; i < reserve.length; i++) donnees.setNumber(NumberFormat.UInt16LE, 18 + i * 2, reserve[i])
    donnees[40] = exerciceFait ? 1 : 0
    for (let i = 0; i < NB_BLOCS; i += 2) donnees[64 + i / 2] = monde[i] | (monde[i + 1] << 4)
    donnees.setNumber(NumberFormat.UInt16LE, SAUVEGARDE_TAILLE - 2, sommeControle(donnees))
    return donnees
}
function decoderSauvegarde(donnees: Buffer): boolean {
    if (!donnees || donnees.length != SAUVEGARDE_TAILLE || donnees[0] != 67 || donnees[1] != 51 || donnees[2] != 1 ||
        donnees[3] >= materiaux.length || (donnees[4] != 2 && donnees[4] != 4 && donnees[4] != 8) ||
        donnees[5] > 1 || donnees[40] > 1 ||
        donnees.getNumber(NumberFormat.UInt16LE, SAUVEGARDE_TAILLE - 2) != sommeControle(donnees)) return false
    let x = donnees.getNumber(NumberFormat.UInt16LE, 6)
    let y = donnees.getNumber(NumberFormat.UInt16LE, 8)
    let z = donnees.getNumber(NumberFormat.UInt16LE, 10)
    if (x < PERSO_DEMI_LARGEUR || z < PERSO_DEMI_LARGEUR ||
        x >= MONDE_LARGEUR * UNITE - PERSO_DEMI_LARGEUR || z >= MONDE_LARGEUR * UNITE - PERSO_DEMI_LARGEUR ||
        y < UNITE || y > MONDE_HAUTEUR * UNITE ||
        donnees.getNumber(NumberFormat.UInt16LE, 12) >= 62832 ||
        donnees.getNumber(NumberFormat.UInt16LE, 14) > 24000) return false
    for (let i = 0; i < reserve.length; i++) {
        if (donnees.getNumber(NumberFormat.UInt16LE, 18 + i * 2) > 999) return false
    }
    for (let i = 64; i < SAUVEGARDE_TAILLE - 2; i++) {
        if ((donnees[i] & 15) > Bloc.RocheMere || (donnees[i] >> 4) > Bloc.RocheMere) return false
        if (i < 64 + MONDE_LARGEUR * MONDE_LARGEUR / 2 && donnees[i] != 136) return false
    }
    for (let i = 0; i < NB_BLOCS; i += 2) {
        monde[i] = donnees[64 + i / 2] & 15
        monde[i + 1] = donnees[64 + i / 2] >> 4
    }
    persoX = x
    persoY = y
    persoZ = z
    rotation = donnees.getNumber(NumberFormat.UInt16LE, 12) / 10000
    inclinaison = donnees.getNumber(NumberFormat.UInt16LE, 14) / 10000 - 1.2
    placeChoisie = donnees[3]
    largeurRayon = donnees[4]
    aPioche = donnees[5] == 1
    exerciceFait = donnees[40] == 1
    cristauxTrouves = donnees.getNumber(NumberFormat.UInt16LE, 16)
    for (let i = 0; i < reserve.length; i++) {
        reserve[i] = donnees.getNumber(NumberFormat.UInt16LE, 18 + i * 2)
    }
    vitesseChute = 0
    enSaut = false
    nonSauve = false
    if (persoHeurte(persoX, persoY, persoZ)) retournerAuDepart()
    else auSol = persoHeurte(persoX, persoY - 1, persoZ)
    return true
}
