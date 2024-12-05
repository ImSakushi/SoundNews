// bookmark.js

// Fonction utilitaire pour sélectionner les éléments
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

// Sélectionner les éléments nécessaires
const bookmarksListContainer = $('.bookmarks-list');
const homeButton = $('#home-btn');
const backButton = $('.back-button');

// Gestionnaire d'événements pour le bouton Accueil
homeButton.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Gestionnaire d'événements pour le bouton Retour
backButton.addEventListener('click', () => {
    window.history.back();
});

// Fonction pour obtenir les bookmarks depuis le localStorage
const getBookmarks = () => {
    const bookmarks = localStorage.getItem('bookmarks');
    return bookmarks ? JSON.parse(bookmarks) : [];
};

// Fonction pour rendre les bookmarks dans le DOM
const renderBookmarks = () => {
    const bookmarks = getBookmarks();

    // Vider le conteneur avant de réinsérer les musiques
    bookmarksListContainer.innerHTML = '';

    if (bookmarks.length === 0) {
        bookmarksListContainer.innerHTML = '<p>Aucun bookmark pour le moment.</p>';
        return;
    }

    bookmarks.forEach((music, index) => {
        // Créer l'élément principal pour la musique
        const musicItem = document.createElement('div');
        musicItem.classList.add('music-item'); // Utilise les mêmes styles que dans index.html

        // Image Container
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');

        const coverImage = document.createElement('img');
        coverImage.src = music.coverImage;
        coverImage.alt = `${music.title} Cover`;
        coverImage.classList.add('central-image'); // Réutilise la classe existante

        // Overlay Circle
        const overlayCircle = document.createElement('div');
        overlayCircle.classList.add('overlay-circle', 'black-circle');

        // Right Overlay
        const rightOverlay = document.createElement('div');
        rightOverlay.classList.add('right-overlay', 'bookmark');

        const title = document.createElement('h2');
        title.classList.add('title');
        title.innerHTML = `${music.title}<br><p class="date">${new Date(music.createdAt).toLocaleDateString()}</p>`;

        const subtitle = document.createElement('p');
        subtitle.classList.add('subtitle');
        subtitle.textContent = music.artist;

        rightOverlay.appendChild(title);
        rightOverlay.appendChild(subtitle);

        // Play Button Overlay déplacé dans right-overlay
        const playButtonOverlay = document.createElement('button');
        playButtonOverlay.classList.add('play-button-overlay');
        playButtonOverlay.setAttribute('aria-label', 'Lire l\'actualité');
        playButtonOverlay.innerHTML = '<i class="fas fa-play"></i>';

        // Gestionnaire d'événements pour le bouton Play
        playButtonOverlay.addEventListener('click', () => {
            // Rediriger vers index.html avec le paramètre musicId
            window.location.href = `index.html?musicId=${music._id}`;
        });

        // Assembler les éléments
        imageContainer.appendChild(coverImage);
        imageContainer.appendChild(overlayCircle);
        imageContainer.appendChild(rightOverlay);
        rightOverlay.appendChild(playButtonOverlay); // Déplacer le bouton Play dans right-overlay

        // Ajouter l'imageContainer au musicItem
        musicItem.appendChild(imageContainer);

        // Ajouter le musicItem à la liste
        bookmarksListContainer.appendChild(musicItem);
    });
};

// Charger et afficher les bookmarks au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    renderBookmarks();
});
