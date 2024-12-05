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
    const bookmarksCookie = getCookie('bookmarks');
    return bookmarksCookie ? JSON.parse(bookmarksCookie) : [];
};

// Fonction pour sauvegarder les bookmarks dans les cookies (si besoin)
const saveBookmarks = (bookmarks) => {
    setCookie('bookmarks', JSON.stringify(bookmarks), 30);
};

// Fonction pour rendre les bookmarks dans le DOM
const renderBookmarks = () => {
    const bookmarks = getBookmarks();

    // Vider le conteneur avant de réinsérer les musiques
    bookmarksListContainer.innerHTML = '';

    if (bookmarks.length === 0) {
        bookmarksListContainer.innerHTML = '<p>Votre discothèque est vide.</p>';
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

        // Bouton pour retirer le bookmark
        const removeBookmarkButton = document.createElement('button');
        removeBookmarkButton.classList.add('remove-bookmark-button');
        removeBookmarkButton.setAttribute('aria-label', 'Retirer du Bookmark');
        removeBookmarkButton.innerHTML = '<i class="fas fa-trash"></i>';

        // Gestionnaire d'événements pour retirer le bookmark
        removeBookmarkButton.addEventListener('click', () => {
            let bookmarks = getBookmarks();
            bookmarks = bookmarks.filter(m => m._id !== music._id);
            saveBookmarks(bookmarks);
            renderBookmarks(); // Rafraîchir la liste des bookmarks
        });

        // Assembler les éléments
        imageContainer.appendChild(coverImage);
        imageContainer.appendChild(overlayCircle);
        imageContainer.appendChild(rightOverlay);
        rightOverlay.appendChild(playButtonOverlay);
        rightOverlay.appendChild(removeBookmarkButton); // Ajouter le bouton de suppression

        // Ajouter l'imageContainer au musicItem
        musicItem.appendChild(imageContainer);

        // Ajouter le musicItem à la liste
        bookmarksListContainer.appendChild(musicItem);
    });
};

// Charger et afficher les bookmarks au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si les préférences sont définies
    const preferencesSet = getCookie('preferencesSet');
    if (preferencesSet !== 'true') {
        // Rediriger vers preferences.html si les préférences ne sont pas définies
        window.location.href = 'preferences.html';
        return;
    }

    renderBookmarks();
});
