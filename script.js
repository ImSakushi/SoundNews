// Gestion des interactions

// Fonction utilitaire pour sélectionner les éléments
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

// Bouton Paramètres
$('#settings-btn').addEventListener('click', () => {
    alert('Accéder aux paramètres de l\'application.');
    // Implémentation future des paramètres
});

// Boutons Catégories
$$('.category-button').forEach(button => {
    button.addEventListener('click', () => {
        const category = button.textContent.trim();
        alert(`Afficher les nouvelles de la catégorie : ${category}`);
        // Logique de filtrage des news par catégorie
    });
});

// Boutons de la barre de navigation
$$('.nav-button').forEach(button => {
    button.addEventListener('click', () => {
        const icon = button.querySelector('i');
        const actions = {
            'fa-chart-bar': 'Afficher les statistiques d\'écoute.',
            'fa-play': 'Lancer la playlist.',
            'fa-clock': 'Afficher l\'historique ou sauvegardes.'
        };
        for (const [cls, msg] of Object.entries(actions)) {
            if (icon && icon.classList.contains(cls)) {
                alert(msg);
                // Implémentation de la navigation correspondante
                break;
            }
        }
    });
});

// Boutons d'action au-dessus du footer
['.back-button', '.cross-button', '.check-button', '.bookmark-button'].forEach(selector => {
    $(selector).addEventListener('click', () => {
        const actions = {
            '.back-button': 'Retour à la page précédente.',
            '.cross-button': 'Rejeté.',
            '.check-button': 'Accepté.',
            '.bookmark-button': 'Article sauvegardé dans les favoris.'
        };
        alert(actions[selector]);
        // Implémentation des actions correspondantes
    });
});

// Variables pour la rotation avec inertie
let isDragging = false, startAngle = 0, userRotation = 0, autoRotation = 0, velocity = 0;
let lastAngle = 0, lastTime = 0, animationFrameId = null, autoRotateAnimationId = null, autoRotateEnabled = false, lastAutoRotateTime = null;

// Sélectionner l'image et son conteneur
const imageContainer = $('.image-container');
const centralImage = $('.central-image');

// Fonction pour calculer l'angle entre le centre et la position du pointeur
const getAngle = (x, y, centerX, centerY) => Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);

// Fonction pour mettre à jour la rotation de l'image
const updateTransform = () => {
    centralImage.style.transform = `rotate(${userRotation + autoRotation}deg)`;
};

// Gestion du drag
const startDrag = e => {
    const rect = centralImage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    isDragging = true;
    cancelAnimationFrame(animationFrameId);
    startAngle = getAngle(e.clientX, e.clientY, centerX, centerY) - userRotation;
    lastAngle = getAngle(e.clientX, e.clientY, centerX, centerY);
    lastTime = Date.now();
    imageContainer.style.cursor = 'grabbing';
};

const duringDrag = e => {
    if (!isDragging) return;
    const rect = centralImage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentMouseAngle = getAngle(e.clientX, e.clientY, centerX, centerY);
    const deltaAngle = currentMouseAngle - lastAngle;

    // Gérer le dépassement de 360 degrés
    if (deltaAngle > 180) {
        deltaAngle -= 360;
    } else if (deltaAngle < -180) {
        deltaAngle += 360;
    }

    userRotation += deltaAngle;
    updateTransform();

    const now = Date.now();
    const deltaTime = now - lastTime;
    if (deltaTime > 0) {
        velocity = deltaAngle / deltaTime;
        lastAngle = currentMouseAngle;
        lastTime = now;
        // Mettre à jour le playbackRate en fonction de la vitesse
        updatePlaybackRate(velocity);
    }
};

const endDrag = () => {
    if (isDragging) {
        isDragging = false;
        imageContainer.style.cursor = 'grab';
        if (Math.abs(velocity) > 0) animateInertia();
    }
};

// Ajouter les écouteurs pour les événements pointer
imageContainer.addEventListener('pointerdown', startDrag);
document.addEventListener('pointermove', duringDrag);
document.addEventListener('pointerup', endDrag);

// Initialiser le curseur
imageContainer.style.cursor = 'grab';

// Gestion de la lecture de la musique et de la rotation
const playButtonOverlay = $('.play-button-overlay');
const audioElement = new Audio('musics/test.mp3'); // Assurez-vous que le chemin est correct
audioElement.loop = true;

let isPlaying = false;

// Fonction pour démarrer l'audio
const startAudio = () => {
    audioElement.play();
    isPlaying = true;
};

// Fonction pour arrêter l'audio
const stopAudio = () => {
    audioElement.pause();
    isPlaying = false;
};

// Fonction pour mettre à jour le playbackRate
const updatePlaybackRate = (velocity) => {
    // Ajuster la sensibilité en modifiant le multiplicateur
    let newRate = 1 + velocity * 50;
    if (newRate < 0.1) newRate = 0.1; // Vitesse minimale
    if (newRate > 3) newRate = 3;     // Vitesse maximale
    audioElement.playbackRate = newRate;
};

// Fonction pour animer l'inertie
const animateInertia = () => {
    userRotation += velocity * 16; // Multiplier par 16 pour ajuster la vitesse
    updateTransform();
    velocity *= 0.95; // Diminuer progressivement la vitesse
    updatePlaybackRate(velocity);
    if (Math.abs(velocity) > 0.0001) {
        animationFrameId = requestAnimationFrame(animateInertia);
    } else {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        // Réinitialiser le playbackRate à 1 après l'inertie
        audioElement.playbackRate = 1;
    }
};

// Fonction d'autorotation
const autoRotate = timestamp => {
    if (!autoRotateEnabled) return;
    if (!lastAutoRotateTime) lastAutoRotateTime = timestamp;
    const delta = timestamp - lastAutoRotateTime;
    lastAutoRotateTime = timestamp;
    autoRotation += (delta / 1000) * 60; // 60 degrés par seconde
    updateTransform();
    autoRotateAnimationId = requestAnimationFrame(autoRotate);
};

// Gestion des clics sur le bouton play/pause
playButtonOverlay.addEventListener('click', () => {
    if (!isPlaying) {
        startAudio();
        playButtonOverlay.querySelector('i').classList.replace('fa-play', 'fa-pause');
        if (!autoRotateAnimationId) {
            autoRotateEnabled = true;
            lastAutoRotateTime = null;
            autoRotateAnimationId = requestAnimationFrame(autoRotate);
        }
    } else {
        stopAudio();
        playButtonOverlay.querySelector('i').classList.replace('fa-pause', 'fa-play');
        if (autoRotateAnimationId) {
            cancelAnimationFrame(autoRotateAnimationId);
            autoRotateAnimationId = null;
            autoRotateEnabled = false;
        }
        // Réinitialiser la rotation lorsque la musique est arrêtée
        userRotation = 0;
        autoRotation = 0;
        updateTransform();
    }
});

// Empêcher la propagation des événements pointer sur le bouton Play
playButtonOverlay.addEventListener('pointerdown', e => e.stopPropagation());

// Lorsque la musique se termine, réinitialiser le bouton et arrêter l'auto-rotation
audioElement.addEventListener('ended', () => {
    playButtonOverlay.querySelector('i').classList.replace('fa-pause', 'fa-play');
    if (autoRotateAnimationId) {
        cancelAnimationFrame(autoRotateAnimationId);
        autoRotateAnimationId = null;
        autoRotateEnabled = false;
    }
    // Réinitialiser la rotation lorsque la musique se termine
    userRotation = 0;
    autoRotation = 0;
    updateTransform();
});
