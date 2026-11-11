// Réglages pour la place de la sauvegarde dans la mémoire flash du Calliope.
// La sauvegarde est rangée dans un petit système de fichiers appelé RAFFS. Il coupe la place réservée en deux moitiés :
// pour enregistrer, l'ancienne ET la nouvelle sauvegarde (3522 octets chacune), avec les données de gestion, doivent
// tenir dans une moitié. PXT, l'outil de construction de MakeCode, retire aussi cette réserve de la place du programme.
// Le nom SETTINGS_SIZE est imposé par MakeCode : on ne doit pas le changer.
namespace userconfig {
    export const SETTINGS_SIZE = 16 * 1024
}

const surAppareil = control.deviceDalVersion() != "sim"
