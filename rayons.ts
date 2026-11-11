// Les rayons de vue et l'image du monde en vraie 3D.
// Pour chaque colonne et chaque ligne de l'image, un rayon traverse le monde d'un bord de bloc au suivant (cette
// méthode s'appelle DDA), avec seulement des nombres entiers. Il n'y a pas de sprites, et un rayon ne crée aucun nouvel
// objet en mémoire.
let impactX = 0
let impactY = 0
let impactZ = 0
let faceImpactX = 0
let faceImpactY = 0
let faceImpactZ = 0
let blocImpact = 0
let distanceImpact = 0
let regardX = 0
let regardY = 0
let regardZ = 1024
let droiteX = 1024
let droiteZ = 0
let hautX = 0
let hautY = 1024
let hautZ = 0
let aCible = false
let cibleX = 0
let cibleY = 0
let cibleZ = 0
let poseX = 0
let poseY = 0
let poseZ = 0
let blocCible = 0
let couleursBase = [9, 14, 14, 11, 14, 7, 13, 9, 12]
let couleursSombres = [9, 12, 12, 12, 12, 6, 14, 6, 15]
let couleursBrume = [9, 1, 4, 13, 13, 13, 11, 7, 11, 9, 11, 11, 11, 13, 11, 11]
// Sept masques de motif (16 sur 16 pixels chacun) sont côte à côte dans UNE image à 4 bits par pixel : 896 octets au
// lieu de nombreuses grandes listes. Dans un masque, 0 veut dire teinte de base, 1 creux et 2 lumière. Ils ne sont
// dessinés qu'une fois, à la première image du monde (dessinerMonde).
let imagesBlocs = image.create(112, 16)
let imagesPretes = false
let vecteurRotation = -10000
let vecteurInclinaison = -10000
let rayonRotation = -10000
let rayonInclinaison = -10000
let rayonLargeur = 0
let colonneX: number[] = []
let colonneZ: number[] = []
let ligneX: number[] = []
let ligneY: number[] = []
let ligneZ: number[] = []

function calculerVecteursRegard() {
    // actualiserCible et le dessin utilisent les mêmes vecteurs de regard. À partir de la rotation (vers la gauche ou
    // la droite) et de l'inclinaison (vers le haut ou le bas), on obtient trois directions de longueur 1024 : où l'on
    // regarde, vers la droite et vers le haut. Tant que ni la rotation ni l'inclinaison ne changent, on ne recalcule ni
    // sinus ni cosinus, même en marchant tout droit.
    if (rotation == vecteurRotation && inclinaison == vecteurInclinaison) return
    vecteurRotation = rotation
    vecteurInclinaison = inclinaison
    let sinRotation = Math.sin(rotation)
    let cosRotation = Math.cos(rotation)
    let sinInclinaison = Math.sin(inclinaison)
    let cosInclinaison = Math.cos(inclinaison)
    regardX = Math.round(sinRotation * cosInclinaison * 1024)
    regardY = Math.round(sinInclinaison * 1024)
    regardZ = Math.round(cosRotation * cosInclinaison * 1024)
    droiteX = Math.round(cosRotation * 1024)
    droiteZ = Math.round(-sinRotation * 1024)
    hautX = Math.round(-sinRotation * sinInclinaison * 1024)
    hautY = Math.round(cosInclinaison * 1024)
    hautZ = Math.round(-cosRotation * sinInclinaison * 1024)
}
// Unités : la direction est en 1024es, le trajet en 1024 par bloc, le point de départ en 256 par bloc.
function suivreRayon(origineX: number, origineY: number, origineZ: number,
    directionX: number, directionY: number, directionZ: number, limite: number): boolean {
    blocImpact = 0
    if (directionX == 0 && directionY == 0 && directionZ == 0) return false
    let x = origineX >> 8
    let y = origineY >> 8
    let z = origineZ >> 8
    let signeX = directionX < 0 ? -1 : 1
    let signeY = directionY < 0 ? -1 : 1
    let signeZ = directionZ < 0 ? -1 : 1
    let indexMonde = x + MONDE_LARGEUR * (z + MONDE_LARGEUR * y)
    let pasIndexY = MONDE_LARGEUR * MONDE_LARGEUR * signeY
    let pasIndexZ = MONDE_LARGEUR * signeZ
    let trajetParBlocX = directionX == 0 ? 1073741823 : Math.idiv(1048576, Math.abs(directionX))
    let trajetParBlocY = directionY == 0 ? 1073741823 : Math.idiv(1048576, Math.abs(directionY))
    let trajetParBlocZ = directionZ == 0 ? 1073741823 : Math.idiv(1048576, Math.abs(directionZ))
    // Virgule fixe : si une direction n'est pas nulle, le trajet par bloc vaut au plus 1048576 (2 puissance 20).
    // Multiplié par 256, cela fait au plus 2 puissance 28 : cela tient encore dans un entier. Il suffit donc de décaler
    // de 8 bits (>> 8), au lieu de faire trois divisions de plus.
    let prochainX = directionX == 0 ? 1073741823
        : ((directionX < 0 ? origineX & 255 : 256 - (origineX & 255)) * trajetParBlocX) >> 8
    let prochainY = directionY == 0 ? 1073741823
        : ((directionY < 0 ? origineY & 255 : 256 - (origineY & 255)) * trajetParBlocY) >> 8
    let prochainZ = directionZ == 0 ? 1073741823
        : ((directionZ < 0 ? origineZ & 255 : 256 - (origineZ & 255)) * trajetParBlocZ) >> 8
    let trajet = 0
    let axe = 0
    for (let pas = 0; pas < 48; pas++) {
        if (prochainX <= prochainY && prochainX <= prochainZ) {
            trajet = prochainX
            prochainX += trajetParBlocX
            x += signeX
            indexMonde += signeX
            axe = 0
        } else if (prochainY <= prochainZ) {
            trajet = prochainY
            prochainY += trajetParBlocY
            y += signeY
            indexMonde += pasIndexY
            axe = 1
        } else {
            trajet = prochainZ
            prochainZ += trajetParBlocZ
            z += signeZ
            indexMonde += pasIndexZ
            axe = 2
        }
        if (trajet > limite || x < 0 || x >= MONDE_LARGEUR || z < 0 || z >= MONDE_LARGEUR || y < 0) return false
        // Un rayon au-dessus du monde peut y rentrer en descendant ; s'il monte, il est définitivement dehors.
        if (y >= MONDE_HAUTEUR) {
            if (directionY >= 0) return false
            continue
        }
        let sorte = monde[indexMonde]
        if (sorte != 0) {
            impactX = x
            impactY = y
            impactZ = z
            blocImpact = sorte
            distanceImpact = trajet
            faceImpactX = axe == 0 ? -signeX : 0
            faceImpactY = axe == 1 ? -signeY : 0
            faceImpactZ = axe == 2 ? -signeZ : 0
            return true
        }
    }
    return false
}
function actualiserCible() {
    calculerVecteursRegard()
    aCible = suivreRayon(persoX, persoY + HAUTEUR_YEUX, persoZ, regardX, regardY, regardZ, 4 * 1024)
    if (aCible) {
        cibleX = impactX
        cibleY = impactY
        cibleZ = impactZ
        blocCible = blocImpact
        poseX = impactX + faceImpactX
        poseY = impactY + faceImpactY
        poseZ = impactZ + faceImpactZ
    } else blocCible = 0
}
function preparerImagesBlocs() {
    if (imagesPretes) return
    imagesPretes = true
    // Herbe : deux minuscules brins. Pas de taches de couleur au hasard sur chaque face.
    imagesBlocs.drawLine(3, 4, 4, 3, 1)
    imagesBlocs.setPixel(4, 5, 1)
    imagesBlocs.drawLine(11, 11, 12, 12, 1)
    // Terre : quelques petits cailloux enfoncés, pas de motif de carreaux régulier.
    imagesBlocs.drawLine(19, 5, 20, 5, 1)
    imagesBlocs.setPixel(20, 4, 2)
    imagesBlocs.drawLine(26, 11, 28, 11, 1)
    imagesBlocs.setPixel(27, 10, 2)
    imagesBlocs.setPixel(22, 14, 1)
    // Pierre : de courts joints et deux bords de lumière doux.
    imagesBlocs.drawLine(35, 5, 39, 5, 1)
    imagesBlocs.drawLine(38, 6, 40, 6, 1)
    imagesBlocs.drawLine(42, 11, 45, 11, 1)
    imagesBlocs.drawLine(35, 4, 38, 4, 2)
    imagesBlocs.drawLine(43, 10, 45, 10, 2)
    // Écorce : des veines interrompues et décalées, pas de longues rayures continues.
    imagesBlocs.fillRect(52, 3, 2, 3, 1)
    imagesBlocs.drawLine(53, 6, 53, 8, 1)
    imagesBlocs.fillRect(59, 10, 2, 3, 1)
    imagesBlocs.drawLine(60, 2, 60, 4, 2)
    imagesBlocs.drawLine(56, 11, 56, 13, 2)
    // Bois de bout (la coupe du tronc, sur le dessus et le dessous) : deux cernes fermés autour d'un petit cœur.
    imagesBlocs.drawRect(66, 2, 12, 12, 1)
    imagesBlocs.drawRect(69, 5, 6, 6, 1)
    imagesBlocs.fillRect(71, 7, 2, 2, 2)
    // Planches : des joints décalés bout à bout et un peu de veines de bois.
    imagesBlocs.drawLine(80, 7, 95, 7, 1)
    imagesBlocs.drawLine(80, 15, 95, 15, 1)
    imagesBlocs.drawLine(84, 0, 84, 6, 1)
    imagesBlocs.drawLine(92, 8, 92, 14, 1)
    imagesBlocs.drawLine(88, 3, 92, 3, 2)
    imagesBlocs.drawLine(82, 11, 85, 11, 2)
    // Feuilles : deux petits groupes de feuilles sur de grandes surfaces vertes et calmes.
    imagesBlocs.drawLine(99, 4, 102, 4, 2)
    imagesBlocs.drawLine(100, 5, 101, 5, 2)
    imagesBlocs.drawLine(106, 11, 109, 11, 1)
    imagesBlocs.setPixel(107, 10, 1)
}

function couleurImpact(directionX: number, directionY: number, directionZ: number): number {
    let pointX = persoX + ((directionX * distanceImpact) >> 12)
    let pointY = persoY + HAUTEUR_YEUX + ((directionY * distanceImpact) >> 12)
    let pointZ = persoZ + ((directionZ * distanceImpact) >> 12)
    let faceX = (faceImpactX != 0 ? pointZ : pointX) & 255
    // Les motifs verticaux vont de haut en bas ; les faces opposées sont inversées en miroir pour que rien ne
    // paraisse à l'envers.
    let faceY = faceImpactY != 0 ? pointZ & 255 : 255 - (pointY & 255)
    if (faceImpactY == 0 && (faceImpactX > 0 || faceImpactZ > 0)) faceX = 255 - faceX
    let sorte = blocImpact
    let sombre = faceImpactY < 0 || faceImpactX != 0 || faceImpactZ > 0
    let motif = sorte == Bloc.Herbe ? (faceImpactY > 0 ? 0 : 1)
        : sorte == Bloc.Terre ? 1
        : sorte == Bloc.Pierre || sorte == Bloc.RocheMere ? 2
        : sorte == Bloc.Bois ? (faceImpactY != 0 ? 4 : 3)
        : sorte == Bloc.Planches ? 5
        : 6
    // Les petits détails disparaissent au loin, au lieu de scintiller en pixels de toutes les couleurs.
    let limiteDetail = motif < 2 ? 3 * 1024 : 6 * 1024
    let motifX = faceX >> 4
    let motifY = faceY >> 4
    if (motif < 3 || motif == 6) {
        // Le même petit masque est décalé autrement pour chaque bloc (selon sa place dans le monde), pour qu'aucune
        // grille de taches ne se voie.
        motifX = (motifX + impactX * 5 + impactZ * 3) & 15
        motifY = (motifY + impactX * 7 + impactZ * 11 + impactY * 3) & 15
    }
    let teinte = distanceImpact < limiteDetail ? imagesBlocs.getPixel(motif * 16 + motifX, motifY) : 0
    if (distanceImpact > 4 * 1024 && teinte == 2 && sorte == Bloc.Pierre) teinte = 0
    let couleur = couleursBase[sorte]
    if (sorte == Bloc.Herbe && faceImpactY > 0) {
        couleur = teinte == 1 ? 6 : 7
    } else if (sorte == Bloc.Herbe || sorte == Bloc.Terre) {
        couleur = sombre ? 12 : 14
        if (teinte == 1 && !sombre) couleur = 12
        // L'herbe suit le bord supérieur du bloc ; la terre dessous reste brune.
        if (sorte == Bloc.Herbe && faceImpactY == 0 &&
            faceY < 35 + ((faceX >> 6) & 1) * 8) couleur = sombre ? 6 : 7
    } else if (sorte == Bloc.Pierre) {
        couleur = faceImpactY > 0 ? 13 : sombre ? 12 : 11
        if (teinte == 1 && !sombre) couleur = faceImpactY > 0 ? 11 : 12
        else if (teinte == 2 && !sombre && faceImpactY <= 0) couleur = 13
    } else if (sorte == Bloc.Bois) {
        couleur = sombre ? 12 : 14
        if (faceImpactY > 0) couleur = teinte == 1 ? 14 : teinte == 2 ? 13 : 4
        else if (!sombre && teinte == 1) couleur = 12
        else if (!sombre && teinte == 2) couleur = 4
    } else if (sorte == Bloc.Planches) {
        couleur = sombre ? 14 : 13
        if (teinte == 1) couleur = sombre ? 12 : 14
        else if (teinte == 2 && !sombre) couleur = 4
    } else if (sorte == Bloc.Feuilles) {
        couleur = faceImpactY > 0 || !sombre ? 7 : 6
        if (teinte == 1) couleur = 6
        else if (teinte == 2 && !sombre) couleur = 7
    } else if (sorte == Bloc.Cristal) {
        // De grandes facettes (surfaces) d'un seul tenant au lieu d'un scintillement au hasard.
        couleur = sombre ? 8 : 9
        if (!sombre && faceX < 112 && faceY < 144 && faceX + faceY < 176) couleur = 1
        else if (faceX > 160 && faceY > 96) couleur = 8
    } else if (sorte == Bloc.RocheMere) {
        couleur = teinte == 1 || faceImpactY < 0 ? 15 : 12
    }
    // Une ombre de contact n'apparaît que près des blocs vraiment plus hauts. Une surface d'herbe plate n'a donc pas de
    // quadrillage sombre. Il n'y a pas de rayons de lumière ou d'ombre en plus.
    if (faceImpactY > 0 && distanceImpact < 5 * 1024) {
        let voisinPlusHaut = false
        if (faceX < 20)
            voisinPlusHaut = blocEn(impactX - 1, impactY + 1, impactZ) != Bloc.Air
        else if (faceX > 235)
            voisinPlusHaut = blocEn(impactX + 1, impactY + 1, impactZ) != Bloc.Air
        if (!voisinPlusHaut && faceY < 20)
            voisinPlusHaut = blocEn(impactX, impactY + 1, impactZ - 1) != Bloc.Air
        else if (!voisinPlusHaut && faceY > 235)
            voisinPlusHaut = blocEn(impactX, impactY + 1, impactZ + 1) != Bloc.Air
        if (voisinPlusHaut) couleur = sorte == Bloc.Herbe || sorte == Bloc.Feuilles ? 6
            : sorte == Bloc.Pierre ? 11
            : couleursSombres[sorte]
    }
    // Au loin, la pierre perd du contraste. Les feuilles restent vertes ; le bois ne change presque pas : seule sa
    // couleur orange passe au beige clair. Les arbres entiers ne doivent pas ressembler à des piliers de pierre grise.
    if (distanceImpact > 6 * 1024) {
        if (sorte == Bloc.Pierre || sorte == Bloc.RocheMere) couleur = couleursBrume[couleur]
        else if (sorte == Bloc.Bois && couleur == 4) couleur = 13
    }
    // Le contour de la cible est dessiné par-dessus les motifs et les ombres ; il n'y a pas de bordure permanente
    // autour de tous les blocs.
    if (aCible && impactX == cibleX && impactY == cibleY && impactZ == cibleZ &&
        (faceX < 16 || faceX > 239 || faceY < 16 || faceY > 239)) couleur = 5
    return couleur
}

function preparerRayons() {
    if (rayonRotation == rotation && rayonInclinaison == inclinaison && rayonLargeur == largeurRayon) return
    rayonRotation = rotation
    rayonInclinaison = inclinaison
    rayonLargeur = largeurRayon
    // Au plus 316 nombres pour une largeur de rayon de 2 (80 colonnes fois 2, plus 52 lignes fois 3) ; aucune nouvelle
    // liste n'est créée par image ni par rayon.
    for (let colonne = 0, x = 0; x < 160; colonne++, x += largeurRayon) {
        let decalageX = Math.idiv((x + largeurRayon / 2 - 80) * 1024, 110)
        colonneX[colonne] = (droiteX * decalageX) >> 10
        colonneZ[colonne] = (droiteZ * decalageX) >> 10
    }
    for (let ligne = 0, y = 8; y < 112; ligne++, y += largeurRayon) {
        let decalageY = Math.idiv((60 - y - largeurRayon / 2) * 1024, 110)
        ligneX[ligne] = regardX + ((hautX * decalageY) >> 10)
        ligneY[ligne] = regardY + ((hautY * decalageY) >> 10)
        ligneZ[ligne] = regardZ + ((hautZ * decalageY) >> 10)
    }
}

// Le soleil et les nuages sont fixés dans le monde : leur position suit la perspective, et pour les nuages leur taille
// aussi. Le soleil reste toujours de la même taille.
function dessinerObjetCiel(toile: Image, x: number, y: number, z: number, estSoleil: boolean) {
    let profondeur = (x * regardX + y * regardY + z * regardZ) >> 10
    if (profondeur < 160) return
    let ecranX = 80 + Math.idiv(((x * droiteX + z * droiteZ) >> 10) * 110, profondeur)
    let ecranY = 60 - Math.idiv(((x * hautX + y * hautY + z * hautZ) >> 10) * 110, profondeur)
    if (ecranX < -40 || ecranX > 200 || ecranY < -20 || ecranY > 135) return
    if (estSoleil) {
        toile.fillRect(ecranX - 7, ecranY - 5, 14, 10, 1)
        toile.fillRect(ecranX - 5, ecranY - 7, 10, 14, 1)
        toile.fillRect(ecranX - 5, ecranY - 5, 10, 10, 5)
        toile.fillRect(ecranX - 3, ecranY - 4, 5, 2, 1)
    } else {
        let demiLargeur = Math.max(6, Math.min(30, Math.idiv(20000, profondeur)))
        let hauteurPalier = Math.max(2, demiLargeur >> 2)
        toile.fillRect(ecranX - demiLargeur, ecranY, demiLargeur * 2, hauteurPalier, 13)
        toile.fillRect(ecranX - demiLargeur + 2, ecranY - hauteurPalier, demiLargeur * 2 - 4, hauteurPalier + 1, 1)
        toile.fillRect(ecranX - (demiLargeur >> 1), ecranY - hauteurPalier * 2, demiLargeur, hauteurPalier + 1, 1)
    }
}

function dessinerMonde(toile: Image) {
    calculerVecteursRegard()
    preparerRayons()
    preparerImagesBlocs()
    toile.fill(9)
    // Quelques larges bandes de ciel au lieu d'un trait d'horizon dur. ligneY est la part vers le haut de la direction
    // des rayons de cette ligne : l'horizon monte ou descend avec le regard.
    for (let ligne = 0, y = 8; y < 112; ligne++, y += largeurRayon) {
        let pente = ligneY[ligne]
        if (pente < -95) toile.fillRect(0, y, 160, largeurRayon, 6)
        else if (pente < -35) toile.fillRect(0, y, 160, largeurRayon, 11)
        else if (pente < 0) toile.fillRect(0, y, 160, largeurRayon, 13)
        else if (pente < 25) toile.fillRect(0, y, 160, largeurRayon, 1)
    }
    dessinerObjetCiel(toile, 530, 570, 1024, true)
    dessinerObjetCiel(toile, -650, 420, 1600, false)
    dessinerObjetCiel(toile, 1100, 350, 1700, false)
    dessinerObjetCiel(toile, 1600, 470, -1050, false)
    dessinerObjetCiel(toile, -900, 560, -1800, false)
    let oeilY = persoY + HAUTEUR_YEUX
    // 40 x 26 rayons pour une largeur de rayon de 4 (20 x 13 pour 8, rapide ; 80 x 52 pour 2, fin). Le ciel n'a pas
    // besoin d'un autre appel de dessin, car il est déjà dessiné d'avance.
    for (let ligne = 0, y = 8; y < 112; ligne++, y += largeurRayon) {
        let directionLigneX = ligneX[ligne]
        let directionLigneY = ligneY[ligne]
        let directionLigneZ = ligneZ[ligne]
        for (let colonne = 0, x = 0; x < 160; colonne++, x += largeurRayon) {
            let directionX = directionLigneX + colonneX[colonne]
            let directionZ = directionLigneZ + colonneZ[colonne]
            if (suivreRayon(persoX, oeilY, persoZ, directionX, directionLigneY, directionZ, 8 * 1024)) {
                toile.fillRect(x, y, largeurRayon, largeurRayon, couleurImpact(directionX, directionLigneY, directionZ))
            }
        }
    }
}
