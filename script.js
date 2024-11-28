// Fonction utilitaire pour sélectionner les éléments
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

// Variables pour le scroll
let lastScrollY = window.scrollY;
let isScrollingUp = false;

// Fonction pour gérer l'état réduit et la visibilité des éléments
const toggleReducedState = (shouldReduce) => {
    const imageContainer = $('.image-container');
    const categories = $('.categories');
    const actionButtons = $('.action-buttons');
    const rightOverlay = $('.right-overlay');
    const absolutePlayButton = $('.play-button-absolute');
    const audioPlayer = $('.audio-player');

    if (shouldReduce) {
        imageContainer.classList.add('reduced');
        categories.classList.add('hidden');
        actionButtons.classList.add('hidden');
        rightOverlay.classList.add('hidden');
        absolutePlayButton.classList.add('visible');
        audioPlayer.classList.add('visible');
    } else {
        imageContainer.classList.remove('reduced');
        categories.classList.remove('hidden');
        actionButtons.classList.remove('hidden');
        rightOverlay.classList.remove('hidden');
        absolutePlayButton.classList.remove('visible');
        audioPlayer.classList.remove('visible');
        // S'assurer que les boutons reviennent à leur état initial
        $('.play-button-overlay i').classList.replace('fa-pause', 'fa-play');
        absolutePlayButton.querySelector('i').classList.replace('fa-pause', 'fa-play');
    }
};

// Bouton Paramètres
$('#settings-btn').addEventListener('click', () => {
    alert('Accéder aux paramètres de l\'application.');
});

// Boutons Catégories
$$('.category-button').forEach(button => {
    button.addEventListener('click', () => {
        const category = button.textContent.trim();
        alert(`Afficher les nouvelles de la catégorie : ${category}`);
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
    });
});

// Variables pour la rotation avec inertie
let isDragging = false, startAngle = 0, userRotation = 0, autoRotation = 0, velocity = 0;
let lastAngle = 0, lastTime = 0, animationFrameId = null, autoRotateAnimationId = null;
let autoRotateEnabled = false, lastAutoRotateTime = null;

// Sélectionner l'image et son conteneur
const imageContainer = $('.image-container');
const centralImage = $('.central-image');
const playButtonOverlay = $('.play-button-overlay');
const playButtonAbsolute = $('.play-button-absolute');
const audioElement = new Audio('musics/test.mp3');
audioElement.loop = true;

let isPlaying = false;

// Sélectionner les éléments du lecteur MP3
const progressBar = $('#progress-bar');
const currentTimeEl = $('.current-time');
const remainingTimeEl = $('.remaining-time');

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

    userRotation += deltaAngle;
    updateTransform();

    const now = Date.now();
    const deltaTime = now - lastTime;
    if (deltaTime > 0) {
        velocity = deltaAngle / deltaTime;
        lastAngle = currentMouseAngle;
        lastTime = now;
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
    let newRate = 1 + velocity * 50;
    if (newRate < 0.1) newRate = 0.1;
    if (newRate > 3) newRate = 3;
    audioElement.playbackRate = newRate;
};

// Fonction pour animer l'inertie
const animateInertia = () => {
    userRotation += velocity * 16;
    updateTransform();
    velocity *= 0.95;
    updatePlaybackRate(velocity);
    if (Math.abs(velocity) > 0.0001) {
        animationFrameId = requestAnimationFrame(animateInertia);
    } else {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        audioElement.playbackRate = 1;
    }
};

// Fonction d'autorotation
const autoRotate = timestamp => {
    if (!autoRotateEnabled) return;
    if (!lastAutoRotateTime) lastAutoRotateTime = timestamp;
    const delta = timestamp - lastAutoRotateTime;
    lastAutoRotateTime = timestamp;
    autoRotation += (delta / 1000) * 60;
    updateTransform();
    autoRotateAnimationId = requestAnimationFrame(autoRotate);
};

// Fonction qui gère le play/pause pour les deux boutons
const handlePlayPause = () => {
    if (!isPlaying) {
        startAudio();
        $('.play-button-overlay i').classList.replace('fa-play', 'fa-pause');
        playButtonAbsolute.querySelector('i').classList.replace('fa-play', 'fa-pause');
        toggleReducedState(true);
        if (!autoRotateAnimationId) {
            autoRotateEnabled = true;
            lastAutoRotateTime = null;
            autoRotateAnimationId = requestAnimationFrame(autoRotate);
        }
    } else {
        stopAudio();
        $('.play-button-overlay i').classList.replace('fa-pause', 'fa-play');
        playButtonAbsolute.querySelector('i').classList.replace('fa-pause', 'fa-play');
        toggleReducedState(false);
        if (autoRotateAnimationId) {
            cancelAnimationFrame(autoRotateAnimationId);
            autoRotateAnimationId = null;
            autoRotateEnabled = false;
        }
        userRotation = 0;
        autoRotation = 0;
        updateTransform();
    }
};

// Ajouter les écouteurs pour les événements pointer
imageContainer.addEventListener('pointerdown', startDrag);
document.addEventListener('pointermove', duringDrag);
document.addEventListener('pointerup', endDrag);

// Ajouter les écouteurs pour les deux boutons
playButtonOverlay.addEventListener('click', handlePlayPause);
playButtonAbsolute.addEventListener('click', handlePlayPause);

// Empêcher la propagation des événements pointer sur les deux boutons
playButtonOverlay.addEventListener('pointerdown', e => e.stopPropagation());
playButtonAbsolute.addEventListener('pointerdown', e => e.stopPropagation());

// Initialiser le curseur
imageContainer.style.cursor = 'grab';

// Modification de l'écouteur de scroll
let isScrolling;
window.addEventListener('scroll', () => {
    clearTimeout(isScrolling);

    if (isPlaying) {
        const currentScrollY = window.scrollY;
        isScrollingUp = currentScrollY < lastScrollY;

        if (isScrollingUp) {
            stopAudio();
            toggleReducedState(false);
            if (autoRotateAnimationId) {
                cancelAnimationFrame(autoRotateAnimationId);
                autoRotateAnimationId = null;
                autoRotateEnabled = false;
            }
            isPlaying = false;
        }

        lastScrollY = currentScrollY;
    }

    isScrolling = setTimeout(() => {
        lastScrollY = window.scrollY;
    }, 66);
});

// Lorsque la musique se termine
audioElement.addEventListener('ended', () => {
    $('.play-button-overlay i').classList.replace('fa-pause', 'fa-play');
    playButtonAbsolute.querySelector('i').classList.replace('fa-pause', 'fa-play');
    toggleReducedState(false);
    if (autoRotateAnimationId) {
        cancelAnimationFrame(autoRotateAnimationId);
        autoRotateAnimationId = null;
        autoRotateEnabled = false;
    }
    userRotation = 0;
    autoRotation = 0;
    updateTransform();
});

// Mettre à jour la barre de progression et les temps
audioElement.addEventListener('timeupdate', () => {
    const currentTime = audioElement.currentTime;
    const duration = audioElement.duration;

    if (isNaN(duration)) return;

    const progressPercent = (currentTime / duration) * 100;
    progressBar.value = progressPercent;
    updateProgressBarBackground(progressPercent);

    // Mettre à jour le temps écoulé
    currentTimeEl.textContent = formatTime(currentTime);

    // Mettre à jour le temps restant
    remainingTimeEl.textContent = `-${formatTime(duration - currentTime)}`;
});

// Fonction pour formater le temps en mm:ss
const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// Permettre le contrôle de la barre de progression
let isSeeking = false;

progressBar.addEventListener('input', () => {
    isSeeking = true;
    const seekTime = (progressBar.value / 100) * audioElement.duration;
    audioElement.currentTime = seekTime;
});

audioElement.addEventListener('seeked', () => {
    isSeeking = false;
});

// Mettre à jour la barre lorsque la durée est chargée
audioElement.addEventListener('loadedmetadata', () => {
    if (!isSeeking) {
        progressBar.max = 100;
    }
});

// Fonction pour mettre à jour le fond de la barre de progression
const updateProgressBarBackground = (percent) => {
    progressBar.style.backgroundImage = `linear-gradient(to right, var(--progress-fill) ${percent}%, var(--progress-bg) ${percent}%)`;
};
