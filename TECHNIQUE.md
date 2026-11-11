# Côté technique : Mont des blocs

Ici, tu trouves en bref comment le code est organisé et comment construire le jeu. Le mot de bienvenue et les premières
idées pour changer le jeu sont dans `README.md`.

## Organisation

C'est un projet pour MakeCode Arcade, écrit en TypeScript. `pxt.json` donne le nom du projet `mont-des-blocs` et tous
les fichiers dans l'ordre où MakeCode les lit. `mkc.json` dit pour quel appareil on compile : le Calliope mini 3 avec le
GameKit (variante « n3 »).

Les fichiers du jeu :

- `reglages.ts` : réglages pour la place de la sauvegarde dans la mémoire flash du Calliope.
- `monde.ts` : le monde et ses règles : les blocs, les mouvements du personnage, creuser, poser, fabriquer et la
  sauvegarde.
- `rayons.ts` : les rayons de vue et l'image du monde en vraie 3D.
- `film.ts` : L'intro avec la carte du studio et le titre.
- `son.ts` : les sons du jeu : courts, fabriqués par le programme, sans fichiers audio et sans lecture bloquante (tout
  se joue en arrière-plan).
- `exercice.ts` : L'exercice en sept étapes sur un terrain à part.
- `hacker.ts` : les images du Calliope Hacker, dans les couleurs de la palette de ce jeu.
- `main.ts` : démarrage, commandes, établi et affichage.

## Comment le jeu tourne

1. `decoderSauvegarde` charge la partie sauvegardée depuis `settings`. S'il n'y en a pas ou si elle est abîmée,
   `creerMonde` crée un nouveau monde.
2. `filmPreparer` construit le décor de l'intro. L'intro vole entre des îles flottantes et à travers une porte, puis
   montre la carte du studio et le titre. A saute à la station suivante, MENU passe tout.
3. Après l'intro vient l'exercice (`lancerExercice`), tant qu'il n'a pas encore été réussi. Ensuite, chaque démarrage
   montre l'écran de titre.
4. `actualiserJeu` tourne à chaque mise à jour : tourner et marcher (`deplacerPerso`), trouver le bloc visé
   (`actualiserCible`), creuser, poser, exercice.
5. La fonction dans `scene.createRenderable` dessine chaque image : l'intro, ou le monde (`dessinerMondeMemorise`),
   l'outil, la barre (`dessinerBarre`), l'écran de titre, le menu de l'établi et les textes de l'exercice.

Le monde fait 24 × 24 blocs au sol et 12 blocs de haut. Chaque bloc est un nombre dans `monde` ; quel nombre correspond
à quel bloc, c'est écrit dans l'énumération `Bloc`. Pour dessiner le monde, `dessinerMonde` envoie un rayon depuis l'œil
à travers chaque petit carré de l'écran (`suivreRayon`) et colorie le carré comme le bloc touché (`couleurImpact`).

## Construire le jeu

- **Dans le navigateur :** ouvre arcade.makecode.com, choisis « Importer » et ouvre le fichier du jeu
  `mont-des-blocs.hex`. Dans ce fichier se trouve tout le code. Le simulateur montre le jeu tout de suite.
- **Sur l'ordinateur :** avec l'outil en ligne de commande de MakeCode (paquet npm `makecode`), lance `makecode build`
  dans ce dossier. Le fichier du jeu pour l'appareil se trouve ensuite dans `built/n3/binary.hex`.

## Sur l'appareil

Branche le Calliope mini 3 à l'ordinateur avec le câble USB. Il apparaît comme un lecteur. Glisse le fichier du jeu
(`.hex`) sur ce lecteur ; le jeu démarre ensuite tout seul. L'écran du GameKit mesure 160 × 120 pixels et affiche 16
couleurs. Le jeu sauvegarde par le menu de l'établi (« Sauvegarder ») et environ une fois par minute tout seul, si
quelque chose a changé. Si tu mets un autre programme sur l'appareil, MakeCode peut effacer la partie sauvegardée.

Ce jeu existe aussi en allemand, en anglais et en espagnol. Les quatre versions viennent du même projet de départ.
