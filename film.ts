// L'intro avec la carte du studio et le titre.
// Un voyage continu de 22 secondes (FILM_DUREE_MS = 22000) à travers un petit décor en 3D, construit seulement pour le
// film. Il ne change pas le monde, n'utilise ni vidéo ni sprites, et ne crée aucune nouvelle image à chaque image
// affichée. Tous les calculs utilisent des nombres entiers : les positions dans le monde, le sinus et le cosinus
// en 1024es, les points de l'écran en 16es de pixel. Le Calliope range chaque nombre à virgule comme un petit objet
// dans sa mémoire. Avec des milliers par image, il devait ranger sans arrêt, et l'intro saccadait. Déroulement : vol
// entre les îles, la porte se charge, vol à travers la porte (cette première station s'appelle le vol), puis la carte
// « Calliope Hacker présente » au-dessus de l'île d'arrivée et enfin le titre du jeu.
let filmFini = false
let filmMs = 0
let filmChapitre = 0
const FILM_DUREE_MS = 22000
const FILM_CHARGE_MS = 4800
const FILM_PASSAGE_MS = 7200
const FILM_SOIR_MS = 9700
const FILM_CARTE_MS = 11200
const FILM_TITRE_MS = 15200
const FILM_FONDU_MS = 20500
// Un appui sur A saute à la station suivante (vol, carte, titre, fin), au plus tôt 500 ms après le début du film ou
// après le dernier saut. Ainsi, marteler A ne saute jamais plusieurs stations d'un coup, et un A maintenu ne compte pas
// comme un nouvel appui.
const FILM_PAUSE_SAUT_MS = 500
let filmSautDepuisMs = 0
let filmImageCalliope: Image = null
let filmImageHacker: Image = null
let filmImagePresente: Image = null
let filmImageTitre: Image = null
let filmAnneauX: number[] = []
let filmAnneauY: number[] = []
let filmBoiteX: number[] = []
let filmBoiteY: number[] = []
let filmBoiteZ: number[] = []
let filmBoiteLargeur: number[] = []
let filmBoiteHauteur: number[] = []
let filmBoiteProfondeur: number[] = []
let filmBoiteSorte: number[] = []
let filmBoitesOrdre: number[] = []
let filmBoitesDistance: number[] = []
let filmCoinX: number[] = []
let filmCoinY: number[] = []
let filmCoinZ: number[] = []
let filmFaces = [0, 2, 3, 1, 4, 5, 7, 6, 0, 1, 5, 4, 2, 6, 7, 3, 0, 4, 6, 2, 1, 3, 7, 5]
let filmFacesOrdre = [0, 0, 0]
let filmFacesDistance = [0, 0, 0]
let filmCameraX = 0
let filmCameraY = 3072
let filmCameraZ = 0
let filmSinRotation = 0
let filmCosRotation = 1024
let filmSinInclinaison = 0
let filmCosInclinaison = 1024
let filmSinRoulis = 0
let filmCosRoulis = 1024
let filmFocale = 1472
let filmEcranX = 0
let filmEcranY = 0
let filmProfondeur = 0
let filmSoir = false

function filmAjouterBoite(x: number, y: number, z: number,
    largeur: number, hauteur: number, profondeur: number, sorte: number) {
    filmBoiteX.push(Math.round(x * 1024))
    filmBoiteY.push(Math.round(y * 1024))
    filmBoiteZ.push(Math.round(z * 1024))
    filmBoiteLargeur.push(Math.round(largeur * 512))
    filmBoiteHauteur.push(Math.round(hauteur * 512))
    filmBoiteProfondeur.push(Math.round(profondeur * 512))
    filmBoiteSorte.push(sorte)
    filmBoitesOrdre.push(0)
    filmBoitesDistance.push(0)
}

function filmConstruireIle(x: number, y: number, z: number, taille: number, avecArbre: boolean) {
    let epaisseur = taille > 10 ? 1.65 : 1
    filmAjouterBoite(x, y - 0.65 * epaisseur, z, taille, 1.3 * epaisseur, taille * 0.85, 0)
    filmAjouterBoite(x + 0.3, y - 2 * epaisseur, z, taille * 0.8, 1.6 * epaisseur, taille * 0.65, 1)
    filmAjouterBoite(x - 0.2, y - 3.1 * epaisseur, z, taille * 0.38, 0.9 * epaisseur, taille * 0.35, 1)
    if (avecArbre) {
        filmAjouterBoite(x - taille * 0.14, y + 1, z + 0.2, 0.45, 2.2, 0.45, 2)
        filmAjouterBoite(x - taille * 0.14, y + 2.25, z + 0.2, 2.2, 1.35, 1.8, 3)
        filmAjouterBoite(x - taille * 0.14 + 0.3, y + 3.1, z + 0.2, 1.45, 0.65, 1.35, 3)
    } else filmAjouterBoite(x + 0.2, y + 0.45, z, 0.65, 0.9, 0.65, 5)
}

function filmPreparer() {
    filmFini = false
    filmMs = 0
    filmChapitre = 0
    filmSautDepuisMs = 0
    if (filmImageCalliope) return
    filmImageCalliope = image.create(47, 8)
    filmImageCalliope.print("CALLIOPE", 0, 0, 1, image.font8)
    filmImageHacker = image.create(35, 8)
    filmImageHacker.print("HACKER", 0, 0, 1, image.font8)
    dessinerPresente()
    filmImageTitre = image.create(TITRE.length * 6, 8)
    filmImageTitre.print(TITRE, 0, 0, 1, image.font8)
    for (let i = 0; i <= 24; i++) {
        filmAnneauX.push(Math.round(Math.cos(i * Math.PI / 12) * 1024))
        filmAnneauY.push(Math.round(Math.sin(i * Math.PI / 12) * 1024))
    }
    for (let i = 0; i < 8; i++) {
        filmCoinX.push(0)
        filmCoinY.push(0)
        filmCoinZ.push(0)
    }
    // Le couloir libre mène vraiment jusqu'à la porte : les îles sont placées tour à tour de chaque côté.
    for (let i = 0; i < 15; i++) {
        let cote = i % 2 == 0 ? -1 : 1
        let x = cote * (4.4 + (i * 7 % 4))
        let z = 10 + i * 8.5
        filmConstruireIle(x, -0.4 + (i % 3) * 0.5, z, 3.2 + (i % 3) * 0.45, i % 3 != 1)
        if (i % 3 == 0) filmAjouterBoite(-x * 1.8, 2.2, z + 3, 1.2, 1.2, 1.2, 5)
    }
    // Une porte géante, fixée dans le même monde en 3D.
    filmAjouterBoite(0, -3, 53, 11, 1.1, 5, 1)
    filmAjouterBoite(-4.1, 1.1, 53, 1.1, 8.2, 1.3, 4)
    filmAjouterBoite(4.1, 1.1, 53, 1.1, 8.2, 1.3, 4)
    filmAjouterBoite(0, 5.45, 53, 9.4, 0.9, 1.5, 4)
    filmAjouterBoite(-4.1, -2.25, 53, 1.7, 1.1, 1.9, 6)
    filmAjouterBoite(4.1, -2.25, 53, 1.7, 1.1, 1.9, 6)
    filmAjouterBoite(-4.1, 5.4, 53, 1.6, 1.4, 1.8, 6)
    filmAjouterBoite(4.1, 5.4, 53, 1.6, 1.4, 1.8, 6)
    // But du voyage : une grande île avec des terrasses, un arbre et des cristaux.
    filmConstruireIle(0, 0, 134, 15, false)
    filmAjouterBoite(-2.2, 0.35, 134, 4.3, 0.7, 4, 0)
    filmAjouterBoite(-2.4, 1.8, 134.5, 0.8, 2.9, 0.8, 2)
    filmAjouterBoite(-2.7, 3.5, 134.5, 4.2, 1.9, 3.4, 3)
    filmAjouterBoite(-2.2, 4.7, 134.4, 2.8, 0.9, 2.6, 3)
    filmAjouterBoite(2.5, 0.7, 133.2, 1.2, 1.4, 1.2, 5)
    filmAjouterBoite(3.9, 0.3, 134, 0.7, 0.6, 0.7, 5)
}

// Chapitres du son : 0 vol entre les îles, 1 charge de la porte, 2 passage de la porte (à partir de FILM_PASSAGE_MS), 3
// carte, 4 titre, 5 fondu au noir.
function filmChapitreAuMoment(tempsMs: number): number {
    return tempsMs < FILM_CHARGE_MS ? 0
        : tempsMs < FILM_PASSAGE_MS ? 1
        : tempsMs < FILM_CARTE_MS ? 2
        : tempsMs < FILM_TITRE_MS ? 3
        : tempsMs < FILM_FONDU_MS ? 4
        : 5
}

function filmActualiser(dureeMs: number) {
    if (filmFini) return
    filmMs = Math.min(FILM_DUREE_MS, filmMs + Math.max(0, dureeMs))
    filmChapitre = filmChapitreAuMoment(filmMs)
    filmFini = filmMs >= FILM_DUREE_MS
}

function filmSauter() {
    filmMs = FILM_DUREE_MS
    filmChapitre = 5
    filmFini = true
}

// Un nouvel appui sur A : sauter à la station suivante. Le résultat est false si l'appui est venu trop tôt ou si le
// film est déjà fini.
function allerAStationSuivante(): boolean {
    if (filmFini || filmMs - filmSautDepuisMs < FILM_PAUSE_SAUT_MS) return false
    if (filmMs >= FILM_TITRE_MS) filmSauter()
    else {
        filmMs = filmMs >= FILM_CARTE_MS ? FILM_TITRE_MS : FILM_CARTE_MS
        filmChapitre = filmChapitreAuMoment(filmMs)
    }
    filmSautDepuisMs = filmMs
    return true
}

function filmAdoucir(valeur: number): number {
    valeur = Math.max(0, Math.min(1, valeur))
    return valeur * valeur * (3 - 2 * valeur)
}

function filmPlacerCamera(x: number, y: number, z: number, rotation: number, inclinaison: number, roulis: number) {
    filmCameraX = Math.round(x * 1024)
    filmCameraY = Math.round(y * 1024)
    filmCameraZ = Math.round(z * 1024)
    filmSinRotation = Math.round(Math.sin(rotation) * 1024)
    filmCosRotation = Math.round(Math.cos(rotation) * 1024)
    filmSinInclinaison = Math.round(Math.sin(inclinaison) * 1024)
    filmCosInclinaison = Math.round(Math.cos(inclinaison) * 1024)
    filmSinRoulis = Math.round(Math.sin(roulis) * 1024)
    filmCosRoulis = Math.round(Math.cos(roulis) * 1024)
}

function filmProjeter(x: number, y: number, z: number) {
    let dx = x - filmCameraX
    let dy = y - filmCameraY
    let dz = z - filmCameraZ
    let tourneX = (dx * filmCosRotation - dz * filmSinRotation) >> 10
    let tourneZ = (dz * filmCosRotation + dx * filmSinRotation) >> 10
    let tourneY = (dy * filmCosInclinaison - tourneZ * filmSinInclinaison) >> 10
    filmProfondeur = (tourneZ * filmCosInclinaison + dy * filmSinInclinaison) >> 10
    let echelle = Math.max(512, filmProfondeur)
    let platX = Math.idiv(tourneX * filmFocale, echelle)
    let platY = -Math.idiv(tourneY * filmFocale, echelle)
    filmEcranX = 1280 + ((platX * filmCosRoulis - platY * filmSinRoulis) >> 10)
    filmEcranY = 912 + ((platY * filmCosRoulis + platX * filmSinRoulis) >> 10)
}

// MakeCode remplit lui-même les triangles (fillTriangle), vite et avec des entiers ; ce qui dépasse du bord de l'image
// est coupé tout seul. Ici, on arrondit seulement les coordonnées des coins à des nombres entiers. Les bandes noires du
// cinéma, en haut et en bas, sont redessinées par-dessus à la fin par dessinerFilm.
function filmRemplirTriangle(toile: Image, aX: number, aY: number, bX: number, bY: number,
    cX: number, cY: number, couleur: number) {
    toile.fillTriangle(Math.round(aX), Math.round(aY), Math.round(bX), Math.round(bY),
        Math.round(cX), Math.round(cY), couleur)
}

function filmDessinerFace(toile: Image, face: number, couleur: number, couleurBord: number) {
    let premierCoin = face * 4
    let coinA = filmFaces[premierCoin]
    let coinB = filmFaces[premierCoin + 1]
    let coinC = filmFaces[premierCoin + 2]
    let coinD = filmFaces[premierCoin + 3]
    toile.fillTriangle(
        filmCoinX[coinA], filmCoinY[coinA],
        filmCoinX[coinB], filmCoinY[coinB],
        filmCoinX[coinC], filmCoinY[coinC], couleur)
    toile.fillTriangle(
        filmCoinX[coinA], filmCoinY[coinA],
        filmCoinX[coinC], filmCoinY[coinC],
        filmCoinX[coinD], filmCoinY[coinD], couleur)
    // Les arêtes près de la caméra peuvent tomber très loin hors de l'image ; on ne trace que les lignes dont les deux
    // bouts ne sont pas trop loin dehors.
    if (filmCoinX[coinA] > -100 && filmCoinX[coinA] < 260 &&
        filmCoinY[coinA] > -100 && filmCoinY[coinA] < 220 &&
        filmCoinX[coinB] > -100 && filmCoinX[coinB] < 260 &&
        filmCoinY[coinB] > -100 && filmCoinY[coinB] < 220) {
        toile.drawLine(filmCoinX[coinA], filmCoinY[coinA],
            filmCoinX[coinB], filmCoinY[coinB], couleurBord)
    }
    if (filmCoinX[coinB] > -100 && filmCoinX[coinB] < 260 &&
        filmCoinY[coinB] > -100 && filmCoinY[coinB] < 220 &&
        filmCoinX[coinC] > -100 && filmCoinX[coinC] < 260 &&
        filmCoinY[coinC] > -100 && filmCoinY[coinC] < 220) {
        toile.drawLine(filmCoinX[coinB], filmCoinY[coinB],
            filmCoinX[coinC], filmCoinY[coinC], couleurBord)
    }
}

function filmDessinerBoite(toile: Image, boite: number) {
    let x = filmBoiteX[boite]
    let y = filmBoiteY[boite]
    let z = filmBoiteZ[boite]
    let sorte = filmBoiteSorte[boite]
    let demiLargeur = filmBoiteLargeur[boite]
    let demiHauteur = filmBoiteHauteur[boite]
    let demiProfondeur = filmBoiteProfondeur[boite]
    let xMin = 10000
    let xMax = -10000
    let yMin = 10000
    let yMax = -10000
    for (let i = 0; i < 8; i++) {
        let retrecissement = sorte == 1 && (i & 2) == 0 ? 594 : 1024
        filmProjeter(x + ((((i & 1) == 0 ? -demiLargeur : demiLargeur) * retrecissement) >> 10),
            y + ((i & 2) == 0 ? -demiHauteur : demiHauteur),
            z + ((((i & 4) == 0 ? -demiProfondeur : demiProfondeur) * retrecissement) >> 10))
        // Si un coin est trop près devant la caméra (profondeur sous 1,25) ou derrière elle, la boîte n'est pas
        // dessinée du tout. Toutes les grandes pièces du décor sont sur le côté de la trajectoire : on ne le remarque
        // pas, et aucune face déformée n'apparaît.
        if (filmProfondeur < 1280) return
        filmCoinX[i] = (filmEcranX + 8) >> 4
        filmCoinY[i] = (filmEcranY + 8) >> 4
        filmCoinZ[i] = filmProfondeur
        xMin = Math.min(xMin, filmCoinX[i])
        xMax = Math.max(xMax, filmCoinX[i])
        yMin = Math.min(yMin, filmCoinY[i])
        yMax = Math.max(yMax, filmCoinY[i])
    }
    if (xMax < 0 || xMin > 159 || yMax < 6 || yMin > 111) return
    // De chaque boîte, on ne dessine que les trois faces tournées vers la caméra.
    filmFacesOrdre[0] = filmCameraZ < z ? 0 : 1
    filmFacesOrdre[1] = filmCameraY < y ? 2 : 3
    filmFacesOrdre[2] = filmCameraX < x ? 4 : 5
    for (let i = 0; i < 3; i++) {
        let j = filmFacesOrdre[i] * 4
        filmFacesDistance[i] = filmCoinZ[filmFaces[j]] +
            filmCoinZ[filmFaces[j + 1]] +
            filmCoinZ[filmFaces[j + 2]] +
            filmCoinZ[filmFaces[j + 3]]
    }
    for (let i = 0; i < 2; i++) {
        for (let j = i + 1; j < 3; j++) {
            if (filmFacesDistance[j] > filmFacesDistance[i]) {
                let echange = filmFacesOrdre[i]
                filmFacesOrdre[i] = filmFacesOrdre[j]
                filmFacesOrdre[j] = echange
                let distance = filmFacesDistance[i]
                filmFacesDistance[i] = filmFacesDistance[j]
                filmFacesDistance[j] = distance
            }
        }
    }
    for (let i = 0; i < 3; i++) {
        let face = filmFacesOrdre[i]
        let estDessus = face == 3
        let estCote = face >= 4
        let couleur = 12
        let couleurBord = 12
        if (sorte == 0) {
            couleur = estDessus ? 7 : estCote ? 12 : 14
            couleurBord = estDessus ? 6 : 12
        } else if (sorte == 1) {
            couleur = estDessus ? 11 : estCote ? 8 : 12
            couleurBord = estDessus ? 13 : 12
        } else if (sorte == 2) {
            couleur = estDessus ? 13 : estCote ? 12 : 14
            couleurBord = 14
        } else if (sorte == 3) {
            couleur = estDessus ? 7 : estCote ? 6 : 7
            couleurBord = estDessus ? 9 : 6
        } else if (sorte == 4) {
            couleur = estDessus ? 11 : estCote ? 15 : 8
            couleurBord = 11
        } else if (sorte == 5) {
            couleur = estDessus ? 1 : estCote ? 8 : 9
            couleurBord = 9
        } else {
            couleur = estDessus ? 5 : estCote ? 4 : 13
            couleurBord = 5
        }
        // La profondeur reste visible : les îles et les arbres lointains (boîtes de sorte inférieure à 4) prennent, à
        // plus de 48 unités, toutes les couleurs de la brume.
        if (z - filmCameraZ > 49152 && sorte < 4) {
            couleur = estDessus ? (sorte == 0 || sorte == 3 ? 6 : 11) : 12
            couleurBord = couleur
        }
        filmDessinerFace(toile, face, couleur, couleurBord)
    }
}

function filmDessinerDecor(toile: Image) {
    let nombre = 0
    for (let i = 0; i < filmBoiteX.length; i++) {
        let avance = ((filmBoiteZ[i] - filmCameraZ) * filmCosRotation +
            (filmBoiteX[i] - filmCameraX) * filmSinRotation) >> 10
        let distance = (avance * filmCosInclinaison + (filmBoiteY[i] - filmCameraY) * filmSinInclinaison) >> 10
        if (distance < 1024 || distance > 86016) continue
        // Les boîtes sont triées selon leur distance, les plus lointaines d'abord. Cela se fait dans des listes déjà
        // existantes : aucun nouvel objet n'est créé.
        let j = nombre - 1
        while (j >= 0 && filmBoitesDistance[j] < distance) {
            filmBoitesDistance[j + 1] = filmBoitesDistance[j]
            filmBoitesOrdre[j + 1] = filmBoitesOrdre[j]
            j--
        }
        filmBoitesDistance[j + 1] = distance
        filmBoitesOrdre[j + 1] = i
        nombre++
    }
    for (let i = 0; i < nombre; i++) filmDessinerBoite(toile, filmBoitesOrdre[i])
}

// Le centre et les rayons arrivent en 16es de pixel. On arrondit au pixel entier seulement pour dessiner : + 8, puis
// >> 4 (divisé par 16).
function filmRemplirEllipse(toile: Image, x: number, y: number, rayonX: number, rayonY: number, couleur: number) {
    if (rayonX <= 0 || rayonY <= 0) return
    let precedentX = x + rayonX
    let precedentY = y
    for (let i = 1; i <= 24; i++) {
        let pointX = x + ((filmAnneauX[i] * rayonX) >> 10)
        let pointY = y + ((filmAnneauY[i] * rayonY) >> 10)
        toile.fillTriangle((x + 8) >> 4, (y + 8) >> 4, (precedentX + 8) >> 4, (precedentY + 8) >> 4,
            (pointX + 8) >> 4, (pointY + 8) >> 4, couleur)
        precedentX = pointX
        precedentY = pointY
    }
}

function filmDessinerCiel(toile: Image, soir: boolean, forceVol: number) {
    toile.fill(15)
    let horizon = Math.max(33, Math.min(85, 57 + ((filmSinInclinaison * 92) >> 10)))
    toile.fillRect(0, horizon - 15, 160, 127 - horizon, 8)
    toile.fillRect(0, horizon + 9, 160, 111 - horizon, 12)
    toile.fillRect(0, horizon + 35, 160, 112 - (horizon + 35), 15)
    if (soir) {
        toile.fillRect(0, horizon - 6, 160, 29, 12)
        toile.fillRect(0, horizon + 14, 160, 21, 11)
        // Un grand soleil à contre-jour, avec des bandes de lumière en paliers.
        let soleilX = 2032 - (filmCameraX >> 5)
        filmRemplirEllipse(toile, soleilX, 832, 352, 352, 4)
        filmRemplirEllipse(toile, soleilX, 800, 272, 272, 5)
        soleilX = (soleilX + 8) >> 4
        toile.fillRect(soleilX - 28, 59, 57, 2, 12)
        toile.fillRect(soleilX - 24, 64, 49, 2, 12)
        toile.fillTriangle(soleilX - 6, 62, 5, 111, 27, 111, 8)
        toile.fillTriangle(soleilX - 2, 62, 47, 111, 57, 111, 12)
        toile.fillTriangle(soleilX + 6, 62, 137, 111, 159, 111, 8)
    } else {
        // Des bandes de ciel étroites suivent la caméra quand elle tourne.
        for (let i = 0; i < 5; i++) {
            let x = 14 + i * 29 - ((filmSinRotation * 70) >> 10)
            toile.drawLine(x, 24 + i * 3, x + 29, 20 + i * 3, 8)
        }
    }
    // Les étoiles comptent en 16es de pixel. decalage (le chemin déjà parcouru par les étoiles) et trainee (la longueur
    // des traits de lumière pendant le vol à travers la porte) sont calculés une seule fois par image.
    let decalage = Math.round((filmMs * (0.006 + forceVol * 0.12)) % 128 * 16)
    let trainee = Math.round(forceVol * 307)
    for (let i = 0; i < 28; i++) {
        let distance = 480 + ((i * 592 + 2048 - decalage) % 2048)
        let x = 1280 + Math.idiv(((i * 97 + 19) % 159 - 79) * 23296, distance) - ((filmSinRotation * 960) >> 10)
        let y = 720 + Math.idiv(((i * 61 + 7) % 89 - 49) * 19200, distance)
        if (x < 0 || x > 2544 || y < 128 || y > (soir ? 480 : 1600)) continue
        if (trainee > 0) toile.drawLine(x >> 4, y >> 4,
            (x - (((x - 1280) * trainee) >> 10)) >> 4,
            (y - (((y - 880) * trainee) >> 10)) >> 4, 8)
        toile.setPixel(x >> 4, y >> 4, i % 5 == 0 ? 5 : distance < 992 ? 1 : 9)
    }
    // Des nuages horizontaux bougent avec le vol en 3D, au lieu de rester comme une image de fond immobile.
    for (let i = 0; i < 4; i++) {
        let z = 18432 + ((i * 25600 + 153600 - filmCameraZ) % 102400)
        let x = 1280 + Math.idiv(((i % 2 == 0 ? -13312 : 12288) - filmCameraX) * 1472, z)
        let y = 784 + Math.idiv((3 + i % 2) * 1507328, z)
        let largeur = Math.min(880, Math.idiv(11468800, z))
        toile.fillRect((x - (largeur >> 1)) >> 4, y >> 4, largeur >> 4, 1, soir ? 13 : 11)
    }
}

function filmDessinerPorte(toile: Image, charge: number) {
    if (filmCameraZ > 51200) return
    filmProjeter(0, 1178, 53760)
    if (filmProfondeur < 2048) return
    // Le centre et les rayons de la porte d'abord en 16es de pixel ; la rotation et la taille des anneaux en 1024es.
    let centreX = filmEcranX
    let centreY = filmEcranY
    let echelle = filmFocale * 64 / filmProfondeur
    let demiLargeur = Math.idiv(3328 * filmFocale, filmProfondeur)
    let demiHauteur = Math.idiv(3891 * filmFocale, filmProfondeur)
    filmRemplirEllipse(toile, centreX, centreY, demiLargeur + 32, demiHauteur + 32, charge > 0.55 ? 9 : 8)
    filmRemplirEllipse(toile, centreX, centreY, demiLargeur, demiHauteur, 15)
    let phase = filmMs * 0.0017
    let cosinus = Math.round(Math.cos(phase) * 1024)
    let sinus = Math.round(Math.sin(phase) * 1024)
    for (let anneau = 0; anneau < 3; anneau++) {
        let rayon = (Math.idiv(filmMs * 16384, 100000) + Math.idiv(anneau * 1024, 3)) & 1023
        let precedentX = centreX + ((((cosinus * demiLargeur) >> 10) * rayon) >> 10)
        let precedentY = centreY + ((((sinus * demiHauteur) >> 10) * rayon) >> 10)
        for (let i = 1; i <= 24; i++) {
            let anneauX = (filmAnneauX[i] * cosinus - filmAnneauY[i] * sinus) >> 10
            let anneauY = (filmAnneauY[i] * cosinus + filmAnneauX[i] * sinus) >> 10
            let x = centreX + ((((anneauX * demiLargeur) >> 10) * rayon) >> 10)
            let y = centreY + ((((anneauY * demiHauteur) >> 10) * rayon) >> 10)
            toile.drawLine(precedentX >> 4, precedentY >> 4, x >> 4, y >> 4, anneau == 1 && charge > 0.5 ? 9 : 8)
            precedentX = x
            precedentY = y
        }
    }
    // À partir d'ici, il reste peu de calculs par image : de nouveau en pixels entiers.
    centreX = centreX / 16
    centreY = centreY / 16
    demiLargeur = demiLargeur / 16
    demiHauteur = demiHauteur / 16
    if (charge > 0.02) {
        let largeurLumiere = Math.max(1, charge * 4)
        toile.fillRect(centreX - largeurLumiere - 2, 6, largeurLumiere * 2 + 5, centreY + demiHauteur - 6, 8)
        toile.fillRect(centreX - largeurLumiere, 6, largeurLumiere * 2 + 1, centreY + demiHauteur - 6, 9)
        toile.fillRect(centreX - largeurLumiere * 0.3, 6,
            Math.max(1, largeurLumiere * 0.6), centreY + demiHauteur - 6, 1)
        // Deux éclairs suivent une trajectoire fixe et ne clignotent pas au hasard.
        for (let cote = -1; cote <= 1; cote += 2) {
            let coude = Math.sin(filmMs * 0.006 + cote) * 3
            toile.drawLine(centreX, centreY - demiHauteur,
                centreX + cote * (demiLargeur * 0.45 + coude), centreY - demiHauteur * 0.42, 9)
            toile.drawLine(centreX + cote * (demiLargeur * 0.45 + coude), centreY - demiHauteur * 0.42,
                centreX + cote * demiLargeur * 0.18, centreY - demiHauteur * 0.12, 1)
        }
    }
    // Un cristal flottant avec des faces. La largeur et le côté éclairé tournent ensemble.
    let angleRotation = filmMs * 0.0012
    let largeur = (0.55 + Math.abs(Math.cos(angleRotation)) * 0.22) * echelle
    let hauteur = 1.55 * echelle
    let milieu = centreX + Math.sin(angleRotation) * largeur * 0.5
    filmRemplirTriangle(toile, centreX, centreY - hauteur, centreX - largeur, centreY,
        milieu, centreY + hauteur, 8)
    filmRemplirTriangle(toile, centreX, centreY - hauteur, milieu, centreY + hauteur,
        centreX + largeur, centreY, 9)
    toile.drawLine(centreX, centreY - hauteur, milieu, centreY + hauteur, 1)
    toile.drawLine(centreX, centreY - hauteur, centreX + largeur, centreY, 1)
    if (charge > 0.3) {
        let longueurEclat = demiLargeur * charge * 1.3
        toile.drawLine(centreX - longueurEclat, centreY, centreX + longueurEclat, centreY, 9)
        toile.drawLine(centreX - longueurEclat * 0.6, centreY, centreX + longueurEclat * 0.6, centreY, 1)
    }
}

// Chaque lettre arrive d'en haut ou d'en bas, et de plus loin sur le côté, jusqu'à sa place sur la même courbe prévue.
// On dessine en trois couches (contour, ombre et couleur) ; les lettres ne tremblent pas au hasard.
function filmDessinerLettres(toile: Image, masque: Image, y: number, echelle: number, montreMs: number,
    colonneEclat: number, estDore: boolean, sensEntree: number) {
    // Des nombres entiers au lieu de nombres à virgule : taille et hauteur en 1024es. colonneEclat
    // arrive déjà en 1024es.
    echelle = Math.round(echelle * 1024)
    y = Math.round(y * 1024)
    let departX = 81920 - ((masque.width * echelle) >> 1)
    let echelleVerticale = masque == filmImageTitre ? Math.idiv(echelle * 122, 100) : echelle
    let nombreLettres = Math.idiv(masque.width + 5, 6)
    // L'ombre grandit avec la taille ; sur de petits titres, un décalage fixe boucherait les creux des lettres.
    let ombre = Math.min(3, (echelle + 512) >> 10)
    let contour = Math.min(5, (((echelle * 7) >> 2) + 512) >> 10)
    let largeur = Math.max(1, (echelle + 1023) >> 10)
    let hauteur = Math.max(1, (echelleVerticale + 1023) >> 10)
    for (let couche = 0; couche < 3; couche++) {
        for (let lettre = 0; lettre < nombreLettres; lettre++) {
            let progres = Math.max(0, Math.min(1024, Math.idiv((montreMs - lettre * 85) * 1024, 650)))
            progres = (((progres * progres) >> 10) * (3072 - 2 * progres)) >> 10
            if (progres <= 0) continue
            let reste = 1024 - progres
            let decalageX = (2 * lettre - nombreLettres + 1) * reste * 8
            let decalageY = ((reste * reste) >> 10) * 29 * sensEntree
            for (let masqueX = lettre * 6; masqueX < Math.min(masque.width, lettre * 6 + 6); masqueX++) {
                for (let masqueY = 0; masqueY < masque.height; masqueY++) {
                    if (!masque.getPixel(masqueX, masqueY)) continue
                    let x = (departX + masqueX * echelle + decalageX + 512) >> 10
                    let ecranY = (y + masqueY * echelleVerticale + decalageY + 512) >> 10
                    if (couche == 0) {
                        toile.fillRect(x - 1, ecranY - 1, largeur + 2, hauteur + 2, 15)
                        toile.fillRect(x + 2, ecranY + contour, largeur + 1, hauteur + 1, 15)
                    }
                    else if (couche == 1) toile.fillRect(x + 1, ecranY + ombre,
                        largeur, hauteur + 1, estDore ? 4 : 8)
                    else {
                        let couleur = masqueY < Math.idiv(masque.height, 2) ? 1 : estDore ? 5 : 9
                        if (Math.abs(masqueX * 1024 - colonneEclat) < 2048) couleur = 1
                        toile.fillRect(x, ecranY, largeur, hauteur, couleur)
                    }
                }
            }
        }
    }
}

// Les rayons sont en 16es de pixel ; ici, force devient la longueur de la traînée.
function filmDessinerLignesVitesse(toile: Image, force: number) {
    force = Math.round((5 + force * 22) * 16)
    for (let i = 0; i < 12; i++) {
        let numeroAnneau = i * 2
        let progres = (Math.idiv(filmMs * 1536, 1000) + Math.idiv(i * 31744, 100)) & 1023
        let rayon = 320 + ((progres * 1472) >> 10)
        let x = 1280 + ((filmAnneauX[numeroAnneau] * rayon) >> 10)
        let y = 880 + Math.idiv(filmAnneauY[numeroAnneau] * rayon * 7, 10240)
        let queue = rayon - force
        toile.drawLine(x >> 4, y >> 4,
            (1280 + ((filmAnneauX[numeroAnneau] * queue) >> 10)) >> 4,
            (880 + Math.idiv(filmAnneauY[numeroAnneau] * queue * 7, 10240)) >> 4,
            i % 3 == 0 ? 9 : 8)
    }
}

// Du texte dans une boîte sombre, à l'horizontale, au milieu.
function filmDessinerLegende(toile: Image, texte: string, y: number, couleur: number) {
    let x = 80 - texte.length * 3
    toile.fillRect(x - 3, y - 2, texte.length * 6 + 6, 10, 15)
    toile.print(texte, x, y, couleur, image.font8)
}

function dessinerFilm(toile: Image) {
    let tempsMs = filmMs
    filmFocale = 1472
    filmSoir = tempsMs >= FILM_SOIR_MS
    if (tempsMs < FILM_CHARGE_MS) {
        let progres = tempsMs / FILM_CHARGE_MS
        let courbe = filmAdoucir(progres)
        filmPlacerCamera(
            Math.sin(progres * Math.PI * 2) * 1.1,
            3.1 + Math.sin(progres * Math.PI) * 0.8,
            -4 + courbe * 38,
            Math.sin(progres * Math.PI * 2) * 0.075,
            -0.04,
            Math.sin(progres * Math.PI * 2) * 0.055)
    } else if (tempsMs < FILM_PASSAGE_MS) {
        let progres = filmAdoucir((tempsMs - FILM_CHARGE_MS) / 2400)
        filmPlacerCamera(0, 3.1 - progres * 0.7, 34 + progres * 3.2, 0, -0.04, 0)
    } else if (tempsMs < FILM_CARTE_MS) {
        let progres = (tempsMs - FILM_PASSAGE_MS) / 4000
        // Accélérer à travers la porte, puis freiner avant l'île d'arrivée.
        let progresAdouci = filmAdoucir(progres)
        filmFocale = Math.round((92 - Math.sin(progres * Math.PI) * 16) * 16)
        filmPlacerCamera(
            Math.sin(progres * Math.PI * 2) * 0.8,
            2.4 + progresAdouci * 4,
            37.2 + progresAdouci * 72.8,
            Math.sin(progres * Math.PI * 2) * 0.04,
            -0.04 - progresAdouci * 0.12,
            Math.sin(progres * Math.PI * 2) * 0.09)
    } else {
        // Arrivée : un trajet calme au-dessus de l'île d'arrivée, sous la carte et le titre.
        let progres = Math.min(1,
            (tempsMs - FILM_CARTE_MS) / (FILM_FONDU_MS - FILM_CARTE_MS))
        filmPlacerCamera(progres * 1.1, 6.4 - progres * 0.6, 110 + progres * 6.2,
            progres * 0.025, -0.16, 0)
    }
    let forceVol = tempsMs >= FILM_PASSAGE_MS && tempsMs < FILM_CARTE_MS
        ? Math.sin((tempsMs - FILM_PASSAGE_MS) / 4000 * Math.PI)
        : 0
    filmDessinerCiel(toile, filmSoir, forceVol)
    filmDessinerDecor(toile)
    if (!filmSoir) {
        let charge = tempsMs < FILM_CHARGE_MS ? 0
            : tempsMs < FILM_PASSAGE_MS ? filmAdoucir((tempsMs - FILM_CHARGE_MS) / 1800)
            : 1
        filmDessinerPorte(toile, charge)
    }
    if (tempsMs < 1600) {
        // Depuis le noir, le grand écran s'ouvre (les bandes noires s'écartent) et laisse voir le vol de la caméra.
        let rideau = Math.round((1 - filmAdoucir(tempsMs / 1600)) * 53)
        toile.fillRect(0, 6, 160, rideau, 15)
        toile.fillRect(0, 112 - rideau, 160, rideau, 15)
    }
    if (tempsMs >= FILM_CHARGE_MS && tempsMs < FILM_PASSAGE_MS) {
        let energie = filmAdoucir((tempsMs - FILM_CHARGE_MS) / 2400)
        // L'énergie attire des éclats visibles vers la porte avant qu'elle s'ouvre.
        energie = 2 + energie * 2
        for (let i = 0; i < 8; i++) {
            let numeroAnneau = i * 3
            let rayon = 288 + ((i * 208 + 1552 - Math.idiv((tempsMs - FILM_CHARGE_MS) * 16, 17) % 1552) % 1552)
            let x = 1280 + ((filmAnneauX[numeroAnneau] * rayon) >> 10)
            let y = 960 + Math.idiv(filmAnneauY[numeroAnneau] * rayon * 17, 25600)
            toile.fillRect(x >> 4, y >> 4, energie, energie, i % 3 == 0 ? 5 : 9)
        }
    }
    if (forceVol > 0.1) filmDessinerLignesVitesse(toile, forceVol)
    if (tempsMs >= FILM_CARTE_MS && tempsMs < FILM_TITRE_MS) {
        let ecouleMs = tempsMs - FILM_CARTE_MS
        // La carte du studio : CALLIOPE et HACKER en lettres géantes, et dessous « présente ».
        filmDessinerLettres(toile, filmImageCalliope, 19, 2.85,
            ecouleMs + 180, Math.idiv((ecouleMs - 1400) * 1024, 50), true, -1)
        filmDessinerLettres(toile, filmImageHacker, 55, 3.45,
            ecouleMs - 180, Math.idiv((ecouleMs - 1700) * 1024, 48), false, 1)
        if (ecouleMs > 1200) {
            let devoile = filmAdoucir((ecouleMs - 1200) / 550)
            let y = 98 + Math.round((1 - devoile) * 6)
            toile.fillRect(Math.idiv(160 - filmImagePresente.width, 2) - 3, y - 2,
                filmImagePresente.width + 6, filmImagePresente.height + 3, 15)
            for (let x = 0; x < Math.floor(filmImagePresente.width * devoile); x++) {
                for (let ecranY = 0; ecranY < filmImagePresente.height; ecranY++) {
                    if (filmImagePresente.getPixel(x, ecranY)) {
                        toile.setPixel(Math.idiv(160 - filmImagePresente.width, 2) + x, y + ecranY, 1)
                    }
                }
            }
        }
        let demiLongueur = Math.min(56, Math.max(0, (ecouleMs - 1700) / 12))
        toile.drawLine(80 - demiLongueur, 106, 80 + demiLongueur, 106, 4)
    }
    if (tempsMs >= FILM_TITRE_MS) {
        let ecouleMs = tempsMs - FILM_TITRE_MS
        let apaisement = 1 - filmAdoucir(ecouleMs / 1000)
        // Une entrée calme et grande pour le titre : le vol de la caméra continue dessous.
        filmDessinerLettres(toile, filmImageTitre, 15 - apaisement * 7,
            filmEchelleTitre(148) + apaisement * 0.12, ecouleMs + 120, Math.idiv((ecouleMs - 1800) * 1024, 33), true, -1)
        if (ecouleMs > 1600) filmDessinerLegende(toile, "BÂTIS TON PROPRE MONDE", 51, 13)
        // Des feuilles et des étincelles au premier plan bougent avec le mouvement de la caméra.
        for (let i = 0; i < 8; i++) {
            let x = (i * 43 + ecouleMs / 95) % 176 - 8
            let y = 65 + (i * 19 % 42) + Math.sin(ecouleMs * 0.0018 + i) * 3
            toile.fillRect(x, y, i % 3 == 0 ? 2 : 1, 1, i % 3 == 0 ? 5 : 7)
        }
        if (tempsMs >= FILM_FONDU_MS) {
            let fondu = filmAdoucir((tempsMs - FILM_FONDU_MS) / 1500)
            let rideau = Math.round(fondu * 32)
            toile.fillRect(0, 6, 160, rideau, 15)
            toile.fillRect(0, 112 - rideau, 160, rideau, 15)
            filmDessinerLegende(toile, "TON AVENTURE COMMENCE", Math.round(87 - fondu * 16), 9)
        }
    }
    toile.fillRect(0, 0, 160, 6, 15)
    toile.fillRect(0, 110, 160, 10, 15)
    toile.drawLine(0, 110, Math.idiv(Math.min(tempsMs, FILM_DUREE_MS) * 159, FILM_DUREE_MS), 110, 4)
    if (tempsMs - filmSautDepuisMs >= FILM_PAUSE_SAUT_MS) {
        let indice = "A : Passer"
        toile.print(indice, 80 - indice.length * 3, 112, 11, image.font8)
    }
}

// Agrandissement du titre du jeu : au plus 2,36 fois, et jamais plus large que « largeur » pixels.
function filmEchelleTitre(largeur: number): number {
    return Math.min(2.36, largeur / filmImageTitre.width)
}

function dessinerPresente() {
    let texte = "présente"
    filmImagePresente = image.create(texte.length * 6, 8)
    filmImagePresente.print(texte, 0, 0, 1, image.font8)
}
