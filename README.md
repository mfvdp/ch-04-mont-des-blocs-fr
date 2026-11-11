# Mont des blocs

Bonjour ! Voici **Mont des blocs**, un jeu de **Calliope Hacker** pour le **Calliope mini 3 avec le GameKit**.

Tu regardes un petit monde fait de blocs : herbe, terre, pierre, arbres et, tout en bas, une grotte avec des cristaux.
Marche, creuse des blocs, pose-les ailleurs et fabrique à l'établi des planches et une pioche. Ton but : trouver
5 cristaux. Au début, un court exercice te montre tout pas à pas. Le Calliope Hacker est assis à son bureau sur
l'image accrochée au mur de l'établi.

## Comment jouer

- **Croix directionnelle haut et bas :** avancer et reculer
- **Croix directionnelle gauche et droite :** tourner
- **Tenir B et appuyer sur haut ou bas :** regarder vers le haut ou vers le bas
- **Tenir A :** creuser le bloc visé par le viseur
- **Appui bref sur B :** poser un bloc de ta réserve
- **Tenir B et appuyer sur gauche ou droite :** choisir un autre matériau
- **MENU :** établi pour fabriquer, sauvegarder la partie, retour au départ et plus encore (B valide la ligne choisie, A
  ferme)

## Change le jeu toi-même

Tout le code du jeu est dans ce fichier du jeu. Ouvre-le dans MakeCode Arcade (arcade.makecode.com, « Importer »).
Change un nombre, lance le simulateur et regarde ce qui se passe :

- **Marcher plus vite :** dans `monde.ts`, fonction `deplacerPerso`, il y a `Math.idiv(avance * dureeMs * 7, 10)`. Avec
  `14` à la place de `7`, le perso court deux fois plus vite.
- **Plus de terre au début :** dans `monde.ts`, fonction `creerMonde`, il y a `reserve = [0, 0, 24, 16, 8, 0, 12, 0,
  0]`. Le 24 est la terre avec laquelle tu commences ; essaie 99. Cela vaut pour chaque nouveau monde (établi, « Nouveau
  monde »).
- **Creuser plus vite :** dans `main.ts`, il y a `? (aPioche ? 220 : 600) : 300` à deux endroits : dans la fonction
  `actualiserJeu` (elle décide quand le bloc casse) et dans `dessinerBarre` (elle dessine la petite barre de
  progression). Le 300 est le nombre de millisecondes qu'il faut pour creuser un bloc qui n'est ni de la pierre ni un
  cristal (terre, bois…). Essaie 100 aux deux endroits.

L'explication du code pour les enfants, les parents et les enseignants se trouve sur calliope-hacker.de.
