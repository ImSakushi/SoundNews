// script.js

// Inclure les fonctions de gestion des cookies
// Assurez-vous que cookieUtils.js est inclus avant script.js dans votre index.html

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
// Les boutons de catégorie sont maintenant dynamiques, donc on ne les sélectionne plus statiquement
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

// Sélectionner le bouton Bookmark
const bookmarkButton = $('.bookmark-button');

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

// Fonction utilitaire pour s'assurer que category est toujours un tableau
function ensureCategoryArray(category) {
    if (Array.isArray(category)) {
        return category;
    } else if (typeof category === 'string') {
        try {
            const parsed = JSON.parse(category);
            if (Array.isArray(parsed)) {
                return parsed;
            } else {
                console.warn('Parsed category n\'est pas un tableau:', parsed);
                return [category];
            }
        } catch (e) {
            console.error('Erreur de parsing de category:', e);
            return [category];
        }
    } else {
        console.warn('Type inattendu pour category:', typeof category);
        return [];
    }
}

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
    const preferencesSet = getCookie('preferencesSet');
    if (preferencesSet !== 'true') {
        // Rediriger vers preferences.html si les préférences ne sont pas définies
        window.location.href = 'preferences.html';
        return;
    }

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

    // Gestion des animations de fade-in
    const fadeElements = document.querySelectorAll('.fade-in-element');

    // Ajouter la classe 'visible' après un court délai pour déclencher l'animation
    setTimeout(() => {
        fadeElements.forEach(el => el.classList.add('visible'));
    }, 100); // 100ms

    // Ajouter l'écouteur d'événement pour le bookmarkButton ici
    // Just to ensure that the event listener is attached after DOMContentLoaded
    bookmarkButton.addEventListener('click', toggleBookmark);
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
        // Assurer que chaque musique a category comme tableau
        musics.forEach(music => {
            music.category = ensureCategoryArray(music.category);
        });
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
// Fonction pour récupérer les bookmarks depuis localStorage
const getBookmarks = () => {
    const bookmarks = localStorage.getItem('bookmarks');
    if (!bookmarks) return [];
    try {
        const parsed = JSON.parse(bookmarks);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Erreur lors du parsing de localStorage bookmarks:', e);
        return [];
    }
};

// Fonction pour sauvegarder les bookmarks dans localStorage
const saveBookmarks = (bookmarks) => {
    try {
        const bookmarksJSON = JSON.stringify(bookmarks);
        localStorage.setItem('bookmarks', bookmarksJSON);
        console.log('Bookmarks saved:', bookmarks);
    } catch (e) {
        console.error('Erreur lors de la sauvegarde des bookmarks:', e);
    }
};


// Fonction pour mettre à jour le bouton de bookmark


// Fonction pour ajouter/retirer la musique actuelle des bookmarks
const toggleBookmark = () => {
    const currentMusic = musicsList[currentMusicIndex];
    console.log("toggleBookmark() appelé");
    if (!currentMusic) {
        console.log('Pas de musique courante.');
        return;
    }
    console.log(`Musique courante : ${currentMusic.title}, _id : ${currentMusic._id}`);

    let bookmarks = getBookmarks();
    console.log("Bookmarks actuels avant:", bookmarks);

    const index = bookmarks.findIndex(m => m._id === currentMusic._id);
    if (index === -1) {
        console.log("Cette musique n'est pas encore bookmarkée, on l'ajoute.");
        bookmarks.push(currentMusic);
    } else {
        console.log("Cette musique est déjà bookmarkée, on la retire.");
        bookmarks.splice(index, 1);
    }

    saveBookmarks(bookmarks);
    console.log("Bookmarks après:", getBookmarks());

    updateBookmarkButton();
};

const updateBookmarkButton = () => {
    const currentMusic = musicsList[currentMusicIndex];
    if (!currentMusic) {
        console.log('Aucune musique courante pour updateBookmarkButton.');
        return;
    }
    const bookmarks = getBookmarks();
    const isBookmarked = bookmarks.some(m => m._id === currentMusic._id);
    console.log(`updateBookmarkButton() : ${currentMusic.title} est bookmarké ? ${isBookmarked}`);

    bookmarkButtonImg.src = isBookmarked ? 'images/bookmark-fill.svg' : 'images/bookmark.svg';
};

// Dictionnaire des icônes pour les catégories
const categoryIcons = {
    'Politique': 'fa-user-shield',
    'Économie': 'fa-chart-line',
    'Société': 'fa-book-open',
    'Science': 'fa-flask',
    'Sécurité': 'fa-shield-alt',
    'Environnement': 'fa-leaf',
    'Technologie': 'fa-microchip',
    'Santé': 'fa-heartbeat',
    'Culture': 'fa-landmark',
    'Sport': 'fa-football-ball'
};

// Fonction utilitaire pour créer un bouton de catégorie
function createCategoryButton(cat) {
    const button = document.createElement('button');
    button.classList.add('category-button');

    const icon = document.createElement('i');
    const iconClass = categoryIcons[cat] || 'fa-question-circle';
    icon.classList.add('fas', iconClass);

    const textNode = document.createTextNode(' ' + cat);

    button.appendChild(icon);
    button.appendChild(textNode);

    // Ajouter un écouteur d'événement sur le bouton
    button.addEventListener('click', () => {
        alert(`Afficher les nouvelles de la catégorie : ${cat}`);
    });

    console.log(`Created category button for: ${cat}`); // Ajouté pour le débogage

    return button;
}

// Fonction pour définir les détails d'une musique sans jouer
const setMusicDetails = (index) => {
    if (index < 0 || index >= musicsList.length) {
        alert('Index de musique invalide.');
        return;
    }
    const music = musicsList[index];
    
    console.log('Setting details for music:', music); // Log complet de la musique
    console.log('Type de category:', typeof music.category);
    console.log('Category est un tableau:', Array.isArray(music.category));

    // S'assurer que category est un tableau
    music.category = ensureCategoryArray(music.category);
    console.log('Category après assurance:', music.category);

    // Continue avec la mise à jour de l'interface
    centralImage.src = music.coverImage;
    titleElement.innerHTML = `${music.title}<br><p class="date">${new Date(music.createdAt).toLocaleDateString()}</p>`;
    subtitleElement.textContent = music.artist;
    audioElement.src = music.audioUrl;

    // Charger les paroles si disponibles
    if (music.lyrics && music.lyrics.content) {
        loadLyrics(music.lyrics.content);
    } else {
        lyricsContainer.classList.remove('visible');
        lyricsElement.innerHTML = '<p>Aucune parole disponible.</p>';
    }

    // Mettre à jour le bouton de bookmark
    updateBookmarkButton();

    // Génération dynamique des boutons de catégorie
    const categoriesContainer = $('.categories');
    categoriesContainer.innerHTML = ''; // Réinitialiser

    // Limiter à 3 catégories
    const categories = music.category.slice(0, 3);
    const categoriesCount = categories.length;
    
    console.log(`Number of categories for this music: ${categoriesCount}`); // Log du nombre de catégories
    console.log('Categories:', categories); // Log des catégories

    if (categoriesCount === 1) {
        // Une seule catégorie, bouton pleine largeur
        const singleRow = document.createElement('div');
        singleRow.classList.add('category-row');
        const button = createCategoryButton(categories[0]);
        button.classList.add('full-width');
        singleRow.appendChild(button);
        categoriesContainer.appendChild(singleRow);
    } else if (categoriesCount === 2) {
        // Deux catégories, une seule ligne
        const row = document.createElement('div');
        row.classList.add('category-row');
        categories.forEach(cat => {
            const button = createCategoryButton(cat);
            row.appendChild(button);
        });
        categoriesContainer.appendChild(row);
    } else if (categoriesCount === 3) {
        // Trois catégories, 2 sur la première ligne, 1 pleine largeur sur la deuxième
        const row1 = document.createElement('div');
        row1.classList.add('category-row');
        const button1 = createCategoryButton(categories[0]);
        const button2 = createCategoryButton(categories[1]);
        row1.appendChild(button1);
        row1.appendChild(button2);
        categoriesContainer.appendChild(row1);

        const row2 = document.createElement('div');
        row2.classList.add('category-row');
        const button3 = createCategoryButton(categories[2]);
        button3.classList.add('full-width');
        row2.appendChild(button3);
        categoriesContainer.appendChild(row2);
    } else {
        console.warn(`Nombre inattendu de catégories: ${categoriesCount}`); // Log d'avertissement
    }

    // Remise à zéro des icônes Play/Pause
    playButtonOverlay.querySelector('i').classList.replace('fa-pause', 'fa-play');
    playButtonAbsolute.querySelector('i').classList.replace('fa-pause', 'fa-play');
};

// Fonction pour charger une musique par son index sans démarrer la lecture ou modifier l'interface
const loadMusicByIndex = (index) => {
    if (index < 0 || index >= musicsList.length) {
        alert('Index de musique invalide.');
        return;
    }
    console.log('Loading music by index:', index, musicsList[index]); // Ajouté pour le débogage
    setMusicDetails(index);
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

// Les boutons de catégorie sont maintenant dynamiques, donc on ne les gère plus statiquement
// Remove the static category buttons event listeners
/*
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        const category = button.textContent.trim();
        alert(`Afficher les nouvelles de la catégorie : ${category}`);
        // Implémentez le filtrage des musiques par catégorie ici
    });
});
*/

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
    const button = $(selector);
    if (button) {
        button.addEventListener('click', () => {
            if (selector === '.check-button') {
                // Action spécifique pour le bouton "Accepter" (check-button)
                loadNextMusic(); // Charger la musique suivante sans démarrer la lecture
            } else if (selector === '.cross-button') {
                // Action spécifique pour le bouton "Rejeter" (cross-button)
                loadNextMusic(); // Charger la musique suivante sans démarrer la lecture
            } else if (selector === '.back-button') {
                // Action pour le bouton "Retour"
                playPreviousMusic(); // Charger la musique précédente
            }
        });
    }
});
