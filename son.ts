// Les sons du jeu : courts, fabriqués par le programme, sans fichiers audio et sans lecture bloquante (tout se
// joue en arrière-plan).
let sonActif = true
let dernierChapitreFilm = -1
let sonCreuser = music.createSoundEffect(WaveShape.Noise, 600, 130, 70, 0, 75,
    SoundExpressionEffect.None, InterpolationCurve.Curve)
let sonPoser = music.createSoundEffect(WaveShape.Triangle, 330, 180, 80, 0, 100,
    SoundExpressionEffect.None, InterpolationCurve.Curve)
let sonReussite = music.stringPlayable("C5 E5 G5 C6", 280)
let sonCristal = music.stringPlayable("E5 G5 B5 E6", 320)
function jouerSon(sorteSon: number) {
    if (!sonActif) return
    music.play(sorteSon == 0 ? sonCreuser
        : sorteSon == 1 ? sonPoser
        : sorteSon == 2 ? sonReussite
        : sonCristal, music.PlaybackMode.InBackground)
}
function jouerSonFilm(chapitre: number) {
    // Chaque chapitre du film (filmChapitreAuMoment) a son propre son à son entrée.
    if (chapitre == dernierChapitreFilm) return
    dernierChapitreFilm = chapitre
    if (!sonActif) return
    if (chapitre == 0) {
        music.play(music.createSoundEffect(WaveShape.Sine, 65, 98, 45, 15, 4400,
            SoundExpressionEffect.None, InterpolationCurve.Curve), music.PlaybackMode.InBackground)
        music.play(music.stringPlayable("C3 G3 D4 G4 E4 G4 D4 G3", 108), music.PlaybackMode.InBackground)
    }
    if (chapitre == 1) {
        music.play(music.createSoundEffect(WaveShape.Triangle, 130, 1046, 12, 85, 2200,
            SoundExpressionEffect.None, InterpolationCurve.Curve), music.PlaybackMode.InBackground)
    }
    if (chapitre == 2) {
        music.play(music.createSoundEffect(WaveShape.Noise, 150, 2100, 12, 90, 2400,
            SoundExpressionEffect.None, InterpolationCurve.Curve), music.PlaybackMode.InBackground)
        music.play(music.stringPlayable("C4 D4 E4 G4 C5 D5 E5 G5", 180), music.PlaybackMode.InBackground)
    }
    // La carte « Calliope Hacker présente » reçoit une mélodie de reconnaissance ; le titre (chapitre 4) joue les mêmes
    // notes plus lentement.
    if (chapitre == 3) {
        music.play(music.stringPlayable("C4 G4 C5 E5 G5 E5 D5 C5", 140), music.PlaybackMode.InBackground)
        music.play(music.createSoundEffect(WaveShape.Triangle, 260, 65, 110, 0, 1200,
            SoundExpressionEffect.None, InterpolationCurve.Curve), music.PlaybackMode.InBackground)
    }
    if (chapitre == 4) {
        music.play(music.createSoundEffect(WaveShape.Sawtooth, 120, 35, 115, 0, 1400,
            SoundExpressionEffect.None, InterpolationCurve.Curve), music.PlaybackMode.InBackground)
        music.play(music.stringPlayable("C4 G4 C5 E5 G5 E5 D5 C5", 100), music.PlaybackMode.InBackground)
    }
    if (chapitre == 5) music.play(music.stringPlayable("E5 G5 C6", 220), music.PlaybackMode.InBackground)
}
