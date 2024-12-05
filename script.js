// Fonction utilitaire pour sélectionner les éléments
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

// Configuration de l'API Backend
const API_URL = "https://soundnews-backend.onrender.com/api"; // Assure-toi que cette URL est correcte
// Si ton backend est en local, utilise "http://localhost:5000/api" à la place

// Variables pour le scroll
let lastScrollY = window.scrollY;
let isScrollingUp = false;

// Liste des musiques et index actuel
let musicsList = [];
let currentMusicIndex = 0;

// Sélectionner les éléments du DOM
const settingsButton = $('#settings-btn');
const categoryButtons = $$('.category-button');
const navButtons = $$('.nav-button');
const actionButtons = $$('.action-button');
const bookmarkButtonImg = $('.bookmark-button img'); // L'image dans le bouton Bookmark
const centralImage = $('.central-image');
const titleElement = $('.title');
const subtitleElement = $('.subtitle');
const playButtonOverlay = $('.play-button-overlay');
const playButtonAbsolute = $('.play-button-absolute');
const audioPlayer = $('.audio-player');
const progressBar = $('#progress-bar');
const currentTimeEl = $('.current-time');
const remainingTimeEl = $('.remaining-time');
const lyricsContainer = $('.lyrics-container');
const lyricsElement = $('.lyrics');
const audioElement = new Audio(); // Élément audio
audioElement.loop = true;

// Variables pour le contrôle de la lecture
let isPlaying = false;

// Variables pour la rotation de l'image
let isDragging = false, startAngle = 0, userRotation = 0, autoRotation = 0, velocity = 0;
let lastAngle = 0, lastTime = 0, animationFrameId = null, autoRotateAnimationId = null;
let autoRotateEnabled = false, lastAutoRotateTime = null;

// Fonction pour mettre à jour la transformation de l'image
const updateTransform = () => {
    centralImage.style.transform = `rotate(${userRotation + autoRotation}deg)`;
};

// Fonction pour calculer l'angle entre le centre et la position du pointeur
const getAngle = (x, y, centerX, centerY) => Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);

// Gestion du drag pour la rotation de l'image
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
    lyricsContainer.classList.add('visible'); // Afficher les paroles
    centralImage.classList.add('colored'); // Enlever le filtre noir et blanc
};

// Fonction pour arrêter l'audio
const stopAudio = () => {
    audioElement.pause();
    isPlaying = false;
    lyricsContainer.classList.remove('visible'); // Masquer les paroles
    centralImage.classList.remove('colored'); // Réappliquer le filtre noir et blanc
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

// Fonction pour gérer le play/pause pour les deux boutons
const handlePlayPause = () => {
    if (!isPlaying) {
        startAudio();
        playButtonOverlay.querySelector('i').classList.replace('fa-play', 'fa-pause');
        playButtonAbsolute.querySelector('i').classList.replace('fa-play', 'fa-pause');
        toggleReducedState(true);
        if (!autoRotateAnimationId) {
            autoRotateEnabled = true;
            lastAutoRotateTime = null;
            autoRotateAnimationId = requestAnimationFrame(autoRotate);
        }
    } else {
        stopAudio();
        playButtonOverlay.querySelector('i').classList.replace('fa-pause', 'fa-play');
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

// Gestion des évènements de rotation
const imageContainer = $('.image-container');
imageContainer.addEventListener('pointerdown', startDrag);
document.addEventListener('pointermove', duringDrag);
document.addEventListener('pointerup', endDrag);

// Gestion des clics sur les boutons de lecture
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
    playButtonOverlay.querySelector('i').classList.replace('fa-pause', 'fa-play');
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
    // Optionnel : Passer à la musique suivante automatiquement
    loadNextMusic(); // Charger la musique suivante sans la jouer
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

let lyrics = [];
let currentLyricIndex = -1;

// Fonction pour charger et parser le fichier LRC
const loadLyrics = (lyricContent) => {
    lyrics = parseLRC(lyricContent);
    renderLyrics(lyrics);
    // Afficher les paroles uniquement si la musique est en cours de lecture
    if (isPlaying) {
        lyricsContainer.classList.add('visible');
    }
};

// Fonction pour parser le contenu LRC
const parseLRC = (lrcText) => {
    const lines = lrcText.split('\n');
    const parsedLyrics = [];

    const timeRegEx = /\[(\d{2}):(\d{2}\.\d{2})\](.*)/;

    lines.forEach(line => {
        const match = line.match(timeRegEx);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseFloat(match[2]);
            const text = match[3].trim();
            const time = minutes * 60 + seconds;
            parsedLyrics.push({ time, text });
        }
    });

    // Trier les paroles par temps croissant
    parsedLyrics.sort((a, b) => a.time - b.time);

    return parsedLyrics;
};

// Fonction pour rendre les paroles dans le DOM
const renderLyrics = (lyrics) => {
    lyricsElement.innerHTML = ''; // Réinitialiser les paroles

    lyrics.forEach((line, index) => {
        const lineElement = document.createElement('div');
        lineElement.classList.add('lyric-line', 'future');
        lineElement.setAttribute('data-index', index);
        lineElement.textContent = line.text;

        // Ajouter l'écouteur de clic
        lineElement.addEventListener('click', () => {
            audioElement.currentTime = line.time;
            updateLyricsDisplay(line.time);
        });

        lyricsElement.appendChild(lineElement);
    });

    // Afficher la première ligne comme future si aucune lecture n'a commencé
    if (lyrics.length > 0) {
        currentLyricIndex = -1;
        updateLyricsDisplay(0);
    }
};

// Fonction pour mettre à jour l'affichage des paroles
const updateLyricsDisplay = (currentTime) => {
    if (lyrics.length === 0) return;

    // Trouver l'index de la ligne actuelle
    let found = false;
    for (let i = 0; i < lyrics.length; i++) {
        if (currentTime < lyrics[i].time) {
            currentLyricIndex = i - 1;
            found = true;
            break;
        }
    }

    // Si on est à la fin des paroles
    if (!found) {
        currentLyricIndex = lyrics.length - 1;
    }

    // Mettre à jour les styles des paroles
    $$('.lyric-line').forEach(line => {
        const index = parseInt(line.getAttribute('data-index'), 10);
        if (index === currentLyricIndex) {
            line.classList.add('current');
            line.classList.remove('past', 'future');
        } else if (index < currentLyricIndex) {
            line.classList.add('past');
            line.classList.remove('current', 'future');
        } else {
            line.classList.add('future');
            line.classList.remove('current', 'past');
        }
    });

    // Faire défiler pour centrer la ligne actuelle
    const currentLine = $(`.lyric-line[data-index="${currentLyricIndex}"]`);
    if (currentLine) {
        currentLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

// Ajouter l'événement `timeupdate` pour synchroniser les paroles
audioElement.addEventListener('timeupdate', () => {
    const currentTime = audioElement.currentTime;
    updateLyricsDisplay(currentTime);
});

const getURLParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        musicId: params.get('musicId')
    };
};

// Fonction pour jouer une musique spécifique basée sur l'ID
const playMusicById = (musicId) => {
    const index = musicsList.findIndex(m => m._id === musicId);
    if (index !== -1) {
        currentMusicIndex = index;
        setMusicDetails(currentMusicIndex);
        handlePlayPause(); // Démarrer la lecture
    } else {
        console.error('Musique avec l\'ID spécifié non trouvée.');
    }
};

// Gestion des paramètres au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    fetchMusics(); // Charger les musiques au chargement

    const params = getURLParams();
    if (params.musicId) {
        // Attendre que les musiques soient chargées avant de jouer
        const checkMusicsLoaded = setInterval(() => {
            if (musicsList.length > 0) {
                playMusicById(params.musicId);
                clearInterval(checkMusicsLoaded);
            }
        }, 100);
    }
});

// Fonction pour récupérer les musiques depuis le backend
const fetchMusics = async () => {
    console.log('Fetching musics...');
    try {
        const response = await fetch(`${API_URL}/musics`);
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des musiques');
        }
        const musics = await response.json();
        console.log('Musics fetched:', musics);
        musicsList = musics;
        if (musicsList.length > 0) {
            currentMusicIndex = 0;
            setMusicDetails(currentMusicIndex); // Afficher les détails sans jouer
        } else {
            alert('Aucune musique disponible.');
        }
    } catch (error) {
        console.error(error);
        alert('Impossible de charger les musiques. Veuillez réessayer plus tard.');
    }
};

// Fonction pour définir les détails d'une musique sans jouer
const setMusicDetails = (index) => {
    if (index < 0 || index >= musicsList.length) {
        alert('Index de musique invalide.');
        return;
    }
    const music = musicsList[index];
    // Mettre à jour l'interface avec les détails de la musique
    centralImage.src = music.coverImage;
    titleElement.innerHTML = `${music.title}<br><p class="date">${new Date(music.createdAt).toLocaleDateString()}</p>`;
    subtitleElement.textContent = music.artist;
    audioElement.src = music.audioUrl;
    // Charger les paroles
    if (music.lyrics && music.lyrics.content) {
        loadLyrics(music.lyrics.content);
    } else {
        lyricsContainer.classList.remove('visible');
        lyricsElement.innerHTML = '<p>Aucune parole disponible.</p>';
    }
    // Mettre à jour les boutons de lecture
    playButtonOverlay.querySelector('i').classList.replace('fa-pause', 'fa-play');
    playButtonAbsolute.querySelector('i').classList.replace('fa-pause', 'fa-play');
    // Mettre à jour l'état du bouton Bookmark
    updateBookmarkButton();
};

// Fonction pour charger une musique par son index sans démarrer la lecture ou modifier l'interface
const loadMusicByIndex = (index) => {
    if (index < 0 || index >= musicsList.length) {
        alert('Index de musique invalide.');
        return;
    }
    const music = musicsList[index];
    // Mettre à jour l'interface avec les détails de la musique
    centralImage.src = music.coverImage;
    titleElement.innerHTML = `${music.title}<br><p class="date">${new Date(music.createdAt).toLocaleDateString()}</p>`;
    subtitleElement.textContent = music.artist;
    audioElement.src = music.audioUrl;
    // Charger les paroles
    if (music.lyrics && music.lyrics.content) {
        loadLyrics(music.lyrics.content);
    } else {
        lyricsContainer.classList.remove('visible');
        lyricsElement.innerHTML = '<p>Aucune parole disponible.</p>';
    }
    // Mettre à jour l'état du bouton Bookmark
    updateBookmarkButton();
};

// Fonction pour charger la musique suivante sans démarrer la lecture
const loadNextMusic = () => {
    if (musicsList.length === 0) return;

    // Arrêter l'audio actuel
    stopAudio();

    // Incrémenter l'index, revenir au début si on atteint la fin
    currentMusicIndex = (currentMusicIndex + 1) % musicsList.length;

    // Charger la musique suivante sans démarrer la lecture ni modifier l'interface
    loadMusicByIndex(currentMusicIndex);

    // Ne pas démarrer la lecture automatiquement
};

// Fonction pour jouer la musique suivante automatiquement (si souhaité)
const playNextMusicAutomatically = () => {
    if (musicsList.length === 0) return;

    // Arrêter l'audio actuel
    stopAudio();

    // Incrémenter l'index, revenir au début si on atteint la fin
    currentMusicIndex = (currentMusicIndex + 1) % musicsList.length;

    // Charger la musique suivante
    loadMusicByIndex(currentMusicIndex);

    // Démarrer la lecture
    startAudio();

    // Modifier l'interface utilisateur pour le mode réduit
    toggleReducedState(true);
};

// Fonction pour jouer la musique précédente (si nécessaire)
const playPreviousMusic = () => {
    if (musicsList.length === 0) return;

    // Arrêter l'audio actuel
    stopAudio();

    // Décrémenter l'index, revenir à la fin si on atteint le début
    currentMusicIndex = (currentMusicIndex - 1 + musicsList.length) % musicsList.length;

    // Charger la musique précédente sans démarrer la lecture ni modifier l'interface
    loadMusicByIndex(currentMusicIndex);

    // Ne pas démarrer la lecture automatiquement
};

// Fonction pour mettre à jour l'interface en mode réduit ou non
const toggleReducedState = (shouldReduce) => {
    const imageContainer = $('.image-container');
    const categories = $('.categories');
    const actionButtons = $('.action-buttons');
    const rightOverlay = $('.right-overlay');
    const absolutePlayButton = $('.play-button-absolute');
    const audioPlayer = $('.audio-player');
    const mainContent = $('.main-content'); // Sélectionner main-content

    if (shouldReduce) {
        imageContainer.classList.add('reduced');
        categories.classList.add('hidden');
        actionButtons.classList.add('hidden');
        rightOverlay.classList.add('hidden');
        absolutePlayButton.classList.add('visible');
        audioPlayer.classList.add('visible');
        mainContent.classList.add('reduced-padding'); // Ajouter la classe
    } else {
        imageContainer.classList.remove('reduced');
        categories.classList.remove('hidden');
        actionButtons.classList.remove('hidden');
        rightOverlay.classList.remove('hidden');
        absolutePlayButton.classList.remove('visible');
        audioPlayer.classList.remove('visible');
        mainContent.classList.remove('reduced-padding'); // Supprimer la classe
        // S'assurer que les boutons reviennent à leur état initial
        playButtonOverlay.querySelector('i').classList.replace('fa-pause', 'fa-play');
        playButtonAbsolute.querySelector('i').classList.replace('fa-pause', 'fa-play');
        // Réappliquer le filtre noir et blanc lorsque l'état est réduit
        centralImage.classList.remove('colored');
    }
};

// Gestion du bouton Paramètres
settingsButton.addEventListener('click', () => {
    alert('Accéder aux paramètres de l\'application.');
});

// Gestion des boutons Catégories
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        const category = button.textContent.trim();
        alert(`Afficher les nouvelles de la catégorie : ${category}`);
        // Implémentez le filtrage des musiques par catégorie ici
    });
});

// Gestion des boutons de la barre de navigation
// Sélectionner le bouton Discothèque
const discothequeButton = $('#discotheque-button');

// Ajouter un gestionnaire d'événements pour rediriger vers bookmark.html
discothequeButton.addEventListener('click', () => {
    window.location.href = 'bookmark.html';
});

// Gestionnaire d'événements pour les autres boutons de navigation
$$('.nav-button').forEach(button => {
    // Ignorer le bouton Discothèque déjà géré
    if (button.id === 'discotheque-button') return;

    button.addEventListener('click', () => {
        const icon = button.querySelector('i') || button.querySelector('.play-logo');
        const actions = {
            'fa-chart-bar': 'Afficher les statistiques d\'écoute.',
            'fa-play': 'Lancer la playlist.',
            'fa-bookmark': 'Afficher vos bookmarks.'
        };
        for (const [cls, msg] of Object.entries(actions)) {
            if (icon && icon.classList.contains(cls)) {
                alert(msg);
                break;
            }
        }
    });
});

// Gestion des boutons d'action au-dessus du footer (back, cross, check)
['.back-button', '.cross-button', '.check-button'].forEach(selector => {
    $(selector).addEventListener('click', () => {
        if (selector === '.check-button') {
            // Action spécifique pour le bouton "Accepter" (check-button)
            loadNextMusic(); // Charger la musique suivante sans démarrer la lecture
        } else if (selector === '.cross-button') {
            // Action spécifique pour le bouton "Rejeter" (cross-button)
            loadNextMusic(); // Charger la musique suivante sans démarrer la lecture
        } else if (selector === '.back-button') {
            // Action pour le bouton "Retour"
            alert('Retour à la page précédente.');
        }
    });
});

// Fonction pour obtenir les bookmarks depuis le localStorage
const getBookmarks = () => {
    const bookmarks = localStorage.getItem('bookmarks');
    return bookmarks ? JSON.parse(bookmarks) : [];
};

// Fonction pour mettre à jour l'icône du bouton Bookmark en fonction de l'état
const updateBookmarkButton = () => {
    const currentMusic = musicsList[currentMusicIndex];
    if (!currentMusic) return;

    const bookmarks = getBookmarks();
    const isBookmarked = bookmarks.some(music => music._id === currentMusic._id);

    if (isBookmarked) {
        bookmarkButtonImg.src = 'images/bookmark-fill.svg';
    } else {
        bookmarkButtonImg.src = 'images/bookmark.svg';
    }
};

// Gestionnaire d'événements pour le bouton Bookmark
bookmarkButtonImg.addEventListener('click', () => {
    const currentMusic = musicsList[currentMusicIndex];
    if (!currentMusic) return;

    const bookmarks = getBookmarks();
    const isBookmarked = bookmarks.some(music => music._id === currentMusic._id);

    if (isBookmarked) {
        // Si déjà bookmarkée, la retirer
        const updatedBookmarks = bookmarks.filter(music => music._id !== currentMusic._id);
        localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
        bookmarkButtonImg.src = 'images/bookmark.svg';
    } else {
        // Sinon, l'ajouter
        bookmarks.push(currentMusic);
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        bookmarkButtonImg.src = 'images/bookmark-fill.svg';
    }

    // Mettre à jour l'état visuel du bouton
    updateBookmarkButton();
});

// Fonction pour charger et afficher les bookmarks (Optionnel pour les prochaines étapes)
const loadBookmarks = () => {
    // Pour l'instant, cette fonction est vide car nous n'avons pas de section pour afficher les bookmarks
    // Tu pourras l'utiliser pour ajouter une fonctionnalité d'affichage des bookmarks plus tard
};
